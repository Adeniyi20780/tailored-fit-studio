-- Allow users to insert their own tailor role (pending verification)
-- This is safe because the tailors table has is_verified = false by default
CREATE POLICY "Users can create their own tailor role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND role = 'tailor'::app_role
);

-- Allow users to create their own customer role
CREATE POLICY "Users can create their own customer role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND role = 'customer'::app_role
);