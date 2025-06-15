
-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can view their own X-ray results" ON public.xray_search_results;
DROP POLICY IF EXISTS "Users can create their own X-ray results" ON public.xray_search_results;
DROP POLICY IF EXISTS "Users can update their own X-ray results" ON public.xray_search_results;
DROP POLICY IF EXISTS "Users can delete their own X-ray results" ON public.xray_search_results;

-- Enable RLS on xray_search_results table
ALTER TABLE public.xray_search_results ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for xray_search_results table
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

-- Add source column to saved_jobs to track where jobs came from
ALTER TABLE public.saved_jobs 
ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'manual' CHECK (source_type IN ('manual', 'xray'));

-- Add index for better performance when querying X-ray results by config
CREATE INDEX IF NOT EXISTS idx_xray_results_config_found_at ON public.xray_search_results(config_id, found_at DESC);
