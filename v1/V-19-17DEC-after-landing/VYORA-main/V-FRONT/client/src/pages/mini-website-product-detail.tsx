import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  ShoppingCart, Home, Plus, Minus, Check, Tag, 
  User, LogOut, ChevronLeft, ChevronRight, Star, Share2, Heart, Package
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
}

export default function MiniWebsiteProductDetail() {
  const [, params] = useRoute("/site/:subdomain/products/:productId");
  const [, setLocation] = useLocation();
  const subdomain = params?.subdomain || "";
  const productId = params?.productId || "";
  const { toast } = useToast();

  // State
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
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
  const coupons = data?.coupons || [];
  const ecommerce = (data?.ecommerce as any) || { enabled: false, mode: 'cart' };

  // Available coupons for this product (filter for mini-website applicable coupons)
  const availableCoupons = coupons.filter((coupon: any) => {
    // Check basic validity
    if (!coupon.isActive) return false;
    if (coupon.status !== 'active') return false;
    if (new Date(coupon.expiryDate || coupon.validUntil) <= new Date()) return false;
    
    // Check if applicable on mini-website
    const applicableOn = coupon.applicableOn || 'all';
    if (applicableOn !== 'all' && applicableOn !== 'online_only' && applicableOn !== 'miniwebsite_only') {
      return false;
    }
    
    // Check product/service applicability
    const applicationType = coupon.applicationType || 'all';
    if (applicationType === 'all') return true;
    
    if (applicationType === 'specific_products') {
      const applicableProducts = coupon.applicableProducts || [];
      return applicableProducts.length === 0 || applicableProducts.includes(productId);
    }
    
    if (applicationType === 'specific_category') {
      const applicableCategories = coupon.applicableCategories || [];
      return applicableCategories.length === 0 || (product.category && applicableCategories.includes(product.category));
    }
    
    return true;
  });

  // Cart functions
  const addToCart = () => {
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

    const existingItem = cart.find(item => item.id === product.id);
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
        item.id === product.id
          ? { ...item, quantity: newQuantity }
          : item
      ));
    } else {
      const newItem: CartItem = {
        type: 'product',
        id: product.id,
        name: product.name,
        price: product.price || product.sellingPrice || 0,
        quantity: quantity,
        image: product.images?.[0],
        vendorProductId: product.id,
      };
      setCart([...cart, newItem]);
    }

    toast({
      title: "Added to Cart",
      description: `${quantity} x ${product.name} added to cart`,
    });
    setIsCartOpen(true);
  };

  const applyCoupon = () => {
    if (!couponCode.trim()) {
      toast({
        title: "Invalid Coupon",
        description: "Please enter a coupon code",
        variant: "destructive",
      });
      return;
    }

    const coupon = availableCoupons.find((c: any) => 
      c.code.toUpperCase() === couponCode.toUpperCase()
    );

    if (!coupon) {
      toast({
        title: "Invalid Coupon",
        description: "This coupon code is not valid or has expired",
        variant: "destructive",
      });
      return;
    }

    setAppliedCoupon(coupon);
    toast({
      title: "Coupon Applied!",
      description: `${coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`} discount applied`,
    });
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    toast({
      title: "Coupon Removed",
      description: "Coupon has been removed from your order",
    });
  };

  const calculateDiscount = (price: number) => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discountType === 'percentage') {
      return Math.min((price * quantity * appliedCoupon.discountValue) / 100, appliedCoupon.maxDiscount || Infinity);
    }
    return appliedCoupon.discountValue;
  };

  const updateCartQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart(cart.filter(item => item.id !== productId));
      return;
    }
    setCart(cart.map(item =>
      item.id === productId ? { ...item, quantity: newQuantity } : item
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
            <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
            <p className="text-muted-foreground mb-6">The product you're looking for doesn't exist.</p>
            <Button onClick={() => setLocation(`/site/${subdomain}/products`)}>
              Back to Products
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const images = product.images || [];
  const productPrice = product.price || product.sellingPrice || 0;
  const discount = calculateDiscount(productPrice);
  const finalPrice = (productPrice * quantity) - discount;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <button
              onClick={() => setLocation(`/site/${subdomain}`)}
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

            {/* Right side actions */}
            <div className="flex items-center gap-4">
              {/* Cart Button */}
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
                                        onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                                      >
                                        <Minus className="h-4 w-4" />
                                      </Button>
                                      <span className="w-8 text-center">{item.quantity}</span>
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
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
                            onClick={() => setLocation(`/site/${subdomain}`)}
                          >
                            Proceed to Checkout
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </SheetContent>
              </Sheet>

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
                      <DropdownMenuItem onClick={() => setLocation(`/site/${subdomain}/my-orders`)}>
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
                    onClick={() => setLocation(`/site/${subdomain}/login`)}
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
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <button
            onClick={() => setLocation(`/site/${subdomain}`)}
            className="hover:text-primary"
          >
            <Home className="h-4 w-4" />
          </button>
          <span>/</span>
          <button
            onClick={() => setLocation(`/site/${subdomain}/products`)}
            className="hover:text-primary"
          >
            Products
          </button>
          <span>/</span>
          <span>{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="relative aspect-square">
                  {images.length > 0 ? (
                    <img
                      src={images[selectedImageIndex]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400">No Image</span>
                    </div>
                  )}
                  {product.stock === 0 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Badge variant="destructive" className="text-lg py-2 px-4">
                        Out of Stock
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Thumbnail Images */}
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImageIndex === index
                        ? "border-primary"
                        : "border-transparent hover:border-gray-300"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                {product.name}
              </h1>
              {product.category && (
                <Badge variant="secondary" className="mb-4">
                  {product.category}
                </Badge>
              )}
            </div>

            {/* Price */}
            <div className="space-y-2">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold" style={{ color: primaryColor }}>
                  ₹{(product.price || product.sellingPrice || 0).toLocaleString()}
                </span>
                {product.mrp && product.mrp > (product.price || product.sellingPrice || 0) && (
                  <>
                    <span className="text-2xl line-through text-muted-foreground">
                      ₹{product.mrp.toLocaleString()}
                    </span>
                    <Badge variant="destructive" className="text-sm">
                      {Math.round((1 - (product.price || product.sellingPrice || 0) / product.mrp) * 100)}% OFF
                    </Badge>
                  </>
                )}
              </div>
              {/* Hide coupon display in quotation mode */}
              {ecommerce.mode !== 'quotation' && appliedCoupon && (
                <div className="flex items-center gap-2 text-green-600">
                  <Check className="h-5 w-5" />
                  <span className="font-semibold">
                    Coupon Applied: Save ₹{discount.toLocaleString()}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={removeCoupon}
                    className="h-auto p-1"
                  >
                    Remove
                  </Button>
                </div>
              )}
            </div>

            <Separator />

            {/* Stock Status */}
            {product.stock > 0 ? (
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                <span className="text-green-600 font-semibold">
                  In Stock
                  {product.stock <= 10 && ` (Only ${product.stock} left)`}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Badge variant="destructive">Out of Stock</Badge>
              </div>
            )}

            {/* Quantity Selector */}
            <div>
              <label className="block text-sm font-medium mb-2">Quantity</label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={product.stock === 0}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  min="1"
                  max={product.stock}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock, parseInt(e.target.value) || 1)))}
                  className="w-20 text-center"
                  disabled={product.stock === 0}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={product.stock === 0}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  Max: {product.stock}
                </span>
              </div>
            </div>

            {/* Coupon Code - Hidden in quotation mode */}
            {ecommerce.mode !== 'quotation' && availableCoupons.length > 0 && !appliedCoupon && (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-900">
                      {availableCoupons.length} Coupon{availableCoupons.length > 1 ? 's' : ''} Available
                    </span>
                  </div>
                  <div className="space-y-2 mb-3">
                    {availableCoupons.slice(0, 2).map((coupon: any) => (
                      <div key={coupon.id} className="flex items-center justify-between text-sm">
                        <span className="font-mono font-bold">{coupon.code}</span>
                        <span className="text-green-700">
                          {coupon.discountType === 'percentage' 
                            ? `${coupon.discountValue}% OFF`
                            : `₹${coupon.discountValue} OFF`}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="bg-white"
                    />
                    <Button onClick={applyCoupon} style={{ backgroundColor: primaryColor, color: "white" }}>
                      Apply
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons - Only Request Quote in quotation mode */}
            {ecommerce.mode === 'quotation' ? (
              <div className="space-y-3">
                <Button
                  className="w-full"
                  size="lg"
                  style={{ backgroundColor: primaryColor, color: "white" }}
                  disabled={product.stock === 0}
                  onClick={() => {
                    setQuotationItems([{
                      type: 'product',
                      id: product.id,
                      name: product.name,
                      price: productPrice,
                      quantity: quantity,
                      vendorProductId: product.id,
                    }]);
                    setQuotationOpen(true);
                  }}
                >
                  <Tag className="mr-2 h-5 w-5" />
                  Request Quote
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Button
                  className="w-full"
                  size="lg"
                  style={{ backgroundColor: primaryColor, color: "white" }}
                  disabled={product.stock === 0}
                  onClick={addToCart}
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Add to Cart
                </Button>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" size="lg">
                    <Heart className="mr-2 h-5 w-5" />
                    Wishlist
                  </Button>
                  <Button variant="outline" size="lg">
                    <Share2 className="mr-2 h-5 w-5" />
                    Share
                  </Button>
                </div>
              </div>
            )}

            {/* Price Summary - Hidden in quotation mode */}
            {ecommerce.mode !== 'quotation' && appliedCoupon && (
              <Card>
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Item Total:</span>
                    <span>₹{(productPrice * quantity).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount:</span>
                    <span>- ₹{discount.toLocaleString()}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Final Price:</span>
                    <span style={{ color: primaryColor }}>₹{finalPrice.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Product Details Tabs */}
        <Card>
          <CardContent className="p-6">
            <Tabs defaultValue="description" className="w-full">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="description">Description</TabsTrigger>
                {product.specifications && (
                  <TabsTrigger value="specifications">Specifications</TabsTrigger>
                )}
              </TabsList>
              <TabsContent value="description" className="mt-6">
                <div className="prose max-w-none">
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {product.description || "No description available for this product."}
                  </p>
                </div>
              </TabsContent>
              {product.specifications && (
                <TabsContent value="specifications" className="mt-6">
                  <div className="space-y-2">
                    {Object.entries(product.specifications).map(([key, value]) => (
                      <div key={key} className="flex border-b pb-2">
                        <span className="font-semibold w-1/3 capitalize">{key}:</span>
                        <span className="text-muted-foreground w-2/3">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </CardContent>
        </Card>
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
    </div>
  );
}

