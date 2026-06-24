# Important notes

## Storefront FX pricing (guest / buyer)

- Product cards use `formatListingPrice()` → `convertListingAmountToDisplay()` in `src/lib/priceDisplay.ts`.
- Display currency comes from `resolve_session_display_currency` (guest: `app_currency_config.storefront_default_currency_code` = USD, or `resolve_currency_by_country` when location is saved, e.g. NG → NGN).
- Listing amounts are stored in seller `base_currency_code` (e.g. INR 385 for the Blue Heaven lipstick).
- Conversion needs **both** `listingCurrencyCode` and display currency in the in-memory `currencyRates` map (`CurrencyContext.loadCurrencyRates()` → `countries.fx_rate_usd` where `is_active = true`).

### When conversion can show wrong price (not a missing DB rate)

DB has active INR + NGN FX rates. Wrong/unconverted display happens only on the **frontend**:

1. **`supabase` is null** — missing `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` → `loadCurrencyRates()` no-ops; map stays `{ USD: 1 }`.
2. **`countries` SELECT fails** — network/API error → silent `return`; map stays `{ USD: 1 }`.
3. **Race** — `pricingReady` can be true (NGN from RPC) before `loadCurrencyRates()` finishes → brief wrong price until rates load.
4. **Code fallback** — if INR or NGN is missing from `currencyRates`, `convertListingAmountToDisplay` returns the **raw listing amount** (e.g. 385) with the display symbol (e.g. ₦), not converted (~₦5,549).

### Frontend-only FX fallback is not a perfect fix

- Must seed **both** listing currency (INR) and display currency (NGN) in memory; one rate is not enough.
- `get_currency_package` / session RPC already returns display `fx_rate_usd`, but conversion still reads **both** rates from `currencyRates`, not from the RPC package alone.
- Static frontend rates go **stale** vs DB + `refresh-fx-rates` cron.
- Prefer: wait to show prices until `currencyRates` loaded, or derive conversion using RPC `fx_rate_usd` + listing currency rate explicitly.

### Nigeria example (live DB at time of note)

- Product: Blue Heaven Matte Love Mini Lipsticks Pack of 10 — **385.00 INR**.
- NG location → NGN; FX: INR 94.4149/USD, NGN 1360.8167/USD → display **~₦5,549.07** when conversion runs correctly.

## Cart storage (localStorage)

- Key: `agtrenz_checkout_v2` in `CheckoutContext` — not persisted to Supabase until checkout.
- Each line (`CartItem` in `src/lib/checkout.ts`) must include:
  - `variantId` — seller variant id (line id is `{productId}:{variantId}`)
  - `variantSize` / `variantColor` — selected size and color labels
  - `price` / `originalPrice` — variant selling price and MRP in seller listing currency (`listingCurrencyCode`)
- Product detail add-to-cart uses the buyer-selected variant. Listing cards use the cheapest variant (size/color + price) from `pickPrimaryVariant`.
