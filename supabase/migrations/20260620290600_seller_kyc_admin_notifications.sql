-- Seller KYC: admin notifications, guard updates for structured addresses

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
    NEW.status := 'pending';
    NEW.reviewed_at := NULL;
    NEW.reviewed_by := NULL;
    NEW.rejection_reason := NULL;
    NEW.submitted_at := NOW();
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'pending' THEN
      RAISE EXCEPTION 'KYC is pending review and cannot be edited.';
    END IF;
    IF OLD.status = 'approved' THEN
      RAISE EXCEPTION 'Approved KYC cannot be edited.';
    END IF;
    NEW.status := 'pending';
    NEW.kyc_id := OLD.kyc_id;
    NEW.reviewed_at := NULL;
    NEW.reviewed_by := NULL;
    NEW.rejection_reason := NULL;
    NEW.submitted_at := NOW();
  END IF;

  NEW.business_name := BTRIM(NEW.business_name);
  NEW.business_address := BTRIM(NEW.business_address);
  NEW.business_type := BTRIM(NEW.business_type);
  NEW.account_holder_name := BTRIM(NEW.account_holder_name);
  NEW.bank_name := BTRIM(NEW.bank_name);
  NEW.account_number := BTRIM(NEW.account_number);
  NEW.ifsc_swift := BTRIM(NEW.ifsc_swift);
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

  SELECT COALESCE(notify_kyc_submissions, true)
  INTO v_notify_kyc
  FROM public.platform_settings
  LIMIT 1;

  IF v_notify_kyc AND (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status = 'rejected')) THEN
    PERFORM public.notify_all_admins(
      'kyc',
      'New seller KYC submission',
      'Seller ' || NEW.business_name || ' submitted KYC ' || NEW.kyc_id || ' for review.',
      '/admin/kyc'
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.review_seller_kyc(
  p_user_id UUID,
  p_approved BOOLEAN,
  p_rejection_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_kyc_id TEXT;
BEGIN
  IF NOT public.is_admin_account() THEN
    RAISE EXCEPTION 'Admin access required.';
  END IF;

  UPDATE public.seller_kyc_submissions
  SET
    status = CASE WHEN p_approved THEN 'approved' ELSE 'rejected' END,
    reviewed_at = NOW(),
    reviewed_by = auth.uid(),
    rejection_reason = CASE WHEN p_approved THEN NULL ELSE NULLIF(BTRIM(p_rejection_reason), '') END
  WHERE user_id = p_user_id
    AND status = 'pending'
  RETURNING kyc_id INTO v_kyc_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No pending KYC submission found for this seller.';
  END IF;

  IF NOT p_approved THEN
    DELETE FROM public.seller_warehouses WHERE user_id = p_user_id;
  END IF;

  PERFORM public.create_app_notification(
    p_user_id,
    'seller',
    'kyc',
    CASE WHEN p_approved THEN 'KYC approved' ELSE 'KYC rejected' END,
    CASE
      WHEN p_approved THEN
        'Your seller KYC (' || v_kyc_id || ') has been approved. Set up your warehouse to start listing products.'
      ELSE
        COALESCE(
          'Your KYC (' || v_kyc_id || ') was rejected: ' || NULLIF(BTRIM(p_rejection_reason), ''),
          'Your KYC was rejected. Update your documents and resubmit from Seller Profile.'
        )
    END,
    '/seller/profile'
  );
END;
$$;
