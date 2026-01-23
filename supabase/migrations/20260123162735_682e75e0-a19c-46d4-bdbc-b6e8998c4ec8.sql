-- Create tailor_reviews table for customer ratings after order completion
CREATE TABLE public.tailor_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tailor_id UUID NOT NULL REFERENCES public.tailors(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(order_id, customer_id)
);

-- Enable RLS
ALTER TABLE public.tailor_reviews ENABLE ROW LEVEL SECURITY;

-- Customers can view all reviews
CREATE POLICY "Anyone can view tailor reviews"
  ON public.tailor_reviews
  FOR SELECT
  USING (true);

-- Customers can create their own reviews
CREATE POLICY "Customers can create their own reviews"
  ON public.tailor_reviews
  FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

-- Customers can update their own reviews
CREATE POLICY "Customers can update their own reviews"
  ON public.tailor_reviews
  FOR UPDATE
  USING (auth.uid() = customer_id);

-- Customers can delete their own reviews
CREATE POLICY "Customers can delete their own reviews"
  ON public.tailor_reviews
  FOR DELETE
  USING (auth.uid() = customer_id);

-- Add trigger for updated_at
CREATE TRIGGER update_tailor_reviews_updated_at
  BEFORE UPDATE ON public.tailor_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_tailor_reviews_tailor_id ON public.tailor_reviews(tailor_id);
CREATE INDEX idx_tailor_reviews_customer_id ON public.tailor_reviews(customer_id);