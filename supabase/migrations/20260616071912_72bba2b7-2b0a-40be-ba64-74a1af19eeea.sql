-- 1. Restrict EXECUTE on SECURITY DEFINER / internal functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.deduct_credits(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.deduct_credits(integer) TO authenticated;

-- 2. Prevent direct credit manipulation via the user-facing UPDATE policy.
-- Normal updates (e.g. email) are allowed; any attempt to change credits is
-- silently reverted unless the secure deduct_credits function set the flag.
CREATE OR REPLACE FUNCTION public.prevent_credit_tampering()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.credits IS DISTINCT FROM OLD.credits
     AND current_setting('app.allow_credit_change', true) IS DISTINCT FROM '1' THEN
    NEW.credits := OLD.credits;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_credit_tampering ON public.profiles;
CREATE TRIGGER trg_prevent_credit_tampering
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_credit_tampering();

-- 3. Update deduct_credits to authorize the legitimate credit change
CREATE OR REPLACE FUNCTION public.deduct_credits(amount integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_credits INTEGER;
  new_credits INTEGER;
BEGIN
  SELECT credits INTO current_credits
  FROM public.profiles
  WHERE id = auth.uid()
  FOR UPDATE;

  IF current_credits IS NULL THEN
    RAISE EXCEPTION 'PROFILE_NOT_FOUND';
  END IF;

  IF current_credits < amount THEN
    RAISE EXCEPTION 'INSUFFICIENT_CREDITS';
  END IF;

  new_credits := current_credits - amount;

  -- Authorize the credit change for the tamper-prevention trigger
  PERFORM set_config('app.allow_credit_change', '1', true);

  UPDATE public.profiles
  SET credits = new_credits
  WHERE id = auth.uid();

  PERFORM set_config('app.allow_credit_change', '0', true);

  RETURN new_credits;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.deduct_credits(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.deduct_credits(integer) TO authenticated;