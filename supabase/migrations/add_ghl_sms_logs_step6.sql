-- Step 6: richer SMS audit trail (masked phone, delivery updates from webhooks)
ALTER TABLE public.ghl_sms_logs ADD COLUMN IF NOT EXISTS phone_masked TEXT;
ALTER TABLE public.ghl_sms_logs ADD COLUMN IF NOT EXISTS delivery_status TEXT;
ALTER TABLE public.ghl_sms_logs ADD COLUMN IF NOT EXISTS retry_attempts SMALLINT DEFAULT 0;
ALTER TABLE public.ghl_sms_logs ADD COLUMN IF NOT EXISTS raw_webhook JSONB;

CREATE INDEX IF NOT EXISTS idx_ghl_sms_logs_ghl_message_id ON public.ghl_sms_logs(ghl_message_id);
CREATE INDEX IF NOT EXISTS idx_ghl_sms_logs_delivery_status ON public.ghl_sms_logs(delivery_status);
