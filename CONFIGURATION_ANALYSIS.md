# AGTRENZ Configuration Analysis

## 1. FRONTEND DEPLOYMENT

### Where is Frontend Deployed?
- **Platform**: AWS Amplify (Amplify Hosting)
- **Repository**: `Amal-Joseph99/tnz` on GitHub
- **Branch**: `main`
- **Build Configuration**: `amplify.yml` (automatically detected by Amplify)
  - Build command: `npm ci` → `npm run build`
  - Artifacts directory: `dist/` (Vite output)
  - Node caching: `node_modules/**/*`

### Build Process
1. Pre-build: `npm ci` (clean install)
2. Build: `npm run build` (TypeScript compilation + Vite bundling)
3. Output: Static files in `dist/`

### SPA Rewrite Rule (Amplify)
- Rule: `/<*>` → `/index.html` (404-200 rewrite)
- Enables React Router client-side routing

---

## 2. DOMAIN CONFIGURATION

### Domain Setup
- **Primary Domain**: `https://www.agtrenz.com` (main entry point)
- **Apex Domain**: `https://agtrenz.com` (redirects to www)
- **DNS Provider**: Route 53 (AWS)
- **SSL/TLS**: AWS managed certificate
- **Redirect Logic**: Apex redirects to `www` subdomain

### Environment Variable Required
```env
VITE_SITE_URL=https://www.agtrenz.com
```
This is set in Amplify Console → App settings → Environment variables

### Amplify Fallback URL
- `https://main.d13h6a6205mdyf.amplifyapp.com`

---

## 3. DATABASE - WHERE IS IT?

### Database: Supabase (PostgreSQL)
- **Service**: Supabase (managed PostgreSQL)
- **Project ID**: `tnz`
- **Type**: PostgreSQL 17
- **Local Setup**: Docker-based (supabase CLI)
  - API Port: 54321
  - Database Port: 54322
  - Shadow DB Port: 54320
  - Studio UI Port: 54323

### Database Configuration in Frontend
```typescript
// src/lib/supabase.ts
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### Environment Variables Required (Amplify)
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Key Tables
- `auth.users` - Supabase authentication
- `public.buyer_profiles` - Buyer account data
- `public.staff_roles` - Seller/Admin roles
- `public.seller_accounts` - Seller business info
- `public.marketplace_orders` - Orders
- `public.payment_transactions` - Payment records
- `public.shipping_provider_settings` - Shiprocket config
- `public.seller_warehouses` - Warehouse locations
- `public.seller_products` - Product catalog

---

## 4. SIGNUP ROLES CONFIGURATION

### Three User Roles in System

#### A. BUYER Role
- **Registration**: Self-service frontend signup
- **Signup Data Required**:
  - Full name
  - Email
  - Password
- **Account Type Flag**: `account_type: 'buyer'`
- **Profile Created**: `buyer_profiles` table
- **Trigger Function**: `handle_new_buyer_user()` (fires after user creation)

#### B. SELLER Role
- **Registration**: Self-service frontend signup
- **Signup Data Required**:
  - Business name
  - Country (must match `seller_country_options`)
  - Email
  - Phone (with local format)
  - Password
- **Account Type Flag**: `account_type: 'seller'`
- **Profiles Created**:
  - `seller_accounts` table (business info)
  - `staff_roles` table with role='seller'
- **Trigger Function**: `handle_new_seller_user()` (fires after user creation)
- **Country Validation**: Required country must exist in `seller_country_options` table
- **Phone Processing**: Combines country ISD code + local digits

#### C. ADMIN Role
- **Registration**: **BACKEND ONLY** (NOT via frontend)
- **How to Create Admin**:
  ```sql
  -- Run in Supabase SQL Editor
  INSERT INTO public.staff_roles (user_id, role) 
  VALUES ('<auth-user-uuid>', 'admin');
  ```
- **Constraint**: Cannot be created through any frontend signup form
- **Guard Function**: `guard_auth_user_signup()` rejects `account_type: 'admin'`
- **Profiles Created**:
  - `staff_roles` table with role='admin'

### Role Verification Flow

#### On Signup
```
1. User submits signup form
2. guard_auth_user_signup() trigger checks:
   - Rejects if account_type = 'admin'
   - Accepts only 'buyer' or 'seller'
3. Appropriate profile created:
   - handle_new_buyer_user() → buyer_profiles
   - handle_new_seller_user() → seller_accounts + staff_roles
