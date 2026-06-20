import { supabase } from './supabase'

export type DialogMessage = {
  actionKey: string
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  redirectPath: string | null
}

const dialogCache = new Map<string, DialogMessage>()

function mapDialogRow(row: {
  action_key: string
  title: string
  message: string
  confirm_label: string
  cancel_label: string
  redirect_path: string | null
}): DialogMessage {
  return {
    actionKey: row.action_key,
    title: row.title,
    message: row.message,
    confirmLabel: row.confirm_label,
    cancelLabel: row.cancel_label,
    redirectPath: row.redirect_path,
  }
}

export function applyDialogPlaceholders(message: string, values: Record<string, string>) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{{${key}}}`, value),
    message,
  )
}

export async function fetchDialogMessage(actionKey: string): Promise<DialogMessage | null> {
  const cached = dialogCache.get(actionKey)
  if (cached) return cached

  if (!supabase) return null

  const { data, error } = await supabase.rpc('get_dialog_message', {
    p_action_key: actionKey,
  })

  if (error || !data || typeof data !== 'object') return null

  const row = data as {
    action_key: string
    title: string
    message: string
    confirm_label: string
    cancel_label: string
    redirect_path: string | null
  }

  const dialog = mapDialogRow(row)
  dialogCache.set(actionKey, dialog)
  return dialog
}

export async function preloadDialogMessages(actionKeys: string[]) {
  await Promise.all(actionKeys.map((actionKey) => fetchDialogMessage(actionKey)))
}
