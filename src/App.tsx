import { RequireAdminAuth, RequireBuyerAuth, RequireSellerAuth } from './components/AuthGate'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { RouteAccessGuard } from './components/RouteAccessGuard'
import { AuthProvider } from './context/AuthContext'
import { CheckoutProvider } from './context/CheckoutContext'
import { CartFlyProvider } from './context/CartFlyContext'
import { ConfirmDialogProvider } from './context/ConfirmDialogContext'
import { CurrencyProvider } from './context/CurrencyContext'
import { preloadDialogMessages } from './lib/appDialogs'
import { AdminCategoriesPage } from './pages/AdminCategoriesPage'
import { AdminCustomersPage } from './pages/AdminCustomersPage'
import { AdminDashboardPage } from './pages/AdminDashboardPage'
import { AdminKycPage } from './pages/AdminKycPage'
import { AdminNotificationsPage } from './pages/AdminNotificationsPage'
import { AdminOrdersPage } from './pages/AdminOrdersPage'
import { AdminProductsPage } from './pages/AdminProductsPage'
import { AdminProductDetailPage } from './pages/AdminProductDetailPage'
import { AdminSellersPage } from './pages/AdminSellersPage'
import { AdminWarehousesPage } from './pages/AdminWarehousesPage'
import { AdminWarehouseDetailPage } from './pages/AdminWarehouseDetailPage'
import { AdminSettingsPage } from './pages/AdminSettingsPage'
import { AdminHelpPage } from './pages/AdminHelpPage'
import { AdminStorefrontSectionsPage } from './pages/AdminStorefrontSectionsPage'
import { AboutUsPage } from './pages/AboutUsPage'
import { BestSellersPage } from './pages/BestSellersPage'
import { BuyerForgotOtpVerificationPage } from './pages/BuyerForgotOtpVerificationPage'
import { BuyerForgotPasswordPage } from './pages/BuyerForgotPasswordPage'
import { BuyerOtpVerificationPage } from './pages/BuyerOtpVerificationPage'
import { BuyerResetPasswordPage } from './pages/BuyerResetPasswordPage'
import { CareersPage } from './pages/CareersPage'
import { CartPage } from './pages/CartPage'
import { CheckoutAddressPage } from './pages/CheckoutAddressPage'
import { CheckoutOrderStatusPage } from './pages/CheckoutOrderStatusPage'
import { CheckoutPaymentPage } from './pages/CheckoutPaymentPage'
import { CheckoutReviewPage } from './pages/CheckoutReviewPage'
import { CategoriesPage } from './pages/CategoriesPage'
import { CategoryProductsPage } from './pages/CategoryProductsPage'
import { ContactUsPage } from './pages/ContactUsPage'
import { HomePage } from './pages/HomePage'
import { HelpCenterPage } from './pages/HelpCenterPage'
import { NewArrivalsPage } from './pages/NewArrivalsPage'
import { NotificationsPage } from './pages/NotificationsPage'
import { OrdersPage } from './pages/OrdersPage'
import { PressPage } from './pages/PressPage'
import { ProductDetailsPage } from './pages/ProductDetailsPage'
import { AdminReturnsPage } from './pages/AdminReturnsPage'
import { AdminSupportPage } from './pages/AdminSupportPage'
import { LegalDocumentBySlug } from './pages/LegalDocumentPage'
import { ProfilePage } from './pages/ProfilePage'
import { DeleteAccountPage } from './pages/DeleteAccountPage'
import { ReturnsPage } from './pages/ReturnsPage'
import { SalePage } from './pages/SalePage'
import { SearchResultsPage } from './pages/SearchResultsPage'
import { SellerDashboardPage } from './pages/SellerDashboardPage'
import { SellerForgotOtpVerificationPage } from './pages/SellerForgotOtpVerificationPage'
import { SellerForgotPasswordPage } from './pages/SellerForgotPasswordPage'
import { SellerHelpPage } from './pages/SellerHelpPage'
import { SellerNotificationsPage } from './pages/SellerNotificationsPage'
import { SellerOtpVerificationPage } from './pages/SellerOtpVerificationPage'
import { SellerOrdersPage } from './pages/SellerOrdersPage'
import { SellerProductsPage } from './pages/SellerProductsPage'
import { ProductListingWizardPage, ProductListingWizardRedirect } from './pages/ProductListingWizardPage'
import { SellerKycVerificationPage } from './pages/SellerKycVerificationPage'
import { SellerProfilePage } from './pages/SellerProfilePage'
import { SellerResetPasswordPage } from './pages/SellerResetPasswordPage'
import { SellerTermsPoliciesPage } from './pages/SellerTermsPoliciesPage'
import { SellerWalletPage } from './pages/SellerWalletPage'
import { SellerWarehousePage } from './pages/SellerWarehousePage'
import { SellersLandingPage } from './pages/SellersLandingPage'
import { SellersLoginPage } from './pages/SellersLoginPage'
import { SellersSignupPage } from './pages/SellersSignupPage'
import { SignInPage } from './pages/SignInPage'
import { SignUpPage } from './pages/SignUpPage'
import { SustainabilityPage } from './pages/SustainabilityPage'
import { TrackOrderPage } from './pages/TrackOrderPage'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { showMarketplaceChrome } from './lib/authRoutes'
import { PageBackButton } from './components/PageBackButton'
import { ScrollToTop } from './components/ScrollToTop'
import './App.css'

