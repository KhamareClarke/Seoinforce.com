-- Add brand support to users table
-- Run this in your Supabase SQL Editor

-- Add account_type column (personal or brand)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'personal' CHECK (account_type IN ('personal', 'brand'));

-- Add brand_name column
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS brand_name TEXT;

-- Add brand_website column (optional)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS brand_website TEXT;

-- Update plan_type to include 'brand' plan
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_plan_type_check;
ALTER TABLE public.users ADD CONSTRAINT users_plan_type_check 
  CHECK (plan_type IN ('free', 'starter', 'growth', 'empire', 'brand'));

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_account_type ON public.users(account_type);
CREATE INDEX IF NOT EXISTS idx_users_brand_name ON public.users(brand_name);

-- Verify the columns were added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
  AND column_name IN ('account_type', 'brand_name', 'brand_website');
