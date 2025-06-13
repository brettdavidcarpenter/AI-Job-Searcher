
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to create a hash of search parameters
function createSearchHash(params: any): string {
  const normalized = {
    query: params.query || '',
    location: params.location || '',
    keywords: params.keywords || '',
    remote: params.remote || false
  };
  return btoa(JSON.stringify(normalized)).replace(/[^a-zA-Z0-9]/g, '');
}

// Helper function to check if cache is expired
function isCacheExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query = '', location = '', keywords = '', remote = true, page = 1, num_pages = 1 } = await req.json()

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Create search parameters hash for caching
    const searchParams = { query, location, keywords, remote }
    const searchHash = createSearchHash(searchParams)

    console.log('Search request:', { searchParams, searchHash, page })

    // First, check cache for existing results
    const { data: cachedResult, error: cacheError } = await supabase
      .from('cached_job_searches')
      .select('*')
      .eq('search_params_hash', searchHash)
      .maybeSingle()

    if (cachedResult && !isCacheExpired(cachedResult.expires_at)) {
      console.log('Returning cached results')
      return new Response(
        JSON.stringify({
          ...cachedResult.results,
          cached: true,
          cached_at: cachedResult.cached_at
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    // Get the RAPIDAPI_KEY from Supabase secrets
    const rapidApiKey = Deno.env.get('RAPIDAPI_KEY')
    if (!rapidApiKey) {
      console.error('RAPIDAPI_KEY not found in environment variables')
      return await handleApiFallback(supabase, searchParams)
    }

    let allJobs = []
    let apiSuccess = false

    try {
      // Build search query for JSearch
      let searchQuery = ''
      
      if (query) {
        searchQuery += query
      }
      
      if (keywords) {
        searchQuery += (searchQuery ? ' ' : '') + keywords
      }
      
      if (location) {
        searchQuery += (searchQuery ? ' in ' : '') + location
      }
      
      if (!searchQuery) {
        searchQuery = 'ai product manager in united states'
      }
      
      const jsearchUrl = new URL('https://jsearch.p.rapidapi.com/search')
      jsearchUrl.searchParams.append('query', searchQuery)
      jsearchUrl.searchParams.append('page', page.toString())
      jsearchUrl.searchParams.append('num_pages', num_pages.toString())
      jsearchUrl.searchParams.append('country', 'us')
      jsearchUrl.searchParams.append('date_posted', '3days')
      
      if (remote) {
        jsearchUrl.searchParams.append('work_from_home', 'true')
      }

      console.log('Calling JSearch API with query:', searchQuery)

      const jsearchResponse = await fetch(jsearchUrl.toString(), {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
        }
      })

      console.log('JSearch response status:', jsearchResponse.status)

      if (jsearchResponse.status === 429) {
        console.log('Rate limit reached for JSearch API')
        return await handleApiFallback(supabase, searchParams, 'rate_limit')
      }

      if (jsearchResponse.ok) {
        const jsearchData = await jsearchResponse.json()
        console.log('JSearch response:', { status: jsearchData.status, dataCount: jsearchData.data?.length })
        
        if (jsearchData.status === 'OK' && jsearchData.data) {
          const jsearchJobs = jsearchData.data.map((job: any) => ({
            ...job,
            source: 'jsearch'
          }))
          allJobs.push(...jsearchJobs)
          apiSuccess = true
        }
      } else {
        console.error('JSearch API error:', jsearchResponse.status, jsearchResponse.statusText)
      }
    } catch (error) {
      console.error('JSearch API error:', error)
    }

    // If API call failed, use fallback
    if (!apiSuccess) {
      return await handleApiFallback(supabase, searchParams, 'api_error')
    }

    // Prepare successful response
    const response = {
      status: 'OK',
      request_id: `jsearch_${Date.now()}`,
      parameters: searchParams,
      data: allJobs,
      num_pages: 1,
      source: 'jsearch'
    }

    // Cache the successful result (fire and forget)
    try {
      await supabase
        .from('cached_job_searches')
        .upsert({
          search_params_hash: searchHash,
          search_params: searchParams,
          results: response,
          expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString() // 6 hours from now
        })
      console.log('Results cached successfully')
    } catch (cacheError) {
      console.error('Failed to cache results:', cacheError)
    }

    console.log('Returning fresh results:', allJobs.length, 'jobs')
    
    return new Response(
      JSON.stringify(response),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (error) {
    console.error('Error in search-jobs function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        status: 'error',
        fallback: true
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})

// Handle API fallback scenarios
async function handleApiFallback(supabase: any, searchParams: any, reason: string = 'unknown') {
  console.log(`Using fallback due to: ${reason}`)
  
  try {
    // Get fallback jobs from database
    const { data: fallbackJobs, error: fallbackError } = await supabase
      .from('fallback_jobs')
      .select('job_data')
      .eq('is_active', true)
      .limit(10)

    if (fallbackError) {
      console.error('Error fetching fallback jobs:', fallbackError)
    }

    const jobs = fallbackJobs?.map(item => item.job_data) || []

    const response = {
      status: 'OK',
      request_id: `fallback_${Date.now()}`,
      parameters: searchParams,
      data: jobs,
      num_pages: 1,
      source: 'fallback',
      fallback_reason: reason,
      message: reason === 'rate_limit' 
        ? 'API rate limit reached. Showing curated AI jobs instead.' 
        : 'API temporarily unavailable. Showing curated AI jobs instead.'
    }

    return new Response(
      JSON.stringify(response),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (error) {
    console.error('Fallback error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Service temporarily unavailable',
        status: 'error',
        fallback: true
      }),
      { 
        status: 503,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
}
