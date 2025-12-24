import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Home, Sparkles, Package, Globe, Bell } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Vendor, Notification } from "@shared/schema";
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
    enabled: !!vendorId,
  });

  // Fetch notifications for badge count
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: [`/api/vendors/${vendorId}/notifications`],
    refetchInterval: 30000,
    enabled: !!vendorId,
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

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
  const isNotificationsActive = location === "/vendor/notifications";

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-area-bottom">
      <nav className="flex items-center justify-around h-[64px] px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link key={item.title} href={item.href}>
              <button
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-colors min-w-[60px] min-h-[52px]",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
                data-testid={`mobile-nav-${item.title.toLowerCase()}`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[11px] font-medium">{item.title}</span>
              </button>
            </Link>
          );
        })}
        
        {/* Profile Section - Shows Business Logo */}
        <Link href="/vendor/account">
          <button
            className={cn(
              "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-colors min-w-[60px] min-h-[52px]",
              isAccountActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
            data-testid="mobile-nav-account"
          >
            <Avatar className={cn(
              "h-6 w-6 ring-2 ring-offset-1",
              isAccountActive 
                ? "ring-primary ring-offset-background" 
                : "ring-muted-foreground/30 ring-offset-background"
            )}>
              {(vendor?.logo || localStorage.getItem(`vendor_logo_${vendorId}`)) ? (
                <AvatarImage 
                  src={localStorage.getItem(`vendor_logo_${vendorId}`) || vendor?.logo || ""} 
                  alt={vendor?.businessName || "Business"} 
                  className="object-cover"
                />
              ) : null}
              <AvatarFallback className={cn(
                "text-[9px] font-semibold",
                isAccountActive
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              )}>
                {vendor?.businessName ? getInitials(vendor.businessName) : "VH"}
              </AvatarFallback>
            </Avatar>
            <span className="text-[11px] font-medium">Profile</span>
          </button>
        </Link>
      </nav>
    </div>
  );
}
