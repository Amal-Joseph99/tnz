import { supabase } from './supabase'

export type KycDocumentType =
  | 'photo'
  | 'individual_address_proof'
  | 'business_address_proof'
  | 'tax_certificate'

export type KycDocumentSlot = 1 | 2

export type SellerAccountProfile = {
  businessName: string
  email: string
  countryName: string
  phone: string
}

export type SellerKycSubmission = {
  userId: string
  kycId: string
  status: 'draft' | 'pending' | 'approved' | 'rejected'
  businessType: string
  businessName: string
  businessAddress: string
  businessStreetAddress: string
  businessAddressLine2: string
  businessCity: string
  businessStateProvince: string
  businessPostalCode: string
  businessAddressCountry: string
  businessSameAsIndividual: boolean
  contactFullName: string
  contactPhone: string
  streetAddress: string
  addressLine2: string
  city: string
  stateProvince: string
  postalCode: string
  addressCountry: string
  taxId: string
  accountHolderName: string
  bankName: string
  accountNumber: string
  ifscSwift: string
  submittedAt: string
  rejectionReason: string | null
  kycStep: number
}

export type SellerKycDocument = {
  documentType: KycDocumentType
  documentSlot: KycDocumentSlot
  storagePath: string
  fileName: string
  mimeType: string | null
  isRequired: boolean
}

export type SellerKycInput = {
  businessType: string
  businessName: string
  businessStreetAddress: string
  businessAddressLine2: string
  businessCity: string
  businessStateProvince: string
  businessPostalCode: string
  businessAddressCountry: string
  businessSameAsIndividual: boolean
  contactFullName: string
  contactPhone: string
  streetAddress: string
  addressLine2: string
  city: string
  stateProvince: string
  postalCode: string
  addressCountry: string
  taxId: string
  accountHolderName: string
  bankName: string
  accountNumber: string
  ifscSwift: string
  termsAndPoliciesAccepted: boolean
  sellerAgreementAccepted: boolean
  shippingReturnPolicyAccepted: boolean
  documents: SellerKycDocument[]
}

type MutationResult = { ok: true } | { ok: false; message: string }

const LEGACY_DOCUMENT_TYPES: Record<string, KycDocumentType> = {
  address_proof: 'individual_address_proof',
  tax_id_proof: 'tax_certificate',
}

export function normalizeKycDocumentType(value: string): KycDocumentType {
  return LEGACY_DOCUMENT_TYPES[value] ?? (value as KycDocumentType)
}

export const KYC_DOCUMENT_LABELS: Record<string, string> = {
  photo: 'Seller photo',
  individual_address_proof: 'Individual address proof',
  business_address_proof: 'Business address proof',
  tax_certificate: 'Tax certificate',
  address_proof: 'Address proof',
  tax_id_proof: 'Tax ID proof',
}

export function formatKycDocumentLabel(documentType: string, documentSlot?: number) {
  const label = KYC_DOCUMENT_LABELS[documentType] ?? documentType.replaceAll('_', ' ')
  return documentSlot ? `${label} (upload ${documentSlot})` : label
}

export const KYC_POLICY_ACCEPTANCE_ITEMS = [
  {
    field: 'terms_accepted_at',
    label: 'I have accepted the AGTRENZ Terms of Service and Privacy Policy.',
  },
  {
    field: 'seller_agreement_accepted_at',
    label: 'I have accepted the AGTRENZ Seller Agreement.',
  },
  {
    field: 'shipping_return_policy_accepted_at',
    label: 'I have accepted the AGTRENZ Tax & Payout Rules.',
  },
] as const

export function kycDocumentKey(documentType: KycDocumentType, documentSlot: KycDocumentSlot) {
  return `${documentType}:${documentSlot}`
}

