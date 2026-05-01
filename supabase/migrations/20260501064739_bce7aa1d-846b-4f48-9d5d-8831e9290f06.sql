-- Extend membership_plans with yearly price
ALTER TABLE public.membership_plans
  ADD COLUMN IF NOT EXISTS price_yearly INTEGER NOT NULL DEFAULT 0;

-- Extend client_memberships with billing fields
ALTER TABLE public.client_memberships
  ADD COLUMN IF NOT EXISTS billing_cycle TEXT NOT NULL DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS amount INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- client_profiles email (cached from auth) for easy admin listing
ALTER TABLE public.client_profiles
  ADD COLUMN IF NOT EXISTS email TEXT;

-- Ensure realtime for tickets and ticket messages
ALTER TABLE public.client_tickets REPLICA IDENTITY FULL;
ALTER TABLE public.client_ticket_messages REPLICA IDENTITY FULL;

DO $$ BEGIN
  PERFORM 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='client_tickets';
  IF NOT FOUND THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.client_tickets';
  END IF;
  PERFORM 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='client_ticket_messages';
  IF NOT FOUND THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.client_ticket_messages';
  END IF;
END $$;