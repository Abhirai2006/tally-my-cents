CREATE OR REPLACE FUNCTION public.owner_ledger_name(_user uuid)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  u auth.users%ROWTYPE;
  base text;
BEGIN
  SELECT * INTO u FROM auth.users WHERE id = _user;
  IF NOT FOUND THEN RETURN 'Shared ledger'; END IF;
  base := NULLIF(trim(COALESCE(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', '')), '');
  IF base IS NULL THEN
    base := split_part(COALESCE(u.email, 'someone'), '@', 1);
  END IF;
  RETURN base || '''s ledger';
END $$;

CREATE OR REPLACE FUNCTION public.ensure_default_ledger()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  uid uuid := auth.uid();
  lid uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT id INTO lid FROM public.ledgers WHERE owner_id = uid ORDER BY created_at LIMIT 1;
  IF lid IS NULL THEN
    INSERT INTO public.ledgers (owner_id, name)
    VALUES (uid, public.owner_ledger_name(uid)) RETURNING id INTO lid;
  END IF;
  INSERT INTO public.ledger_members (ledger_id, user_id, role)
  VALUES (lid, uid, 'owner') ON CONFLICT DO NOTHING;
  UPDATE public.transactions SET ledger_id = lid WHERE user_id = uid AND ledger_id IS NULL;
  RETURN lid;
END $$;

UPDATE public.ledgers
SET name = public.owner_ledger_name(owner_id)
WHERE name IN ('Personal ledger', 'Personal Ledger');

CREATE OR REPLACE FUNCTION public.ledgers_with_owner()
RETURNS TABLE(id uuid, owner_id uuid, name text, created_at timestamptz, owner_email text, owner_name text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT l.id, l.owner_id, l.name, l.created_at,
         u.email::text,
         NULLIF(trim(COALESCE(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', '')), '')
  FROM public.ledgers l
  JOIN auth.users u ON u.id = l.owner_id
  WHERE public.can_access_ledger(l.id, auth.uid())
  ORDER BY l.created_at;
$$;

REVOKE ALL ON FUNCTION public.owner_ledger_name(uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ledgers_with_owner() TO authenticated;