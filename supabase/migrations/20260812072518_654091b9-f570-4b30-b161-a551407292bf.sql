CREATE TABLE public.savings_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount NUMERIC NOT NULL,
  saved_amount NUMERIC NOT NULL DEFAULT 0,
  deadline DATE,
  accent TEXT NOT NULL DEFAULT 'moss',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.savings_goals TO authenticated;
GRANT ALL ON public.savings_goals TO service_role;

ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own savings goals"
  ON public.savings_goals FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_savings_goals_updated_at
  BEFORE UPDATE ON public.savings_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.ledger_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_email TEXT NOT NULL,
  label TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX ledger_shares_owner_email_idx
  ON public.ledger_shares (owner_id, lower(member_email));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ledger_shares TO authenticated;
GRANT ALL ON public.ledger_shares TO service_role;

ALTER TABLE public.ledger_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage own ledger shares"
  ON public.ledger_shares FOR ALL TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Members can see shares addressed to them"
  ON public.ledger_shares FOR SELECT TO authenticated
  USING (lower(member_email) = lower(COALESCE(auth.jwt() ->> 'email', '')));

CREATE TRIGGER update_ledger_shares_updated_at
  BEFORE UPDATE ON public.ledger_shares
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.can_view_ledger(_owner_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.ledger_shares s
    WHERE s.owner_id = _owner_id
      AND lower(s.member_email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
  );
$$;

CREATE POLICY "Shared members can read owner entries"
  ON public.transactions FOR SELECT TO authenticated
  USING (public.can_view_ledger(user_id));