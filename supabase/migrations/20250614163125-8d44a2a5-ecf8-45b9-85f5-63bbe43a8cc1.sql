
-- Create X-ray search configurations table
CREATE TABLE public.xray_search_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  query TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  schedule_frequency TEXT NOT NULL DEFAULT 'manual' CHECK (schedule_frequency IN ('manual', 'daily', 'weekly')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_run_at TIMESTAMP WITH TIME ZONE,
  next_run_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, name)
);

-- Create X-ray search results table
CREATE TABLE public.xray_search_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  config_id UUID NOT NULL REFERENCES public.xray_search_configs(id) ON DELETE CASCADE,
  job_id TEXT NOT NULL,
  job_title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  salary TEXT,
  description TEXT,
  job_type TEXT,
  posted_date TEXT,
  apply_link TEXT,
  source TEXT DEFAULT 'xray',
  found_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, job_id)
);

-- Add unique constraint to saved_jobs for cross-table deduplication
ALTER TABLE public.saved_jobs 
ADD CONSTRAINT unique_user_job_id UNIQUE (user_id, job_id);

-- Enable RLS on new tables
ALTER TABLE public.xray_search_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xray_search_results ENABLE ROW LEVEL SECURITY;

-- RLS policies for xray_search_configs
CREATE POLICY "Users can view their own X-ray configs" 
  ON public.xray_search_configs 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own X-ray configs" 
  ON public.xray_search_configs 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own X-ray configs" 
  ON public.xray_search_configs 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own X-ray configs" 
  ON public.xray_search_configs 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS policies for xray_search_results
CREATE POLICY "Users can view their own X-ray results" 
  ON public.xray_search_results 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own X-ray results" 
  ON public.xray_search_results 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own X-ray results" 
  ON public.xray_search_results 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own X-ray results" 
  ON public.xray_search_results 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_xray_configs_user_id ON public.xray_search_configs(user_id);
CREATE INDEX idx_xray_configs_active ON public.xray_search_configs(is_active, next_run_at);
CREATE INDEX idx_xray_results_user_id ON public.xray_search_results(user_id);
CREATE INDEX idx_xray_results_config_id ON public.xray_search_results(config_id);
CREATE INDEX idx_xray_results_found_at ON public.xray_search_results(found_at DESC);
