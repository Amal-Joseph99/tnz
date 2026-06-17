export type KycStatus = 'not_submitted' | 'pending' | 'approved' | 'rejected'
export type ProductApprovalStatus = 'none' | 'pending' | 'approved' | 'rejected'

export type SellerWorkflowState = {
  kycId: string
  kycStatus: KycStatus
  warehouseCompleted: boolean
  productApprovalStatus: ProductApprovalStatus
  productName: string
}

const STORAGE_KEY = 'agtrenz-seller-workflow'

export const defaultWorkflowState: SellerWorkflowState = {
  kycId: '',
  kycStatus: 'not_submitted',
  warehouseCompleted: false,
  productApprovalStatus: 'none',
  productName: '',
}

export function createKycId() {
  return Math.floor(100000000000 + Math.random() * 900000000000).toString()
}

export function getSellerWorkflow(): SellerWorkflowState {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    return saved ? { ...defaultWorkflowState, ...JSON.parse(saved) } : defaultWorkflowState
  } catch {
    return defaultWorkflowState
  }
}

export function saveSellerWorkflow(nextState: SellerWorkflowState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState))
}

export function updateSellerWorkflow(
  updater: (state: SellerWorkflowState) => SellerWorkflowState,
) {
  const nextState = updater(getSellerWorkflow())
  saveSellerWorkflow(nextState)
  return nextState
}
