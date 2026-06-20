import { supabase } from './supabase'

export type CurrencyPackage = {
  currencyCode: string
  fxRateUsd: number
  symbol: string
  decimalPlaces: number
  baseCurrencyCode: string
}

export type StorefrontCurrencyConfig = {
  baseCurrencyCode: string
  storefrontDefaultCurrencyCode: string
}

export type AdminCurrencyOption = {
  currencyCode: string
  displayLabel: string
  sortOrder: number
}

function mapCurrencyPackage(raw: Record<string, unknown>): CurrencyPackage {
  const fxRateUsd = Number(raw.fx_rate_usd)
  const decimalPlaces = Number(raw.decimal_places)

  if (!raw.currency_code || !Number.isFinite(fxRateUsd) || !raw.symbol || !Number.isFinite(decimalPlaces)) {
    throw new Error('Invalid currency package from database.')
  }

  return {
    currencyCode: String(raw.currency_code),
    fxRateUsd,
    symbol: String(raw.symbol),
    decimalPlaces,
    baseCurrencyCode: String(raw.base_currency_code),
  }
}

export async function fetchStorefrontCurrencyConfig(): Promise<StorefrontCurrencyConfig> {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const { data, error } = await supabase.rpc('get_storefront_currency_config')
  if (error || !data || typeof data !== 'object') {
    throw new Error(error?.message ?? 'Unable to load storefront currency config.')
  }

  const payload = data as {
    base_currency_code?: string
    storefront_default_currency_code?: string
  }

  if (!payload.base_currency_code || !payload.storefront_default_currency_code) {
    throw new Error('Storefront currency config is incomplete.')
  }

  return {
    baseCurrencyCode: payload.base_currency_code,
    storefrontDefaultCurrencyCode: payload.storefront_default_currency_code,
  }
}

export async function resolveSessionDisplayCurrency(
  countryIsoAlpha2?: string | null,
): Promise<CurrencyPackage> {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const { data, error } = await supabase.rpc('resolve_session_display_currency', {
    p_country_iso_alpha2: countryIsoAlpha2?.trim() || null,
  })

  if (error || !data || typeof data !== 'object') {
    throw new Error(error?.message ?? 'Unable to resolve display currency.')
  }

  return mapCurrencyPackage(data as Record<string, unknown>)
}

export async function fetchAdminCurrencyOptions(): Promise<AdminCurrencyOption[]> {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const { data, error } = await supabase.rpc('get_admin_currency_selector_options')
  if (error || !Array.isArray(data)) {
    throw new Error(error?.message ?? 'Unable to load admin currency options.')
  }

  return data.map((row) => {
    const item = row as {
      currency_code?: string
      display_label?: string
      sort_order?: number
    }

    if (!item.currency_code || !item.display_label || item.sort_order === undefined) {
      throw new Error('Admin currency option config is incomplete.')
    }

    return {
      currencyCode: item.currency_code,
      displayLabel: item.display_label,
      sortOrder: item.sort_order,
    }
  })
}

export async function setAdminCurrencyPreference(currencyCode: string): Promise<CurrencyPackage> {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const { data, error } = await supabase.rpc('set_admin_currency_preference', {
    p_currency_code: currencyCode,
  })

  if (error || !data || typeof data !== 'object') {
    throw new Error(error?.message ?? 'Unable to save admin currency preference.')
  }

  return mapCurrencyPackage(data as Record<string, unknown>)
}
