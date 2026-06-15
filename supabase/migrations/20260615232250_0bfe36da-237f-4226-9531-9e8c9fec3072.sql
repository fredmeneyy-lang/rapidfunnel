
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.deduct_credits(INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.deduct_credits(INTEGER) TO authenticated;
