
-- Shop follows table
CREATE TABLE public.shop_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tailor_id uuid NOT NULL REFERENCES public.tailors(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, tailor_id)
);

ALTER TABLE public.shop_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own follows"
  ON public.shop_follows FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can follow shops"
  ON public.shop_follows FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unfollow shops"
  ON public.shop_follows FOR DELETE
  USING (auth.uid() = user_id);

-- Tailors can see their follower count
CREATE POLICY "Tailors can view their followers"
  ON public.shop_follows FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM tailors t WHERE t.id = shop_follows.tailor_id AND t.user_id = auth.uid()
  ));

-- Seller messages table (direct messages between customer and tailor)
CREATE TABLE public.seller_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id text NOT NULL,
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  tailor_id uuid NOT NULL REFERENCES public.tailors(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  content text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_seller_messages_conversation ON public.seller_messages(conversation_id, created_at);
CREATE INDEX idx_seller_messages_receiver ON public.seller_messages(receiver_id, is_read);

ALTER TABLE public.seller_messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages they sent or received
CREATE POLICY "Users can view their messages"
  ON public.seller_messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can send messages
CREATE POLICY "Users can send messages"
  ON public.seller_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Users can mark messages as read
CREATE POLICY "Users can mark received messages as read"
  ON public.seller_messages FOR UPDATE
  USING (auth.uid() = receiver_id);

-- Enable realtime for seller_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.seller_messages;
