import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { KycSuccessDialog } from '../components/kyc/KycSuccessDialog'
import { KycWizardNav, KycWizardShell } from '../components/kyc/KycWizardShell'
import { SellerDashboardShell } from '../components/SellerDashboardShell'
import { detectLocationWithOpenCage } from '../lib/opencage'
import { fetchSellerCountryOptions, type SellerCountryOption } from '../lib/sellerCountries'
import {
  fetchSellerAccountProfile,
  fetchSellerKycDocuments,
  fetchSellerKycSubmission,
  kycDocumentKey,
  type KycDocumentSlot,
  type KycDocumentType,
  type SellerKycDocument,
} from '../lib/sellerKyc'
import {
  createEmptyKycDraft,
  deleteSellerKycDocument,
  saveSellerKycDraftStep,
  submitSellerKycForApproval,
  TOTAL_KYC_STEPS,
  upsertSellerKycDocument,
  validateKycStep1,
  validateKycStep2,
  validateKycStep3,
  type SellerKycDraft,
} from '../lib/sellerKycWizard'
import { uploadKycDocument } from '../lib/sellerStorage'
import { fetchSellerWorkflow, type SellerWorkflowState } from '../lib/sellerWorkflow'
import { KycStep1Contact } from './kyc/KycStep1Contact'
import { KycStep2Business } from './kyc/KycStep2Business'
import { KycStep3Upload } from './kyc/KycStep3Upload'
import { KycStep4Bank } from './kyc/KycStep4Bank'

function parseStep(value: string | undefined) {
  const step = Number.parseInt(value ?? '1', 10)
  if (!Number.isFinite(step) || step < 1 || step > TOTAL_KYC_STEPS) return 1
  return step
}

