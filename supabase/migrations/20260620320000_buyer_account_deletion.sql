-- Buyer account deletion reasons + full account removal flow

CREATE TABLE IF NOT EXISTS public.account_deletion_reasons (
  reason_key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  requires_custom_text BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT account_deletion_reasons_label_not_empty CHECK (btrim(label) <> '')
);

INSERT INTO public.account_deletion_reasons (reason_key, label, requires_custom_text, sort_order)
VALUES
  ('not_using', 'I am not using the service anymore', false, 10),
  ('privacy_concerns', 'I have privacy concerns', false, 20),
  ('too_many_emails', 'I receive too many emails or notifications', false, 30),
  ('found_alternative', 'I found a better alternative', false, 40),
  ('checkout_issues', 'I had issues with checkout or delivery', false, 50),
  ('other', 'Other reason', true, 60)
ON CONFLICT (reason_key) DO UPDATE
SET
  label = EXCLUDED.label,
  requires_custom_text = EXCLUDED.requires_custom_text,
  sort_order = EXCLUDED.sort_order,
  is_active = true;

ALTER TABLE public.account_deletion_reasons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users read deletion reasons" ON public.account_deletion_reasons;
CREATE POLICY "Authenticated users read deletion reasons"
ON public.account_deletion_reasons
FOR SELECT
TO authenticated
USING (is_active = true);

GRANT SELECT ON public.account_deletion_reasons TO authenticated;

CREATE TABLE IF NOT EXISTS public.buyer_account_deletion_requests (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  reason_key TEXT NOT NULL REFERENCES public.account_deletion_reasons (reason_key),
  custom_reason TEXT,
  accepted_terms BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending_otp'
    CHECK (status IN ('pending_otp', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  CONSTRAINT buyer_account_deletion_requests_terms CHECK (accepted_terms = true)
);

CREATE INDEX IF NOT EXISTS buyer_account_deletion_requests_user_idx
  ON public.buyer_account_deletion_requests (user_id, created_at DESC);

ALTER TABLE public.buyer_account_deletion_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Buyers read own deletion requests" ON public.buyer_account_deletion_requests;
CREATE POLICY "Buyers read own deletion requests"
ON public.buyer_account_deletion_requests
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.list_account_deletion_reasons()
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'reasonKey', reason_key,
        'label', label,
        'requiresCustomText', requires_custom_text
      )
      ORDER BY sort_order, label
    ),
    '[]'::jsonb
  )
  FROM public.account_deletion_reasons
  WHERE is_active = true;
$$;

CREATE OR REPLACE FUNCTION public.prepare_buyer_account_deletion(
  p_reason_key TEXT,
  p_custom_reason TEXT DEFAULT NULL,
  p_accepted_terms BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_reason public.account_deletion_reasons%ROWTYPE;
  v_request_id BIGINT;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  IF NOT public.is_buyer_account() THEN
    RAISE EXCEPTION 'Only buyer accounts can be deleted through this flow.';
  END IF;

  IF COALESCE(p_accepted_terms, false) IS NOT TRUE THEN
    RAISE EXCEPTION 'You must accept the account removal terms.';
  END IF;

  SELECT * INTO v_reason
  FROM public.account_deletion_reasons
  WHERE reason_key = btrim(p_reason_key)
    AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid account deletion reason.';
  END IF;

  IF v_reason.requires_custom_text AND btrim(COALESCE(p_custom_reason, '')) = '' THEN
    RAISE EXCEPTION 'Please describe your reason for deleting the account.';
  END IF;

  UPDATE public.buyer_account_deletion_requests
  SET status = 'cancelled'
  WHERE user_id = v_user
    AND status = 'pending_otp';

  INSERT INTO public.buyer_account_deletion_requests (
    user_id,
    reason_key,
    custom_reason,
    accepted_terms,
    status
  )
  VALUES (
    v_user,
    v_reason.reason_key,
    NULLIF(btrim(COALESCE(p_custom_reason, '')), ''),
    true,
    'pending_otp'
  )
  RETURNING id INTO v_request_id;

  RETURN jsonb_build_object('ok', true, 'requestId', v_request_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_buyer_account_deletion(p_request_id BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_email TEXT;
  v_request public.buyer_account_deletion_requests%ROWTYPE;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  IF NOT public.is_buyer_account() THEN
    RAISE EXCEPTION 'Only buyer accounts can be deleted through this flow.';
  END IF;

  SELECT * INTO v_request
  FROM public.buyer_account_deletion_requests
  WHERE id = p_request_id
    AND user_id = v_user
    AND status = 'pending_otp'
    AND created_at >= NOW() - INTERVAL '30 minutes';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Account deletion request is missing or expired. Start again.';
  END IF;

  SELECT lower(u.email) INTO v_email
  FROM auth.users u
  WHERE u.id = v_user;

  DELETE FROM public.marketplace_orders
  WHERE buyer_user_id = v_user;

  DELETE FROM public.newsletter_subscribers
  WHERE user_id = v_user
     OR (v_email IS NOT NULL AND lower(email) = v_email);

  DELETE FROM public.contact_messages
  WHERE user_id = v_user
     OR (v_email IS NOT NULL AND lower(email) = v_email);

  UPDATE public.buyer_account_deletion_requests
  SET status = 'completed', completed_at = NOW()
  WHERE id = p_request_id;

  DELETE FROM auth.identities WHERE user_id = v_user;
  DELETE FROM auth.users WHERE id = v_user;

  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.list_account_deletion_reasons() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.prepare_buyer_account_deletion(TEXT, TEXT, BOOLEAN) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.complete_buyer_account_deletion(BIGINT) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.list_account_deletion_reasons() TO authenticated;
GRANT EXECUTE ON FUNCTION public.prepare_buyer_account_deletion(TEXT, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_buyer_account_deletion(BIGINT) TO authenticated;
