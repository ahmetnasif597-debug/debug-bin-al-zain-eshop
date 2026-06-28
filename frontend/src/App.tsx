import { Switch, Route, Router as WouterRouter } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/context/cart-context";
import { AdminProvider } from "@/context/admin-context";
import { StoreStatusProvider } from "@/context/store-status-context";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminLayout } from "@/components/admin/admin-layout";
import { StoreStatusBanner } from "@/components/store-status-banner";

import Home from "@/pages/home";
import Products from "@/pages/products";
import ProductDetail from "@/pages/product-detail";
import Cart from "@/pages/cart";
import Calculator from "@/pages/calculator";
import About from "@/pages/about";
import NotFound from "@/pages/not-found";

import AdminDashboard from "@/pages/admin/dashboard";
import AdminProducts from "@/pages/admin/products";
import AdminCategories from "@/pages/admin/categories";
import AdminOrders from "@/pages/admin/orders";
import AdminCustomers from "@/pages/admin/customers";
import AdminNotifications from "@/pages/admin/notifications";
import AdminSettings from "@/pages/admin/settings";
import LoginPage from "@/pages/login";
import ProfilePage from "@/pages/profile";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: unknown) => {
        const status = (error as { status?: number; response?: { status?: number } })?.status
          ?? (error as { response?: { status?: number } })?.response?.status;
        if (status === 401 || status === 403) return false;
        return failureCount < 3;
      },
    },
  },
});

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-[100dvh]">
      <StoreStatusBanner />
      <Navbar />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
}

function Router() {
  return (
    <Switch>
      {/* Admin Routes */}
      <Route path="/admin">
        <AdminGuard>
          <AdminLayout>
            <AdminDashboard />
          </AdminLayout>
        </AdminGuard>
      </Route>
      <Route path="/admin/products">
        <AdminGuard>
          <AdminLayout>
            <AdminProducts />
          </AdminLayout>
        </AdminGuard>
      </Route>
      <Route path="/admin/categories">
        <AdminGuard>
          <AdminLayout>
            <AdminCategories />
          </AdminLayout>
        </AdminGuard>
      </Route>
      <Route path="/admin/orders">
        <AdminGuard>
          <AdminLayout>
            <AdminOrders />
          </AdminLayout>
        </AdminGuard>
      </Route>
      <Route path="/admin/customers">
        <AdminGuard>
          <AdminLayout>
            <AdminCustomers />
          </AdminLayout>
        </AdminGuard>
      </Route>
      <Route path="/admin/notifications">
        <AdminGuard>
          <AdminLayout>
            <AdminNotifications />
          </AdminLayout>
        </AdminGuard>
      </Route>
      <Route path="/admin/settings">
        <AdminGuard>
          <AdminLayout>
            <AdminSettings />
          </AdminLayout>
        </AdminGuard>
      </Route>

      {/* Public Routes */}
      <Route path="/">
        <PublicLayout><Home /></PublicLayout>
      </Route>
      <Route path="/products">
        <PublicLayout><Products /></PublicLayout>
      </Route>
      <Route path="/products/:id">
        <PublicLayout><ProductDetail /></PublicLayout>
      </Route>
      <Route path="/cart">
        <PublicLayout><Cart /></PublicLayout>
      </Route>
      <Route path="/calculator">
        <PublicLayout><Calculator /></PublicLayout>
      </Route>
      <Route path="/about">
        <PublicLayout><About /></PublicLayout>
      </Route>
      <Route path="/login">
        <LoginPage />
      </Route>
      <Route path="/profile">
        <PublicLayout><ProfilePage /></PublicLayout>
      </Route>
      <Route>
        <PublicLayout><NotFound /></PublicLayout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <StoreStatusProvider>
          <CartProvider>
            <AdminProvider>
              <WouterRouter hook={useHashLocation}>
                <Router />
              </WouterRouter>
              <Toaster />
            </AdminProvider>
          </CartProvider>
        </StoreStatusProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
