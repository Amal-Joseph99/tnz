import {
  formatKycAddress,
  type KycDocumentSlot,
  type KycDocumentType,
  type SellerKycDocument,
} from './sellerKyc'
import { supabase } from './supabase'

export const KYC_WIZARD_STEP_LABELS = [
  'Contact details',
  'Business details',
  'Upload KYC',
  'Bank details',
] as const

export const TOTAL_KYC_STEPS = KYC_WIZARD_STEP_LABELS.length

export type SellerKycDraft = {
  contactFullName: string
  businessName: string
  email: string
  contactPhone: string
  streetAddress: string
  addressLine2: string
  city: string
  stateProvince: string
  postalCode: string
  addressCountry: string
  businessType: string
  businessStreetAddress: string
  businessAddressLine2: string
  businessCity: string
  businessStateProvince: string
  businessPostalCode: string
  businessAddressCountry: string
  businessSameAsIndividual: boolean
  taxId: string
  accountHolderName: string
  bankName: string
  accountNumber: string
  ifscSwift: string
  termsAndPoliciesAccepted: boolean
  sellerAgreementAccepted: boolean
  taxPayoutRulesAccepted: boolean
  kycStep: number
}

export function createEmptyKycDraft(): SellerKycDraft {
  return {
    contactFullName: '',
    businessName: '',
    email: '',
    contactPhone: '',
    streetAddress: '',
    addressLine2: '',
    city: '',
    stateProvince: '',
    postalCode: '',
    addressCountry: '',
    businessType: 'Individual',
    businessStreetAddress: '',
    businessAddressLine2: '',
    businessCity: '',
    businessStateProvince: '',
    businessPostalCode: '',
    businessAddressCountry: '',
    businessSameAsIndividual: false,
    taxId: '',
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    ifscSwift: '',
    termsAndPoliciesAccepted: false,
    sellerAgreementAccepted: false,
    taxPayoutRulesAccepted: false,
    kycStep: 1,
  }
}

type MutationResult = { ok: true; kycId?: string; submittedAt?: string } | { ok: false; message: string }

function draftToPayload(draft: SellerKycDraft) {
  return {
    contactFullName: draft.contactFullName,
    businessName: draft.businessName,
    contactPhone: draft.contactPhone,
    streetAddress: draft.streetAddress,
    addressLine2: draft.addressLine2,
    city: draft.city,
    stateProvince: draft.stateProvince,
    postalCode: draft.postalCode,
    addressCountry: draft.addressCountry,
    businessType: draft.businessType,
    businessStreetAddress: draft.businessStreetAddress,
    businessAddressLine2: draft.businessAddressLine2,
    businessCity: draft.businessCity,
    businessStateProvince: draft.businessStateProvince,
    businessPostalCode: draft.businessPostalCode,
    businessAddressCountry: draft.businessAddressCountry,
    businessSameAsIndividual: draft.businessSameAsIndividual,
    businessAddress: formatKycAddress({
      streetAddress: draft.businessStreetAddress,
      addressLine2: draft.businessAddressLine2,
      city: draft.businessCity,
      stateProvince: draft.businessStateProvince,
      postalCode: draft.businessPostalCode,
      addressCountry: draft.businessAddressCountry,
    }),
    taxId: draft.taxId,
    accountHolderName: draft.accountHolderName,
    bankName: draft.bankName,
    accountNumber: draft.accountNumber,
    ifscSwift: draft.ifscSwift,
    termsAndPoliciesAccepted: draft.termsAndPoliciesAccepted,
    sellerAgreementAccepted: draft.sellerAgreementAccepted,
    taxPayoutRulesAccepted: draft.taxPayoutRulesAccepted,
  }
}

export function validateKycStep1(draft: SellerKycDraft): string | null {
  if (!draft.contactFullName.trim()) return 'Full name is required.'
  if (!draft.businessName.trim()) return 'Business name is required.'
  if (!draft.contactPhone.trim()) return 'Mobile number is required.'
  if (
    !draft.streetAddress.trim()
    || !draft.city.trim()
    || !draft.stateProvince.trim()
    || !draft.postalCode.trim()
    || !draft.addressCountry.trim()
  ) {
    return 'Complete permanent address before continuing.'
  }
  return null
}

export function validateKycStep2(draft: SellerKycDraft): string | null {
  if (!draft.businessName.trim()) return 'Business name is required.'
  if (!draft.businessType.trim()) return 'Type of business is required.'
  if (
    !draft.businessStreetAddress.trim()
    || !draft.businessCity.trim()
    || !draft.businessStateProvince.trim()
    || !draft.businessPostalCode.trim()
    || !draft.businessAddressCountry.trim()
  ) {
    return 'Complete business address before continuing.'
  }
  return null
}

