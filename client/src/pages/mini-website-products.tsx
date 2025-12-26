import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { QuotationModal } from "@/components/QuotationModal";
import { 
  ShoppingCart, Search, Filter, X, Grid3X3, List, 
  ArrowLeft, Plus, Minus, Check, Tag, Home, User, LogOut, Heart, Star, Package, BookOpen, Image
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { MiniWebsite, VendorProduct } from "@shared/schema";

// Get short abbreviation for units
const getUnitAbbreviation = (unit: string): string => {
  const abbrevMap: Record<string, string> = {
    'kilogram': 'kg',
    'Kilogram': 'kg',
    'kg': 'kg',
    'gram': 'g',
    'Gram': 'g',
    'g': 'g',
    'piece': 'pc',
    'Piece': 'pc',
    'pieces': 'pcs',
    'Pieces': 'pcs',
    'pc': 'pc',
    'pcs': 'pcs',
    'liter': 'L',
    'Liter': 'L',
    'litre': 'L',
    'Litre': 'L',
    'L': 'L',
    'milliliter': 'ml',
    'Milliliter': 'ml',
    'ml': 'ml',
    'meter': 'm',
    'Meter': 'm',
    'm': 'm',
    'dozen': 'dz',
    'Dozen': 'dz',
    'box': 'box',
    'Box': 'box',
    'pack': 'pack',
    'Pack': 'pack',
    'packet': 'pkt',
    'Packet': 'pkt',
    'bottle': 'btl',
    'Bottle': 'btl',
    'can': 'can',
    'Can': 'can',
    'unit': 'unit',
    'Unit': 'unit',
  };
  return abbrevMap[unit] || unit?.toLowerCase() || 'unit';
};

interface CartItem {
  type: 'product';
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  vendorProductId: string;
}

export default function MiniWebsiteProducts() {
  const [, params] = useRoute("/:subdomain/products");
  const [, setLocation] = useLocation();
  const subdomain = params?.subdomain || "";
  const { toast } = useToast();

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [quotationOpen, setQuotationOpen] = useState(false);
  const [quotationItems, setQuotationItems] = useState<any[]>([]);

  // Customer authentication
  const [customerToken, setCustomerToken] = useState<string | null>(null);
  const [customerData, setCustomerData] = useState<any>(null);
  
  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("customerToken");
    const data = localStorage.getItem("customerData");
    if (token && data && data !== "undefined" && data !== "null") {
      try {
        const parsedData = JSON.parse(data);
        setCustomerToken(token);
        setCustomerData(parsedData);
      } catch (error) {
        console.error("Failed to parse customer data:", error);
      }
    }
  }, []);

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem(`cart_${subdomain}`);
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (error) {
        console.error("Failed to parse cart:", error);
      }
    }
  }, [subdomain]);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem(`cart_${subdomain}`, JSON.stringify(cart));
  }, [cart, subdomain]);

  // Fetch mini-website data
  const { data, isLoading } = useQuery<MiniWebsite & { products: VendorProduct[] }>({
    queryKey: [`/api/mini-website/${subdomain}`],
    enabled: !!subdomain,
  });

  const primaryColor = data?.branding?.primaryColor || "#4F46E5";
  const products = data?.products || [];
  const coupons = data?.coupons || [];
  const ecommerce = (data?.ecommerce as any) || { enabled: false, mode: 'cart' };

  // Filter coupons for mini-website
  const availableCoupons = coupons.filter((coupon: any) => {
    if (!coupon.isActive || coupon.status !== 'active') return false;
    if (new Date(coupon.expiryDate || coupon.validUntil) <= new Date()) return false;
    const applicableOn = coupon.applicableOn || 'all';
    return applicableOn === 'all' || applicableOn === 'online_only' || applicableOn === 'miniwebsite_only';
  });

  // Get unique subcategories for filtering (subcategory only)
  const subcategories = Array.from(new Set(products.map(p => p.subcategory).filter(Boolean)));

  // Filter and sort products
  const filteredProducts = products
    .filter(p => p.isActive)
    .filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           p.subcategory?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSubcategory = selectedCategory === "all" || p.subcategory === selectedCategory;
      return matchesSearch && matchesSubcategory;
    })
    .sort((a, b) => {
      const priceA = a.price || a.sellingPrice || 0;
      const priceB = b.price || b.sellingPrice || 0;
      switch (sortBy) {
        case "price-low":
          return priceA - priceB;
        case "price-high":
          return priceB - priceA;
        case "name":
        default:
          return a.name.localeCompare(b.name);
      }
    });

  // Cart functions
  const addToCart = (product: VendorProduct) => {
    if (product.stock === 0) {
      toast({
        title: "Out of Stock",
        description: `${product.name} is currently out of stock`,
        variant: "destructive",
      });
      return;
    }

    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        toast({
          title: "Stock Limit Reached",
          description: `Only ${product.stock} units available`,
          variant: "destructive",
        });
        return;
      }
      updateQuantity(product.id, existingItem.quantity + 1);
    } else {
      const newItem: CartItem = {
        type: 'product',
        id: product.id,
        name: product.name,
        price: product.price || product.sellingPrice || 0,
        quantity: 1,
        image: product.images?.[0],
        vendorProductId: product.id,
      };
      setCart([...cart, newItem]);
      toast({
        title: "Added to Cart",
        description: `${product.name} has been added to your cart`,
      });
    }
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const product = products.find(p => p.id === productId);
    if (product && newQuantity > product.stock) {
      toast({
        title: "Stock Limit",
        description: `Only ${product.stock} units available`,
        variant: "destructive",
      });
      return;
    }

    setCart(cart.map(item => 
      item.id === productId ? { ...item, quantity: newQuantity } : item
    ));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleLogout = () => {
    localStorage.removeItem("customerToken");
    localStorage.removeItem("customerData");
    setCustomerToken(null);
    setCustomerData(null);
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Store Not Found</h2>
            <p className="text-muted-foreground">The store you're looking for doesn't exist.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get business info
  const businessName = (data as any)?.businessInfo?.businessName || data?.businessName || subdomain;
  const logo = (data as any)?.businessInfo?.logo || data?.branding?.logoUrl;

  return (
    <div className="min-h-screen bg-white md:bg-gray-50 pb-14 md:pb-0">
      {/* Header - Consistent with main website */}
      <header className="bg-white border-b border-gray-100 md:shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14 md:h-16">
            {/* Mobile: Logo + Name (consistent with main website, no back arrow) */}
            {isMobile ? (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {logo ? (
                  <img src={logo} alt={businessName} className="h-12 w-12 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className="h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0" style={{ backgroundColor: primaryColor }}>
                    {businessName.charAt(0)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h1 className="font-bold text-lg truncate text-gray-900">{businessName}</h1>
                </div>
              </div>
            ) : (
            <button
              onClick={() => setLocation(`/${subdomain}`)}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              {data.branding?.logoUrl ? (
                <img 
                  src={data.branding.logoUrl} 
                  alt={data.businessName}
                  className="h-10 w-10 object-contain rounded"
                />
              ) : null}
              <span className="font-bold text-xl" style={{ color: primaryColor }}>
                {data.businessName}
              </span>
            </button>
            )}

            {/* Right side actions */}
            <div className="flex items-center gap-4">
              {/* Cart Button - Hidden in quotation mode */}
              {ecommerce.mode !== 'quotation' && (
                <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="relative">
                      <ShoppingCart className="h-5 w-5" />
                      {cartItemsCount > 0 && (
                        <Badge 
                          className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0"
                          style={{ backgroundColor: primaryColor }}
                        >
                          {cartItemsCount}
                        </Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                <SheetContent className="w-full sm:max-w-lg">
                  <SheetHeader>
                    <SheetTitle>Shopping Cart ({cartItemsCount})</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-4">
                    {cart.length === 0 ? (
                      <div className="text-center py-12">
                        <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Your cart is empty</p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto">
                          {cart.map((item) => (
                            <Card key={item.id}>
                              <CardContent className="p-4">
                                <div className="flex gap-4">
                                  {item.image && (
                                    <img 
                                      src={item.image}
                                      alt={item.name}
                                      className="w-20 h-20 object-cover rounded"
                                    />
                                  )}
                                  <div className="flex-1">
                                    <h4 className="font-semibold mb-1">{item.name}</h4>
                                    <p className="text-sm text-muted-foreground mb-2">
                                      ₹{item.price.toLocaleString()}
                                    </p>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                      >
                                        <Minus className="h-4 w-4" />
                                      </Button>
                                      <span className="w-8 text-center">{item.quantity}</span>
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                      >
                                        <Plus className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 ml-auto"
                                        onClick={() => removeFromCart(item.id)}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                        <Separator />
                        <div className="space-y-4">
                          <div className="flex justify-between text-lg font-bold">
                            <span>Total:</span>
                            <span style={{ color: primaryColor }}>₹{cartTotal.toLocaleString()}</span>
                          </div>
                          <Button 
                            className="w-full" 
                            size="lg"
                            style={{ backgroundColor: primaryColor, color: "white" }}
                            onClick={() => setLocation(`/${subdomain}`)}
                          >
                            Proceed to Checkout
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
              )}

              {/* User Menu - Hide for quotation-only mode */}
              {ecommerce.mode !== 'quotation' && (
                customerData ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <User className="h-4 w-4" />
                        <span className="hidden sm:inline">{customerData.name}</span>
                        <span className="sm:hidden">Profile</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium">{customerData.name}</p>
                          <p className="text-xs text-muted-foreground">{customerData.email}</p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setLocation(`/${subdomain}/my-orders`)}>
                        <Package className="mr-2 h-4 w-4" />
                        <span>My Orders</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Logout</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLocation(`/${subdomain}/login`)}
                  >
                    Login
                  </Button>
                )
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-4 md:py-8">
        {/* Breadcrumb - Desktop only */}
        {!isMobile && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <button
            onClick={() => setLocation(`/${subdomain}`)}
            className="hover:text-primary"
          >
            <Home className="h-4 w-4" />
          </button>
          <span>/</span>
          <span>Products</span>
        </div>
        )}

        {/* Page Header - Desktop only */}
        {!isMobile && (
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: primaryColor }}>
            Our Products
          </h1>
          <p className="text-muted-foreground text-lg">
            Browse our complete product catalog
          </p>
        </div>
        )}

        {/* Available Coupons Banner - Hidden in quotation mode and on mobile */}
        {!isMobile && ecommerce.mode !== 'quotation' && availableCoupons.length > 0 && (
          <div className="mb-6 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Tag className="h-5 w-5 text-green-600" />
              <div className="flex-1">
                <p className="font-semibold text-green-900">
                  {availableCoupons.length} Coupon{availableCoupons.length > 1 ? 's' : ''} Available!
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {availableCoupons.slice(0, 3).map((coupon: any) => (
                    <Badge key={coupon.id} variant="outline" className="bg-white">
                      {coupon.code} - {coupon.discountType === 'percentage' 
                        ? `${coupon.discountValue}% OFF` 
                        : `₹${coupon.discountValue} OFF`}
                    </Badge>
                  ))}
                  {availableCoupons.length > 3 && (
                    <Badge variant="outline" className="bg-white">
                      +{availableCoupons.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Filters - Horizontal Scrollable */}
        {isMobile ? (
          <div className="space-y-3 mb-4">
            {/* Back Button + Title Row */}
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={() => {
                  // Standard e-commerce back navigation
                  if (window.history.length > 1) {
                    window.history.back();
                  } else {
                    setLocation(`/${subdomain}`);
                  }
                }}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-700" />
              </button>
              <h2 className="font-semibold text-lg text-gray-900">Products</h2>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 h-11 text-sm border-gray-200"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>
            
            {/* Horizontal Scrollable Subcategory Filters */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
              {/* All */}
              <button
                onClick={() => setSelectedCategory("all")}
                className={`flex-shrink-0 h-9 px-4 text-sm font-medium border rounded-lg transition-colors ${
                  selectedCategory === "all" 
                    ? "text-white border-transparent" 
                    : "text-gray-700 border-gray-300 bg-white"
                }`}
                style={selectedCategory === "all" ? { backgroundColor: primaryColor } : {}}
              >
                All
              </button>
              {subcategories.map(subcategory => (
                <button
                  key={subcategory}
                  onClick={() => setSelectedCategory(subcategory)}
                  className={`flex-shrink-0 h-9 px-4 text-sm font-medium border rounded-lg transition-colors ${
                    selectedCategory === subcategory 
                      ? "text-white border-transparent" 
                      : "text-gray-700 border-gray-300 bg-white"
                  }`}
                  style={selectedCategory === subcategory ? { backgroundColor: primaryColor } : {}}
                >
                  {subcategory}
                </button>
              ))}
              {/* Sort Options as buttons */}
              <div className="flex-shrink-0 h-9 w-px bg-gray-200 mx-1"></div>
              <button
                onClick={() => setSortBy("name")}
                className={`flex-shrink-0 h-9 px-3 text-sm font-medium border rounded-lg ${
                  sortBy === "name" ? "border-gray-800 bg-gray-100" : "border-gray-300 bg-white"
                }`}
              >
                A-Z
              </button>
              <button
                onClick={() => setSortBy("price-low")}
                className={`flex-shrink-0 h-9 px-3 text-sm font-medium border rounded-lg ${
                  sortBy === "price-low" ? "border-gray-800 bg-gray-100" : "border-gray-300 bg-white"
                }`}
              >
                Price ↑
              </button>
              <button
                onClick={() => setSortBy("price-high")}
                className={`flex-shrink-0 h-9 px-3 text-sm font-medium border rounded-lg ${
                  sortBy === "price-high" ? "border-gray-800 bg-gray-100" : "border-gray-300 bg-white"
                }`}
              >
                Price ↓
              </button>
            </div>
          </div>
        ) : (
          /* Desktop Filters */
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Subcategory Filter */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Subcategory" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subcategories</SelectItem>
              {subcategories.map(subcategory => (
                <SelectItem key={subcategory} value={subcategory}>
                  {subcategory}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort By */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name (A-Z)</SelectItem>
              <SelectItem value="price-low">Price (Low to High)</SelectItem>
              <SelectItem value="price-high">Price (High to Low)</SelectItem>
            </SelectContent>
          </Select>

          {/* View Toggle */}
          <div className="flex gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
        )}

        {/* Active Filters */}
        {(searchQuery || selectedCategory !== "all") && (
          <div className="flex items-center gap-2 mb-6">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {searchQuery && (
              <Badge variant="secondary" className="gap-1">
                Search: "{searchQuery}"
                <button onClick={() => setSearchQuery("")}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {selectedCategory !== "all" && (
              <Badge variant="secondary" className="gap-1">
                Subcategory: {selectedCategory}
                <button onClick={() => setSelectedCategory("all")}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
            >
              Clear all
            </Button>
          </div>
        )}

        {/* Products Grid/List */}
        {filteredProducts.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Products Found</h3>
              <p className="text-muted-foreground">
                {selectedCategory !== "all"
                  ? "No products in this subcategory"
                  : searchQuery
                    ? "Try adjusting your search"
                    : "Products will be available soon"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className={
            viewMode === "grid"
              ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6"
              : "space-y-4"
          }>
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="group hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer"
                onClick={() => setLocation(`/${subdomain}/products/${product.id}`)}
              >
                <CardContent className={viewMode === "grid" ? "p-0" : "p-4 flex gap-4"}>
                  {/* Product Image */}
                  <div className={viewMode === "grid" ? "relative h-36 md:h-48 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100" : "w-24 h-24 md:w-32 md:h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100"}>
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                        <span className="text-3xl md:text-4xl">{product.icon || "📦"}</span>
                      </div>
                    )}
                    {product.stock === 0 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Badge variant="destructive">Out of Stock</Badge>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className={viewMode === "grid" ? "p-3 md:p-4" : "flex-1"}>
                    <p className="text-[11px] text-gray-500 truncate">{product.subcategory}</p>
                    <h3 className="font-semibold text-sm md:text-lg mb-1 group-hover:text-primary transition-colors line-clamp-2">
                      {product.name}
                    </h3>

                    {product.description && viewMode === "list" && (
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {product.description}
                      </p>
                    )}

                    <div className="flex items-baseline gap-2 mb-3">
                      <div className="flex items-baseline">
                        <span className="text-lg md:text-2xl font-bold" style={{ color: primaryColor }}>
                          ₹{(product as any).sellingPrice || product.price || 0}
                        </span>
                        {product.unit && (
                          <span className="text-xs md:text-sm text-muted-foreground ml-0.5">
                            /{getUnitAbbreviation(product.unit)}
                          </span>
                        )}
                      </div>
                      {(product as any).mrp && (product as any).mrp > ((product as any).sellingPrice || product.price || 0) && (
                        <span className="text-xs line-through text-muted-foreground">
                          ₹{(product as any).mrp}
                        </span>
                      )}
                    </div>

                    {ecommerce.mode === 'quotation' ? (
                      <Button
                        className="w-full h-9 md:h-10 text-sm"
                        style={{ backgroundColor: primaryColor, color: "white" }}
                        disabled={product.stock === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          setQuotationItems([{
                            type: 'product',
                            id: product.id,
                            name: product.name,
                            price: product.sellingPrice || product.price || 0,
                            quantity: 1,
                            vendorProductId: product.id,
                          }]);
                          setQuotationOpen(true);
                        }}
                      >
                        <Tag className="mr-2 h-4 w-4" />
                        {product.stock === 0 ? "Out of Stock" : "Request Quote"}
                      </Button>
                    ) : (
                      <Button
                        className="w-full h-9 md:h-10 text-sm"
                        style={{ backgroundColor: primaryColor, color: "white" }}
                        disabled={product.stock === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(product);
                        }}
                      >
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Quotation Modal */}
      <QuotationModal
        open={quotationOpen}
        onOpenChange={setQuotationOpen}
        items={quotationItems}
        subdomain={subdomain || ""}
        primaryColor={primaryColor}
        customerToken={customerToken}
        onSuccess={() => {
          setQuotationItems([]);
        }}
      />

      {/* Mobile Footer Navigation - Consistent with main website */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200">
          <div className="flex items-center justify-around h-14">
            <button 
              onClick={() => setLocation(`/${subdomain}`)}
              className="flex flex-col items-center justify-center flex-1 h-full text-gray-600"
            >
              <Home className="h-[22px] w-[22px]" />
              <span className="text-[11px] mt-1 font-medium">Home</span>
            </button>
            
            <button 
              onClick={() => setLocation(`/${subdomain}?tab=gallery`)}
              className="flex flex-col items-center justify-center flex-1 h-full text-gray-600"
            >
              <Image className="h-[22px] w-[22px]" />
              <span className="text-[11px] mt-1 font-medium">Gallery</span>
            </button>
            
            <button 
              onClick={() => setLocation(`/${subdomain}?tab=about`)}
              className="flex flex-col items-center justify-center flex-1 h-full text-gray-600"
            >
              <BookOpen className="h-[22px] w-[22px]" />
              <span className="text-[11px] mt-1 font-medium">About Us</span>
            </button>
            
            <button 
              onClick={() => setIsCartOpen(true)}
              className="flex flex-col items-center justify-center flex-1 h-full relative"
              style={{ color: primaryColor }}
            >
              <div className="relative">
                <ShoppingCart className="h-[22px] w-[22px]" />
                {cartItemsCount > 0 && (
                  <span 
                    className="absolute -top-1 -right-1.5 min-w-[16px] h-4 px-1 rounded-full text-white text-[10px] font-medium flex items-center justify-center"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {cartItemsCount > 9 ? '9+' : cartItemsCount}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-1 font-medium">Cart</span>
            </button>
            
            <button 
              onClick={() => setLocation(`/${subdomain}?tab=profile`)}
              className="flex flex-col items-center justify-center flex-1 h-full text-gray-600"
            >
              <User className="h-[22px] w-[22px]" />
              <span className="text-[11px] mt-1 font-medium">Profile</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}

