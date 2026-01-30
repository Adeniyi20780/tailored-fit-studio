-- Fix 1: Make alteration-images bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'alteration-images';

-- Add RLS policies for alteration-images bucket
-- Customers can upload their own alteration images
CREATE POLICY "Customers can upload own alteration images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'alteration-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Customers can view their own alteration images
CREATE POLICY "Customers can view own alteration images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'alteration-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Tailors can view alteration images for tickets assigned to them
CREATE POLICY "Tailors can view customer alteration images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'alteration-images'
  AND EXISTS (
    SELECT 1 FROM public.alteration_tickets at
    JOIN public.tailors t ON t.id = at.tailor_id
    WHERE at.customer_id::text = (storage.foldername(name))[1]
    AND t.user_id = auth.uid()
  )
);

-- Customers can delete their own alteration images
CREATE POLICY "Customers can delete own alteration images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'alteration-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Fix 2: Add admin management policies for loyalty_rewards table
-- Admins can create rewards
CREATE POLICY "Admins can insert rewards"
ON public.loyalty_rewards FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Admins can update rewards
CREATE POLICY "Admins can update rewards"
ON public.loyalty_rewards FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Admins can delete rewards
CREATE POLICY "Admins can delete rewards"
ON public.loyalty_rewards FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
);