```

#### On Login
```
1. User signs in with email/password
2. verifyLoginPortal(portal) RPC is called:
   - Portal = 'buyer' → checks if user is buyer
   - Portal = 'seller' → checks if user is seller OR admin
   - Returns { allowed: true/false, role, message }
3. get_account_type() RPC returns:
   - 'admin' if user_id in staff_roles with role='admin'
   - 'seller' if user_id in staff_roles with role='seller'
   - 'buyer' if user_id in buyer_profiles
   - 'unknown' if no role found
```

### Role-Based Access Control (RLS Policies)
- **Buyer profiles**: Users can only read/update own profile
- **Staff roles**: Staff can only read their own role
- **Seller accounts**: RLS policies control seller data visibility

---

## 5. SHIPPING PARTNER - SHIPROCKET

### Shipping Provider: Shiprocket
- **Status**: Enabled and configured
- **Type**: India-origin fulfillment
- **Supported Lanes**:
  - ✅ India domestic (India → India)
  - ✅ India international (India → International)

### Shiprocket Configuration (Database)
Stored in `public.shipping_provider_settings` table:
```
Provider: shiprocket
Origin Country: IN (India)
API Base URL: https://apiv2.shiprocket.in
```

### Shiprocket API Endpoints
```
Auth: /v1/external/auth/login
Domestic Serviceability: /v1/external/courier/serviceability/
International Serviceability: /v1/external/courier/international/serviceability
Create Order: /v1/external/orders/create/adhoc
Assign AWB: /v1/external/courier/assign/awb
Generate Label: /v1/external/courier/generate/label
Generate Manifest: /v1/external/manifests/generate
Print Manifest: /v1/external/manifests/print
Track AWB: /v1/external/courier/track/awb/{awb_code}
```

### Shiprocket Secrets (Supabase Edge Functions)
```
SHIPROCKET_API_EMAIL
SHIPROCKET_API_PASSWORD
```
Stored in: Supabase Dashboard → Edge Functions → Secrets

### Shiprocket Authentication
- **Method**: Email + Password login
- **Response**: Bearer token
- **Cache**: Stored in `public.shiprocket_auth_cache`
- **Cache Duration**: 9 days
- **Cache Refresh**: Automatic when expired (within 60 seconds of expiry)

### Shiprocket Warehouse Sync
- **Table**: `public.seller_warehouses`
- **Columns**:
  - `shiprocket_pickup_location_name` - Synced pickup location
  - `shiprocket_pickup_synced_at` - Last sync timestamp
- **Sync Function**: `shiprocket-sync-pickup` Edge Function
- **Sync Trigger**: Admin can manually sync warehouse to Shiprocket

### Order Flow with Shiprocket
```
1. Order created in marketplace_orders table
2. Status: shiprocket_pending
3. Admin pushes order via shiprocket-admin-push-order function
4. Status updated to: shiprocket_created
5. AWB (tracking number) assigned
6. Label/Manifest generated
7. Status progresses: packed → shipped → delivered
```

---

## 6. SHIPPING LIVE RATES

### How Shipping Rates Are Fetched

#### Endpoint: `shiprocket-serviceability` Edge Function
**Triggered When**: Buyer selects delivery address during checkout

**Input Requirements**:
```typescript
{
  sellerUserId: string,           // Seller UUID
  deliveryPostcode?: string,      // Required for domestic India
  deliveryCountryIso2: string,    // e.g., "IN", "US"
  paymentMethod?: 'prepaid'|'cod',// Prepaid or Cash on Delivery
  items: [{
    productId: number,
    quantity: number
  }]
}
```

**Validations**:
1. ✅ Seller must be India-origin (checked via `is_india_origin_seller()` RPC)
2. ✅ Products must exist and be approved (`approval_status = 'approved'`)
3. ✅ Seller must have completed warehouse setup
4. ✅ Warehouse must have `postal_code` configured
5. ✅ For domestic: `deliveryPostcode` is required
6. ✅ For international: COD not allowed (only prepaid)

**Rate Calculation Process**:
```
1. Fetch all products from seller
2. Sum total weight from all items (weight_kg × quantity)
3. Get max dimensions (length, width, height)
4. Call Shiprocket API with:
   - Pickup postcode (from seller warehouse)
   - Delivery postcode/country
   - Total weight
   - Package dimensions
   - Payment method (cod flag)
