import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import ThemeToggle from "@/components/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building2 } from "lucide-react";
import type { Vendor } from "@shared/schema";
import { AuthProvider } from "@/contexts/AuthContext";
import { LoginPage } from "@/pages/LoginPage";
import { SignUpPage } from "@/pages/SignUpPage";
import { useEffect } from "react";
import Landing from "@/pages/landing";
import VendorLogin from "@/pages/vendor-login";
import VendorSignup from "@/pages/vendor-signup";
import VendorOnboarding from "@/pages/vendor-onboarding";
import VendorDashboard from "@/pages/vendor-dashboard";
import VendorDashboardSimple from "@/pages/vendor-dashboard-simple";
import AdminDashboard from "@/pages/admin-dashboard";
import Catalogue from "@/pages/catalogue";
import VendorCatalogueCreate from "@/pages/vendor-catalogue-create";
import VendorCatalogueEdit from "@/pages/vendor-catalogue-edit";
import VendorBookings from "@/pages/vendor-bookings";
import VendorAppointments from "@/pages/vendor-appointments";
import VendorOrders from "@/pages/vendor-orders";
import VendorEmployees from "@/pages/vendor-employees";
import VendorAttendance from "@/pages/vendor-attendance";
import VendorLeaves from "@/pages/vendor-leaves";
import VendorTasks from "@/pages/vendor-tasks";
import VendorTasksCreate from "@/pages/vendor-tasks-create";
import VendorTasksEdit from "@/pages/vendor-tasks-edit";
import VendorCustomers from "@/pages/vendor-customers";
import VendorCustomerDetail from "@/pages/vendor-customer-detail";
import VendorSuppliers from "@/pages/vendor-suppliers";
import VendorSupplierDetail from "@/pages/vendor-supplier-detail";
import VendorExpenses from "@/pages/vendor-expenses";
import VendorLeads from "@/pages/vendor-leads";
import VendorQuotations from "@/pages/vendor-quotations";
import VendorMiniWebsite from "@/pages/vendor-mini-website";
import VendorMiniWebsiteDashboard from "@/pages/vendor-mini-website-dashboard";
import MiniWebsitePublic from "@/pages/mini-website-public";
import MiniWebsiteProducts from "@/pages/mini-website-products";
import MiniWebsiteProductDetail from "@/pages/mini-website-product-detail";
import CustomerLogin from "@/pages/customer-login";
import CustomerSignup from "@/pages/customer-signup";
import MiniWebsiteMyOrders from "@/pages/mini-website-my-orders";
import AdminMasterCatalogue from "@/pages/admin-master-catalogue";
import AdminMasterData from "@/pages/admin-master-data";
import AdminMasterProducts from "@/pages/admin-master-products";
import VendorProductsCatalogue from "@/pages/vendor-products-catalogue";
import VendorProductsBrowse from "@/pages/vendor-products-browse";
import VendorServicesCatalogue from "@/pages/vendor-services-catalogue";
import VendorCategories from "@/pages/vendor-categories";
import VendorServiceDetail from "@/pages/vendor-service-detail";
import VendorCatalogueSelection from "@/pages/vendor-catalogue-selection";
import VendorStockTurnover from "@/pages/vendor-stock-turnover";
import VendorCoupons from "@/pages/vendor-coupons";
import VendorLedger from "@/pages/vendor-ledger";
import VendorLedgerTransaction from "@/pages/vendor-ledger-transaction";
import VendorCustomerLedger from "@/pages/vendor-customer-ledger";
import VendorLedgerCustomerSelection from "@/pages/vendor-ledger-customer-selection";
import VendorLedgerCustomerDashboard from "@/pages/vendor-ledger-customer-dashboard";
import VendorLedgerCustomerTransaction from "@/pages/vendor-ledger-customer-transaction";
import AdminGreetingTemplates from "@/pages/admin-greeting-templates";
import VendorGreetingBrowse from "@/pages/vendor-greeting-browse";
import VendorGreetingCustomize from "@/pages/vendor-greeting-customize";
import VendorPOS from "@/pages/vendor-pos";
import AdminLeads from "@/pages/admin-leads";
import AdminCustomers from "@/pages/admin-customers";
import AdminProducts from "@/pages/admin-products";
import AdminOrders from "@/pages/admin-orders";
import AdminVendors from "@/pages/admin-vendors";
import AdminSettings from "@/pages/admin-settings";
import AdminAdditionalServices from "@/pages/admin-additional-services";
import VendorAdditionalServices from "@/pages/vendor-additional-services";
import VendorSubscription from "@/pages/vendor-subscription";
import VendorAccount from "@/pages/vendor-account";
import VendorAccountBusinessDetails from "@/pages/vendor-account-business-details";
import VendorAccountPaymentSettings from "@/pages/vendor-account-payment-settings";
import NotFound from "@/pages/not-found";
import { getVendorId } from "@/hooks/useVendor";
import { isAuthenticated, clearAuthData } from "@/lib/auth";
import { useState } from "react";
import { monitorLocalStorage } from "@/lib/localStorageMonitor";

