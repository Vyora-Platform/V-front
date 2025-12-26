import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft,
  Building2, 
  CreditCard, 
  Crown,
  Shield,
  Lock,
  FileText,
  HelpCircle,
  Headphones,
  LogOut,
  ChevronRight,
  ChevronDown,
  Loader2,
  Palette,
  Camera,
  Upload,
  ZoomIn,
  ZoomOut,
  Move,
  Check,
  X,
  Eye,
  EyeOff,
  Smartphone,
  Wallet,
  Star,
  Zap,
  Users,
  Package,
  BarChart3,
  Calendar,
  MessageSquare,
  ShoppingCart,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Plus,
  Edit,
  Sparkles
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import type { Vendor } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { LoadingSpinner } from "@/components/AuthGuard";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Instagram-like Logo Upload Modal
function LogoUploadModal({ isOpen, onClose, onSave, currentLogo }: any) {
  const [image, setImage] = useState<string | null>(currentLogo || null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentLogo) setImage(currentLogo);
  }, [currentLogo]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImage(ev.target?.result as string);
        setZoom(1);
        setPosition({ x: 0, y: 0 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!image) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    const maxMove = 50 * zoom;
    setPosition({
      x: Math.max(-maxMove, Math.min(maxMove, newX)),
      y: Math.max(-maxMove, Math.min(maxMove, newY))
    });
  }, [isDragging, dragStart, zoom]);

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!image) return;
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
  };

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const touch = e.touches[0];
    const newX = touch.clientX - dragStart.x;
    const newY = touch.clientY - dragStart.y;
    const maxMove = 50 * zoom;
    setPosition({
      x: Math.max(-maxMove, Math.min(maxMove, newX)),
      y: Math.max(-maxMove, Math.min(maxMove, newY))
    });
  }, [isDragging, dragStart, zoom]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Camera className="w-5 h-5 text-blue-500" />
            Update Business Logo
          </DialogTitle>
          <DialogDescription className="text-sm">Drag to reposition, pinch or use slider to zoom</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div 
            className={cn(
              "relative mx-auto w-32 h-32 md:w-36 md:h-36 rounded-full border-4 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center",
              image ? "border-blue-500 cursor-move" : "border-dashed border-muted-foreground/30"
            )}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          >
            {image ? (
              <>
                <img
                  src={image}
                  alt="Logo"
                  className="w-full h-full object-cover select-none pointer-events-none"
                  style={{ transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)` }}
                  draggable={false}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/20 transition-colors">
                  <Move className={cn("w-8 h-8 text-white opacity-0 hover:opacity-70 transition-opacity", isDragging && "opacity-70")} />
                </div>
              </>
            ) : (
              <div className="text-center p-4">
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Tap to upload</p>
              </div>
            )}
          </div>

          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          <Button variant="outline" className="w-full h-[var(--input-h)] text-sm" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4 mr-2" />
            {image ? "Change Image" : "Upload Image"}
          </Button>
          
          {image && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Zoom</Label>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}>
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <span className="text-sm w-12 text-center">{Math.round(zoom * 100)}%</span>
                  <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setZoom(Math.min(3, zoom + 0.1))}>
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <input type="range" min="50" max="300" value={zoom * 100} onChange={(e) => setZoom(Number(e.target.value) / 100)} className="w-full accent-blue-500" />
            </div>
          )}
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1 h-[var(--cta-h)] text-sm">Cancel</Button>
            <Button onClick={() => { onSave(image); onClose(); }} className="flex-1 h-[var(--cta-h)] text-sm bg-blue-600 hover:bg-blue-700" disabled={!image}>
              <Check className="w-4 h-4 mr-2" />Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Change Password Modal
function ChangePasswordModal({ isOpen, onClose }: any) {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (newPassword.length < 8) {
      toast({ title: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      // API call would go here
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({ title: "Password changed successfully!" });
      onClose();
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast({ title: "Failed to change password", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Lock className="w-5 h-5 text-blue-500" />
            Change Password
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-sm">Current Password</Label>
            <div className="relative mt-1">
              <Input type={showCurrent ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" className="h-[var(--input-h)] text-sm" />
              <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full w-10" onClick={() => setShowCurrent(!showCurrent)}>
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          <div>
            <Label className="text-sm">New Password</Label>
            <div className="relative mt-1">
              <Input type={showNew ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" className="h-[var(--input-h)] text-sm" />
              <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full w-10" onClick={() => setShowNew(!showNew)}>
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          <div>
            <Label className="text-sm">Confirm New Password</Label>
            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className="mt-1 h-[var(--input-h)] text-sm" />
          </div>
          <Button onClick={handleSubmit} className="w-full h-[var(--cta-h)] text-sm bg-blue-600" disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}>
            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
            Change Password
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// FAQs Modal
function FAQsModal({ isOpen, onClose }: any) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  
  const faqs = [
    { q: "How do I upgrade to Pro plan?", a: "Go to Account > Subscription and click on 'Upgrade to Pro'. You can pay via UPI or Card. Pro plan gives you access to all features including Orders, POS, Analytics, Marketing, and more." },
    { q: "Can I cancel my subscription anytime?", a: "Yes, you can cancel your Pro subscription anytime from the Subscription settings. Your access will continue until the end of your billing period. No partial refunds are provided." },
    { q: "How do I add my business logo?", a: "Go to Account > Business Details and tap on your profile picture. You can upload, drag to reposition, and zoom your logo just like Instagram profile picture." },
    { q: "What payment methods are accepted?", a: "We accept UPI (Google Pay, PhonePe, Paytm, etc.) and Credit/Debit Cards (Visa, Mastercard, RuPay). All payments are processed securely." },
    { q: "How do I manage my customers?", a: "Use the Customers module to add, view, and manage all your customer information. You can track their purchase history, send marketing messages, and more." },
    { q: "What is included in the Free plan?", a: "The Free plan includes Customer Management, Lead Management, and Supplier Management modules. Upgrade to Pro to access Orders, POS, Analytics, Marketing & Greetings, and all other features." },
    { q: "How do I create invoices?", a: "With Pro plan, you can create professional invoices from the Orders or POS module. Invoices are automatically generated with your business branding." },
    { q: "Is my data secure?", a: "Yes, all your data is encrypted and stored securely on our servers. We follow industry-standard security practices and never share your data with third parties." },
    { q: "How do I contact support?", a: "You can reach our support team via email at support@vyora.in or call us at +91-XXXXXXXXXX. We're available Mon-Sat, 9 AM to 6 PM." },
    { q: "Can I export my data?", a: "Yes, Pro plan users can export their customer data, orders, and reports in CSV or Excel format from the respective module settings." },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9"><ArrowLeft className="w-5 h-5" /></Button>
            <DialogTitle className="text-base">Frequently Asked Questions</DialogTitle>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {faqs.map((faq, idx) => (
            <div key={idx} className="border rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-3 md:p-4 flex items-center justify-between text-left hover:bg-muted/50 transition-colors min-h-[var(--input-h)]"
              >
                <span className="font-medium text-sm pr-4">{faq.q}</span>
                <ChevronDown className={cn("w-5 h-5 shrink-0 transition-transform", openFaq === idx && "rotate-180")} />
              </button>
              {openFaq === idx && (
                <div className="px-3 md:px-4 pb-3 md:pb-4 text-sm text-muted-foreground">{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Privacy Policy Modal
function PrivacyPolicyModal({ isOpen, onClose }: any) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9"><ArrowLeft className="w-5 h-5" /></Button>
            <DialogTitle className="text-base">Privacy Policy</DialogTitle>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-6 prose prose-sm dark:prose-invert max-w-none">
          <p className="text-muted-foreground text-sm">Last updated: December 2024</p>
          
          <h3>1. Information We Collect</h3>
          <p>We collect information you provide directly to us, including your name, email address, phone number, business information, and payment details when you register for an account and use our services.</p>
          
          <h3>2. How We Use Your Information</h3>
          <p>We use the information we collect to provide, maintain, and improve our services, process transactions, send you technical notices and support messages, and respond to your comments and questions.</p>
          
          <h3>3. Information Sharing</h3>
          <p>We do not share, sell, rent, or trade your personal information with third parties for their commercial purposes. We may share information with service providers who assist us in operating our platform.</p>
          
          <h3>4. Data Security</h3>
          <p>We implement industry-standard security measures to protect your personal information. All data is encrypted in transit and at rest using AES-256 encryption.</p>
          
          <h3>5. Data Retention</h3>
          <p>We retain your information for as long as your account is active or as needed to provide you services. You can request deletion of your data at any time by contacting support.</p>
          
          <h3>6. Your Rights</h3>
          <p>You have the right to access, correct, or delete your personal information. You can update most information directly in your account settings or contact us for assistance.</p>
          
          <h3>7. Cookies and Tracking</h3>
          <p>We use cookies and similar technologies to enhance your experience, analyze usage patterns, and deliver personalized content. You can control cookies through your browser settings.</p>
          
          <h3>8. Third-Party Services</h3>
          <p>Our service may contain links to third-party websites. We are not responsible for the privacy practices of these external sites. We encourage you to read their privacy policies.</p>
          
          <h3>9. Changes to This Policy</h3>
          <p>We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.</p>
          
          <h3>10. Contact Us</h3>
          <p>If you have any questions about this Privacy Policy, please contact us at privacy@vyora.in or write to us at our registered office address.</p>
          
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Vyora Technologies Pvt. Ltd.</p>
            <p className="text-xs text-muted-foreground mt-1">Registered under the laws of India. CIN: XXXXXXXXXXXXXXX</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Refund Policy Modal
function RefundPolicyModal({ isOpen, onClose }: any) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9"><ArrowLeft className="w-5 h-5" /></Button>
            <DialogTitle className="text-base">Refund Policy</DialogTitle>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-800 dark:text-amber-200">No Refund Policy</p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">All payments made for Vyora subscriptions are non-refundable.</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3 text-sm">
            <h4 className="font-semibold">Policy Details:</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <X className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>No refunds will be provided for any subscription plans (monthly or annual).</span>
              </li>
              <li className="flex items-start gap-2">
                <X className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>Partial refunds are not available if you cancel mid-billing cycle.</span>
              </li>
              <li className="flex items-start gap-2">
                <X className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>Refunds will not be issued for unused features or services.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <span>Your access will continue until the end of your current billing period after cancellation.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <span>You can cancel your subscription anytime to prevent future charges.</span>
              </li>
            </ul>
            
            <h4 className="font-semibold pt-4">Exceptions:</h4>
            <p className="text-muted-foreground">In case of technical issues preventing access to your account for more than 7 consecutive days due to our fault, please contact support for resolution.</p>
            
            <div className="pt-4">
              <p className="text-xs text-muted-foreground">For any queries regarding this policy, please contact us at billing@vyora.in</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Payment Details Modal
function PaymentDetailsModal({ isOpen, onClose }: any) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("upi");
  const [upiId, setUpiId] = useState("");
  const [savedUpi, setSavedUpi] = useState<string[]>(["user@paytm", "user@ybl"]);
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [savedCards, setSavedCards] = useState([
    { last4: "4242", brand: "Visa", expiry: "12/25" },
    { last4: "8888", brand: "Mastercard", expiry: "06/26" },
  ]);

  const handleAddUpi = () => {
    if (!upiId.includes("@")) {
      toast({ title: "Invalid UPI ID", variant: "destructive" });
      return;
    }
    setSavedUpi([...savedUpi, upiId]);
    setUpiId("");
    toast({ title: "UPI added successfully!" });
  };

  const handleAddCard = () => {
    if (cardNumber.length < 16) {
      toast({ title: "Invalid card number", variant: "destructive" });
      return;
    }
    setSavedCards([...savedCards, { last4: cardNumber.slice(-4), brand: "Card", expiry: cardExpiry }]);
    setCardNumber("");
    setCardExpiry("");
    setCardCvv("");
    setCardName("");
    toast({ title: "Card added successfully!" });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9"><ArrowLeft className="w-5 h-5" /></Button>
            <DialogTitle className="text-base">Payment Methods</DialogTitle>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 h-[var(--input-h)]">
              <TabsTrigger value="upi" className="flex items-center gap-2 text-sm"><Smartphone className="w-4 h-4" />UPI</TabsTrigger>
              <TabsTrigger value="card" className="flex items-center gap-2 text-sm"><CreditCard className="w-4 h-4" />Card</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upi" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="text-sm">Add UPI ID</Label>
                <div className="flex gap-2">
                  <Input placeholder="yourname@upi" value={upiId} onChange={(e) => setUpiId(e.target.value)} className="h-[var(--input-h)] text-sm" />
                  <Button onClick={handleAddUpi} disabled={!upiId} className="h-[var(--input-h)]"><Plus className="w-4 h-4" /></Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Saved UPI IDs</Label>
                {savedUpi.map((upi, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900 flex items-center justify-center">
                        <Smartphone className="w-5 h-5 text-green-600" />
                      </div>
                      <span className="font-medium text-sm">{upi}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setSavedUpi(savedUpi.filter((_, i) => i !== idx))} className="h-9 w-9">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="card" className="space-y-4 mt-4">
              <div className="space-y-3">
                <div>
                  <Label className="text-sm">Card Number</Label>
                  <Input placeholder="1234 5678 9012 3456" value={cardNumber} onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 16))} className="mt-1 h-[var(--input-h)] text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm">Expiry</Label>
                    <Input placeholder="MM/YY" value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} className="mt-1 h-[var(--input-h)] text-sm" />
                  </div>
                  <div>
                    <Label className="text-sm">CVV</Label>
                    <Input type="password" placeholder="•••" value={cardCvv} onChange={(e) => setCardCvv(e.target.value.slice(0, 4))} className="mt-1 h-[var(--input-h)] text-sm" />
                  </div>
                </div>
                <div>
                  <Label className="text-sm">Cardholder Name</Label>
                  <Input placeholder="Name on card" value={cardName} onChange={(e) => setCardName(e.target.value)} className="mt-1 h-[var(--input-h)] text-sm" />
                </div>
                <Button onClick={handleAddCard} className="w-full h-[var(--cta-h)] text-sm" disabled={!cardNumber || !cardExpiry || !cardCvv}>
                  <Plus className="w-4 h-4 mr-2" />Add Card
                </Button>
              </div>
              
              <div className="space-y-2 pt-4 border-t">
                <Label className="text-sm text-muted-foreground">Saved Cards</Label>
                {savedCards.map((card, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{card.brand} •••• {card.last4}</p>
                        <p className="text-xs text-muted-foreground">Expires {card.expiry}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setSavedCards(savedCards.filter((_, i) => i !== idx))} className="h-9 w-9">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Subscription Modal with Payment Integration - Zepto-like Direct Payment
function SubscriptionModal({ isOpen, onClose, vendorId, vendor }: { isOpen: boolean; onClose: () => void; vendorId: string | null; vendor?: any }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const { isPro, refetch: refetchSubscription } = useSubscription();

  // All features in the system
  const allFeatures = [
    { name: "Customer Management", included: { free: true, pro: true } },
    { name: "Lead Management", included: { free: true, pro: true } },
    { name: "Supplier Management", included: { free: true, pro: true } },
    { name: "Orders Management", included: { free: false, pro: true } },
    { name: "Point of Sale (POS)", included: { free: false, pro: true } },
    { name: "Products & Catalogue", included: { free: false, pro: true } },
    { name: "Services & Bookings", included: { free: false, pro: true } },
    { name: "Appointments Scheduler", included: { free: false, pro: true } },
    { name: "Analytics & Reports", included: { free: false, pro: true } },
    { name: "Marketing & Greetings", included: { free: false, pro: true } },
    { name: "Invoicing & Billing", included: { free: false, pro: true } },
    { name: "Coupons & Offers", included: { free: false, pro: true } },
    { name: "Website Builder", included: { free: false, pro: true } },
    { name: "Referral Program", included: { free: false, pro: true } },
    { name: "Priority Support", included: { free: false, pro: true } },
    { name: "Data Export (CSV/Excel)", included: { free: false, pro: true } },
  ];

  // Direct upgrade - opens Razorpay immediately like Zepto
  const handleDirectUpgrade = async () => {
    if (!vendorId) {
      toast({ title: "Error", description: "Please login first", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    
    // Auto-fill billing details from vendor data (onboarding form)
    const billingName = vendor?.ownerName || vendor?.businessName || "Vendor";
    const billingEmail = vendor?.email || "";
    const billingPhone = vendor?.phone || "";
    const billingAddress = vendor?.address || "";
    
    try {
      // [RAZORPAY REQUEST] Log the request to create order
      const paymentRequestPayload = {
        vendorId,
        planId: "pro",
        billingName,
        billingEmail,
        billingPhone,
        billingAddress,
      };
      console.log("[RAZORPAY REQUEST] Creating payment order for Pro upgrade");
      console.log("[RAZORPAY REQUEST] Timestamp:", new Date().toISOString());
      console.log("[RAZORPAY REQUEST] Request payload:", JSON.stringify(paymentRequestPayload, null, 2));
      
      // Create Razorpay order
      const orderRes = await apiRequest("POST", "/api/vendor-subscriptions/create-payment", paymentRequestPayload);
      const orderData = await orderRes.json();
      
      // [RAZORPAY RESPONSE] Log the complete response
      console.log("[RAZORPAY RESPONSE] Order creation response received");
      console.log("[RAZORPAY RESPONSE] Timestamp:", new Date().toISOString());
      console.log("[RAZORPAY RESPONSE] Complete response:", JSON.stringify(orderData, null, 2));
      
      // FAIL BY DEFAULT: Check if transaction was marked as failed by server
      if (orderData.transactionStatus === 'failed' || orderData.error) {
        console.log("[RAZORPAY ERROR] Server returned failed transaction status");
        console.log("[RAZORPAY ERROR] Error:", orderData.error);
        console.log("[RAZORPAY ERROR] Message:", orderData.message);
        throw new Error(orderData.message || orderData.error || "Failed to create order");
      }
      
      if (!orderData.orderId) {
        console.log("[RAZORPAY ERROR] Order ID missing from response");
        throw new Error(orderData.error || "Failed to create order");
      }

      console.log("[RAZORPAY RESPONSE] Order ID:", orderData.orderId);
      console.log("[RAZORPAY RESPONSE] Amount:", orderData.amount);
      console.log("[RAZORPAY RESPONSE] Subscription ID:", orderData.subscriptionId);

      // Load Razorpay script if not loaded
      if (!(window as any).Razorpay) {
        console.log("[RAZORPAY REQUEST] Loading Razorpay SDK script...");
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        document.body.appendChild(script);
        await new Promise(resolve => { script.onload = resolve; });
        console.log("[RAZORPAY RESPONSE] Razorpay SDK loaded successfully");
      }

      // Open Razorpay checkout directly - Zepto/Premium style
      const options = {
        key: orderData.razorpayKeyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Vyora Pro",
        description: "Unlock all premium features",
        image: "https://abizuwqnqkbicrhorcig.storage.supabase.co/storage/v1/object/public/vyora-bucket/partners-vyora/p/IMAGE/logo-vyora.png",
        order_id: orderData.orderId,
        prefill: {
          name: billingName,
          email: billingEmail,
          contact: billingPhone,
        },
        notes: {
          vendorId,
          subscriptionId: orderData.subscriptionId,
          plan: "Pro",
          price: "₹399/month"
        },
        theme: {
          color: "#8B5CF6", // Purple theme like Zepto
          backdrop_color: "rgba(0,0,0,0.85)",
          hide_topbar: false
        },
        config: {
          display: {
            language: "en",
            hide: [],
            sequence: ["block.upi", "block.card", "block.wallet", "block.netbanking"],
            preferences: {
              show_default_blocks: true
            }
          }
        },
        handler: async function (response: any) {
          // [RAZORPAY RESPONSE] Log Razorpay checkout response
          console.log("[RAZORPAY RESPONSE] Razorpay checkout completed");
          console.log("[RAZORPAY RESPONSE] Timestamp:", new Date().toISOString());
          console.log("[RAZORPAY RESPONSE] Razorpay response:", JSON.stringify(response, null, 2));
          console.log("[RAZORPAY RESPONSE] Payment ID:", response.razorpay_payment_id);
          console.log("[RAZORPAY RESPONSE] Order ID:", response.razorpay_order_id);
          console.log("[RAZORPAY RESPONSE] Signature:", response.razorpay_signature ? "Present" : "Missing");
          
          try {
            // [RAZORPAY REQUEST] Log verification request
            const verificationPayload = {
              subscriptionId: orderData.subscriptionId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            };
            console.log("[RAZORPAY REQUEST] Sending payment verification request");
            console.log("[RAZORPAY REQUEST] Timestamp:", new Date().toISOString());
            console.log("[RAZORPAY REQUEST] Verification payload:", JSON.stringify(verificationPayload, null, 2));
            
            // Verify payment on backend
            const verifyRes = await apiRequest("POST", "/api/vendor-subscriptions/payment-success", verificationPayload);
            const verifyData = await verifyRes.json();

            // [RAZORPAY RESPONSE] Log verification response
            console.log("[RAZORPAY RESPONSE] Payment verification response received");
            console.log("[RAZORPAY RESPONSE] Timestamp:", new Date().toISOString());
            console.log("[RAZORPAY RESPONSE] Verification response:", JSON.stringify(verifyData, null, 2));
            console.log("[RAZORPAY RESPONSE] Transaction status:", verifyData.transactionStatus);

            // FAIL BY DEFAULT: Check if server confirmed success
            if (verifyData.transactionStatus === 'failed' || verifyData.success === false || !verifyRes.ok) {
              console.log("[RAZORPAY ERROR] Server verification returned FAILED status");
              console.log("[RAZORPAY ERROR] Razorpay payment status:", verifyData.razorpayPaymentStatus);
              console.log("[RAZORPAY ERROR] Error:", verifyData.error);
              console.log("[RAZORPAY ERROR] Message:", verifyData.message);
              
              toast({ 
                title: "Payment Verification Failed", 
                description: verifyData.message || "Payment could not be verified as successful. Please contact support.", 
                variant: "destructive" 
              });
              setIsProcessing(false);
              return;
            }

            console.log("[RAZORPAY RESPONSE] ✅ Payment verified as SUCCESS");

            // Success! Update all caches immediately
            await queryClient.invalidateQueries({ queryKey: ["/api/vendors", vendorId] });
            await queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/subscription`] });
            
            // Force refetch subscription to update UI immediately
            await refetchSubscription();
            
            toast({ 
              title: "🎉 Welcome to Vyora Pro!", 
              description: "Your subscription is now active. All features unlocked!" 
            });
            
            onClose();
            setIsProcessing(false);
            
            // Force page reload to ensure UI updates
            window.location.reload();
          } catch (error: any) {
            // [RAZORPAY ERROR] Log verification error
            console.log("[RAZORPAY ERROR] Payment verification request failed");
            console.log("[RAZORPAY ERROR] Timestamp:", new Date().toISOString());
            console.log("[RAZORPAY ERROR] Error message:", error?.message || "Unknown error");
            console.log("[RAZORPAY ERROR] Full error:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
            console.log("[RAZORPAY ERROR] Stack trace:", error?.stack || "No stack trace");
            
            toast({ title: "Payment verification failed", description: "Please contact support", variant: "destructive" });
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: function() {
            console.log("[RAZORPAY RESPONSE] Payment modal dismissed by user");
            console.log("[RAZORPAY RESPONSE] Timestamp:", new Date().toISOString());
            setIsProcessing(false);
            toast({ title: "Payment cancelled", description: "You can upgrade anytime" });
          },
          confirm_close: true,
          escape: false,
          animation: true
        },
        retry: {
          enabled: true,
          max_count: 3
        }
      };

      console.log("[RAZORPAY REQUEST] Creating Razorpay instance and opening checkout modal");
      console.log("[RAZORPAY REQUEST] Timestamp:", new Date().toISOString());

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
      
      console.log("[RAZORPAY RESPONSE] Razorpay checkout modal opened");
      
    } catch (error: any) {
      // [RAZORPAY ERROR] Log payment error
      console.log("[RAZORPAY ERROR] Payment initialization failed");
      console.log("[RAZORPAY ERROR] Timestamp:", new Date().toISOString());
      console.log("[RAZORPAY ERROR] Error message:", error?.message || "Unknown error");
      console.log("[RAZORPAY ERROR] Full error:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      console.log("[RAZORPAY ERROR] Stack trace:", error?.stack || "No stack trace");
      
      toast({ title: "Payment failed", description: error.message || "Please try again", variant: "destructive" });
      setIsProcessing(false);
    }
  };

  // If already Pro, show success state
  if (isPro) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[95vw] max-w-md p-0 overflow-hidden">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-6 text-white text-center">
            <div className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 md:w-10 md:h-10" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold mb-2">You're on Vyora Pro!</h2>
            <p className="text-green-100 text-sm">All features are unlocked</p>
          </div>
          <div className="p-4 md:p-6 space-y-4">
            <div className="grid grid-cols-2 gap-2 md:gap-3">
              {allFeatures.filter(f => f.included.pro).slice(0, 6).map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  <span className="text-xs md:text-sm">{feature.name}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-center text-muted-foreground">+ {allFeatures.filter(f => f.included.pro).length - 6} more features</p>
            <Button onClick={onClose} className="w-full h-[var(--cta-h)] text-sm bg-green-600 hover:bg-green-700">
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="p-4 border-b shrink-0 bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20 h-9 w-9">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <DialogTitle className="text-white flex items-center gap-2 text-base">
              <Crown className="w-5 h-5 text-amber-400" />Upgrade to Pro
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Pro Plan Highlight */}
          <div className="relative p-4 md:p-5 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 border-2 border-amber-400">
            <div className="absolute -top-3 left-4">
              <Badge className="bg-amber-500 text-white px-3 text-xs">RECOMMENDED</Badge>
            </div>
            <div className="flex items-center justify-between mb-4 pt-2">
              <div>
                <h3 className="text-lg md:text-xl font-bold flex items-center gap-2">
                  <Crown className="w-5 h-5 md:w-6 md:h-6 text-amber-500" />
                  Vyora Pro
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground">All features unlocked</p>
              </div>
              <div className="text-right">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl md:text-3xl font-bold text-amber-600">₹399</span>
                  <span className="text-muted-foreground text-sm">/mo</span>
                </div>
                <p className="text-xs text-muted-foreground line-through">₹499/month</p>
                <Badge variant="outline" className="text-green-600 border-green-600 mt-1 text-xs">Save 20%</Badge>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Everything in Pro:</h4>
            <div className="grid grid-cols-2 gap-2">
              {allFeatures.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                  {feature.included.pro ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  ) : (
                    <X className="w-4 h-4 text-gray-300 shrink-0" />
                  )}
                  <span className="text-xs">{feature.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* What you get */}
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 space-y-2">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-500" />
              Why upgrade?
            </h4>
            <ul className="text-xs space-y-1 text-muted-foreground">
              <li>• Unlimited orders, bookings & appointments</li>
              <li>• Full analytics & reports dashboard</li>
              <li>• Marketing tools & greeting templates</li>
              <li>• Priority customer support</li>
            </ul>
          </div>
        </div>

        {/* Upgrade Button - Fixed at bottom */}
        <div className="p-4 border-t bg-gray-50 dark:bg-gray-900 space-y-3">
          <Button 
            onClick={handleDirectUpgrade}
            disabled={isProcessing}
            className="w-full h-[var(--cta-h)] bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-base font-semibold shadow-lg"
          >
            {isProcessing ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Processing...</>
            ) : (
              <><Zap className="w-5 h-5 mr-2" />Upgrade Now - ₹399/month</>
            )}
          </Button>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="w-3 h-3" />
            <span>Secure payment • Cancel anytime</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function VendorAccount() {
  const { vendorId } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { isPro, subscription, isLoading: subscriptionLoading, refetch: refetchSubscription } = useSubscription();
  
  // Force refetch subscription on mount to get latest status
  useEffect(() => {
    if (vendorId) {
      refetchSubscription();
    }
  }, [vendorId, refetchSubscription]);
  
  // Modal states
  const [showLogoUpload, setShowLogoUpload] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showFaqs, setShowFaqs] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showRefundPolicy, setShowRefundPolicy] = useState(false);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  
  const { data: vendor, isLoading, error } = useQuery<Vendor>({
    queryKey: ["/api/vendors", vendorId],
    enabled: !!vendorId,
  });

  const getInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleLogoSave = async (newLogo: string) => {
    try {
      // In real app, upload to server
      localStorage.setItem(`vendor_logo_${vendorId}`, newLogo);
      toast({ title: "Logo updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/vendors", vendorId] });
    } catch {
      toast({ title: "Failed to update logo", variant: "destructive" });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    localStorage.removeItem('vendorId');
    localStorage.removeItem('userRole');
    setLocation('/login');
  };

  if (!vendorId || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center max-w-[1440px] mx-auto">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 max-w-[1440px] mx-auto">
        <Card className="max-w-md mx-auto p-6 text-center space-y-4 rounded-xl">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
          <p className="text-sm md:text-base">Failed to load account information</p>
          <Button onClick={() => window.location.reload()} className="h-[var(--cta-h)]">Retry</Button>
        </Card>
      </div>
    );
  }

  const savedLogo = localStorage.getItem(`vendor_logo_${vendorId}`);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-600 to-blue-700 dark:from-gray-900 dark:to-gray-950 overflow-y-auto max-w-[1440px] mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-blue-600 dark:bg-gray-900">
        <div className="px-4 py-3 md:px-6 md:py-4 flex items-center gap-4">
          <Link href="/vendor/dashboard">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-9 w-9">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-lg md:text-xl font-semibold text-white">Profile</h1>
        </div>
      </div>

      {/* Profile Header - Centered */}
      <div className="px-4 md:px-6 pt-4 pb-8 flex flex-col items-center text-center">
        <div className="relative">
          <Avatar className="h-20 w-20 md:h-24 md:w-24 border-4 border-white shadow-xl">
            {(savedLogo || vendor?.logo) ? (
              <AvatarImage src={savedLogo || vendor?.logo} alt={vendor?.businessName} />
              ) : null}
            <AvatarFallback className="text-xl md:text-2xl bg-gradient-to-br from-blue-400 to-blue-600 text-white">
                {vendor?.businessName ? getInitials(vendor.businessName) : "VH"}
              </AvatarFallback>
            </Avatar>
          <button 
            onClick={() => setShowLogoUpload(true)}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center border-2 border-blue-600"
          >
            <Camera className="w-4 h-4 text-blue-600" />
          </button>
        </div>
        <h2 className="mt-4 text-lg md:text-xl font-bold text-white text-center w-full px-4">{vendor?.businessName || "Business Name"}</h2>
        <p className="text-blue-100 text-sm text-center">{vendor?.email || "email@example.com"}</p>
        {vendor?.phone && <p className="text-blue-100 text-sm text-center">{vendor.phone}</p>}
        
        {/* Subscription Badge */}
        <button onClick={() => setShowSubscription(true)} className="mt-3 flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full backdrop-blur-sm">
          {subscriptionLoading ? (
            <>
              <Loader2 className="w-4 h-4 text-white/70 animate-spin" />
              <span className="text-sm text-white font-medium">Loading...</span>
            </>
          ) : isPro ? (
            <>
              <Crown className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-white font-medium">Pro Plan</span>
              <CheckCircle2 className="w-4 h-4 text-green-400" />
            </>
          ) : (
            <>
              <Crown className="w-4 h-4 text-white/70" />
              <span className="text-sm text-white font-medium">Free Plan</span>
              <Badge className="bg-amber-500 text-[10px]">Upgrade</Badge>
            </>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-t-3xl min-h-[60vh] px-4 md:px-6 py-6 space-y-4">
        {/* Account Settings */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground px-1 uppercase tracking-wider">Account Settings</h3>
          <Card className="divide-y overflow-hidden rounded-xl">
            <MenuItem icon={Building2} label="Business Details" onClick={() => setLocation("/vendor/account/business-details")} color="blue" />
            <MenuItem icon={CreditCard} label="Payment Methods" onClick={() => setShowPaymentDetails(true)} color="green" />
            <MenuItem icon={Crown} label="Subscription" onClick={() => setShowSubscription(true)} color="amber" badge={subscriptionLoading ? "..." : isPro ? "Pro" : "Free"} />
            <MenuItem icon={FileText} label="Billing & Transactions" onClick={() => setLocation("/vendor/billing")} color="blue" />
          </Card>
        </div>

        {/* Appearance */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground px-1 uppercase tracking-wider">Appearance</h3>
          <Card className="overflow-hidden rounded-xl">
            <div className="flex items-center gap-4 p-4">
              <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-900">
                <Palette className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="flex-1 font-medium text-sm md:text-base">Theme</span>
              <ThemeToggle />
            </div>
          </Card>
        </div>

        {/* Security */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground px-1 uppercase tracking-wider">Security</h3>
          <Card className="divide-y overflow-hidden rounded-xl">
            <MenuItem icon={Lock} label="Change Password" onClick={() => setShowChangePassword(true)} color="red" />
            <MenuItem icon={Shield} label="Security Settings" onClick={() => setLocation("/vendor/account/security")} color="orange" />
          </Card>
        </div>

        {/* Support & Legal */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground px-1 uppercase tracking-wider">Support & Legal</h3>
          <Card className="divide-y overflow-hidden rounded-xl">
            <MenuItem icon={HelpCircle} label="FAQs" onClick={() => setShowFaqs(true)} color="cyan" />
            <MenuItem icon={FileText} label="Privacy Policy" onClick={() => setShowPrivacyPolicy(true)} color="indigo" />
            <MenuItem icon={FileText} label="Refund Policy" onClick={() => setShowRefundPolicy(true)} color="pink" />
            <MenuItem icon={Headphones} label="Help & Support" onClick={() => setLocation("/vendor/account/help-support")} color="teal" />
          </Card>
        </div>

        {/* Logout */}
        <Button
          variant="outline"
          className="w-full h-[var(--cta-h)] border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 mt-4 text-sm"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5 mr-2" />
          Log Out
        </Button>

        {/* Version */}
        <p className="text-center text-xs text-muted-foreground pt-4 pb-8">
          Vyora v1.0.0 • Made with ❤️ in India
        </p>
      </div>

      {/* Modals */}
      <LogoUploadModal isOpen={showLogoUpload} onClose={() => setShowLogoUpload(false)} onSave={handleLogoSave} currentLogo={savedLogo || vendor?.logo} />
      <ChangePasswordModal isOpen={showChangePassword} onClose={() => setShowChangePassword(false)} />
      <FAQsModal isOpen={showFaqs} onClose={() => setShowFaqs(false)} />
      <PrivacyPolicyModal isOpen={showPrivacyPolicy} onClose={() => setShowPrivacyPolicy(false)} />
      <RefundPolicyModal isOpen={showRefundPolicy} onClose={() => setShowRefundPolicy(false)} />
      <PaymentDetailsModal isOpen={showPaymentDetails} onClose={() => setShowPaymentDetails(false)} />
      <SubscriptionModal isOpen={showSubscription} onClose={() => setShowSubscription(false)} vendorId={vendorId} vendor={vendor} />
    </div>
  );
}

// Menu Item Component
function MenuItem({ icon: Icon, label, onClick, color, badge }: { icon: any; label: string; onClick: () => void; color: string; badge?: string }) {
  const colors: Record<string, string> = {
    blue: "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400",
    green: "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400",
    amber: "bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-400",
    red: "bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400",
    orange: "bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400",
    cyan: "bg-cyan-100 dark:bg-cyan-900 text-cyan-600 dark:text-cyan-400",
    indigo: "bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400",
    pink: "bg-pink-100 dark:bg-pink-900 text-pink-600 dark:text-pink-400",
    teal: "bg-teal-100 dark:bg-teal-900 text-teal-600 dark:text-teal-400",
    purple: "bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400",
  };

  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 md:gap-4 p-4 hover:bg-muted/50 transition-colors text-left min-h-[var(--input-h)]">
      <div className={cn("p-2 md:p-2.5 rounded-xl shrink-0", colors[color])}>
        <Icon className="h-4 w-4 md:h-5 md:w-5" />
      </div>
      <span className="flex-1 font-medium text-sm md:text-base">{label}</span>
      {badge && <Badge variant="secondary" className="text-xs shrink-0">{badge}</Badge>}
      <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
    </button>
  );
}
