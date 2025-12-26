import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Calendar,
  Package,
  Users,
  User,
  ListTodo,
  Tag,
  Wallet,
  Settings,
  Building2,
  Globe,
  BarChart3,
  Shield,
  ShoppingCart,
  Boxes,
  TrendingUp,
  FileText,
  BookOpen,
  Sparkles,
  Clock,
  CalendarDays,
  CreditCard,
  Warehouse,
  Receipt,
  FolderTree,
  UserRound,
  Contact,
  Crown,
  LogOut,
  Image,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getVendorId } from "@/hooks/useVendor";

interface AppSidebarProps {
  userRole?: "vendor" | "admin" | "employee";
  vendorId?: string | null;
  modulePermissions?: string[];
}

const vendorMenuItems = [
  { title: "Dashboard", url: "/vendor/dashboard", icon: LayoutDashboard },
  { title: "POS", url: "/vendor/pos", icon: CreditCard },
  { title: "Bookings", url: "/vendor/bookings", icon: Calendar },
  { title: "Appointments", url: "/vendor/appointments", icon: User },
  { title: "Orders", url: "/vendor/orders", icon: ShoppingCart },
  { title: "Customers", url: "/vendor/customers", icon: Users },
  { title: "Suppliers", url: "/vendor/suppliers", icon: Warehouse },
  { title: "Expenses", url: "/vendor/expenses", icon: Receipt },
  { title: "Leads", url: "/vendor/leads", icon: TrendingUp },
  { title: "Quotations", url: "/vendor/quotations", icon: FileText },
  { title: "Coupons", url: "/vendor/coupons", icon: Tag },
  { title: "Hisab Kitab", url: "/vendor/ledger", icon: BookOpen },
  { title: "Services Catalogue", url: "/vendor/services-catalogue", icon: Package },
  { title: "Products Catalogue", url: "/vendor/products-catalogue", icon: Boxes },
  { title: "Stock Turnover", url: "/vendor/stock-turnover", icon: TrendingUp },
  { title: "Employees", url: "/vendor/employees", icon: Users },
  { title: "Attendance", url: "/vendor/attendance", icon: Clock },
  { title: "Leaves", url: "/vendor/leaves", icon: CalendarDays },
  { title: "Tasks", url: "/vendor/tasks", icon: ListTodo },
  { title: "Greeting & Marketing", url: (vendorId: string) => `/vendors/${vendorId}/greeting`, icon: Sparkles },
  { title: "Mini Website", url: "/vendor/website", icon: Globe },
  { title: "Additional Services", url: "/vendor/additional-services", icon: Crown },
  { title: "Account", url: "/vendor/account", icon: UserRound },
];

const adminMenuItems = [
  { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Demo Requests", url: "/admin/demo-requests", icon: Calendar },
  { title: "Vendors", url: "/admin/vendors", icon: Building2 },
  { title: "Leads", url: "/admin/leads", icon: TrendingUp },
  { title: "Customers", url: "/admin/customers", icon: Contact },
  { title: "Orders", url: "/admin/orders", icon: ShoppingCart },
  { title: "Master Data", url: "/admin/master-data", icon: FolderTree },
  { title: "Master Services", url: "/admin/catalogue", icon: Package },
  { title: "Master Products", url: "/admin/products", icon: ShoppingCart },
  { title: "Greeting Templates", url: "/admin/greeting-templates", icon: Sparkles },
  { title: "Additional Services", url: "/admin/additional-services", icon: Crown },
  { title: "Promo Banners", url: "/admin/promo-banners", icon: Image },
  { title: "Settings", url: "/admin/settings", icon: Settings },
];

const VYORA_LOGO = "https://abizuwqnqkbicrhorcig.storage.supabase.co/storage/v1/object/public/vyora-bucket/partners-vyora/p/IMAGE/logo-vyora.png";

export function AppSidebar({ userRole = "vendor", vendorId: propVendorId, modulePermissions = [] }: AppSidebarProps) {
  const [location, setLocation] = useLocation();
  
  // Use prop vendorId if provided, otherwise get from localStorage
  let vendorId = propVendorId;
  if (!vendorId) {
    try {
      vendorId = getVendorId();
    } catch (error) {
      console.warn("No vendor ID available in sidebar");
      vendorId = null;
    }
  }
  
  // Get menu items based on role
  let menuItems = userRole === "admin" ? adminMenuItems : vendorMenuItems;
  
  // If employee, filter menu items based on module permissions
  if (userRole === "employee") {
    // Map module IDs to menu items
    const moduleToMenuMap: Record<string, string> = {
      "dashboard": "Dashboard",
      "vendors": "Vendors",
      "leads": "Leads",
      "customers": "Customers",
      "orders": "Orders",
      "master-data": "Master Data",
      "master-services": "Master Services",
      "master-products": "Master Products",
      "greeting-templates": "Greeting Templates",
      "settings": "Settings",
      "additional-services": "Additional Services",
    };
    
    // Filter admin menu items based on permissions
    menuItems = adminMenuItems.filter(item => {
      // Find module ID for this menu item
      const moduleId = Object.keys(moduleToMenuMap).find(
        key => moduleToMenuMap[key] === item.title
      );
      // If module ID found, check if user has permission
      // If not found, allow access (for new modules)
      return !moduleId || modulePermissions.includes(moduleId);
    });
  }

  // Signout handler
  const handleSignOut = () => {
    console.log('🚪 [Auth] Signing out...');
    
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

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-2">
          <img src={VYORA_LOGO} alt="Vyora" className="w-10 h-10 rounded-lg object-contain" />
          <div>
            <h2 className="text-lg font-bold text-sidebar-foreground" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Vyora
            </h2>
            <p className="text-xs text-sidebar-foreground/70">
              {userRole === "admin" ? "Admin Panel" : userRole === "employee" ? "Employee Portal" : "Vendor Portal"}
            </p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const itemUrl = typeof item.url === 'function' ? item.url(vendorId) : item.url;
                const isActive = location === itemUrl;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={itemUrl} data-testid={`nav-${item.title.toLowerCase().replace(/\s/g, '-')}`}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-4">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
        <p className="text-xs text-sidebar-foreground/60 text-center mt-2">
          © 2025 Vyora
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