5. Parse Shiprocket response for available couriers
6. Pick courier with LOWEST total charge:
   - Shipping charge
   - + COD charges (if applicable)
```

**Response**:
```typescript
{
  serviceable: true,
  quote: {
    shippingCharge: number,
    codCharges: number,
    totalShippingCharge: number,
    estimatedDelivery: string|null,  // "2-3 days"
    courierCompanyId: number,
    courierName: string,              // "Courier name"
    codAvailable: boolean,
    weightKg: number,
    lengthCm: number|null,
    widthCm: number|null,
    heightCm: number|null
  }
}
```

### Product Dimensions Required
For accurate rate calculation, each product must have:
- `weight_kg` (required)
- `package_length_cm` (optional)
- `package_width_cm` (optional)
- `package_height_cm` (optional)

### Warehouse Configuration Required
Each seller must complete warehouse setup:
- Warehouse name
- Address line
- Postal code
- Dispatch cutoff time
- Shiprocket pickup location (synced)

---

## 7. PAYMENT GATEWAY - RAZORPAY

### Payment Processor: Razorpay
- **Type**: Payment aggregator (supports cards, UPI, netbanking, international cards)
- **Currencies Supported**: 
  - Primary: INR (Indian Rupees)
  - International: Via Razorpay (USD, EUR, GBP, etc.)
- **Payment Methods**:
  - ✅ Credit/Debit cards
  - ✅ UPI
  - ✅ Netbanking
  - ✅ International cards
  - ❌ NOT implemented: Cash on Delivery (framework exists but not in current order flow)

### Razorpay Secrets (Edge Functions)
```
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
```
Stored in: Supabase Dashboard → Edge Functions → Secrets

### Razorpay Configuration
- **API Endpoint**: `https://api.razorpay.com/v1/orders`
- **Authentication**: Basic Auth (Base64 encoded Key_ID:Key_SECRET)
- **SDK**: Loaded from CDN
  ```html
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  ```
  (in index.html)

### Payment Flow (Prepaid Orders)

#### Step 1: Create Razorpay Order (Frontend)
```typescript
// Calls Edge Function: razorpay-create-order
const response = await supabase.functions.invoke('razorpay-create-order', {
  body: {
    sellerUserId: string,
    currencyCode: 'INR',           // or USD, EUR, etc.
    subtotal: number,
    shippingAmount: number,
    codChargesAmount: number,      // 0 for prepaid
    totalAmount: number,
    delivery: { ... },
    shippingQuote: { ... },
    items: [
      {
        productId: number,
        sellerUserId: string,
        sku: string,
        title: string,
        quantity: number,
        unitPrice: number,
        variantId?: number
      }
    ]
  }
})
```

#### Step 2: Create Marketplace Order
**Function**: `create_marketplace_order()` RPC
- **Input**: All cart items, delivery, shipping quote
- **Output**: Returns `orderId` and `orderNumber`
- **Status**: Set to `awaiting_payment`
- **Payment Status**: `pending`

#### Step 3: Record Razorpay Order
**Function**: `record_razorpay_order()` RPC
- **Input**:
  - `orderId` (marketplace order ID)
  - `razorpay_order_id` (from Razorpay API)
  - `amount_minor` (in smallest unit)
  - `currency_code` (3-letter code)
- **Stored In**: `payment_transactions` table
- **Status**: `pending`

#### Step 4: Open Razorpay Checkout Modal
```typescript
const razorpay = new window.Razorpay({
  key: response.key_id,
  amount: response.amount,        // In smallest unit (paise for INR)
  currency: response.currency,
  order_id: response.order_id,
  name: 'AGTRENZ',
  description: 'Marketplace Order',
  prefill: {
    name: buyerName,
    email: buyerEmail,
    contact: buyerPhone
  },
  handler: (success_response) => { /* verify payment */ },
  modal: {
    ondismiss: () => { /* handle close */ }
  }
})
razorpay.open()
```

#### Step 5: Verify Payment Signature (Frontend)
After successful payment, Razorpay returns:
```typescript
{
  razorpay_payment_id: string,
  razorpay_order_id: string,
  razorpay_signature: string
}
```

#### Step 6: Confirm Razorpay Payment (Backend)
**Function**: `confirm_marketplace_razorpay_payment()` RPC
- **Input**:
  - `orderId`
  - `razorpay_order_id`
  - `razorpay_payment_id`
  - `amount_minor`
  - `currency_code`
  - `raw_payload` (Razorpay response)
