-- Create wishlist notification preferences table
CREATE TABLE public.wishlist_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  notify_on_sale BOOLEAN DEFAULT true,
  notify_on_restock BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Enable RLS
ALTER TABLE public.wishlist_notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own notification preferences"
ON public.wishlist_notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own notification preferences"
ON public.wishlist_notifications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences"
ON public.wishlist_notifications
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notification preferences"
ON public.wishlist_notifications
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_wishlist_notifications_updated_at
BEFORE UPDATE ON public.wishlist_notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create shared wishlists table for public sharing
CREATE TABLE public.shared_wishlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  share_code TEXT NOT NULL UNIQUE,
  product_ids UUID[] NOT NULL,
  title TEXT DEFAULT 'My Wishlist',
  is_active BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.shared_wishlists ENABLE ROW LEVEL SECURITY;

-- RLS policies for shared wishlists
CREATE POLICY "Anyone can view active shared wishlists"
ON public.shared_wishlists
FOR SELECT
USING (is_active = true);

CREATE POLICY "Users can create their own shared wishlists"
ON public.shared_wishlists
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shared wishlists"
ON public.shared_wishlists
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shared wishlists"
ON public.shared_wishlists
FOR DELETE
USING (auth.uid() = user_id);