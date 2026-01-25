-- Create loyalty tiers table
CREATE TABLE public.loyalty_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  min_points INTEGER NOT NULL DEFAULT 0,
  multiplier DECIMAL(3,2) NOT NULL DEFAULT 1.0,
  benefits TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create customer loyalty table
CREATE TABLE public.customer_loyalty (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  total_points INTEGER NOT NULL DEFAULT 0,
  available_points INTEGER NOT NULL DEFAULT 0,
  lifetime_points INTEGER NOT NULL DEFAULT 0,
  current_tier_id UUID REFERENCES public.loyalty_tiers(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create points transactions table
CREATE TABLE public.points_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  points INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('earned', 'redeemed', 'expired', 'bonus')),
  description TEXT,
  reference_id UUID,
  reference_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create rewards table
CREATE TABLE public.loyalty_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  points_cost INTEGER NOT NULL,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('discount_percentage', 'discount_fixed', 'free_shipping', 'free_product')),
  reward_value DECIMAL(10,2) NOT NULL,
  min_tier_id UUID REFERENCES public.loyalty_tiers(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  stock INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reward redemptions table
CREATE TABLE public.reward_redemptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  reward_id UUID NOT NULL REFERENCES public.loyalty_rewards(id),
  points_spent INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired')),
  code TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create push subscriptions table (for web push notifications)
CREATE TABLE public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- Create product comparison table
CREATE TABLE public.product_comparisons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  session_id TEXT,
  product_ids UUID[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.loyalty_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_loyalty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_comparisons ENABLE ROW LEVEL SECURITY;

-- Loyalty tiers are public read
CREATE POLICY "Anyone can view loyalty tiers" ON public.loyalty_tiers FOR SELECT USING (true);

-- Customer loyalty policies
CREATE POLICY "Users can view their own loyalty" ON public.customer_loyalty FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own loyalty" ON public.customer_loyalty FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own loyalty" ON public.customer_loyalty FOR UPDATE USING (auth.uid() = user_id);

-- Points transactions policies
CREATE POLICY "Users can view their own transactions" ON public.points_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert transactions" ON public.points_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Loyalty rewards are public read
CREATE POLICY "Anyone can view active rewards" ON public.loyalty_rewards FOR SELECT USING (is_active = true);

-- Reward redemptions policies
CREATE POLICY "Users can view their own redemptions" ON public.reward_redemptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own redemptions" ON public.reward_redemptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own redemptions" ON public.reward_redemptions FOR UPDATE USING (auth.uid() = user_id);

-- Push subscriptions policies
CREATE POLICY "Users can manage their own push subscriptions" ON public.push_subscriptions FOR ALL USING (auth.uid() = user_id);

-- Product comparisons policies
CREATE POLICY "Users can manage their own comparisons" ON public.product_comparisons FOR ALL USING (auth.uid() = user_id OR (user_id IS NULL AND session_id IS NOT NULL));
CREATE POLICY "Anyone can insert comparisons" ON public.product_comparisons FOR INSERT WITH CHECK (true);

-- Insert default loyalty tiers
INSERT INTO public.loyalty_tiers (name, min_points, multiplier, benefits) VALUES
('Bronze', 0, 1.0, ARRAY['1 point per ₦100 spent', 'Birthday bonus points']),
('Silver', 5000, 1.25, ARRAY['1.25 points per ₦100 spent', 'Birthday bonus points', 'Early access to sales']),
('Gold', 15000, 1.5, ARRAY['1.5 points per ₦100 spent', 'Birthday bonus points', 'Early access to sales', 'Free shipping on orders over ₦50,000']),
('Platinum', 50000, 2.0, ARRAY['2 points per ₦100 spent', 'Birthday bonus points', 'Early access to sales', 'Free shipping on all orders', 'Exclusive VIP events']);

-- Insert default rewards
INSERT INTO public.loyalty_rewards (name, description, points_cost, reward_type, reward_value) VALUES
('5% Off Your Order', 'Get 5% off your next purchase', 500, 'discount_percentage', 5),
('10% Off Your Order', 'Get 10% off your next purchase', 900, 'discount_percentage', 10),
('₦5,000 Off', 'Get ₦5,000 off your next order', 1000, 'discount_fixed', 5000),
('₦15,000 Off', 'Get ₦15,000 off your next order', 2500, 'discount_fixed', 15000),
('Free Shipping', 'Free shipping on your next order', 300, 'free_shipping', 0);

-- Create trigger for updated_at
CREATE TRIGGER update_customer_loyalty_updated_at
  BEFORE UPDATE ON public.customer_loyalty
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_comparisons_updated_at
  BEFORE UPDATE ON public.product_comparisons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();