
-- Table to track archived conversations per user
CREATE TABLE public.conversation_archives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  conversation_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, conversation_id)
);

ALTER TABLE public.conversation_archives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own archives"
  ON public.conversation_archives FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can archive conversations"
  ON public.conversation_archives FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unarchive conversations"
  ON public.conversation_archives FOR DELETE
  USING (auth.uid() = user_id);
