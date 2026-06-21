export type PincodeLookupResult = {
  city: string
  state: string
  country: string
}

type IndiaPincodeOffice = {
  Name?: string
  District?: string
  State?: string
  Country?: string
}

type IndiaPincodeResponse = Array<{
  Status?: string
  PostOffice?: IndiaPincodeOffice[] | null
}>

export async function lookupPincode(pincode: string): Promise<PincodeLookupResult | null> {
  const normalized = pincode.replace(/\D/g, '')
  if (normalized.length !== 6) return null

  try {
    const response = await fetch(`https://api.postalpincode.in/pincode/${normalized}`)
    if (!response.ok) return null

    const payload = (await response.json()) as IndiaPincodeResponse
    const entry = payload[0]
    if (!entry || entry.Status !== 'Success' || !entry.PostOffice?.length) return null

    const office = entry.PostOffice[0]
    const city = office.District || office.Name || ''
    const state = office.State || ''
    const country = office.Country || 'India'

    if (!city || !state) return null

    return { city, state, country }
  } catch {
    return null
  }
}
