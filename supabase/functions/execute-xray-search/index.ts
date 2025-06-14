
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

    console.log('Original X-ray query:', query)

    // Convert X-ray query to Google Jobs compatible format
    let processedQuery = query

    // Extract job title from quotes
    const titleMatch = processedQuery.match(/"([^"]+)"/g)
    let jobTitle = ''
    if (titleMatch) {
      jobTitle = titleMatch[titleMatch.length - 1].replace(/"/g, '') // Get last quoted term
      console.log('Extracted job title:', jobTitle)
    }

    // Extract keywords (ai, ml, data science, etc.)
    const keywordMatches = processedQuery.match(/\((data|ml|"machine learning"|ai|"artificial intelligence")[^)]*\)/gi)
    let keywords = ''
    if (keywordMatches) {
      keywords = keywordMatches[0]
        .replace(/[()]/g, '')
        .replace(/OR/gi, ' ')
        .replace(/"/g, '')
        .replace(/\s+/g, ' ')
        .trim()
      console.log('Extracted keywords:', keywords)
    }

    // Check for remote work indicators
    const isRemote = /remote|"work from home"|work-from-home|telecommute/i.test(processedQuery)
    console.log('Remote work detected:', isRemote)

    // Build a simplified query for Google Jobs
    let simpleQuery = ''
    if (jobTitle) {
      simpleQuery = jobTitle
    }
    if (keywords) {
      simpleQuery += (simpleQuery ? ' ' : '') + keywords
    }
    
    // If we couldn't extract anything meaningful, use original query but simplified
    if (!simpleQuery) {
      simpleQuery = processedQuery
        .replace(/site:[^\s)]+/gi, '') // Remove site operators
        .replace(/\([^)]*\)/g, ' ') // Remove parentheses groups
        .replace(/OR/gi, ' ')
        .replace(/"/g, '')
        .replace(/\s+/g, ' ')
        .trim()
    }

    console.log('Processed query for SerpApi:', simpleQuery)

    const serpApiUrl = 'https://serpapi.com/search.json'
    const params = new URLSearchParams({
      engine: 'google_jobs',
      q: simpleQuery,
      api_key: serpApiKey,
      chips: 'date_posted:today',
      num: '20' // Increase results
    })

    // Add location if remote work is detected
    if (isRemote) {
      params.append('location', 'United States')
      params.append('remote_jobs_only', 'true')
    }

    console.log('SerpApi URL:', `${serpApiUrl}?${params}`)

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
    
    // Log search metadata
    if (data.search_information) {
      console.log('Search information:', data.search_information)
    }
    
    // Log first job for debugging
    if (data.jobs_results && data.jobs_results.length > 0) {
      console.log('First job sample:', JSON.stringify(data.jobs_results[0], null, 2))
    } else if (data.error) {
      console.log('SerpApi returned error:', data.error)
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
