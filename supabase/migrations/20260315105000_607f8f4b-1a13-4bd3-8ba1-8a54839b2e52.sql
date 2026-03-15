
-- Add attachment columns to seller_messages
ALTER TABLE public.seller_messages
  ADD COLUMN IF NOT EXISTS attachment_path text,
  ADD COLUMN IF NOT EXISTS attachment_name text,
  ADD COLUMN IF NOT EXISTS attachment_mime_type text,
  ADD COLUMN IF NOT EXISTS attachment_size integer;

-- Add index for conversation history performance
CREATE INDEX IF NOT EXISTS idx_seller_messages_conv_created 
  ON public.seller_messages (conversation_id, created_at);

-- Create private storage bucket for message attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('message-attachments', 'message-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: authenticated users can upload to their own folder
CREATE POLICY "Users can upload message attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'message-attachments' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Storage policy: users can read attachments if they are sender or receiver in that conversation
CREATE POLICY "Users can read their message attachments"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'message-attachments'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.seller_messages sm
      WHERE sm.attachment_path = name
      AND (sm.sender_id = auth.uid() OR sm.receiver_id = auth.uid())
    )
  )
);
