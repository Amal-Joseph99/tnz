export type ResolvedLocation = {
  city: string
  state: string
  country: string
  countryCode: string
  latitude: number
  longitude: number
  locationLabel: string
}

export type LocationFetchResult =
  | { ok: true; location: ResolvedLocation; notice?: string }
  | { ok: false; message: string }

type OpenCageComponents = {
  city?: string
  town?: string
  village?: string
  state?: string
  region?: string
  country?: string
  country_code?: string
}

type OpenCageResponse = {
  results?: Array<{
    components?: OpenCageComponents
    formatted?: string
    geometry?: { lat?: number; lng?: number }
  }>
  status?: { message?: string; code?: number }
}

function getOpenCageApiKey() {
  return import.meta.env.VITE_OPENCAGE_API_KEY as string | undefined
}

function pickCity(components: OpenCageComponents) {
  return components.city || components.town || components.village || ''
}

function pickState(components: OpenCageComponents) {
  return components.state || components.region || ''
}

function buildLocationLabel(city: string, state: string, country: string) {
  return [city, state, country].filter(Boolean).join(', ')
}

function coordinateLabel(latitude: number, longitude: number) {
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
}

function mapGeolocationError(error: GeolocationPositionError) {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'Location permission denied. Allow location access for this site in your browser, then try again.'
    case error.POSITION_UNAVAILABLE:
      return 'Device location is unavailable. Use "Locate from address" or enter city/country manually.'
    case error.TIMEOUT:
      return 'Location request timed out. Check GPS or network connection and try again.'
    default:
      return 'Unable to read your device location.'
  }
}

async function getCurrentCoordinates(): Promise<
  | { ok: true; latitude: number; longitude: number }
  | { ok: false; message: string }
> {
  if (!navigator.geolocation) {
    return { ok: false, message: 'This browser does not support location services.' }
  }

  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        timeout: 15000,
        maximumAge: 0,
        enableHighAccuracy: true,
      })
    })

    return {
      ok: true,
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    }
  } catch (error) {
    if (error instanceof GeolocationPositionError) {
      return { ok: false, message: mapGeolocationError(error) }
    }
    return { ok: false, message: 'Unable to read your device location.' }
  }
}

async function callOpenCage(url: URL): Promise<OpenCageResponse | { error: string }> {
  try {
    const response = await fetch(url.toString())
    const data = (await response.json()) as OpenCageResponse

    if (!response.ok) {
      const apiMessage = data.status?.message
      return { error: apiMessage ? `Location service error: ${apiMessage}` : `Location service HTTP ${response.status}.` }
    }

    return data
  } catch {
    return { error: 'Network error while contacting the location service.' }
  }
}

export async function reverseGeocodeWithOpenCage(
  latitude: number,
  longitude: number,
): Promise<LocationFetchResult> {
  const apiKey = getOpenCageApiKey()
  if (!apiKey) {
    return {
      ok: true,
      location: {
        city: '',
        state: '',
        country: '',
        countryCode: '',
        latitude,
        longitude,
        locationLabel: coordinateLabel(latitude, longitude),
      },
      notice: 'Map coordinates saved. Add VITE_OPENCAGE_API_KEY to resolve city and country names automatically.',
    }
  }

  const url = new URL('https://api.opencagedata.com/geocode/v1/json')
  url.searchParams.set('q', `${latitude}+${longitude}`)
  url.searchParams.set('key', apiKey)
  url.searchParams.set('language', 'en')
  url.searchParams.set('no_annotations', '1')

  const data = await callOpenCage(url)
  if ('error' in data) {
    return {
      ok: true,
      location: {
        city: '',
        state: '',
        country: '',
        countryCode: '',
        latitude,
        longitude,
        locationLabel: coordinateLabel(latitude, longitude),
      },
      notice: data.error,
    }
  }

  const result = data.results?.[0]
  const components = result?.components
  if (!components) {
    return {
      ok: true,
      location: {
        city: '',
        state: '',
        country: '',
        countryCode: '',
        latitude,
        longitude,
        locationLabel: coordinateLabel(latitude, longitude),
      },
      notice: 'Coordinates found but address name could not be resolved. You can still confirm this point.',
    }
  }

  const city = pickCity(components)
  const state = pickState(components)
  const country = components.country ?? ''
  const countryCode = (components.country_code ?? '').toUpperCase()

  return {
    ok: true,
    location: {
      city,
      state,
      country,
      countryCode,
      latitude,
      longitude,
      locationLabel: buildLocationLabel(city, state, country) || result?.formatted || coordinateLabel(latitude, longitude),
    },
  }
}

export async function forwardGeocodeWithOpenCage(query: string): Promise<LocationFetchResult> {
  const trimmed = query.trim()
  if (trimmed.length < 3) {
    return { ok: false, message: 'Enter city and country before locating from address.' }
  }

  const apiKey = getOpenCageApiKey()
  if (!apiKey) {
    return {
      ok: false,
      message: 'Address lookup is not configured. Set VITE_OPENCAGE_API_KEY or use "Fetch my current location".',
    }
  }

  const url = new URL('https://api.opencagedata.com/geocode/v1/json')
  url.searchParams.set('q', trimmed)
  url.searchParams.set('key', apiKey)
  url.searchParams.set('language', 'en')
  url.searchParams.set('limit', '1')

  const data = await callOpenCage(url)
  if ('error' in data) {
    return { ok: false, message: data.error }
  }

  const result = data.results?.[0]
  const lat = result?.geometry?.lat
  const lng = result?.geometry?.lng
  const components = result?.components

  if (lat == null || lng == null || !components) {
    return { ok: false, message: `No map location found for "${trimmed}". Check city, state, and country spelling.` }
  }

  const city = pickCity(components)
  const state = pickState(components)
  const country = components.country ?? ''

  return {
    ok: true,
    location: {
      city,
      state,
      country,
      countryCode: (components.country_code ?? '').toUpperCase(),
      latitude: lat,
      longitude: lng,
      locationLabel: buildLocationLabel(city, state, country) || result?.formatted || trimmed,
    },
  }
}

export async function detectLocationWithOpenCage(): Promise<LocationFetchResult> {
  const coords = await getCurrentCoordinates()
  if (!coords.ok) {
    return { ok: false, message: coords.message }
  }

  return reverseGeocodeWithOpenCage(coords.latitude, coords.longitude)
}
