-- Pending KYC was counted but hidden when seller_accounts row was missing (INNER JOIN).
-- Backfill orphaned sellers and list KYC with LEFT JOIN so admins can review and approve.

INSERT INTO public.seller_accounts (
  user_id,
  business_name,
  country_id,
  country_name,
  iso_alpha2,
  iso_alpha3,
  isd_code,
  base_currency_code,
  phone
)
SELECT DISTINCT ON (k.user_id)
  k.user_id,
  COALESCE(
    NULLIF(BTRIM(k.business_name), ''),
    NULLIF(BTRIM(u.raw_user_meta_data->>'business_name'), ''),
    'Seller'
  ),
  c.id,
  c.country_name,
  c.iso_alpha2,
  c.iso_alpha3,
  c.isd_code,
  c.currency_code,
  COALESCE(
    NULLIF(BTRIM(u.raw_user_meta_data->>'phone'), ''),
    NULLIF(BTRIM(k.contact_phone), ''),
    '0000000000'
  )
FROM public.seller_kyc_submissions k
JOIN auth.users u ON u.id = k.user_id
LEFT JOIN public.seller_accounts sa ON sa.user_id = k.user_id
JOIN LATERAL (
  SELECT c.*
  FROM public.countries c
  WHERE c.id = COALESCE(
    NULLIF(u.raw_user_meta_data->>'country_id', '')::BIGINT,
    (
      SELECT id
      FROM public.countries
      WHERE iso_alpha2 = COALESCE(NULLIF(u.raw_user_meta_data->>'iso_alpha2', ''), 'IN')
      LIMIT 1
    )
  )
  LIMIT 1
) c ON TRUE
WHERE sa.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.staff_roles (user_id, role)
SELECT k.user_id, 'seller'
FROM public.seller_kyc_submissions k
LEFT JOIN public.staff_roles sr ON sr.user_id = k.user_id
WHERE sr.user_id IS NULL
ON CONFLICT (user_id) DO UPDATE
SET role = EXCLUDED.role;

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
  WHERE p_status IS NULL OR k.status = p_status
  ORDER BY k.submitted_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_admin_kyc_detail(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin_account() THEN
    RAISE EXCEPTION 'Admin access required.';
  END IF;

  RETURN (
    SELECT jsonb_build_object(
      'submission', row_to_json(k)::jsonb,
      'sellerEmail', u.email,
      'signupBusinessName', COALESCE(sa.business_name, k.business_name),
      'countryName', COALESCE(sa.country_name, k.address_country, ''),
      'phone', COALESCE(sa.phone, k.contact_phone, ''),
      'documents', COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'documentType', d.document_type,
              'documentSlot', d.document_slot,
              'storagePath', d.storage_path,
              'fileName', d.file_name,
              'mimeType', d.mime_type
            )
            ORDER BY d.document_type, d.document_slot
          )
          FROM public.seller_kyc_documents d
          WHERE d.user_id = p_user_id
        ),
        '[]'::jsonb
      )
    )
    FROM public.seller_kyc_submissions k
    JOIN auth.users u ON u.id = k.user_id
    LEFT JOIN public.seller_accounts sa ON sa.user_id = k.user_id
    WHERE k.user_id = p_user_id
  );
END;
$$;
