export function convertListingAmountToDisplay(
  amount: number,
  listingCurrencyCode: string,
  displayCurrencyCode: string,
  ratesByCurrency: Record<string, number>,
): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0

  const listingRate = ratesByCurrency[listingCurrencyCode.toUpperCase()]
  const displayRate = ratesByCurrency[displayCurrencyCode.toUpperCase()]

  if (!listingRate || !displayRate) {
    return amount
  }

  return (amount / listingRate) * displayRate
}

export function formatNativeCurrencyAmount(
  amount: number,
  _currencyCode: string,
  symbol: string,
  decimalPlaces = 2,
): string {
  if (!Number.isFinite(amount)) return '—'

  const decimals = Math.max(0, decimalPlaces)
  return `${symbol}${amount.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`
}
