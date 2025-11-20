import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { 
  ShoppingCart, Search, User, CreditCard, Receipt, Trash2, Plus, Minus,
  Tag, Percent, DollarSign, Truck, Home as HomeIcon, FileText, Download,
  Share2, X, Check, ChevronRight, ChevronLeft, ArrowLeft
} from "lucide-react";
import type { VendorProduct, VendorCatalogue, Customer, Coupon, Bill, Vendor } from "@shared/schema";

interface CartItem {
  type: "product" | "service";
  id: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  productId?: string;
  serviceId?: string;
}

interface AdditionalCharge {
  id: string;
  type: string;
  label: string;
  baseAmount: number;
  gstRate: number;
  gstAmount: number;
  totalAmount: number;
}


import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";

export default function VendorPOS() {
  const { vendorId: authVendorId } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const billRef = useRef<HTMLDivElement>(null);
  
  const vendorIdMatch = location.match(/\/vendors\/([^\/]+)/);
  const vendorId = vendorIdMatch ? vendorIdMatch[1] : authVendorId;
  
  const [searchQuery, setSearchQuery] = useState("");
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<1 | 2 | 3 | 4>(1);
  const [completedBill, setCompletedBill] = useState<Bill | null>(null);
  
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [couponCode, setCouponCode] = useState("");
  
  const [discountType, setDiscountType] = useState<"none" | "percentage" | "fixed">("none");
  const [discountValue, setDiscountValue] = useState<string>("");
  
  const [additionalCharges, setAdditionalCharges] = useState<AdditionalCharge[]>([]);
  const [chargeType, setChargeType] = useState<string>("none");
  const [customChargeLabel, setCustomChargeLabel] = useState("");
  const [customChargeAmount, setCustomChargeAmount] = useState("");
  
  const [paymentType, setPaymentType] = useState<"full" | "partial" | "credit">("full");
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  
  const [billNotes, setBillNotes] = useState("");

  const { data: vendor } = useQuery<Vendor>({
    queryKey: [`/api/vendors/${vendorId}`],
    enabled: !!vendorId,
  });

  const { data: products = [] } = useQuery<VendorProduct[]>({
    queryKey: [`/api/vendors/${vendorId}/products`],
    enabled: !!vendorId,
  });

  const { data: services = [] } = useQuery<VendorCatalogue[]>({
    queryKey: [`/api/vendors/${vendorId}/catalogue`],
    enabled: !!vendorId,
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: [`/api/vendors/${vendorId}/customers`],
    enabled: !!vendorId,
  });

  const { data: coupons = [] } = useQuery<Coupon[]>({
    queryKey: [`/api/vendors/${vendorId}/coupons`],
    enabled: !!vendorId,
  });

  const createBillMutation = useMutation({
    mutationFn: async (billData: any) => {
      const res = await apiRequest("POST", `/api/vendors/${vendorId}/bills`, billData);
      return await res.json();
    },
    onSuccess: (bill) => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/bills`] });
      setCompletedBill(bill);
      setCheckoutStep(4);
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to create bill", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const addBillItemMutation = useMutation({
    mutationFn: async ({ billId, item }: { billId: string; item: any }) => {
      const res = await apiRequest("POST", `/api/bills/${billId}/items`, item);
      return await res.json();
    },
  });

  const recordPaymentMutation = useMutation({
    mutationFn: async ({ billId, payment }: { billId: string; payment: any }) => {
      const res = await apiRequest("POST", `/api/bills/${billId}/payments`, payment);
      return await res.json();
    },
  });

  const createLedgerTransactionMutation = useMutation({
    mutationFn: async (transaction: any) => {
      const res = await apiRequest("POST", `/api/vendors/${vendorId}/ledger-transactions`, transaction);
      return await res.json();
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const res = await apiRequest("POST", `/api/vendors/${vendorId}/orders`, orderData);
      return await res.json();
    },
  });

  const createOrderItemMutation = useMutation({
    mutationFn: async ({ orderId, item }: { orderId: string; item: any }) => {
      const res = await apiRequest("POST", `/api/orders/${orderId}/items`, item);
      return await res.json();
    },
  });

  const validateCouponMutation = useMutation({
    mutationFn: async (code: string) => {
      // Include vendorId and subtotal in the validation request
      const params = new URLSearchParams({
        vendorId: vendorId,
        subtotal: subtotal.toString()
      });
      const res = await apiRequest("GET", `/api/coupons/validate/${code}?${params}`);
      return await res.json();
    },
    onSuccess: (coupon: Coupon) => {
      setSelectedCoupon(coupon);
      const discount = coupon.discountType === "percentage" 
        ? `${coupon.discountValue}% off` 
        : `₹${coupon.discountValue} off`;
      toast({ 
        title: "Coupon applied successfully!",
        description: `${coupon.code} - ${discount}`
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Invalid coupon", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredServices = services.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCustomers = customers.filter((c) =>
    c.name?.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
    c.phone?.toLowerCase().includes(customerSearchQuery.toLowerCase())
  );

  const handleTapProduct = (product: VendorProduct) => {
    // ✅ VALIDATE STOCK BEFORE ADDING TO CART
    const existingItem = cartItems.find((item) => item.id === product.id);
    const currentQuantityInCart = existingItem ? existingItem.quantity : 0;
    const newQuantity = currentQuantityInCart + 1;
    
    // Check if product is out of stock
    if (product.stock === 0) {
      toast({
        title: "Out of stock",
        description: `${product.name} is currently out of stock`,
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
    
    console.log(`✅ [POS] Stock validation passed: ${product.name} (Available: ${product.stock}, In cart: ${currentQuantityInCart}, Adding: 1)`);
    
    if (existingItem) {
      setCartItems(cartItems.map((item) =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCartItems([
        ...cartItems,
        {
          type: "product",
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          unit: product.unit,
          productId: product.id,
        },
      ]);
    }
  };

  const handleTapService = (service: VendorCatalogue) => {
    const existingItem = cartItems.find((item) => item.id === service.id);
    if (existingItem) {
      setCartItems(cartItems.map((item) =>
        item.id === service.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCartItems([
        ...cartItems,
        {
          type: "service",
          id: service.id,
          name: service.name,
          price: service.price,
          quantity: 1,
          unit: "session",
          serviceId: service.id,
        },
      ]);
    }
  };

  const incrementQuantity = (itemId: string) => {
    // ✅ VALIDATE STOCK BEFORE INCREMENTING QUANTITY
    const cartItem = cartItems.find((item) => item.id === itemId);
    if (!cartItem) return;
    
    // Only validate stock for products (not services)
    if (cartItem.type === "product") {
      const product = products?.find(p => p.id === itemId);
      if (!product) {
        toast({
          title: "Product not found",
          description: "This product is no longer available",
          variant: "destructive",
        });
        return;
      }
      
      const newQuantity = cartItem.quantity + 1;
      
      // Check if incrementing would exceed available stock
      if (newQuantity > product.stock) {
        toast({
          title: "Insufficient stock",
          description: `Only ${product.stock} ${product.stock === 1 ? 'item' : 'items'} available`,
          variant: "destructive",
        });
        return;
      }
      
      console.log(`✅ [POS] Stock validation passed for increment: ${product.name} (Available: ${product.stock}, New quantity: ${newQuantity})`);
    }
    
    setCartItems(cartItems.map((item) =>
      item.id === itemId ? { ...item, quantity: item.quantity + 1 } : item
    ));
  };

  const decrementQuantity = (itemId: string) => {
    setCartItems(cartItems.map((item) =>
      item.id === itemId && item.quantity > 1
        ? { ...item, quantity: item.quantity - 1 }
        : item
    ));
  };

  const removeItem = (itemId: string) => {
    setCartItems(cartItems.filter((item) => item.id !== itemId));
  };

  const handleApplyCoupon = () => {
    if (couponCode.trim()) {
      validateCouponMutation.mutate(couponCode.trim().toUpperCase());
    }
  };

  const handleRemoveCoupon = () => {
    setSelectedCoupon(null);
    setCouponCode("");
  };

  const handleAddCharge = () => {
    if (chargeType === "none") return;
    
    const amount = parseFloat(customChargeAmount) || 0;
    const gstRate = chargeType === "custom" ? 18 : 18;
    const gstAmount = (amount * gstRate) / 100;
    const totalAmount = amount + gstAmount;

    const labels = {
      delivery: "Home Delivery",
      pickup: "Pick up from Home",
      custom: customChargeLabel || "Additional Charge",
    };

    const newCharge: AdditionalCharge = {
      id: Date.now().toString(),
      type: chargeType,
      label: labels[chargeType as keyof typeof labels] || "Charge",
      baseAmount: amount,
      gstRate,
      gstAmount,
      totalAmount,
    };

    setAdditionalCharges([...additionalCharges, newCharge]);
    setChargeType("none");
    setCustomChargeLabel("");
    setCustomChargeAmount("");
  };

  const removeCharge = (id: string) => {
    setAdditionalCharges(additionalCharges.filter((c) => c.id !== id));
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  let discountAmount = 0;
  if (selectedCoupon) {
    if (selectedCoupon.discountType === "percentage") {
      discountAmount = (subtotal * selectedCoupon.discountValue) / 100;
    } else {
      discountAmount = selectedCoupon.discountValue;
    }
  } else if (discountType === "percentage" && discountValue) {
    discountAmount = (subtotal * parseFloat(discountValue)) / 100;
  } else if (discountType === "fixed" && discountValue) {
    discountAmount = parseFloat(discountValue);
  }
  
  discountAmount = Math.min(discountAmount, subtotal);

  const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);
  const gstOnItems = subtotalAfterDiscount * 0.18;
  const additionalChargesTotal = additionalCharges.reduce((sum, charge) => sum + charge.totalAmount, 0);
  const grandTotal = subtotalAfterDiscount + gstOnItems + additionalChargesTotal;
  const totalItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      toast({ title: "Cart is empty", variant: "destructive" });
      return;
    }
    
    if (grandTotal <= 0) {
      toast({ title: "Invalid total amount", variant: "destructive" });
      return;
    }

    let amount = paymentType === "full" ? grandTotal : 
                 paymentType === "partial" ? parseFloat(paymentAmount) || 0 : 
                 0;
    
    if (paymentType === "partial") {
      if (amount < 0 || amount > grandTotal) {
        toast({ 
          title: "Invalid payment amount", 
          description: `Amount must be between ₹0 and ₹${grandTotal.toFixed(2)}`,
          variant: "destructive" 
        });
        return;
      }
    }
    
    amount = Math.max(0, Math.min(amount, grandTotal));

    const paymentStatus = amount >= grandTotal ? "paid" : 
                         amount > 0 ? "partial" : 
                         "credit";

    try {
      const billNumber = `BILL-${Date.now()}`;
      const orderNumber = `POS-${Date.now()}`;
      
      // Get customer details for order
      const selectedCustomer = selectedCustomerId && selectedCustomerId !== "walk-in" 
        ? customers.find(c => c.id === selectedCustomerId) 
        : null;

      const billData = {
        vendorId: vendorId,
        customerId: selectedCustomerId && selectedCustomerId !== "walk-in" ? selectedCustomerId : null,
        billNumber,
        subtotal: subtotal.toFixed(2),
        discountAmount: discountAmount.toFixed(2),
        discountPercentage: discountType === "percentage" ? parseInt(discountValue) || 0 : 0,
        discountType: selectedCoupon ? "coupon" : discountType === "none" ? null : discountType,
        couponId: selectedCoupon?.id || null,
        couponCode: selectedCoupon?.code || null,
        taxAmount: gstOnItems.toFixed(2),
        additionalCharges: additionalCharges,
        totalAmount: grandTotal.toFixed(2),
        paidAmount: amount.toFixed(2),
        dueAmount: (grandTotal - amount).toFixed(2),
        status: "completed",
        paymentStatus,
        paymentMethod: paymentType !== "credit" ? paymentMethod : null,
        notes: billNotes || null,
      };

      const bill: Bill = await createBillMutation.mutateAsync(billData);
      console.log('✅ [POS] Bill created:', bill.id);

      // Create order alongside bill for inventory and order tracking
      let createdOrder = null;
      if (selectedCustomer) {
        // Parse address components if they exist in customer record
        const customerCity = selectedCustomer.city || 'N/A';
        const customerState = selectedCustomer.state || 'N/A';
        const customerPincode = selectedCustomer.pincode || '000000';
        const customerAddress = selectedCustomer.address || 'Counter Sale';

        console.log('📍 [POS] Using customer address:', {
          address: customerAddress,
          city: customerCity,
          state: customerState,
          pincode: customerPincode
        });

        const orderData = {
          vendorId: vendorId,
          customerId: selectedCustomerId,
          customerName: selectedCustomer.name || 'Walk-in Customer',
          customerPhone: selectedCustomer.phone || '',
          customerEmail: selectedCustomer.email || null,
          deliveryAddress: customerAddress, // Use actual customer address
          city: customerCity, // Use actual city
          state: customerState, // Use actual state
          pincode: customerPincode, // Use actual pincode
          status: paymentStatus === "paid" ? "confirmed" : "pending", // Paid orders are confirmed
          paymentStatus: paymentStatus,
          paymentMethod: paymentType !== "credit" ? paymentMethod : "cod",
          subtotal: Math.round(subtotal),
          deliveryCharges: 0, // No delivery for POS
          totalAmount: Math.round(grandTotal),
          notes: billNotes || null,
          source: "pos", // Mark as POS order
          prescriptionRequired: false,
        };

        createdOrder = await createOrderMutation.mutateAsync(orderData);
        console.log('✅ [POS] Order created:', createdOrder.id);
      }

      // Add bill items and order items
      for (const item of cartItems) {
        // Create bill item
        await addBillItemMutation.mutateAsync({
          billId: bill.id,
          item: {
            itemType: item.type,
            productId: item.productId || null,
            serviceId: item.serviceId || null,
            itemName: item.name,
            quantity: item.quantity.toString(),
            unit: item.unit || "pcs",
            unitPrice: item.price.toFixed(2),
            totalPrice: (item.price * item.quantity).toFixed(2),
          },
        });

        // Create order item (only for products in orders with customer)
        if (createdOrder && item.type === "product" && item.productId) {
          await createOrderItemMutation.mutateAsync({
            orderId: createdOrder.id,
            item: {
              orderId: createdOrder.id,
              vendorProductId: item.productId, // Changed from productId to vendorProductId
              productName: item.name,
              productUnit: item.unit || "pcs",
              quantity: item.quantity,
              pricePerUnit: Math.round(item.price),
              totalPrice: Math.round(item.price * item.quantity),
            },
          });
        }
      }

      console.log('✅ [POS] Items added to bill' + (createdOrder ? ' and order' : ''));

      // Record payment
      if (amount > 0) {
        await recordPaymentMutation.mutateAsync({
          billId: bill.id,
          payment: {
            amount: amount.toFixed(2),
            paymentMethod,
          },
        });
        console.log('✅ [POS] Payment recorded:', amount);
      }

      // Record coupon usage
      if (selectedCoupon && selectedCustomerId && selectedCustomerId !== "walk-in") {
        try {
          await apiRequest("POST", "/api/coupon-usages", {
            couponId: selectedCoupon.id,
            customerId: selectedCustomerId,
            orderId: createdOrder?.id || null,
            discountAmount: Math.round(discountAmount),
          });
          console.log(`✅ [POS] Coupon usage recorded: ${selectedCoupon.code}`);
        } catch (error) {
          console.error('❌ [POS] Failed to record coupon usage:', error);
        }
      }

      // Create ledger transactions (HisabKitab integration)
      if (selectedCustomerId && selectedCustomerId !== "walk-in") {
        try {
          // Record money received (if any payment made)
          if (amount > 0) {
            await createLedgerTransactionMutation.mutateAsync({
              vendorId: vendorId,
              customerId: selectedCustomerId,
              type: "in", // Money IN (received from customer)
              amount: Math.round(amount), // ✅ Store in rupees (ledger uses rupees, not paisa)
              category: "product_sale",
              paymentMethod: paymentMethod || "cash",
              description: `POS Sale - Bill ${billNumber}${createdOrder ? ` / Order ${createdOrder.id}` : ''}`,
              note: cartItems.map(i => `${i.quantity}x ${i.name}`).join(", "),
              referenceType: createdOrder ? "order" : "bill",
              referenceId: createdOrder?.id || bill.id,
            });
            console.log('✅ [POS] Ledger entry created for payment received: ₹' + amount);
          }

          // Record credit/due amount if not fully paid
          if (grandTotal > amount) {
            const dueAmount = grandTotal - amount;
            await createLedgerTransactionMutation.mutateAsync({
              vendorId: vendorId,
              customerId: selectedCustomerId,
              type: "out", // Money OUT (credit given to customer)
              amount: Math.round(dueAmount), // ✅ Store in rupees (ledger uses rupees, not paisa)
              category: "other",
              paymentMethod: "credit",
              description: `Credit/Due - Bill ${billNumber}${createdOrder ? ` / Order ${createdOrder.id}` : ''}`,
              note: `Remaining amount to be paid: ₹${dueAmount.toFixed(2)}`,
              referenceType: createdOrder ? "order" : "bill",
              referenceId: createdOrder?.id || bill.id,
            });
            console.log('✅ [POS] Ledger entry created for credit/due amount: ₹' + dueAmount);
          }
        } catch (ledgerError) {
          console.error('❌ [POS] Failed to create ledger transactions:', ledgerError);
          // Don't fail checkout if ledger fails
        }
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/orders`] });
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/analytics`] });
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/ledger-transactions`] });
      if (selectedCustomerId && selectedCustomerId !== "walk-in") {
        queryClient.invalidateQueries({ queryKey: [`/api/customers/${selectedCustomerId}/ledger-balance`] });
      }

      toast({ 
        title: "✅ Checkout Successful!", 
        description: `Bill ${billNumber}${createdOrder ? ` & Order ${createdOrder.id}` : ''} created` 
      });
      
      console.log('✅ [POS] Checkout complete - Bill, Order, and Ledger all updated');
    } catch (error) {
      console.error("❌ [POS] Checkout error:", error);
      toast({ 
        title: "Checkout failed", 
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive" 
      });
    }
  };

  const handleDownloadBill = () => {
    if (billRef.current) {
      const printWindow = window.open('', '', 'height=600,width=800');
      if (printWindow) {
        printWindow.document.write('<html><head><title>Bill</title>');
        printWindow.document.write('<style>body{font-family:Arial,sans-serif;padding:20px;}table{width:100%;border-collapse:collapse;}th,td{padding:8px;text-align:left;border-bottom:1px solid #ddd;}.total{font-weight:bold;font-size:18px;}.header{text-align:center;margin-bottom:20px;}.branding{text-align:center;margin-top:30px;color:#666;font-size:12px;}</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write(billRef.current.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const handleShareWhatsApp = () => {
    if (!completedBill) return;
    
    const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
    const billText = `
*Bill ${completedBill.billNumber}*
${vendor?.businessName || "Vyora"}

Customer: ${selectedCustomer?.name || "Walk-in"}
Date: ${new Date(completedBill.billDate).toLocaleDateString()}

Items:
${cartItems.map(item => `${item.name} x ${item.quantity} = ₹${(item.price * item.quantity).toFixed(2)}`).join('\n')}

Subtotal: ₹${subtotal.toFixed(2)}
${discountAmount > 0 ? `Discount: -₹${discountAmount.toFixed(2)}\n` : ''}GST (18%): ₹${gstOnItems.toFixed(2)}
${additionalCharges.length > 0 ? additionalCharges.map(c => `${c.label}: ₹${c.totalAmount.toFixed(2)}`).join('\n') + '\n' : ''}
*Grand Total: ₹${grandTotal.toFixed(2)}*
Paid: ₹${parseFloat(completedBill.paidAmount).toFixed(2)}
${parseFloat(completedBill.dueAmount) > 0 ? `Due: ₹${parseFloat(completedBill.dueAmount).toFixed(2)}` : ''}

Powered by Vyora
    `.trim();

    const phone = selectedCustomer?.phone || "";
    const url = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(billText)}`;
    window.open(url, '_blank');
  };

  const resetCheckout = () => {
    setCartItems([]);
    setSelectedCustomerId("");
    setSelectedCoupon(null);
    setCouponCode("");
    setDiscountType("none");
    setDiscountValue("");
    setAdditionalCharges([]);
    setPaymentType("full");
    setPaymentAmount("");
    setBillNotes("");
    setCheckoutStep(1);
    setCompletedBill(null);
    setShowCheckoutDialog(false);
  };

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  // Show loading state while vendorId is being loaded
  if (!vendorId) {

    // Show loading while vendor ID initializes
    if (!vendorId) { return <LoadingSpinner />; }

    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="h-4 bg-muted rounded w-48"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col p-2 md:p-4 gap-2 md:gap-4 pb-16 md:pb-2">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/vendor/dashboard")}
            className="md:hidden flex-shrink-0"
            data-testid="button-back-to-dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl md:text-3xl font-bold">Point of Sale</h1>
            <p className="text-xs md:text-sm text-muted-foreground hidden md:block">Fast checkout for products & services</p>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
            <SelectTrigger className="w-[180px] md:w-[200px]" data-testid="select-customer">
              <SelectValue placeholder="Select customer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="walk-in">Walk-in Customer</SelectItem>
              {customers.map((customer: Customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.name} - {customer.phone}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customer..."
              value={customerSearchQuery}
              onChange={(e) => setCustomerSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-customer"
            />
            {customerSearchQuery && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                <div 
                  className="p-2 hover:bg-muted cursor-pointer"
                  onClick={() => {
                    setSelectedCustomerId("walk-in");
                    setCustomerSearchQuery("");
                  }}
                >
                  <div className="font-medium">Walk-in Customer</div>
                </div>
                {filteredCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    className="p-2 hover:bg-muted cursor-pointer"
                    onClick={() => {
                      setSelectedCustomerId(customer.id);
                      setCustomerSearchQuery("");
                    }}
                  >
                    <div className="font-medium">{customer.name}</div>
                    <div className="text-sm text-muted-foreground">{customer.phone}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {selectedCustomer && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {selectedCustomer.name}
              <X
                className="h-3 w-3 cursor-pointer ml-1"
                onClick={() => setSelectedCustomerId("")}
                data-testid="button-clear-customer"
              />
            </Badge>
          )}
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-2 md:gap-4 overflow-hidden pb-32 lg:pb-0">
        <div className="lg:col-span-2 flex flex-col gap-2 md:gap-4 overflow-hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products or services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-pos"
            />
          </div>

          <Tabs defaultValue="products" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="products" data-testid="tab-products">
                Products ({filteredProducts.length})
              </TabsTrigger>
              <TabsTrigger value="services" data-testid="tab-services">
                Services ({filteredServices.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="products" className="flex-1 overflow-y-auto mt-2 md:mt-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-2 md:gap-3">
                {filteredProducts.map((product) => {
                  const inCart = cartItems.find((item) => item.id === product.id);
                  return (
                    <Card
                      key={product.id}
                      className="cursor-pointer hover-elevate active-elevate-2 transition-all"
                      onClick={() => handleTapProduct(product)}
                      data-testid={`card-product-${product.id}`}
                    >
                      <CardHeader className="pb-1 md:pb-2">
                        <CardTitle className="text-sm md:text-base flex items-center justify-between">
                          <span className="truncate">{product.name}</span>
                          {inCart && (
                            <Badge variant="default" className="ml-1 text-xs">
                              {inCart.quantity}
                            </Badge>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-1">
                        <div className="text-base md:text-lg font-bold text-primary">₹{product.price}</div>
                        <div className="text-xs md:text-sm text-muted-foreground">{product.unit}</div>
                        {product.stock > 0 ? (
                          <div className="text-xs text-green-600 mt-0.5">Stock: {product.stock}</div>
                        ) : (
                          <div className="text-xs text-red-600 mt-0.5">Out of stock</div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="services" className="flex-1 overflow-y-auto mt-2 md:mt-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-2 md:gap-3">
                {filteredServices.map((service) => {
                  const inCart = cartItems.find((item) => item.id === service.id);
                  return (
                    <Card
                      key={service.id}
                      className="cursor-pointer hover-elevate active-elevate-2 transition-all"
                      onClick={() => handleTapService(service)}
                      data-testid={`card-service-${service.id}`}
                    >
                      <CardHeader className="pb-1 md:pb-2">
                        <CardTitle className="text-sm md:text-base flex items-center justify-between">
                          <span className="truncate">{service.name}</span>
                          {inCart && (
                            <Badge variant="default" className="ml-1 text-xs">
                              {inCart.quantity}
                            </Badge>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-1">
                        <div className="text-base md:text-lg font-bold text-primary">₹{service.price}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{service.category}</div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <Card className="hidden lg:flex flex-col overflow-hidden">
          <CardHeader className="pb-2 flex-shrink-0">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Cart ({totalItemCount})
            </CardTitle>
          </CardHeader>
          <Separator className="flex-shrink-0" />
          <CardContent className="flex-1 overflow-y-auto pt-4 min-h-0">
            {cartItems.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>Tap products/services to add</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-2 pb-2 border-b" data-testid={`cart-item-${item.id}`}>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate text-sm">{item.name}</div>
                      <div className="text-xs text-muted-foreground">₹{item.price} × {item.quantity}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => decrementQuantity(item.id)}
                        data-testid={`button-decrease-${item.id}`}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center text-sm">{item.quantity}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => incrementQuantity(item.id)}
                        data-testid={`button-increase-${item.id}`}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-destructive"
                        onClick={() => removeItem(item.id)}
                        data-testid={`button-remove-${item.id}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="font-bold text-sm">₹{(item.price * item.quantity).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <Separator className="flex-shrink-0" />
          <div className="p-4 space-y-2 flex-shrink-0">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount:</span>
                <span>-₹{discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">GST (18%):</span>
              <span>₹{gstOnItems.toFixed(2)}</span>
            </div>
            {additionalCharges.map((charge) => (
              <div key={charge.id} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{charge.label}:</span>
                <span>₹{charge.totalAmount.toFixed(2)}</span>
              </div>
            ))}
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>₹{grandTotal.toFixed(2)}</span>
            </div>
            <Button
              className="w-full"
              size="lg"
              disabled={cartItems.length === 0}
              onClick={() => setShowCheckoutDialog(true)}
              data-testid="button-checkout"
            >
              <Receipt className="mr-2 h-4 w-4" />
              Checkout
            </Button>
          </div>
        </Card>
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg z-50">
        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <ShoppingCart className="h-4 w-4" />
                <span className="font-semibold text-sm">{totalItemCount} items</span>
              </div>
              <div className="text-lg font-bold">₹{grandTotal.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">incl. tax & charges</div>
            </div>
            <Button
              size="lg"
              disabled={cartItems.length === 0}
              onClick={() => setShowCheckoutDialog(true)}
              data-testid="button-checkout-mobile"
              className="min-w-[120px]"
            >
              <Receipt className="mr-2 h-4 w-4" />
              Checkout
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={showCheckoutDialog} onOpenChange={(open) => {
        if (!open) resetCheckout();
        setShowCheckoutDialog(open);
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-checkout">
          <DialogHeader>
            <DialogTitle>
              {checkoutStep === 1 && "Review Items"}
              {checkoutStep === 2 && "Discounts & Charges"}
              {checkoutStep === 3 && "Payment"}
              {checkoutStep === 4 && "Bill Created"}
            </DialogTitle>
          </DialogHeader>

          {checkoutStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Cart Items</h3>
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-2 bg-muted rounded">
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-muted-foreground">
                        ₹{item.price} × {item.quantity} {item.unit}
                      </div>
                    </div>
                    <div className="font-bold">₹{(item.price * item.quantity).toFixed(2)}</div>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Subtotal:</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
            </div>
          )}

          {checkoutStep === 2 && (
            <div className="space-y-4">
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Apply Coupon
                </h3>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    disabled={!!selectedCoupon}
                  />
                  {!selectedCoupon ? (
                    <Button onClick={handleApplyCoupon} disabled={!couponCode}>
                      Apply
                    </Button>
                  ) : (
                    <Button onClick={handleRemoveCoupon} variant="destructive">
                      Remove
                    </Button>
                  )}
                </div>
                {selectedCoupon && (
                  <div className="p-2 bg-green-50 border border-green-200 rounded flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm">
                      {selectedCoupon.code} - {selectedCoupon.description}
                    </span>
                  </div>
                )}
              </div>

              {!selectedCoupon && (
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Percent className="h-4 w-4" />
                    Manual Discount
                  </h3>
                  <RadioGroup value={discountType} onValueChange={(v) => setDiscountType(v as any)}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="none" id="no-discount" />
                      <Label htmlFor="no-discount">No Discount</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="percentage" id="percentage" />
                      <Label htmlFor="percentage">Percentage</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="fixed" id="fixed" />
                      <Label htmlFor="fixed">Fixed Amount</Label>
                    </div>
                  </RadioGroup>
                  {discountType !== "none" && (
                    <Input
                      type="number"
                      placeholder={discountType === "percentage" ? "Enter %" : "Enter amount"}
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                    />
                  )}
                </div>
              )}

              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Additional Charges
                </h3>
                <Select value={chargeType} onValueChange={setChargeType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select charge type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No additional charge</SelectItem>
                    <SelectItem value="delivery">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        Home Delivery
                      </div>
                    </SelectItem>
                    <SelectItem value="pickup">
                      <div className="flex items-center gap-2">
                        <HomeIcon className="h-4 w-4" />
                        Pick up from Home
                      </div>
                    </SelectItem>
                    <SelectItem value="custom">Custom Charge</SelectItem>
                  </SelectContent>
                </Select>
                
                {chargeType !== "none" && (
                  <div className="space-y-2">
                    {chargeType === "custom" && (
                      <Input
                        placeholder="Charge label (e.g., Packaging)"
                        value={customChargeLabel}
                        onChange={(e) => setCustomChargeLabel(e.target.value)}
                      />
                    )}
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Amount (excluding GST)"
                        value={customChargeAmount}
                        onChange={(e) => setCustomChargeAmount(e.target.value)}
                      />
                      <Button onClick={handleAddCharge}>Add</Button>
                    </div>
                  </div>
                )}

                {additionalCharges.map((charge) => (
                  <div key={charge.id} className="flex justify-between items-center p-2 bg-muted rounded">
                    <div>
                      <div className="font-medium">{charge.label}</div>
                      <div className="text-sm text-muted-foreground">
                        ₹{charge.baseAmount.toFixed(2)} + GST {charge.gstRate}% (₹{charge.gstAmount.toFixed(2)})
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">₹{charge.totalAmount.toFixed(2)}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => removeCharge(charge.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Notes
                </h3>
                <Textarea
                  placeholder="Add notes to this bill..."
                  value={billNotes}
                  onChange={(e) => setBillNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <Separator />
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span>-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>GST (18%):</span>
                  <span>₹{gstOnItems.toFixed(2)}</span>
                </div>
                {additionalCharges.map((charge) => (
                  <div key={charge.id} className="flex justify-between text-sm">
                    <span>{charge.label}:</span>
                    <span>₹{charge.totalAmount.toFixed(2)}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Grand Total:</span>
                  <span>₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {checkoutStep === 3 && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded text-center">
                <div className="text-3xl font-bold">₹{grandTotal.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">Total Amount</div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold">Payment Type</h3>
                <RadioGroup value={paymentType} onValueChange={(v) => setPaymentType(v as any)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="full" id="full" />
                    <Label htmlFor="full">Full Payment (₹{grandTotal.toFixed(2)})</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="partial" id="partial" />
                    <Label htmlFor="partial">Partial Payment</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="credit" id="credit" />
                    <Label htmlFor="credit">Credit (Pay Later)</Label>
                  </div>
                </RadioGroup>

                {paymentType === "partial" && (
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                  />
                )}
              </div>

              {paymentType !== "credit" && (
                <div className="space-y-3">
                  <h3 className="font-semibold">Payment Method</h3>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="wallet">Wallet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {paymentType === "partial" && paymentAmount && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <div className="flex justify-between text-sm">
                    <span>Paying Now:</span>
                    <span className="font-bold">₹{parseFloat(paymentAmount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Remaining:</span>
                    <span className="font-bold">₹{(grandTotal - parseFloat(paymentAmount)).toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {checkoutStep === 4 && completedBill && (
            <div className="space-y-4">
              <div className="text-center p-6 bg-green-50 border border-green-200 rounded">
                <Check className="h-16 w-16 text-green-600 mx-auto mb-2" />
                <h3 className="text-xl font-bold text-green-800">Bill Created Successfully!</h3>
                <p className="text-sm text-green-600">Bill #{completedBill.billNumber}</p>
              </div>

              <div ref={billRef} className="p-6 border rounded bg-white">
                <div className="header text-center mb-4">
                  <h2 className="text-2xl font-bold">{vendor?.businessName || "Vyora"}</h2>
                  <p className="text-sm">{vendor?.address || "Business Address"}</p>
                  <p className="text-sm">{vendor?.phone || "Contact Number"}</p>
                </div>

                <Separator className="my-4" />

                <div className="flex justify-between mb-4">
                  <div>
                    <p className="font-bold">Bill #: {completedBill.billNumber}</p>
                    <p className="text-sm">Date: {new Date(completedBill.billDate).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">Customer</p>
                    <p className="text-sm">{selectedCustomer?.name || "Walk-in"}</p>
                    {selectedCustomer?.phone && <p className="text-sm">{selectedCustomer.phone}</p>}
                  </div>
                </div>

                <table className="w-full mb-4">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Item</th>
                      <th className="text-right p-2">Qty</th>
                      <th className="text-right p-2">Price</th>
                      <th className="text-right p-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cartItems.map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="p-2">{item.name}</td>
                        <td className="text-right p-2">{item.quantity} {item.unit}</td>
                        <td className="text-right p-2">₹{item.price.toFixed(2)}</td>
                        <td className="text-right p-2">₹{(item.price * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount:</span>
                      <span>-₹{discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>GST (18%):</span>
                    <span>₹{gstOnItems.toFixed(2)}</span>
                  </div>
                  {additionalCharges.map((charge) => (
                    <div key={charge.id} className="flex justify-between">
                      <span>{charge.label}:</span>
                      <span>₹{charge.totalAmount.toFixed(2)}</span>
                    </div>
                  ))}
                  <Separator className="my-2" />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Grand Total:</span>
                    <span>₹{grandTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Paid:</span>
                    <span>₹{parseFloat(completedBill.paidAmount).toFixed(2)}</span>
                  </div>
                  {parseFloat(completedBill.dueAmount) > 0 && (
                    <div className="flex justify-between text-red-600 font-bold">
                      <span>Due:</span>
                      <span>₹{parseFloat(completedBill.dueAmount).toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {billNotes && (
                  <div className="mt-4 p-2 bg-gray-50 rounded">
                    <p className="text-sm font-semibold">Notes:</p>
                    <p className="text-sm">{billNotes}</p>
                  </div>
                )}

                <div className="branding mt-6 text-center text-sm text-gray-500">
                  Powered by <span className="font-bold">Vyora</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleDownloadBill} className="flex-1">
                  <Download className="mr-2 h-4 w-4" />
                  Download Bill
                </Button>
                {selectedCustomer && (
                  <Button onClick={handleShareWhatsApp} variant="outline" className="flex-1">
                    <Share2 className="mr-2 h-4 w-4" />
                    Share on WhatsApp
                  </Button>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            {checkoutStep > 1 && checkoutStep < 4 && (
              <Button variant="outline" onClick={() => setCheckoutStep((checkoutStep - 1) as any)}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            )}
            {checkoutStep < 3 && (
              <Button onClick={() => setCheckoutStep((checkoutStep + 1) as any)}>
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
            {checkoutStep === 3 && (
              <Button 
                onClick={handleCheckout} 
                disabled={createBillMutation.isPending}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                {createBillMutation.isPending ? "Processing..." : "Complete Payment"}
              </Button>
            )}
            {checkoutStep === 4 && (
              <Button onClick={resetCheckout}>
                New Bill
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
