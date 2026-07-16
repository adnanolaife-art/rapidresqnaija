
-- 1. Suspension flag on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspended boolean NOT NULL DEFAULT false;

-- 2. Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid REFERENCES auth.users(id) ON DELETE CASCADE, -- null = broadcast
  target_role public.app_role, -- optional broadcast scope
  subject text,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 4000),
  is_broadcast boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_recipient_idx ON public.messages(recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS messages_sender_idx ON public.messages(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS messages_broadcast_idx ON public.messages(is_broadcast, created_at DESC) WHERE is_broadcast;

GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Admin sees everything
CREATE POLICY "admin reads all messages" ON public.messages
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Users read direct messages addressed to them, or broadcasts they qualify for
CREATE POLICY "recipients read their direct messages" ON public.messages
  FOR SELECT TO authenticated
  USING (recipient_id = auth.uid());

CREATE POLICY "authenticated read qualifying broadcasts" ON public.messages
  FOR SELECT TO authenticated
  USING (
    is_broadcast
    AND (target_role IS NULL OR public.has_role(auth.uid(), target_role))
  );

-- Admins can send anything
CREATE POLICY "admin sends any message" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND public.has_role(auth.uid(), 'admin')
  );

-- Non-admin users can send only 1:1 direct messages to an admin (support)
CREATE POLICY "users message admins" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND NOT is_broadcast
    AND recipient_id IS NOT NULL
    AND public.has_role(recipient_id, 'admin')
  );

-- Recipients can mark their own messages read
CREATE POLICY "recipients update read state" ON public.messages
  FOR UPDATE TO authenticated
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

CREATE POLICY "admin updates messages" ON public.messages
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. Admin can read all profiles + user_roles (for user management)
DROP POLICY IF EXISTS "admin reads all profiles" ON public.profiles;
CREATE POLICY "admin reads all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "admin updates all profiles" ON public.profiles;
CREATE POLICY "admin updates all profiles" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "admin reads all roles" ON public.user_roles;
CREATE POLICY "admin reads all roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "admin manages roles" ON public.user_roles;
CREATE POLICY "admin manages roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. Enable realtime on messages + incidents
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.incidents REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.incidents;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- 5. Trigger to block suspended users from creating incidents
CREATE OR REPLACE FUNCTION public.block_suspended_incident()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.citizen_id AND suspended) THEN
    RAISE EXCEPTION 'Account is suspended';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_block_suspended_incident ON public.incidents;
CREATE TRIGGER trg_block_suspended_incident
  BEFORE INSERT ON public.incidents
  FOR EACH ROW EXECUTE FUNCTION public.block_suspended_incident();
