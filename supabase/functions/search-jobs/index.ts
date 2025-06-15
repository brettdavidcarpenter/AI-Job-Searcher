
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Static fallback jobs as last resort
const STATIC_FALLBACK_JOBS = [
  {
    job_id: "fallback_1",
    job_title: "Senior AI Product Manager",
    employer_name: "TechCorp",
    job_city: "San Francisco",
    job_state: "CA",
    job_country: "US",
    job_description: "Lead AI product development initiatives and drive innovation in machine learning applications. Work with cross-functional teams to deliver cutting-edge AI solutions.",
    job_employment_type: "Full-time",
    job_posted_at_datetime_utc: "2024-12-01T08:00:00Z",
    job_salary_currency: "USD",
    job_min_salary: 150000,
    job_max_salary: 200000,
    job_apply_link: "https://example.com/apply",
    source: "fallback"
  },
  {
    job_id: "fallback_2",
    job_title: "AI/ML Product Manager",
    employer_name: "Innovation Labs",
    job_city: "New York",
    job_state: "NY", 
    job_country: "US",
    job_description: "Drive product strategy for AI-powered applications. Collaborate with engineering and data science teams to build scalable ML products.",
    job_employment_type: "Full-time",
    job_posted_at_datetime_utc: "2024-12-02T10:00:00Z",
    job_salary_currency: "USD",
    job_min_salary: 140000,
    job_max_salary: 180000,
    job_apply_link: "https://example.com/apply",
    source: "fallback"
  },
  {
    job_id: "fallback_3",
    job_title: "Product Manager - Artificial Intelligence",
    employer_name: "AI Startup",
    job_city: "Austin",
    job_state: "TX",
    job_country: "US", 
    job_description: "Own the product roadmap for AI features and capabilities. Partner with stakeholders to define requirements and deliver customer value through AI.",
    job_employment_type: "Full-time",
    job_posted_at_datetime_utc: "2024-12-03T14:00:00Z",
    job_salary_currency: "USD",
    job_min_salary: 130000,
    job_max_salary: 170000,
    job_apply_link: "https://example.com/apply",
    source: "fallback"
  }
];

// API Key Management System
interface ApiKeyHealth {
  key_name: string;
  last_success?: string;
  last_failure?: string;
  consecutive_failures: number;
  rate_limited_until?: string;
  total_requests_today: number;
  success_rate: number;
}

async function getApiKeyHealth(supabase: any, keyName: string): Promise<ApiKeyHealth | null> {
  const { data, error } = await supabase
    .from('api_key_health')
    .select('*')
    .eq('key_name', keyName)
    .maybeSingle();

  if (error) {
    console.error('Error fetching API key health:', error);
    return null;
  }

  return data;
}

async function updateApiKeyHealth(supabase: any, keyName: string, success: boolean, rateLimited = false) {
  const now = new Date().toISOString();
  const today = new Date().toISOString().split('T')[0];

  try {
    // Get current health record
    const currentHealth = await getApiKeyHealth(supabase, keyName);
    
    let updateData: any = {
      updated_at: now,
    };

    if (success) {
      updateData.last_success = now;
      updateData.consecutive_failures = 0;
      updateData.rate_limited_until = null;
    } else {
      updateData.last_failure = now;
      updateData.consecutive_failures = (currentHealth?.consecutive_failures || 0) + 1;
      
      if (rateLimited) {
        // Rate limits typically last 15-60 minutes, we'll estimate 30 minutes
        const rateLimitExpiry = new Date(Date.now() + 30 * 60 * 1000).toISOString();
        updateData.rate_limited_until = rateLimitExpiry;
      }
    }

    // Increment daily request count
    const dailyCount = currentHealth?.total_requests_today || 0;
    const lastUpdate = currentHealth?.updated_at ? new Date(currentHealth.updated_at).toISOString().split('T')[0] : null;
    
    if (lastUpdate !== today) {
      // Reset daily count for new day
      updateData.total_requests_today = 1;
    } else {
      updateData.total_requests_today = dailyCount + 1;
    }

    // Calculate success rate (simple approximation)
    if (currentHealth) {
      const totalRequests = updateData.total_requests_today;
      const failures = success ? currentHealth.consecutive_failures : updateData.consecutive_failures;
      updateData.success_rate = Math.max(0, ((totalRequests - failures) / totalRequests) * 100);
    }

    // Upsert the health record
    await supabase
      .from('api_key_health')
      .upsert({
        key_name: keyName,
        ...updateData
      });

  } catch (error) {
    console.error('Error updating API key health:', error);
  }
}

