-- Track last activity for GHL sync and analytics
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_last_active_at ON public.users(last_active_at DESC);
