import { supabase } from './supabase'

export type SellerWarehouse = {
  warehouseName: string
  addressLine: string
  postalCode: string
  dispatchCutoffTime: string
  isCompleted: boolean
}

export type SellerWarehouseInput = {
  warehouseName: string
  addressLine: string
  postalCode: string
  dispatchCutoffTime: string
}

type MutationResult = { ok: true } | { ok: false; message: string }

export async function fetchSellerWarehouse(): Promise<SellerWarehouse | null> {
  if (!supabase) return null

  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user
  if (!user) return null

  const { data, error } = await supabase
    .from('seller_warehouses')
    .select('warehouse_name, address_line, postal_code, dispatch_cutoff_time, is_completed')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error || !data) return null

  return {
    warehouseName: data.warehouse_name,
    addressLine: data.address_line,
    postalCode: data.postal_code,
    dispatchCutoffTime: String(data.dispatch_cutoff_time).slice(0, 5),
    isCompleted: data.is_completed,
  }
}

export async function saveSellerWarehouse(input: SellerWarehouseInput): Promise<MutationResult> {
  if (!supabase) {
    return { ok: false, message: 'Supabase is not configured.' }
  }

  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user
  if (!user) {
    return { ok: false, message: 'You must be signed in as a seller.' }
  }

  const { error } = await supabase.from('seller_warehouses').upsert({
    user_id: user.id,
    warehouse_name: input.warehouseName.trim(),
    address_line: input.addressLine.trim(),
    postal_code: input.postalCode.trim(),
    dispatch_cutoff_time: input.dispatchCutoffTime,
    is_completed: true,
  })

  if (error) {
    return { ok: false, message: error.message }
  }

  return { ok: true }
}