export function validateKycStep3(documents: SellerKycDocument[]): string | null {
  if (!documents.some((doc) => doc.documentType === 'photo' && doc.documentSlot === 1)) {
    return 'Upload your photo before continuing.'
  }
  if (!documents.some((doc) => doc.documentType === 'business_address_proof' && doc.documentSlot === 1)) {
    return 'Upload the front of your business address proof.'
  }
  if (!documents.some((doc) => doc.documentType === 'business_address_proof' && doc.documentSlot === 2)) {
    return 'Upload the back of your business address proof.'
  }
  return null
}

export function validateKycStep4(draft: SellerKycDraft): string | null {
  if (!draft.accountHolderName.trim()) return 'Account holder name is required.'
  if (!draft.bankName.trim()) return 'Bank name is required.'
  if (!draft.accountNumber.trim()) return 'Account number is required.'
  if (!draft.ifscSwift.trim()) return 'IFSC / SWIFT code is required.'
  if (!draft.termsAndPoliciesAccepted) return 'Accept Terms & Policies before submitting.'
  if (!draft.sellerAgreementAccepted) return 'Accept the Seller Agreement before submitting.'
  if (!draft.taxPayoutRulesAccepted) return 'Accept Tax & Payout Rules before submitting.'
  return null
}

export async function saveSellerKycDraftStep(
  step: number,
  draft: SellerKycDraft,
): Promise<MutationResult> {
  if (!supabase) return { ok: false, message: 'Supabase is not configured.' }

  const { data, error } = await supabase.rpc('save_seller_kyc_draft', {
    p_step: step,
    p_payload: draftToPayload(draft),
  })

  if (error) return { ok: false, message: error.message }
  return { ok: true, kycId: String(data?.kycId ?? '') }
}

export async function submitSellerKycForApproval(draft: SellerKycDraft): Promise<MutationResult> {
  if (!supabase) return { ok: false, message: 'Supabase is not configured.' }

  const validationError = validateKycStep4(draft)
  if (validationError) return { ok: false, message: validationError }

  const { data, error } = await supabase.rpc('submit_seller_kyc_for_approval', {
    p_payload: draftToPayload(draft),
  })

  if (error) return { ok: false, message: error.message }
  return {
    ok: true,
    kycId: String(data?.kycId ?? ''),
    submittedAt: String(data?.submittedAt ?? new Date().toISOString()),
  }
}

export async function upsertSellerKycDocument(doc: SellerKycDocument): Promise<MutationResult> {
  if (!supabase) return { ok: false, message: 'Supabase is not configured.' }

  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user
  if (!user) return { ok: false, message: 'You must be signed in.' }

  const { error } = await supabase.from('seller_kyc_documents').upsert(
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

  if (error) return { ok: false, message: error.message }
  return { ok: true }
}

export async function deleteSellerKycDocument(
  documentType: KycDocumentType,
  documentSlot: KycDocumentSlot,
  storagePath?: string,
): Promise<MutationResult> {
  if (!supabase) return { ok: false, message: 'Supabase is not configured.' }

  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user
  if (!user) return { ok: false, message: 'You must be signed in.' }

  if (storagePath) {
    await supabase.storage.from('seller-kyc').remove([storagePath])
  }

  const { error } = await supabase
    .from('seller_kyc_documents')
    .delete()
    .eq('user_id', user.id)
    .eq('document_type', documentType)
    .eq('document_slot', documentSlot)

  if (error) return { ok: false, message: error.message }
  return { ok: true }
}

export const KYC_UPLOAD_SECTIONS = [
  {
    title: 'Your photo',
    documentType: 'photo' as KycDocumentType,
    required: true,
    slots: [{ slot: 1 as KycDocumentSlot, label: 'Upload photo' }],
  },
  {
    title: 'Business address proof',
    documentType: 'business_address_proof' as KycDocumentType,
    required: true,
    slots: [
      { slot: 1 as KycDocumentSlot, label: 'Front' },
      { slot: 2 as KycDocumentSlot, label: 'Back' },
    ],
  },
  {
    title: 'Tax ID',
    documentType: 'tax_certificate' as KycDocumentType,
    required: false,
    slots: [{ slot: 1 as KycDocumentSlot, label: 'Upload tax ID' }],
  },
] as const
