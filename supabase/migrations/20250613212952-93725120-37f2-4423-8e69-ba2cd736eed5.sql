
-- Create table for caching job search results
CREATE TABLE public.cached_job_searches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  search_params_hash TEXT NOT NULL,
  search_params JSONB NOT NULL,
  results JSONB NOT NULL,
  cached_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '6 hours')
);

-- Create index for efficient lookups
CREATE INDEX idx_cached_job_searches_hash ON public.cached_job_searches(search_params_hash);
CREATE INDEX idx_cached_job_searches_expires ON public.cached_job_searches(expires_at);

-- Create table for fallback job dataset
CREATE TABLE public.fallback_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_data JSONB NOT NULL,
  source TEXT NOT NULL DEFAULT 'fallback',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Insert some fallback AI jobs for when APIs fail
INSERT INTO public.fallback_jobs (job_data) VALUES 
('{
  "job_id": "fallback_1",
  "job_title": "Senior AI Product Manager",
  "employer_name": "TechCorp",
  "job_city": "San Francisco",
  "job_state": "CA",
  "job_country": "US",
  "job_description": "Lead AI product development initiatives and drive innovation in machine learning applications. Work with cross-functional teams to deliver cutting-edge AI solutions.",
  "job_employment_type": "Full-time",
  "job_posted_at_datetime_utc": "2024-12-01T08:00:00Z",
  "job_salary_currency": "USD",
  "job_min_salary": 150000,
  "job_max_salary": 200000,
  "job_apply_link": "https://example.com/apply",
  "source": "fallback"
}'),
('{
  "job_id": "fallback_2",
  "job_title": "AI/ML Product Manager",
  "employer_name": "Innovation Labs",
  "job_city": "New York",
  "job_state": "NY", 
  "job_country": "US",
  "job_description": "Drive product strategy for AI-powered applications. Collaborate with engineering and data science teams to build scalable ML products.",
  "job_employment_type": "Full-time",
  "job_posted_at_datetime_utc": "2024-12-02T10:00:00Z",
  "job_salary_currency": "USD",
  "job_min_salary": 140000,
  "job_max_salary": 180000,
  "job_apply_link": "https://example.com/apply",
  "source": "fallback"
}'),
('{
  "job_id": "fallback_3",
  "job_title": "Product Manager - Artificial Intelligence",
  "employer_name": "AI Startup",
  "job_city": "Austin",
  "job_state": "TX",
  "job_country": "US", 
  "job_description": "Own the product roadmap for AI features and capabilities. Partner with stakeholders to define requirements and deliver customer value through AI.",
  "job_employment_type": "Full-time",
  "job_posted_at_datetime_utc": "2024-12-03T14:00:00Z",
  "job_salary_currency": "USD",
  "job_min_salary": 130000,
  "job_max_salary": 170000,
  "job_apply_link": "https://example.com/apply",
  "source": "fallback"
}');