export function formatKycAddress(parts: {
  streetAddress: string
  addressLine2?: string
  city: string
  stateProvince: string
  postalCode: string
  addressCountry: string
}) {
  return [
    parts.streetAddress.trim(),
    parts.addressLine2?.trim(),
    [parts.city.trim(), parts.stateProvince.trim(), parts.postalCode.trim()].filter(Boolean).join(', '),
    parts.addressCountry.trim(),
  ].filter(Boolean).join('\n')
}

export async function fetchSellerAccountProfile(): Promise<SellerAccountProfile | null> {
  if (!supabase) return null

  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user
  if (!user) return null

  const { data, error } = await supabase
    .from('seller_accounts')
    .select('business_name, country_name, phone')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error || !data) return null

  return {
    businessName: data.business_name,
    email: user.email ?? '',
    countryName: data.country_name,
    phone: data.phone,
  }
}

export async function fetchSellerKycSubmission(): Promise<SellerKycSubmission | null> {
  if (!supabase) return null

  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user
  if (!user) return null

  const { data, error } = await supabase
    .from('seller_kyc_submissions')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error || !data) return null

  return {
    userId: data.user_id,
    kycId: data.kyc_id,
    status: data.status,
    businessType: data.business_type,
    businessName: data.business_name,
    businessAddress: data.business_address,
    businessStreetAddress: data.business_street_address ?? '',
    businessAddressLine2: data.business_address_line_2 ?? '',
    businessCity: data.business_city ?? '',
    businessStateProvince: data.business_state_province ?? '',
    businessPostalCode: data.business_postal_code ?? '',
    businessAddressCountry: data.business_address_country ?? '',
    businessSameAsIndividual: Boolean(data.business_same_as_individual),
    contactFullName: data.contact_full_name ?? '',
    contactPhone: data.contact_phone ?? '',
    streetAddress: data.street_address ?? '',
    addressLine2: data.address_line_2 ?? '',
    city: data.city ?? '',
    stateProvince: data.state_province ?? '',
    postalCode: data.postal_code ?? '',
    addressCountry: data.address_country ?? '',
    taxId: data.tax_id ?? '',
    accountHolderName: data.account_holder_name,
    bankName: data.bank_name,
    accountNumber: data.account_number,
    ifscSwift: data.ifsc_swift,
    submittedAt: data.submitted_at ?? '',
    rejectionReason: data.rejection_reason,
    kycStep: Number(data.kyc_step ?? 1),
  }
}

export async function fetchSellerKycDocuments(): Promise<SellerKycDocument[]> {
  if (!supabase) return []

  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user
  if (!user) return []

  const { data, error } = await supabase
    .from('seller_kyc_documents')
    .select('document_type, document_slot, storage_path, file_name, mime_type, is_required')
    .eq('user_id', user.id)

  if (error || !data) return []

  return data.map((row) => ({
    documentType: normalizeKycDocumentType(row.document_type),
    documentSlot: (row.document_slot ?? 1) as KycDocumentSlot,
    storagePath: row.storage_path,
    fileName: row.file_name,
    mimeType: row.mime_type,
    isRequired: row.is_required,
  }))
}

