-- Agency billing: Stripe subscription + admin free toggle
-- Run in Supabase SQL Editor after agency_schema.sql

ALTER TABLE public.agency_settings
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_status TEXT
    CHECK (subscription_status IS NULL OR subscription_status IN ('active', 'trialing', 'past_due', 'canceled', 'unpaid')),
  ADD COLUMN IF NOT EXISTS admin_granted_free BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_agency_settings_stripe_subscription
  ON public.agency_settings(stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

COMMENT ON COLUMN public.agency_settings.stripe_customer_id IS 'Stripe customer ID for billing';
COMMENT ON COLUMN public.agency_settings.stripe_subscription_id IS 'Stripe subscription ID (recurring)';
COMMENT ON COLUMN public.agency_settings.subscription_status IS 'active, trialing, past_due, canceled, unpaid';
COMMENT ON COLUMN public.agency_settings.admin_granted_free IS 'Admin can grant full access without payment';
