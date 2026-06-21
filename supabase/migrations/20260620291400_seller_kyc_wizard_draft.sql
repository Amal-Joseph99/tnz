-- Seller KYC wizard: draft status, step saves, final submit RPC

ALTER TABLE public.seller_kyc_submissions
  DROP CONSTRAINT IF EXISTS seller_kyc_submissions_status_check;

ALTER TABLE public.seller_kyc_submissions
  ADD CONSTRAINT seller_kyc_submissions_status_check
  CHECK (status IN ('draft', 'pending', 'approved', 'rejected'));

ALTER TABLE public.seller_kyc_submissions
  DROP CONSTRAINT IF EXISTS seller_kyc_submissions_names_not_empty;

ALTER TABLE public.seller_kyc_submissions
  ALTER COLUMN business_address DROP NOT NULL,
  ALTER COLUMN account_holder_name DROP NOT NULL,
  ALTER COLUMN bank_name DROP NOT NULL,
  ALTER COLUMN account_number DROP NOT NULL,
  ALTER COLUMN ifsc_swift DROP NOT NULL,
  ALTER COLUMN terms_accepted_at DROP NOT NULL,
  ALTER COLUMN submitted_at DROP NOT NULL,
  ALTER COLUMN submitted_at DROP DEFAULT;

ALTER TABLE public.seller_kyc_submissions
  ADD COLUMN IF NOT EXISTS kyc_step SMALLINT NOT NULL DEFAULT 1
    CHECK (kyc_step BETWEEN 1 AND 4);