export async function submitSellerKyc(input: SellerKycInput): Promise<MutationResult & { kycId?: string }> {
  if (!supabase) {
    return { ok: false, message: 'Supabase is not configured.' }
  }

  if (!input.termsAndPoliciesAccepted) {
    return { ok: false, message: 'Accept the AGTRENZ terms and policies before submitting KYC.' }
  }

  if (!input.sellerAgreementAccepted) {
    return { ok: false, message: 'Accept the Seller Agreement before submitting KYC.' }
  }

  if (!input.shippingReturnPolicyAccepted) {
    return { ok: false, message: 'Accept the Shipping and Return Policy before submitting KYC.' }
  }

  if (!input.contactFullName.trim() || !input.contactPhone.trim()) {
    return { ok: false, message: 'Contact full name and phone are required.' }
  }

  if (
    !input.streetAddress.trim()
    || !input.city.trim()
    || !input.stateProvince.trim()
    || !input.postalCode.trim()
    || !input.addressCountry.trim()
  ) {
    return { ok: false, message: 'Complete the address details before submitting KYC.' }
  }

  if (!input.businessName.trim()) {
    return { ok: false, message: 'Business name is required.' }
  }

  if (
    !input.businessStreetAddress.trim()
    || !input.businessCity.trim()
    || !input.businessStateProvince.trim()
    || !input.businessPostalCode.trim()
    || !input.businessAddressCountry.trim()
  ) {
    return { ok: false, message: 'Complete the business address before submitting KYC.' }
  }

  const formattedBusinessAddress = formatKycAddress({
    streetAddress: input.businessStreetAddress,
    addressLine2: input.businessAddressLine2,
    city: input.businessCity,
    stateProvince: input.businessStateProvince,
    postalCode: input.businessPostalCode,
    addressCountry: input.businessAddressCountry,
  })

  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user
  if (!user) {
    return { ok: false, message: 'You must be signed in as a seller.' }
  }

  const requiredDocs: Array<{ type: KycDocumentType; label: string }> = [
    { type: 'photo', label: 'seller photo' },
    { type: 'business_address_proof', label: 'business address proof (front)' },
  ]

  for (const doc of requiredDocs) {
    if (!input.documents.some((item) => item.documentType === doc.type && item.documentSlot === 1)) {
      return { ok: false, message: `Missing required document: ${doc.label}.` }
    }
  }

  if (!input.documents.some((item) => item.documentType === 'business_address_proof' && item.documentSlot === 2)) {
    return { ok: false, message: 'Missing required document: business address proof (back).' }
  }

  const now = new Date().toISOString()
  const existing = await fetchSellerKycSubmission()
  const payload = {
    user_id: user.id,
    business_type: input.businessType.trim(),
    business_name: input.businessName.trim(),
    business_address: formattedBusinessAddress,
    business_street_address: input.businessStreetAddress.trim(),
    business_address_line_2: input.businessAddressLine2.trim() || null,
    business_city: input.businessCity.trim(),
    business_state_province: input.businessStateProvince.trim(),
    business_postal_code: input.businessPostalCode.trim(),
    business_address_country: input.businessAddressCountry.trim(),
    business_same_as_individual: input.businessSameAsIndividual,
    contact_full_name: input.contactFullName.trim(),
    contact_phone: input.contactPhone.trim(),
    street_address: input.streetAddress.trim(),
    address_line_2: input.addressLine2.trim() || null,
    city: input.city.trim(),
    state_province: input.stateProvince.trim(),
    postal_code: input.postalCode.trim(),
    address_country: input.addressCountry.trim(),
    tax_id: input.taxId.trim() || null,
    account_holder_name: input.accountHolderName.trim(),
    bank_name: input.bankName.trim(),
    account_number: input.accountNumber.trim(),
    ifsc_swift: input.ifscSwift.trim(),
    terms_accepted_at: now,
    seller_agreement_accepted_at: now,
    shipping_return_policy_accepted_at: now,
  }

  const writeResult = existing
    ? await supabase.from('seller_kyc_submissions').update(payload).eq('user_id', user.id)
    : await supabase.from('seller_kyc_submissions').insert(payload)

  if (writeResult.error) {
    return { ok: false, message: writeResult.error.message }
  }

  for (const doc of input.documents) {
    const { error: docError } = await supabase.from('seller_kyc_documents').upsert(
      {
        user_id: user.id,
        document_type: doc.documentType,
        document_slot: doc.documentSlot,
        storage_path: doc.storagePath,
        file_name: doc.fileName,
        mime_type: doc.mimeType,
        is_required: doc.isRequired,
      },
      { onConflict: 'user_id,document_type,document_slot' },
    )

    if (docError) {
      return { ok: false, message: docError.message }
    }
  }

  const saved = await fetchSellerKycSubmission()
  return { ok: true, kycId: saved?.kycId }
}
