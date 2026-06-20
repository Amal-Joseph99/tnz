import { supabase } from './supabase'
import type { ResolvedLocation } from './opencage'

const GUEST_LOCATION_KEY = 'agtrenz-guest-location'

export type StoredLocation = ResolvedLocation

function normalizeStoredLocation(raw: Partial<StoredLocation> | null): StoredLocation | null {
  if (!raw?.locationLabel) return null

  return {
    city: raw.city ?? '',
    state: raw.state ?? '',
    country: raw.country ?? '',
    countryCode: (raw.countryCode ?? '').toUpperCase(),
    latitude: raw.latitude ?? null,
    longitude: raw.longitude ?? null,
    locationLabel: raw.locationLabel,
  }
}

export function readGuestLocation(): StoredLocation | null {
  try {
    const saved = window.localStorage.getItem(GUEST_LOCATION_KEY)
    if (!saved) return null
    return normalizeStoredLocation(JSON.parse(saved) as Partial<StoredLocation>)
  } catch {
    return null
  }
}

export function writeGuestLocation(location: StoredLocation) {
  window.localStorage.setItem(GUEST_LOCATION_KEY, JSON.stringify(location))
}

export async function readUserLocation(): Promise<StoredLocation | null> {
  if (!supabase) return null

  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user
  if (!user) return null

  const { data, error } = await supabase
    .from('user_storefront_locations')
    .select('city, state, country, country_code, latitude, longitude, location_label')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error || !data) return null

  return normalizeStoredLocation({
    city: data.city ?? '',
    state: data.state ?? '',
    country: data.country ?? '',
    countryCode: data.country_code ?? '',
    latitude: data.latitude,
    longitude: data.longitude,
    locationLabel: data.location_label,
  })
}

export async function writeUserLocation(location: StoredLocation): Promise<boolean> {
  if (!supabase) return false

  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user
  if (!user) return false

  const { error } = await supabase.from('user_storefront_locations').upsert({
    user_id: user.id,
    city: location.city || null,
    state: location.state || null,
    country: location.country || null,
    country_code: location.countryCode || null,
    latitude: location.latitude,
    longitude: location.longitude,
    location_label: location.locationLabel,
  })

  return !error
}

export async function readStoredLocation(): Promise<StoredLocation | null> {
  if (!supabase) return readGuestLocation()

  const { data: authData } = await supabase.auth.getUser()
  if (authData.user) {
    return readUserLocation()
  }

  return readGuestLocation()
}

export async function writeStoredLocation(location: StoredLocation): Promise<void> {
  if (!supabase) {
    writeGuestLocation(location)
    return
  }

  const { data: authData } = await supabase.auth.getUser()
  if (authData.user) {
    await writeUserLocation(location)
    return
  }

  writeGuestLocation(location)
}

export async function isSignedInUser() {
  if (!supabase) return false
  const { data: authData } = await supabase.auth.getUser()
  return Boolean(authData.user)
}
