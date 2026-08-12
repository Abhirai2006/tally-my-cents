REVOKE EXECUTE ON FUNCTION public.can_view_ledger(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.can_view_ledger(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.can_view_ledger(UUID) TO authenticated;