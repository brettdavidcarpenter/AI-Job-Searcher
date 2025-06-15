
-- Create search_configs table for unified search configuration
CREATE TABLE public.search_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  search_type TEXT NOT NULL CHECK (search_type IN ('jsearch', 'xray')),
  query TEXT NOT NULL,
  location TEXT,
  keywords TEXT,
  remote_only BOOLEAN DEFAULT false,
  is_recurring BOOLEAN DEFAULT false,
  schedule_frequency TEXT CHECK (schedule_frequency IN ('daily', 'weekly', 'monthly')),
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMP WITH TIME ZONE,
  next_run_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pending_reviews table for jobs awaiting user review
CREATE TABLE public.pending_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  search_config_id UUID REFERENCES public.search_configs(id) ON DELETE CASCADE,
  job_id TEXT NOT NULL,
  job_title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  salary TEXT,
  description TEXT,
  job_type TEXT,
  posted_date TEXT,
  apply_link TEXT,
  source TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('jsearch', 'xray', 'manual')),
  found_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_reviewed BOOLEAN DEFAULT false,
  UNIQUE(user_id, job_id)
);

-- Add application tracking to saved_jobs
ALTER TABLE public.saved_jobs 
ADD COLUMN IF NOT EXISTS application_status TEXT DEFAULT 'not_applied' CHECK (application_status IN ('not_applied', 'applied', 'interviewing', 'rejected', 'offer'));

ALTER TABLE public.saved_jobs 
ADD COLUMN IF NOT EXISTS personal_notes TEXT;

-- Create user_email_preferences table
CREATE TABLE public.user_email_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  daily_digest BOOLEAN DEFAULT true,
  weekly_digest BOOLEAN DEFAULT false,
  immediate_alerts BOOLEAN DEFAULT false,
  high_priority_alerts BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.search_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_email_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for search_configs
CREATE POLICY "Users can view their own search configs" 
  ON public.search_configs 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own search configs" 
  ON public.search_configs 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own search configs" 
  ON public.search_configs 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own search configs" 
  ON public.search_configs 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create RLS policies for pending_reviews
CREATE POLICY "Users can view their own pending reviews" 
  ON public.pending_reviews 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own pending reviews" 
  ON public.pending_reviews 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending reviews" 
  ON public.pending_reviews 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pending reviews" 
  ON public.pending_reviews 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create RLS policies for user_email_preferences
CREATE POLICY "Users can view their own email preferences" 
  ON public.user_email_preferences 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own email preferences" 
  ON public.user_email_preferences 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email preferences" 
  ON public.user_email_preferences 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_search_configs_user_active ON public.search_configs(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_pending_reviews_user_reviewed ON public.pending_reviews(user_id, is_reviewed);
CREATE INDEX IF NOT EXISTS idx_pending_reviews_found_at ON public.pending_reviews(found_at DESC);
