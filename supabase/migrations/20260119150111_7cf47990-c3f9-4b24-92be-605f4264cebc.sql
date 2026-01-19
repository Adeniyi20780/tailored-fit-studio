-- Create alteration tickets table
CREATE TABLE public.alteration_tickets (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL,
    tailor_id UUID NOT NULL REFERENCES public.tailors(id) ON DELETE CASCADE,
    issue_type TEXT NOT NULL,
    description TEXT NOT NULL,
    images TEXT[] DEFAULT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    resolution TEXT DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.alteration_tickets ENABLE ROW LEVEL SECURITY;

-- Customers can view their own tickets
CREATE POLICY "Customers can view their own alteration tickets"
ON public.alteration_tickets
FOR SELECT
USING (auth.uid() = customer_id);

-- Customers can create tickets for their orders
CREATE POLICY "Customers can create alteration tickets"
ON public.alteration_tickets
FOR INSERT
WITH CHECK (
    auth.uid() = customer_id AND
    EXISTS (
        SELECT 1 FROM orders 
        WHERE orders.id = alteration_tickets.order_id 
        AND orders.customer_id = auth.uid()
        AND orders.status = 'delivered'
    )
);

-- Tailors can view tickets for their store
CREATE POLICY "Tailors can view alteration tickets for their store"
ON public.alteration_tickets
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM tailors 
        WHERE tailors.id = alteration_tickets.tailor_id 
        AND tailors.user_id = auth.uid()
    )
);

-- Tailors can update tickets for their store
CREATE POLICY "Tailors can update alteration tickets"
ON public.alteration_tickets
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM tailors 
        WHERE tailors.id = alteration_tickets.tailor_id 
        AND tailors.user_id = auth.uid()
    )
);

-- Add trigger for updated_at
CREATE TRIGGER update_alteration_tickets_updated_at
BEFORE UPDATE ON public.alteration_tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();