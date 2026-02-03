-- Create table for body scan jobs (background processing)
CREATE TABLE public.body_scan_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  height_cm NUMERIC NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  images JSONB NOT NULL,
  result JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.body_scan_jobs ENABLE ROW LEVEL SECURITY;

-- Users can view their own scan jobs
CREATE POLICY "Users can view their own scan jobs"
ON public.body_scan_jobs
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own scan jobs
CREATE POLICY "Users can insert their own scan jobs"
ON public.body_scan_jobs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_body_scan_jobs_updated_at
BEFORE UPDATE ON public.body_scan_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for efficient polling
CREATE INDEX idx_body_scan_jobs_user_status ON public.body_scan_jobs(user_id, status);