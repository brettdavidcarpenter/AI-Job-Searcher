
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
    const { query = '', location = '', page = 1, num_pages = 1, source = 'all' } = await req.json()

    // Get the RAPIDAPI_KEY from Supabase secrets
    const rapidApiKey = Deno.env.get('RAPIDAPI_KEY')
    if (!rapidApiKey) {
      throw new Error('RAPIDAPI_KEY not found in environment variables')
    }

    let allJobs = []

    // Search JSearch API if source is 'jsearch' or 'all'
    if (source === 'jsearch' || source === 'all') {
      try {
        let searchQuery = query
        if (location) {
          searchQuery = `${query} in ${location}`.trim()
        }
        
        const jsearchUrl = new URL('https://jsearch.p.rapidapi.com/search')
        jsearchUrl.searchParams.append('query', searchQuery || 'software engineer')
        jsearchUrl.searchParams.append('page', page.toString())
        jsearchUrl.searchParams.append('num_pages', '1')

        console.log('Searching JSearch with query:', searchQuery)

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
    }

    // Search LinkedIn API if source is 'linkedin' or 'all'
    if (source === 'linkedin' || source === 'all') {
      try {
        const linkedinUrl = new URL('https://linkedin-job-search-api.p.rapidapi.com/jobs')
        
        // Use proper query parameters for LinkedIn API
        if (query) {
          linkedinUrl.searchParams.append('query', query)
        }
        if (location) {
          linkedinUrl.searchParams.append('location', location)
        }
        linkedinUrl.searchParams.append('page', page.toString())

        console.log('Searching LinkedIn with query:', query, 'location:', location)
        console.log('LinkedIn URL:', linkedinUrl.toString())

        const linkedinResponse = await fetch(linkedinUrl.toString(), {
          method: 'GET',
          headers: {
            'X-RapidAPI-Key': rapidApiKey,
            'X-RapidAPI-Host': 'linkedin-job-search-api.p.rapidapi.com'
          }
        })

        console.log('LinkedIn response status:', linkedinResponse.status)
        
        if (linkedinResponse.ok) {
          const linkedinData = await linkedinResponse.json()
          console.log('LinkedIn response data:', JSON.stringify(linkedinData, null, 2))
          
          // Handle different possible response structures
          let linkedinJobs = []
          
          if (linkedinData.jobs && Array.isArray(linkedinData.jobs)) {
            linkedinJobs = linkedinData.jobs
          } else if (linkedinData.data && Array.isArray(linkedinData.data)) {
            linkedinJobs = linkedinData.data
          } else if (Array.isArray(linkedinData)) {
            linkedinJobs = linkedinData
          }
          
          if (linkedinJobs.length > 0) {
            // Convert LinkedIn format to JSearch-like format for consistency
            const convertedJobs = linkedinJobs.map((job: any, index: number) => ({
              job_id: job.id || job.job_id || `linkedin_${Date.now()}_${index}`,
              job_title: job.title || job.job_title || job.name || 'No title',
              employer_name: job.company || job.employer_name || job.company_name || 'Unknown Company',
              job_city: job.location?.split(',')[0] || job.city || '',
              job_state: job.location?.split(',')[1]?.trim() || job.state || '',
              job_country: job.location?.split(',')[2]?.trim() || job.country || 'United States',
              job_description: job.description || job.job_description || job.summary || '',
              job_employment_type: job.employment_type || job.job_type || job.type || 'Full-time',
              job_posted_at_datetime_utc: job.posted_at || job.posted_date || job.date || new Date().toISOString(),
              job_apply_link: job.apply_link || job.apply_url || job.url || job.link || '',
              job_min_salary: job.salary_min || job.min_salary,
              job_max_salary: job.salary_max || job.max_salary,
              job_salary_currency: job.salary_currency || 'USD',
              source: 'linkedin'
            }))
            
            allJobs.push(...convertedJobs)
            console.log('Added', convertedJobs.length, 'jobs from LinkedIn')
          } else {
            console.log('No jobs found in LinkedIn response')
          }
        } else {
          const errorText = await linkedinResponse.text()
          console.error('LinkedIn API error:', linkedinResponse.status, linkedinResponse.statusText, errorText)
        }
      } catch (error) {
        console.error('LinkedIn API error:', error)
      }
    }

    // Limit to 25 jobs maximum to respect API limits
    const limitedJobs = allJobs.slice(0, 25)
    
    console.log('Total jobs found:', allJobs.length, 'returning:', limitedJobs.length)
    
    return new Response(
      JSON.stringify({
        status: 'OK',
        request_id: `multi_search_${Date.now()}`,
        parameters: { query, location, page, source },
        data: limitedJobs,
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
