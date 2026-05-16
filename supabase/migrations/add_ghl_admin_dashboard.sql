-- Task 1.4: GHL admin dashboard logs (API, workflows, contact sync)

CREATE TABLE IF NOT EXISTS public.ghl_api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation TEXT NOT NULL,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  status_code INT,
  duration_ms INT,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ghl_api_logs_created_at ON public.ghl_api_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ghl_api_logs_operation ON public.ghl_api_logs(operation);

CREATE TABLE IF NOT EXISTS public.ghl_workflow_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  workflow_key TEXT,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  email TEXT,
  http_status INT,
  success BOOLEAN NOT NULL DEFAULT false,
  error TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ghl_workflow_logs_created_at ON public.ghl_workflow_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ghl_workflow_logs_event ON public.ghl_workflow_logs(event_type);

CREATE TABLE IF NOT EXISTS public.ghl_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  email TEXT,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'skipped')),
  error TEXT,
  contact_id TEXT,
  trigger TEXT DEFAULT 'auto',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ghl_sync_logs_created_at ON public.ghl_sync_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ghl_sync_logs_status ON public.ghl_sync_logs(status);

ALTER TABLE public.ghl_api_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ghl_workflow_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ghl_sync_logs ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.ghl_api_logs IS 'GHL REST API call audit (service role only)';
COMMENT ON TABLE public.ghl_workflow_logs IS 'Inbound workflow webhook emits from SEOinforce';
COMMENT ON TABLE public.ghl_sync_logs IS 'Contact sync attempts to GHL';
