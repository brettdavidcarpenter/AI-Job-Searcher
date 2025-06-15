
import { supabase } from "@/integrations/supabase/client";
import type { Job } from "@/pages/Index";

export const saveBdJob = async (job: Job, sourceType: 'manual' | 'xray' = 'manual') => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User must be authenticated to save jobs');
  }

  const { data, error } = await supabase
    .from('saved_jobs')
    .insert({
      user_id: user.id,
      job_id: job.id,
      job_title: job.title,
      company: job.company,
      location: job.location,
      salary: job.salary,
      description: job.description,
      job_type: job.type,
      posted_date: job.postedDate,
      apply_link: job.applyLink,
      source: job.source,
      source_type: sourceType,
      fit_rating: job.fitRating || 0
    });

  if (error) {
    console.error('Error saving job:', error);
    throw error;
  }

  return data;
};

export const unsaveJob = async (jobId: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User must be authenticated to unsave jobs');
  }

  const { error } = await supabase
    .from('saved_jobs')
    .delete()
    .eq('user_id', user.id)
    .eq('job_id', jobId);

  if (error) {
    console.error('Error unsaving job:', error);
    throw error;
  }
};

export const getSavedJobs = async (): Promise<Job[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('saved_jobs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching saved jobs:', error);
    throw error;
  }

  return data.map(savedJob => ({
    id: savedJob.job_id,
    title: savedJob.job_title,
    company: savedJob.company,
    location: savedJob.location || '',
    salary: savedJob.salary || '',
    description: savedJob.description || '',
    type: savedJob.job_type || 'Full-time',
    postedDate: savedJob.posted_date || '',
    applyLink: savedJob.apply_link,
    source: savedJob.source,
    sourceType: (savedJob.source_type || 'manual') as 'manual' | 'xray',
    isSaved: true,
    fitRating: savedJob.fit_rating || 0
  }));
};

export const updateJobRating = async (jobId: string, rating: number) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User must be authenticated to rate jobs');
  }

  const { error } = await supabase
    .from('saved_jobs')
    .update({ fit_rating: rating })
    .eq('user_id', user.id)
    .eq('job_id', jobId);

  if (error) {
    console.error('Error updating job rating:', error);
    throw error;
  }
};
