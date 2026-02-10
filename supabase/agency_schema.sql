-- Agency (Brand) dashboard: theme, clients, packages
-- Run this in Supabase SQL Editor after custom_auth_schema and add_brand_fields

-- Allow users to belong to an agency (clients are created by agency)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_users_agency_id ON public.users(agency_id);

-- Agency settings: theme, logo, package (for brand/agency accounts only)
CREATE TABLE IF NOT EXISTS public.agency_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  agency_user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#facc15',
  secondary_color TEXT DEFAULT '#eab308',
  package_tier TEXT DEFAULT 'starter' CHECK (package_tier IN ('starter', 'growth', 'empire')),
  audits_used_this_period INTEGER DEFAULT 0,
  audits_limit INTEGER DEFAULT 10,
  clients_limit INTEGER DEFAULT 3,
  period_start_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agency_settings_agency_user_id ON public.agency_settings(agency_user_id);

-- RLS
ALTER TABLE public.agency_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Agency can manage own settings" ON public.agency_settings;
CREATE POLICY "Agency can manage own settings" ON public.agency_settings
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Clients can read agency theme" ON public.agency_settings;
CREATE POLICY "Clients can read agency theme" ON public.agency_settings
  FOR SELECT USING (true);

-- Package limits (starter/growth/empire for agencies)
-- starter: 10 audits/mo, 3 clients
-- growth: 50 audits/mo, 10 clients
-- empire: 200 audits/mo, 50 clients

-- Optional: Agency logo uploads use Supabase Storage.
-- In Supabase Dashboard → Storage → New bucket:
--   Name: agency-logos
--   Public bucket: ON (so client dashboards can show logo URLs)
--   Allowed MIME types (optional): image/jpeg, image/png, image/gif, image/webp, image/svg+xml
--   File size limit (optional): 2 MB
