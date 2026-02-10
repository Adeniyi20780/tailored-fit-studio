
-- Add admin_level column (1 = ultimate, 2 = limited admin)
ALTER TABLE public.user_roles ADD COLUMN admin_level integer DEFAULT NULL;

-- Set current logged-in user as level 1 admin
UPDATE public.user_roles 
SET admin_level = 1 
WHERE user_id = '881de6ac-7cf2-40c1-9b3b-6e8f1a413c9a' AND role = 'admin';

-- Create helper function to get admin level
CREATE OR REPLACE FUNCTION public.get_admin_level(_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT admin_level
  FROM public.user_roles
  WHERE user_id = _user_id AND role = 'admin'
  LIMIT 1;
$$;
