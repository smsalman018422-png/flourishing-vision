-- 1. Sequence + columns on client_tickets
CREATE SEQUENCE IF NOT EXISTS public.ticket_number_seq START 10001;

ALTER TABLE public.client_tickets
  ADD COLUMN IF NOT EXISTS ticket_number TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS project_id UUID,
  ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ NOT NULL DEFAULT now();

UPDATE public.client_tickets
SET ticket_number = 'TKT-' || LPAD(nextval('public.ticket_number_seq')::text, 5, '0')
WHERE ticket_number IS NULL;

ALTER TABLE public.client_tickets
  ALTER COLUMN ticket_number SET NOT NULL;

CREATE OR REPLACE FUNCTION public.assign_ticket_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.ticket_number IS NULL THEN
    NEW.ticket_number := 'TKT-' || LPAD(nextval('public.ticket_number_seq')::text, 5, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_ticket_number ON public.client_tickets;
CREATE TRIGGER set_ticket_number
  BEFORE INSERT ON public.client_tickets
  FOR EACH ROW EXECUTE FUNCTION public.assign_ticket_number();

-- 2. Messages table
CREATE TABLE IF NOT EXISTS public.client_ticket_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.client_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('client', 'admin')),
  message TEXT,
  file_url TEXT,
  file_name TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket
  ON public.client_ticket_messages(ticket_id, created_at);

ALTER TABLE public.client_ticket_messages ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_ticket_owner(_ticket_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.client_tickets
    WHERE id = _ticket_id AND client_id = _user_id
  )
$$;

DROP POLICY IF EXISTS "View messages on own tickets" ON public.client_ticket_messages;
CREATE POLICY "View messages on own tickets"
  ON public.client_ticket_messages FOR SELECT TO authenticated
  USING (public.is_ticket_owner(ticket_id, auth.uid()) OR has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Clients post messages to own tickets" ON public.client_ticket_messages;
CREATE POLICY "Clients post messages to own tickets"
  ON public.client_ticket_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_type = 'client'
    AND sender_id = auth.uid()
    AND public.is_ticket_owner(ticket_id, auth.uid())
  );

DROP POLICY IF EXISTS "Admins manage messages" ON public.client_ticket_messages;
CREATE POLICY "Admins manage messages"
  ON public.client_ticket_messages FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Clients mark own ticket messages read" ON public.client_ticket_messages;
CREATE POLICY "Clients mark own ticket messages read"
  ON public.client_ticket_messages FOR UPDATE TO authenticated
  USING (public.is_ticket_owner(ticket_id, auth.uid()))
  WITH CHECK (public.is_ticket_owner(ticket_id, auth.uid()));

-- 3. Bump last_message_at on insert
CREATE OR REPLACE FUNCTION public.bump_ticket_last_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE public.client_tickets
  SET last_message_at = NEW.created_at,
      updated_at = NEW.created_at
  WHERE id = NEW.ticket_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bump_ticket_on_message ON public.client_ticket_messages;
CREATE TRIGGER bump_ticket_on_message
  AFTER INSERT ON public.client_ticket_messages
  FOR EACH ROW EXECUTE FUNCTION public.bump_ticket_last_message();

-- 4. Realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'client_ticket_messages'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.client_ticket_messages';
  END IF;
END $$;

ALTER TABLE public.client_ticket_messages REPLICA IDENTITY FULL;

-- 5. Storage bucket + policies
INSERT INTO storage.buckets (id, name, public)
VALUES ('ticket-attachments', 'ticket-attachments', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Clients read own ticket attachments" ON storage.objects;
CREATE POLICY "Clients read own ticket attachments"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'ticket-attachments'
    AND (auth.uid()::text = (storage.foldername(name))[1] OR has_role(auth.uid(), 'admin'))
  );

DROP POLICY IF EXISTS "Clients upload own ticket attachments" ON storage.objects;
CREATE POLICY "Clients upload own ticket attachments"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'ticket-attachments'
    AND (auth.uid()::text = (storage.foldername(name))[1] OR has_role(auth.uid(), 'admin'))
  );

DROP POLICY IF EXISTS "Admins manage ticket attachments" ON storage.objects;
CREATE POLICY "Admins manage ticket attachments"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'ticket-attachments' AND has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'ticket-attachments' AND has_role(auth.uid(), 'admin'));