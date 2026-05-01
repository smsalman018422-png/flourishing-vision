
-- 1. Purchase requests table
CREATE TABLE IF NOT EXISTS public.package_purchase_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly','yearly')),
  amount INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','cancelled')),
  stripe_session_id TEXT,
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','paid','refunded','failed')),
  notes TEXT,
  approved_membership_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ppr_client ON public.package_purchase_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_ppr_status ON public.package_purchase_requests(status);

ALTER TABLE public.package_purchase_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients view own purchase requests"
  ON public.package_purchase_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = client_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients create own purchase requests"
  ON public.package_purchase_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients cancel own pending requests"
  ON public.package_purchase_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = client_id AND status = 'pending')
  WITH CHECK (auth.uid() = client_id AND status IN ('pending','cancelled'));

CREATE POLICY "Admins manage purchase requests"
  ON public.package_purchase_requests FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_ppr_updated_at
  BEFORE UPDATE ON public.package_purchase_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.package_purchase_requests;
ALTER TABLE public.package_purchase_requests REPLICA IDENTITY FULL;

-- 2. client_memberships extensions
ALTER TABLE public.client_memberships
  ADD COLUMN IF NOT EXISTS package_id UUID REFERENCES public.packages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_custom BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS custom_name TEXT,
  ADD COLUMN IF NOT EXISTS custom_features JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ALTER COLUMN plan_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cm_package ON public.client_memberships(package_id);
CREATE INDEX IF NOT EXISTS idx_cm_client_status ON public.client_memberships(client_id, status);

DROP TRIGGER IF EXISTS trg_cm_updated_at ON public.client_memberships;
CREATE TRIGGER trg_cm_updated_at
  BEFORE UPDATE ON public.client_memberships
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'client_memberships'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.client_memberships';
  END IF;
END $$;
ALTER TABLE public.client_memberships REPLICA IDENTITY FULL;