- **Updates**:
  - Marketplace order: status → `pending_seller_acceptance`, payment_status → `paid`
  - Payment transaction: status → `succeeded`
  - Sets `paid_at` timestamp
- **Returns**: `{ ok: true, orderNumber, alreadyConfirmed }`

### Amount Conversion (Currency Handling)
```typescript
function toRazorpayMinorAmount(amount: number, currencyCode: string) {
  // Currencies with zero decimal places: BIF, CLF, DJF, GNF, JPY, KMF, KRW, etc.
  // Standard: multiply by 100 (paise for INR, cents for USD)
  // Zero-decimal: no multiplication needed
}
```

### Payment Transaction Table Schema
```
payment_transactions:
- order_id (FK to marketplace_orders)
- provider ('razorpay')
- razorpay_order_id (unique)
- razorpay_payment_id
- amount_minor (smallest currency unit)
- currency_code (3-letter code)
- status ('pending', 'succeeded', 'failed')
- raw_payload (full Razorpay response)
- created_at, updated_at
```

### Payment Refunds
**Function**: `createRazorpayRefund()`
- Endpoint: `https://api.razorpay.com/v1/payments/{paymentId}/refund`
- Supported: Full or partial refunds
- For cancelled orders: Refund goes to original payment method

---

## 8. ENVIRONMENT VARIABLES SUMMARY

### Frontend Required (Amplify)
```env
VITE_SUPABASE_URL=https://[project].supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_SITE_URL=https://www.agtrenz.com
VITE_OPENCAGE_API_KEY=your_opencage_key
```

### Backend Secrets (Supabase Edge Functions)
```env
SUPABASE_URL=https://[project].supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Razorpay
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=xxxxxxx

# Shiprocket
SHIPROCKET_API_EMAIL=your_email@shiprocket.in
SHIPROCKET_API_PASSWORD=your_password

# Optional
EXCHANGERATE_API_KEY=your_key
SITE_URL=https://www.agtrenz.com
```

---

## 9. KEY MIGRATIONS & DATABASE STRUCTURE

### Critical Migrations
1. **20260619160000_auth_roles.sql**
   - Role tables: `buyer_profiles`, `staff_roles`
   - Signup guards and triggers
   - RPC: `get_account_type()`, `get_staff_role()`, `is_buyer_account()`

2. **20260620200000_search_history_route_access.sql**
   - RPC: `verify_login_portal()`
   - Portal access control

3. **20260620280000_shiprocket_orders_shipping.sql**
   - `shipping_provider_settings` (Shiprocket config)
   - `shiprocket_auth_cache` (token caching)
   - Warehouse columns for Shiprocket

4. **20260620340000_razorpay_payments.sql**
   - `payment_transactions` table
   - RPC: `record_razorpay_order()`, `confirm_marketplace_razorpay_payment()`

5. **20260620290300_marketplace_platform_features.sql**
   - `marketplace_orders` table
   - Order status enums
   - Payment method enums

---

## 10. EDGE FUNCTIONS DEPLOYED

### Shipping Functions
- `shiprocket-serviceability` - Live rate calculation
- `shiprocket-track` - Track orders
- `shiprocket-admin-push-order` - Push order to Shiprocket
- `shiprocket-seller-documents` - Download labels/manifests
- `shiprocket-sync-pickup` - Sync warehouse pickup location

### Payment Functions
- `razorpay-create-order` - Create Razorpay order
- `razorpay-verify-payment` - Verify payment signature

### Utility Functions
- `refresh-fx-rates` - Update FX rates for currencies
- `logistics-tracking-webhook` - Webhook for shipment updates

---

## 11. SUMMARY TABLE

| Component | Details |
|-----------|---------|
| **Frontend** | React 19 + TypeScript + Vite, deployed on AWS Amplify |
| **Database** | Supabase (PostgreSQL 17) |
| **Domain** | agtrenz.com → www.agtrenz.com |
| **User Roles** | Buyer (self-signup), Seller (self-signup), Admin (backend-only) |
| **Shipping** | Shiprocket (India origin, domestic + international) |
| **Shipping Rates** | Live rates via Edge Function, lowest courier auto-selected |
| **Payment** | Razorpay (cards, UPI, netbanking) |
| **Auth** | Supabase Auth (email/password) |
| **RLS** | Row-level security on user data |
| **Secrets** | Stored in Supabase Edge Functions console |

