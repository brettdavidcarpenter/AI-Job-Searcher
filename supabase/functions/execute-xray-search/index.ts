
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
    const params = new URLSearchParams({
      engine: 'google_jobs',
      q: query,
      api_key: serpApiKey
    })

    console.log('Calling SerpApi directly with query:', query)

    const response = await fetch(`${serpApiUrl}?${params}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; JobSearchBot/1.0)'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('SerpApi error:', errorText)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to execute search',
          details: errorText 
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const data = await response.json()
    
    return new Response(
      JSON.stringify(data),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
