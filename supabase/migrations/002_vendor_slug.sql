-- Add slug column to vendors for branded login URLs
-- e.g., /v/acme-corp → shows Acme Corp's logo on sign-in
-- Later: acme-corp.tokenly.com (subdomain routing, same slug)

ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS slug VARCHAR(100) UNIQUE;

CREATE INDEX IF NOT EXISTS idx_vendors_slug ON vendors(slug);

-- Allow public (unauthenticated) read of vendor name, logo, slug
-- This is needed so the sign-in page can fetch branding without auth
CREATE POLICY "Public can read vendor branding by slug" ON vendors
  FOR SELECT USING (true);
