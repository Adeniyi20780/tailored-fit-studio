
-- Create wallets table
CREATE TABLE public.wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  balance NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on wallets
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- Users can view their own wallet
CREATE POLICY "Users can view their own wallet"
ON public.wallets
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own wallet
CREATE POLICY "Users can update their own wallet"
ON public.wallets
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can insert their own wallet
CREATE POLICY "Users can insert their own wallet"
ON public.wallets
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create wallet_transactions table
CREATE TABLE public.wallet_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  reference_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on wallet_transactions
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own wallet transactions
CREATE POLICY "Users can view their own wallet transactions"
ON public.wallet_transactions
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM wallets
  WHERE wallets.id = wallet_transactions.wallet_id
  AND wallets.user_id = auth.uid()
));

-- Users can insert their own wallet transactions
CREATE POLICY "Users can insert their own wallet transactions"
ON public.wallet_transactions
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM wallets
  WHERE wallets.id = wallet_transactions.wallet_id
  AND wallets.user_id = auth.uid()
));

-- Create updated_at trigger for wallets
CREATE TRIGGER update_wallets_updated_at
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add admin policies to view all wallets
CREATE POLICY "Admins can view all wallets"
ON public.wallets
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Add admin policies to view all wallet transactions
CREATE POLICY "Admins can view all wallet transactions"
ON public.wallet_transactions
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Add admin policies to update wallets (for processing refunds)
CREATE POLICY "Admins can update all wallets"
ON public.wallets
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Add admin policies to insert wallet transactions (for refunds)
CREATE POLICY "Admins can insert wallet transactions"
ON public.wallet_transactions
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Tailors can insert wallet transactions (for refunds to customers)
CREATE POLICY "Tailors can insert wallet transactions for refunds"
ON public.wallet_transactions
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'tailor'));

-- Tailors can update customer wallets for refunds
CREATE POLICY "Tailors can update wallets for refunds"
ON public.wallets
FOR UPDATE
USING (has_role(auth.uid(), 'tailor'));
