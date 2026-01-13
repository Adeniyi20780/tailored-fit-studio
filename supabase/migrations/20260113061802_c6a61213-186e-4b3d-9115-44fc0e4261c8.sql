-- Add policy allowing tailors to view measurements for their assigned orders
CREATE POLICY "Tailors can view measurements for assigned orders"
ON public.customer_measurements
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM public.orders o
    INNER JOIN public.tailors t ON t.id = o.tailor_id
    WHERE o.measurement_id = customer_measurements.id
      AND t.user_id = auth.uid()
      AND o.status NOT IN ('cancelled', 'refunded')
  )
);