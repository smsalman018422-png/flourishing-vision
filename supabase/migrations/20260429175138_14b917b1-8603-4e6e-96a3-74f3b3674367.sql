
CREATE TABLE IF NOT EXISTS public.portfolio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name text NOT NULL,
  project_title text NOT NULL,
  category text NOT NULL,
  cover_image_url text,
  before_image_url text,
  after_image_url text,
  roi_pct integer,
  revenue_label text,
  growth_pct integer,
  challenge text,
  solution text,
  results text,
  testimonial_quote text,
  testimonial_author text,
  testimonial_role text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.portfolio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Portfolio is viewable by everyone"
  ON public.portfolio FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert portfolio"
  ON public.portfolio FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update portfolio"
  ON public.portfolio FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete portfolio"
  ON public.portfolio FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS portfolio_category_idx ON public.portfolio(category);
CREATE INDEX IF NOT EXISTS portfolio_sort_idx ON public.portfolio(sort_order);
