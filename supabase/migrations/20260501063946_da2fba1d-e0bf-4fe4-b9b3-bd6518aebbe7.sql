CREATE OR REPLACE FUNCTION public.assign_ticket_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Always generate server-side; ignore client-provided value
  NEW.ticket_number := 'TKT-' || LPAD(nextval('public.ticket_number_seq')::text, 5, '0');
  RETURN NEW;
END;
$$;