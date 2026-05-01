REVOKE ALL ON FUNCTION public.is_ticket_owner(UUID, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_ticket_owner(UUID, UUID) TO postgres, service_role;