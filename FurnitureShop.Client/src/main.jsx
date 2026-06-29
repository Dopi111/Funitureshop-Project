import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import Cart from './pages/Cart.jsx'
import Checkout from './pages/Checkout.jsx'
import ProductDetail from './pages/ProductDetail.jsx'
import CategoryPage from './pages/CategoryPage.jsx'
import MyOrders from './pages/MyOrders.jsx'
import UserProfile from './pages/UserProfile.jsx'
import ProductsPage from './pages/ProductsPage.jsx'
import WishlistPage from './pages/WishlistPage.jsx'
import AboutPage from './pages/AboutPage.jsx'
import LookbookPage from './pages/LookbookPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { CartProvider } from './context/CartContext.jsx'
import { WishlistProvider } from './context/WishlistContext.jsx'
import { AdminRoute } from './components/ProtectedRoute.jsx'
import { Toaster } from 'react-hot-toast'
import AdminDashboard from './pages/admin/AdminDashboard.jsx'
import AdminCategories from './pages/admin/AdminCategories.jsx'
import AdminOrders from './pages/admin/AdminOrders.jsx'
import AdminUsers from './pages/admin/AdminUsers.jsx'
import AdminUtilities from './pages/admin/AdminUtilities.jsx'
import AdminStatistics from './pages/admin/AdminStatistics.jsx'
import AdminOverview from './pages/admin/AdminOverview.jsx'
import AdminBehavior from './pages/admin/AdminBehavior.jsx'
import AdminInventory from './pages/admin/AdminInventory.jsx'
import AdminDelivery from './pages/admin/AdminDelivery.jsx'
import AdminChat from './pages/admin/AdminChat.jsx'
import AdminTickets from './pages/admin/AdminTickets.jsx'
import AdminAuth from './pages/admin/AdminAuth.jsx'
import AdminSuppliers from './pages/admin/AdminSuppliers.jsx'
import AdminStockIn from './pages/admin/AdminStockIn.jsx'
import AdminPromotions from './pages/admin/AdminPromotions.jsx'
import AdminAuditLogs from './pages/admin/AdminAuditLogs.jsx'
import AdminSettings from './pages/admin/AdminSettings.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <WishlistProvider>
        <CartProvider>
          <BrowserRouter>
            <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<App />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/category/:id" element={<CategoryPage />} />
              <Route path="/my-orders" element={<MyOrders />} />
              <Route path="/profile" element={<UserProfile />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/category/all" element={<ProductsPage />} />
              <Route path="/wishlist" element={<WishlistPage />} />
              <Route path="/gioi-thieu" element={<AboutPage />} />
              <Route path="/cam-hung" element={<LookbookPage />} />

              {/* Admin Routes */}
              <Route
                path="/admin/dashboard"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/categories"
                element={
                  <AdminRoute>
                    <AdminCategories />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/orders"
                element={
                  <AdminRoute>
                    <AdminOrders />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <AdminRoute>
                    <AdminUsers />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/utilities"
                element={
                  <AdminRoute>
                    <AdminUtilities />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/statistics"
                element={
                  <AdminRoute>
                    <AdminStatistics />
                  </AdminRoute>
                }
              />
              <Route path="/admin/overview" element={<AdminRoute><AdminOverview /></AdminRoute>} />
              <Route path="/admin/behavior" element={<AdminRoute><AdminBehavior /></AdminRoute>} />
              <Route path="/admin/inventory" element={<AdminRoute><AdminInventory /></AdminRoute>} />
              <Route path="/admin/delivery" element={<AdminRoute><AdminDelivery /></AdminRoute>} />
              <Route path="/admin/chat" element={<AdminRoute><AdminChat /></AdminRoute>} />
              <Route path="/admin/tickets" element={<AdminRoute><AdminTickets /></AdminRoute>} />
              <Route path="/admin/auth" element={<AdminRoute><AdminAuth /></AdminRoute>} />
              <Route path="/admin/suppliers" element={<AdminRoute><AdminSuppliers /></AdminRoute>} />
              <Route path="/admin/stock-in" element={<AdminRoute><AdminStockIn /></AdminRoute>} />
              <Route path="/admin/stockin" element={<AdminRoute><AdminStockIn /></AdminRoute>} />
              <Route path="/admin/promotions" element={<AdminRoute><AdminPromotions /></AdminRoute>} />
              <Route path="/admin/audit-logs" element={<AdminRoute><AdminAuditLogs /></AdminRoute>} />
              <Route path="/admin/auditlogs" element={<AdminRoute><AdminAuditLogs /></AdminRoute>} />
              <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
              <Route path="/admin/login" element={<Navigate to="/login" replace />} />
              <Route path="/admin" element={<Navigate to="/admin/overview" replace />} />
              <Route path="/admin/*" element={<Navigate to="/admin/overview" replace />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </WishlistProvider>
    </AuthProvider>
  </StrictMode>,
)
