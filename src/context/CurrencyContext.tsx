import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from './AuthContext'
import { convertListingAmountToDisplay } from '../lib/priceDisplay'
import { detectLocationWithOpenCage } from '../lib/opencage'
import {
  fetchAdminCurrencyOptions,
  resolveSessionDisplayCurrency,
  setAdminCurrencyPreference,
  type AdminCurrencyOption,
  type CurrencyPackage,
} from '../lib/currencyConfig'
import {
  clearLocationFetchAttempted,
  getSignedInUserId,
  hasLocationFetchBeenAttempted,
  markLocationFetchAttempted,
  readStoredLocation,
  writeStoredLocation,
  type StoredLocation,
} from '../lib/userLocation'
import { supabase } from '../lib/supabase'

type CurrencyContextValue = {
  currency: string
  symbol: string
  rate: number
  locationLabel: string
  loading: boolean
  pricingReady: boolean
  pricingError: string
  hasStoredLocation: boolean
  adminCurrencyOptions: AdminCurrencyOption[]
  formatPrice: (usdAmount: number) => string
  formatListingPrice: (amount: number, listingCurrencyCode: string) => string
  toDisplayListingAmount: (amount: number, listingCurrencyCode: string) => number
  formatDisplayAmount: (amount: number) => string
  refreshLocation: () => Promise<void>
  setAdminCurrency: (currencyCode: string) => Promise<void>
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null)

