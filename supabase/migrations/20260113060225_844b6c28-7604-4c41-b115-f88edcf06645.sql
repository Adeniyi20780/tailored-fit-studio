-- Fix: PUBLIC_DATA_EXPOSURE - Restrict profiles access to protect PII
-- Drop the overly permissive policy that exposes all profiles to everyone
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Users can view their own profile (full access to their own data)
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Allow viewing tailor profiles publicly for the marketplace (limited to active tailors)
-- This is needed so customers can see tailor names/avatars when browsing stores
CREATE POLICY "Tailor profiles are publicly viewable"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.tailors
    WHERE tailors.user_id = profiles.user_id
    AND tailors.is_active = true
  )
);