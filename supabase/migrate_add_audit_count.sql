-- Migration: Add audit_count column to users table
-- Run this in your Supabase SQL Editor if you get "Failed to update audit count" errors

-- Add audit_count column if it doesn't exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS audit_count INTEGER DEFAULT 0;

-- Set default value for existing rows
UPDATE public.users SET audit_count = 0 WHERE audit_count IS NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_audit_count ON public.users(audit_count);

-- Verify the column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'users' 
  AND column_name = 'audit_count';
