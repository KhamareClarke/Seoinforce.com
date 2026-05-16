-- Task 2.1: persisted competitor intelligence snapshots
CREATE TABLE IF NOT EXISTS public.competitor_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  competitor_id UUID REFERENCES public.competitors(id) ON DELETE CASCADE,
  your_domain TEXT NOT NULL,
  competitor_domain TEXT NOT NULL,
  analysis_date DATE NOT NULL DEFAULT CURRENT_DATE,
  keyword_overlap JSONB NOT NULL DEFAULT '{}',
  backlink_gaps JSONB NOT NULL DEFAULT '{}',
  serp_features JSONB NOT NULL DEFAULT '{}',
  rank_comparisons JSONB NOT NULL DEFAULT '{}',
  content_strategy JSONB NOT NULL DEFAULT '{}',
  overall_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_competitor_analysis_project ON public.competitor_analysis(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_competitor_analysis_competitor ON public.competitor_analysis(competitor_id, created_at DESC);

ALTER TABLE public.competitor_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage competitor analysis for own projects"
  ON public.competitor_analysis FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = competitor_analysis.project_id AND p.user_id = auth.uid()
    )
  );
