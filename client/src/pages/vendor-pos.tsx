import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  ShoppingCart, Search, User, CreditCard, Plus, Minus,
  Tag, Percent, FileText, Download, Printer,
  Share2, X, Check, ChevronRight, ArrowLeft, Package,
  Store, Image as ImageIcon,
  CheckCircle2, Sparkles, IndianRupee, PlusCircle
} from "lucide-react";
import type { VendorProduct, Customer, Coupon, Bill, Vendor } from "@shared/schema";
import { format } from "date-fns";

import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { ProUpgradeModal } from "@/components/ProActionGuard";
import { LoadingSpinner } from "@/components/AuthGuard";
import { Lock } from "lucide-react";

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
  
  // Pro subscription check
  const { isPro, canPerformAction } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [blockedAction, setBlockedAction] = useState<'create' | 'save' | 'download' | 'export'>('create');
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("walk-in");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  
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

  const handleCheckout = async () => {
    // PRO SUBSCRIPTION CHECK - Block checkout for non-Pro users
    const actionCheck = canPerformAction('create');
    if (!actionCheck.allowed) {
      console.log('[PRO_GUARD] POS checkout blocked - User is not Pro');
      setBlockedAction('create');
      setShowUpgradeModal(true);
      return;
    }
    
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
      // IMPORTANT: Paid amounts through POS are EXCLUDED from balance calculation
      // because money received is in exchange of products (not credit/loan)
      // Only unpaid/partial amounts (credit) affect the net balance
      if (!isWalkIn) {
        try {
          // Record money received (if any payment made)
          // Mark as excludeFromBalance=true because this is product exchange, not credit
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
              excludeFromBalance: true, // Paid amount excluded from net balance
              isPOSSale: true, // Mark as POS sale for tracking
            });
          }

          // Record credit/due amount if not fully paid (this goes to customer dues)
          // This SHOULD affect balance - customer owes money
          // Type: "out" = "You Gave" credit to customer = customer owes you
          // Balance = totalOut - totalIn = positive when customer owes = "You will GET"
          if (grandTotal > amount) {
            const dueAmount = grandTotal - amount;
            await createLedgerTransactionMutation.mutateAsync({
              vendorId: vendorId,
              customerId: selectedCustomerId,
              type: "out", // "You Gave" credit = customer owes you (balance increases = "You will GET")
              amount: Math.round(dueAmount),
              category: "product_sale",
              paymentMethod: "credit",
              description: `Credit Due - Bill ${billNumber}`,
              note: `Pending payment: ₹${dueAmount.toFixed(2)} (${cartItems.map(i => `${i.quantity}x ${i.name}`).join(", ")})`,
              referenceType: createdOrder ? "order" : "bill",
              referenceId: createdOrder?.id || bill.id,
              excludeFromBalance: false, // Due amount COUNTS in net balance
              isPOSSale: true, // Mark as POS sale for tracking
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
    // PRO SUBSCRIPTION CHECK - Block download for non-Pro users
    const actionCheck = canPerformAction('download');
    if (!actionCheck.allowed) {
      console.log('[PRO_GUARD] POS download blocked - User is not Pro');
      setBlockedAction('download');
      setShowUpgradeModal(true);
      return;
    }
    
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
              className="lg:hidden relative h-11 w-11"
              onClick={() => setShowCart(true)}
            >
              <ShoppingCart className="h-5 w-5" />
              {totalItemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 h-5 min-w-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shadow-sm">
                  {totalItemCount}
                </span>
              )}
            </Button>
      </div>

          {/* Search Bar */}
          <div className="mt-3 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
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

          {/* Products Count */}
          <div className="mt-3 flex items-center gap-2 py-2 px-3 bg-muted/50 rounded-lg">
            <Package className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{filteredProducts.length} Products Available</span>
          </div>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Products Grid - Fully Scrollable */}
        <div className="flex-1 overflow-y-auto pb-32 lg:pb-4">
          <div className="p-4">
            <div className="space-y-2">
                {filteredProducts.map((product) => {
                  const inCart = cartItems.find((item) => item.id === product.id);
                  const isOutOfStock = product.stock === 0;
                  const productImage = product.imageUrl || ((product as any).images?.[0]);
                  
                  return (
                    <Card
                      key={product.id}
                      className={cn(
                        "cursor-pointer overflow-hidden transition-all hover:shadow-md active:scale-[0.99] border",
                        isOutOfStock && "opacity-60",
                        inCart && "ring-2 ring-primary bg-primary/5"
                      )}
                      onClick={() => !isOutOfStock && handleTapProduct(product)}
                    >
                      <CardContent className="p-3">
                        <div className="flex gap-3">
                          {/* Product Image */}
                          <div className="relative w-20 h-20 md:w-24 md:h-24 shrink-0 bg-muted rounded-xl overflow-hidden">
                            {productImage ? (
                              <img 
                                src={productImage} 
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                                <span className="text-2xl mb-0.5">{(product as any).icon || '📦'}</span>
                                <ImageIcon className="w-3.5 h-3.5 opacity-30" />
                              </div>
                            )}
                            
                            {/* Cart Quantity Badge */}
                            {inCart && (
                              <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shadow-lg border-2 border-white">
                                {inCart.quantity}
                              </div>
                            )}
                          </div>
                          
                          {/* Product Info */}
                          <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                            <div>
                              <h3 className="font-semibold text-sm line-clamp-1">{product.name}</h3>
                              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                {product.category || 'Product'}
                              </p>
                            </div>
                            
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-lg font-bold text-primary">₹{product.price}</span>
                                <span className="text-xs text-muted-foreground">/{product.unit}</span>
                              </div>
                              
                              {/* Stock Badge */}
                              <Badge 
                                variant={isOutOfStock ? "destructive" : product.stock <= 5 ? "secondary" : "outline"}
                                className="text-[10px] px-1.5 py-0 h-5"
                              >
                                {isOutOfStock ? "Out" : `${product.stock} left`}
                              </Badge>
                            </div>
                          </div>
                          
                          {/* Quick Add Button */}
                          <div className="flex items-center">
                            {!isOutOfStock && (
                              <Button
                                size="icon"
                                variant={inCart ? "default" : "outline"}
                                className="h-10 w-10 rounded-full shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTapProduct(product);
                                }}
                              >
                                <Plus className="h-5 w-5" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {filteredProducts.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Package className="h-12 w-12 text-muted-foreground mb-3" />
                    <h3 className="font-semibold mb-1">No Products</h3>
                    <p className="text-muted-foreground text-sm">
                      {searchQuery ? "Try different search" : "Add products to inventory"}
                    </p>
                  </div>
                )}
              </div>
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
                          <Package className="h-4 w-4 text-gray-400" />
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
              className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 rounded-xl" 
              onClick={() => setShowCheckoutDialog(true)}
            >
              Checkout
              <ChevronRight className="h-5 w-5 ml-1" />
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
                          <Package className="h-5 w-5 text-gray-400" />
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
                className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90" 
                onClick={() => {
                  const actionCheck = canPerformAction('create');
                  if (!actionCheck.allowed) {
                    setBlockedAction('create');
                    setShowUpgradeModal(true);
                    return;
                  }
                  setShowCart(false);
                  setShowCheckoutDialog(true);
                }}
              >
                Proceed to Checkout
                {!isPro && <Lock className="h-4 w-4 ml-2 opacity-70" />}
                {isPro && <ChevronRight className="h-5 w-5 ml-1" />}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Mobile Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t shadow-xl z-30">
        <div className="p-3 flex items-center gap-3">
          <div className="flex-1">
            <p className="text-[11px] text-muted-foreground font-medium">{totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}</p>
            <p className="text-xl font-bold text-foreground">₹{grandTotal.toFixed(2)}</p>
          </div>
          <Button
            size="lg"
            className="min-w-[160px] h-12 text-base font-semibold bg-primary hover:bg-primary/90 rounded-xl shadow-lg"
            disabled={cartItems.length === 0}
            onClick={() => setShowCheckoutDialog(true)}
          >
            Checkout
            <ChevronRight className="h-5 w-5 ml-1" />
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
                {checkoutStep === 2 && "Discounts & Charges"}
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
                            <Package className="h-4 w-4 text-gray-400" />
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

            {/* Step 2: Discounts & Additional Charges */}
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

                {/* Additional Charges */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <PlusCircle className="h-4 w-4 text-primary" />
                      Additional Charges
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
                        placeholder="Charge name *"
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
                        <span className="text-muted-foreground">Additional Charges</span>
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
                {/* Success Animation */}
                <div className="text-center py-5 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl border border-green-100 dark:border-green-800">
                  <div className="w-16 h-16 mx-auto mb-3 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold text-green-600">Payment Successful!</h2>
                  <p className="text-xs text-muted-foreground mt-1">Bill #{completedBill.billNumber}</p>
                  <div className="flex justify-center gap-6 mt-3">
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground uppercase">Paid</p>
                      <p className="font-bold text-green-600">₹{parseFloat(completedBill.paidAmount).toFixed(2)}</p>
                    </div>
                    {parseFloat(completedBill.dueAmount) > 0 && (
                      <div className="text-center">
                        <p className="text-[10px] text-muted-foreground uppercase">Due</p>
                        <p className="font-bold text-red-600">₹{parseFloat(completedBill.dueAmount).toFixed(2)}</p>
                      </div>
                    )}
                  </div>
              </div>

                {/* Premium MNC-Level Bill Design */}
                <div ref={billRef} className="bg-white rounded-xl overflow-hidden shadow-2xl border border-gray-200">
                  {/* Elegant Header with Logo & Business Info */}
                  <div className="relative bg-gradient-to-br from-slate-50 via-white to-blue-50 p-5">
                    {/* Top accent line */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-primary to-purple-600"></div>
                    
                    <div className="flex items-start gap-4">
                      {/* Business Logo - Premium Style */}
                      <div className="w-[72px] h-[72px] rounded-2xl bg-white border-2 border-gray-100 flex items-center justify-center overflow-hidden shadow-lg ring-4 ring-gray-50">
                        {vendor?.logo ? (
                          <img 
                            src={vendor.logo} 
                            alt={vendor?.businessName} 
                            className="w-full h-full object-contain p-1"
                          />
                        ) : vendor?.businessName ? (
                          <div className="w-full h-full bg-gradient-to-br from-blue-600 to-primary flex items-center justify-center">
                            <span className="text-3xl font-bold text-white">
                              {vendor.businessName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-600 to-primary flex items-center justify-center">
                            <Store className="h-8 w-8 text-white" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-bold text-gray-900 tracking-tight">{vendor?.businessName || "Vyora"}</h2>
                        {vendor?.address && (
                          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{vendor.address}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500 mt-1">
                          {vendor?.pincode && (
                            <span>{vendor?.city}, {vendor?.state} - {vendor.pincode}</span>
                          )}
                          {!vendor?.pincode && vendor?.city && vendor?.state && (
                            <span>{vendor.city}, {vendor.state}</span>
                          )}
                        </div>
                        {vendor?.phone && (
                          <p className="text-xs text-gray-600 font-medium mt-1">📞 {vendor.phone}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tax Invoice Title - Professional */}
                  <div className="bg-gradient-to-r from-blue-600 via-primary to-blue-700 py-2.5 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50"></div>
                    <span className="relative font-bold tracking-[0.35em] text-sm text-white drop-shadow-sm">TAX INVOICE</span>
                  </div>

                  {/* Invoice Meta - Clean Grid */}
                  <div className="px-5 py-4 grid grid-cols-2 gap-4 bg-gradient-to-b from-gray-50 to-white border-b border-dashed border-gray-200">
                    <div>
                      <p className="text-[9px] text-gray-400 uppercase tracking-widest font-semibold mb-1">Invoice No.</p>
                      <p className="font-mono font-bold text-sm text-gray-900">{completedBill.billNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-gray-400 uppercase tracking-widest font-semibold mb-1">Date & Time</p>
                      <p className="font-mono text-sm text-gray-700">{format(new Date(completedBill.billDate), 'dd/MM/yyyy')}</p>
                      <p className="font-mono text-xs text-gray-500">{format(new Date(completedBill.billDate), 'hh:mm a')}</p>
                    </div>
                  </div>

                  {/* Customer Info - Professional Card */}
                  <div className="px-5 py-4 border-b border-dashed border-gray-200">
                    <p className="text-[9px] text-gray-400 uppercase tracking-widest font-semibold mb-2">Billed To</p>
                    <div className="flex items-center gap-3 bg-blue-50/50 rounded-xl p-3 border border-blue-100">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-primary flex items-center justify-center shadow-md">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900">{selectedCustomer?.name || "Walk-in Customer"}</p>
                        {selectedCustomer?.phone && (
                          <p className="text-xs text-gray-500 mt-0.5">📱 {selectedCustomer.phone}</p>
                        )}
                        {selectedCustomer?.email && (
                          <p className="text-xs text-gray-500 truncate">✉️ {selectedCustomer.email}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Items Table - Professional Layout */}
                  <div className="px-5 py-4">
                    <p className="text-[9px] text-gray-400 uppercase tracking-widest font-semibold mb-3">Order Details</p>
                    <div className="space-y-2">
                      {cartItems.map((item, index) => (
                        <div key={item.id} className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:shadow-sm transition-shadow">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm bg-gradient-to-br from-blue-100 to-blue-50 border border-blue-200">
                            <Package className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-gray-900 truncate">{item.name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              ₹{item.price.toFixed(2)} × {item.quantity} {item.unit}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-sm text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                      {additionalServices.map((service) => (
                        <div key={service.id} className="flex items-center gap-3 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-200 to-amber-100 border border-amber-300 flex items-center justify-center shadow-sm">
                            <PlusCircle className="h-5 w-5 text-amber-700" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-gray-900 truncate">{service.name}</p>
                            <p className="text-xs text-amber-600">Additional Charge</p>
                          </div>
                          <p className="font-bold text-sm text-gray-900">₹{service.totalAmount.toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Totals Section - Premium Styling */}
                  <div className="mx-5 mb-4 p-4 bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50 rounded-2xl border border-gray-200 space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium text-gray-800">₹{subtotal.toFixed(2)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-green-600 flex items-center gap-1.5">
                          <Tag className="h-3.5 w-3.5" />
                          Discount Applied
                        </span>
                        <span className="font-semibold text-green-600">-₹{discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    {additionalServicesTotal > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Additional Charges</span>
                        <span className="font-medium text-gray-800">₹{additionalServicesTotal.toFixed(2)}</span>
                      </div>
                    )}
                    
                    <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent my-3"></div>
                    
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-base font-bold text-gray-900">Grand Total</span>
                      <span className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-primary bg-clip-text text-transparent">₹{grandTotal.toFixed(2)}</span>
                    </div>
                    
                    <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent my-2"></div>
                    
                    <div className="flex justify-between items-center text-sm pt-1">
                      <span className="font-medium text-green-700 flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4" />
                        Amount Paid
                      </span>
                      <span className="font-bold text-green-600 text-base">₹{parseFloat(completedBill.paidAmount).toFixed(2)}</span>
                    </div>
                    {parseFloat(completedBill.dueAmount) > 0 && (
                      <div className="flex justify-between items-center text-sm bg-red-50 -mx-4 px-4 py-2 rounded-lg mt-2">
                        <span className="font-medium text-red-700">Balance Due</span>
                        <span className="font-bold text-red-600 text-base">₹{parseFloat(completedBill.dueAmount).toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  {/* Thank You Footer - Elegant */}
                  <div className="px-5 py-6 text-center bg-gradient-to-t from-gray-50 to-white border-t border-dashed border-gray-200">
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-100 to-emerald-100 px-5 py-2 rounded-full shadow-sm border border-green-200 mb-3">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-semibold text-green-700">Payment Confirmed</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">Thank You for Your Business!</p>
                    <p className="text-xs text-gray-500 mt-1">We appreciate your trust in us. Visit again soon! 🙏</p>
                  </div>

                  {/* Powered By Footer - Subtle */}
                  <div className="py-3 px-4 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 flex items-center justify-center gap-2 border-t border-gray-100">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[11px] text-gray-500">
                      Powered by <span className="font-bold text-gray-700">Vyora</span>
                    </span>
                  </div>
                </div>

                {/* Action Buttons - 3 Column Grid */}
                <div className="grid grid-cols-3 gap-2">
                  <Button variant="outline" className="h-12 flex-col gap-0.5 text-xs px-2" onClick={handleDownloadPDF}>
                    <Download className="h-4 w-4" />
                    <span>Download</span>
                  </Button>
                  <Button variant="outline" className="h-12 flex-col gap-0.5 text-xs px-2" onClick={() => {
                    if (billRef.current) {
                      const printWindow = window.open('', '', 'height=800,width=400');
                      if (printWindow) {
                        printWindow.document.write(`
                          <!DOCTYPE html>
                          <html>
                            <head>
                              <title>Print Invoice - ${completedBill?.billNumber || 'Bill'}</title>
                              <style>
                                * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                                body { 
                                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
                                  max-width: 380px;
                                  margin: 0 auto;
                                  background: white;
                                  color: #1a1a1a;
                                }
                                .invoice-wrapper { padding: 0; }
                                @media print { 
                                  body { padding: 0; margin: 0; } 
                                  @page { size: 80mm auto; margin: 5mm; }
                                }
                              </style>
                            </head>
                            <body>
                              <div class="invoice-wrapper">${billRef.current.innerHTML}</div>
                              <script>
                                window.onload = function() {
                                  setTimeout(function() { window.print(); }, 100);
                                  setTimeout(function() { window.close(); }, 1000);
                                }
                              </script>
                            </body>
                          </html>
                        `);
                        printWindow.document.close();
                      }
                    }
                    toast({ title: "🖨️ Opening print dialog..." });
                  }}>
                    <Printer className="h-4 w-4" />
                    <span>Print Bill</span>
                  </Button>
                  <Button variant="outline" className="h-12 flex-col gap-0.5 text-xs px-2" onClick={handleShareWhatsApp}>
                    <Share2 className="h-4 w-4" />
                    <span>WhatsApp</span>
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

      {/* Pro Subscription Upgrade Modal */}
      <ProUpgradeModal 
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        action={blockedAction}
        onUpgrade={() => {
          setShowUpgradeModal(false);
          window.location.href = '/vendor/account';
        }}
      />
    </div>
  );
}
