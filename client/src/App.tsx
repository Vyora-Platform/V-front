import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import ThemeToggle from "@/components/ThemeToggle";
import type { Vendor } from "@shared/schema";
import { AuthProvider } from "@/contexts/AuthContext";
import { SubscriptionProvider } from "@/hooks/useSubscription";
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
import VendorBookingDetail from "@/pages/vendor-booking-detail";
import VendorAppointments from "@/pages/vendor-appointments";
import VendorAppointmentDetail from "@/pages/vendor-appointment-detail";
import VendorOrders from "@/pages/vendor-orders";
import VendorOrderDetail from "@/pages/vendor-order-detail";
import VendorEmployees from "@/pages/vendor-employees";
import VendorEmployeeDetail from "@/pages/vendor-employee-detail";
import VendorAttendance from "@/pages/vendor-attendance";
import VendorAttendanceDetail from "@/pages/vendor-attendance-detail";
import VendorLeaves from "@/pages/vendor-leaves";
import VendorLeaveDetail from "@/pages/vendor-leave-detail";
import VendorTasks from "@/pages/vendor-tasks";
import VendorTasksCreate from "@/pages/vendor-tasks-create";
import VendorTasksEdit from "@/pages/vendor-tasks-edit";
import VendorTaskDetail from "@/pages/vendor-task-detail";
import VendorCustomers from "@/pages/vendor-customers";
import VendorCustomerDetail from "@/pages/vendor-customer-detail";
import VendorSuppliers from "@/pages/vendor-suppliers";
import VendorSupplierDetail from "@/pages/vendor-supplier-detail";
import VendorExpenses from "@/pages/vendor-expenses";
import VendorExpenseDetail from "@/pages/vendor-expense-detail";
import VendorLeads from "@/pages/vendor-leads";
import VendorQuotations from "@/pages/vendor-quotations";
import VendorQuotationDetail from "@/pages/vendor-quotation-detail";
import VendorMiniWebsite from "@/pages/vendor-mini-website";
import VendorMiniWebsiteDashboard from "@/pages/vendor-mini-website-dashboard";
import MiniWebsitePublic from "@/pages/mini-website-public";
import MiniWebsiteProducts from "@/pages/mini-website-products";
import MiniWebsiteServices from "@/pages/mini-website-services";
import MiniWebsiteProductDetail from "@/pages/mini-website-product-detail";
import MiniWebsiteServiceDetail from "@/pages/mini-website-service-detail";
import CustomerLogin from "@/pages/customer-login";
import CustomerSignup from "@/pages/customer-signup";
import CustomerForgotPassword from "@/pages/customer-forgot-password";
import MiniWebsiteMyOrders from "@/pages/mini-website-my-orders";
import MiniWebsiteCheckout from "@/pages/mini-website-checkout";
import AdminMasterCatalogue from "@/pages/admin-master-catalogue";
import AdminMasterData from "@/pages/admin-master-data";
import AdminMasterProducts from "@/pages/admin-master-products";
import VendorProductsCatalogue from "@/pages/vendor-products-catalogue";
import VendorProductsBrowse from "@/pages/vendor-products-browse";
import VendorProductForm from "@/pages/vendor-product-form";
import VendorProductDetail from "@/pages/vendor-product-detail";
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
import VendorLedgerSupplierDashboard from "@/pages/vendor-ledger-supplier-dashboard";
import VendorLedgerSupplierTransaction from "@/pages/vendor-ledger-supplier-transaction";
import AdminGreetingTemplates from "@/pages/admin-greeting-templates";
import VendorGreetingBrowse from "@/pages/vendor-greeting-browse";
import VendorGreetingCustomize from "@/pages/vendor-greeting-customize";
import VendorPOS from "@/pages/vendor-pos";
import AdminLeads from "@/pages/admin-leads";
import AdminDemoRequests from "@/pages/admin-demo-requests";
import AdminCustomers from "@/pages/admin-customers";
import AdminProducts from "@/pages/admin-products";
import AdminOrders from "@/pages/admin-orders";
import AdminVendors from "@/pages/admin-vendors";
import AdminSettings from "@/pages/admin-settings";
import AdminAdditionalServices from "@/pages/admin-additional-services";
import AdminPromoBanners from "@/pages/admin-promo-banners";
import VendorAdditionalServices from "@/pages/vendor-additional-services";
import VendorAdditionalServiceDetail from "@/pages/vendor-additional-service-detail";
import VendorSubscription from "@/pages/vendor-subscription";
import VendorAccount from "@/pages/vendor-account";
import VendorAccountBusinessDetails from "@/pages/vendor-account-business-details";
import VendorAccountPaymentSettings from "@/pages/vendor-account-payment-settings";
import VendorNotifications from "@/pages/vendor-notifications";
import VendorAnalytics from "@/pages/vendor-analytics";
import VendorReferral from "@/pages/vendor-referral";
import VendorBilling from "@/pages/vendor-billing";
import NotificationBell from "@/components/NotificationBell";
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

