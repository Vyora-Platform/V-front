import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ProductDetailPage } from "@/components/ProductDetailPage";
import { 
  ShoppingCart, Home, Plus, Minus, Check, Tag, 
  User, LogOut, ChevronLeft, Package, ArrowLeft
} from "lucide-react";
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
import { QuotationModal } from "@/components/QuotationModal";

interface CartItem {
  type: 'product';
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  vendorProductId: string;
  selectedVariants?: Record<string, string>;
}

export default function MiniWebsiteProductDetail() {
  const [, params] = useRoute("/:subdomain/products/:productId");
  const [, setLocation] = useLocation();
  const subdomain = params?.subdomain || "";
  const productId = params?.productId || "";
  const { toast } = useToast();

  // State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [quotationOpen, setQuotationOpen] = useState(false);
  const [quotationItems, setQuotationItems] = useState<any[]>([]);

  // Customer authentication
  const [customerToken, setCustomerToken] = useState<string | null>(null);
  const [customerData, setCustomerData] = useState<any>(null);

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
  const product = data?.products?.find(p => p.id === productId);
  const ecommerce = (data?.ecommerce as any) || { enabled: false, mode: 'cart' };

  // Add to cart handler
  const handleAddToCart = (quantity: number, selectedVariants?: Record<string, string>) => {
    if (!product || product.stock === 0) {
      toast({
        title: "Out of Stock",
        description: "This product is currently out of stock",
        variant: "destructive",
      });
      return;
    }

    if (quantity > product.stock) {
      toast({
        title: "Stock Limit",
        description: `Only ${product.stock} units available`,
        variant: "destructive",
      });
      return;
    }

    const existingItem = cart.find(item => 
      item.id === product.id && 
      JSON.stringify(item.selectedVariants) === JSON.stringify(selectedVariants)
    );
    
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > product.stock) {
        toast({
          title: "Stock Limit Reached",
          description: `Only ${product.stock} units available`,
          variant: "destructive",
        });
        return;
      }
      setCart(cart.map(item =>
        item.id === product.id && JSON.stringify(item.selectedVariants) === JSON.stringify(selectedVariants)
          ? { ...item, quantity: newQuantity }
          : item
      ));
    } else {
      const newItem: CartItem = {
        type: 'product',
        id: product.id,
        name: product.name,
        price: (product as any).sellingPrice || product.price || 0,
        quantity: quantity,
        image: product.images?.[0],
        vendorProductId: product.id,
        selectedVariants,
      };
      setCart([...cart, newItem]);
    }

    toast({
      title: "Added to Cart",
      description: `${quantity} x ${product.name} added to cart`,
    });
    setIsCartOpen(true);
  };

  // Request quote handler
  const handleRequestQuote = (quantity: number, selectedVariants?: Record<string, string>) => {
    if (!product) return;
    
    setQuotationItems([{
      type: 'product',
      id: product.id,
      name: product.name,
      price: (product as any).sellingPrice || product.price || 0,
      quantity: quantity,
      vendorProductId: product.id,
      selectedVariants,
    }]);
    setQuotationOpen(true);
  };

  const updateCartQuantity = (productId: string, newQuantity: number, selectedVariants?: Record<string, string>) => {
    if (newQuantity <= 0) {
      setCart(cart.filter(item => 
        !(item.id === productId && JSON.stringify(item.selectedVariants) === JSON.stringify(selectedVariants))
      ));
      return;
    }
    setCart(cart.map(item =>
      item.id === productId && JSON.stringify(item.selectedVariants) === JSON.stringify(selectedVariants)
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

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

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
            <p className="text-muted-foreground mb-6">The product you're looking for doesn't exist.</p>
            <Button onClick={() => setLocation(`/${subdomain}/products`)}>
              Back to Products
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Transform product data for ProductDetailPage
  const transformedProduct = {
    id: product.id,
    name: product.name,
    category: product.category,
    subcategory: product.subcategory || undefined,
    brand: product.brand || undefined,
    description: product.description,
    specifications: product.specifications || [],
    mrp: (product as any).mrp || null,
    price: product.price,
    sellingPrice: (product as any).sellingPrice || null,
    unit: product.unit,
    stock: product.stock,
    images: product.images || [],
    imageKeys: product.imageKeys || [],
    variants: (product as any).variants || undefined,
    icon: product.icon || undefined,
    requiresPrescription: product.requiresPrescription || false,
    isActive: product.isActive,
    // Warranty & Guarantee
    hasWarranty: (product as any).hasWarranty || false,
    warrantyDuration: (product as any).warrantyDuration || undefined,
    warrantyUnit: (product as any).warrantyUnit || undefined,
    hasGuarantee: (product as any).hasGuarantee || false,
    guaranteeDuration: (product as any).guaranteeDuration || undefined,
    guaranteeUnit: (product as any).guaranteeUnit || undefined,
    // Tags
    tags: (product as any).tags || [],
  };

  // Handle back navigation
  const handleBack = () => {
    setLocation(`/${subdomain}/products`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14 md:h-16">
            {/* Back Button & Logo */}
            <div className="flex items-center gap-2 md:gap-4">
              <button
                onClick={() => {
                  // Standard e-commerce back navigation - go back to previous page if available
                  if (window.history.length > 1) {
                    window.history.back();
                  } else {
                    setLocation(`/${subdomain}/products`);
                  }
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              
              <button
                onClick={() => setLocation(`/${subdomain}`)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                {data.branding?.logoUrl ? (
                  <img 
                    src={data.branding.logoUrl} 
                    alt={data.businessName}
                    className="h-8 w-8 md:h-10 md:w-10 object-contain rounded"
                  />
                ) : null}
                <span 
                  className="font-bold text-lg md:text-xl hidden sm:inline" 
                  style={{ color: primaryColor }}
                >
                  {data.businessName}
                </span>
              </button>
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-2 md:gap-4">
              {/* Cart Button */}
              <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="relative">
                    <ShoppingCart className="h-5 w-5" />
                    {cartItemsCount > 0 && (
                      <Badge 
                        className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
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
                          {cart.map((item, index) => (
                            <Card key={`${item.id}-${index}`}>
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
                                    {item.selectedVariants && Object.keys(item.selectedVariants).length > 0 && (
                                      <div className="flex flex-wrap gap-1 mb-2">
                                        {Object.entries(item.selectedVariants).map(([key, value]) => (
                                          <Badge key={key} variant="outline" className="text-xs">
                                            {key}: {value}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                    <p className="text-sm text-muted-foreground mb-2">
                                      ₹{item.price.toLocaleString()}
                                    </p>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => updateCartQuantity(item.id, item.quantity - 1, item.selectedVariants)}
                                      >
                                        <Minus className="h-4 w-4" />
                                      </Button>
                                      <span className="w-8 text-center">{item.quantity}</span>
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => updateCartQuantity(item.id, item.quantity + 1, item.selectedVariants)}
                                      >
                                        <Plus className="h-4 w-4" />
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

              {/* User Menu */}
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

      {/* Breadcrumb - Desktop only */}
      <div className="hidden md:block container mx-auto px-4 py-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button
            onClick={() => setLocation(`/${subdomain}`)}
            className="hover:text-primary"
          >
            <Home className="h-4 w-4" />
          </button>
          <span>/</span>
          <button
            onClick={() => setLocation(`/${subdomain}/products`)}
            className="hover:text-primary"
          >
            Products
          </button>
          <span>/</span>
          <span className="text-foreground">{product.name}</span>
        </div>
      </div>

      {/* Product Detail */}
      <ProductDetailPage
        product={transformedProduct}
        primaryColor={primaryColor}
        showAddToCart={ecommerce.mode !== 'quotation'}
        showQuantitySelector={true}
        showStock={true}
        onAddToCart={ecommerce.mode !== 'quotation' ? handleAddToCart : undefined}
        onRequestQuote={ecommerce.mode === 'quotation' || ecommerce.mode === 'both' ? handleRequestQuote : undefined}
        onBack={handleBack}
        mode="page"
      />

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
    </div>
  );
}
