import { supabase } from './supabase'

export type AdminWarehouseRow = {
  userId: string
  sellerEmail: string
  businessName: string
  warehouseId: string
  addressTagLabel: string
  addressLine1: string
  landmark: string | null
  postalCode: string
  city: string
  stateName: string
  countryName: string
  latitude: number | null
  longitude: number | null
  locationLabel: string | null
  contactName: string
  contactEmail: string
  contactPhone: string
  contactRoleLabel: string
  operationalDays: string[]
  openingTime: string
  closingTime: string
  isSupplierAddress: boolean
  supplierName: string | null
  supplierGstin: string | null
  isCompleted: boolean
  shiprocketPickupLocationName: string | null
  shiprocketPickupSyncedAt: string | null
  updatedAt: string
}

export type AdminWarehouseUpdateInput = {
  addressLine1: string
  landmark: string
  postalCode: string
  city: string
  stateName: string
  countryName: string
  contactName: string
  contactEmail: string
  contactPhone: string
  openingTime: string
  closingTime: string
  supplierName: string
  supplierGstin: string
}

export const ADMIN_SHIPPING_PARTNERS = [
  { id: 'shiprocket', label: 'Shiprocket' },
] as const

function mapWarehouseRow(row: Record<string, unknown>): AdminWarehouseRow {
  return {
    userId: String(row.user_id ?? row.userId ?? ''),
    sellerEmail: String(row.seller_email ?? row.sellerEmail ?? ''),
    businessName: String(row.business_name ?? row.businessName ?? ''),
    warehouseId: String(row.warehouse_id ?? row.warehouseId ?? ''),
    addressTagLabel: String(row.address_tag_label ?? row.addressTagLabel ?? ''),
    addressLine1: String(row.address_line_1 ?? row.addressLine1 ?? ''),
    landmark: row.landmark ? String(row.landmark) : null,
    postalCode: String(row.postal_code ?? row.postalCode ?? ''),
    city: String(row.city ?? ''),
    stateName: String(row.state_name ?? row.stateName ?? ''),
    countryName: String(row.country_name ?? row.countryName ?? ''),
    latitude: row.latitude != null ? Number(row.latitude) : null,
    longitude: row.longitude != null ? Number(row.longitude) : null,
    locationLabel: row.location_label ? String(row.location_label) : null,
    contactName: String(row.contact_name ?? row.contactName ?? ''),
    contactEmail: String(row.contact_email ?? row.contactEmail ?? ''),
    contactPhone: String(row.contact_phone ?? row.contactPhone ?? ''),
    contactRoleLabel: String(row.contact_role_label ?? row.contactRoleLabel ?? ''),
    operationalDays: (() => {
      const days = row.operational_days ?? row.operationalDays
      return Array.isArray(days) ? days.map((day) => String(day)) : []
    })(),
    openingTime: String(row.opening_time ?? row.openingTime ?? ''),
    closingTime: String(row.closing_time ?? row.closingTime ?? ''),
    isSupplierAddress: Boolean(row.is_supplier_address ?? row.isSupplierAddress),
    supplierName: row.supplier_name ? String(row.supplier_name) : null,
    supplierGstin: row.supplier_gstin ? String(row.supplier_gstin) : null,
    isCompleted: Boolean(row.is_completed ?? row.isCompleted),
    shiprocketPickupLocationName: row.shiprocket_pickup_location_name
      ? String(row.shiprocket_pickup_location_name)
      : null,
    shiprocketPickupSyncedAt: row.shiprocket_pickup_synced_at
      ? String(row.shiprocket_pickup_synced_at)
      : null,
    updatedAt: String(row.updated_at ?? row.updatedAt ?? ''),
  }
}

export async function fetchAdminWarehouses(): Promise<AdminWarehouseRow[]> {
  if (!supabase) return []

  const { data, error } = await supabase.rpc('list_admin_warehouses')
  if (error || !data || !Array.isArray(data)) return []

  return data.map((row) => mapWarehouseRow(row as Record<string, unknown>))
}

export async function fetchAdminWarehouse(userId: string): Promise<AdminWarehouseRow | null> {
  if (!supabase) return null

  const { data, error } = await supabase.rpc('get_admin_warehouse', { p_user_id: userId })
  if (error || !data || typeof data !== 'object') return null

  return mapWarehouseRow(data as Record<string, unknown>)
}

export async function updateAdminWarehouse(
  userId: string,
  input: AdminWarehouseUpdateInput,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!supabase) return { ok: false, message: 'Supabase is not configured.' }

  const { error } = await supabase.rpc('admin_update_seller_warehouse', {
    p_user_id: userId,
    p_payload: input,
  })

  if (error) return { ok: false, message: error.message }
  return { ok: true }
}

export async function syncAdminWarehousePickup(
  userId: string,
  provider: string,
): Promise<{ ok: true; pickupLocationName: string } | { ok: false; message: string }> {
  if (!supabase) return { ok: false, message: 'Supabase is not configured.' }

  const { data, error } = await supabase.functions.invoke('shiprocket-sync-pickup', {
    body: { userId, provider },
  })

  if (error) return { ok: false, message: error.message }
  if (data && typeof data === 'object' && 'error' in data && typeof data.error === 'string') {
    return { ok: false, message: data.error }
  }

  return {
    ok: true,
    pickupLocationName: String((data as { pickupLocationName?: string }).pickupLocationName ?? ''),
  }
}
