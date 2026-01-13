import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Store from "./pages/Store";
import StoreOrders from "./pages/StoreOrders";
import StoreProductsNew from "./pages/StoreProductsNew";
import StoreProducts from "./pages/StoreProducts";
import Customize from "./pages/Customize";
import Catalog from "./pages/Catalog";
import Checkout from "./pages/Checkout";
import MyOrders from "./pages/MyOrders";
import ProductDetail from "./pages/ProductDetail";
import StoreSettings from "./pages/StoreSettings";
import TailorStorePage from "./pages/TailorStorePage";
import CustomerProfile from "./pages/CustomerProfile";
import TailorsMarketplace from "./pages/TailorsMarketplace";
import Wishlist from "./pages/Wishlist";
import SharedWishlist from "./pages/SharedWishlist";
import PaymentSuccess from "./pages/PaymentSuccess";
import OrderTracking from "./pages/OrderTracking";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/product/:productId" element={<ProductDetail />} />
            <Route path="/tailors" element={<TailorsMarketplace />} />
            <Route path="/tailor/:storeSlug" element={<TailorStorePage />} />
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/store"
              element={
                <ProtectedRoute requiredRole="tailor">
                  <Store />
                </ProtectedRoute>
              }
            />
            <Route
              path="/store/orders"
              element={
                <ProtectedRoute requiredRole="tailor">
                  <StoreOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/store/products/new"
              element={
                <ProtectedRoute requiredRole="tailor">
                  <StoreProductsNew />
                </ProtectedRoute>
              }
            />
            <Route
              path="/store/products"
              element={
                <ProtectedRoute requiredRole="tailor">
                  <StoreProducts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/store/settings"
              element={
                <ProtectedRoute requiredRole="tailor">
                  <StoreSettings />
                </ProtectedRoute>
              }
            />
            <Route path="/customize" element={<Customize />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route
              path="/my-orders"
              element={
                <ProtectedRoute>
                  <MyOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <CustomerProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/wishlist"
              element={
                <ProtectedRoute>
                  <Wishlist />
                </ProtectedRoute>
              }
            />
            <Route path="/shared-wishlist/:shareCode" element={<SharedWishlist />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route
              path="/order/:orderId"
              element={
                <ProtectedRoute>
                  <OrderTracking />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
