-- Fix API Usage and Error Logs tables to reference users table instead of profiles
-- Run this in your Supabase SQL Editor

-- First, clean up any orphaned records that reference non-existent users
-- (These would be from the old profiles table)
DELETE FROM public.api_usage 
WHERE user_id NOT IN (SELECT id FROM public.users);

DELETE FROM public.error_logs 
WHERE user_id IS NOT NULL 
  AND user_id NOT IN (SELECT id FROM public.users);

-- Drop the foreign key constraint on api_usage
ALTER TABLE public.api_usage DROP CONSTRAINT IF EXISTS api_usage_user_id_fkey;

-- Update api_usage to reference users table
ALTER TABLE public.api_usage 
  ADD CONSTRAINT api_usage_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Add updated_at column if it doesn't exist
ALTER TABLE public.error_logs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Drop the foreign key constraint on error_logs (if it exists)
ALTER TABLE public.error_logs DROP CONSTRAINT IF EXISTS error_logs_user_id_fkey;
ALTER TABLE public.error_logs DROP CONSTRAINT IF EXISTS error_logs_resolved_by_fkey;

-- Update error_logs to reference users table
ALTER TABLE public.error_logs 
  ADD CONSTRAINT error_logs_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- Update resolved_by to reference users table
ALTER TABLE public.error_logs 
  ADD CONSTRAINT error_logs_resolved_by_fkey 
  FOREIGN KEY (resolved_by) REFERENCES public.users(id) ON DELETE SET NULL;

-- Verify the changes
SELECT 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('api_usage', 'error_logs');
