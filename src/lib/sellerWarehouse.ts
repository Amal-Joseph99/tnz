import { supabase } from './supabase'

export type SellerWarehouse = {
  warehouseId: string
  addressTagId: number | null
  addressLine1: string
  landmark: string
  postalCode: string
  city: string
  stateName: string
  countryName: string
  latitude: number | null
  longitude: number | null
  locationLabel: string
  locationConfirmedAt: string | null
  contactName: string
  contactEmail: string
  contactPhone: string
  contactRoleId: number | null
  operationalDays: string[]
  openingTime: string
  closingTime: string
  isSupplierAddress: boolean
  supplierName: string
  supplierGstin: string
  shiprocketPickupLocationName: string
  isCompleted: boolean
}

export type SellerWarehouseInput = {
  addressTagId: number
  addressLine1: string
  landmark: string
  postalCode: string
  city: string
  stateName: string
  countryName: string
  latitude: number
  longitude: number
  locationLabel: string
  contactName: string
  contactEmail: string
  contactPhone: string
  contactRoleId: number
  operationalDays: string[]
  openingTime: string
  closingTime: string
  isSupplierAddress: boolean
  supplierName: string
  supplierGstin: string
  shiprocketPickupLocationName: string
}

type MutationResult = { ok: true; warehouseId?: string } | { ok: false; message: string }

export const WAREHOUSE_ADDRESS_LINE_ERROR =
  'House no./Flat no./Building no./Road no. is required at the start of the address. Eg: 46/A1, AKHIL NIVAS, MANNUR, ...'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const INDIAN_PHONE_PATTERN = /^[6-9]\d{9}$/
const INTERNATIONAL_PHONE_PATTERN = /^\d{7,15}$/

export function validateWarehouseContactPhone(phone: string, isoAlpha2?: string) {
  const normalized = phone.trim()
  if (isoAlpha2?.toUpperCase() === 'IN') {
    return INDIAN_PHONE_PATTERN.test(normalized)
  }
  return INTERNATIONAL_PHONE_PATTERN.test(normalized)
}
const GSTIN_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/

