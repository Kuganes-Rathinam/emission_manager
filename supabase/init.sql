-- Create the emissions table
CREATE TABLE IF NOT EXISTS public.emissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  device_id text NOT NULL,
  co2_level integer NOT NULL CHECK (co2_level > 0)
);

-- Enable Supabase Realtime for this table
-- We drop the publication if it exists to make this script idempotent, then recreate it.
DROP PUBLICATION IF EXISTS supabase_realtime CASCADE;
CREATE PUBLICATION supabase_realtime FOR TABLE public.emissions;

-- Set up Row Level Security (RLS) policies
-- Enable RLS on the table
ALTER TABLE public.emissions ENABLE ROW LEVEL SECURITY;

-- 1. Allow anonymous inserts (so ESP32 can POST data without an authenticated user)
CREATE POLICY "Allow anonymous inserts"
ON public.emissions
FOR INSERT
TO anon
WITH CHECK (true);

-- 2. Allow anonymous reads (so Next.js frontend can fetch history and listen to Realtime without Auth)
CREATE POLICY "Allow anonymous reads"
ON public.emissions
FOR SELECT
TO anon
USING (true);

-- Note: Update and Delete are restricted by default since RLS is enabled and no policies are created for them.
