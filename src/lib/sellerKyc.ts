import { supabase } from './supabase'

export type KycDocumentType = 'photo' | 'address_proof' | 'tax_id_proof'

export type SellerAccountProfile = {
  businessName: string
  email: string
  countryName: string
  phone: string
}

export type SellerKycSubmission = {
  userId: string
  kycId: string
  status: 'pending' | 'approved' | 'rejected'
  businessType: string
  businessName: string
  businessAddress: string
  taxId: string
  accountHolderName: string
  bankName: string
  accountNumber: string
  ifscSwift: string
  submittedAt: string
  rejectionReason: string | null
}

export type SellerKycDocument = {
  documentType: KycDocumentType
  storagePath: string
  fileName: string
  mimeType: string | null
  isRequired: boolean
}

export type SellerKycInput = {
  businessType: string
  businessName: string
  businessAddress: string
  taxId: string
  accountHolderName: string
  bankName: string
  accountNumber: string
  ifscSwift: string
  termsAccepted: boolean
  documents: SellerKycDocument[]
}

type MutationResult = { ok: true } | { ok: false; message: string }

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
    taxId: data.tax_id ?? '',
    accountHolderName: data.account_holder_name,
    bankName: data.bank_name,
    accountNumber: data.account_number,
    ifscSwift: data.ifsc_swift,
    submittedAt: data.submitted_at,
    rejectionReason: data.rejection_reason,
  }
}

export async function fetchSellerKycDocuments(): Promise<SellerKycDocument[]> {
  if (!supabase) return []

  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user
  if (!user) return []

  const { data, error } = await supabase
    .from('seller_kyc_documents')
    .select('document_type, storage_path, file_name, mime_type, is_required')
    .eq('user_id', user.id)

  if (error || !data) return []

  return data.map((row) => ({
    documentType: row.document_type as KycDocumentType,
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

  if (!input.termsAccepted) {
    return { ok: false, message: 'Accept the seller terms and conditions before submitting KYC.' }
  }

  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user
  if (!user) {
    return { ok: false, message: 'You must be signed in as a seller.' }
  }

  const requiredDocs: KycDocumentType[] = ['photo', 'address_proof']
  for (const docType of requiredDocs) {
    if (!input.documents.some((doc) => doc.documentType === docType)) {
      return { ok: false, message: `Missing required document: ${docType.replace('_', ' ')}.` }
    }
  }

  const existing = await fetchSellerKycSubmission()
  const payload = {
    user_id: user.id,
    business_type: input.businessType.trim(),
    business_name: input.businessName.trim(),
    business_address: input.businessAddress.trim(),
    tax_id: input.taxId.trim() || null,
    account_holder_name: input.accountHolderName.trim(),
    bank_name: input.bankName.trim(),
    account_number: input.accountNumber.trim(),
    ifsc_swift: input.ifscSwift.trim(),
    terms_accepted_at: new Date().toISOString(),
  }

  const writeResult = existing?.status === 'rejected'
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
        storage_path: doc.storagePath,
        file_name: doc.fileName,
        mime_type: doc.mimeType,
        is_required: doc.isRequired,
      },
      { onConflict: 'user_id,document_type' },
    )

    if (docError) {
      return { ok: false, message: docError.message }
    }
  }

  const saved = await fetchSellerKycSubmission()
  return { ok: true, kycId: saved?.kycId }
}
