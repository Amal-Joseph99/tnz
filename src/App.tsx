import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { CurrencyProvider } from './context/CurrencyContext'
import { AdminDashboardPage } from './pages/AdminDashboardPage'
import { AboutUsPage } from './pages/AboutUsPage'
import { BestSellersPage } from './pages/BestSellersPage'
import { BuyerForgotOtpVerificationPage } from './pages/BuyerForgotOtpVerificationPage'
import { BuyerForgotPasswordPage } from './pages/BuyerForgotPasswordPage'
import { BuyerOtpVerificationPage } from './pages/BuyerOtpVerificationPage'
import { BuyerResetPasswordPage } from './pages/BuyerResetPasswordPage'
import { CareersPage } from './pages/CareersPage'
import { CartPage } from './pages/CartPage'
import { CategoriesPage } from './pages/CategoriesPage'
import { CategoryProductsPage } from './pages/CategoryProductsPage'
import { ContactUsPage } from './pages/ContactUsPage'
import { CookiesSettingsPage } from './pages/CookiesSettingsPage'
import { HomePage } from './pages/HomePage'
import { HelpCenterPage } from './pages/HelpCenterPage'
import { NewArrivalsPage } from './pages/NewArrivalsPage'
import { NotificationsPage } from './pages/NotificationsPage'
import { OrdersPage } from './pages/OrdersPage'
import { PressPage } from './pages/PressPage'
import { ProductDetailsPage } from './pages/ProductDetailsPage'
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage'
import { ProfilePage } from './pages/ProfilePage'
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
import { TermsOfServicePage } from './pages/TermsOfServicePage'
import { TrackOrderPage } from './pages/TrackOrderPage'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import './App.css'

function AppContent() {
  const location = useLocation()
  const isRestrictedConsole = location.pathname.startsWith('/seller/') || location.pathname.startsWith('/admin/')

  return (
    <CurrencyProvider>
      <div className="app">
        {!isRestrictedConsole && <Header />}
        <main>
          <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/search" element={<SearchResultsPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/category/:categorySlug" element={<CategoryProductsPage />} />
              <Route path="/product/:productId" element={<ProductDetailsPage />} />
              <Route path="/new-arrivals" element={<NewArrivalsPage />} />
              <Route path="/best-sellers" element={<BestSellersPage />} />
              <Route path="/sale" element={<SalePage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
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
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="/terms-of-service" element={<TermsOfServicePage />} />
              <Route path="/cookies-settings" element={<CookiesSettingsPage />} />
              <Route path="/sellerslandingpage" element={<SellersLandingPage />} />
              <Route path="/seller/signin" element={<SellersLoginPage />} />
              <Route path="/seller/signup" element={<SellersSignupPage />} />
              <Route path="/seller/verify-email" element={<SellerOtpVerificationPage />} />
              <Route path="/seller/forgot-password" element={<SellerForgotPasswordPage />} />
              <Route path="/seller/forgot-password/verify" element={<SellerForgotOtpVerificationPage />} />
              <Route path="/seller/reset-password" element={<SellerResetPasswordPage />} />
              <Route path="/seller/dashboard" element={<SellerDashboardPage />} />
              <Route path="/seller/profile" element={<SellerProfilePage />} />
              <Route path="/seller/warehouse" element={<SellerWarehousePage />} />
              <Route path="/seller/products" element={<SellerProductsPage />} />
              <Route path="/seller/orders" element={<SellerOrdersPage />} />
              <Route path="/seller/wallet" element={<SellerWalletPage />} />
              <Route path="/seller/help" element={<SellerHelpPage />} />
              <Route path="/seller/terms-policies" element={<SellerTermsPoliciesPage />} />
              <Route path="/seller/notifications" element={<SellerNotificationsPage />} />
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
              <Route path="/sellerslogin" element={<Navigate to="/seller/signin" replace />} />
              <Route path="/sellerssignup" element={<Navigate to="/seller/signup" replace />} />
              <Route path="/seller-email-otp-verification" element={<Navigate to="/seller/verify-email" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        {!isRestrictedConsole && <Footer />}
      </div>
    </CurrencyProvider>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App
