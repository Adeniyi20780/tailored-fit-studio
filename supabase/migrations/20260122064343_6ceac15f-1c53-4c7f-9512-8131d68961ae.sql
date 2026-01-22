-- Create notifications table for storing notification history
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  reference_id TEXT,
  reference_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- Create messages table for chat between customers and tailors
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alteration_ticket_id UUID NOT NULL REFERENCES public.alteration_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'tailor')),
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for messages
CREATE POLICY "Customers can view messages for their tickets"
ON public.messages FOR SELECT
USING (EXISTS (
  SELECT 1 FROM alteration_tickets
  WHERE alteration_tickets.id = messages.alteration_ticket_id
  AND alteration_tickets.customer_id = auth.uid()
));

CREATE POLICY "Tailors can view messages for their tickets"
ON public.messages FOR SELECT
USING (EXISTS (
  SELECT 1 FROM alteration_tickets at
  JOIN tailors t ON t.id = at.tailor_id
  WHERE at.id = messages.alteration_ticket_id
  AND t.user_id = auth.uid()
));

CREATE POLICY "Customers can send messages on their tickets"
ON public.messages FOR INSERT
WITH CHECK (
  sender_type = 'customer' AND
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM alteration_tickets
    WHERE alteration_tickets.id = messages.alteration_ticket_id
    AND alteration_tickets.customer_id = auth.uid()
  )
);

CREATE POLICY "Tailors can send messages on their tickets"
ON public.messages FOR INSERT
WITH CHECK (
  sender_type = 'tailor' AND
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM alteration_tickets at
    JOIN tailors t ON t.id = at.tailor_id
    WHERE at.id = messages.alteration_ticket_id
    AND t.user_id = auth.uid()
  )
);

CREATE POLICY "Users can mark messages as read"
ON public.messages FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM alteration_tickets at
    LEFT JOIN tailors t ON t.id = at.tailor_id
    WHERE at.id = messages.alteration_ticket_id
    AND (at.customer_id = auth.uid() OR t.user_id = auth.uid())
  )
);

-- Create order_timeline table for tracking order status changes
CREATE TABLE public.order_timeline (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.order_timeline ENABLE ROW LEVEL SECURITY;

-- RLS policies for order_timeline
CREATE POLICY "Customers can view their order timeline"
ON public.order_timeline FOR SELECT
USING (EXISTS (
  SELECT 1 FROM orders
  WHERE orders.id = order_timeline.order_id
  AND orders.customer_id = auth.uid()
));

CREATE POLICY "Tailors can view and manage order timeline"
ON public.order_timeline FOR ALL
USING (EXISTS (
  SELECT 1 FROM orders o
  JOIN tailors t ON t.id = o.tailor_id
  WHERE o.id = order_timeline.order_id
  AND t.user_id = auth.uid()
));

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_timeline;