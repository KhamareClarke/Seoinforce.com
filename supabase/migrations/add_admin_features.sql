-- Migration: Add admin features and error logs
-- Run this in your Supabase SQL editor

-- Add admin and ban columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS banned_reason TEXT,
ADD COLUMN IF NOT EXISTS banned_at TIMESTAMP WITH TIME ZONE;

-- Create error_logs table
CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  endpoint TEXT,
  request_data JSONB,
  severity TEXT DEFAULT 'error' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON public.error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON public.error_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON public.error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON public.error_logs(resolved);

-- Enable RLS
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Add INSERT policy for profiles (users can create their own profile)
DROP POLICY IF EXISTS "Users can create own profile" ON public.profiles;
CREATE POLICY "Users can create own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Function to check if user is admin (bypasses RLS to prevent infinite recursion)
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND is_admin = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin policies (using the function to avoid infinite recursion)
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (
  public.is_admin(auth.uid())
);

CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (
  public.is_admin(auth.uid())
);

CREATE POLICY "Admins can view all audits" ON public.audits FOR SELECT USING (
  public.is_admin(auth.uid())
);

CREATE POLICY "Admins can view all projects" ON public.projects FOR SELECT USING (
  public.is_admin(auth.uid())
);

CREATE POLICY "Admins can view all API usage" ON public.api_usage FOR SELECT USING (
  public.is_admin(auth.uid())
);

CREATE POLICY "Admins can view all error logs" ON public.error_logs FOR SELECT USING (
  public.is_admin(auth.uid())
);

CREATE POLICY "Admins can update error logs" ON public.error_logs FOR UPDATE USING (
  public.is_admin(auth.uid())
);

-- Helper function to make a user admin (replace 'user-email@example.com' with actual email)
-- UPDATE public.profiles SET is_admin = TRUE WHERE email = 'user-email@example.com';