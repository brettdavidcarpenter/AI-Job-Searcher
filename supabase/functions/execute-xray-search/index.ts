
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query } = await req.json()

    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Query parameter is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const serpApiKey = Deno.env.get('SERPAPI_KEY')
    
    if (!serpApiKey) {
      return new Response(
        JSON.stringify({ error: 'SERPAPI_KEY not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Use SerpApi directly for Google job searches
    const serpApiUrl = 'https://serpapi.com/search.json'
    
    // Remove automatic date filtering from query - let SerpApi handle it
    const cleanQuery = query.replace(/after:\d{4}-\d{2}-\d{2}/, '').trim()
    
    const params = new URLSearchParams({
      engine: 'google_jobs',
      q: cleanQuery,
      api_key: serpApiKey,
      chips: 'date_posted:today', // Use SerpApi's date filtering
      num: '10' // Limit results
    })

    console.log('Calling SerpApi with query:', cleanQuery)
    console.log('Full URL:', `${serpApiUrl}?${params}`)

    const response = await fetch(`${serpApiUrl}?${params}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; JobSearchBot/1.0)'
      }
    })

    console.log('SerpApi response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('SerpApi error response:', errorText)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to execute search',
          details: errorText,
          status: response.status
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const data = await response.json()
    console.log('SerpApi response keys:', Object.keys(data))
    console.log('Jobs results count:', data.jobs_results?.length || 0)
    
    // Log first job for debugging
    if (data.jobs_results && data.jobs_results.length > 0) {
      console.log('First job sample:', JSON.stringify(data.jobs_results[0], null, 2))
    }
    
    return new Response(
      JSON.stringify(data),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
