ALTER TABLE public.portfolio
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS gallery_images text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS is_visible boolean NOT NULL DEFAULT true;

UPDATE public.portfolio
SET slug = lower(regexp_replace(project_title || '-' || substr(id::text, 1, 6), '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS portfolio_slug_idx ON public.portfolio(slug);