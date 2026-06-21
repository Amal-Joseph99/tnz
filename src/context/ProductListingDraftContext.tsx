import { createContext, useContext, type ReactNode } from 'react'
import type { ProductListingDraft, ProductListingWizardOptions } from '../lib/productListingWizard'

export type ProductListingDraftContextValue = {
  draft: ProductListingDraft
  options: ProductListingWizardOptions
  productId: number | null
  isReadOnly: boolean
  saving: boolean
  autoSaveMessage: string
  error: string
  setDraft: (updater: (current: ProductListingDraft) => ProductListingDraft) => void
  saveDraft: (step: number, options?: { generateSku?: boolean }) => Promise<boolean>
  reloadDraft: () => Promise<void>
}

export const ProductListingDraftContext = createContext<ProductListingDraftContextValue | null>(null)

export function useProductListingDraft() {
  const context = useContext(ProductListingDraftContext)
  if (!context) {
    throw new Error('useProductListingDraft must be used within ProductListingDraftProvider')
  }
  return context
}

export function ProductListingDraftProvider({
  value,
  children,
}: {
  value: ProductListingDraftContextValue
  children: ReactNode
}) {
  return <ProductListingDraftContext.Provider value={value}>{children}</ProductListingDraftContext.Provider>
}
