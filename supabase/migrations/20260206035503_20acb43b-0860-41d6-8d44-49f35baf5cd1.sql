-- Add social_links column to tailors table
ALTER TABLE public.tailors 
ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '[]'::jsonb;