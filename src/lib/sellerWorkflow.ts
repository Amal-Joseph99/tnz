import { supabase } from './supabase'

export type KycStatus = 'not_submitted' | 'pending' | 'approved' | 'rejected'
export type ProductApprovalStatus = 'none' | 'draft' | 'pending' | 'approved' | 'rejected'

export type SellerWorkflowState = {
  kycId: string
  kycStatus: KycStatus
  warehouseCompleted: boolean
  productApprovalStatus: ProductApprovalStatus
  productName: string
  productId: number
  rejectionReason: string
}

export const defaultWorkflowState: SellerWorkflowState = {
  kycId: '',
  kycStatus: 'not_submitted',
  warehouseCompleted: false,
  productApprovalStatus: 'none',
  productName: '',
  productId: 0,
  rejectionReason: '',
}

export async function fetchSellerWorkflow(): Promise<SellerWorkflowState> {
  if (!supabase) {
    return defaultWorkflowState
  }

  const { data, error } = await supabase.rpc('get_seller_workflow_state')
  if (error || !data) {
    return defaultWorkflowState
  }

  return {
    kycId: String(data.kycId ?? ''),
    kycStatus: (data.kycStatus ?? 'not_submitted') as KycStatus,
    warehouseCompleted: Boolean(data.warehouseCompleted),
    productApprovalStatus: (data.productApprovalStatus ?? 'none') as ProductApprovalStatus,
    productName: String(data.productName ?? ''),
    productId: Number(data.productId ?? 0),
    rejectionReason: String(data.rejectionReason ?? ''),
  }
}