function AppContent() {
  const location = useLocation()
  const marketplaceChrome = showMarketplaceChrome(location.pathname)
  const [routeLoading, setRouteLoading] = useState(false)
  const showBackButton = marketplaceChrome && location.pathname !== '/'

  useEffect(() => {
    void preloadDialogMessages(['sign_out', 'delete', 'remove', 'guest_add_to_cart', 'console_sign_out', 'delete_review'])
  }, [])

  useEffect(() => {
    setRouteLoading(true)
    const timer = window.setTimeout(() => setRouteLoading(false), 180)
    return () => window.clearTimeout(timer)
  }, [location.key])

  return (
    <CurrencyProvider>
      <ScrollToTop />
      <div className="app">
        {marketplaceChrome && <Header />}
        {showBackButton && (
          <div className="page-backbar">
            <div className="container page-backbar__inner">
              <PageBackButton />
            </div>
          </div>
        )}
        <main className="app-main">
          {routeLoading && (
            <div className="page-loading page-loading--overlay" aria-hidden="true">
              <div className="page-loading__spinner" />
            </div>
          )}
          <RouteAccessGuard>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/search" element={<SearchResultsPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutAddressPage />} />
              <Route path="/checkout/payment" element={<CheckoutPaymentPage />} />
              <Route path="/checkout/review" element={<CheckoutReviewPage />} />
              <Route path="/checkout/status" element={<CheckoutOrderStatusPage />} />
              <Route path="/checkout/confirmation" element={<Navigate to="/checkout/status" replace />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/category/:categorySlug" element={<CategoryProductsPage />} />
              <Route path="/category/:categorySlug/:subCategorySlug" element={<CategoryProductsPage />} />
              <Route path="/product/:productId" element={<ProductDetailsPage />} />
              <Route path="/new-arrivals" element={<NewArrivalsPage />} />
              <Route path="/best-sellers" element={<BestSellersPage />} />
              <Route path="/sale" element={<SalePage />} />
              <Route path="/profile" element={<RequireBuyerAuth><ProfilePage /></RequireBuyerAuth>} />
              <Route path="/profile/delete-account" element={<RequireBuyerAuth><DeleteAccountPage /></RequireBuyerAuth>} />
              <Route path="/orders" element={<RequireBuyerAuth><OrdersPage /></RequireBuyerAuth>} />
              <Route path="/notifications" element={<RequireBuyerAuth><NotificationsPage /></RequireBuyerAuth>} />
              <Route path="/buyer/signin" element={<SignInPage />} />
              <Route path="/buyer/signup" element={<SignUpPage />} />
              <Route path="/buyer/verify-email" element={<BuyerOtpVerificationPage />} />
              <Route path="/buyer/forgot-password" element={<BuyerForgotPasswordPage />} />
              <Route path="/buyer/forgot-password/verify" element={<BuyerForgotOtpVerificationPage />} />
              <Route path="/buyer/reset-password" element={<BuyerResetPasswordPage />} />
              <Route path="/signin" element={<Navigate to="/buyer/signin" replace />} />
              <Route path="/signup" element={<Navigate to="/buyer/signup" replace />} />
              <Route path="/help" element={<HelpCenterPage />} />
              <Route path="/track-order" element={<TrackOrderPage />} />
              <Route path="/returns" element={<ReturnsPage />} />
              <Route path="/contact" element={<ContactUsPage />} />
              <Route path="/about" element={<AboutUsPage />} />
              <Route path="/careers" element={<CareersPage />} />
              <Route path="/press" element={<PressPage />} />
              <Route path="/sustainability" element={<SustainabilityPage />} />
              <Route path="/privacy-policy" element={<LegalDocumentBySlug slug="privacy-policy" />} />
              <Route path="/terms-of-service" element={<LegalDocumentBySlug slug="terms-of-service" />} />
              <Route path="/cookies-settings" element={<LegalDocumentBySlug slug="cookies-settings" />} />
              <Route path="/shipping-policy" element={<LegalDocumentBySlug slug="shipping-policy" />} />
              <Route path="/refund-policy" element={<LegalDocumentBySlug slug="refund-policy" />} />
              <Route path="/seller-agreement" element={<LegalDocumentBySlug slug="seller-agreement" />} />
              <Route path="/buyer-protection" element={<LegalDocumentBySlug slug="buyer-protection" />} />
              <Route path="/payment-terms" element={<LegalDocumentBySlug slug="payment-terms" />} />
              <Route path="/disclaimer" element={<LegalDocumentBySlug slug="disclaimer" />} />
              <Route path="/accessibility" element={<LegalDocumentBySlug slug="accessibility" />} />
              <Route path="/sellerslandingpage" element={<SellersLandingPage />} />
              <Route path="/seller/signin" element={<SellersLoginPage />} />
              <Route path="/seller/signup" element={<SellersSignupPage />} />
              <Route path="/seller/verify-email" element={<SellerOtpVerificationPage />} />
              <Route path="/seller/forgot-password" element={<SellerForgotPasswordPage />} />
              <Route path="/seller/forgot-password/verify" element={<SellerForgotOtpVerificationPage />} />
              <Route path="/seller/reset-password" element={<SellerResetPasswordPage />} />
              <Route path="/seller/dashboard" element={<RequireSellerAuth><SellerDashboardPage /></RequireSellerAuth>} />
              <Route path="/seller/profile" element={<RequireSellerAuth><SellerProfilePage /></RequireSellerAuth>} />
              <Route path="/seller/kyc" element={<RequireSellerAuth><SellerKycVerificationPage /></RequireSellerAuth>} />
              <Route path="/seller/kyc/step/:step" element={<RequireSellerAuth><SellerKycVerificationPage /></RequireSellerAuth>} />
              <Route path="/seller/warehouse" element={<RequireSellerAuth><SellerWarehousePage /></RequireSellerAuth>} />
              <Route path="/seller/products/new" element={<RequireSellerAuth><ProductListingWizardRedirect /></RequireSellerAuth>} />
              <Route path="/seller/products/new/step/:step" element={<RequireSellerAuth><ProductListingWizardPage /></RequireSellerAuth>} />
              <Route path="/seller/products/:productId/edit" element={<RequireSellerAuth><ProductListingWizardRedirect /></RequireSellerAuth>} />
              <Route path="/seller/products/:productId/edit/step/:step" element={<RequireSellerAuth><ProductListingWizardPage /></RequireSellerAuth>} />
              <Route path="/seller/products" element={<RequireSellerAuth><SellerProductsPage /></RequireSellerAuth>} />
              <Route path="/seller/orders" element={<RequireSellerAuth><SellerOrdersPage /></RequireSellerAuth>} />
              <Route path="/seller/wallet" element={<RequireSellerAuth><SellerWalletPage /></RequireSellerAuth>} />
              <Route path="/seller/help" element={<RequireSellerAuth><SellerHelpPage /></RequireSellerAuth>} />
              <Route path="/seller/terms-policies" element={<RequireSellerAuth><SellerTermsPoliciesPage /></RequireSellerAuth>} />
              <Route path="/seller/notifications" element={<RequireSellerAuth><SellerNotificationsPage /></RequireSellerAuth>} />
              <Route path="/admin/dashboard" element={<RequireAdminAuth><AdminDashboardPage /></RequireAdminAuth>} />
              <Route path="/admin/sellers" element={<RequireAdminAuth><AdminSellersPage /></RequireAdminAuth>} />
              <Route path="/admin/warehouses" element={<RequireAdminAuth><AdminWarehousesPage /></RequireAdminAuth>} />
              <Route path="/admin/warehouses/:userId" element={<RequireAdminAuth><AdminWarehouseDetailPage /></RequireAdminAuth>} />
              <Route path="/admin/kyc" element={<RequireAdminAuth><AdminKycPage /></RequireAdminAuth>} />
              <Route path="/admin/products" element={<RequireAdminAuth><AdminProductsPage /></RequireAdminAuth>} />
              <Route path="/admin/products/:productId" element={<RequireAdminAuth><AdminProductDetailPage /></RequireAdminAuth>} />
              <Route path="/admin/categories" element={<RequireAdminAuth><AdminCategoriesPage /></RequireAdminAuth>} />
              <Route path="/admin/homepage-sections" element={<RequireAdminAuth><AdminStorefrontSectionsPage /></RequireAdminAuth>} />
              <Route path="/admin/orders" element={<RequireAdminAuth><AdminOrdersPage /></RequireAdminAuth>} />
              <Route path="/admin/customers" element={<RequireAdminAuth><AdminCustomersPage /></RequireAdminAuth>} />
              <Route path="/admin/returns" element={<RequireAdminAuth><AdminReturnsPage /></RequireAdminAuth>} />
              <Route path="/admin/support" element={<RequireAdminAuth><AdminSupportPage /></RequireAdminAuth>} />
              <Route path="/admin/notifications" element={<RequireAdminAuth><AdminNotificationsPage /></RequireAdminAuth>} />
              <Route path="/admin/settings" element={<RequireAdminAuth><AdminSettingsPage /></RequireAdminAuth>} />
              <Route path="/admin/help" element={<RequireAdminAuth><AdminHelpPage /></RequireAdminAuth>} />
              <Route path="/sellerslogin" element={<Navigate to="/seller/signin" replace />} />
              <Route path="/sellerssignup" element={<Navigate to="/seller/signup" replace />} />
              <Route path="/seller-email-otp-verification" element={<Navigate to="/seller/verify-email" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </RouteAccessGuard>
        </main>
        {marketplaceChrome && <Footer />}
      </div>
    </CurrencyProvider>
  )
}

function App() {
  return (
    <BrowserRouter>
      <ConfirmDialogProvider>
        <AuthProvider>
          <CheckoutProvider>
            <CartFlyProvider>
              <AppContent />
            </CartFlyProvider>
          </CheckoutProvider>
        </AuthProvider>
      </ConfirmDialogProvider>
    </BrowserRouter>
  )
}

export default App
