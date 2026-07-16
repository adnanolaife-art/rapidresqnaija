
CREATE OR REPLACE FUNCTION public.block_suspended_incident()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.citizen_id AND suspended) THEN
    RAISE EXCEPTION 'Account is suspended';
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.block_suspended_incident() FROM PUBLIC, anon, authenticated;
