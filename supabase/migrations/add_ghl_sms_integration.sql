-- Go High Level SMS & contact sync (Phase 1)
-- Run in Supabase SQL Editor if you do not use migration runner.

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS ghl_contact_id TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS sms_notification_scope TEXT
  DEFAULT 'none'
  CHECK (sms_notification_scope IN ('none', 'critical', 'all'));
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS sms_opt_in_at TIMESTAMPTZ;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS sms_opt_out_at TIMESTAMPTZ;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sms_notification_scope TEXT
  DEFAULT 'none'
  CHECK (sms_notification_scope IN ('none', 'critical', 'all'));

CREATE TABLE IF NOT EXISTS public.ghl_sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  contact_id TEXT,
  phone TEXT,
  status TEXT NOT NULL,
  message TEXT,
  ghl_message_id TEXT,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ghl_sms_logs_user_id ON public.ghl_sms_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ghl_sms_logs_created_at ON public.ghl_sms_logs(created_at DESC);

ALTER TABLE public.ghl_sms_logs ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.ghl_sms_logs IS 'Audit trail for GHL SMS sends (service role bypasses RLS)';

-- Keep profiles in sync with users for dashboard reads
CREATE OR REPLACE FUNCTION public.sync_profile_sms_from_user()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET
    phone = NEW.phone,
    sms_notification_scope = NEW.sms_notification_scope,
    updated_at = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_users_sync_sms_profile ON public.users;
CREATE TRIGGER trg_users_sync_sms_profile
  AFTER UPDATE OF phone, sms_notification_scope ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_sms_from_user();

-- New users: copy SMS columns into profile on insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, email, full_name, company_name, plan_type, api_credits, is_admin,
    phone, sms_notification_scope
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.full_name,
    NEW.company_name,
    NEW.plan_type,
    NEW.api_credits,
    NEW.is_admin,
    NEW.phone,
    COALESCE(NEW.sms_notification_scope, 'none')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
