-- Create a one-time admin setup function
-- This allows creating the first admin user securely
CREATE OR REPLACE FUNCTION public.create_first_admin()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow if no admins exist
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE role = 'admin') THEN
    -- Promote the calling user to admin (must be authenticated)
    IF auth.uid() IS NULL THEN
      RAISE EXCEPTION 'Must be authenticated to create first admin';
    END IF;
    
    INSERT INTO user_roles (user_id, role)
    VALUES (auth.uid(), 'admin');
  ELSE
    RAISE EXCEPTION 'Admin user already exists';
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_first_admin() TO authenticated;