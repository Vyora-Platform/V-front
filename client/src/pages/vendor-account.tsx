import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  ArrowLeft,
  Building2, 
  CreditCard, 
  Crown,
  Shield,
  Lock,
  FileText,
  HelpCircle,
  Headphones,
  LogOut,
  ChevronRight,
  Loader2
} from "lucide-react";
import type { Vendor } from "@shared/schema";

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";

export default function VendorAccount() {
  const { vendorId } = useAuth();
  const [, setLocation] = useLocation();
  
  const { data: vendor, isLoading, error } = useQuery<Vendor>({
    queryKey: ["/api/vendors", vendorId],
    enabled: !!vendorId,
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const menuSections = [
    {
      title: "ACCOUNT SETTINGS",
      items: [
        {
          icon: Building2,
          label: "Business Details",
          href: "/vendor/account/business-details",
          iconBg: "bg-blue-100 dark:bg-blue-900",
          iconColor: "text-blue-600 dark:text-blue-400",
        },
        {
          icon: CreditCard,
          label: "Payment Settings",
          href: "/vendor/account/payment-settings",
          iconBg: "bg-blue-100 dark:bg-blue-900",
          iconColor: "text-blue-600 dark:text-blue-400",
        },
        {
          icon: Crown,
          label: "Subscription",
          href: "/vendor/subscription",
          iconBg: "bg-blue-100 dark:bg-blue-900",
          iconColor: "text-blue-600 dark:text-blue-400",
        },
      ],
    },
    {
      title: "SECURITY",
      items: [
        {
          icon: Shield,
          label: "Security Settings",
          href: "/vendor/account/security",
          iconBg: "bg-blue-100 dark:bg-blue-900",
          iconColor: "text-blue-600 dark:text-blue-400",
        },
        {
          icon: Lock,
          label: "Change Password",
          href: "/vendor/account/change-password",
          iconBg: "bg-blue-100 dark:bg-blue-900",
          iconColor: "text-blue-600 dark:text-blue-400",
        },
      ],
    },
    {
      title: "SUPPORT & INFORMATION",
      items: [
        {
          icon: FileText,
          label: "Privacy Policy",
          href: "/vendor/account/privacy-policy",
          iconBg: "bg-blue-100 dark:bg-blue-900",
          iconColor: "text-blue-600 dark:text-blue-400",
        },
        {
          icon: HelpCircle,
          label: "FAQs",
          href: "/vendor/account/faqs",
          iconBg: "bg-blue-100 dark:bg-blue-900",
          iconColor: "text-blue-600 dark:text-blue-400",
        },
        {
          icon: Headphones,
          label: "Help & Support",
          href: "/vendor/account/help-support",
          iconBg: "bg-blue-100 dark:bg-blue-900",
          iconColor: "text-blue-600 dark:text-blue-400",
        },
      ],
    },
  ];

  const handleLogout = () => {
    console.log('🚪 [Auth] Signing out from account page...');
    
    // Clear all auth data from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    localStorage.removeItem('vendorId');
    localStorage.removeItem('userRole');
    
    console.log('✅ [Auth] Signed out successfully');
    
    // Redirect to login page
    setLocation('/login');
  };

  if (!vendorId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 border-b sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4 flex items-center gap-4">
            <Link href="/vendor/dashboard">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-semibold">Account</h1>
          </div>
        </div>
        <div className="container mx-auto px-4 py-6 max-w-2xl flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading account information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 border-b sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4 flex items-center gap-4">
            <Link href="/vendor/dashboard">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-semibold">Account</h1>
          </div>
        </div>
        <div className="container mx-auto px-4 py-6 max-w-2xl">
          <Card className="p-6">
            <div className="text-center space-y-4">
              <p className="text-destructive">Failed to load account information</p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/vendor/dashboard">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold">Account</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
        {/* Profile Card */}
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              {vendor?.logo ? (
                <AvatarImage src={vendor.logo} alt={vendor.businessName} />
              ) : null}
              <AvatarFallback className="text-xl bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                {vendor?.businessName ? getInitials(vendor.businessName) : "VH"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-lg font-semibold">{vendor?.businessName || "Business Name"}</h2>
              <p className="text-sm text-muted-foreground">{vendor?.email || "email@example.com"}</p>
              {vendor?.phone && (
                <p className="text-sm text-muted-foreground mt-1">{vendor.phone}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Menu Sections */}
        {menuSections.map((section, idx) => (
          <div key={idx} className="space-y-3">
            <h3 className="text-xs font-medium text-muted-foreground px-1">{section.title}</h3>
            <Card className="divide-y">
              {section.items.map((item, itemIdx) => (
                <Link key={itemIdx} href={item.href}>
                  <div className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer" data-testid={`link-${item.label.toLowerCase().replace(/\s+/g, '-')}`}>
                    <div className={`p-2 rounded-lg ${item.iconBg}`}>
                      <item.icon className={`h-5 w-5 ${item.iconColor}`} />
                    </div>
                    <span className="flex-1 font-medium">{item.label}</span>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </Card>
          </div>
        ))}

        {/* Logout Button */}
        <Button
          variant="outline"
          className="w-full border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950"
          onClick={handleLogout}
          data-testid="button-logout"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Log Out
        </Button>
      </div>
    </div>
  );
}
