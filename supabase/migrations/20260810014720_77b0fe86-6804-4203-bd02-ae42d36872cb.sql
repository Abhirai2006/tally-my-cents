CREATE OR REPLACE FUNCTION public.tally_user_count()
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(DISTINCT user_id)::int FROM public.transactions;
$$;

GRANT EXECUTE ON FUNCTION public.tally_user_count() TO anon, authenticated;