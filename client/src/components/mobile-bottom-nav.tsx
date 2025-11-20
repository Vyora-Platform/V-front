import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Home, Sparkles, Package, Globe } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Vendor } from "@shared/schema";
import { getVendorId } from "@/hooks/useVendor";

export function MobileBottomNav({ vendorId: propVendorId }: { vendorId?: string | null }) {
  // Use prop vendorId if provided, otherwise get from localStorage
  let vendorId = propVendorId;
  if (!vendorId) {
    try {
      vendorId = getVendorId();
    } catch (error) {
      console.warn("No vendor ID available in mobile nav");
      vendorId = null;
    }
  }
  const [location] = useLocation();

  // Fetch vendor data for profile display
  const { data: vendor } = useQuery<Vendor>({
    queryKey: ["/api/vendors", vendorId],
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const navItems = [
    {
      title: "Home",
      icon: Home,
      href: "/vendor/dashboard",
    },
    {
      title: "Marketing",
      icon: Sparkles,
      href: `/vendors/${vendorId}/greeting`,
    },
    {
      title: "Catalogue",
      icon: Package,
      href: "/vendor/catalogue",
    },
    {
      title: "Website",
      icon: Globe,
      href: "/vendor/website",
    },
  ];

  const isActive = (href: string) => {
    if (href === "/vendor/dashboard") {
      return location === href;
    }
    return location.startsWith(href);
  };

  const isAccountActive = location.startsWith("/vendor/account");

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
      <nav className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link key={item.title} href={item.href}>
              <button
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[60px]",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
                data-testid={`mobile-nav-${item.title.toLowerCase()}`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.title}</span>
              </button>
            </Link>
          );
        })}
        
        {/* Profile Section */}
        <Link href="/vendor/account">
          <button
            className={cn(
              "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[60px]",
              isAccountActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
            data-testid="mobile-nav-account"
          >
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-[10px] bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                {vendor?.businessName ? getInitials(vendor.businessName) : "VH"}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs font-medium">Account</span>
          </button>
        </Link>
      </nav>
    </div>
  );
}
