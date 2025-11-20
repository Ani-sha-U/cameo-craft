-- Create render jobs table to persist job status
CREATE TABLE public.render_jobs (
  id TEXT PRIMARY KEY,
  format TEXT NOT NULL,
  status TEXT NOT NULL,
  progress INTEGER DEFAULT 0,
  step TEXT DEFAULT '',
  output_url TEXT,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.render_jobs ENABLE ROW LEVEL SECURITY;

-- Allow anyone to create and read render jobs (since verify_jwt is false)
CREATE POLICY "Anyone can create render jobs"
  ON public.render_jobs
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can read render jobs"
  ON public.render_jobs
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can update render jobs"
  ON public.render_jobs
  FOR UPDATE
  USING (true);