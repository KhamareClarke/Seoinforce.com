-- Add missing INSERT policy for audit_issues table
-- This allows issues to be saved to the database

DROP POLICY IF EXISTS "Users can insert own audit issues" ON public.audit_issues;

CREATE POLICY "Users can insert own audit issues" ON public.audit_issues FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.audits 
    JOIN public.projects ON projects.id = audits.project_id 
    WHERE audits.id = audit_issues.audit_id AND projects.user_id = auth.uid()
  )
);
