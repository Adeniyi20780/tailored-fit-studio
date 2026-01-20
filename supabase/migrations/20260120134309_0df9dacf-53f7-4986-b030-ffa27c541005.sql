-- Create storage bucket for alteration images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('alteration-images', 'alteration-images', true);

-- Allow authenticated users to upload their own alteration images
CREATE POLICY "Users can upload alteration images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'alteration-images' 
  AND auth.uid() IS NOT NULL
);

-- Allow anyone to view alteration images (public bucket)
CREATE POLICY "Alteration images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'alteration-images');

-- Allow users to delete their own alteration images
CREATE POLICY "Users can delete their own alteration images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'alteration-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);