function applyCurrencyPackage(
  pkg: CurrencyPackage,
  setters: {
    setCurrency: (value: string) => void
    setRate: (value: number) => void
    setSymbol: (value: string) => void
    setDecimalPlaces: (value: number) => void
  },
) {
  setters.setCurrency(pkg.currencyCode)
  setters.setRate(pkg.fxRateUsd)
  setters.setSymbol(pkg.symbol)
  setters.setDecimalPlaces(pkg.decimalPlaces)
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { accountType, loading: authLoading } = useAuth()
  const [currency, setCurrency] = useState('')
  const [rate, setRate] = useState(0)
  const [symbol, setSymbol] = useState('')
  const [decimalPlaces, setDecimalPlaces] = useState(2)
  const [locationLabel, setLocationLabel] = useState('Detecting location…')
  const [loading, setLoading] = useState(true)
  const [pricingReady, setPricingReady] = useState(false)
  const [pricingError, setPricingError] = useState('')
  const [hasStoredLocation, setHasStoredLocation] = useState(false)
  const [adminCurrencyOptions, setAdminCurrencyOptions] = useState<AdminCurrencyOption[]>([])
  const [currencyRates, setCurrencyRates] = useState<Record<string, number>>({ USD: 1 })
  const resolvingRef = useRef(0)
  const locationFetchRef = useRef<Promise<void> | null>(null)

  const loadCurrencyRates = useCallback(async () => {
    if (!supabase) return

    const { data, error } = await supabase
      .from('countries')
      .select('currency_code, fx_rate_usd')
      .eq('is_active', true)

    if (error || !data) return

    const nextRates: Record<string, number> = { USD: 1 }
    for (const row of data) {
      const code = String(row.currency_code ?? '').toUpperCase()
      const fxRate = Number(row.fx_rate_usd)
      if (code && Number.isFinite(fxRate) && fxRate > 0) {
        nextRates[code] = fxRate
      }
    }
    setCurrencyRates(nextRates)
  }, [])

  const currencySetters = useMemo(
    () => ({
      setCurrency,
      setRate,
      setSymbol,
      setDecimalPlaces,
    }),
    [],
  )

  const resolvePricing = useCallback(async (nextCountryCode?: string | null) => {
    const requestId = ++resolvingRef.current
    setLoading(true)
    setPricingReady(false)
    setPricingError('')

    try {
      const pkg = await resolveSessionDisplayCurrency(nextCountryCode)
      if (requestId !== resolvingRef.current) return

      applyCurrencyPackage(pkg, currencySetters)
      setPricingReady(true)
    } catch (error) {
      if (requestId !== resolvingRef.current) return
      setPricingError(error instanceof Error ? error.message : 'Unable to load pricing.')
      setPricingReady(false)
    } finally {
      if (requestId === resolvingRef.current) {
        setLoading(false)
      }
    }
  }, [currencySetters])

  const applyLocation = useCallback(async (location: StoredLocation) => {
    setLocationLabel(location.locationLabel)
    setHasStoredLocation(true)
    await resolvePricing(location.countryCode)
  }, [resolvePricing])

  const fetchAndPersistLocation = useCallback(async () => {
    setLoading(true)
    setLocationLabel('Detecting location…')

    const userId = await getSignedInUserId()
    markLocationFetchAttempted(userId)

    const detected = await detectLocationWithOpenCage()
    if (!detected.ok) {
      setLocationLabel('Location unavailable')
      setHasStoredLocation(false)
      await resolvePricing(null)
      return
    }

    await writeStoredLocation(detected.location)
    await applyLocation(detected.location)
  }, [applyLocation, resolvePricing])

  const ensureStorefrontLocation = useCallback(async (options?: { force?: boolean }) => {
    if (accountType === 'seller' || accountType === 'admin') {
      return
    }

    if (locationFetchRef.current) {
      await locationFetchRef.current
      return
    }

    const run = async () => {
      const userId = await getSignedInUserId()

      if (!options?.force) {
        const stored = await readStoredLocation()
        if (stored) {
          await applyLocation(stored)
          return
        }

        if (hasLocationFetchBeenAttempted(userId)) {
          setLocationLabel('Location unavailable')
          setHasStoredLocation(false)
          await resolvePricing(null)
          return
        }
      } else {
        clearLocationFetchAttempted(userId)
      }

      await fetchAndPersistLocation()
    }

    locationFetchRef.current = run()
    try {
      await locationFetchRef.current
    } finally {
      locationFetchRef.current = null
    }
  }, [accountType, applyLocation, fetchAndPersistLocation, resolvePricing])

  const refreshLocation = useCallback(async () => {
    await ensureStorefrontLocation({ force: true })
  }, [ensureStorefrontLocation])

  const setAdminCurrency = useCallback(async (nextCurrencyCode: string) => {
    setLoading(true)
    setPricingReady(false)
    setPricingError('')

    try {
      const pkg = await setAdminCurrencyPreference(nextCurrencyCode)
      applyCurrencyPackage(pkg, currencySetters)
      setPricingReady(true)
    } catch (error) {
      setPricingError(error instanceof Error ? error.message : 'Unable to update admin currency.')
      setPricingReady(false)
    } finally {
      setLoading(false)
    }
  }, [currencySetters])

  useEffect(() => {
    void loadCurrencyRates()
  }, [loadCurrencyRates])

  useEffect(() => {
    if (accountType !== 'admin') {
      setAdminCurrencyOptions([])
      return
    }

    void fetchAdminCurrencyOptions()
      .then(setAdminCurrencyOptions)
      .catch((error: Error) => {
        setPricingError(error.message)
      })
  }, [accountType])

  useEffect(() => {
    if (authLoading) return

    let active = true

    async function bootstrap() {
      if (accountType === 'seller' || accountType === 'admin') {
        await resolvePricing(null)
        if (active) {
          setLocationLabel(accountType === 'admin' ? 'Admin console' : 'Seller console')
        }
        return
      }

      await ensureStorefrontLocation()
    }

    void bootstrap()

    return () => {
      active = false
    }
  }, [accountType, authLoading, ensureStorefrontLocation, resolvePricing])

  const formatListingPrice = useCallback(
    (amount: number, listingCurrencyCode: string) => {
      if (!pricingReady) {
        return '…'
      }

      const converted = convertListingAmountToDisplay(
        amount,
        listingCurrencyCode,
        currency,
        currencyRates,
      )

      return `${symbol}${converted.toLocaleString(undefined, {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
      })}`
    },
    [currency, currencyRates, decimalPlaces, pricingReady, symbol],
  )

  const toDisplayListingAmount = useCallback(
    (amount: number, listingCurrencyCode: string) => {
      if (!pricingReady) {
        return amount
      }

      return convertListingAmountToDisplay(
        amount,
        listingCurrencyCode,
        currency,
        currencyRates,
      )
    },
    [currency, currencyRates, pricingReady],
  )

  const formatPrice = useCallback(
    (usdAmount: number) => {
      if (!pricingReady) {
        return '…'
      }

      const converted = usdAmount * rate
      return `${symbol}${converted.toLocaleString(undefined, {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
      })}`
    },
    [decimalPlaces, pricingReady, rate, symbol],
  )

  const formatDisplayAmount = useCallback(
    (amount: number) => {
      if (!pricingReady) {
        return '…'
      }

      return `${symbol}${amount.toLocaleString(undefined, {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
      })}`
    },
    [decimalPlaces, pricingReady, symbol],
  )

  const value = useMemo(
    () => ({
      currency: pricingReady ? currency : '…',
      symbol,
      rate,
      locationLabel,
      loading,
      pricingReady,
      pricingError,
      hasStoredLocation,
      adminCurrencyOptions,
      formatPrice,
      formatListingPrice,
      toDisplayListingAmount,
      formatDisplayAmount,
      refreshLocation,
      setAdminCurrency,
    }),
    [
      adminCurrencyOptions,
      currency,
      formatPrice,
      formatListingPrice,
      toDisplayListingAmount,
      formatDisplayAmount,
      hasStoredLocation,
      loading,
      locationLabel,
      pricingError,
      pricingReady,
      rate,
      refreshLocation,
      setAdminCurrency,
      symbol,
    ],
  )

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext)
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider')
  return ctx
}
