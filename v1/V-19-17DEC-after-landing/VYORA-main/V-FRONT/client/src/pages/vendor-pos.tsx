import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { 
  ShoppingCart, Search, User, CreditCard, Receipt, Trash2, Plus, Minus,
  Tag, Percent, FileText, Download,
  Share2, X, Check, ChevronRight, ChevronLeft, ArrowLeft, Package,
  Scissors, Clock, Store,
  CheckCircle2, Sparkles, IndianRupee, PlusCircle
} from "lucide-react";
import type { VendorProduct, VendorCatalogue, Customer, Coupon, Bill, Vendor } from "@shared/schema";
import { format } from "date-fns";

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/AuthGuard";

interface CartItem {
  type: "product" | "service";
  id: string;
  name: string;
  price: number; // GST included price
  quantity: number;
  unit: string;
  productId?: string;
  serviceId?: string;
  image?: string;
  duration?: number;
}

interface AdditionalService {
  id: string;
  name: string;
  description: string;
  amount: number;
  gstRate: number;
  gstAmount: number;
  totalAmount: number;
}

export default function VendorPOS() {
  const { vendorId: authVendorId } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const billRef = useRef<HTMLDivElement>(null);
  
  const vendorIdMatch = location.match(/\/vendors\/([^\/]+)/);
  const vendorId = vendorIdMatch ? vendorIdMatch[1] : authVendorId;
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("walk-in");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [activeTab, setActiveTab] = useState("products");
  
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<1 | 2 | 3 | 4>(1);
  const [completedBill, setCompletedBill] = useState<Bill | null>(null);
  
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [couponCode, setCouponCode] = useState("");
  
  const [discountType, setDiscountType] = useState<"none" | "percentage" | "fixed">("none");
  const [discountValue, setDiscountValue] = useState<string>("");
  
  // Additional services state
  const [additionalServices, setAdditionalServices] = useState<AdditionalService[]>([]);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceDesc, setNewServiceDesc] = useState("");
  const [newServiceAmount, setNewServiceAmount] = useState("");
  const [showAddService, setShowAddService] = useState(false);
  
  const [paymentType, setPaymentType] = useState<"full" | "partial" | "credit">("full");
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  
  const [billNotes, setBillNotes] = useState("");
  const [showCart, setShowCart] = useState(false);

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

  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      const res = await apiRequest("POST", `/api/vendors/${vendorId}/bookings`, bookingData);
      return await res.json();
    },
  });

  const validateCouponMutation = useMutation({
    mutationFn: async (code: string) => {
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
        title: "Coupon applied!",
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

  const handleTapProduct = (product: VendorProduct) => {
    const existingItem = cartItems.find((item) => item.id === product.id);
    const currentQuantityInCart = existingItem ? existingItem.quantity : 0;
    const newQuantity = currentQuantityInCart + 1;
    
    if (product.stock === 0) {
      toast({
        title: "Out of stock",
        description: `${product.name} is currently out of stock`,
        variant: "destructive",
      });
      return;
    }
    
    if (newQuantity > product.stock) {
      toast({
        title: "Insufficient stock",
        description: `Only ${product.stock} available`,
        variant: "destructive",
      });
      return;
    }
    
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
          price: product.price, // GST already included
          quantity: 1,
          unit: product.unit,
          productId: product.id,
          image: product.imageUrl || undefined,
        },
      ]);
    }
    
    toast({ title: `Added ${product.name}`, duration: 1000 });
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
          price: service.price, // GST already included
          quantity: 1,
          unit: "session",
          serviceId: service.id,
          image: service.imageUrl || undefined,
          duration: service.duration || 30,
        },
      ]);
    }
    
    toast({ title: `Added ${service.name}`, duration: 1000 });
  };

  const incrementQuantity = (itemId: string) => {
    const cartItem = cartItems.find((item) => item.id === itemId);
    if (!cartItem) return;
    
    if (cartItem.type === "product") {
      const product = products?.find(p => p.id === itemId);
      if (!product) return;
      
      const newQuantity = cartItem.quantity + 1;
      if (newQuantity > product.stock) {
        toast({
          title: "Insufficient stock",
          description: `Only ${product.stock} available`,
          variant: "destructive",
        });
        return;
      }
    }
    
    setCartItems(cartItems.map((item) =>
      item.id === itemId ? { ...item, quantity: item.quantity + 1 } : item
    ));
  };

  const decrementQuantity = (itemId: string) => {
    const cartItem = cartItems.find((item) => item.id === itemId);
    if (!cartItem) return;
    
    if (cartItem.quantity === 1) {
      removeItem(itemId);
    } else {
    setCartItems(cartItems.map((item) =>
        item.id === itemId ? { ...item, quantity: item.quantity - 1 } : item
    ));
    }
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

  const handleAddService = () => {
    if (!newServiceName || !newServiceAmount) return;
    
    const amount = parseFloat(newServiceAmount) || 0;
    const gstRate = 18;
    const gstAmount = (amount * gstRate) / 100;
    const totalAmount = amount + gstAmount;

    const newService: AdditionalService = {
      id: Date.now().toString(),
      name: newServiceName,
      description: newServiceDesc,
      amount,
      gstRate,
      gstAmount,
      totalAmount,
    };

    setAdditionalServices([...additionalServices, newService]);
    setNewServiceName("");
    setNewServiceDesc("");
    setNewServiceAmount("");
    setShowAddService(false);
  };

  const removeAdditionalService = (id: string) => {
    setAdditionalServices(additionalServices.filter((s) => s.id !== id));
  };

  // Prices are GST inclusive - no additional GST calculation
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
  // Additional services total (with their own GST)
  const additionalServicesTotal = additionalServices.reduce((sum, s) => sum + s.totalAmount, 0);
  // Grand total: items (GST included) + additional services (with GST)
  const grandTotal = subtotalAfterDiscount + additionalServicesTotal;
  const totalItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const productItems = cartItems.filter(item => item.type === "product");
  const serviceItems = cartItems.filter(item => item.type === "service");

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
      
      // Use "Walk-in Customer" for walk-in sales
      const isWalkIn = !selectedCustomerId || selectedCustomerId === "walk-in";
      const selectedCustomer = !isWalkIn ? customers.find(c => c.id === selectedCustomerId) : null;
      const customerName = selectedCustomer?.name || "Walk-in Customer";

      const billData = {
        vendorId: vendorId,
        customerId: !isWalkIn ? selectedCustomerId : null,
        billNumber,
        subtotal: subtotal.toFixed(2),
        discountAmount: discountAmount.toFixed(2),
        discountPercentage: discountType === "percentage" ? parseInt(discountValue) || 0 : 0,
        discountType: selectedCoupon ? "coupon" : discountType === "none" ? null : discountType,
        couponId: selectedCoupon?.id || null,
        couponCode: selectedCoupon?.code || null,
        taxAmount: "0", // GST already included in prices
        additionalCharges: additionalServices,
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

      // Create order for products (auto-confirmed) - even for walk-in customers
      let createdOrder = null;
      if (productItems.length > 0) {
        const orderData = {
          vendorId: vendorId,
          customerId: !isWalkIn ? selectedCustomerId : null,
          customerName: customerName,
          customerPhone: selectedCustomer?.phone || '',
          customerEmail: selectedCustomer?.email || null,
          deliveryAddress: selectedCustomer?.address || 'Counter Sale',
          city: selectedCustomer?.city || 'N/A',
          state: selectedCustomer?.state || 'N/A',
          pincode: selectedCustomer?.pincode || '000000',
          status: "confirmed", // Auto-confirmed for POS
          paymentStatus: paymentStatus, // Auto-update payment status
          paymentMethod: paymentType !== "credit" ? paymentMethod : "cod",
          subtotal: Math.round(productItems.reduce((sum, item) => sum + item.price * item.quantity, 0)),
          deliveryCharges: 0,
          totalAmount: Math.round(productItems.reduce((sum, item) => sum + item.price * item.quantity, 0)),
          notes: `POS Sale - ${billNotes || 'Counter purchase'}`,
          source: "pos",
          prescriptionRequired: false,
        };

        createdOrder = await createOrderMutation.mutateAsync(orderData);
        console.log('✅ [POS] Order created (auto-confirmed):', createdOrder.id);
      }

      // Create booking for services (auto-confirmed) - even for walk-in customers
      if (serviceItems.length > 0) {
        for (const serviceItem of serviceItems) {
          const bookingData = {
            vendorId: vendorId,
            customerId: !isWalkIn ? selectedCustomerId : null,
            serviceId: serviceItem.serviceId,
            serviceName: serviceItem.name,
            customerName: customerName,
            customerPhone: selectedCustomer?.phone || '',
            customerEmail: selectedCustomer?.email || null,
            bookingDate: new Date().toISOString().split('T')[0],
            startTime: new Date().toTimeString().slice(0, 5),
            endTime: new Date(Date.now() + (serviceItem.duration || 30) * 60000).toTimeString().slice(0, 5),
            duration: serviceItem.duration || 30,
            status: "confirmed", // Auto-confirmed for POS
            paymentStatus: paymentStatus, // Auto-update payment status
            totalAmount: Math.round(serviceItem.price * serviceItem.quantity),
            notes: `POS Sale - Bill ${billNumber}`,
            source: "pos",
          };

          try {
            const createdBooking = await createBookingMutation.mutateAsync(bookingData);
            console.log('✅ [POS] Booking created (auto-confirmed):', createdBooking.id);
          } catch (bookingError) {
            console.error('❌ [POS] Failed to create booking:', bookingError);
          }
        }
      }

      // Add bill items
      for (const item of cartItems) {
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

        // Create order items for products
        if (createdOrder && item.type === "product" && item.productId) {
          await createOrderItemMutation.mutateAsync({
            orderId: createdOrder.id,
            item: {
              orderId: createdOrder.id,
              vendorProductId: item.productId,
              productName: item.name,
              productUnit: item.unit || "pcs",
              quantity: item.quantity,
              pricePerUnit: Math.round(item.price),
              totalPrice: Math.round(item.price * item.quantity),
            },
          });
        }
      }

      // Record payment
      if (amount > 0) {
        await recordPaymentMutation.mutateAsync({
          billId: bill.id,
          payment: {
            amount: amount.toFixed(2),
            paymentMethod,
          },
        });
      }

      // Record coupon usage
      if (selectedCoupon && !isWalkIn) {
        try {
          await apiRequest("POST", "/api/coupon-usages", {
            couponId: selectedCoupon.id,
            customerId: selectedCustomerId,
            orderId: createdOrder?.id || null,
            discountAmount: Math.round(discountAmount),
          });
        } catch (error) {
          console.error('❌ [POS] Failed to record coupon usage:', error);
        }
      }

      // Create ledger transactions - including for partial payments
      if (!isWalkIn) {
        try {
          // Record money received (if any payment made)
          if (amount > 0) {
            await createLedgerTransactionMutation.mutateAsync({
              vendorId: vendorId,
              customerId: selectedCustomerId,
              type: "in",
              amount: Math.round(amount),
              category: "product_sale",
              paymentMethod: paymentMethod || "cash",
              description: `POS Sale - Bill ${billNumber}`,
              note: cartItems.map(i => `${i.quantity}x ${i.name}`).join(", "),
              referenceType: createdOrder ? "order" : "bill",
              referenceId: createdOrder?.id || bill.id,
            });
          }

          // Record credit/due amount if not fully paid (this goes to customer dues)
          if (grandTotal > amount) {
            const dueAmount = grandTotal - amount;
            await createLedgerTransactionMutation.mutateAsync({
              vendorId: vendorId,
              customerId: selectedCustomerId,
              type: "out", // Credit given to customer = money out
              amount: Math.round(dueAmount),
              category: "other",
              paymentMethod: "credit",
              description: `Credit/Due - Bill ${billNumber}`,
              note: `Remaining payment due: ₹${dueAmount.toFixed(2)}`,
              referenceType: createdOrder ? "order" : "bill",
              referenceId: createdOrder?.id || bill.id,
            });
            console.log('✅ [POS] Due amount added to customer ledger: ₹' + dueAmount);
          }
        } catch (ledgerError) {
          console.error('❌ [POS] Failed to create ledger transactions:', ledgerError);
        }
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/orders`] });
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/bookings`] });
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/analytics`] });
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/ledger-transactions`] });
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/products`] });
      if (!isWalkIn) {
        queryClient.invalidateQueries({ queryKey: [`/api/customers/${selectedCustomerId}/ledger-balance`] });
      }

      toast({ 
        title: "✅ Checkout Complete!", 
        description: `Bill ${billNumber} created successfully` 
      });
    } catch (error) {
      console.error("❌ [POS] Checkout error:", error);
      toast({ 
        title: "Checkout failed", 
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive" 
      });
    }
  };

  const handleDownloadPDF = () => {
    if (billRef.current) {
      const printWindow = window.open('', '', 'height=800,width=400');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Invoice - ${completedBill?.billNumber || 'Bill'}</title>
              <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                  font-family: 'Segoe UI', Arial, sans-serif; 
                  padding: 15px;
                  max-width: 400px;
                  margin: 0 auto;
                  background: white;
                  color: #333;
                }
                .header { text-align: center; padding-bottom: 12px; border-bottom: 2px dashed #333; margin-bottom: 12px; }
                .business-name { font-size: 20px; font-weight: bold; margin-bottom: 4px; }
                .business-info { font-size: 11px; color: #666; }
                .invoice-title { text-align: center; padding: 8px 0; font-weight: bold; letter-spacing: 3px; border-bottom: 1px solid #eee; }
                .meta { display: flex; justify-content: space-between; padding: 12px 0; font-size: 11px; border-bottom: 1px dashed #ccc; }
                .customer { padding: 12px 0; border-bottom: 1px dashed #ccc; }
                .customer-label { font-size: 9px; color: #999; text-transform: uppercase; }
                .customer-name { font-weight: 600; font-size: 13px; }
                .items { padding: 12px 0; }
                .items table { width: 100%; border-collapse: collapse; font-size: 11px; }
                .items th { text-align: left; padding: 6px 0; border-bottom: 1px solid #333; font-size: 10px; }
                .items td { padding: 6px 0; border-bottom: 1px dotted #ddd; }
                .items .right { text-align: right; }
                .items .center { text-align: center; }
                .totals { border-top: 2px dashed #333; padding-top: 12px; margin-top: 8px; }
                .totals-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px; }
                .totals-row.grand { font-size: 16px; font-weight: bold; border-top: 1px solid #333; margin-top: 8px; padding-top: 8px; }
                .totals-row.paid { color: #22c55e; }
                .totals-row.due { color: #ef4444; font-weight: bold; }
                .footer { text-align: center; padding: 15px 0; border-top: 2px dashed #333; margin-top: 15px; }
                .footer-text { font-size: 14px; font-weight: bold; }
                .footer-sub { font-size: 11px; color: #666; }
                .branding { text-align: center; padding: 10px; background: #f5f5f5; margin-top: 15px; border-radius: 4px; }
                .branding-text { font-size: 10px; color: #999; }
                @media print { 
                  body { padding: 10px; } 
                  @page { size: 80mm auto; margin: 0; }
                }
              </style>
            </head>
            <body>
              ${billRef.current.innerHTML}
              <script>
                window.onload = function() {
                  window.print();
                  setTimeout(function() { window.close(); }, 500);
                }
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
        toast({ title: "Opening print dialog..." });
      }
    }
  };

  const handleShareWhatsApp = () => {
    if (!completedBill) return;
    
    const isWalkIn = !selectedCustomerId || selectedCustomerId === "walk-in";
    const selectedCustomer = !isWalkIn ? customers.find(c => c.id === selectedCustomerId) : null;
    const customerName = selectedCustomer?.name || "Walk-in Customer";
    
    const billText = `
