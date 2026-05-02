ALTER TABLE public.package_purchase_requests
  ADD CONSTRAINT package_purchase_requests_client_profile_fkey
  FOREIGN KEY (client_id) REFERENCES public.client_profiles(id) ON DELETE CASCADE;