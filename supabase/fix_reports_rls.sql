-- Fix Reports RLS Policy - Add INSERT policy
-- Run this in your Supabase SQL Editor

DROP POLICY IF EXISTS "Users can create own reports" ON public.reports;

CREATE POLICY "Users can create own reports" ON public.reports FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.projects WHERE projects.id = reports.project_id AND projects.user_id = auth.uid())
);
