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
  updatedAt: string
}

export async function fetchAdminWarehouses(): Promise<AdminWarehouseRow[]> {
  if (!supabase) return []

  const { data, error } = await supabase.rpc('list_admin_warehouses')
  if (error || !data || !Array.isArray(data)) return []

  return data.map((row: Record<string, unknown>) => ({
    userId: String(row.user_id),
    sellerEmail: String(row.seller_email ?? ''),
    businessName: String(row.business_name ?? ''),
    warehouseId: String(row.warehouse_id ?? ''),
    addressTagLabel: String(row.address_tag_label ?? ''),
    addressLine1: String(row.address_line_1 ?? ''),
    landmark: row.landmark ? String(row.landmark) : null,
    postalCode: String(row.postal_code ?? ''),
    city: String(row.city ?? ''),
    stateName: String(row.state_name ?? ''),
    countryName: String(row.country_name ?? ''),
    latitude: row.latitude != null ? Number(row.latitude) : null,
    longitude: row.longitude != null ? Number(row.longitude) : null,
    locationLabel: row.location_label ? String(row.location_label) : null,
    contactName: String(row.contact_name ?? ''),
    contactEmail: String(row.contact_email ?? ''),
    contactPhone: String(row.contact_phone ?? ''),
    contactRoleLabel: String(row.contact_role_label ?? ''),
    operationalDays: Array.isArray(row.operational_days)
      ? row.operational_days.map(String)
      : [],
    openingTime: String(row.opening_time ?? ''),
    closingTime: String(row.closing_time ?? ''),
    isSupplierAddress: Boolean(row.is_supplier_address),
    supplierName: row.supplier_name ? String(row.supplier_name) : null,
    supplierGstin: row.supplier_gstin ? String(row.supplier_gstin) : null,
    isCompleted: Boolean(row.is_completed),
    updatedAt: String(row.updated_at ?? ''),
  }))
}
