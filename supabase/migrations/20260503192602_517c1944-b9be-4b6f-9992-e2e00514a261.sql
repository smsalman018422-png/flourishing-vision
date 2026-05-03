
-- Add payment metadata columns to client_memberships
ALTER TABLE public.client_memberships
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS transaction_id text,
  ADD COLUMN IF NOT EXISTS note text,
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'awaiting';

-- Allow null start_date until admin approves
ALTER TABLE public.client_memberships ALTER COLUMN start_date DROP NOT NULL;
ALTER TABLE public.client_memberships ALTER COLUMN start_date DROP DEFAULT;

-- Allow clients to create their own membership purchase requests
DROP POLICY IF EXISTS "Clients create own memberships" ON public.client_memberships;
CREATE POLICY "Clients create own memberships"
  ON public.client_memberships
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = client_id);
