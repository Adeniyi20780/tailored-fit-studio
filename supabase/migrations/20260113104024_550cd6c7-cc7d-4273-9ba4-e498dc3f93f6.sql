-- Create product reviews table
CREATE TABLE public.product_reviews (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(order_id, customer_id) -- One review per order per customer
);

-- Enable RLS
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- Everyone can view reviews
CREATE POLICY "Reviews are viewable by everyone"
ON public.product_reviews
FOR SELECT
USING (true);

-- Customers can create reviews for their delivered orders
CREATE POLICY "Customers can create reviews for delivered orders"
ON public.product_reviews
FOR INSERT
WITH CHECK (
    auth.uid() = customer_id
    AND EXISTS (
        SELECT 1 FROM public.orders
        WHERE orders.id = order_id
        AND orders.customer_id = auth.uid()
        AND orders.status = 'delivered'
    )
);

-- Customers can update their own reviews
CREATE POLICY "Customers can update their own reviews"
ON public.product_reviews
FOR UPDATE
USING (auth.uid() = customer_id);

-- Customers can delete their own reviews
CREATE POLICY "Customers can delete their own reviews"
ON public.product_reviews
FOR DELETE
USING (auth.uid() = customer_id);

-- Add trigger for updated_at
CREATE TRIGGER update_product_reviews_updated_at
BEFORE UPDATE ON public.product_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_product_reviews_product_id ON public.product_reviews(product_id);
CREATE INDEX idx_product_reviews_customer_id ON public.product_reviews(customer_id);