🧾 *INVOICE*
━━━━━━━━━━━━━━━━
*${vendor?.businessName || "Vyora"}*
${vendor?.address || ''}
${vendor?.city || ''}, ${vendor?.state || ''}

📋 Bill: ${completedBill.billNumber}
📅 Date: ${new Date(completedBill.billDate).toLocaleDateString('en-IN')}
👤 Customer: ${customerName}

*ITEMS*
${cartItems.map(item => `▫️ ${item.name} x${item.quantity} = ₹${(item.price * item.quantity).toFixed(2)}`).join('\n')}

${additionalServices.length > 0 ? `*Additional Services*\n${additionalServices.map(s => `▫️ ${s.name} = ₹${s.totalAmount.toFixed(2)}`).join('\n')}\n` : ''}
━━━━━━━━━━━━━━━━
Subtotal: ₹${subtotal.toFixed(2)}
${discountAmount > 0 ? `Discount: -₹${discountAmount.toFixed(2)}\n` : ''}${additionalServicesTotal > 0 ? `Additional: ₹${additionalServicesTotal.toFixed(2)}\n` : ''}
*TOTAL: ₹${grandTotal.toFixed(2)}*
Paid: ₹${parseFloat(completedBill.paidAmount).toFixed(2)}
${parseFloat(completedBill.dueAmount) > 0 ? `*Due: ₹${parseFloat(completedBill.dueAmount).toFixed(2)}*` : ''}