export function validateWarehouseAddressLine1(value: string) {
  const trimmed = value.trim()
  if (trimmed.length < 5) return false

  return (
    /^\d+[A-Za-z0-9/\-]*/.test(trimmed) ||
    /^(flat|house|plot|building|door|h\.?\s*no|road)\s*[#.:]?\s*\d/i.test(trimmed)
  )
}

export function validateSellerWarehouseInput(
  input: SellerWarehouseInput,
  options?: { sellerIsoAlpha2?: string },
): MutationResult {
  if (!input.addressTagId) {
    return { ok: false, message: 'Select how you want to tag this address.' }
  }

  if (!validateWarehouseAddressLine1(input.addressLine1)) {
    return { ok: false, message: WAREHOUSE_ADDRESS_LINE_ERROR }
  }

  if (!input.postalCode.trim()) {
    return { ok: false, message: 'Postal code is required.' }
  }

  if (!input.city.trim() || !input.stateName.trim() || !input.countryName.trim()) {
    return { ok: false, message: 'City, state, and country are required.' }
  }

  if (!Number.isFinite(input.latitude) || !Number.isFinite(input.longitude)) {
    return { ok: false, message: 'Fetch and confirm your location on the map before saving.' }
  }

  if (!input.locationLabel.trim()) {
    return { ok: false, message: 'Confirm your location on the map before saving.' }
  }

  if (!input.contactName.trim()) {
    return { ok: false, message: 'Pickup/RTO incharge name is required.' }
  }

  if (!EMAIL_PATTERN.test(input.contactEmail.trim())) {
    return { ok: false, message: 'Enter a valid contact email address.' }
  }

  if (!validateWarehouseContactPhone(input.contactPhone, options?.sellerIsoAlpha2)) {
    return {
      ok: false,
      message: options?.sellerIsoAlpha2?.toUpperCase() === 'IN'
        ? 'Mobile number must be exactly 10 digits starting with 6–9.'
        : 'Enter a valid contact phone number (7–15 digits).',
    }
  }

  if (!input.contactRoleId) {
    return { ok: false, message: 'Select a contact role.' }
  }

  if (input.operationalDays.length === 0) {
    return { ok: false, message: 'Select at least one operational day.' }
  }

  if (!input.openingTime || !input.closingTime) {
    return { ok: false, message: 'Opening and closing times are required.' }
  }

  if (input.openingTime >= input.closingTime) {
    return { ok: false, message: 'Closing time must be later than opening time.' }
  }

  if (input.isSupplierAddress) {
    if (input.supplierGstin.trim() && !GSTIN_PATTERN.test(input.supplierGstin.trim().toUpperCase())) {
      return { ok: false, message: 'Enter a valid 15-character supplier GSTIN or leave it blank.' }
    }
  }

  return { ok: true }
}

export async function fetchSellerWarehouse(): Promise<SellerWarehouse | null> {
  if (!supabase) return null

  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user
  if (!user) return null

  const { data, error } = await supabase
    .from('seller_warehouses')
    .select(`
      warehouse_id,
      address_tag_id,
      address_line_1,
      address_line,
      landmark,
      postal_code,
      city,
      state_name,
      country_name,
      latitude,
      longitude,
      location_label,
      location_confirmed_at,
      contact_name,
      contact_email,
      contact_phone,
      contact_role_id,
      operational_days,
      opening_time,
      closing_time,
      is_supplier_address,
      supplier_name,
      supplier_gstin,
      shiprocket_pickup_location_name,
      is_completed
    `)
    .eq('user_id', user.id)
    .maybeSingle()

  if (error || !data) return null

  return {
    warehouseId: data.warehouse_id ?? '',
    addressTagId: data.address_tag_id ?? null,
    addressLine1: data.address_line_1 ?? data.address_line ?? '',
    landmark: data.landmark ?? '',
    postalCode: data.postal_code ?? '',
    city: data.city ?? '',
    stateName: data.state_name ?? '',
    countryName: data.country_name ?? '',
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
    locationLabel: data.location_label ?? '',
    locationConfirmedAt: data.location_confirmed_at ?? null,
    contactName: data.contact_name ?? '',
    contactEmail: data.contact_email ?? '',
    contactPhone: data.contact_phone ?? '',
    contactRoleId: data.contact_role_id ?? null,
    operationalDays: Array.isArray(data.operational_days) ? data.operational_days.map(String) : [],
    openingTime: data.opening_time ? String(data.opening_time).slice(0, 5) : '',
    closingTime: data.closing_time ? String(data.closing_time).slice(0, 5) : '',
    isSupplierAddress: Boolean(data.is_supplier_address),
    supplierName: data.supplier_name ?? '',
    supplierGstin: data.supplier_gstin ?? '',
    shiprocketPickupLocationName: data.shiprocket_pickup_location_name ?? '',
    isCompleted: Boolean(data.is_completed),
  }
}

export async function saveSellerWarehouse(
  input: SellerWarehouseInput,
  options?: { sellerIsoAlpha2?: string },
): Promise<MutationResult> {
  if (!supabase) {
    return { ok: false, message: 'Supabase is not configured.' }
  }

  const validation = validateSellerWarehouseInput(input, options)
  if (!validation.ok) return validation

  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user
  if (!user) {
    return { ok: false, message: 'You must be signed in as a seller.' }
  }

  const { data, error } = await supabase
    .from('seller_warehouses')
    .upsert({
      user_id: user.id,
      address_tag_id: input.addressTagId,
      address_line_1: input.addressLine1.trim(),
      landmark: input.landmark.trim() || null,
      postal_code: input.postalCode.trim(),
      city: input.city.trim(),
      state_name: input.stateName.trim(),
      country_name: input.countryName.trim(),
      latitude: input.latitude,
      longitude: input.longitude,
      location_label: input.locationLabel.trim(),
      location_confirmed_at: new Date().toISOString(),
      contact_name: input.contactName.trim(),
      contact_email: input.contactEmail.trim().toLowerCase(),
      contact_phone: input.contactPhone.trim(),
      contact_role_id: input.contactRoleId,
      operational_days: input.operationalDays,
      opening_time: input.openingTime,
      closing_time: input.closingTime,
      is_supplier_address: input.isSupplierAddress,
      supplier_name: input.isSupplierAddress ? input.supplierName.trim() || null : null,
      supplier_gstin: input.isSupplierAddress ? input.supplierGstin.trim().toUpperCase() || null : null,
      shiprocket_pickup_location_name: input.shiprocketPickupLocationName.trim() || null,
      is_completed: true,
    })
    .select('warehouse_id')
    .single()

  if (error) {
    return { ok: false, message: error.message }
  }

  return { ok: true, warehouseId: data?.warehouse_id ? String(data.warehouse_id) : undefined }
}
