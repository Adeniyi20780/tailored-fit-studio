-- Fix permissive policy for product_comparisons - require either authenticated user or session_id
DROP POLICY IF EXISTS "Anyone can insert comparisons" ON public.product_comparisons;
CREATE POLICY "Users can insert comparisons with session" ON public.product_comparisons 
  FOR INSERT WITH CHECK (auth.uid() = user_id OR (user_id IS NULL AND session_id IS NOT NULL));