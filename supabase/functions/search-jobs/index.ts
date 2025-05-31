
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query = '', location = '', keywords = '', remote = true, page = 1, num_pages = 1 } = await req.json()

    // Get the RAPIDAPI_KEY from Supabase secrets
    const rapidApiKey = Deno.env.get('RAPIDAPI_KEY')
    if (!rapidApiKey) {
      throw new Error('RAPIDAPI_KEY not found in environment variables')
    }

    let allJobs = []

    try {
      // Build search query for JSearch - combine query, keywords, and location
      let searchQuery = ''
      
      // Add job title/query if provided
      if (query) {
        searchQuery += query
      }
      
      // Add keywords if provided
      if (keywords) {
        searchQuery += (searchQuery ? ' ' : '') + keywords
      }
      
      // Add location if provided
      if (location) {
        searchQuery += (searchQuery ? ' in ' : '') + location
      }
      
      // Default to "ai product manager in united states" if no search terms provided
      if (!searchQuery) {
        searchQuery = 'ai product manager in united states'
      }
      
      const jsearchUrl = new URL('https://jsearch.p.rapidapi.com/search')
      jsearchUrl.searchParams.append('query', searchQuery)
      jsearchUrl.searchParams.append('page', page.toString())
      jsearchUrl.searchParams.append('num_pages', num_pages.toString())
      jsearchUrl.searchParams.append('country', 'us')
      jsearchUrl.searchParams.append('date_posted', '3days') // Only recent jobs
      
      // Add work_from_home parameter based on remote filter
      if (remote) {
        jsearchUrl.searchParams.append('work_from_home', 'true')
      }

      console.log('Searching JSearch with query:', searchQuery)
      
      // Log the complete payload being sent to JSearch
      console.log('JSearch API payload:', {
        url: jsearchUrl.toString(),
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': '***HIDDEN***',
          'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
        },
        searchParams: Object.fromEntries(jsearchUrl.searchParams)
      })

      const jsearchResponse = await fetch(jsearchUrl.toString(), {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
        }
      })

      if (jsearchResponse.ok) {
        const jsearchData = await jsearchResponse.json()
        console.log('JSearch response status:', jsearchData.status)
        
        // Log the complete response from JSearch
        console.log('JSearch API response:', {
          status: jsearchData.status,
          request_id: jsearchData.request_id,
          parameters: jsearchData.parameters,
          data_count: jsearchData.data ? jsearchData.data.length : 0,
          num_pages: jsearchData.num_pages,
          first_job_sample: jsearchData.data && jsearchData.data.length > 0 ? {
            job_id: jsearchData.data[0].job_id,
            job_title: jsearchData.data[0].job_title,
            employer_name: jsearchData.data[0].employer_name,
            job_posted_at_datetime_utc: jsearchData.data[0].job_posted_at_datetime_utc
          } : null
        })
        
        if (jsearchData.status === 'OK' && jsearchData.data) {
          // Add source identifier to each job
          const jsearchJobs = jsearchData.data.map((job: any) => ({
            ...job,
            source: 'jsearch'
          }))
          allJobs.push(...jsearchJobs)
          console.log('Added', jsearchJobs.length, 'jobs from JSearch')
        }
      } else {
        console.error('JSearch API error:', jsearchResponse.status, jsearchResponse.statusText)
      }
    } catch (error) {
      console.error('JSearch API error:', error)
    }

    console.log('Total jobs found:', allJobs.length)
    
    return new Response(
      JSON.stringify({
        status: 'OK',
        request_id: `jsearch_${Date.now()}`,
        parameters: { query, location, keywords, remote, page },
        data: allJobs,
        num_pages: 1
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      },
    )
  } catch (error) {
    console.error('Error in search-jobs function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        status: 'error' 
      }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      },
    )
  }
})
