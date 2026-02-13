
-- =============================================
-- FIX 1: Create refund_requests table with RLS
-- =============================================
CREATE TABLE public.refund_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id),
  customer_id UUID NOT NULL,
  tailor_id UUID NOT NULL REFERENCES public.tailors(id),
  amount NUMERIC NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  refund_type TEXT NOT NULL DEFAULT 'wallet',
  admin_notes TEXT,
  tailor_notes TEXT,
  processed_by UUID,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;

-- Customers can view their own refund requests
CREATE POLICY "Customers view own refunds"
ON public.refund_requests FOR SELECT
USING (auth.uid() = customer_id);

-- Customers can create refund requests for their own orders
CREATE POLICY "Customers request refunds"
ON public.refund_requests FOR INSERT
WITH CHECK (auth.uid() = customer_id);

-- Tailors can view refunds for their store orders
CREATE POLICY "Tailors view store refunds"
ON public.refund_requests FOR SELECT
USING (EXISTS (
  SELECT 1 FROM tailors t
  WHERE t.id = refund_requests.tailor_id
  AND t.user_id = auth.uid()
));

-- Tailors can update refunds for their store orders
CREATE POLICY "Tailors process store refunds"
ON public.refund_requests FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM tailors t
  WHERE t.id = refund_requests.tailor_id
  AND t.user_id = auth.uid()
));

-- Admins can manage all refunds
CREATE POLICY "Admins manage refunds"
ON public.refund_requests FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_refund_requests_updated_at
BEFORE UPDATE ON public.refund_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- FIX 2: Restrict tailor wallet policies
-- =============================================

-- Drop overly permissive tailor wallet policies
DROP POLICY "Tailors can update wallets for refunds" ON public.wallets;
DROP POLICY "Tailors can insert wallet transactions for refunds" ON public.wallet_transactions;

-- Tailors can only update wallets for customers who have orders with them
CREATE POLICY "Tailors can update wallets for own order refunds"
ON public.wallets FOR UPDATE
USING (
  has_role(auth.uid(), 'tailor')
  AND EXISTS (
    SELECT 1 FROM orders o
    JOIN tailors t ON t.id = o.tailor_id
    WHERE o.customer_id = wallets.user_id
    AND t.user_id = auth.uid()
  )
);

-- Tailors can only insert transactions for wallets of their own order customers
CREATE POLICY "Tailors can insert transactions for own order refunds"
ON public.wallet_transactions FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'tailor')
  AND EXISTS (
    SELECT 1 FROM wallets w
    JOIN orders o ON o.customer_id = w.user_id
    JOIN tailors t ON t.id = o.tailor_id
    WHERE w.id = wallet_transactions.wallet_id
    AND t.user_id = auth.uid()
  )
);