━━━━━━━━━━━━━━━━
Thank you for your business! 🙏
Powered by *Vyora*
    `.trim();

    const phone = selectedCustomer?.phone || "";
    const url = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(billText)}`;
    window.open(url, '_blank');
  };

  const resetCheckout = () => {
    setCartItems([]);
    setSelectedCustomerId("walk-in");
    setSelectedCoupon(null);
    setCouponCode("");
    setDiscountType("none");
    setDiscountValue("");
    setAdditionalServices([]);
    setPaymentType("full");
    setPaymentAmount("");
    setBillNotes("");
    setCheckoutStep(1);
    setCompletedBill(null);
    setShowCheckoutDialog(false);
    setShowCart(false);
  };

  const selectedCustomer = selectedCustomerId !== "walk-in" ? customers.find((c) => c.id === selectedCustomerId) : null;

  if (!vendorId) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Header - Compact */}
      <div className="bg-white dark:bg-gray-800 border-b shrink-0 z-20">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/vendor/dashboard")}
                className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
                <h1 className="text-lg font-bold text-foreground">Point of Sale</h1>
          </div>
        </div>

            {/* Cart Button - Mobile */}
            <Button 
              variant="outline" 
              size="icon" 
              className="lg:hidden relative"
              onClick={() => setShowCart(true)}
                >
              <ShoppingCart className="h-5 w-5" />
              {totalItemCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {totalItemCount}
            </Badge>
          )}
            </Button>
      </div>

          {/* Search Bar */}
          <div className="mt-3 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products or services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11"
            />
          </div>

          {/* Customer Selection - Below Search */}
          <div className="mt-3">
            <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
              <SelectTrigger className="w-full h-11">
                <User className="h-4 w-4 mr-2 shrink-0" />
                <SelectValue placeholder="Select Customer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="walk-in">
                  <span className="flex items-center gap-2">
                    <Store className="h-4 w-4" />
                    Walk-in Customer
                  </span>
                </SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    <span className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {customer.name} - {customer.phone}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-3">
            <TabsList className="w-full grid grid-cols-2 h-11">
              <TabsTrigger value="products" className="gap-2 text-sm">
                <Package className="h-4 w-4" />
                Products ({filteredProducts.length})
              </TabsTrigger>
              <TabsTrigger value="services" className="gap-2 text-sm">
                <Scissors className="h-4 w-4" />
                Services ({filteredServices.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Products/Services Grid - Fully Scrollable */}
        <div className="flex-1 overflow-y-auto pb-32 lg:pb-4">
          <div className="p-4">
            {activeTab === "products" && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredProducts.map((product) => {
                  const inCart = cartItems.find((item) => item.id === product.id);
                  const isOutOfStock = product.stock === 0;
                  
                  return (
                    <Card
                      key={product.id}
                      className={cn(
                        "cursor-pointer overflow-hidden transition-all hover:shadow-lg active:scale-[0.98]",
                        isOutOfStock && "opacity-60",
                        inCart && "ring-2 ring-primary"
                      )}
                      onClick={() => !isOutOfStock && handleTapProduct(product)}
                    >
                      <div className="relative aspect-square bg-gray-100 dark:bg-gray-800">
                        {product.imageUrl ? (
                          <img 
                            src={product.imageUrl} 
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-10 w-10 text-gray-300" />
                          </div>
                        )}
                        
                        {isOutOfStock ? (
                          <Badge className="absolute top-2 right-2 bg-red-500 text-xs">Out</Badge>
                        ) : product.stock <= 5 && (
                          <Badge className="absolute top-2 right-2 bg-orange-500 text-xs">{product.stock}</Badge>
                        )}
                        
                          {inCart && (
                          <div className="absolute bottom-2 right-2 bg-primary text-primary-foreground w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-lg">
                              {inCart.quantity}
                          </div>
                          )}
                      </div>
                      
                      <CardContent className="p-2.5">
                        <h3 className="font-medium text-xs truncate">{product.name}</h3>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-sm font-bold text-primary">₹{product.price}</span>
                          <span className="text-[10px] text-muted-foreground">{product.unit}</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {filteredProducts.length === 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                    <Package className="h-12 w-12 text-muted-foreground mb-3" />
                    <h3 className="font-semibold mb-1">No Products</h3>
                    <p className="text-muted-foreground text-sm">
                      {searchQuery ? "Try different search" : "Add products to inventory"}
                    </p>
              </div>
                )}
              </div>
            )}

            {activeTab === "services" && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredServices.map((service) => {
                  const inCart = cartItems.find((item) => item.id === service.id);
                  
                  return (
                    <Card
                      key={service.id}
                      className={cn(
                        "cursor-pointer overflow-hidden transition-all hover:shadow-lg active:scale-[0.98]",
                        inCart && "ring-2 ring-primary"
                      )}
                      onClick={() => handleTapService(service)}
                    >
                      <div className="relative aspect-square bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30">
                        {service.imageUrl ? (
                          <img 
                            src={service.imageUrl} 
                            alt={service.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Scissors className="h-10 w-10 text-purple-300" />
                          </div>
                        )}
                        
                        {service.duration && (
                          <Badge className="absolute top-2 right-2 bg-purple-500 text-xs">
                            {service.duration}m
                          </Badge>
                        )}
                        
                          {inCart && (
                          <div className="absolute bottom-2 right-2 bg-primary text-primary-foreground w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-lg">
                              {inCart.quantity}
                          </div>
                          )}
                      </div>
                      
                      <CardContent className="p-2.5">
                        <h3 className="font-medium text-xs truncate">{service.name}</h3>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-sm font-bold text-primary">₹{service.price}</span>
                          <span className="text-[10px] text-muted-foreground">{service.category}</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {filteredServices.length === 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                    <Scissors className="h-12 w-12 text-muted-foreground mb-3" />
                    <h3 className="font-semibold mb-1">No Services</h3>
                    <p className="text-muted-foreground text-sm">
                      {searchQuery ? "Try different search" : "Add services to catalogue"}
                    </p>
              </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Cart Sidebar - Desktop */}
        <div className="hidden lg:flex w-[360px] flex-col bg-white dark:bg-gray-800 border-l">
          <div className="p-4 border-b">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Cart ({totalItemCount})
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {cartItems.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="h-14 w-14 text-muted-foreground mx-auto mb-3 opacity-30" />
                <p className="text-muted-foreground text-sm">Tap items to add</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cartItems.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-900 rounded-lg"
                  >
                    <div className="w-10 h-10 rounded overflow-hidden bg-gray-200 shrink-0">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {item.type === "product" ? <Package className="h-4 w-4 text-gray-400" /> : <Scissors className="h-4 w-4 text-gray-400" />}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-xs truncate">{item.name}</h4>
                      <p className="text-[10px] text-muted-foreground">₹{item.price} × {item.quantity}</p>
                    </div>
                    
                    <div className="flex items-center gap-0.5">
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => decrementQuantity(item.id)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-5 text-center text-xs">{item.quantity}</span>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => incrementQuantity(item.id)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <p className="font-bold text-xs shrink-0">₹{(item.price * item.quantity).toFixed(0)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {cartItems.length > 0 && (
            <div className="p-4 border-t bg-gray-50 dark:bg-gray-900">
              <div className="space-y-1 text-sm mb-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                <span>-₹{discountAmount.toFixed(2)}</span>
              </div>
            )}
                {additionalServicesTotal > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Additional</span>
                    <span>₹{additionalServicesTotal.toFixed(2)}</span>
            </div>
                )}
            <Separator />
            <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
              <span>₹{grandTotal.toFixed(2)}</span>
            </div>
              </div>
              
            <Button
                className="w-full h-11 text-base gap-2" 
              onClick={() => setShowCheckoutDialog(true)}
            >
                <Receipt className="h-4 w-4" />
              Checkout
            </Button>
          </div>
          )}
        </div>
      </div>

      {/* Mobile Cart Sheet */}
      <Dialog open={showCart} onOpenChange={setShowCart}>
        <DialogContent className="w-full max-w-lg max-h-[85vh] p-0 flex flex-col">
          <DialogHeader className="p-4 border-b shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setShowCart(false)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              Cart ({totalItemCount} items)
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4">
            {cartItems.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="h-14 w-14 text-muted-foreground mx-auto mb-3 opacity-30" />
                <p className="text-muted-foreground">Your cart is empty</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 shrink-0">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {item.type === "product" ? <Package className="h-5 w-5 text-gray-400" /> : <Scissors className="h-5 w-5 text-gray-400" />}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{item.name}</h4>
                      <p className="text-xs text-muted-foreground">₹{item.price}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => decrementQuantity(item.id)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center text-sm">{item.quantity}</span>
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => incrementQuantity(item.id)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="font-bold text-sm">₹{(item.price * item.quantity).toFixed(0)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {cartItems.length > 0 && (
            <div className="p-4 border-t shrink-0">
              <div className="flex justify-between text-lg font-bold mb-3">
                <span>Total</span>
                <span>₹{grandTotal.toFixed(2)}</span>
              </div>
              <Button 
                className="w-full h-11" 
                onClick={() => {
                  setShowCart(false);
                  setShowCheckoutDialog(true);
                }}
              >
                <Receipt className="h-4 w-4 mr-2" />
                Proceed to Checkout
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Mobile Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t shadow-lg z-30">
        <div className="p-3 flex items-center gap-3">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">{totalItemCount} items</p>
            <p className="text-lg font-bold">₹{grandTotal.toFixed(2)}</p>
            </div>
            <Button
              size="lg"
            className="min-w-[130px] h-11"
              disabled={cartItems.length === 0}
              onClick={() => setShowCheckoutDialog(true)}
            >
            <Receipt className="h-4 w-4 mr-2" />
              Checkout
            </Button>
        </div>
      </div>

      {/* Checkout Dialog */}
      <Dialog open={showCheckoutDialog} onOpenChange={(open) => {
        if (!open && checkoutStep !== 4) setShowCheckoutDialog(false);
        else if (!open && checkoutStep === 4) resetCheckout();
      }}>
        <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-hidden flex flex-col p-0">
          {/* Header */}
          <div className="p-4 border-b shrink-0">
            <div className="flex items-center gap-3">
              {checkoutStep > 1 && checkoutStep < 4 && (
                <Button variant="ghost" size="icon" onClick={() => setCheckoutStep((checkoutStep - 1) as any)}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              <DialogTitle className="flex-1">
                {checkoutStep === 1 && "Review Order"}
                {checkoutStep === 2 && "Discounts & Services"}
              {checkoutStep === 3 && "Payment"}
                {checkoutStep === 4 && "Bill Generated"}
            </DialogTitle>
              {checkoutStep < 4 && (
                <Button variant="ghost" size="icon" onClick={() => setShowCheckoutDialog(false)}>
                  <X className="h-5 w-5" />
                </Button>
              )}
            </div>

            {checkoutStep < 4 && (
              <div className="flex items-center gap-1.5 mt-3">
                {[1, 2, 3].map((step) => (
                  <div 
                    key={step}
                    className={cn(
                      "flex-1 h-1 rounded-full transition-all",
                      step <= checkoutStep ? "bg-primary" : "bg-gray-200 dark:bg-gray-700"
                    )}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Step 1: Review */}
          {checkoutStep === 1 && (
            <div className="space-y-4">
                {/* Customer */}
                <Card className={cn(
                  "p-3",
                  selectedCustomer ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200" : "bg-gray-50"
                )}>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{selectedCustomer ? selectedCustomer.name?.charAt(0) : "W"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{selectedCustomer?.name || "Walk-in Customer"}</p>
                      <p className="text-sm text-muted-foreground">{selectedCustomer?.phone || "Counter Sale"}</p>
                    </div>
                  </div>
                </Card>

                {/* Items */}
              <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Items</h3>
                {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <div className="w-10 h-10 rounded overflow-hidden bg-gray-200 shrink-0">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            {item.type === "product" ? <Package className="h-4 w-4 text-gray-400" /> : <Scissors className="h-4 w-4 text-gray-400" />}
                      </div>
                        )}
                    </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-muted-foreground">₹{item.price} × {item.quantity}</p>
                      </div>
                      <p className="font-bold text-sm">₹{(item.price * item.quantity).toFixed(0)}</p>
                  </div>
                ))}
              </div>

              <Separator />

                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal ({totalItemCount} items)</span>
                <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">* Prices are inclusive of GST</p>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>₹{grandTotal.toFixed(2)}</span>
                  </div>
              </div>
            </div>
          )}

            {/* Step 2: Discounts & Additional Services */}
          {checkoutStep === 2 && (
              <div className="space-y-5">
                {/* Coupon */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Tag className="h-4 w-4 text-primary" />
                  Apply Coupon
                </h3>
                <div className="flex gap-2">
                  <Input
                      placeholder="Enter code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    disabled={!!selectedCoupon}
                      className="flex-1 h-10"
                  />
                  {!selectedCoupon ? (
                      <Button onClick={handleApplyCoupon} disabled={!couponCode} className="h-10">Apply</Button>
                  ) : (
                      <Button onClick={handleRemoveCoupon} variant="destructive" className="h-10">Remove</Button>
                  )}
                </div>
                {selectedCoupon && (
                    <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 rounded-lg">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-700">{selectedCoupon.code} applied!</span>
                  </div>
                )}
              </div>

                {/* Manual Discount */}
              {!selectedCoupon && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <Percent className="h-4 w-4 text-primary" />
                    Manual Discount
                  </h3>
                    <RadioGroup value={discountType} onValueChange={(v) => setDiscountType(v as any)} className="space-y-2">
                      {[
                        { value: "none", label: "No Discount" },
                        { value: "percentage", label: "Percentage (%)" },
                        { value: "fixed", label: "Fixed Amount (₹)" },
                      ].map((opt) => (
                        <div key={opt.value} className={cn(
                          "flex items-center gap-2 p-3 border rounded-lg cursor-pointer",
                          discountType === opt.value && "border-primary bg-primary/5"
                        )}>
                          <RadioGroupItem value={opt.value} id={opt.value} />
                          <Label htmlFor={opt.value} className="flex-1 cursor-pointer text-sm">{opt.label}</Label>
                    </div>
                      ))}
                  </RadioGroup>
                  {discountType !== "none" && (
                    <Input
                      type="number"
                      placeholder={discountType === "percentage" ? "Enter %" : "Enter amount"}
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                        className="h-10"
                    />
                  )}
                </div>
              )}

                {/* Additional Services */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <PlusCircle className="h-4 w-4 text-primary" />
                      Additional Services
                </h3>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8"
                      onClick={() => setShowAddService(true)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                      </div>

                  {showAddService && (
                    <Card className="p-3 space-y-2">
                      <Input
                        placeholder="Service name *"
                        value={newServiceName}
                        onChange={(e) => setNewServiceName(e.target.value)}
                        className="h-9"
                      />
                      <Input
                        placeholder="Description (optional)"
                        value={newServiceDesc}
                        onChange={(e) => setNewServiceDesc(e.target.value)}
                        className="h-9"
                      />
                    <div className="flex gap-2">
                      <Input
                        type="number"
                          placeholder="Amount (excl. GST)"
                          value={newServiceAmount}
                          onChange={(e) => setNewServiceAmount(e.target.value)}
                          className="flex-1 h-9"
                      />
                        <Button onClick={handleAddService} className="h-9">Add</Button>
                        <Button variant="ghost" onClick={() => setShowAddService(false)} className="h-9">
                          <X className="h-4 w-4" />
                        </Button>
                    </div>
                      <p className="text-xs text-muted-foreground">18% GST will be added</p>
                    </Card>
                )}

                  {additionalServices.length > 0 && (
                    <div className="space-y-2">
                      {additionalServices.map((service) => (
                        <div key={service.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <div>
                            <p className="font-medium text-sm">{service.name}</p>
                            <p className="text-xs text-muted-foreground">
                              ₹{service.amount} + 18% GST
                            </p>
                    </div>
                    <div className="flex items-center gap-2">
                            <span className="font-bold text-sm">₹{service.totalAmount.toFixed(2)}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                              onClick={() => removeAdditionalService(service.id)}
                      >
                              <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                    </div>
                  )}
              </div>

                {/* Notes */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                  Notes
                </h3>
                <Textarea
                    placeholder="Add notes..."
                  value={billNotes}
                  onChange={(e) => setBillNotes(e.target.value)}
                    rows={2}
                />
              </div>

                {/* Summary */}
                <Card className="p-3 bg-gray-50 dark:bg-gray-900">
                  <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                    <span>-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                    {additionalServicesTotal > 0 && (
                <div className="flex justify-between">
                        <span className="text-muted-foreground">Additional Services</span>
                        <span>₹{additionalServicesTotal.toFixed(2)}</span>
                </div>
                    )}
                <Separator />
                    <div className="flex justify-between text-base font-bold">
                      <span>Total</span>
                  <span>₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>
                </Card>
            </div>
          )}

            {/* Step 3: Payment */}
          {checkoutStep === 3 && (
              <div className="space-y-5">
                {/* Amount */}
                <div className="text-center py-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl">
                  <p className="text-sm text-muted-foreground mb-1">Amount to Pay</p>
                  <p className="text-4xl font-bold text-primary">₹{grandTotal.toFixed(2)}</p>
              </div>

                {/* Payment Type */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">Payment Type</h3>
                  <RadioGroup value={paymentType} onValueChange={(v) => setPaymentType(v as any)} className="space-y-2">
                    {[
                      { value: "full", label: "Full Payment", desc: `Pay ₹${grandTotal.toFixed(2)} now` },
                      { value: "partial", label: "Partial Payment", desc: "Pay some now, rest later" },
                      { value: "credit", label: "Credit", desc: "Full amount on credit" },
                    ].map((opt) => (
                      <div 
                        key={opt.value}
                        className={cn(
                          "flex items-center gap-3 p-3 border rounded-xl cursor-pointer",
                          paymentType === opt.value && "border-primary bg-primary/5"
                        )}
                      >
                        <RadioGroupItem value={opt.value} id={opt.value} />
                        <Label htmlFor={opt.value} className="flex-1 cursor-pointer">
                          <p className="font-medium text-sm">{opt.label}</p>
                          <p className="text-xs text-muted-foreground">{opt.desc}</p>
                        </Label>
                        {paymentType === opt.value && <Check className="h-4 w-4 text-primary" />}
                  </div>
                    ))}
                </RadioGroup>

                {paymentType === "partial" && (
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                      className="h-11 text-lg"
                  />
                )}
              </div>

                {/* Payment Method */}
              {paymentType !== "credit" && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm">Payment Method</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: "cash", label: "Cash", icon: IndianRupee },
                        { value: "upi", label: "UPI", icon: CreditCard },
                        { value: "card", label: "Card", icon: CreditCard },
                      ].map((method) => (
                        <Button
                          key={method.value}
                          variant={paymentMethod === method.value ? "default" : "outline"}
                          className="h-14 flex-col gap-1"
                          onClick={() => setPaymentMethod(method.value)}
                        >
                          <method.icon className="h-4 w-4" />
                          <span className="text-xs">{method.label}</span>
                        </Button>
                      ))}
                    </div>
                </div>
              )}

                {/* Due Warning */}
                {(paymentType === "partial" || paymentType === "credit") && (
                  <Card className="p-3 bg-orange-50 dark:bg-orange-900/20 border-orange-200">
                    <div className="space-y-1 text-sm">
              {paymentType === "partial" && paymentAmount && (
                        <>
                          <div className="flex justify-between">
                            <span>Paying Now</span>
                            <span className="font-bold text-green-600">₹{parseFloat(paymentAmount).toFixed(2)}</span>
                  </div>
                          <div className="flex justify-between">
                            <span>Due Amount</span>
                            <span className="font-bold text-orange-600">₹{(grandTotal - parseFloat(paymentAmount)).toFixed(2)}</span>
                  </div>
                        </>
                      )}
                      {paymentType === "credit" && (
                        <div className="flex justify-between">
                          <span>Full Due Amount</span>
                          <span className="font-bold text-orange-600">₹{grandTotal.toFixed(2)}</span>
                </div>
                      )}
                      {selectedCustomer && (
                        <p className="text-xs text-muted-foreground pt-2">
                          Due amount will be added to {selectedCustomer.name}'s ledger
                        </p>
                      )}
                    </div>
                  </Card>
              )}
            </div>
          )}

            {/* Step 4: Bill Generated */}
          {checkoutStep === 4 && completedBill && (
            <div className="space-y-4">
                {/* Success */}
                <div className="text-center py-4">
                  <div className="w-16 h-16 mx-auto mb-3 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold text-green-600">Payment Successful!</h2>
                  <p className="text-sm text-muted-foreground">Bill #{completedBill.billNumber}</p>
              </div>

                {/* Bill */}
                <div ref={billRef} className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden border shadow">
                  <div className="p-5 text-center border-b-2 border-dashed">
                    <h2 className="text-xl font-bold">{vendor?.businessName || "Vyora"}</h2>
                    {vendor?.address && <p className="text-xs text-muted-foreground">{vendor.address}</p>}
                    {vendor?.phone && <p className="text-xs text-muted-foreground">{vendor.phone}</p>}
                    {vendor?.city && vendor?.state && (
                      <p className="text-xs text-muted-foreground">{vendor.city}, {vendor.state}</p>
                    )}
                </div>

                  <div className="text-center py-2 font-bold tracking-widest text-sm border-b">TAX INVOICE</div>

                  <div className="p-4 flex justify-between text-xs border-b border-dashed">
                  <div>
                      <p className="text-muted-foreground">Bill No.</p>
                      <p className="font-mono font-bold">{completedBill.billNumber}</p>
                  </div>
                  <div className="text-right">
                      <p className="text-muted-foreground">Date</p>
                      <p className="font-mono">{format(new Date(completedBill.billDate), 'dd/MM/yyyy')}</p>
                  </div>
                </div>

                  <div className="p-4 border-b border-dashed">
                    <p className="text-[10px] text-muted-foreground mb-0.5">BILL TO</p>
                    <p className="font-medium text-sm">{selectedCustomer?.name || "Walk-in Customer"}</p>
                    {selectedCustomer?.phone && <p className="text-xs text-muted-foreground">{selectedCustomer.phone}</p>}
                  </div>

                  <div className="p-4">
                    <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b">
                          <th className="text-left py-1.5">Item</th>
                          <th className="text-center py-1.5">Qty</th>
                          <th className="text-right py-1.5">Price</th>
                          <th className="text-right py-1.5">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cartItems.map((item) => (
                          <tr key={item.id} className="border-b border-dotted">
                            <td className="py-1.5">{item.name}</td>
                            <td className="text-center py-1.5">{item.quantity}</td>
                            <td className="text-right py-1.5">₹{item.price}</td>
                            <td className="text-right py-1.5 font-medium">₹{(item.price * item.quantity).toFixed(2)}</td>
                          </tr>
                        ))}
                        {additionalServices.map((service) => (
                          <tr key={service.id} className="border-b border-dotted text-muted-foreground">
                            <td className="py-1.5">{service.name}</td>
                            <td className="text-center py-1.5">1</td>
                            <td className="text-right py-1.5">₹{service.amount}</td>
                            <td className="text-right py-1.5 font-medium">₹{service.totalAmount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                  </div>

                  <div className="p-4 border-t-2 border-dashed space-y-1 text-xs">
                  <div className="flex justify-between">
                      <span>Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                      <span>-₹{discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                    {additionalServicesTotal > 0 && (
                  <div className="flex justify-between">
                        <span>Additional Services (incl. GST)</span>
                        <span>₹{additionalServicesTotal.toFixed(2)}</span>
                  </div>
                    )}
                    <div className="flex justify-between text-lg font-bold pt-2 border-t">
                      <span>Grand Total</span>
                    <span>₹{grandTotal.toFixed(2)}</span>
                  </div>
                    <div className="flex justify-between text-green-600">
                      <span>Paid</span>
                    <span>₹{parseFloat(completedBill.paidAmount).toFixed(2)}</span>
                  </div>
                  {parseFloat(completedBill.dueAmount) > 0 && (
                    <div className="flex justify-between text-red-600 font-bold">
                        <span>Due</span>
                      <span>₹{parseFloat(completedBill.dueAmount).toFixed(2)}</span>
                    </div>
                  )}
                </div>

                  <div className="p-4 text-center border-t-2 border-dashed">
                    <p className="font-bold">Thank You!</p>
                    <p className="text-xs text-muted-foreground">Visit Again</p>
                  </div>

                  <div className="p-2 text-center bg-gray-50 dark:bg-gray-800">
                    <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                      <Sparkles className="h-2.5 w-2.5" />
                  Powered by <span className="font-bold">Vyora</span>
                    </p>
                </div>
              </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="h-11" onClick={handleDownloadPDF}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                </Button>
                  <Button variant="outline" className="h-11" onClick={handleShareWhatsApp}>
                    <Share2 className="h-4 w-4 mr-2" />
                    WhatsApp
                  </Button>
              </div>
            </div>
          )}
          </div>

          {/* Footer */}
          {checkoutStep < 4 && (
            <div className="p-4 border-t shrink-0 bg-gray-50 dark:bg-gray-900">
              <Button 
                className="w-full h-11 text-base"
                onClick={() => {
                  if (checkoutStep < 3) setCheckoutStep((checkoutStep + 1) as any);
                  else handleCheckout();
                }}
                disabled={createBillMutation.isPending}
              >
                {checkoutStep < 3 ? (
                  <>Continue <ChevronRight className="h-4 w-4 ml-1" /></>
                ) : createBillMutation.isPending ? (
                  "Processing..."
                ) : (
                  <><CreditCard className="h-4 w-4 mr-2" /> Complete Payment</>
                )}
              </Button>
            </div>
            )}

            {checkoutStep === 4 && (
            <div className="p-4 border-t shrink-0">
              <Button className="w-full h-11" onClick={resetCheckout}>
                <Plus className="h-4 w-4 mr-2" />
                New Bill
              </Button>
            </div>
            )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
