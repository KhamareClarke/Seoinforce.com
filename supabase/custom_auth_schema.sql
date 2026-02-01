-- Custom Authentication Schema (No Supabase Auth dependency)
-- Run this in your Supabase SQL Editor to create the custom users table

-- Custom Users table (replaces Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  company_name TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  verification_token TEXT,
  verification_token_expires TIMESTAMP WITH TIME ZONE,
  reset_token TEXT,
  reset_token_expires TIMESTAMP WITH TIME ZONE,
  plan_type TEXT DEFAULT 'free' CHECK (plan_type IN ('free', 'starter', 'growth', 'empire')),
  api_credits INTEGER DEFAULT 100,
  is_admin BOOLEAN DEFAULT FALSE,
  is_banned BOOLEAN DEFAULT FALSE,
  banned_reason TEXT,
  banned_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON public.users(verification_token);
CREATE INDEX IF NOT EXISTS idx_users_audit_count ON public.users(audit_count);

-- Add audit_count column if it doesn't exist (for existing databases)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS audit_count INTEGER DEFAULT 0;

-- Update profiles table to reference custom users instead of auth.users
-- First, drop the old profiles table if it exists and recreate it
DROP TABLE IF EXISTS public.profiles CASCADE;

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  company_name TEXT,
  plan_type TEXT DEFAULT 'free' CHECK (plan_type IN ('free', 'starter', 'growth', 'empire')),
  api_credits INTEGER DEFAULT 100,
  is_admin BOOLEAN DEFAULT FALSE,
  is_banned BOOLEAN DEFAULT FALSE,
  banned_reason TEXT,
  banned_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update projects table to reference custom users
-- Note: This will need to be run after migrating existing data
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_user_id_fkey;
ALTER TABLE public.projects ADD CONSTRAINT projects_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
DROP POLICY IF EXISTS "Users can view own user record" ON public.users;
CREATE POLICY "Users can view own user record" ON public.users 
  FOR SELECT USING (true); -- Will be filtered by session in API

DROP POLICY IF EXISTS "Users can update own user record" ON public.users;
CREATE POLICY "Users can update own user record" ON public.users 
  FOR UPDATE USING (true); -- Will be filtered by session in API

-- Function to auto-create profile when user is created
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, company_name, plan_type, api_credits, is_admin)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.full_name,
    NEW.company_name,
    NEW.plan_type,
    NEW.api_credits,
    NEW.is_admin
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user creation
DROP TRIGGER IF EXISTS on_user_created ON public.users;
CREATE TRIGGER on_user_created
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
