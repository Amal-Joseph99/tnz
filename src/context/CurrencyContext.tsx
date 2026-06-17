import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

const BASE_CURRENCY = 'USD'

const COUNTRY_CURRENCY: Record<string, string> = {
  US: 'USD',
  GB: 'GBP',
  CA: 'CAD',
  AU: 'AUD',
  IN: 'INR',
  JP: 'JPY',
  CN: 'CNY',
  KR: 'KRW',
  DE: 'EUR',
  FR: 'EUR',
  IT: 'EUR',
  ES: 'EUR',
  NL: 'EUR',
  BE: 'EUR',
  AT: 'EUR',
  PT: 'EUR',
  IE: 'EUR',
  FI: 'EUR',
  GR: 'EUR',
  MX: 'MXN',
  BR: 'BRL',
  AE: 'AED',
  SA: 'SAR',
  SG: 'SGD',
  MY: 'MYR',
  TH: 'THB',
  PH: 'PHP',
  ID: 'IDR',
  NZ: 'NZD',
  CH: 'CHF',
  SE: 'SEK',
  NO: 'NOK',
  DK: 'DKK',
  PL: 'PLN',
  TR: 'TRY',
  ZA: 'ZAR',
  NG: 'NGN',
  EG: 'EGP',
  PK: 'PKR',
  BD: 'BDT',
  VN: 'VND',
  HK: 'HKD',
  TW: 'TWD',
  IL: 'ILS',
  RU: 'RUB',
  AR: 'ARS',
  CL: 'CLP',
  CO: 'COP',
}

const CURRENCY_SYMBOL: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  JPY: '¥',
  CNY: '¥',
  KRW: '₩',
  CAD: 'CA$',
  AUD: 'A$',
  MXN: 'MX$',
  BRL: 'R$',
  AED: 'AED ',
  SAR: 'SAR ',
  SGD: 'S$',
  MYR: 'RM',
  THB: '฿',
  PHP: '₱',
  IDR: 'Rp',
  NZD: 'NZ$',
  CHF: 'CHF ',
  SEK: 'kr',
  NOK: 'kr',
  DKK: 'kr',
  PLN: 'zł',
  TRY: '₺',
  ZAR: 'R',
  NGN: '₦',
  EGP: 'E£',
  PKR: '₨',
  BDT: '৳',
  VND: '₫',
  HKD: 'HK$',
  TWD: 'NT$',
  ILS: '₪',
  RUB: '₽',
  ARS: 'AR$',
  CLP: 'CL$',
  COP: 'COL$',
}

type CurrencyContextValue = {
  currency: string
  symbol: string
  rate: number
  locationLabel: string
  loading: boolean
  formatPrice: (usdAmount: number) => string
  refreshLocation: () => void
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null)

async function fetchCountryFromCoords(lat: number, lon: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      { headers: { 'Accept-Language': 'en' } },
    )
    if (!res.ok) return null
    const data = await res.json()
    return data.address?.country_code?.toUpperCase() ?? null
  } catch {
    return null
  }
}

async function fetchCountryFromIp(): Promise<{ country: string; city?: string } | null> {
  try {
    const res = await fetch('https://ipapi.co/json/')
    if (!res.ok) return null
    const data = await res.json()
    return { country: data.country_code, city: data.city }
  } catch {
    return null
  }
}

async function fetchExchangeRate(target: string): Promise<number> {
  if (target === BASE_CURRENCY) return 1
  try {
    const res = await fetch(
      `https://api.frankfurter.app/latest?from=${BASE_CURRENCY}&to=${target}`,
    )
    if (!res.ok) return 1
    const data = await res.json()
    return data.rates?.[target] ?? 1
  } catch {
    return 1
  }
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState(BASE_CURRENCY)
  const [rate, setRate] = useState(1)
  const [locationLabel, setLocationLabel] = useState('Detecting location…')
  const [loading, setLoading] = useState(true)

  const detectLocation = useCallback(async () => {
    setLoading(true)
    setLocationLabel('Detecting location…')

    let countryCode: string | null = null
    let cityLabel = ''

    if (navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 8000,
            maximumAge: 300000,
          })
        })
        countryCode = await fetchCountryFromCoords(pos.coords.latitude, pos.coords.longitude)
        if (countryCode) cityLabel = countryCode
      } catch {
        /* fall through to IP */
      }
    }

    if (!countryCode) {
      const ipData = await fetchCountryFromIp()
      if (ipData) {
        countryCode = ipData.country
        cityLabel = ipData.city ? `${ipData.city}, ${ipData.country}` : ipData.country
      }
    }

    const resolvedCurrency = countryCode
      ? (COUNTRY_CURRENCY[countryCode] ?? BASE_CURRENCY)
      : BASE_CURRENCY

    const resolvedRate = await fetchExchangeRate(resolvedCurrency)

    setCurrency(resolvedCurrency)
    setRate(resolvedRate)
    setLocationLabel(cityLabel || countryCode || 'United States')
    setLoading(false)
  }, [])

  useEffect(() => {
    detectLocation()
  }, [detectLocation])

  const symbol = CURRENCY_SYMBOL[currency] ?? `${currency} `

  const formatPrice = useCallback(
    (usdAmount: number) => {
      const converted = usdAmount * rate
      const decimals = ['JPY', 'KRW', 'VND', 'IDR'].includes(currency) ? 0 : 2
      return `${symbol}${converted.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}`
    },
    [currency, rate, symbol],
  )

  const value = useMemo(
    () => ({
      currency,
      symbol,
      rate,
      locationLabel,
      loading,
      formatPrice,
      refreshLocation: detectLocation,
    }),
    [currency, symbol, rate, locationLabel, loading, formatPrice, detectLocation],
  )

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext)
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider')
  return ctx
}
