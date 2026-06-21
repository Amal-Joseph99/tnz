import { supabase } from './supabase'

export type WarehouseOption = {
  id: number
  code: string
  label: string
  sortOrder: number
}

export type WarehouseTimeSlotOption = {
  id: number
  time: string
  label: string
  sortOrder: number
}

export type WarehouseFormOptions = {
  addressTags: WarehouseOption[]
  contactRoles: WarehouseOption[]
  weekdays: WarehouseOption[]
  timeSlots: WarehouseTimeSlotOption[]
}

function mapOption(row: Record<string, unknown>): WarehouseOption {
  return {
    id: Number(row.id),
    code: String(row.code),
    label: String(row.label),
    sortOrder: Number(row.sortOrder ?? 0),
  }
}

function mapTimeSlot(row: Record<string, unknown>): WarehouseTimeSlotOption {
  return {
    id: Number(row.id),
    time: String(row.time),
    label: String(row.label),
    sortOrder: Number(row.sortOrder ?? 0),
  }
}

export async function fetchWarehouseFormOptions(): Promise<WarehouseFormOptions> {
  const empty: WarehouseFormOptions = {
    addressTags: [],
    contactRoles: [],
    weekdays: [],
    timeSlots: [],
  }

  if (!supabase) return empty

  const { data, error } = await supabase.rpc('list_warehouse_form_options')
  if (error || !data || typeof data !== 'object') return empty

  const payload = data as Record<string, unknown>

  return {
    addressTags: Array.isArray(payload.addressTags)
      ? payload.addressTags.map((row) => mapOption(row as Record<string, unknown>))
      : [],
    contactRoles: Array.isArray(payload.contactRoles)
      ? payload.contactRoles.map((row) => mapOption(row as Record<string, unknown>))
      : [],
    weekdays: Array.isArray(payload.weekdays)
      ? payload.weekdays.map((row) => mapOption(row as Record<string, unknown>))
      : [],
    timeSlots: Array.isArray(payload.timeSlots)
      ? payload.timeSlots.map((row) => mapTimeSlot(row as Record<string, unknown>))
      : [],
  }
}