export function SellerKycVerificationPage() {
  const navigate = useNavigate()
  const { step: stepParam } = useParams()
  const currentStep = parseStep(stepParam)

  const [workflow, setWorkflow] = useState<SellerWorkflowState | null>(null)
  const [draft, setDraft] = useState<SellerKycDraft>(createEmptyKycDraft())
  const [documents, setDocuments] = useState<SellerKycDocument[]>([])
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [countries, setCountries] = useState<SellerCountryOption[]>([])
  const [kycId, setKycId] = useState('')
  const [rejectionReason, setRejectionReason] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [locating, setLocating] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)
  const [submittedAt, setSubmittedAt] = useState('')

  const kycLocked = workflow?.kycStatus === 'pending' || workflow?.kycStatus === 'approved'
  const readOnly = kycLocked

  const goToStep = useCallback(
    (step: number) => navigate(`/seller/kyc/step/${step}`),
    [navigate],
  )

  const patchDraft = useCallback((patch: Partial<SellerKycDraft>) => {
    setDraft((current) => ({ ...current, ...patch }))
  }, [])

  useEffect(() => {
    let active = true

    Promise.all([
      fetchSellerWorkflow(),
      fetchSellerAccountProfile(),
      fetchSellerKycSubmission(),
      fetchSellerKycDocuments(),
      fetchSellerCountryOptions(),
    ])
      .then(([workflowState, accountProfile, submission, kycDocuments, countryOptions]) => {
        if (!active) return

        setWorkflow(workflowState)
        setCountries(countryOptions)
        setDocuments(kycDocuments)

        const nextDraft = createEmptyKycDraft()
        if (accountProfile) {
          nextDraft.email = accountProfile.email
          nextDraft.businessName = submission?.businessName || accountProfile.businessName
          nextDraft.contactFullName = submission?.contactFullName || accountProfile.businessName
          nextDraft.contactPhone = submission?.contactPhone || accountProfile.phone
          nextDraft.addressCountry = submission?.addressCountry || accountProfile.countryName
          nextDraft.accountHolderName = submission?.accountHolderName || accountProfile.businessName
        }

        if (submission) {
          nextDraft.businessName = submission.businessName
          nextDraft.businessType = submission.businessType
          nextDraft.businessStreetAddress = submission.businessStreetAddress
          nextDraft.businessAddressLine2 = submission.businessAddressLine2
          nextDraft.businessCity = submission.businessCity
          nextDraft.businessStateProvince = submission.businessStateProvince
          nextDraft.businessPostalCode = submission.businessPostalCode
          nextDraft.businessAddressCountry = submission.businessAddressCountry
          nextDraft.businessSameAsIndividual = submission.businessSameAsIndividual
          nextDraft.contactFullName = submission.contactFullName
          nextDraft.contactPhone = submission.contactPhone
          nextDraft.streetAddress = submission.streetAddress
          nextDraft.addressLine2 = submission.addressLine2
          nextDraft.city = submission.city
          nextDraft.stateProvince = submission.stateProvince
          nextDraft.postalCode = submission.postalCode
          nextDraft.addressCountry = submission.addressCountry
          nextDraft.taxId = submission.taxId
          nextDraft.accountHolderName = submission.accountHolderName
          nextDraft.bankName = submission.bankName
          nextDraft.accountNumber = submission.accountNumber
          nextDraft.ifscSwift = submission.ifscSwift
          nextDraft.kycStep = submission.kycStep
          setKycId(submission.kycId)
          setRejectionReason(submission.rejectionReason)
        } else if (workflowState.kycId) {
          setKycId(workflowState.kycId)
        }

        setDraft(nextDraft)

        const progress: Record<string, number> = {}
        for (const doc of kycDocuments) {
          progress[kycDocumentKey(doc.documentType, doc.documentSlot)] = 100
        }
        setUploadProgress(progress)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!draft.businessSameAsIndividual) return
    setDraft((current) => ({
      ...current,
      businessStreetAddress: current.streetAddress,
      businessAddressLine2: current.addressLine2,
      businessCity: current.city,
      businessStateProvince: current.stateProvince,
      businessPostalCode: current.postalCode,
      businessAddressCountry: current.addressCountry,
    }))
  }, [
    draft.businessSameAsIndividual,
    draft.streetAddress,
    draft.addressLine2,
    draft.city,
    draft.stateProvince,
    draft.postalCode,
    draft.addressCountry,
  ])

  const countryOptions = useMemo(
    () => countries.map((country) => country.country_name),
    [countries],
  )

  const handleUseCurrentLocation = async () => {
    setLocating(true)
    setError('')
    try {
      const detected = await detectLocationWithOpenCage()
      if (!detected) {
        setError('Unable to detect your location. Enter the address manually.')
        return
      }
      patchDraft({
        city: detected.city,
        stateProvince: detected.state,
        addressCountry: detected.country,
      })
    } finally {
      setLocating(false)
    }
  }

  const handleDocumentUpload = async (
    documentType: KycDocumentType,
    documentSlot: KycDocumentSlot,
    file: File,
    required: boolean,
  ) => {
    if (readOnly) return

    const progressKey = kycDocumentKey(documentType, documentSlot)
    setError('')
    setUploadProgress((current) => ({ ...current, [progressKey]: 20 }))

    const upload = await uploadKycDocument(documentType, file, documentSlot)
    if (!upload.ok) {
      setUploadProgress((current) => ({ ...current, [progressKey]: 0 }))
      setError(upload.message)
      return
    }

    setUploadProgress((current) => ({ ...current, [progressKey]: 70 }))

    const nextDocument: SellerKycDocument = {
      documentType,
      documentSlot,
      storagePath: upload.storagePath,
      fileName: upload.fileName,
      mimeType: upload.mimeType,
      isRequired: required,
    }

    const saved = await upsertSellerKycDocument(nextDocument)
    if (!saved.ok) {
      setUploadProgress((current) => ({ ...current, [progressKey]: 0 }))
      setError(saved.message)
      return
    }

    setDocuments((current) => [
      ...current.filter(
        (doc) => !(doc.documentType === documentType && doc.documentSlot === documentSlot),
      ),
      nextDocument,
    ])
    setUploadProgress((current) => ({ ...current, [progressKey]: 100 }))
  }

  const handleDocumentDelete = async (documentType: KycDocumentType, documentSlot: KycDocumentSlot) => {
    if (readOnly) return

    const existing = documents.find(
      (doc) => doc.documentType === documentType && doc.documentSlot === documentSlot,
    )
    const progressKey = kycDocumentKey(documentType, documentSlot)

    const result = await deleteSellerKycDocument(documentType, documentSlot, existing?.storagePath)
    if (!result.ok) {
      setError(result.message)
      return
    }

    setDocuments((current) =>
      current.filter((doc) => !(doc.documentType === documentType && doc.documentSlot === documentSlot)),
    )
    setUploadProgress((current) => ({ ...current, [progressKey]: 0 }))
  }

  const handleNext = async () => {
    setError('')
    let validationError: string | null = null

    if (currentStep === 1) validationError = validateKycStep1(draft)
    if (currentStep === 2) validationError = validateKycStep2(draft)
    if (currentStep === 3) validationError = validateKycStep3(documents)

    if (validationError) {
      setError(validationError)
      return
    }

    if (readOnly) {
      goToStep(Math.min(currentStep + 1, TOTAL_KYC_STEPS))
      return
    }

    setSaving(true)
    const result = await saveSellerKycDraftStep(currentStep, draft)
    setSaving(false)

    if (!result.ok) {
      setError(result.message)
      return
    }

    if (result.kycId) setKycId(result.kycId)
    patchDraft({ kycStep: Math.max(draft.kycStep, currentStep) })
    goToStep(currentStep + 1)
  }

  const handleSubmit = async () => {
    setError('')
    setSaving(true)
    const result = await submitSellerKycForApproval(draft)
    setSaving(false)

    if (!result.ok) {
      setError(result.message)
      return
    }

    const nextWorkflow = await fetchSellerWorkflow()
    setWorkflow(nextWorkflow)
    if (result.kycId) setKycId(result.kycId)
    setSubmittedAt(result.submittedAt ?? new Date().toISOString())
    setSuccessOpen(true)
  }

  if (loading || !workflow) {
    return (
      <SellerDashboardShell>
        <p>Loading KYC verification...</p>
      </SellerDashboardShell>
    )
  }

  if (!stepParam) {
    const resumeStep = Math.min(Math.max(workflow.kycStatus === 'draft' ? draft.kycStep : 1, 1), TOTAL_KYC_STEPS)
    return <Navigate to={`/seller/kyc/step/${resumeStep}`} replace />
  }

  return (
    <SellerDashboardShell>
      {error ? <div className="auth-message auth-message--error">{error}</div> : null}

      <KycWizardShell currentStep={currentStep}>
        {currentStep === 1 ? (
          <KycStep1Contact
            draft={draft}
            countryOptions={countryOptions}
            disabled={readOnly}
            locating={locating}
            onChange={patchDraft}
            onUseCurrentLocation={handleUseCurrentLocation}
          />
        ) : null}

        {currentStep === 2 ? (
          <KycStep2Business
            draft={draft}
            countryOptions={countryOptions}
            disabled={readOnly}
            onChange={patchDraft}
          />
        ) : null}

        {currentStep === 3 ? (
          <KycStep3Upload
            documents={documents}
            uploadProgress={uploadProgress}
            disabled={readOnly}
            onUpload={handleDocumentUpload}
            onDelete={handleDocumentDelete}
          />
        ) : null}

        {currentStep === 4 ? (
          <KycStep4Bank
            draft={draft}
            disabled={readOnly}
            saving={saving}
            rejectionReason={rejectionReason}
            onChange={patchDraft}
            onSubmit={handleSubmit}
          />
        ) : null}

        {currentStep < 4 ? (
          <KycWizardNav
            onBack={currentStep > 1 ? () => goToStep(currentStep - 1) : undefined}
            onNext={handleNext}
            saving={saving}
            nextLabel={readOnly ? 'Next' : 'Next'}
          />
        ) : currentStep === 4 && readOnly ? (
          <KycWizardNav onBack={() => goToStep(3)} nextLabel="Back to uploads" onNext={undefined} />
        ) : currentStep === 4 ? (
          <KycWizardNav onBack={() => goToStep(3)} />
        ) : null}
      </KycWizardShell>

      <KycSuccessDialog
        open={successOpen}
        kycId={kycId}
        submittedAt={submittedAt}
        onClose={() => {
          setSuccessOpen(false)
          goToStep(4)
        }}
      />
    </SellerDashboardShell>
  )
}