function isKeyAvailable(health: ApiKeyHealth | null): boolean {
  if (!health) return true; // New key, assume available
  
  // Check if rate limited
  if (health.rate_limited_until) {
    const rateLimitExpiry = new Date(health.rate_limited_until);
    if (new Date() < rateLimitExpiry) {
      return false;
    }
  }

  // Check consecutive failures (more than 5 failures = temporarily unavailable)
  if (health.consecutive_failures >= 5) {
    return false;
  }

  return true;
}

async function selectBestApiKey(supabase: any): Promise<{ key: string | null, keyName: string }> {
  const rapidApiKey1 = Deno.env.get('RAPIDAPI_KEY');
  const rapidApiKey2 = Deno.env.get('RAPIDAPI_KEY_2');

  if (!rapidApiKey1 && !rapidApiKey2) {
    console.error('No RAPIDAPI keys found in environment variables');
    return { key: null, keyName: 'none' };
  }

  // Get health status for both keys
  const key1Health = rapidApiKey1 ? await getApiKeyHealth(supabase, 'RAPIDAPI_KEY') : null;
  const key2Health = rapidApiKey2 ? await getApiKeyHealth(supabase, 'RAPIDAPI_KEY_2') : null;

  const key1Available = rapidApiKey1 && isKeyAvailable(key1Health);
  const key2Available = rapidApiKey2 && isKeyAvailable(key2Health);

  console.log('API Key availability:', { 
    key1Available, 
    key2Available,
    key1Failures: key1Health?.consecutive_failures || 0,
    key2Failures: key2Health?.consecutive_failures || 0
  });

  // Selection logic: prefer key with better health
  if (key1Available && key2Available) {
    // Both available, choose the one with better health
    const key1Score = (key1Health?.success_rate || 100) - (key1Health?.consecutive_failures || 0);
    const key2Score = (key2Health?.success_rate || 100) - (key2Health?.consecutive_failures || 0);
    
    if (key2Score > key1Score) {
      return { key: rapidApiKey2, keyName: 'RAPIDAPI_KEY_2' };
    } else {
      return { key: rapidApiKey1, keyName: 'RAPIDAPI_KEY' };
    }
  } else if (key1Available) {
    return { key: rapidApiKey1, keyName: 'RAPIDAPI_KEY' };
  } else if (key2Available) {
    return { key: rapidApiKey2, keyName: 'RAPIDAPI_KEY_2' };
  } else {
    console.error('No API keys available - all rate limited or failed');
    return { key: null, keyName: 'none' };
  }
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
          cached_at: cachedResult.cached_at,
          fallback_level: 'cache'
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    // Select the best API key using smart selection
    const { key: rapidApiKey, keyName } = await selectBestApiKey(supabase);
    
    if (!rapidApiKey) {
      console.error('No API keys available')
      return await handleApiFallback(supabase, searchParams, 'no_keys_available')
    }

    let allJobs = []
    let apiSuccess = false
    const requestStartTime = Date.now()

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

      console.log(`Calling JSearch API with key: ${keyName}, query:`, searchQuery)

      const jsearchResponse = await fetch(jsearchUrl.toString(), {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
        }
      })

      const requestDuration = Date.now() - requestStartTime
      console.log(`JSearch response status: ${jsearchResponse.status}, duration: ${requestDuration}ms`)

      if (jsearchResponse.status === 429) {
        console.log(`Rate limit reached for ${keyName}`)
        await updateApiKeyHealth(supabase, keyName, false, true)
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
          
          // Update key health on success
          await updateApiKeyHealth(supabase, keyName, true)
        }
      } else {
        console.error(`JSearch API error: ${jsearchResponse.status} ${jsearchResponse.statusText}`)
        await updateApiKeyHealth(supabase, keyName, false, false)
      }
    } catch (error) {
      console.error(`JSearch API error with ${keyName}:`, error)
      await updateApiKeyHealth(supabase, keyName, false, false)
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
      source: 'jsearch',
      fallback_level: 'live',
      api_key_used: keyName
    }

    // Store as last successful search (fire and forget)
    try {
      await supabase
        .from('last_successful_search')
        .insert({
          search_results: response,
          search_params: searchParams,
          result_count: allJobs.length
        })
      
      // Cleanup old entries
      await supabase.rpc('cleanup_last_successful_search')
      console.log('Stored as last successful search')
    } catch (error) {
      console.error('Failed to store last successful search:', error)
    }

    // Cache the successful result (fire and forget)
    try {
      const requestDuration = Date.now() - requestStartTime
      await supabase
        .from('cached_job_searches')
        .upsert({
          search_params_hash: searchHash,
          search_params: searchParams,
          results: response,
          result_count: allJobs.length,
          search_source: 'api',
          api_key_used: keyName,
          request_duration_ms: requestDuration,
          expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString() // 6 hours from now
        })
      console.log('Results cached successfully')
    } catch (cacheError) {
      console.error('Failed to cache results:', cacheError)
    }

    console.log(`Returning fresh results: ${allJobs.length} jobs using ${keyName}`)
    
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
        fallback_level: 'error'
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

