-- Structured business address fields + same-as-individual flag for seller KYC

ALTER TABLE public.seller_kyc_submissions
  ADD COLUMN IF NOT EXISTS business_street_address TEXT,
  ADD COLUMN IF NOT EXISTS business_address_line_2 TEXT,
  ADD COLUMN IF NOT EXISTS business_city TEXT,
  ADD COLUMN IF NOT EXISTS business_state_province TEXT,
  ADD COLUMN IF NOT EXISTS business_postal_code TEXT,
  ADD COLUMN IF NOT EXISTS business_address_country TEXT,
  ADD COLUMN IF NOT EXISTS business_same_as_individual BOOLEAN NOT NULL DEFAULT false;
