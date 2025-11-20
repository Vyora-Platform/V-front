import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getApiUrl } from "@/lib/config";
import { 
  Phone, Mail, MapPin, Globe, Star, Send, Package, 
  CheckCircle, Clock, ExternalLink, Users, Tag, HelpCircle,
  ChevronDown, ChevronUp, Navigation, ChevronLeft, ChevronRight,
  ShoppingCart, Calendar, Info, Plus, Minus, X, Trash2, Home, User, LogOut
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { MiniWebsite, MiniWebsiteReview, VendorCatalogue, VendorProduct } from "@shared/schema";

interface CartItem {
  type: 'product' | 'service';
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  vendorProductId?: string;
  vendorCatalogueId?: string;
}

export default function MiniWebsitePublic() {
  const [, params] = useRoute("/site/:subdomain");
  const [, setLocation] = useLocation();
  const subdomain = params?.subdomain || "";
  const { toast } = useToast();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Customer authentication state
  const [customerToken, setCustomerToken] = useState<string | null>(null);
  const [customerData, setCustomerData] = useState<any>(null);

  // Load customer auth on mount and on URL change
  useEffect(() => {
    console.log('🔄 [Mini Website] Component mounted/updated');
    const token = localStorage.getItem("customerToken");
    const data = localStorage.getItem("customerData");
    console.log('🔍 [Mini Website] Loading customer auth from localStorage');
    console.log('🔍 [Mini Website] Token exists:', !!token);
    console.log('🔍 [Mini Website] Token value:', token?.substring(0, 20) + '...');
    console.log('🔍 [Mini Website] Data:', data);
    
    if (token && data && data !== "undefined" && data !== "null") {
      try {
        const parsedData = JSON.parse(data);
        setCustomerToken(token);
        setCustomerData(parsedData);
        console.log('✅ [Mini Website] Customer auth loaded successfully!');
        console.log('✅ [Mini Website] Customer name:', parsedData.name);
        console.log('✅ [Mini Website] Customer email:', parsedData.email);
        console.log('✅ [Mini Website] State updated - customerToken:', !!token, 'customerData:', !!parsedData);
      } catch (error) {
        console.error("❌ [Mini Website] Failed to parse customer data:", error);
        console.error("❌ [Mini Website] Invalid data:", data);
        // Clear invalid data
        localStorage.removeItem("customerToken");
        localStorage.removeItem("customerData");
        setCustomerToken(null);
        setCustomerData(null);
      }
    } else {
      console.log('⚠️ [Mini Website] No valid customer auth found in localStorage');
      setCustomerToken(null);
      setCustomerData(null);
    }
  }, [subdomain]); // Re-run when subdomain changes

  const [leadForm, setLeadForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [quotationOpen, setQuotationOpen] = useState(false);

  // Fetch mini-website data
  const { data, isLoading, error } = useQuery<MiniWebsite & { 
    reviews: MiniWebsiteReview[],
    services: VendorCatalogue[],
    products: VendorProduct[],
  }>({
    queryKey: [`/api/mini-website/${subdomain}`],
    enabled: !!subdomain,
    staleTime: 0, // Always fetch fresh data
    cacheTime: 0, // Don't cache
  });

  // Get e-commerce settings
  const ecommerce = (data?.ecommerce as any) || { enabled: false, mode: 'quotation' };

  // Debug logging
  useEffect(() => {
    if (data) {
      console.log('🌐 Mini-website data loaded:', data);
      console.log('🛒 E-commerce field exists:', 'ecommerce' in data);
      console.log('🛒 E-commerce raw:', data.ecommerce);
      console.log('🛒 E-commerce parsed:', ecommerce);
      console.log('🛒 Should show cart:', ecommerce.enabled && (ecommerce.mode === 'cart' || ecommerce.mode === 'both'));
    }
  }, [data, ecommerce]);

  // Customer form state for checkout (auto-fill if authenticated)
  const [customerForm, setCustomerForm] = useState({
    name: customerData?.name || "",
    email: customerData?.email || "",
    phone: customerData?.phone || "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    notes: "",
  });

  // Update form when customer data changes (including saved address details)
  useEffect(() => {
    if (customerData) {
      // Get saved address details from localStorage
      const savedAddressData = localStorage.getItem('customerAddressData');
      let addressData = {
        address: '',
        city: '',
        state: '',
        pincode: ''
      };
      
      if (savedAddressData) {
        try {
          addressData = JSON.parse(savedAddressData);
        } catch (e) {
          console.error('Failed to parse saved address data');
        }
      }
      
      console.log('🔄 [Checkout] Auto-filling customer form');
      console.log('🔄 [Checkout] Customer data:', customerData);
      console.log('🔄 [Checkout] Saved address data:', addressData);
      
      setCustomerForm(prev => ({
        ...prev,
        name: customerData.name || prev.name,
        email: customerData.email || prev.email,
        phone: customerData.phone || prev.phone,
        address: addressData.address || prev.address,
        city: addressData.city || prev.city,
        state: addressData.state || prev.state,
        pincode: addressData.pincode || prev.pincode,
      }));
    }
  }, [customerData]);

  // Handle customer logout
  const handleLogout = () => {
    localStorage.removeItem("customerToken");
    localStorage.removeItem("customerData");
    localStorage.removeItem("customerId");
    localStorage.removeItem("customerAddress");
    localStorage.removeItem("customerAddressData");
    setCustomerToken(null);
    setCustomerData(null);
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
  };

  // Submit lead mutation
  const submitLeadMutation = useMutation({
    mutationFn: async (formData: typeof leadForm) => {
      return await apiRequest("POST", `/api/mini-website/${subdomain}/leads`, formData);
    },
    onSuccess: () => {
      toast({
        title: "Message sent!",
        description: "Thank you for your interest. We'll get back to you soon.",
      });
      setLeadForm({ name: "", email: "", phone: "", message: "" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Submit order mutation
  const submitOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      console.log('📡 [Order] Sending order to API:', orderData);
      console.log('📡 [Order] Customer token:', customerToken?.substring(0, 20) + '...');
      console.log('📡 [Order] Customer ID:', customerData?.id);
      
      if (!customerToken || !customerData) {
        throw new Error('Please login to place an order');
      }
      
      // Send request with customer token in Authorization header
      const response = await fetch(getApiUrl(`/api/mini-website/${subdomain}/orders`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${customerToken}`,
        },
        body: JSON.stringify(orderData),
      });
      
      console.log('📡 [Order] Response status:', response.status);
      
      if (!response.ok) {
        const error = await response.json();
        console.error('❌ [Order] Error response:', error);
        throw new Error(error.message || 'Failed to place order');
      }
      
      const result = await response.json();
      console.log('✅ [Order] Order placed successfully:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('✅ Order placed successfully:', data);
      
      // Save address details to localStorage for next time
      if (customerForm.address || customerForm.city || customerForm.state || customerForm.pincode) {
        const addressData = {
          address: customerForm.address,
          city: customerForm.city,
          state: customerForm.state,
          pincode: customerForm.pincode
        };
        
        // Save as JSON for structured data
        localStorage.setItem('customerAddressData', JSON.stringify(addressData));
        
        // Also save as combined string for backward compatibility
        const fullAddress = `${customerForm.address}, ${customerForm.city}, ${customerForm.state} - ${customerForm.pincode}`;
        localStorage.setItem('customerAddress', fullAddress);
        
        console.log('💾 [Order] Saved address data to localStorage:', addressData);
        
        // Update customerData with full address
        if (customerData) {
          const updatedCustomerData = {
            ...customerData,
            address: fullAddress
          };
          localStorage.setItem('customerData', JSON.stringify(updatedCustomerData));
          setCustomerData(updatedCustomerData);
          console.log('💾 [Order] Updated customerData with address');
        }
      }
      
      toast({
        title: "Order placed!",
        description: "Thank you for your order. We'll contact you shortly.",
      });
      setCart([]);
      setCheckoutOpen(false);
      // Don't reset form completely - keep customer data for next order
    },
    onError: (error: any) => {
      console.error('❌ Order submission error:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to place order. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Submit quotation mutation (guest mode - no login required)
  const submitQuotationMutation = useMutation({
    mutationFn: async (quotationData: any) => {
      console.log('📡 [Quotation] Sending quotation request:', quotationData);
      
      // For quotation mode, allow guest users without login
      const headers: any = {
        'Content-Type': 'application/json',
      };
      
      // Include auth token if user is logged in (optional for quotations)
      if (customerToken) {
        headers['Authorization'] = `Bearer ${customerToken}`;
        console.log('📡 [Quotation] With customer token:', customerToken?.substring(0, 20) + '...');
      } else {
        console.log('📡 [Quotation] Guest user quotation (no login required)');
      }
      
      // Send request
      const response = await fetch(getApiUrl(`/api/mini-website/${subdomain}/quotations`), {
        method: 'POST',
        headers,
        body: JSON.stringify(quotationData),
      });
      
      console.log('📡 [Quotation] Response status:', response.status);
      
      if (!response.ok) {
        const error = await response.json();
        console.error('❌ [Quotation] Error response:', error);
        throw new Error(error.message || 'Failed to request quote');
      }
      
      const result = await response.json();
      console.log('✅ [Quotation] Quote requested successfully:', result);
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Quotation requested!",
        description: "We'll send you a detailed quote shortly.",
      });
      setCart([]);
      setQuotationOpen(false);
      setCustomerForm({ name: "", email: "", phone: "", address: "", notes: "" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to submit quotation request. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Cart functions
  const addToCart = (item: Omit<CartItem, 'quantity'>) => {
    console.log('🛒 Adding to cart:', item);
    
    // ✅ VALIDATE STOCK FOR PRODUCTS
    if (item.type === 'product' && data?.products) {
      const product = data.products.find(p => p.id === item.id);
      if (!product) {
        toast({
          title: "Product not found",
          description: `${item.name} is no longer available`,
          variant: "destructive",
        });
        return;
      }
      
      // Check current quantity in cart
      const cartItem = cart.find(i => i.id === item.id && i.type === item.type);
      const currentQuantityInCart = cartItem ? cartItem.quantity : 0;
      const newQuantity = currentQuantityInCart + 1;
      
      // Check if product is out of stock
      if (product.stock === 0) {
        toast({
          title: "Out of stock",
          description: `${item.name} is currently out of stock`,
          variant: "destructive",
        });
        return;
      }
      
      // Check if adding one more would exceed available stock
      if (newQuantity > product.stock) {
        toast({
          title: "Insufficient stock",
          description: `Only ${product.stock} ${product.stock === 1 ? 'item' : 'items'} available. You already have ${currentQuantityInCart} in cart.`,
          variant: "destructive",
        });
        return;
      }
      
      console.log(`✅ Stock validation passed: ${item.name} (Available: ${product.stock}, In cart: ${currentQuantityInCart}, Adding: 1)`);
    }
    
    setCart(prevCart => {
      const existingItem = prevCart.find(i => i.id === item.id && i.type === item.type);
      if (existingItem) {
        const updated = prevCart.map(i =>
          i.id === item.id && i.type === item.type
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
        console.log('🛒 Updated cart (item exists):', updated);
        return updated;
      }
      const newCart = [...prevCart, { ...item, quantity: 1 }];
      console.log('🛒 Updated cart (new item):', newCart);
      return newCart;
    });
    toast({
      title: "Added to cart",
      description: `${item.name} has been added to your cart`,
    });
  };

  const removeFromCart = (id: string, type: 'product' | 'service') => {
    setCart(prevCart => prevCart.filter(item => !(item.id === id && item.type === type)));
  };

  const updateQuantity = (id: string, type: 'product' | 'service', quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id, type);
      return;
    }
    
    // ✅ VALIDATE STOCK FOR PRODUCTS
    if (type === 'product' && data?.products) {
      const product = data.products.find(p => p.id === id);
      if (!product) {
        toast({
          title: "Product not found",
          description: "This product is no longer available",
          variant: "destructive",
        });
        return;
      }
      
      // Check if requested quantity exceeds available stock
      if (quantity > product.stock) {
        toast({
          title: "Insufficient stock",
          description: `Only ${product.stock} ${product.stock === 1 ? 'item' : 'items'} available`,
          variant: "destructive",
        });
        // Set quantity to maximum available stock
        setCart(prevCart =>
          prevCart.map(item =>
            item.id === id && item.type === type ? { ...item, quantity: product.stock } : item
          )
        );
        return;
      }
      
      console.log(`✅ Stock validation passed for quantity update: ${product.name} (Available: ${product.stock}, Requested: ${quantity})`);
    }
    
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === id && item.type === type ? { ...item, quantity } : item
      )
    );
  };

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartTax = ecommerce.taxRate ? (cartSubtotal * ecommerce.taxRate / 100) : 0;
  const cartTotal = cartSubtotal + cartTax;

  // Extract hero media for carousel (safe to access before early returns)
  const heroMedia = (data?.branding as any)?.heroMedia || [];

  // Clamp currentSlide when heroMedia array changes (prevents blank slides)
  // MUST be before early returns to comply with Rules of Hooks
  useEffect(() => {
    setCurrentSlide((prev) => {
      if (heroMedia.length === 0) return 0;
      if (prev >= heroMedia.length) return Math.max(0, heroMedia.length - 1);
      return prev;
    });
  }, [heroMedia]);

  // Auto-scroll carousel effect
  // MUST be before early returns to comply with Rules of Hooks
  useEffect(() => {
    if (heroMedia.length <= 1) return; // No need to scroll if only one image
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroMedia.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [heroMedia.length]);

  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadForm.name || !leadForm.email) {
      toast({
        title: "Missing information",
        description: "Please provide your name and email.",
        variant: "destructive",
      });
      return;
    }
    submitLeadMutation.mutate(leadForm);
  };

  // Early returns AFTER all hooks
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="animate-pulse text-center">
          <div className="h-8 w-48 bg-muted rounded mx-auto mb-4"></div>
          <div className="h-4 w-32 bg-muted rounded mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-semibold mb-2">Website Not Found</h2>
            <p className="text-muted-foreground">
              The mini-website you're looking for doesn't exist or hasn't been published yet.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const businessInfo = data.businessInfo as any;
  const contactInfo = data.contactInfo as any;
  const branding = data.branding as any;
  const team = data.team as any[] || [];
  const faqs = data.faqs as any[] || [];
  const testimonials = data.testimonials as any[] || [];
  const coupons = data.coupons as any[] || [];
  
  const primaryColor = branding?.primaryColor || "#0f766e";
  const secondaryColor = branding?.secondaryColor || "#14b8a6";

  return (
    <div className="min-h-screen bg-background scroll-smooth">
      {/* Header with Logo and Contact Info */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b">
        {/* Main Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              {businessInfo?.logo ? (
                <img 
                  src={businessInfo.logo} 
                  alt={businessInfo?.businessName} 
                  className="h-12 w-auto object-contain"
                  data-testid="img-logo"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <div 
                    className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {businessInfo?.businessName?.charAt(0) || "B"}
                  </div>
                  <span className="text-xl font-bold">{businessInfo?.businessName}</span>
                </div>
              )}
            </div>

            {/* Quick Contact Buttons */}
            <div className="flex items-center gap-2">
              {/* Shopping Cart Button - Only show if e-commerce enabled */}
              {ecommerce.enabled && (ecommerce.mode === 'cart' || ecommerce.mode === 'both') && (
                <Sheet open={cartOpen} onOpenChange={setCartOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="relative">
                      <ShoppingCart className="h-4 w-4" />
                      {cartItemCount > 0 && (
                        <Badge 
                          className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                          variant="destructive"
                        >
                          {cartItemCount}
                        </Badge>
                      )}
                      <span className="ml-2 hidden sm:inline">Cart</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle>Shopping Cart</SheetTitle>
                      <SheetDescription>
                        {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'} in your cart
                      </SheetDescription>
                    </SheetHeader>
                    
                    <div className="mt-6 space-y-4">
                      {cart.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Your cart is empty</p>
                        </div>
                      ) : (
                        <>
                          {/* Cart Items */}
                          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                            {cart.map((item) => (
                              <Card key={`${item.type}-${item.id}`}>
                                <CardContent className="p-4">
                                  <div className="flex gap-3">
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-medium truncate">{item.name}</h4>
                                      <p className="text-sm text-muted-foreground capitalize">{item.type}</p>
                                      <p className="text-sm font-bold mt-1">₹{item.price}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => removeFromCart(item.id, item.type)}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                      <div className="flex items-center gap-2">
                                        <Button
                                          variant="outline"
                                          size="icon"
                                          className="h-7 w-7"
                                          onClick={() => updateQuantity(item.id, item.type, item.quantity - 1)}
                                        >
                                          <Minus className="h-3 w-3" />
                                        </Button>
                                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                                        <Button
                                          variant="outline"
                                          size="icon"
                                          className="h-7 w-7"
                                          onClick={() => updateQuantity(item.id, item.type, item.quantity + 1)}
                                        >
                                          <Plus className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                          
                          {/* Cart Summary */}
                          <div className="space-y-4 pt-4 border-t">
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Subtotal</span>
                                <span>₹{cartSubtotal.toFixed(2)}</span>
                              </div>
                              {ecommerce.taxRate > 0 && (
                                <div className="flex justify-between text-sm">
                                  <span>Tax ({ecommerce.taxRate}%)</span>
                                  <span>₹{cartTax.toFixed(2)}</span>
                                </div>
                              )}
                              <Separator />
                              <div className="flex justify-between font-bold text-lg">
                                <span>Total</span>
                                <span>₹{cartTotal.toFixed(2)}</span>
                              </div>
                            </div>
                            
                            {ecommerce.minOrderValue > 0 && cartSubtotal < ecommerce.minOrderValue && (
                              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded">
                                Minimum order value is ₹{ecommerce.minOrderValue}
                              </div>
                            )}
                            
                            <Button 
                              className="w-full" 
                              size="lg"
                              disabled={ecommerce.minOrderValue > 0 && cartSubtotal < ecommerce.minOrderValue}
                              onClick={() => {
                                if (!customerToken) {
                                  // Require login to checkout
                                  setCartOpen(false);
                                  toast({
                                    title: "Login Required",
                                    description: "Please login or create an account to place an order",
                                  });
                                  setLocation(`/site/${subdomain}/login`);
                                } else {
                                  setCartOpen(false);
                                  setCheckoutOpen(true);
                                }
                              }}
                            >
                              {customerToken ? "Proceed to Checkout" : "Login to Checkout"}
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </SheetContent>
                </Sheet>
              )}
              
              {/* Checkout Dialog */}
              <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Complete Your Order</DialogTitle>
                    <DialogDescription>
                      Please fill in your details to complete the order
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-6">
                    {/* Order Summary */}
                    <div className="border rounded-lg p-4 bg-muted/50">
                      <h4 className="font-semibold mb-3">Order Summary</h4>
                      <div className="space-y-2 text-sm">
                        {cart.map((item) => (
                          <div key={`${item.type}-${item.id}`} className="flex justify-between">
                            <span>{item.name} × {item.quantity}</span>
                            <span>₹{(item.price * item.quantity).toLocaleString()}</span>
                          </div>
                        ))}
                        <Separator />
                        <div className="flex justify-between">
                          <span>Subtotal</span>
                          <span>₹{cartSubtotal.toLocaleString()}</span>
                        </div>
                        {cartTax > 0 && (
                          <div className="flex justify-between">
                            <span>Tax ({ecommerce.taxRate}%)</span>
                            <span>₹{cartTax.toLocaleString()}</span>
                          </div>
                        )}
                        <Separator />
                        <div className="flex justify-between font-bold text-base">
                          <span>Total</span>
                          <span style={{ color: primaryColor }}>₹{cartTotal.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Customer Info - Read Only for Authenticated Users */}
                    <div className="space-y-4">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-sm text-green-900 font-medium flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Logged in as {customerData?.name}
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="checkout-name">Name</Label>
                        <Input
                          id="checkout-name"
                          value={customerForm.name}
                          placeholder="Your full name"
                          disabled
                          className="bg-muted"
                        />
                      </div>

                      <div>
                        <Label htmlFor="checkout-email">Email</Label>
                        <Input
                          id="checkout-email"
                          type="email"
                          value={customerForm.email}
                          placeholder="your@email.com"
                          disabled
                          className="bg-muted"
                        />
                      </div>

                      <div>
                        <Label htmlFor="checkout-phone">Phone</Label>
                        <Input
                          id="checkout-phone"
                          type="tel"
                          value={customerForm.phone}
                          placeholder="+91 98765 43210"
                          disabled
                          className="bg-muted"
                        />
                      </div>

                      {/* Address Fields */}
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="checkout-address">
                            Street Address {ecommerce.requireAddress && <span className="text-red-500">*</span>}
                          </Label>
                          <Input
                            id="checkout-address"
                            value={customerForm.address}
                            onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                            placeholder="House/Flat number, Building, Street, Area"
                            required={ecommerce.requireAddress}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="checkout-city">
                              City {ecommerce.requireAddress && <span className="text-red-500">*</span>}
                            </Label>
                            <Input
                              id="checkout-city"
                              value={customerForm.city}
                              onChange={(e) => setCustomerForm({ ...customerForm, city: e.target.value })}
                              placeholder="City"
                              required={ecommerce.requireAddress}
                            />
                          </div>

                          <div>
                            <Label htmlFor="checkout-state">
                              State {ecommerce.requireAddress && <span className="text-red-500">*</span>}
                            </Label>
                            <Input
                              id="checkout-state"
                              value={customerForm.state}
                              onChange={(e) => setCustomerForm({ ...customerForm, state: e.target.value })}
                              placeholder="State"
                              required={ecommerce.requireAddress}
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="checkout-pincode">
                            Pincode {ecommerce.requireAddress && <span className="text-red-500">*</span>}
                          </Label>
                          <Input
                            id="checkout-pincode"
                            type="text"
                            value={customerForm.pincode}
                            onChange={(e) => setCustomerForm({ ...customerForm, pincode: e.target.value })}
                            placeholder="Pincode"
                            maxLength={6}
                            required={ecommerce.requireAddress}
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="checkout-notes">Special Instructions (Optional)</Label>
                        <Textarea
                          id="checkout-notes"
                          value={customerForm.notes}
                          onChange={(e) => setCustomerForm({ ...customerForm, notes: e.target.value })}
                          placeholder="Any special requests or delivery instructions?"
                          rows={3}
                        />
                      </div>
                    </div>

                    {/* Payment Methods */}
                    {ecommerce.paymentMethods && ecommerce.paymentMethods.length > 0 && (
                      <div>
                        <Label>Payment Method</Label>
                        <div className="mt-2 space-y-2">
                          {ecommerce.paymentMethods.filter((pm: any) => pm.enabled).map((pm: any) => (
                            <div key={pm.type} className="border rounded p-3">
                              <div className="font-medium capitalize">
                                {pm.type === 'cod' && '💵 Cash on Delivery'}
                                {pm.type === 'online' && '💳 Online Payment'}
                                {pm.type === 'bank_transfer' && '🏦 Bank Transfer'}
                              </div>
                              {pm.instructions && (
                                <p className="text-sm text-muted-foreground mt-1">{pm.instructions}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Submit Button */}
                    <Button
                      className="w-full"
                      size="lg"
                      style={{ backgroundColor: primaryColor, color: "white" }}
                      onClick={() => {
                        // Validation
                        if (!customerForm.name) {
                          toast({ title: "Error", description: "Name is required", variant: "destructive" });
                          return;
                        }
                        if (!customerForm.phone) {
                          toast({ title: "Error", description: "Phone number is required", variant: "destructive" });
                          return;
                        }
                        // Validate address fields
                        if (ecommerce.requireAddress) {
                          if (!customerForm.address || !customerForm.city || !customerForm.state || !customerForm.pincode) {
                            toast({ 
                              title: "Incomplete Address", 
                              description: "Please fill in all address fields (Street, City, State, Pincode)",
                              variant: "destructive" 
                            });
                            return;
                          }
                          if (customerForm.pincode.length !== 6 || !/^\d{6}$/.test(customerForm.pincode)) {
                            toast({ 
                              title: "Invalid Pincode", 
                              description: "Please enter a valid 6-digit pincode",
                              variant: "destructive" 
                            });
                            return;
                          }
                        }

                        // Submit order with both combined and separate address fields
                        const fullAddress = `${customerForm.address}, ${customerForm.city}, ${customerForm.state} - ${customerForm.pincode}`;
                        const orderData = {
                          customer: {
                            name: customerForm.name,
                            email: customerForm.email,
                            phone: customerForm.phone,
                            address: fullAddress,  // Combined for display
                            city: customerForm.city,       // Separate field
                            state: customerForm.state,     // Separate field
                            pincode: customerForm.pincode, // Separate field
                          },
                          items: cart,
                          subtotal: cartSubtotal,
                          tax: cartTax,
                          total: cartTotal,
                          notes: customerForm.notes,
                        };
                        console.log('🛒 Submitting order:', orderData);
                        console.log('🛒 Cart items:', cart);
                        console.log('🛒 Customer:', customerForm);
                        console.log('🔐 Auth token:', customerToken ? 'Present' : 'Missing');
                        submitOrderMutation.mutate(orderData);
                      }}
                      disabled={submitOrderMutation.isPending}
                    >
                      {submitOrderMutation.isPending ? "Placing Order..." : `Place Order - ₹${cartTotal.toLocaleString()}`}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Quotation Dialog - Guest User Friendly */}
              <Dialog open={quotationOpen} onOpenChange={setQuotationOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Request a Quote</DialogTitle>
                    <DialogDescription>
                      Fill in your details and we'll send you a detailed quotation
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-6">
                    {/* Items Summary */}
                    <div className="border rounded-lg p-4 bg-muted/50">
                      <h4 className="font-semibold mb-3">Items for Quote</h4>
                      <div className="space-y-2 text-sm">
                        {cart.map((item) => (
                          <div key={`${item.type}-${item.id}`} className="flex justify-between">
                            <span>{item.name} × {item.quantity}</span>
                            {ecommerce.showPrices && (
                              <span>₹{(item.price * item.quantity).toLocaleString()}</span>
                            )}
                          </div>
                        ))}
                        {ecommerce.showPrices && (
                          <>
                            <Separator />
                            <div className="flex justify-between font-bold text-base">
                              <span>Estimated Total</span>
                              <span style={{ color: primaryColor }}>₹{cartTotal.toLocaleString()}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Customer Form */}
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="quote-name">
                          Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="quote-name"
                          value={customerForm.name}
                          onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                          placeholder="Your full name"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="quote-email">Email</Label>
                        <Input
                          id="quote-email"
                          type="email"
                          value={customerForm.email}
                          onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                          placeholder="your@email.com"
                        />
                      </div>

                      <div>
                        <Label htmlFor="quote-phone">
                          Phone {ecommerce.requirePhone && <span className="text-red-500">*</span>}
                        </Label>
                        <Input
                          id="quote-phone"
                          type="tel"
                          value={customerForm.phone}
                          onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                          placeholder="+91 98765 43210"
                          required={ecommerce.requirePhone}
                        />
                      </div>

                      <div>
                        <Label htmlFor="quote-notes">Additional Requirements</Label>
                        <Input
                          id="quote-notes"
                          value={customerForm.notes}
                          onChange={(e) => setCustomerForm({ ...customerForm, notes: e.target.value })}
                          placeholder="Tell us more about your requirements..."
                        />
                      </div>
                    </div>

                    {/* Submit Button */}
                    <Button
                      className="w-full"
                      style={{ backgroundColor: primaryColor, color: "white" }}
                      onClick={() => {
                        // Validation
                        if (!customerForm.name) {
                          toast({ title: "Error", description: "Name is required", variant: "destructive" });
                          return;
                        }
                        if (ecommerce.requirePhone && !customerForm.phone) {
                          toast({ title: "Error", description: "Phone is required", variant: "destructive" });
                          return;
                        }

                        // Submit quotation request
                        submitQuotationMutation.mutate({
                          customer: customerForm,
                          items: cart,
                          estimatedTotal: ecommerce.showPrices ? cartTotal : null,
                          notes: customerForm.notes,
                        });
                      }}
                      disabled={submitQuotationMutation.isPending}
                    >
                      {submitQuotationMutation.isPending ? "Sending Request..." : "Request Quote"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              
              {/* Customer Authentication - Hide Login/Signup for quotation-only mode */}
              {ecommerce.mode !== 'quotation' && (() => {
                console.log('🎨 [Header] Rendering - customerData:', customerData);
                console.log('🎨 [Header] customerToken exists:', !!customerToken);
                return customerData ? (
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
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setLocation(`/site/${subdomain}/login`)}
                    >
                      <User className="h-4 w-4" />
                      <span className="ml-2 hidden sm:inline">Login</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLocation(`/site/${subdomain}/signup`)}
                    >
                      <span className="hidden sm:inline">Sign Up</span>
                      <span className="sm:hidden">Sign Up</span>
                    </Button>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with Auto-Scrolling Carousel */}
      <div id="home" className="relative overflow-hidden h-[500px] md:h-[650px] bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Carousel Images */}
        {heroMedia.length > 0 ? (
          <div className="absolute inset-0">
            {heroMedia.map((image: string, index: number) => (
              <div
                key={index}
                className="absolute inset-0 transition-opacity duration-1000"
                style={{
                  opacity: currentSlide === index ? 1 : 0,
                  backgroundImage: `url(${image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
            ))}
          </div>
        ) : (
          <div 
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
            }}
          />
        )}
        
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent"></div>
        
        {/* Hero Content */}
        <div className="relative h-full flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            {/* Elevated Card Container */}
            <div className="max-w-2xl">
              <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl" data-testid="card-hero-content">
                <CardContent className="p-8 md:p-12">
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 leading-tight" 
                      style={{ color: primaryColor }}
                      data-testid="text-business-name">
                    {businessInfo?.businessName}
                  </h1>
                  {businessInfo?.tagline && (
                    <p className="text-lg md:text-xl text-muted-foreground mb-6 leading-relaxed" 
                       data-testid="text-tagline">
                      {businessInfo.tagline}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-3">
                    <Button
                      size="lg"
                      className="font-semibold shadow-lg"
                      style={{ backgroundColor: primaryColor, color: "white" }}
                      onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })}
                      data-testid="button-get-quote"
                    >
                      <Send className="h-5 w-5 mr-2" />
                      Get Quote
                    </Button>
                    {contactInfo?.phone && (
                      <>
                        <Button
                          size="lg"
                          variant="outline"
                          className="font-semibold"
                          onClick={() => window.location.href = `tel:${contactInfo.phone}`}
                          style={{ borderColor: primaryColor, color: primaryColor }}
                          data-testid="button-call"
                        >
                          <Phone className="h-5 w-5 mr-2" />
                          Call
                        </Button>
                        <Button
                          size="lg"
                          className="font-semibold"
                          onClick={() => window.location.href = `https://wa.me/${contactInfo.phone.replace(/[^0-9]/g, '')}`}
                          style={{ backgroundColor: secondaryColor, color: "white" }}
                          data-testid="button-whatsapp"
                        >
                          WhatsApp
                        </Button>
                      </>
                    )}
                    {contactInfo?.googleMapsUrl && (
                      <Button
                        size="lg"
                        variant="outline"
                        className="font-semibold"
                        style={{ borderColor: secondaryColor, color: secondaryColor }}
                        onClick={() => window.open(contactInfo.googleMapsUrl, '_blank')}
                        data-testid="button-directions"
                      >
                        <Navigation className="h-5 w-5 mr-2" />
                        Get Directions
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Carousel Navigation Arrows */}
        {heroMedia.length > 1 && (
          <>
            <button
              onClick={() => setCurrentSlide((prev) => (prev === 0 ? heroMedia.length - 1 : prev - 1))}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all hover:scale-110"
              aria-label="Previous slide"
              data-testid="button-carousel-prev"
            >
              <ChevronLeft className="h-6 w-6" style={{ color: primaryColor }} />
            </button>
            <button
              onClick={() => setCurrentSlide((prev) => (prev + 1) % heroMedia.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all hover:scale-110"
              aria-label="Next slide"
              data-testid="button-carousel-next"
            >
              <ChevronRight className="h-6 w-6" style={{ color: primaryColor }} />
            </button>
          </>
        )}

        {/* Carousel Indicators */}
        {heroMedia.length > 1 && (
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2">
            {heroMedia.map((_: string, index: number) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-2 rounded-full transition-all ${
                  currentSlide === index 
                    ? 'w-8' 
                    : 'w-2 hover:w-4'
                }`}
                style={{
                  backgroundColor: currentSlide === index ? primaryColor : 'rgba(255,255,255,0.5)'
                }}
                aria-label={`Go to slide ${index + 1}`}
                data-testid={`indicator-slide-${index}`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        {/* About Section */}
        <section className="mb-24">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: primaryColor }}>
              About Us
            </h2>
            <p className="text-muted-foreground text-lg">
              Get to know our story and mission
            </p>
          </div>
          {businessInfo?.about ? (
            <Card className="shadow-lg border-0">
              <CardContent className="p-8 md:p-12">
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed text-center">
                  {businessInfo.about}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-lg border-0 text-center py-12" data-testid="empty-state-about">
              <CardContent>
                <Info className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg text-muted-foreground">
                  About section coming soon
                </p>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Business Hours */}
        <section className="mb-24">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: primaryColor }}>
              Business Hours
            </h2>
            <p className="text-muted-foreground text-lg">
              We're here to serve you during these hours
            </p>
          </div>
          {contactInfo?.workingHours && contactInfo.workingHours.some((h: any) => h.isOpen) ? (
            <Card className="shadow-lg">
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {contactInfo.workingHours.map((hour: any) => (
                    <div 
                      key={hour.day} 
                      className={`p-5 rounded-xl border-2 transition-all ${
                        hour.isOpen 
                          ? 'bg-gradient-to-br from-white to-slate-50 border-slate-200 hover:shadow-md' 
                          : 'bg-muted/50 border-muted opacity-60'
                      }`}
                      data-testid={`hours-${hour.day.toLowerCase()}`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-lg">{hour.day}</span>
                        <Badge 
                          variant={hour.isOpen ? "default" : "destructive"}
                          className="font-semibold"
                          style={hour.isOpen ? { backgroundColor: secondaryColor, color: "white" } : {}}
                        >
                          {hour.isOpen ? "Open" : "Closed"}
                        </Badge>
                      </div>
                      {hour.isOpen && (
                        <div className="mt-3 space-y-2">
                          {/* Support new slot-based structure and old structure */}
                          {hour.slots ? (
                            hour.slots.map((slot: any, index: number) => (
                              <div key={index} className="flex items-center gap-2 text-sm font-medium text-foreground">
                                <Clock className="h-4 w-4" style={{ color: primaryColor }} />
                                {slot.open} - {slot.close}
                              </div>
                            ))
                          ) : (
                            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                              <Clock className="h-4 w-4" style={{ color: primaryColor }} />
                              {hour.open} - {hour.close}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-lg text-center py-12" data-testid="empty-state-business-hours">
              <CardContent>
                <Clock className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg text-muted-foreground">
                  Business hours will be updated soon
                </p>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Active Coupons */}
        <section className="mb-24 py-12 md:py-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: primaryColor }}>
                Special Offers & Coupons
              </h2>
              <p className="text-muted-foreground text-lg">
                Save big with our exclusive deals
              </p>
            </div>
            {coupons.length > 0 && coupons.some((c: any) => c.isActive) ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {coupons.filter((c: any) => c.isActive).map((coupon: any, index: number) => (
                  <Card 
                    key={index} 
                    className="overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                    data-testid={`coupon-card-${index}`}
                  >
                    {/* Discount Badge - Large and Prominent */}
                    <div 
                      className="relative p-8 text-white"
                      style={{
                        background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
                      }}
                    >
                      <div className="text-center">
                        <div className="inline-block">
                          <div className="text-6xl md:text-7xl font-black mb-2">
                            {coupon.discountType === "percentage" 
                              ? `${coupon.discountValue}%` 
                              : `₹${coupon.discountValue}`}
                          </div>
                          <div className="text-xl font-bold uppercase tracking-wider">OFF</div>
                        </div>
                      </div>
                    </div>
                    
                    <CardHeader className="pb-4">
                      <CardTitle className="text-xl mb-2">{coupon.title}</CardTitle>
                      {coupon.description && (
                        <CardDescription className="text-base">{coupon.description}</CardDescription>
                      )}
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {/* Coupon Code */}
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border-2 border-dashed" 
                           style={{ borderColor: secondaryColor }}>
                        <span className="text-sm font-medium text-muted-foreground">Coupon Code:</span>
                        <Badge 
                          className="text-base px-4 py-1 font-mono font-bold"
                          style={{ backgroundColor: primaryColor, color: "white" }}
                        >
                          {coupon.code}
                        </Badge>
                      </div>
                      
                      {/* Validity */}
                      {coupon.validUntil && (
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Valid until {new Date(coupon.validUntil).toLocaleDateString('en-US', { 
                              day: 'numeric', 
                              month: 'short', 
                              year: 'numeric' 
                            })}
                          </span>
                        </div>
                      )}
                      
                      {/* CTA Button */}
                      <Button 
                        className="w-full font-semibold"
                        style={{ backgroundColor: secondaryColor, color: "white" }}
                        onClick={() => {
                          navigator.clipboard.writeText(coupon.code);
                          toast({ title: "Copied!", description: `Coupon code "${coupon.code}" copied to clipboard` });
                        }}
                        data-testid={`button-claim-${index}`}
                      >
                        Claim Offer
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="text-center py-12 shadow-lg" data-testid="empty-state-coupons">
                <CardContent>
                  <Tag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg text-muted-foreground mb-6">
                    No special offers available at the moment. Check back soon for exciting deals!
                  </p>
                  {data.services.length > 0 && (
                    <Button 
                      onClick={() => document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' })}
                      style={{ backgroundColor: primaryColor, color: "white" }}
                      data-testid="button-view-services"
                    >
                      View Our Services
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        {/* Services & Products */}
        <section className="mb-24">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: primaryColor }}>
              Our Offerings
            </h2>
            <p className="text-muted-foreground text-lg">
              Discover the range of services and products we offer
            </p>
          </div>
          
          <div className="mb-16" id="services-section">
            <h3 className="text-2xl md:text-3xl font-bold mb-8 text-center">Our Services</h3>
            {data.services.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {data.services.map((service) => (
                    <Card 
                      key={service.id} 
                      className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 overflow-hidden border-0 shadow-lg h-full flex flex-col"
                      data-testid={`service-card-${service.id}`}
                    >
                      <CardHeader className="text-center pb-4">
                        {/* Icon Circle */}
                        {service.icon && (
                          <div className="mb-4 mx-auto">
                            <div 
                              className="w-24 h-24 rounded-full flex items-center justify-center text-4xl shadow-lg group-hover:scale-110 transition-transform duration-300"
                              style={{ 
                                background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
                                color: "white"
                              }}
                            >
                              {service.icon}
                            </div>
                          </div>
                        )}
                        <CardTitle className="text-xl mb-2">{service.name}</CardTitle>
                        <CardDescription className="text-base">{service.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex-grow flex flex-col justify-end space-y-4">
                        {ecommerce.showPrices && (
                          <div className="text-center">
                            <div className="text-sm text-muted-foreground mb-1">Starting from</div>
                            <p className="text-3xl md:text-4xl font-black" style={{ color: primaryColor }}>
                              ₹{service.price.toLocaleString()}
                            </p>
                          </div>
                        )}
                        
                        {/* E-commerce buttons or Book Now */}
                        {ecommerce.enabled ? (
                          <div className="flex gap-2">
                            {(ecommerce.mode === 'cart' || ecommerce.mode === 'both') && (
                              <Button 
                                className="flex-1 font-semibold"
                                style={{ backgroundColor: primaryColor, color: "white" }}
                                onClick={() => {
                                  if (!customerToken) {
                                    toast({
                                      title: "Login Required",
                                      description: "Please login to add items to cart",
                                      variant: "destructive",
                                    });
                                    setLocation(`/site/${subdomain}/login`);
                                  } else {
                                    addToCart({
                                      type: 'service',
                                      id: service.id,
                                      name: service.name,
                                      price: service.price,
                                      vendorCatalogueId: service.id,
                                    });
                                  }
                                }}
                                data-testid={`button-add-cart-${service.id}`}
                              >
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                Add to Cart
                              </Button>
                            )}
                            {(ecommerce.mode === 'quotation' || ecommerce.mode === 'both') && (
                              <Button 
                                variant={ecommerce.mode === 'both' ? "outline" : "default"}
                                className="flex-1 font-semibold"
                                style={ecommerce.mode === 'quotation' ? { backgroundColor: primaryColor, color: "white" } : {}}
                                onClick={() => {
                                  // For quotation mode, no login required - allow guest users
                                  setCart([{
                                    type: 'service',
                                    id: service.id,
                                    name: service.name,
                                    price: service.price,
                                    vendorCatalogueId: service.id,
                                    quantity: 1,
                                  }]);
                                  setQuotationOpen(true);
                                }}
                                data-testid={`button-quote-${service.id}`}
                              >
                                <Tag className="h-4 w-4 mr-2" />
                                Request Quote
                              </Button>
                            )}
                          </div>
                        ) : (
                          <Button 
                            className="w-full font-semibold"
                            style={{ backgroundColor: primaryColor, color: "white" }}
                            onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })}
                            data-testid={`button-book-${service.id}`}
                          >
                            <Calendar className="h-4 w-4 mr-2" />
                            Book Now
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="text-center py-12 shadow-lg" data-testid="empty-state-services">
                  <CardContent>
                    <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg text-muted-foreground mb-6">
                      Our services catalog is being updated. Contact us to learn more about what we offer!
                    </p>
                    <Button 
                      onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })}
                      style={{ backgroundColor: primaryColor, color: "white" }}
                      data-testid="button-get-in-touch"
                    >
                      Get in Touch
                    </Button>
                  </CardContent>
                </Card>
              )}
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl md:text-3xl font-bold text-center flex-1">Our Products</h3>
              {data.products.length > 6 && (
                <Button
                  variant="outline"
                  onClick={() => setLocation(`/site/${subdomain}/products`)}
                  style={{ borderColor: primaryColor, color: primaryColor }}
                >
                  View All Products ({data.products.length})
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
            
            {/* Available Coupons Banner - Hidden in quotation mode */}
            {ecommerce.mode !== 'quotation' && data.coupons && data.coupons.length > 0 && (() => {
              const availableCoupons = data.coupons.filter((coupon: any) => {
                if (!coupon.isActive || coupon.status !== 'active') return false;
                if (new Date(coupon.expiryDate || coupon.validUntil) <= new Date()) return false;
                const applicableOn = coupon.applicableOn || 'all';
                return applicableOn === 'all' || applicableOn === 'online_only' || applicableOn === 'miniwebsite_only';
              });
              
              if (availableCoupons.length === 0) return null;
              
              return (
                <div className="mb-6 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <Tag className="h-5 w-5 text-green-600" />
                    <div className="flex-1">
                      <p className="font-semibold text-green-900">
                        {availableCoupons.length} Special Offer{availableCoupons.length > 1 ? 's' : ''} Available!
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
              );
            })()}
            
            {data.products.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                  {data.products.slice(0, 6).map((product) => (
                    <Card 
                      key={product.id} 
                      className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 overflow-hidden border-0 shadow-lg h-full flex flex-col cursor-pointer"
                      data-testid={`product-card-${product.id}`}
                      onClick={() => setLocation(`/site/${subdomain}/products/${product.id}`)}
                    >
                      {product.images && product.images.length > 0 && (
                        <div className="aspect-square overflow-hidden bg-muted">
                          <img 
                            src={product.images[0]} 
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xl">{product.name}</CardTitle>
                        <CardDescription className="text-base line-clamp-2">{product.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex-grow flex flex-col justify-end space-y-4">
                        {ecommerce.showPrices && (
                          <div>
                            <p className="text-3xl md:text-4xl font-black" style={{ color: primaryColor }}>
                              ₹{product.price.toLocaleString()}
                            </p>
                            {product.stock !== null && (
                              <div className="mt-2">
                                {product.stock > 0 ? (
                                  <Badge variant="outline" className="text-green-600 border-green-600">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    {product.stock} in stock
                                  </Badge>
                                ) : (
                                  <Badge variant="destructive">
                                    Out of stock
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* E-commerce buttons or Order Now */}
                        {ecommerce.enabled ? (
                          <div className="flex gap-2">
                            {(ecommerce.mode === 'cart' || ecommerce.mode === 'both') && (
                              <Button 
                                className="flex-1 font-semibold"
                                style={{ backgroundColor: primaryColor, color: "white" }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!customerToken) {
                                    toast({
                                      title: "Login Required",
                                      description: "Please login to add items to cart",
                                      variant: "destructive",
                                    });
                                    setLocation(`/site/${subdomain}/login`);
                                  } else {
                                    addToCart({
                                      type: 'product',
                                      id: product.id,
                                      name: product.name,
                                      price: product.price,
                                      vendorProductId: product.id,
                                    });
                                  }
                                }}
                                disabled={product.stock === 0}
                                data-testid={`button-add-cart-product-${product.id}`}
                              >
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
                              </Button>
                            )}
                            {(ecommerce.mode === 'quotation' || ecommerce.mode === 'both') && (
                              <Button 
                                variant={ecommerce.mode === 'both' ? "outline" : "default"}
                                className="flex-1 font-semibold"
                                style={ecommerce.mode === 'quotation' ? { backgroundColor: primaryColor, color: "white" } : {}}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // For quotation mode, no login required - allow guest users
                                  setCart([{
                                    type: 'product',
                                    id: product.id,
                                    name: product.name,
                                    price: product.price,
                                    vendorProductId: product.id,
                                    quantity: 1,
                                  }]);
                                  setQuotationOpen(true);
                                }}
                                disabled={product.stock === 0}
                                data-testid={`button-quote-product-${product.id}`}
                              >
                                <Tag className="h-4 w-4 mr-2" />
                                Request Quote
                              </Button>
                            )}
                          </div>
                        ) : null}
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {data.products.length > 6 && (
                  <div className="text-center mt-8">
                    <Button
                      size="lg"
                      onClick={() => setLocation(`/site/${subdomain}/products`)}
                      style={{ backgroundColor: primaryColor, color: "white" }}
                      className="min-w-[200px]"
                    >
                      View All {data.products.length} Products
                      <ChevronRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                )}
              </>
            ) : (
                <Card className="text-center py-12 shadow-lg" data-testid="empty-state-products">
                  <CardContent>
                    <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg text-muted-foreground mb-6">
                      Products catalog coming soon. Reach out to us for inquiries!
                    </p>
                    <Button 
                      onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })}
                      style={{ backgroundColor: primaryColor, color: "white" }}
                      data-testid="button-contact-us-products"
                    >
                      Contact Us
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
        </section>

        {/* Team Section - Only show if team data exists */}
        {team && team.length > 0 && (
          <section id="team" className="mb-24 py-12 md:py-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 to-slate-100">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: primaryColor }}>
                  Meet Our Team
                </h2>
                <p className="text-muted-foreground text-lg">
                  The talented people behind our success
                </p>
              </div>
              {team.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
                {team.map((member: any, index: number) => (
                  <Card 
                    key={index} 
                    className="group text-center border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
                    data-testid={`team-member-${index}`}
                  >
                    <CardContent className="p-6">
                      {member.photo ? (
                        <div className="relative mb-4 mx-auto w-28 h-28">
                          <img 
                            src={member.photo} 
                            alt={member.name} 
                            className="w-full h-full rounded-full object-cover border-4 shadow-lg group-hover:shadow-xl transition-shadow"
                            style={{ borderColor: secondaryColor }}
                          />
                        </div>
                      ) : (
                        <div className="relative mb-4 mx-auto w-28 h-28">
                          <div 
                            className="w-full h-full rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg group-hover:shadow-xl transition-shadow border-4 border-white"
                            style={{ 
                              background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
                            }}
                          >
                            {member.name.charAt(0)}
                          </div>
                        </div>
                      )}
                      <h3 className="font-bold text-lg mb-1">{member.name}</h3>
                      <p className="text-sm font-medium mb-2" style={{ color: primaryColor }}>
                        {member.role}
                      </p>
                      {member.bio && (
                        <p className="text-sm text-muted-foreground line-clamp-3">{member.bio}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : null}
            </div>
          </section>
        )}

        {/* Testimonials - Only show if testimonials data exists */}
        {testimonials && testimonials.length > 0 && (
          <section className="mb-24">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: primaryColor }}>
                What Our Customers Say
              </h2>
              <p className="text-muted-foreground text-lg">
                Hear from our satisfied customers
              </p>
            </div>
            {testimonials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {testimonials.map((testimonial: any, index: number) => (
                <Card 
                  key={index}
                  className="border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                  data-testid={`testimonial-${index}`}
                >
                  <CardContent className="p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-4">
                      {testimonial.customerPhoto ? (
                        <img 
                          src={testimonial.customerPhoto} 
                          alt={testimonial.customerName} 
                          className="w-14 h-14 rounded-full object-cover border-2 shadow-md"
                          style={{ borderColor: primaryColor }}
                        />
                      ) : (
                        <div 
                          className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md"
                          style={{ 
                            background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
                          }}
                        >
                          {testimonial.customerName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-lg">{testimonial.customerName}</p>
                        {testimonial.customerLocation && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {testimonial.customerLocation}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex mb-4" style={{ color: secondaryColor }}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-5 w-5 ${i < testimonial.rating ? 'fill-current' : 'fill-muted stroke-muted-foreground'}`} 
                        />
                      ))}
                    </div>
                    <p className="text-base text-muted-foreground leading-relaxed italic">
                      "{testimonial.reviewText}"
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : null}
          </section>
        )}

        {/* FAQs - Only show if FAQs data exists */}
        {faqs && faqs.length > 0 && (
          <section id="faqs" className="mb-24">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: primaryColor }}>
                Frequently Asked Questions
              </h2>
              <p className="text-muted-foreground text-lg">
                Find answers to common questions about our services
              </p>
            </div>
            {faqs.length > 0 ? (
            <Card className="shadow-lg border-0">
              <CardContent className="p-6 md:p-10">
                <Accordion type="single" collapsible className="w-full space-y-4">
                  {faqs.map((faq: any, index: number) => (
                    <AccordionItem 
                      key={index} 
                      value={`item-${index}`}
                      className="border-2 rounded-xl px-6 transition-all"
                      style={{ borderColor: 'transparent' }}
                      data-testid={`faq-item-${index}`}
                    >
                      <AccordionTrigger 
                        className="text-left font-bold text-lg hover:no-underline py-5"
                        style={{ color: primaryColor }}
                      >
                        <div className="flex items-start gap-3 pr-4">
                          <HelpCircle className="h-6 w-6 flex-shrink-0 mt-0.5" />
                          <span>{faq.question}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground text-base leading-relaxed pb-5 pl-9">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ) : null}
          </section>
        )}

        {/* Empty States */}
        {!businessInfo?.about && 
         (!contactInfo?.workingHours || !contactInfo.workingHours.some((h: any) => h.isOpen)) &&
         coupons.filter((c: any) => c.isActive).length === 0 &&
         data.services.length === 0 && 
         data.products.length === 0 &&
         team.length === 0 &&
         testimonials.length === 0 &&
         faqs.length === 0 && (
          <section className="mb-24 text-center">
            <Card className="shadow-lg border-0 py-16">
              <CardContent>
                <div className="max-w-md mx-auto">
                  <div 
                    className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
                    style={{ backgroundColor: primaryColor + "20" }}
                  >
                    <Info className="h-10 w-10" style={{ color: primaryColor }} />
                  </div>
                  <h3 className="text-2xl font-bold mb-3" style={{ color: primaryColor }}>
                    Website Under Construction
                  </h3>
                  <p className="text-muted-foreground text-lg mb-6">
                    This business is currently setting up their online presence. Check back soon to see their services, products, and more!
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Contact Form */}
        <section id="contact-form" className="mb-24">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: primaryColor }}>
              Get in Touch
            </h2>
            <p className="text-muted-foreground text-lg">
              Have questions? We'd love to hear from you
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contact Info */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-2xl">Contact Information</CardTitle>
                <CardDescription className="text-base">
                  Reach out to us through any of these channels
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {contactInfo?.email && (
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-slate-50 to-transparent hover:shadow-md transition-shadow">
                    <div 
                      className="p-3 rounded-xl shadow-sm"
                      style={{ backgroundColor: primaryColor, color: "white" }}
                    >
                      <Mail className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Email</p>
                      <p className="font-semibold text-lg">{contactInfo.email}</p>
                    </div>
                  </div>
                )}
                {contactInfo?.phone && (
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-slate-50 to-transparent hover:shadow-md transition-shadow">
                    <div 
                      className="p-3 rounded-xl shadow-sm"
                      style={{ backgroundColor: secondaryColor, color: "white" }}
                    >
                      <Phone className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Phone</p>
                      <p className="font-semibold text-lg">{contactInfo.phone}</p>
                    </div>
                  </div>
                )}
                {contactInfo?.address && (
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-slate-50 to-transparent hover:shadow-md transition-shadow">
                    <div 
                      className="p-3 rounded-xl shadow-sm"
                      style={{ backgroundColor: primaryColor, color: "white" }}
                    >
                      <MapPin className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Address</p>
                      <p className="font-semibold text-lg">{contactInfo.address}</p>
                    </div>
                  </div>
                )}
                {contactInfo?.googleMapsUrl && (
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full font-semibold"
                    onClick={() => window.open(contactInfo.googleMapsUrl, '_blank')}
                    style={{ borderColor: primaryColor, color: primaryColor }}
                    data-testid="button-view-map"
                  >
                    <MapPin className="h-5 w-5 mr-2" />
                    View on Google Maps
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Lead Form */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-2xl">Send us a Message</CardTitle>
                <CardDescription className="text-base">
                  Fill out the form below and we'll get back to you soon!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLeadSubmit} className="space-y-5">
                  <div>
                    <Input
                      placeholder="Your Name *"
                      value={leadForm.name}
                      onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                      required
                      className="h-12 text-base"
                      data-testid="input-name"
                    />
                  </div>
                  <div>
                    <Input
                      type="email"
                      placeholder="Your Email *"
                      value={leadForm.email}
                      onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                      required
                      className="h-12 text-base"
                      data-testid="input-email"
                    />
                  </div>
                  <div>
                    <Input
                      type="tel"
                      placeholder="Your Phone"
                      value={leadForm.phone}
                      onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                      className="h-12 text-base"
                      data-testid="input-phone"
                    />
                  </div>
                  <div>
                    <Textarea
                      placeholder="Your Message"
                      rows={5}
                      value={leadForm.message}
                      onChange={(e) => setLeadForm({ ...leadForm, message: e.target.value })}
                      className="text-base resize-none"
                      data-testid="input-message"
                    />
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full font-semibold text-base shadow-lg"
                    disabled={submitLeadMutation.isPending}
                    style={{ backgroundColor: primaryColor, color: "white" }}
                    data-testid="button-submit-lead"
                  >
                    {submitLeadMutation.isPending ? (
                      "Sending..."
                    ) : (
                      <>
                        <Send className="h-5 w-5 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>

      </div>

      {/* Footer with Vyora Branding */}
      <footer className="bg-muted py-12 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-lg mb-4">{businessInfo?.businessName}</h3>
              <p className="text-sm text-muted-foreground">
                {businessInfo?.tagline || contactInfo?.address}
              </p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Quick Links</h3>
              <div className="space-y-2">
                <a href="#home" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Home</a>
                {team.length > 0 && <a href="#team" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Team</a>}
                {faqs.length > 0 && <a href="#faqs" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">FAQs</a>}
                <a href="#contact-form" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</a>
              </div>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Connect</h3>
              <div className="space-y-2">
                {contactInfo?.phone && (
                  <p className="text-sm text-muted-foreground">Phone: {contactInfo.phone}</p>
                )}
                {contactInfo?.email && (
                  <p className="text-sm text-muted-foreground">Email: {contactInfo.email}</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="pt-8 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} {businessInfo?.businessName}. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Powered by{" "}
              <a 
                href="https://vyora.club" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-semibold hover:underline"
                style={{ color: primaryColor }}
              >
                Vyora
              </a>
              {" "}- Create your business website in minutes
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
