import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";

export interface SubscriptionPlan {
  id: string;
  name: string;
  displayName: string;
  price: string;
  features: string[];
}

export interface VendorSubscription {
  id: string;
  vendorId: string;
  planId: string;
  status: string;
  startDate: string;
  currentPeriodEnd: string;
  paymentStatus: string;
  plan?: SubscriptionPlan;
}

interface SubscriptionContextType {
  subscription: VendorSubscription | null;
  isLoading: boolean;
  isPro: boolean;
  isFree: boolean;
  canAccess: (module: string) => boolean;
  getRestrictedMessage: (module: string) => string;
  refetch: () => void;
}

// Modules that free users can access
const FREE_MODULES = [
  "customers",
  "leads", 
  "suppliers",
  "additional-services",
  "referral",
  "account",
  "dashboard",
  "notifications"
];

// Pro-only modules
const PRO_MODULES = [
  "orders",
  "pos",
  "products",
  "catalogue",
  "services",
  "bookings",
  "appointments",
  "analytics",
  "marketing",
  "greeting",
  "invoicing",
  "bills",
  "coupons",
  "website",
  "inventory",
  "employees",
  "hr"
];

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

interface SubscriptionResponse {
  subscription: VendorSubscription;
  plan: SubscriptionPlan;
}

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { vendorId, isLoading: authLoading } = useAuth();
  
  // Force state updates when subscription changes
  const [localIsPro, setLocalIsPro] = useState(false);

  // Use React Query's default fetch which already handles API URL correctly
  const { data, isLoading, refetch, error } = useQuery<SubscriptionResponse | null>({
    queryKey: [`/api/vendors/${vendorId}/subscription`], // Use standard query key format
    enabled: !!vendorId && !authLoading,
    staleTime: 0, // Always consider stale
    gcTime: 0, // Don't cache
    refetchOnWindowFocus: true,
    refetchOnMount: 'always', // Always refetch
    retry: 2, // Retry twice on failure
  });
  
  // Log query status
  useEffect(() => {
    console.log('[Subscription] Query state:', { 
      vendorId, 
      isLoading, 
      hasData: !!data,
      error: error?.message 
    });
  }, [vendorId, isLoading, data, error]);

  const subscription = data?.subscription || null;
  const plan = data?.plan || null;
  
  // User is Pro if they have active subscription with completed payment
  // Also check plan name as fallback
  const computedIsPro = !!(
    (subscription?.status === "active" && subscription?.paymentStatus === "completed") ||
    (plan?.name?.toLowerCase() === "pro" && subscription?.status === "active")
  );
  
  // Update local state when computed value changes
  useEffect(() => {
    if (computedIsPro !== localIsPro) {
      setLocalIsPro(computedIsPro);
      console.log('[Subscription] ✅ Status updated - isPro:', computedIsPro);
    }
  }, [computedIsPro]);
  
  const isPro = localIsPro || computedIsPro;
  const isFree = !isPro;
  
  // Debug logging only when data changes
  useEffect(() => {
    if (data) {
      console.log('[Subscription] 📊 Current state:', { 
        vendorId,
        status: subscription?.status, 
        paymentStatus: subscription?.paymentStatus,
        planName: plan?.name,
        isPro, 
        isFree 
      });
    }
  }, [data, vendorId, isPro, isFree]);

  const canAccess = (module: string): boolean => {
    if (isPro) return true;
    
    // Normalize module name
    const normalizedModule = module.toLowerCase().replace(/[^a-z]/g, "");
    
    // Check if it's a free module
    return FREE_MODULES.some(m => normalizedModule.includes(m.replace("-", "")));
  };

  const getRestrictedMessage = (module: string): string => {
    const moduleNames: Record<string, string> = {
      orders: "Order Management",
      pos: "Point of Sale",
      products: "Product Catalogue",
      catalogue: "Service Catalogue",
      services: "Services",
      bookings: "Bookings",
      appointments: "Appointments",
      analytics: "Analytics & Reports",
      marketing: "Marketing & Greetings",
      greeting: "Marketing & Greetings",
      invoicing: "Invoicing",
      bills: "Billing",
      coupons: "Coupons & Offers",
      website: "Website Builder",
      inventory: "Inventory Management",
      employees: "Employee Management",
      hr: "HR Management"
    };

    const name = moduleNames[module.toLowerCase()] || module;
    return `Upgrade to Pro to access ${name}`;
  };

  return (
    <SubscriptionContext.Provider value={{
      subscription,
      isLoading,
      isPro,
      isFree,
      canAccess,
      getRestrictedMessage,
      refetch
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    // Return default values if not in provider (for backwards compatibility)
    return {
      subscription: null,
      isLoading: false,
      isPro: false,
      isFree: true,
      canAccess: (module: string) => FREE_MODULES.some(m => module.toLowerCase().includes(m.replace("-", ""))),
      getRestrictedMessage: (module: string) => `Upgrade to Pro to access ${module}`,
      refetch: () => {}
    };
  }
  return context;
}

// Helper hook to check specific module access
export function useModuleAccess(module: string) {
  const { canAccess, isPro, isFree, getRestrictedMessage } = useSubscription();
  
  return {
    hasAccess: canAccess(module),
    isPro,
    isFree,
    message: getRestrictedMessage(module)
  };
}

