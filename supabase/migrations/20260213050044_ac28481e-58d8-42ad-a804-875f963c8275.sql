
-- Drop the overly permissive INSERT policy
DROP POLICY "System can insert notifications" ON public.notifications;

-- Create a restrictive policy: users can only insert notifications for themselves
-- Edge functions using service_role key bypass RLS entirely, so system inserts still work
CREATE POLICY "Users can insert their own notifications"
ON public.notifications
FOR INSERT
WITH CHECK (auth.uid() = user_id);
