import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { applyDialogPlaceholders, fetchDialogMessage } from '../lib/appDialogs'

type ConfirmOptions = {
  placeholders?: Record<string, string>
}

type ConfirmDialogContextValue = {
  confirmAction: (actionKey: string, options?: ConfirmOptions) => Promise<boolean>
}

const ConfirmDialogContext = createContext<ConfirmDialogContextValue | null>(null)

type ActiveDialog = {
  actionKey: string
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  resolve: (confirmed: boolean) => void
}

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [activeDialog, setActiveDialog] = useState<ActiveDialog | null>(null)

  const confirmAction = useCallback(async (actionKey: string, options?: ConfirmOptions) => {
    const dialog = await fetchDialogMessage(actionKey)
    if (!dialog) {
      return window.confirm('Are you sure?')
    }

    const message = applyDialogPlaceholders(dialog.message, options?.placeholders ?? {})

    return new Promise<boolean>((resolve) => {
      setActiveDialog({
        actionKey,
        title: dialog.title,
        message,
        confirmLabel: dialog.confirmLabel,
        cancelLabel: dialog.cancelLabel,
        resolve,
      })
    })
  }, [])

  const closeDialog = useCallback((confirmed: boolean) => {
    setActiveDialog((current) => {
      current?.resolve(confirmed)
      return null
    })
  }, [])

  useEffect(() => {
    if (!activeDialog) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeDialog(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeDialog, closeDialog])

  const value = useMemo(() => ({ confirmAction }), [confirmAction])

  return (
    <ConfirmDialogContext.Provider value={value}>
      {children}
      {activeDialog && (
        <div className="confirm-dialog__backdrop" role="presentation" onClick={() => closeDialog(false)}>
          <div
            className="confirm-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-message"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="confirm-dialog-title">{activeDialog.title}</h2>
            <p id="confirm-dialog-message">{activeDialog.message}</p>
            <div className="confirm-dialog__actions">
              <button type="button" className="confirm-dialog__cancel" onClick={() => closeDialog(false)}>
                {activeDialog.cancelLabel}
              </button>
              <button type="button" className="confirm-dialog__confirm" onClick={() => closeDialog(true)}>
                {activeDialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmDialogContext.Provider>
  )
}

export function useConfirmDialog() {
  const context = useContext(ConfirmDialogContext)
  if (!context) {
    throw new Error('useConfirmDialog must be used within ConfirmDialogProvider')
  }
  return context
}
