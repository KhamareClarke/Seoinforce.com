-- Migration: Add INSERT policy for profiles table
-- Run this in your Supabase SQL editor if you're getting "Failed to create profile" errors

-- Add INSERT policy for profiles (users can create their own profile)
DROP POLICY IF EXISTS "Users can create own profile" ON public.profiles;
CREATE POLICY "Users can create own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
