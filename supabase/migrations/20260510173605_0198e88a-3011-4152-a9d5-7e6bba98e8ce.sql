
ALTER TABLE public.client_memberships
  ADD COLUMN IF NOT EXISTS is_trial boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS trial_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;

ALTER TABLE public.client_profiles
  ADD COLUMN IF NOT EXISTS facebook_url text,
  ADD COLUMN IF NOT EXISTS instagram_handle text,
  ADD COLUMN IF NOT EXISTS trial_source text;

INSERT INTO public.site_settings (key, value) VALUES
  ('google_sheets_webhook_url', '{"value":""}'::jsonb),
  ('landing_page_enabled', '{"value":"true"}'::jsonb),
  ('landing_page_headline', '{"value":"Scale Your Brand Risk-Free for 7 Days"}'::jsonb),
  ('landing_page_subhead', '{"value":"Experience premium social media growth, content strategy, and performance marketing completely free for 7 days. Zero risk. Real results."}'::jsonb)
ON CONFLICT (key) DO NOTHING;
