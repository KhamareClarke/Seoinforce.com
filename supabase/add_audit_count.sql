-- Add audit_count column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS audit_count INTEGER DEFAULT 0;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_audit_count ON public.users(audit_count);
