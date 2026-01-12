-- Create role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'tailor', 'customer');

-- Create user_roles table for role management
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
ON public.profiles
FOR SELECT
USING (true);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create tailors table (storefront info)
CREATE TABLE public.tailors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    store_name TEXT NOT NULL,
    store_slug TEXT UNIQUE NOT NULL,
    description TEXT,
    logo_url TEXT,
    banner_url TEXT,
    location TEXT,
    specialties TEXT[],
    rating NUMERIC(2,1) DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tailors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tailors are viewable by everyone"
ON public.tailors
FOR SELECT
USING (is_active = true);

CREATE POLICY "Tailors can update their own store"
ON public.tailors
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Tailors can insert their own store"
ON public.tailors
FOR INSERT
WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'tailor'));

-- Create products table
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tailor_id UUID REFERENCES public.tailors(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    base_price NUMERIC(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    images TEXT[],
    fabrics TEXT[],
    colors TEXT[],
    sizes TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products are viewable by everyone"
ON public.products
FOR SELECT
USING (is_active = true);

CREATE POLICY "Tailors can manage their own products"
ON public.products
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.tailors
        WHERE tailors.id = products.tailor_id
        AND tailors.user_id = auth.uid()
    )
);

-- Create customer_measurements table
CREATE TABLE public.customer_measurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    measurement_name TEXT DEFAULT 'Default',
    height NUMERIC(5,2),
    chest NUMERIC(5,2),
    waist NUMERIC(5,2),
    hips NUMERIC(5,2),
    shoulder_width NUMERIC(5,2),
    sleeve_length NUMERIC(5,2),
    inseam NUMERIC(5,2),
    neck NUMERIC(5,2),
    unit TEXT DEFAULT 'cm',
    additional_measurements JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_measurements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own measurements"
ON public.customer_measurements
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own measurements"
ON public.customer_measurements
FOR ALL
USING (auth.uid() = user_id);

-- Create orders table
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL,
    customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    tailor_id UUID REFERENCES public.tailors(id) ON DELETE SET NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    measurement_id UUID REFERENCES public.customer_measurements(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'pending',
    customizations JSONB,
    total_amount NUMERIC(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    shipping_address JSONB,
    notes TEXT,
    estimated_delivery DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view their own orders"
ON public.orders
FOR SELECT
USING (auth.uid() = customer_id);

CREATE POLICY "Customers can create orders"
ON public.orders
FOR INSERT
WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Tailors can view orders for their store"
ON public.orders
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.tailors
        WHERE tailors.id = orders.tailor_id
        AND tailors.user_id = auth.uid()
    )
);

CREATE POLICY "Tailors can update orders for their store"
ON public.orders
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.tailors
        WHERE tailors.id = orders.tailor_id
        AND tailors.user_id = auth.uid()
    )
);

-- Create function to generate order number
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.order_number := 'TS-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(NEW.id::TEXT, 1, 6));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_number
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.generate_order_number();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update triggers
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tailors_updated_at
BEFORE UPDATE ON public.tailors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_measurements_updated_at
BEFORE UPDATE ON public.customer_measurements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    
    -- Default role is customer
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'customer');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();