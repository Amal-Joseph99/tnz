import { supabase } from './supabase'

export type SellerCountryOption = {
  id: number
  country_name: string
  iso_alpha2: string
  iso_alpha3: string
  isd_code: string
  currency_code: string
  fx_rate_usd: number
  fx_base_code: string
}

export async function fetchSellerCountryOptions(): Promise<SellerCountryOption[]> {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const { data, error } = await supabase
    .from('seller_country_options')
    .select('id, country_name, iso_alpha2, iso_alpha3, isd_code, currency_code, fx_rate_usd, fx_base_code')
    .order('country_name')

  if (error) {
    throw new Error(error.message)
  }

  return data ?? []
}
