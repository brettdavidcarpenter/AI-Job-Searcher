
import { supabase } from "@/integrations/supabase/client";
import type { Job } from "@/pages/Index";

export interface PendingReview {
  id: string;
  user_id: string;
  search_config_id?: string;
  job_id: string;
  job_title: string;
  company: string;
  location?: string;
  salary?: string;
  description?: string;
  job_type?: string;
  posted_date?: string;
  apply_link?: string;
  source: string;
  source_type: 'jsearch' | 'xray' | 'manual';
  found_at: string;
  is_reviewed: boolean;
}

export const storePendingReviews = async (jobs: Job[], searchConfigId?: string, sourceType: 'jsearch' | 'xray' | 'manual' = 'manual') => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User must be authenticated to store pending reviews');
  }

  const pendingReviews = jobs.map(job => ({
    user_id: user.id,
    search_config_id: searchConfigId,
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
    source_type: sourceType
  }));

  const { data, error } = await supabase
    .from('pending_reviews')
    .upsert(pendingReviews, {
      onConflict: 'user_id,job_id',
      ignoreDuplicates: true
    })
    .select();

  if (error) {
    console.error('Error storing pending reviews:', error);
    throw error;
  }

  return data;
};

export const getPendingReviews = async (): Promise<PendingReview[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('pending_reviews')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_reviewed', false)
    .order('found_at', { ascending: false });

  if (error) {
    console.error('Error fetching pending reviews:', error);
    throw error;
  }

  return (data || []) as PendingReview[];
};

export const markAsReviewed = async (reviewIds: string[]) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User must be authenticated to mark reviews');
  }

  const { error } = await supabase
    .from('pending_reviews')
    .update({ is_reviewed: true })
    .eq('user_id', user.id)
    .in('id', reviewIds);

  if (error) {
    console.error('Error marking reviews as reviewed:', error);
    throw error;
  }
};

export const convertPendingReviewToJob = (review: PendingReview): Job => {
  return {
    id: review.job_id,
    title: review.job_title,
    company: review.company,
    location: review.location || '',
    salary: review.salary || '',
    description: review.description || '',
    type: review.job_type || 'Full-time',
    postedDate: review.posted_date || '',
    applyLink: review.apply_link || '',
    source: review.source,
    sourceType: review.source_type === 'jsearch' ? 'manual' : review.source_type as 'manual' | 'xray',
    isSaved: false,
    fitRating: 0
  };
};
