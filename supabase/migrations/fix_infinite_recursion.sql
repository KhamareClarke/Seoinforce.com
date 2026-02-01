-- Migration: Fix infinite recursion in profiles RLS policies
-- Run this in your Supabase SQL editor to fix the "infinite recursion detected" error

-- Drop existing admin policies that cause recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all audits" ON public.audits;
DROP POLICY IF EXISTS "Admins can view all projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can view all API usage" ON public.api_usage;
DROP POLICY IF EXISTS "Admins can view all error logs" ON public.error_logs;
DROP POLICY IF EXISTS "Admins can update error logs" ON public.error_logs;

-- Create function to check if user is admin (bypasses RLS to prevent infinite recursion)
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND is_admin = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate admin policies using the function (avoids infinite recursion)
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