CREATE OR REPLACE FUNCTION public.guard_seller_kyc_write()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_notify_kyc BOOLEAN := true;
BEGIN
  IF public.is_admin_account() THEN
    RETURN NEW;
  END IF;

  IF NOT public.is_seller_account() OR NEW.user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Not authorized to modify this KYC submission.';
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.kyc_id := COALESCE(NULLIF(BTRIM(NEW.kyc_id), ''), public.generate_seller_kyc_id());
    IF COALESCE(NEW.status, 'draft') = 'draft' THEN
      NEW.status := 'draft';
      NEW.submitted_at := NULL;
    ELSE
      NEW.status := 'pending';
      NEW.submitted_at := COALESCE(NEW.submitted_at, NOW());
    END IF;
    NEW.reviewed_at := NULL;
    NEW.reviewed_by := NULL;
    NEW.rejection_reason := NULL;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'pending' THEN
      RAISE EXCEPTION 'KYC is pending review and cannot be edited.';
    END IF;
    IF OLD.status = 'approved' THEN
      RAISE EXCEPTION 'Approved KYC cannot be edited.';
    END IF;

    IF NEW.status = 'draft' AND OLD.status IN ('draft', 'rejected') THEN
      NEW.kyc_id := OLD.kyc_id;
      NEW.submitted_at := NULL;
      NEW.reviewed_at := NULL;
      NEW.reviewed_by := NULL;
      NEW.rejection_reason := NULL;
    ELSIF NEW.status = 'pending' AND OLD.status IN ('draft', 'rejected') THEN
      NEW.kyc_id := OLD.kyc_id;
      NEW.submitted_at := NOW();
      NEW.reviewed_at := NULL;
      NEW.reviewed_by := NULL;
      NEW.rejection_reason := NULL;
    ELSE
      NEW.status := OLD.status;
      NEW.kyc_id := OLD.kyc_id;
    END IF;
  END IF;

  NEW.business_name := BTRIM(COALESCE(NEW.business_name, ''));
  NEW.business_address := NULLIF(BTRIM(COALESCE(NEW.business_address, '')), '');
  NEW.business_type := BTRIM(COALESCE(NEW.business_type, 'Individual'));
  NEW.account_holder_name := NULLIF(BTRIM(COALESCE(NEW.account_holder_name, '')), '');
  NEW.bank_name := NULLIF(BTRIM(COALESCE(NEW.bank_name, '')), '');
  NEW.account_number := NULLIF(BTRIM(COALESCE(NEW.account_number, '')), '');
  NEW.ifsc_swift := NULLIF(BTRIM(COALESCE(NEW.ifsc_swift, '')), '');
  NEW.tax_id := NULLIF(BTRIM(COALESCE(NEW.tax_id, '')), '');
  NEW.contact_full_name := NULLIF(BTRIM(COALESCE(NEW.contact_full_name, '')), '');
  NEW.contact_phone := NULLIF(BTRIM(COALESCE(NEW.contact_phone, '')), '');
  NEW.street_address := NULLIF(BTRIM(COALESCE(NEW.street_address, '')), '');
  NEW.address_line_2 := NULLIF(BTRIM(COALESCE(NEW.address_line_2, '')), '');
  NEW.city := NULLIF(BTRIM(COALESCE(NEW.city, '')), '');
  NEW.state_province := NULLIF(BTRIM(COALESCE(NEW.state_province, '')), '');
  NEW.postal_code := NULLIF(BTRIM(COALESCE(NEW.postal_code, '')), '');
  NEW.address_country := NULLIF(BTRIM(COALESCE(NEW.address_country, '')), '');
  NEW.business_street_address := NULLIF(BTRIM(COALESCE(NEW.business_street_address, '')), '');
  NEW.business_address_line_2 := NULLIF(BTRIM(COALESCE(NEW.business_address_line_2, '')), '');
  NEW.business_city := NULLIF(BTRIM(COALESCE(NEW.business_city, '')), '');
  NEW.business_state_province := NULLIF(BTRIM(COALESCE(NEW.business_state_province, '')), '');
  NEW.business_postal_code := NULLIF(BTRIM(COALESCE(NEW.business_postal_code, '')), '');
  NEW.business_address_country := NULLIF(BTRIM(COALESCE(NEW.business_address_country, '')), '');

  IF TG_OP = 'UPDATE' AND NEW.status = 'pending' AND OLD.status IN ('draft', 'rejected') THEN
    SELECT COALESCE(notify_kyc_submissions, true)
    INTO v_notify_kyc
    FROM public.platform_settings
    LIMIT 1;

    IF v_notify_kyc THEN
      PERFORM public.notify_all_admins(
        'kyc',
        'New seller KYC submission',
        'Seller ' || NEW.business_name || ' submitted KYC ' || NEW.kyc_id || ' for review.',
        '/admin/kyc'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP POLICY IF EXISTS "Sellers update own rejected KYC" ON public.seller_kyc_submissions;
CREATE POLICY "Sellers update own draft or rejected KYC"
ON public.seller_kyc_submissions
FOR UPDATE
TO authenticated
USING (public.is_seller_account() AND auth.uid() = user_id AND status IN ('draft', 'rejected'))
WITH CHECK (public.is_seller_account() AND auth.uid() = user_id AND status IN ('draft', 'rejected', 'pending'));

CREATE OR REPLACE FUNCTION public.save_seller_kyc_draft(
  p_step SMALLINT,
  p_payload JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_row public.seller_kyc_submissions%ROWTYPE;
  v_business_address TEXT;
BEGIN
  IF NOT public.is_seller_account() OR v_user_id IS NULL THEN
    RAISE EXCEPTION 'Seller access required.';
  END IF;

  IF p_step < 1 OR p_step > 4 THEN
    RAISE EXCEPTION 'Invalid KYC step.';
  END IF;

  SELECT * INTO v_row FROM public.seller_kyc_submissions WHERE user_id = v_user_id;

  IF FOUND AND v_row.status IN ('pending', 'approved') THEN
    RAISE EXCEPTION 'KYC cannot be edited in the current status.';
  END IF;

  v_business_address := NULLIF(BTRIM(COALESCE(
    p_payload->>'businessAddress',
    CASE
      WHEN v_row.user_id IS NOT NULL THEN v_row.business_address
      ELSE NULL
    END,
    ''
  )), '');

  IF NOT FOUND THEN
    INSERT INTO public.seller_kyc_submissions (
      user_id,
      kyc_id,
      status,
      business_type,
      business_name,
      business_address,
      business_street_address,
      business_address_line_2,
      business_city,
      business_state_province,
      business_postal_code,
      business_address_country,
      business_same_as_individual,
      contact_full_name,
      contact_phone,
      street_address,
      address_line_2,
      city,
      state_province,
      postal_code,
      address_country,
      tax_id,
      account_holder_name,
      bank_name,
      account_number,
      ifsc_swift,
      kyc_step
    ) VALUES (
      v_user_id,
      public.generate_seller_kyc_id(),
      'draft',
      COALESCE(NULLIF(BTRIM(p_payload->>'businessType'), ''), 'Individual'),
      COALESCE(NULLIF(BTRIM(p_payload->>'businessName'), ''), 'Pending'),
      v_business_address,
      NULLIF(BTRIM(COALESCE(p_payload->>'businessStreetAddress', '')), ''),
      NULLIF(BTRIM(COALESCE(p_payload->>'businessAddressLine2', '')), ''),
      NULLIF(BTRIM(COALESCE(p_payload->>'businessCity', '')), ''),
      NULLIF(BTRIM(COALESCE(p_payload->>'businessStateProvince', '')), ''),
      NULLIF(BTRIM(COALESCE(p_payload->>'businessPostalCode', '')), ''),
      NULLIF(BTRIM(COALESCE(p_payload->>'businessAddressCountry', '')), ''),
      COALESCE((p_payload->>'businessSameAsIndividual')::BOOLEAN, false),
      NULLIF(BTRIM(COALESCE(p_payload->>'contactFullName', '')), ''),
      NULLIF(BTRIM(COALESCE(p_payload->>'contactPhone', '')), ''),
      NULLIF(BTRIM(COALESCE(p_payload->>'streetAddress', '')), ''),
      NULLIF(BTRIM(COALESCE(p_payload->>'addressLine2', '')), ''),
      NULLIF(BTRIM(COALESCE(p_payload->>'city', '')), ''),
      NULLIF(BTRIM(COALESCE(p_payload->>'stateProvince', '')), ''),
      NULLIF(BTRIM(COALESCE(p_payload->>'postalCode', '')), ''),
      NULLIF(BTRIM(COALESCE(p_payload->>'addressCountry', '')), ''),
      NULLIF(BTRIM(COALESCE(p_payload->>'taxId', '')), ''),
      NULLIF(BTRIM(COALESCE(p_payload->>'accountHolderName', '')), ''),
      NULLIF(BTRIM(COALESCE(p_payload->>'bankName', '')), ''),
      NULLIF(BTRIM(COALESCE(p_payload->>'accountNumber', '')), ''),
      NULLIF(BTRIM(COALESCE(p_payload->>'ifscSwift', '')), ''),
      p_step
  );
  ELSE
    UPDATE public.seller_kyc_submissions
    SET
      status = 'draft',
      business_type = COALESCE(NULLIF(BTRIM(p_payload->>'businessType'), ''), business_type),
      business_name = COALESCE(NULLIF(BTRIM(p_payload->>'businessName'), ''), business_name),
      business_address = COALESCE(v_business_address, business_address),
      business_street_address = COALESCE(NULLIF(BTRIM(p_payload->>'businessStreetAddress'), ''), business_street_address),
      business_address_line_2 = COALESCE(NULLIF(BTRIM(p_payload->>'businessAddressLine2'), ''), business_address_line_2),
      business_city = COALESCE(NULLIF(BTRIM(p_payload->>'businessCity'), ''), business_city),
      business_state_province = COALESCE(NULLIF(BTRIM(p_payload->>'businessStateProvince'), ''), business_state_province),
      business_postal_code = COALESCE(NULLIF(BTRIM(p_payload->>'businessPostalCode'), ''), business_postal_code),
      business_address_country = COALESCE(NULLIF(BTRIM(p_payload->>'businessAddressCountry'), ''), business_address_country),
      business_same_as_individual = COALESCE((p_payload->>'businessSameAsIndividual')::BOOLEAN, business_same_as_individual),
      contact_full_name = COALESCE(NULLIF(BTRIM(p_payload->>'contactFullName'), ''), contact_full_name),
      contact_phone = COALESCE(NULLIF(BTRIM(p_payload->>'contactPhone'), ''), contact_phone),
      street_address = COALESCE(NULLIF(BTRIM(p_payload->>'streetAddress'), ''), street_address),
      address_line_2 = COALESCE(NULLIF(BTRIM(p_payload->>'addressLine2'), ''), address_line_2),
      city = COALESCE(NULLIF(BTRIM(p_payload->>'city'), ''), city),
      state_province = COALESCE(NULLIF(BTRIM(p_payload->>'stateProvince'), ''), state_province),
      postal_code = COALESCE(NULLIF(BTRIM(p_payload->>'postalCode'), ''), postal_code),
      address_country = COALESCE(NULLIF(BTRIM(p_payload->>'addressCountry'), ''), address_country),
      tax_id = COALESCE(NULLIF(BTRIM(p_payload->>'taxId'), ''), tax_id),
      account_holder_name = COALESCE(NULLIF(BTRIM(p_payload->>'accountHolderName'), ''), account_holder_name),
      bank_name = COALESCE(NULLIF(BTRIM(p_payload->>'bankName'), ''), bank_name),
      account_number = COALESCE(NULLIF(BTRIM(p_payload->>'accountNumber'), ''), account_number),
      ifsc_swift = COALESCE(NULLIF(BTRIM(p_payload->>'ifscSwift'), ''), ifsc_swift),
      kyc_step = GREATEST(kyc_step, p_step)
    WHERE user_id = v_user_id
      AND status IN ('draft', 'rejected');
  END IF;

  SELECT * INTO v_row FROM public.seller_kyc_submissions WHERE user_id = v_user_id;

  RETURN jsonb_build_object(
    'kycId', v_row.kyc_id,
    'kycStep', v_row.kyc_step,
    'status', v_row.status
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_seller_kyc_for_approval(
  p_payload JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_row public.seller_kyc_submissions%ROWTYPE;
  v_business_address TEXT;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  IF NOT public.is_seller_account() OR v_user_id IS NULL THEN
    RAISE EXCEPTION 'Seller access required.';
  END IF;

  IF COALESCE((p_payload->>'termsAndPoliciesAccepted')::BOOLEAN, false) IS NOT TRUE THEN
    RAISE EXCEPTION 'Accept the Terms & Policies before submitting.';
  END IF;

  IF COALESCE((p_payload->>'sellerAgreementAccepted')::BOOLEAN, false) IS NOT TRUE THEN
    RAISE EXCEPTION 'Accept the Seller Agreement before submitting.';
  END IF;

  IF COALESCE((p_payload->>'taxPayoutRulesAccepted')::BOOLEAN, false) IS NOT TRUE THEN
    RAISE EXCEPTION 'Accept the Tax & Payout Rules before submitting.';
  END IF;

  SELECT * INTO v_row FROM public.seller_kyc_submissions WHERE user_id = v_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Complete all KYC steps before submitting.';
  END IF;

  IF v_row.status IN ('pending', 'approved') THEN
    RAISE EXCEPTION 'KYC has already been submitted.';
  END IF;

  v_business_address := NULLIF(BTRIM(COALESCE(
    p_payload->>'businessAddress',
    public.format_kyc_address(
      COALESCE(NULLIF(BTRIM(p_payload->>'businessStreetAddress'), ''), v_row.business_street_address, ''),
      COALESCE(NULLIF(BTRIM(p_payload->>'businessAddressLine2'), ''), v_row.business_address_line_2, ''),
      COALESCE(NULLIF(BTRIM(p_payload->>'businessCity'), ''), v_row.business_city, ''),
      COALESCE(NULLIF(BTRIM(p_payload->>'businessStateProvince'), ''), v_row.business_state_province, ''),
      COALESCE(NULLIF(BTRIM(p_payload->>'businessPostalCode'), ''), v_row.business_postal_code, ''),
      COALESCE(NULLIF(BTRIM(p_payload->>'businessAddressCountry'), ''), v_row.business_address_country, '')
    ),
    ''
  )), '');

  IF NULLIF(BTRIM(COALESCE(p_payload->>'contactFullName', v_row.contact_full_name, '')), '') IS NULL THEN
    RAISE EXCEPTION 'Contact full name is required.';
  END IF;

  IF NULLIF(BTRIM(COALESCE(p_payload->>'contactPhone', v_row.contact_phone, '')), '') IS NULL THEN
    RAISE EXCEPTION 'Mobile number is required.';
  END IF;

  IF NULLIF(BTRIM(COALESCE(p_payload->>'businessName', v_row.business_name, '')), '') IS NULL THEN
    RAISE EXCEPTION 'Business name is required.';
  END IF;

  IF NULLIF(BTRIM(COALESCE(p_payload->>'streetAddress', v_row.street_address, '')), '') IS NULL
    OR NULLIF(BTRIM(COALESCE(p_payload->>'city', v_row.city, '')), '') IS NULL
    OR NULLIF(BTRIM(COALESCE(p_payload->>'stateProvince', v_row.state_province, '')), '') IS NULL
    OR NULLIF(BTRIM(COALESCE(p_payload->>'postalCode', v_row.postal_code, '')), '') IS NULL
    OR NULLIF(BTRIM(COALESCE(p_payload->>'addressCountry', v_row.address_country, '')), '') IS NULL THEN
    RAISE EXCEPTION 'Complete permanent address before submitting.';
  END IF;

  IF v_business_address IS NULL THEN
    RAISE EXCEPTION 'Complete business address before submitting.';
  END IF;

  IF NULLIF(BTRIM(COALESCE(p_payload->>'accountHolderName', v_row.account_holder_name, '')), '') IS NULL
    OR NULLIF(BTRIM(COALESCE(p_payload->>'bankName', v_row.bank_name, '')), '') IS NULL
    OR NULLIF(BTRIM(COALESCE(p_payload->>'accountNumber', v_row.account_number, '')), '') IS NULL
    OR NULLIF(BTRIM(COALESCE(p_payload->>'ifscSwift', v_row.ifsc_swift, '')), '') IS NULL THEN
    RAISE EXCEPTION 'Complete bank details before submitting.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.seller_kyc_documents
    WHERE user_id = v_user_id AND document_type = 'photo' AND document_slot = 1
  ) THEN
    RAISE EXCEPTION 'Upload your seller photo before submitting.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.seller_kyc_documents
    WHERE user_id = v_user_id AND document_type = 'business_address_proof' AND document_slot = 1
  ) OR NOT EXISTS (
    SELECT 1 FROM public.seller_kyc_documents
    WHERE user_id = v_user_id AND document_type = 'business_address_proof' AND document_slot = 2
  ) THEN
    RAISE EXCEPTION 'Upload front and back of business address proof before submitting.';
  END IF;

  UPDATE public.seller_kyc_submissions
  SET
    status = 'pending',
    business_type = COALESCE(NULLIF(BTRIM(p_payload->>'businessType'), ''), business_type),
    business_name = COALESCE(NULLIF(BTRIM(p_payload->>'businessName'), ''), business_name),
    business_address = v_business_address,
    business_street_address = COALESCE(NULLIF(BTRIM(p_payload->>'businessStreetAddress'), ''), business_street_address),
    business_address_line_2 = COALESCE(NULLIF(BTRIM(p_payload->>'businessAddressLine2'), ''), business_address_line_2),
    business_city = COALESCE(NULLIF(BTRIM(p_payload->>'businessCity'), ''), business_city),
    business_state_province = COALESCE(NULLIF(BTRIM(p_payload->>'businessStateProvince'), ''), business_state_province),
    business_postal_code = COALESCE(NULLIF(BTRIM(p_payload->>'businessPostalCode'), ''), business_postal_code),
    business_address_country = COALESCE(NULLIF(BTRIM(p_payload->>'businessAddressCountry'), ''), business_address_country),
    business_same_as_individual = COALESCE((p_payload->>'businessSameAsIndividual')::BOOLEAN, business_same_as_individual),
    contact_full_name = COALESCE(NULLIF(BTRIM(p_payload->>'contactFullName'), ''), contact_full_name),
    contact_phone = COALESCE(NULLIF(BTRIM(p_payload->>'contactPhone'), ''), contact_phone),
    street_address = COALESCE(NULLIF(BTRIM(p_payload->>'streetAddress'), ''), street_address),
    address_line_2 = COALESCE(NULLIF(BTRIM(p_payload->>'addressLine2'), ''), address_line_2),
    city = COALESCE(NULLIF(BTRIM(p_payload->>'city'), ''), city),
    state_province = COALESCE(NULLIF(BTRIM(p_payload->>'stateProvince'), ''), state_province),
    postal_code = COALESCE(NULLIF(BTRIM(p_payload->>'postalCode'), ''), postal_code),
    address_country = COALESCE(NULLIF(BTRIM(p_payload->>'addressCountry'), ''), address_country),
    tax_id = COALESCE(NULLIF(BTRIM(p_payload->>'taxId'), ''), tax_id),
    account_holder_name = COALESCE(NULLIF(BTRIM(p_payload->>'accountHolderName'), ''), account_holder_name),
    bank_name = COALESCE(NULLIF(BTRIM(p_payload->>'bankName'), ''), bank_name),
    account_number = COALESCE(NULLIF(BTRIM(p_payload->>'accountNumber'), ''), account_number),
    ifsc_swift = COALESCE(NULLIF(BTRIM(p_payload->>'ifscSwift'), ''), ifsc_swift),
    terms_accepted_at = v_now,
    seller_agreement_accepted_at = v_now,
    shipping_return_policy_accepted_at = v_now,
    kyc_step = 4,
    submitted_at = v_now
  WHERE user_id = v_user_id
    AND status IN ('draft', 'rejected');

  SELECT * INTO v_row FROM public.seller_kyc_submissions WHERE user_id = v_user_id;

  RETURN jsonb_build_object(
    'kycId', v_row.kyc_id,
    'submittedAt', v_row.submitted_at,
    'status', v_row.status
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.format_kyc_address(
  p_street TEXT,
  p_line2 TEXT,
  p_city TEXT,
  p_state TEXT,
  p_postal TEXT,
  p_country TEXT
)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT NULLIF(BTRIM(
    CONCAT_WS(
      E'\n',
      NULLIF(BTRIM(COALESCE(p_street, '')), ''),
      NULLIF(BTRIM(COALESCE(p_line2, '')), ''),
      NULLIF(BTRIM(CONCAT_WS(', ', NULLIF(BTRIM(COALESCE(p_city, '')), ''), NULLIF(BTRIM(COALESCE(p_state, '')), ''), NULLIF(BTRIM(COALESCE(p_postal, '')), ''))), ''),
      NULLIF(BTRIM(COALESCE(p_country, '')), '')
    )
  ), '');
$$;

CREATE OR REPLACE FUNCTION public.list_seller_kyc_submissions(p_status TEXT DEFAULT NULL)
RETURNS TABLE (
  user_id UUID,
  kyc_id TEXT,
  status TEXT,
  business_type TEXT,
  business_name TEXT,
  business_address TEXT,
  tax_id TEXT,
  account_holder_name TEXT,
  bank_name TEXT,
  account_number TEXT,
  ifsc_swift TEXT,
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  seller_email TEXT,
  signup_business_name TEXT,
  country_name TEXT,
  phone TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin_account() THEN
    RAISE EXCEPTION 'Admin access required.';
  END IF;

  RETURN QUERY
  SELECT
    k.user_id,
    k.kyc_id::TEXT,
    k.status,
    k.business_type,
    k.business_name,
    k.business_address,
    k.tax_id,
    k.account_holder_name,
    k.bank_name,
    k.account_number,
    k.ifsc_swift,
    k.submitted_at,
    k.reviewed_at,
    k.rejection_reason,
    u.email::TEXT,
    COALESCE(sa.business_name, k.business_name)::TEXT,
    COALESCE(sa.country_name, k.address_country, '')::TEXT,
    COALESCE(sa.phone, k.contact_phone, '')::TEXT
  FROM public.seller_kyc_submissions k
  JOIN auth.users u ON u.id = k.user_id
  LEFT JOIN public.seller_accounts sa ON sa.user_id = k.user_id
  WHERE k.status <> 'draft'
    AND (p_status IS NULL OR k.status = p_status)
  ORDER BY k.submitted_at DESC NULLS LAST;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_seller_kyc_for_approval(JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_seller_kyc_draft(SMALLINT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_seller_kyc_for_approval(JSONB) TO authenticated;
