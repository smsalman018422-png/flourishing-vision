CREATE TABLE IF NOT EXISTS public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  short_description text NOT NULL,
  long_description text,
  icon_name text NOT NULL DEFAULT 'Sparkles',
  features text[] NOT NULL DEFAULT '{}',
  process jsonb NOT NULL DEFAULT '[]'::jsonb,
  packages jsonb NOT NULL DEFAULT '[]'::jsonb,
  starts_at_price integer,
  service_type text,
  order_index integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS services_visible_order_idx
  ON public.services (is_visible, order_index);

CREATE TRIGGER services_set_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Visible services are viewable by everyone"
  ON public.services FOR SELECT
  USING (is_visible = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert services"
  ON public.services FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update services"
  ON public.services FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete services"
  ON public.services FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add service_type column to portfolio for related-case-studies lookup
ALTER TABLE public.portfolio
  ADD COLUMN IF NOT EXISTS service_type text;
CREATE INDEX IF NOT EXISTS portfolio_service_type_idx
  ON public.portfolio (service_type);