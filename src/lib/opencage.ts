export type ResolvedLocation = {
  city: string
  state: string
  country: string
  countryCode: string
  latitude: number | null
  longitude: number | null
  locationLabel: string
}

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
  }>
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

export async function reverseGeocodeWithOpenCage(
  latitude: number,
  longitude: number,
): Promise<ResolvedLocation | null> {
  const apiKey = getOpenCageApiKey()
  if (!apiKey) return null

  try {
    const url = new URL('https://api.opencagedata.com/geocode/v1/json')
    url.searchParams.set('q', `${latitude}+${longitude}`)
    url.searchParams.set('key', apiKey)
    url.searchParams.set('language', 'en')
    url.searchParams.set('no_annotations', '1')

    const response = await fetch(url.toString())
    if (!response.ok) return null

    const data = (await response.json()) as OpenCageResponse
    const components = data.results?.[0]?.components
    if (!components) return null

    const city = pickCity(components)
    const state = pickState(components)
    const country = components.country ?? ''
    const countryCode = (components.country_code ?? '').toUpperCase()

    return {
      city,
      state,
      country,
      countryCode,
      latitude,
      longitude,
      locationLabel: buildLocationLabel(city, state, country) || data.results?.[0]?.formatted || country,
    }
  } catch {
    return null
  }
}

export async function getCurrentCoordinates() {
  if (!navigator.geolocation) return null

  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        timeout: 10000,
        maximumAge: 0,
        enableHighAccuracy: false,
      })
    })

    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    }
  } catch {
    return null
  }
}

export async function detectLocationWithOpenCage(): Promise<ResolvedLocation | null> {
  const coords = await getCurrentCoordinates()
  if (!coords) return null
  return reverseGeocodeWithOpenCage(coords.latitude, coords.longitude)
}
