-- Phase 2: advanced rank SERP snapshots + link opportunity runs

CREATE TABLE IF NOT EXISTS public.keyword_serp_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword_id UUID NOT NULL REFERENCES public.keywords(id) ON DELETE CASCADE,
  device_type TEXT NOT NULL DEFAULT 'desktop',
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  organic_position INTEGER,
  serp_features JSONB NOT NULL DEFAULT '{}',
  volatility_score NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (keyword_id, device_type, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_keyword_serp_snapshots_keyword ON public.keyword_serp_snapshots(keyword_id, snapshot_date DESC);

CREATE TABLE IF NOT EXISTS public.link_opportunity_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  your_domain TEXT NOT NULL,
  competitor_domain TEXT,
  opportunities JSONB NOT NULL DEFAULT '[]',
  summary JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_link_opportunity_runs_project ON public.link_opportunity_runs(project_id, created_at DESC);

ALTER TABLE public.keyword_serp_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.link_opportunity_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage SERP snapshots for own keywords"
  ON public.keyword_serp_snapshots FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.keywords k
      JOIN public.projects p ON p.id = k.project_id
      WHERE k.id = keyword_serp_snapshots.keyword_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users manage link opportunities for own projects"
  ON public.link_opportunity_runs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = link_opportunity_runs.project_id AND p.user_id = auth.uid()
    )
  );
