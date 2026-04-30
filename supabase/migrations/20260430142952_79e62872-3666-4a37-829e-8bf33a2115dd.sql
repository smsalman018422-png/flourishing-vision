DROP POLICY IF EXISTS "Anyone can submit contact form" ON public.contact_submissions;
CREATE POLICY "Anyone can submit valid contact form"
ON public.contact_submissions
FOR INSERT
TO anon, authenticated
WITH CHECK (
  char_length(trim(full_name)) BETWEEN 1 AND 200
  AND char_length(trim(email)) BETWEEN 3 AND 320
  AND email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
  AND (phone IS NULL OR char_length(phone) <= 80)
  AND (company IS NULL OR char_length(company) <= 200)
  AND (service IS NULL OR char_length(service) <= 120)
  AND (budget IS NULL OR char_length(budget) <= 120)
  AND (message IS NULL OR char_length(message) <= 5000)
);

DROP POLICY IF EXISTS "Anyone can subscribe" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe with valid email"
ON public.newsletter_subscribers
FOR INSERT
TO anon, authenticated
WITH CHECK (
  char_length(trim(email)) BETWEEN 3 AND 320
  AND email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
);