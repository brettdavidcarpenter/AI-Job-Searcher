
import { supabase } from "@/integrations/supabase/client";

export interface JobSearchParams {
  query?: string;
  location?: string;
  keywords?: string;
  remote?: boolean;
  page?: number;
  num_pages?: number;
}

export interface JSearchJob {
  job_id: string;
  job_title: string;
  employer_name: string;
  job_city: string;
  job_state: string;
  job_country: string;
  job_description: string;
  job_employment_type: string;
  job_posted_at_datetime_utc: string;
  job_salary_currency?: string;
  job_min_salary?: number;
  job_max_salary?: number;
  job_apply_link: string;
  source?: string;
}

export interface JSearchResponse {
  status: string;
  request_id: string;
  parameters: any;
  data: JSearchJob[];
  num_pages: number;
  source?: string;
  cached?: boolean;
  cached_at?: string;
  fallback_reason?: string;
  fallback_level?: 'live' | 'cache' | 'expired_cache' | 'recent_global' | 'static' | 'error';
  cache_age_hours?: number;
  message?: string;
  api_key_used?: string;
}

export interface SearchResult {
  response: JSearchResponse;
  isFromCache: boolean;
  isFallback: boolean;
  fallbackLevel: string;
  cacheAgeHours?: number;
  errorMessage?: string;
  apiKeyUsed?: string;
}

export const searchJobs = async (params: JobSearchParams): Promise<SearchResult> => {
  try {
    const { data, error } = await supabase.functions.invoke('search-jobs', {
      body: params
    });

    if (error) {
      console.error('Error calling search-jobs function:', error);
      throw new Error('Failed to search jobs: ' + error.message);
    }

    const response = data as JSearchResponse;
    
    // Determine fallback status based on fallback_level
    const isFallback = response.fallback_level && !['live', 'cache'].includes(response.fallback_level);
    const isFromCache = Boolean(response.cached) || response.fallback_level === 'cache';
    
    return {
      response,
      isFromCache,
      isFallback,
      fallbackLevel: response.fallback_level || 'unknown',
      cacheAgeHours: response.cache_age_hours,
      errorMessage: response.message,
      apiKeyUsed: response.api_key_used
    };
  } catch (error) {
    console.error('Error in searchJobs:', error);
    throw error;
  }
};
