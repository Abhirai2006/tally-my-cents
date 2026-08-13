
-- ========== LEDGERS ==========
CREATE TABLE public.ledgers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Personal ledger',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ledgers TO authenticated;
GRANT ALL ON public.ledgers TO service_role;
ALTER TABLE public.ledgers ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.ledger_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ledger_id uuid NOT NULL REFERENCES public.ledgers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'editor' CHECK (role IN ('owner','editor')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ledger_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ledger_members TO authenticated;
GRANT ALL ON public.ledger_members TO service_role;
ALTER TABLE public.ledger_members ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.ledger_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ledger_id uuid NOT NULL REFERENCES public.ledgers(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  revoked boolean NOT NULL DEFAULT false
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ledger_invites TO authenticated;
GRANT ALL ON public.ledger_invites TO service_role;
ALTER TABLE public.ledger_invites ENABLE ROW LEVEL SECURITY;

-- ========== HELPERS (security definer, avoid RLS recursion) ==========
CREATE OR REPLACE FUNCTION public.is_ledger_owner(_ledger uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.ledgers l WHERE l.id = _ledger AND l.owner_id = _user);
$$;

CREATE OR REPLACE FUNCTION public.can_access_ledger(_ledger uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.ledgers l WHERE l.id = _ledger AND l.owner_id = _user)
      OR EXISTS (SELECT 1 FROM public.ledger_members m WHERE m.ledger_id = _ledger AND m.user_id = _user);
$$;

REVOKE EXECUTE ON FUNCTION public.is_ledger_owner(uuid, uuid) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.can_access_ledger(uuid, uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.is_ledger_owner(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_access_ledger(uuid, uuid) TO authenticated, service_role;

-- ========== POLICIES ==========
CREATE POLICY "read accessible ledgers" ON public.ledgers FOR SELECT TO authenticated
  USING (public.can_access_ledger(id, auth.uid()));
CREATE POLICY "create own ledger" ON public.ledgers FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());
CREATE POLICY "owner updates ledger" ON public.ledgers FOR UPDATE TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "owner deletes ledger" ON public.ledgers FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "read members of my ledgers" ON public.ledger_members FOR SELECT TO authenticated
  USING (public.can_access_ledger(ledger_id, auth.uid()));
CREATE POLICY "owner adds members" ON public.ledger_members FOR INSERT TO authenticated
  WITH CHECK (public.is_ledger_owner(ledger_id, auth.uid()));
CREATE POLICY "owner removes members or self leaves" ON public.ledger_members FOR DELETE TO authenticated
  USING (public.is_ledger_owner(ledger_id, auth.uid()) OR user_id = auth.uid());

CREATE POLICY "owner reads invites" ON public.ledger_invites FOR SELECT TO authenticated
  USING (public.is_ledger_owner(ledger_id, auth.uid()));
CREATE POLICY "owner creates invites" ON public.ledger_invites FOR INSERT TO authenticated
  WITH CHECK (public.is_ledger_owner(ledger_id, auth.uid()) AND created_by = auth.uid());
CREATE POLICY "owner revokes invites" ON public.ledger_invites FOR UPDATE TO authenticated
  USING (public.is_ledger_owner(ledger_id, auth.uid()))
  WITH CHECK (public.is_ledger_owner(ledger_id, auth.uid()));
CREATE POLICY "owner deletes invites" ON public.ledger_invites FOR DELETE TO authenticated
  USING (public.is_ledger_owner(ledger_id, auth.uid()));

-- ========== BACKFILL ==========
INSERT INTO public.ledgers (owner_id, name)
SELECT DISTINCT u.id, 'Personal ledger' FROM auth.users u;

INSERT INTO public.ledger_members (ledger_id, user_id, role)
SELECT l.id, l.owner_id, 'owner' FROM public.ledgers l
ON CONFLICT DO NOTHING;

ALTER TABLE public.transactions ADD COLUMN ledger_id uuid REFERENCES public.ledgers(id) ON DELETE CASCADE;
UPDATE public.transactions t
SET ledger_id = l.id
FROM public.ledgers l
WHERE l.owner_id = t.user_id AND t.ledger_id IS NULL;
CREATE INDEX idx_transactions_ledger ON public.transactions(ledger_id, occurred_on DESC);

-- ========== TRANSACTION POLICIES ==========
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='transactions' LOOP
    EXECUTE format('DROP POLICY %I ON public.transactions', p.policyname);
  END LOOP;
END $$;

CREATE POLICY "ledger members read entries" ON public.transactions FOR SELECT TO authenticated
  USING (
    (ledger_id IS NOT NULL AND public.can_access_ledger(ledger_id, auth.uid()))
    OR (ledger_id IS NULL AND user_id = auth.uid())
  );
CREATE POLICY "ledger members add entries" ON public.transactions FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND (
      ledger_id IS NULL OR public.can_access_ledger(ledger_id, auth.uid())
    )
  );
CREATE POLICY "ledger members edit entries" ON public.transactions FOR UPDATE TO authenticated
  USING (
    (ledger_id IS NOT NULL AND public.can_access_ledger(ledger_id, auth.uid()))
    OR (ledger_id IS NULL AND user_id = auth.uid())
  )
  WITH CHECK (
    (ledger_id IS NOT NULL AND public.can_access_ledger(ledger_id, auth.uid()))
    OR (ledger_id IS NULL AND user_id = auth.uid())
  );
CREATE POLICY "ledger members delete entries" ON public.transactions FOR DELETE TO authenticated
  USING (
    (ledger_id IS NOT NULL AND public.can_access_ledger(ledger_id, auth.uid()))
    OR (ledger_id IS NULL AND user_id = auth.uid())
  );

-- ========== AUTO-CREATE DEFAULT LEDGER FOR NEW USERS ==========
CREATE OR REPLACE FUNCTION public.ensure_default_ledger()
RETURNS uuid LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  lid uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT id INTO lid FROM public.ledgers WHERE owner_id = uid ORDER BY created_at LIMIT 1;
  IF lid IS NULL THEN
    INSERT INTO public.ledgers (owner_id, name) VALUES (uid, 'Personal ledger') RETURNING id INTO lid;
  END IF;
  INSERT INTO public.ledger_members (ledger_id, user_id, role)
  VALUES (lid, uid, 'owner') ON CONFLICT DO NOTHING;
  UPDATE public.transactions SET ledger_id = lid WHERE user_id = uid AND ledger_id IS NULL;
  RETURN lid;
END $$;
REVOKE EXECUTE ON FUNCTION public.ensure_default_ledger() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.ensure_default_ledger() TO authenticated;

-- ========== INVITE PREVIEW + JOIN ==========
CREATE OR REPLACE FUNCTION public.preview_ledger_invite(_token text)
RETURNS TABLE (status text, ledger_name text, owner_is_self boolean, already_member boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  inv public.ledger_invites%ROWTYPE;
  led public.ledgers%ROWTYPE;
  uid uuid := auth.uid();
BEGIN
  SELECT * INTO inv FROM public.ledger_invites WHERE token = _token;
  IF NOT FOUND THEN
    RETURN QUERY SELECT 'invalid', NULL::text, false, false; RETURN;
  END IF;
  SELECT * INTO led FROM public.ledgers WHERE id = inv.ledger_id;
  IF inv.revoked THEN
    RETURN QUERY SELECT 'revoked', led.name, led.owner_id = uid, false; RETURN;
  END IF;
  IF inv.expires_at IS NOT NULL AND inv.expires_at < now() THEN
    RETURN QUERY SELECT 'expired', led.name, led.owner_id = uid, false; RETURN;
  END IF;
  RETURN QUERY SELECT 'valid', led.name, led.owner_id = uid,
    EXISTS (SELECT 1 FROM public.ledger_members m WHERE m.ledger_id = led.id AND m.user_id = uid);
END $$;
REVOKE EXECUTE ON FUNCTION public.preview_ledger_invite(text) FROM public;
GRANT EXECUTE ON FUNCTION public.preview_ledger_invite(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.accept_ledger_invite(_token text)
RETURNS TABLE (status text, ledger_id uuid, ledger_name text)
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  inv public.ledger_invites%ROWTYPE;
  led public.ledgers%ROWTYPE;
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RETURN QUERY SELECT 'unauthenticated', NULL::uuid, NULL::text; RETURN; END IF;
  SELECT * INTO inv FROM public.ledger_invites WHERE token = _token;
  IF NOT FOUND THEN RETURN QUERY SELECT 'invalid', NULL::uuid, NULL::text; RETURN; END IF;
  IF inv.revoked THEN RETURN QUERY SELECT 'revoked', NULL::uuid, NULL::text; RETURN; END IF;
  IF inv.expires_at IS NOT NULL AND inv.expires_at < now() THEN
    RETURN QUERY SELECT 'expired', NULL::uuid, NULL::text; RETURN;
  END IF;
  SELECT * INTO led FROM public.ledgers WHERE id = inv.ledger_id;
  INSERT INTO public.ledger_members (ledger_id, user_id, role)
  VALUES (led.id, uid, 'editor') ON CONFLICT DO NOTHING;
  RETURN QUERY SELECT 'joined', led.id, led.name;
END $$;
REVOKE EXECUTE ON FUNCTION public.accept_ledger_invite(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.accept_ledger_invite(text) TO authenticated;

-- member listing with emails (owner + members can see who is in the ledger)
CREATE OR REPLACE FUNCTION public.ledger_member_list(_ledger uuid)
RETURNS TABLE (user_id uuid, email text, role text, joined_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT m.user_id, u.email::text, m.role, m.joined_at
  FROM public.ledger_members m
  JOIN auth.users u ON u.id = m.user_id
  WHERE m.ledger_id = _ledger
    AND public.can_access_ledger(_ledger, auth.uid())
  ORDER BY m.joined_at;
$$;
REVOKE EXECUTE ON FUNCTION public.ledger_member_list(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.ledger_member_list(uuid) TO authenticated;

-- ========== SECTION 2: RECURRING REMINDERS ==========
ALTER TABLE public.recurring_entries
  ADD COLUMN due_day integer NOT NULL DEFAULT 1 CHECK (due_day BETWEEN 1 AND 28),
  ADD COLUMN remind_days_before integer NOT NULL DEFAULT 3 CHECK (remind_days_before BETWEEN 0 AND 14),
  ADD COLUMN dismissed_month text;
UPDATE public.recurring_entries SET due_day = day_of_month;
