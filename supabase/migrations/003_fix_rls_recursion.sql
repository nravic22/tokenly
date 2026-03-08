-- Fix: infinite recursion in user_vendor_roles RLS policy
-- The old policy queried user_vendor_roles from within a policy on user_vendor_roles.
-- Fix: use a security definer function to bypass RLS during the check.

-- 1. Drop the recursive policy
DROP POLICY IF EXISTS "Vendor admins manage own vendor roles" ON user_vendor_roles;

-- 2. Create a helper function (security definer bypasses RLS)
CREATE OR REPLACE FUNCTION is_vendor_admin(p_user_id UUID, p_vendor_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_vendor_roles
    WHERE user_id = p_user_id
    AND vendor_id = p_vendor_id
    AND role = 'vendor_admin'
    AND is_active = true
  );
$$;

-- 3. Recreate the policy using the function
CREATE POLICY "Vendor admins manage own vendor roles" ON user_vendor_roles
  FOR ALL USING (
    is_vendor_admin(auth.uid(), vendor_id)
  );
