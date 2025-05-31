
import { supabase } from "@/integrations/supabase/client";
import type { Job } from "@/pages/Index";

export interface MatchScore {
  overall_score: number;
  skills_score?: number;
  experience_score?: number;
  education_score?: number;
  requirements_score?: number;
  breakdown: {
    strengths: string[];
    gaps: string[];
    recommendations: string[];
  };
}

const parseBreakdown = (breakdown: any): { strengths: string[]; gaps: string[]; recommendations: string[]; } => {
  if (!breakdown || typeof breakdown !== 'object') {
    return { strengths: [], gaps: [], recommendations: [] };
  }
  
  return {
    strengths: Array.isArray(breakdown.strengths) ? breakdown.strengths : [],
    gaps: Array.isArray(breakdown.gaps) ? breakdown.gaps : [],
    recommendations: Array.isArray(breakdown.recommendations) ? breakdown.recommendations : []
  };
};

export const calculateJobMatch = async (job: Job, resumeId: string): Promise<MatchScore> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User must be authenticated to calculate job matches');
  }

  // Get resume content
  const { data: resume, error: resumeError } = await supabase
    .from('user_resumes')
    .select('extracted_text')
    .eq('id', resumeId)
    .eq('user_id', user.id)
    .single();

  if (resumeError || !resume?.extracted_text) {
    throw new Error('Resume content not found or not extracted');
  }

  // Check if we already have a cached score
  const { data: existingScore } = await supabase
    .from('job_match_scores')
    .select('*')
    .eq('user_id', user.id)
    .eq('resume_id', resumeId)
    .eq('job_id', job.id)
    .maybeSingle();

  if (existingScore) {
    return {
      overall_score: existingScore.overall_score,
      skills_score: existingScore.skills_score || undefined,
      experience_score: existingScore.experience_score || undefined,
      education_score: existingScore.education_score || undefined,
      requirements_score: existingScore.requirements_score || undefined,
      breakdown: parseBreakdown(existingScore.breakdown)
    };
  }

  // Call the edge function to calculate the match
  const { data, error } = await supabase.functions.invoke('calculate-job-match', {
    body: {
      resumeText: resume.extracted_text,
      jobTitle: job.title,
      jobDescription: job.description,
      company: job.company,
      jobType: job.type
    }
  });

  if (error) {
    console.error('Error calculating job match:', error);
    throw error;
  }

  const matchScore: MatchScore = data;

  // Cache the result
  await supabase
    .from('job_match_scores')
    .insert({
      user_id: user.id,
      resume_id: resumeId,
      job_id: job.id,
      overall_score: matchScore.overall_score,
      skills_score: matchScore.skills_score,
      experience_score: matchScore.experience_score,
      education_score: matchScore.education_score,
      requirements_score: matchScore.requirements_score,
      breakdown: matchScore.breakdown
    });

  return matchScore;
};

export const getJobMatchScore = async (jobId: string, resumeId: string): Promise<MatchScore | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }

  const { data } = await supabase
    .from('job_match_scores')
    .select('*')
    .eq('user_id', user.id)
    .eq('resume_id', resumeId)
    .eq('job_id', jobId)
    .maybeSingle();

  if (!data) {
    return null;
  }

  return {
    overall_score: data.overall_score,
    skills_score: data.skills_score || undefined,
    experience_score: data.experience_score || undefined,
    education_score: data.education_score || undefined,
    requirements_score: data.requirements_score || undefined,
    breakdown: parseBreakdown(data.breakdown)
  };
};
