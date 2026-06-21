-- Seller KYC: structured address, policy acceptances, expanded document types + dual upload slots

ALTER TABLE public.seller_kyc_submissions
  ADD COLUMN IF NOT EXISTS contact_full_name TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS street_address TEXT,
  ADD COLUMN IF NOT EXISTS address_line_2 TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state_province TEXT,
  ADD COLUMN IF NOT EXISTS postal_code TEXT,
  ADD COLUMN IF NOT EXISTS address_country TEXT,
  ADD COLUMN IF NOT EXISTS seller_agreement_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS shipping_return_policy_accepted_at TIMESTAMPTZ;

ALTER TABLE public.seller_kyc_documents
  ADD COLUMN IF NOT EXISTS document_slot SMALLINT NOT NULL DEFAULT 1;

UPDATE public.seller_kyc_documents
SET document_type = 'individual_address_proof'
WHERE document_type = 'address_proof';

UPDATE public.seller_kyc_documents
SET document_type = 'tax_certificate'
WHERE document_type = 'tax_id_proof';

ALTER TABLE public.seller_kyc_documents
  DROP CONSTRAINT IF EXISTS seller_kyc_documents_unique_type;

ALTER TABLE public.seller_kyc_documents
  DROP CONSTRAINT IF EXISTS seller_kyc_documents_document_type_check;

ALTER TABLE public.seller_kyc_documents
  ADD CONSTRAINT seller_kyc_documents_document_type_check
  CHECK (document_type IN ('photo', 'individual_address_proof', 'business_address_proof', 'tax_certificate'));

ALTER TABLE public.seller_kyc_documents
  ADD CONSTRAINT seller_kyc_documents_slot_check
  CHECK (document_slot IN (1, 2));

ALTER TABLE public.seller_kyc_documents
  ADD CONSTRAINT seller_kyc_documents_unique_slot
  UNIQUE (user_id, document_type, document_slot);

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
      'signupBusinessName', sa.business_name,
      'countryName', sa.country_name,
      'phone', sa.phone,
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
    JOIN public.seller_accounts sa ON sa.user_id = k.user_id
    WHERE k.user_id = p_user_id
  );
END;
$$;
