import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
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

// Action types that require Pro subscription
export type ProRestrictedAction = 
  | 'save' 
  | 'create' 
  | 'update' 
  | 'delete'
  | 'publish' 
  | 'download' 
  | 'export' 
  | 'submit'
  | 'send'
  | 'generate'
  | 'activate'
  | 'deactivate';

// Result type for action attempts
export interface ProActionResult {
  allowed: boolean;
  message: string;
  showUpgradePrompt: boolean;
}

interface SubscriptionContextType {
  subscription: VendorSubscription | null;
  isLoading: boolean;
  isPro: boolean;
  isFree: boolean;
  canAccess: (module: string) => boolean;
  canPerformAction: (action?: ProRestrictedAction) => ProActionResult;
  getRestrictedMessage: (module: string) => string;
  getActionRestrictedMessage: (action?: ProRestrictedAction) => string;
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
  
  // STRICT PRO CHECK: User is Pro ONLY if:
  // 1. Subscription status is "active" AND
  // 2. Payment status is "completed" (verified by Razorpay)
  // NO FALLBACKS - payment must be verified
  const computedIsPro = !!(
    subscription?.status === "active" && 
    subscription?.paymentStatus === "completed"
  );
  
  // Log subscription status for debugging
  console.log('[Subscription] Pro check:', {
    status: subscription?.status,
    paymentStatus: subscription?.paymentStatus,
    planName: plan?.name,
    isPro: computedIsPro
  });
  
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

  // Get action-specific restricted message
  const getActionRestrictedMessage = useCallback((action?: ProRestrictedAction): string => {
    const actionLabels: Record<ProRestrictedAction, string> = {
      save: "save",
      create: "create",
      update: "update",
      delete: "delete",
      publish: "publish",
      download: "download",
      export: "export",
      submit: "submit",
      send: "send",
      generate: "generate",
      activate: "activate",
      deactivate: "deactivate"
    };

    if (action && actionLabels[action]) {
      return `Upgrade to Pro to ${actionLabels[action]} this feature.`;
    }
    return "Upgrade to Pro to save, publish, or download this feature.";
  }, []);

  // Check if vendor can perform write/action operations
  // Returns false for non-Pro users - they can VIEW but not SAVE/CREATE/UPDATE/PUBLISH/DOWNLOAD/EXPORT/SUBMIT
  const canPerformAction = useCallback((action?: ProRestrictedAction): ProActionResult => {
    // Pro users can perform all actions
    if (isPro) {
      return {
        allowed: true,
        message: "",
        showUpgradePrompt: false
      };
    }

    // Non-Pro users cannot perform any write actions
    // They can VIEW all features but cannot save, create, update, publish, download, export, submit
    return {
      allowed: false,
      message: getActionRestrictedMessage(action),
      showUpgradePrompt: true
    };
  }, [isPro, getActionRestrictedMessage]);

  return (
    <SubscriptionContext.Provider value={{
      subscription,
      isLoading,
      isPro,
      isFree,
      canAccess,
      canPerformAction,
      getRestrictedMessage,
      getActionRestrictedMessage,
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
    // Non-Pro by default - all write actions blocked
    return {
      subscription: null,
      isLoading: false,
      isPro: false,
      isFree: true,
      canAccess: (module: string) => FREE_MODULES.some(m => module.toLowerCase().includes(m.replace("-", ""))),
      canPerformAction: (action?: ProRestrictedAction): ProActionResult => ({
        allowed: false,
        message: action ? `Upgrade to Pro to ${action} this feature.` : "Upgrade to Pro to save, publish, or download this feature.",
        showUpgradePrompt: true
      }),
      getRestrictedMessage: (module: string) => `Upgrade to Pro to access ${module}`,
      getActionRestrictedMessage: (action?: ProRestrictedAction) => 
        action ? `Upgrade to Pro to ${action} this feature.` : "Upgrade to Pro to save, publish, or download this feature.",
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

// Hook for performing Pro-restricted actions with automatic upgrade prompt
// Usage: const { executeAction, ActionGuard } = useProAction();
export function useProAction() {
  const { isPro, isFree, canPerformAction, getActionRestrictedMessage, subscription } = useSubscription();
  
  // Execute an action only if Pro, otherwise return the restriction info
  const executeAction = useCallback(<T,>(
    action: ProRestrictedAction,
    callback: () => T | Promise<T>,
    onBlocked?: (message: string) => void
  ): { executed: boolean; result?: T; message?: string } | Promise<{ executed: boolean; result?: T; message?: string }> => {
    const check = canPerformAction(action);
    
    if (!check.allowed) {
      // Non-Pro user trying to perform restricted action
      console.log(`[PRO_GUARD] Action blocked: ${action} - User is not Pro`);
      console.log(`[PRO_GUARD] Subscription status:`, subscription?.status);
      console.log(`[PRO_GUARD] Payment status:`, subscription?.paymentStatus);
      
      if (onBlocked) {
        onBlocked(check.message);
      }
      
      return { executed: false, message: check.message };
    }
    
    // Pro user - execute the action
    const result = callback();
    
    if (result instanceof Promise) {
      return result.then(res => ({ executed: true, result: res }));
    }
    
    return { executed: true, result };
  }, [canPerformAction, subscription]);

  // Check if action would be allowed without executing
  const wouldAllow = useCallback((action?: ProRestrictedAction): boolean => {
    return canPerformAction(action).allowed;
  }, [canPerformAction]);

  return {
    isPro,
    isFree,
    executeAction,
    wouldAllow,
    canPerformAction,
    getActionRestrictedMessage,
    subscription
  };
}

