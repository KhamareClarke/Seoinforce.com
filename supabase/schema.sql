-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
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

-- Projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, domain)
);

-- SEO Audits table
CREATE TABLE IF NOT EXISTS public.audits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  overall_score INTEGER,
  technical_score INTEGER,
  onpage_score INTEGER,
  content_score INTEGER,
  competitor_score INTEGER,
  raw_data JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Audit Issues table
CREATE TABLE IF NOT EXISTS public.audit_issues (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  audit_id UUID REFERENCES public.audits(id) ON DELETE CASCADE,
  issue_type TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('critical', 'warning', 'info', 'good')),
  title TEXT NOT NULL,
  description TEXT,
  fix_suggestion TEXT,
  page_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Keywords table
CREATE TABLE IF NOT EXISTS public.keywords (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  location TEXT DEFAULT 'United Kingdom',
  device_type TEXT DEFAULT 'desktop' CHECK (device_type IN ('desktop', 'mobile')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, keyword, location, device_type)
);

-- Keyword Rankings table
CREATE TABLE IF NOT EXISTS public.keyword_rankings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  keyword_id UUID REFERENCES public.keywords(id) ON DELETE CASCADE,
  rank INTEGER,
  url TEXT,
  title TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(keyword_id, date)
);

-- Competitors table
CREATE TABLE IF NOT EXISTS public.competitors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, domain)
);

-- Competitor Keywords table
CREATE TABLE IF NOT EXISTS public.competitor_keywords (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  competitor_id UUID REFERENCES public.competitors(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  rank INTEGER,
  search_volume INTEGER,
  difficulty INTEGER,
  url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Backlinks table
CREATE TABLE IF NOT EXISTS public.backlinks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  total_count INTEGER DEFAULT 0,
  domain_count INTEGER DEFAULT 0,
  anchor_text JSONB,
  last_checked TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Backlink History table
CREATE TABLE IF NOT EXISTS public.backlink_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  total_count INTEGER,
  domain_count INTEGER,
  gained INTEGER DEFAULT 0,
  lost INTEGER DEFAULT 0,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, date)
);

-- Local SEO data table
CREATE TABLE IF NOT EXISTS public.local_seo (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  business_name TEXT,
  address TEXT,
  phone TEXT,
  gmb_present BOOLEAN DEFAULT FALSE,
  gmb_url TEXT,
  review_count INTEGER DEFAULT 0,
  average_rating DECIMAL(2,1),
  nap_consistency_score INTEGER,
  local_rank INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reports table
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  audit_id UUID REFERENCES public.audits(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  pdf_url TEXT,
  share_token TEXT UNIQUE,
  white_label_branding JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Core Web Vitals History table
CREATE TABLE IF NOT EXISTS public.vitals_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  audit_id UUID REFERENCES public.audits(id) ON DELETE CASCADE,
  lcp DECIMAL(10,2),
  fcp DECIMAL(10,2),
  tti DECIMAL(10,2),
  cls DECIMAL(10,4),
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(audit_id, date)
);

-- API Usage tracking table
CREATE TABLE IF NOT EXISTS public.api_usage (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  api_type TEXT NOT NULL,
  endpoint TEXT,
  credits_used INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_audits_project_id ON public.audits(project_id);
CREATE INDEX IF NOT EXISTS idx_audits_status ON public.audits(status);
CREATE INDEX IF NOT EXISTS idx_audit_issues_audit_id ON public.audit_issues(audit_id);
CREATE INDEX IF NOT EXISTS idx_keywords_project_id ON public.keywords(project_id);
CREATE INDEX IF NOT EXISTS idx_keyword_rankings_keyword_id ON public.keyword_rankings(keyword_id);
CREATE INDEX IF NOT EXISTS idx_keyword_rankings_date ON public.keyword_rankings(date);
CREATE INDEX IF NOT EXISTS idx_competitors_project_id ON public.competitors(project_id);
CREATE INDEX IF NOT EXISTS idx_backlinks_project_id ON public.backlinks(project_id);
CREATE INDEX IF NOT EXISTS idx_local_seo_project_id ON public.local_seo(project_id);
CREATE INDEX IF NOT EXISTS idx_reports_share_token ON public.reports(share_token);
CREATE INDEX IF NOT EXISTS idx_api_usage_user_id ON public.api_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_created_at ON public.api_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON public.error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON public.error_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON public.error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON public.error_logs(resolved);

-- Row Level Security (RLS) Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keyword_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backlinks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backlink_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.local_seo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vitals_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can create own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Projects policies
DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;

CREATE POLICY "Users can view own projects" ON public.projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON public.projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON public.projects FOR DELETE USING (auth.uid() = user_id);

-- Audits policies
DROP POLICY IF EXISTS "Users can view own audits" ON public.audits;
DROP POLICY IF EXISTS "Users can create own audits" ON public.audits;
DROP POLICY IF EXISTS "Users can update own audits" ON public.audits;

CREATE POLICY "Users can view own audits" ON public.audits FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.projects WHERE projects.id = audits.project_id AND projects.user_id = auth.uid())
);
CREATE POLICY "Users can create own audits" ON public.audits FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.projects WHERE projects.id = audits.project_id AND projects.user_id = auth.uid())
);
CREATE POLICY "Users can update own audits" ON public.audits FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.projects WHERE projects.id = audits.project_id AND projects.user_id = auth.uid())
);

