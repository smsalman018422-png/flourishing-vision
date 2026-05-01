ALTER TABLE public.client_profiles
ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_client_profiles_is_active ON public.client_profiles (is_active);