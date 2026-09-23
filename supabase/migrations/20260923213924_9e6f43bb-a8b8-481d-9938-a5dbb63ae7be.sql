CREATE POLICY "No direct user access to contact messages"
ON public.contact_messages
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);