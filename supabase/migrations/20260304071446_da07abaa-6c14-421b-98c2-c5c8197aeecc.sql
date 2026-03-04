-- Fix notifications RLS: allow authenticated users to insert notifications for any user
-- This is needed for messaging notifications where sender creates notification for receiver
DROP POLICY IF EXISTS "Users can insert their own notifications" ON public.notifications;

CREATE POLICY "Authenticated users can insert notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (true);
