-- ============================================
-- Multi-Tenant SaaS: Full Schema Setup
-- ============================================
-- Hierarchy: Super Admin → Vendor → Employee
-- A user can belong to multiple vendors with different roles.

-- 0. Profiles table (must exist before other tables reference it)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'Team Member',
  dept TEXT DEFAULT 'General',
  avatar TEXT,
  wallet_address TEXT,
  balance INTEGER DEFAULT 200,
  allowance INTEGER DEFAULT 500,
  platform_role VARCHAR(20) DEFAULT 'user'
    CHECK (platform_role IN ('super_admin', 'user')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Enable insert for signup"
  ON profiles FOR INSERT WITH CHECK (true);

-- 1. Vendors table (tenants)
CREATE TABLE IF NOT EXISTS vendors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. User ↔ Vendor relationship (many-to-many with role)
CREATE TABLE IF NOT EXISTS user_vendor_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'employee'
    CHECK (role IN ('vendor_admin', 'employee')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, vendor_id)
);

-- 4. Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_uvr_user_id ON user_vendor_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_uvr_vendor_id ON user_vendor_roles(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendors_is_active ON vendors(is_active);

-- 5. Auto-update updated_at on vendors
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS vendors_updated_at ON vendors;
CREATE TRIGGER vendors_updated_at
  BEFORE UPDATE ON vendors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 6. RLS Policies for vendors
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins manage vendors" ON vendors
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.platform_role = 'super_admin'
    )
  );

CREATE POLICY "Vendor members read own vendor" ON vendors
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_vendor_roles
      WHERE user_vendor_roles.vendor_id = vendors.id
      AND user_vendor_roles.user_id = auth.uid()
      AND user_vendor_roles.is_active = true
    )
  );

-- 7. RLS Policies for user_vendor_roles
ALTER TABLE user_vendor_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins manage roles" ON user_vendor_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.platform_role = 'super_admin'
    )
  );

CREATE POLICY "Vendor admins manage own vendor roles" ON user_vendor_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_vendor_roles AS admin_role
      WHERE admin_role.vendor_id = user_vendor_roles.vendor_id
      AND admin_role.user_id = auth.uid()
      AND admin_role.role = 'vendor_admin'
      AND admin_role.is_active = true
    )
  );

CREATE POLICY "Users read own roles" ON user_vendor_roles
  FOR SELECT USING (user_id = auth.uid());

-- 8. Seed: Make an existing user a super admin (update the email below)
-- UPDATE profiles SET platform_role = 'super_admin' WHERE email = 'your-admin@email.com';
