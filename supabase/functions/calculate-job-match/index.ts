
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
    const { resumeText, jobTitle, jobDescription, company, jobType } = await req.json()

    // Call OpenAI API
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert resume-job matching analyst. Analyze the compatibility between a resume and job posting, then provide a detailed scoring breakdown.

Return a JSON object with this exact structure:
{
  "overall_score": <number 0-100>,
  "skills_score": <number 0-100>,
  "experience_score": <number 0-100>,
  "education_score": <number 0-100>,
  "requirements_score": <number 0-100>,
  "breakdown": {
    "strengths": ["<strength 1>", "<strength 2>", ...],
    "gaps": ["<gap 1>", "<gap 2>", ...],
    "recommendations": ["<recommendation 1>", "<recommendation 2>", ...]
  }
}

Scoring criteria:
- Skills: Match between candidate skills and required/preferred skills
- Experience: Relevance and level of experience vs job requirements
- Education: Educational background alignment with job requirements
- Requirements: How well the candidate meets must-have qualifications
- Overall: Weighted average considering all factors

Provide 3-5 items in each breakdown category. Be specific and actionable.`
          },
          {
            role: 'user',
            content: `Please analyze this resume against the job posting:

RESUME:
${resumeText}

JOB POSTING:
Title: ${jobTitle}
Company: ${company}
Type: ${jobType}
Description: ${jobDescription}`
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    })

    if (!openAIResponse.ok) {
      throw new Error(`OpenAI API error: ${openAIResponse.statusText}`)
    }

    const openAIData = await openAIResponse.json()
    let content = openAIData.choices[0].message.content

    // Clean up the content - remove markdown code blocks if present
    content = content.trim()
    if (content.startsWith('```json')) {
      content = content.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (content.startsWith('```')) {
      content = content.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }

    // Parse the JSON response
    let matchScore
    try {
      matchScore = JSON.parse(content)
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', content)
      throw new Error('Invalid response format from AI')
    }

    // Validate the response structure
    if (typeof matchScore.overall_score !== 'number' || 
        matchScore.overall_score < 0 || 
        matchScore.overall_score > 100) {
      throw new Error('Invalid overall_score in AI response')
    }

    return new Response(
      JSON.stringify(matchScore),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error in calculate-job-match function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})
