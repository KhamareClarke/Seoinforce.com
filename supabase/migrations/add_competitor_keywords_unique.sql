-- Required for competitor keyword upsert + rank change tracking
CREATE UNIQUE INDEX IF NOT EXISTS idx_competitor_keywords_competitor_keyword
  ON public.competitor_keywords (competitor_id, keyword);