-- Audit Issues policies
DROP POLICY IF EXISTS "Users can view own audit issues" ON public.audit_issues;
DROP POLICY IF EXISTS "Users can insert own audit issues" ON public.audit_issues;

CREATE POLICY "Users can view own audit issues" ON public.audit_issues FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.audits 
    JOIN public.projects ON projects.id = audits.project_id 
    WHERE audits.id = audit_issues.audit_id AND projects.user_id = auth.uid()
  )
);
CREATE POLICY "Users can insert own audit issues" ON public.audit_issues FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.audits 
    JOIN public.projects ON projects.id = audits.project_id 
    WHERE audits.id = audit_issues.audit_id AND projects.user_id = auth.uid()
  )
);

-- Keywords policies
DROP POLICY IF EXISTS "Users can manage own keywords" ON public.keywords;

CREATE POLICY "Users can manage own keywords" ON public.keywords FOR ALL USING (
  EXISTS (SELECT 1 FROM public.projects WHERE projects.id = keywords.project_id AND projects.user_id = auth.uid())
);

-- Keyword Rankings policies
DROP POLICY IF EXISTS "Users can view own keyword rankings" ON public.keyword_rankings;

CREATE POLICY "Users can view own keyword rankings" ON public.keyword_rankings FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.keywords 
    JOIN public.projects ON projects.id = keywords.project_id 
    WHERE keywords.id = keyword_rankings.keyword_id AND projects.user_id = auth.uid()
  )
);

-- Competitors policies
DROP POLICY IF EXISTS "Users can manage own competitors" ON public.competitors;

CREATE POLICY "Users can manage own competitors" ON public.competitors FOR ALL USING (
  EXISTS (SELECT 1 FROM public.projects WHERE projects.id = competitors.project_id AND projects.user_id = auth.uid())
);

-- Backlinks policies
DROP POLICY IF EXISTS "Users can view own backlinks" ON public.backlinks;

CREATE POLICY "Users can view own backlinks" ON public.backlinks FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.projects WHERE projects.id = backlinks.project_id AND projects.user_id = auth.uid())
);

-- Local SEO policies
DROP POLICY IF EXISTS "Users can view own local SEO" ON public.local_seo;

CREATE POLICY "Users can view own local SEO" ON public.local_seo FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.projects WHERE projects.id = local_seo.project_id AND projects.user_id = auth.uid())
);

-- Reports policies
DROP POLICY IF EXISTS "Users can view own reports" ON public.reports;
DROP POLICY IF EXISTS "Users can create own reports" ON public.reports;
DROP POLICY IF EXISTS "Public can view reports by share token" ON public.reports;

CREATE POLICY "Users can view own reports" ON public.reports FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.projects WHERE projects.id = reports.project_id AND projects.user_id = auth.uid())
);
CREATE POLICY "Users can create own reports" ON public.reports FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.projects WHERE projects.id = reports.project_id AND projects.user_id = auth.uid())
);
CREATE POLICY "Public can view reports by share token" ON public.reports FOR SELECT USING (share_token IS NOT NULL);

-- API Usage policies
DROP POLICY IF EXISTS "Users can view own API usage" ON public.api_usage;

CREATE POLICY "Users can view own API usage" ON public.api_usage FOR SELECT USING (auth.uid() = user_id);

-- Vitals History policies
DROP POLICY IF EXISTS "Users can view own vitals history" ON public.vitals_history;
DROP POLICY IF EXISTS "Users can insert own vitals history" ON public.vitals_history;

CREATE POLICY "Users can view own vitals history" ON public.vitals_history FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.audits 
    JOIN public.projects ON projects.id = audits.project_id 
    WHERE audits.id = vitals_history.audit_id AND projects.user_id = auth.uid()
  )
);
CREATE POLICY "Users can insert own vitals history" ON public.vitals_history FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.audits 
    JOIN public.projects ON projects.id = audits.project_id 
    WHERE audits.id = vitals_history.audit_id AND projects.user_id = auth.uid()
  )
);

-- Function to check if user is admin (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND is_admin = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin policies (admins can view all data)
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

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
