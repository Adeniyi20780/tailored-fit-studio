-- Create storage bucket for store assets (logos, banners)
INSERT INTO storage.buckets (id, name, public)
VALUES ('store-assets', 'store-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for store-assets bucket
CREATE POLICY "Store assets are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'store-assets');

CREATE POLICY "Tailors can upload their own store assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'store-assets' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.tailors
    WHERE tailors.user_id = auth.uid()
  )
);

CREATE POLICY "Tailors can update their own store assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'store-assets'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.tailors
    WHERE tailors.user_id = auth.uid()
  )
);

CREATE POLICY "Tailors can delete their own store assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'store-assets'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.tailors
    WHERE tailors.user_id = auth.uid()
  )
);