// Handle API fallback scenarios with hierarchical strategy
async function handleApiFallback(supabase: any, searchParams: any, reason: string = 'unknown') {
  console.log(`Using fallback due to: ${reason}`)
  
  try {
    // Strategy 1: Try to get expired cache for this specific search
    const searchHash = createSearchHash(searchParams)
    const { data: expiredCache } = await supabase
      .from('cached_job_searches')
      .select('*')
      .eq('search_params_hash', searchHash)
      .order('cached_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (expiredCache && expiredCache.results?.data?.length > 0) {
      console.log('Using expired cache for specific search')
      const cacheAge = Math.floor((new Date().getTime() - new Date(expiredCache.cached_at).getTime()) / (1000 * 60 * 60))
      
      return new Response(
        JSON.stringify({
          ...expiredCache.results,
          cached: true,
          cached_at: expiredCache.cached_at,
          fallback_level: 'expired_cache',
          cache_age_hours: cacheAge,
          message: `Showing cached results from ${cacheAge} hours ago due to ${getFriendlyErrorMessage(reason)}.`
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    // Strategy 2: Get most recent successful search globally
    const { data: recentSearch } = await supabase
      .from('last_successful_search')
      .select('*')
      .order('cached_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (recentSearch && recentSearch.search_results?.data?.length > 0) {
      console.log('Using most recent successful search')
      const cacheAge = Math.floor((new Date().getTime() - new Date(recentSearch.cached_at).getTime()) / (1000 * 60 * 60))
      
      return new Response(
        JSON.stringify({
          ...recentSearch.search_results,
          cached: true,
          cached_at: recentSearch.cached_at,
          fallback_level: 'recent_global',
          cache_age_hours: cacheAge,
          message: `Showing recent AI jobs from ${cacheAge} hours ago due to ${getFriendlyErrorMessage(reason)}.`
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    // Strategy 3: Use static fallback jobs as last resort
    const response = {
      status: 'OK',
      request_id: `fallback_${Date.now()}`,
      parameters: searchParams,
      data: STATIC_FALLBACK_JOBS,
      num_pages: 1,
      source: 'fallback',
      fallback_level: 'static',
      fallback_reason: reason,
      message: `${getFriendlyErrorMessage(reason)} Showing curated AI jobs instead.`
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
        fallback_level: 'error'
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

// Helper function to get user-friendly error messages
function getFriendlyErrorMessage(reason: string): string {
  switch (reason) {
    case 'rate_limit':
      return 'API rate limit reached.'
    case 'api_error':
      return 'Job search service temporarily unavailable.'
    case 'no_keys_available':
      return 'All API keys are currently rate limited.'
    default:
      return 'Search service temporarily unavailable.'
  }
}