// Protected Route Component - Validates JWT token with backend
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isValid, setIsValid] = useState(false);
  
  // Validate JWT token ONCE on mount
  useEffect(() => {
    const checkAuth = async () => {
      console.log('🔍 [Auth] Validating JWT token...');
      const authenticated = await isAuthenticated();
      
      if (!authenticated) {
        console.warn('🔒 [Auth] Invalid or expired token, redirecting to login...');
        // ✅ IMPORTANT: Don't clear localStorage here!
        // Let user explicitly logout to clear data
        // This prevents data loss on refresh
        setLocation('/login');
      } else {
        console.log('✅ [Auth] Token validated successfully');
        setIsValid(true);
      }
      
      setIsChecking(false);
    };
    
    checkAuth();
  }, [setLocation]);
  
  // Show loading state while checking
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying authentication...</p>
        </div>
      </div>
    );
  }
  
  // If not valid, don't render (will redirect)
  if (!isValid) {
    return null;
  }
  
  return <>{children}</>;
}

function VendorLayout({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isValid, setIsValid] = useState(false);
  
  // Validate JWT token ONCE on mount
  useEffect(() => {
    const checkAuth = async () => {
      console.log('🔍 [VendorLayout] Validating JWT token...');
      const authenticated = await isAuthenticated();
      
      if (!authenticated) {
        console.warn('🔒 [VendorLayout] Invalid or expired token, redirecting to login...');
        clearAuthData();
        setLocation('/login');
      } else {
        console.log('✅ [VendorLayout] Token validated successfully');
        setIsValid(true);
      }
      
      setIsChecking(false);
    };
    
    checkAuth();
  }, [setLocation]);
  
  // Get real vendor ID from localStorage (returns null if not found, doesn't throw)
  const vendorId = getVendorId();
  
  // Fetch vendor data for profile display (only if vendorId exists)
  // MUST be called before any conditional returns to follow Rules of Hooks
  const { data: vendor } = useQuery<Vendor>({
    queryKey: ["/api/vendors", vendorId],
    enabled: !!vendorId && isValid, // Only fetch if vendorId exists AND auth is valid
  });
  
  // Show loading state while checking auth
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying authentication...</p>
        </div>
      </div>
    );
  }
  
  // If not valid, don't render (will redirect)
  if (!isValid) {
    return null;
  }

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        {/* Hide sidebar on mobile */}
        <div className="hidden md:block">
          <AppSidebar userRole="vendor" vendorId={vendorId} />
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 border-b border-border bg-background sticky top-0 z-10">
            <div className="flex items-center gap-3">
              {/* Hide sidebar toggle on mobile */}
              <div className="hidden md:block">
                <SidebarTrigger data-testid="button-sidebar-toggle" />
              </div>
              
              {/* Vendor Profile */}
              {vendor && (
                <div className="flex items-center gap-2 md:gap-3 md:pl-2 md:border-l border-border">
                  <Avatar className="h-8 w-8 md:h-10 md:w-10">
                    {vendor.logo ? (
                      <AvatarImage src={vendor.logo} alt={vendor.businessName} />
                    ) : (
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {vendor.businessName ? getInitials(vendor.businessName) : <Building2 className="h-4 w-4" />}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="hidden sm:flex flex-col">
                    <span className="text-sm font-semibold text-foreground leading-tight" data-testid="text-vendor-name">
                      {vendor.businessName}
                    </span>
                    <span className="text-xs text-muted-foreground leading-tight" data-testid="text-vendor-category">
                      {vendor.category}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto pb-16 md:pb-0">
            {children}
          </main>
          {/* Mobile Bottom Navigation */}
          <MobileBottomNav vendorId={vendorId} />
        </div>
      </div>
    </SidebarProvider>
  );
}

function AdminLayout({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [modulePermissions, setModulePermissions] = useState<string[]>([]);
  
  // Validate JWT token ONCE on mount
  useEffect(() => {
    const checkAuth = async () => {
      console.log('🔍 [AdminLayout] Validating JWT token...');
      const authenticated = await isAuthenticated();
      
      if (!authenticated) {
        console.warn('🔒 [AdminLayout] Invalid or expired token, redirecting to login...');
        clearAuthData();
        setLocation('/login');
        return;
      }
      
      // Get user role and permissions
      const role = localStorage.getItem('userRole');
      const userStr = localStorage.getItem('user');
      let permissions: string[] = [];
      
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          permissions = user.modulePermissions || [];
        } catch (e) {
          console.warn('Failed to parse user data');
        }
      }
      
      // Check if user is admin or employee
      if (role !== 'admin' && role !== 'employee') {
        console.warn('🔒 [AdminLayout] User is not admin or employee, redirecting...');
        setLocation('/vendor/dashboard');
        return;
      }
      
      setUserRole(role);
      setModulePermissions(permissions);
      console.log('✅ [AdminLayout] Token validated successfully', { role, permissions });
      setIsValid(true);
      setIsChecking(false);
    };
    
    checkAuth();
  }, [setLocation]);
  
  // Show loading state while checking auth
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying authentication...</p>
        </div>
      </div>
    );
  }
  
  // If not valid, don't render (will redirect)
  if (!isValid) {
    return null;
  }
  
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        {/* Hide sidebar on mobile */}
        <div className="hidden md:block">
          <AppSidebar userRole={userRole === "employee" ? "employee" : "admin"} modulePermissions={modulePermissions} />
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 border-b border-border bg-background sticky top-0 z-10">
            {/* Hide sidebar toggle on mobile */}
            <div className="hidden md:block">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
            </div>
            <div className="md:hidden">
              <h1 className="text-lg font-semibold">{userRole === "employee" ? "Employee Portal" : "Admin Portal"}</h1>
            </div>
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function Router() {
  return (
    <Switch>
      {/* Public Routes - No Protection */}
      <Route path="/" component={Landing} />
      <Route path="/login" component={VendorLogin} />
      <Route path="/signup" component={VendorSignup} />
      <Route path="/vendor/signup" component={VendorSignup} />
      
      {/* Redirect old routes to new ones */}
      <Route path="/vendor-login">
        {() => <Redirect to="/login" />}
      </Route>
      <Route path="/vendor-signup">
        {() => <Redirect to="/signup" />}
      </Route>
      
      {/* Deprecated Supabase Auth Routes - Redirect to new login */}
      <Route path="/auth/login">
        {() => <Redirect to="/login" />}
      </Route>
      <Route path="/auth/signup">
        {() => <Redirect to="/signup" />}
      </Route>

      {/* Public Mini-Website Routes - No Protection */}
      <Route path="/site/:subdomain" component={MiniWebsitePublic} />
      <Route path="/site/:subdomain/products" component={MiniWebsiteProducts} />
      <Route path="/site/:subdomain/products/:productId" component={MiniWebsiteProductDetail} />
      <Route path="/site/:subdomain/login" component={CustomerLogin} />
      <Route path="/site/:subdomain/signup" component={CustomerSignup} />
      <Route path="/site/:subdomain/my-orders" component={MiniWebsiteMyOrders} />

      {/* Protected Routes - Onboarding */}
      <Route path="/onboarding">
        <ProtectedRoute>
          <VendorOnboarding />
        </ProtectedRoute>
      </Route>

      {/* Protected Vendor Routes - VendorLayout handles authentication */}
      <Route path="/vendor/dashboard">
        <VendorLayout>
          <VendorDashboardSimple />
        </VendorLayout>
      </Route>
      <Route path="/vendors/:vendorId/dashboard">
        {() => <Redirect to="/vendor/dashboard" />}
      </Route>
      <Route path="/vendor/services-catalogue">
        <VendorLayout>
          <VendorServicesCatalogue />
        </VendorLayout>
      </Route>
      <Route path="/vendor/services/:id">
        <VendorLayout>
          <VendorServiceDetail />
        </VendorLayout>
      </Route>
      <Route path="/vendor/catalogue">
        <VendorLayout>
          <VendorCatalogueSelection />
        </VendorLayout>
      </Route>
      <Route path="/vendor/my-catalogue">
        <VendorLayout>
          <VendorServicesCatalogue />
        </VendorLayout>
      </Route>
      <Route path="/vendor/catalogue/create">
        <VendorLayout>
          <VendorCatalogueCreate />
        </VendorLayout>
      </Route>
      <Route path="/vendor/catalogue/edit/:id">
        <VendorLayout>
          <VendorCatalogueEdit />
        </VendorLayout>
      </Route>
      <Route path="/vendor/bookings">
        <VendorLayout>
          <VendorBookings />
        </VendorLayout>
      </Route>
      <Route path="/vendor/appointments">
        <VendorLayout>
          <VendorAppointments />
        </VendorLayout>
      </Route>
      <Route path="/vendor/orders">
        <VendorLayout>
          <VendorOrders />
        </VendorLayout>
      </Route>
      <Route path="/vendor/pos">
        <VendorLayout>
          <VendorPOS />
        </VendorLayout>
      </Route>
      <Route path="/vendor/categories">
        <VendorLayout>
          <VendorCategories />
        </VendorLayout>
      </Route>
      <Route path="/vendor/products-catalogue">
        <VendorLayout>
          <VendorProductsCatalogue />
        </VendorLayout>
      </Route>
      <Route path="/vendor/products/browse">
        <VendorLayout>
          <VendorProductsBrowse />
        </VendorLayout>
      </Route>
      <Route path="/vendor/products">
        <VendorLayout>
          <VendorProductsCatalogue />
        </VendorLayout>
      </Route>
      <Route path="/vendor/my-products">
        <VendorLayout>
          <VendorProductsCatalogue />
        </VendorLayout>
      </Route>
      <Route path="/vendor/stock-turnover">
        <VendorLayout>
          <VendorStockTurnover />
        </VendorLayout>
      </Route>
      <Route path="/vendor/employees">
        <VendorLayout>
          <VendorEmployees />
        </VendorLayout>
      </Route>
      <Route path="/vendor/attendance">
        <VendorLayout>
          <VendorAttendance />
        </VendorLayout>
      </Route>
      <Route path="/vendor/leaves">
        <VendorLayout>
          <VendorLeaves />
        </VendorLayout>
      </Route>
      <Route path="/vendor/tasks">
        <VendorLayout>
          <VendorTasks />
        </VendorLayout>
      </Route>
      <Route path="/vendor/tasks/create">
        <VendorLayout>
          <VendorTasksCreate />
        </VendorLayout>
      </Route>
      <Route path="/vendor/tasks/edit/:id">
        <VendorLayout>
          <VendorTasksEdit />
        </VendorLayout>
      </Route>
      <Route path="/vendor/customers">
        <VendorLayout>
          <VendorCustomers />
        </VendorLayout>
      </Route>
      <Route path="/vendor/customers/:id">
        <VendorLayout>
          <VendorCustomerDetail />
        </VendorLayout>
      </Route>
      <Route path="/vendor/suppliers">
        <VendorLayout>
          <VendorSuppliers />
        </VendorLayout>
      </Route>
      <Route path="/vendor/suppliers/:id">
        <VendorLayout>
          <VendorSupplierDetail />
        </VendorLayout>
      </Route>
      <Route path="/vendor/expenses">
        <VendorLayout>
          <VendorExpenses />
        </VendorLayout>
      </Route>
      <Route path="/vendor/leads">
        <VendorLayout>
          <VendorLeads />
        </VendorLayout>
      </Route>
      <Route path="/vendor/quotations">
        <VendorLayout>
          <VendorQuotations />
        </VendorLayout>
      </Route>
      <Route path="/vendor/tasks">
        <VendorLayout>
          <div className="p-6">
            <h1 className="text-2xl font-bold">Tasks</h1>
            <p className="text-muted-foreground">Task management coming soon</p>
          </div>
        </VendorLayout>
      </Route>
      <Route path="/vendor/coupons">
        <VendorLayout>
          <VendorCoupons />
        </VendorLayout>
      </Route>
      <Route path="/vendor/ledger">
        <VendorLayout>
          <VendorLedger />
        </VendorLayout>
      </Route>
      <Route path="/vendors/:vendorId/ledger">
        <VendorLayout>
          <VendorLedger />
        </VendorLayout>
      </Route>
      <Route path="/vendors/:vendorId/ledger/new">
        <VendorLayout>
          <VendorLedgerCustomerSelection />
        </VendorLayout>
      </Route>
      <Route path="/vendors/:vendorId/ledger/customer/:customerId/transaction/new">
        <VendorLayout>
          <VendorLedgerCustomerTransaction />
        </VendorLayout>
      </Route>
      <Route path="/vendors/:vendorId/ledger/customer/:customerId">
        <VendorLayout>
          <VendorLedgerCustomerDashboard />
        </VendorLayout>
      </Route>
      <Route path="/vendor/ledger/transaction/:id">
        <VendorLayout>
          <VendorLedgerTransaction />
        </VendorLayout>
      </Route>
      <Route path="/vendor/customer/:customerId/ledger">
        <VendorLayout>
          <VendorCustomerLedger />
        </VendorLayout>
      </Route>
      <Route path="/vendor/payments">
        <VendorLayout>
          <div className="p-6">
            <h1 className="text-2xl font-bold">Payments & Wallet</h1>
            <p className="text-muted-foreground">Payment management coming soon</p>
          </div>
        </VendorLayout>
      </Route>
      <Route path="/vendor/website">
        <VendorLayout>
          <VendorMiniWebsiteDashboard />
        </VendorLayout>
      </Route>
      <Route path="/vendor/website/create">
        <VendorLayout>
          <VendorMiniWebsite />
        </VendorLayout>
      </Route>
      <Route path="/vendors/:vendorId/greeting">
        <VendorLayout>
          <VendorGreetingBrowse />
        </VendorLayout>
      </Route>
      <Route path="/vendors/:vendorId/greeting/customize/:templateId">
        <VendorLayout>
          <VendorGreetingCustomize />
        </VendorLayout>
      </Route>
      <Route path="/vendor/reports">
        <VendorLayout>
          <div className="p-6">
            <h1 className="text-2xl font-bold">Reports & Analytics</h1>
            <p className="text-muted-foreground">Reports coming soon</p>
          </div>
        </VendorLayout>
      </Route>
      <Route path="/vendor/subscription">
        <VendorLayout>
          <VendorSubscription />
        </VendorLayout>
      </Route>

      <Route path="/vendor/account">
        <VendorLayout>
          <VendorAccount />
        </VendorLayout>
      </Route>
      <Route path="/vendor/account/business-details">
        <VendorLayout>
          <VendorAccountBusinessDetails />
        </VendorLayout>
      </Route>
      <Route path="/vendor/account/payment-settings">
        <VendorLayout>
          <VendorAccountPaymentSettings />
        </VendorLayout>
      </Route>
      <Route path="/vendor/account/security">
        <VendorLayout>
          <div className="p-6">
            <h1 className="text-2xl font-bold">Security Settings</h1>
            <p className="text-muted-foreground">Security settings coming soon</p>
          </div>
        </VendorLayout>
      </Route>
      <Route path="/vendor/account/change-password">
        <VendorLayout>
          <div className="p-6">
            <h1 className="text-2xl font-bold">Change Password</h1>
            <p className="text-muted-foreground">Password change coming soon</p>
          </div>
        </VendorLayout>
      </Route>
      <Route path="/vendor/account/privacy-policy">
        <VendorLayout>
          <div className="p-6">
            <h1 className="text-2xl font-bold">Privacy Policy</h1>
            <p className="text-muted-foreground">Privacy policy coming soon</p>
          </div>
        </VendorLayout>
      </Route>
      <Route path="/vendor/account/faqs">
        <VendorLayout>
          <div className="p-6">
            <h1 className="text-2xl font-bold">FAQs</h1>
            <p className="text-muted-foreground">FAQs coming soon</p>
          </div>
        </VendorLayout>
      </Route>
      <Route path="/vendor/account/help-support">
        <VendorLayout>
          <div className="p-6">
            <h1 className="text-2xl font-bold">Help & Support</h1>
            <p className="text-muted-foreground">Help & support coming soon</p>
          </div>
        </VendorLayout>
      </Route>

      {/* Admin Routes - AdminLayout handles authentication */}
      <Route path="/admin/dashboard">
        <AdminLayout>
          <AdminDashboard />
        </AdminLayout>
      </Route>
      <Route path="/admin/vendors">
        <AdminLayout>
          <AdminVendors />
        </AdminLayout>
      </Route>
      <Route path="/admin/leads">
        <AdminLayout>
          <AdminLeads />
        </AdminLayout>
      </Route>
      <Route path="/admin/customers">
        <AdminLayout>
          <AdminCustomers />
        </AdminLayout>
      </Route>
      <Route path="/admin/catalogue">
        <AdminLayout>
          <AdminMasterCatalogue />
        </AdminLayout>
      </Route>
      <Route path="/admin/products">
        <AdminLayout>
          <AdminProducts />
        </AdminLayout>
      </Route>
      <Route path="/admin/orders">
        <AdminLayout>
          <AdminOrders />
        </AdminLayout>
      </Route>
      <Route path="/admin/master-data">
        <AdminLayout>
          <AdminMasterData />
        </AdminLayout>
      </Route>
      <Route path="/admin/products">
        <AdminLayout>
          <AdminMasterProducts />
        </AdminLayout>
      </Route>
      <Route path="/admin/greeting-templates">
        <AdminLayout>
          <AdminGreetingTemplates />
        </AdminLayout>
      </Route>
      <Route path="/admin/appointments">
        <AdminLayout>
          <div className="p-6">
            <h1 className="text-2xl font-bold">All Appointments</h1>
            <p className="text-muted-foreground">Appointment overview coming soon</p>
          </div>
        </AdminLayout>
      </Route>
      <Route path="/admin/coupons">
        <AdminLayout>
          <div className="p-6">
            <h1 className="text-2xl font-bold">Coupons & Campaigns</h1>
            <p className="text-muted-foreground">Coupon management coming soon</p>
          </div>
        </AdminLayout>
      </Route>
      <Route path="/admin/tasks">
        <AdminLayout>
          <div className="p-6">
            <h1 className="text-2xl font-bold">Tasks & Employees</h1>
            <p className="text-muted-foreground">Task oversight coming soon</p>
          </div>
        </AdminLayout>
      </Route>
      <Route path="/admin/payments">
        <AdminLayout>
          <div className="p-6">
            <h1 className="text-2xl font-bold">Payments & Payouts</h1>
            <p className="text-muted-foreground">Payment management coming soon</p>
          </div>
        </AdminLayout>
      </Route>
      <Route path="/admin/analytics">
        <AdminLayout>
          <div className="p-6">
            <h1 className="text-2xl font-bold">Platform Analytics</h1>
            <p className="text-muted-foreground">Detailed analytics coming soon</p>
          </div>
        </AdminLayout>
      </Route>
      <Route path="/admin/security">
        <AdminLayout>
          <div className="p-6">
            <h1 className="text-2xl font-bold">Security & Audit Logs</h1>
            <p className="text-muted-foreground">Security management coming soon</p>
          </div>
        </AdminLayout>
      </Route>
      <Route path="/admin/settings">
        <AdminLayout>
          <AdminSettings />
        </AdminLayout>
      </Route>
      <Route path="/admin/additional-services">
        <AdminLayout>
          <AdminAdditionalServices />
        </AdminLayout>
      </Route>

      {/* Vendor Routes */}
      <Route path="/vendor/additional-services">
        <VendorLayout>
          <VendorAdditionalServices />
        </VendorLayout>
      </Route>

      {/* 404 Fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  // 🔍 DEBUGGING: Monitor all localStorage changes
  // This will show you EXACTLY what's removing vendorId/userId/userRole
  // Check the console for stack traces
  useEffect(() => {
    monitorLocalStorage();
    console.log('👁️ [App] localStorage monitoring enabled - check console for removal traces');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