// Protected Route for Onboarding - Redirects completed vendors to dashboard
function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);
  
  const vendorId = getVendorId();
  
  // Fetch vendor data to check onboarding status
  const { data: vendor, isLoading: isLoadingVendor } = useQuery<Vendor>({
    queryKey: ["/api/vendors", vendorId],
    enabled: !!vendorId,
  });
  
  useEffect(() => {
    const checkAuth = async () => {
      console.log('🔍 [OnboardingRoute] Validating JWT token...');
      const authenticated = await isAuthenticated();
      
      if (!authenticated) {
        console.warn('🔒 [OnboardingRoute] Invalid or expired token, redirecting to login...');
        setLocation('/login');
        setIsChecking(false);
        return;
      }
      
      setIsValid(true);
      setIsChecking(false);
    };
    
    checkAuth();
  }, [setLocation]);
  
  // Check if vendor onboarding is complete
  useEffect(() => {
    if (!isChecking && isValid && !isLoadingVendor) {
      // If vendor exists and onboarding is complete, redirect to dashboard
      if (vendor && vendor.onboardingComplete) {
        console.log('✅ [OnboardingRoute] Vendor onboarding complete, redirecting to dashboard...');
        setLocation('/vendor/dashboard');
        return;
      }
      
      // Otherwise show onboarding
      setShouldShowOnboarding(true);
    }
  }, [isChecking, isValid, isLoadingVendor, vendor, setLocation]);
  
  // Show loading state
  if (isChecking || (vendorId && isLoadingVendor)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!isValid || !shouldShowOnboarding) {
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
  const { data: vendor, isLoading: isLoadingVendor } = useQuery<Vendor>({
    queryKey: ["/api/vendors", vendorId],
    enabled: !!vendorId && isValid, // Only fetch if vendorId exists AND auth is valid
  });
  
  // Show loading state while checking auth
  if (isChecking || (vendorId && isLoadingVendor && isValid)) {
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
  
  // IMPORTANT: Check if vendor onboarding is complete
  // If vendor exists but onboarding is not complete, redirect to onboarding
  if (vendor && !vendor.onboardingComplete) {
    console.warn('🔒 [VendorLayout] Onboarding not complete, redirecting to onboarding...');
    setLocation('/onboarding');
    return null;
  }
  
  // If no vendorId found for a vendor user, redirect to onboarding
  const userRole = localStorage.getItem('userRole');
  if (userRole === 'vendor' && !vendorId) {
    console.warn('🔒 [VendorLayout] No vendor ID found, redirecting to onboarding...');
    setLocation('/onboarding');
    return null;
  }

  // Get first name from owner name or business name
  const getFirstName = (name: string) => {
    if (!name) return "User";
    const firstName = name.split(' ')[0];
    return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
  };
  
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex min-h-screen w-full">
        {/* Hide sidebar on mobile */}
        <div className="hidden md:block">
          <AppSidebar userRole="vendor" vendorId={vendorId} />
        </div>
        <div className="flex flex-col flex-1 min-w-0 min-h-screen">
          <header className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 bg-gradient-to-r from-blue-600 to-blue-700 sticky top-0 z-[100] shadow-md shrink-0">
            <div className="flex items-center gap-3">
              {/* Hide sidebar toggle on mobile */}
              <div className="hidden md:block">
                <SidebarTrigger data-testid="button-sidebar-toggle" className="text-white hover:bg-white/20 [&>svg]:w-6 [&>svg]:h-6" />
              </div>
              
              {/* Vyora Logo + Welcome Message */}
              <div className="flex items-center gap-3 md:pl-3 md:border-l border-white/30">
                {/* Vyora Logo */}
                <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl bg-white flex items-center justify-center shadow-lg shrink-0 overflow-hidden">
                  <img src="https://abizuwqnqkbicrhorcig.storage.supabase.co/storage/v1/object/public/vyora-bucket/partners-vyora/p/IMAGE/logo-vyora.png" alt="Vyora" className="w-7 h-7 md:w-9 md:h-9 object-contain" />
                </div>
                {/* Welcome Message */}
                <div className="flex flex-col">
                  <span className="text-[15px] md:text-lg font-semibold text-white leading-tight" data-testid="text-welcome">
                    Welcome, {vendor?.ownerName ? getFirstName(vendor.ownerName) : (vendor?.businessName ? getFirstName(vendor.businessName) : "User")} ji!
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center">
              {/* Notification Bell - visible on both mobile and desktop */}
              <NotificationBell variant="mobile" className="md:hidden text-white" />
              <NotificationBell className="hidden md:flex text-white" />
            </div>
          </header>
          <main className="flex-1 overflow-y-auto overscroll-contain pb-20 md:pb-6 relative z-0">
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
      <div className="flex min-h-screen w-full">
        {/* Hide sidebar on mobile */}
        <div className="hidden md:block">
          <AppSidebar userRole={userRole === "employee" ? "employee" : "admin"} modulePermissions={modulePermissions} />
        </div>
        <div className="flex flex-col flex-1 min-w-0 min-h-screen">
          <header className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 border-b border-border bg-background sticky top-0 z-[100] shrink-0">
            {/* Hide sidebar toggle on mobile */}
            <div className="hidden md:block">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
            </div>
            <div className="md:hidden">
              <h1 className="text-lg font-semibold">{userRole === "employee" ? "Employee Portal" : "Admin Portal"}</h1>
            </div>
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-y-auto overscroll-contain pb-6">
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

      {/* Protected Routes - Onboarding */}
      <Route path="/onboarding">
        <OnboardingRoute>
          <VendorOnboarding />
        </OnboardingRoute>
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
      <Route path="/vendor/bookings/:id">
        <VendorLayout>
          <VendorBookingDetail />
        </VendorLayout>
      </Route>
      <Route path="/vendor/appointments">
        <VendorLayout>
          <VendorAppointments />
        </VendorLayout>
      </Route>
      <Route path="/vendor/appointments/:id">
        <VendorLayout>
          <VendorAppointmentDetail />
        </VendorLayout>
      </Route>
      <Route path="/vendor/orders">
        <VendorLayout>
          <VendorOrders />
        </VendorLayout>
      </Route>
      <Route path="/vendor/orders/:id">
        <VendorLayout>
          <VendorOrderDetail />
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
      <Route path="/vendor/products/new">
        <VendorLayout>
          <VendorProductForm />
        </VendorLayout>
      </Route>
      <Route path="/vendor/products/edit/:id">
        <VendorLayout>
          <VendorProductForm />
        </VendorLayout>
      </Route>
      <Route path="/vendor/products/:id">
        <VendorLayout>
          <VendorProductDetail />
        </VendorLayout>
      </Route>
      <Route path="/vendor/stock-turnover">
        <VendorLayout>
          <VendorStockTurnover />
        </VendorLayout>
      </Route>
      <Route path="/vendor/employees/:id">
        <VendorLayout>
          <VendorEmployeeDetail />
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
      <Route path="/vendor/attendance/:type/:id">
        <VendorLayout>
          <VendorAttendanceDetail />
        </VendorLayout>
      </Route>
      <Route path="/vendor/leaves">
        <VendorLayout>
          <VendorLeaves />
        </VendorLayout>
      </Route>
      <Route path="/vendor/leaves/:id">
        <VendorLayout>
          <VendorLeaveDetail />
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
      <Route path="/vendor/tasks/:id">
        <VendorLayout>
          <VendorTaskDetail />
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
      <Route path="/vendor/expenses/:id">
        <VendorLayout>
          <VendorExpenseDetail />
        </VendorLayout>
      </Route>
      <Route path="/vendor/leads">
        <VendorLayout>
          <VendorLeads />
        </VendorLayout>
      </Route>
      <Route path="/vendor/notifications">
        <VendorLayout>
          <VendorNotifications />
        </VendorLayout>
      </Route>
      <Route path="/vendor/analytics">
        <VendorLayout>
          <VendorAnalytics />
        </VendorLayout>
      </Route>
      <Route path="/vendor/referral">
        <VendorLayout>
          <VendorReferral />
        </VendorLayout>
      </Route>
      <Route path="/vendor/billing">
        <VendorLayout>
          <VendorBilling />
        </VendorLayout>
      </Route>
      <Route path="/vendor/quotations/:id">
        <VendorLayout>
          <VendorQuotationDetail />
        </VendorLayout>
      </Route>
      <Route path="/vendor/quotations">
        <VendorLayout>
          <VendorQuotations />
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
      <Route path="/vendors/:vendorId/ledger/supplier/:supplierId/transaction/new">
        <VendorLayout>
          <VendorLedgerSupplierTransaction />
        </VendorLayout>
      </Route>
      <Route path="/vendors/:vendorId/ledger/supplier/:supplierId">
        <VendorLayout>
          <VendorLedgerSupplierDashboard />
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
      <Route path="/admin/demo-requests">
        <AdminLayout>
          <AdminDemoRequests />
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
      <Route path="/admin/promo-banners">
        <AdminLayout>
          <AdminPromoBanners />
        </AdminLayout>
      </Route>

      {/* Vendor Routes */}
      <Route path="/vendor/additional-services">
        <VendorLayout>
          <VendorAdditionalServices />
        </VendorLayout>
      </Route>
      <Route path="/vendor/additional-services/:id">
        <VendorLayout>
          <VendorAdditionalServiceDetail />
        </VendorLayout>
      </Route>

      {/* Public Mini-Website Routes - No Protection */}
      {/* These are placed at the end to act as catch-all for vendor subdomains */}
      {/* Direct subdomain URLs (e.g., /gymbuddy) */}
      <Route path="/:subdomain/products/:productId" component={MiniWebsiteProductDetail} />
      <Route path="/:subdomain/products" component={MiniWebsiteProducts} />
      <Route path="/:subdomain/services/:serviceId" component={MiniWebsiteServiceDetail} />
      <Route path="/:subdomain/services" component={MiniWebsiteServices} />
      <Route path="/:subdomain/login" component={CustomerLogin} />
      <Route path="/:subdomain/signup" component={CustomerSignup} />
      <Route path="/:subdomain/forgot-password" component={CustomerForgotPassword} />
      <Route path="/:subdomain/my-orders" component={MiniWebsiteMyOrders} />
      <Route path="/:subdomain/checkout" component={MiniWebsiteCheckout} />
      <Route path="/:subdomain" component={MiniWebsitePublic} />

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
        <SubscriptionProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
