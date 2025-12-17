import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { getApiUrl } from "@/lib/config";
import { apiRequest } from "@/lib/queryClient";
import { 
  ArrowLeft, 
  Copy, 
  Share2, 
  Gift, 
  Users, 
  Coins, 
  CheckCircle, 
  ChevronDown,
  ChevronUp,
  Clock,
  UserPlus,
  CreditCard,
  Calculator,
  Sparkles,
  TrendingUp,
  Wallet,
  Building2,
  Smartphone,
  AlertCircle,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function VendorReferral() {
  const { vendorId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [referralCount, setReferralCount] = useState([5]);
  const [withdrawMethod, setWithdrawMethod] = useState<"upi" | "bank_transfer">("upi");
  const [withdrawForm, setWithdrawForm] = useState({
    amount: "",
    upiId: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    accountHolderName: "",
  });
  
  // Generate referral code based on vendor ID
  const referralCode = vendorId ? vendorId.slice(0, 8).toLowerCase() : "vyoraref";
  const referralLink = `https://vyora.in/ref/${referralCode}`;
  
  // Fetch referral stats from database
  const { data: stats } = useQuery({
    queryKey: [`/api/vendors/${vendorId}/referral-stats`],
    queryFn: async () => {
      try {
        const response = await fetch(getApiUrl(`/api/vendors/${vendorId}/referral-stats`));
        if (!response.ok) return null;
        return response.json();
      } catch {
        return null;
      }
    },
    enabled: !!vendorId,
  });

  // Fetch referral history
  const { data: referrals = [] } = useQuery({
    queryKey: [`/api/vendors/${vendorId}/referrals`],
    queryFn: async () => {
      try {
        const response = await fetch(getApiUrl(`/api/vendors/${vendorId}/referrals`));
        if (!response.ok) return [];
        return response.json();
      } catch {
        return [];
      }
    },
    enabled: !!vendorId,
  });

  // Fetch withdrawal history
  const { data: withdrawals = [] } = useQuery({
    queryKey: [`/api/vendors/${vendorId}/withdrawals`],
    queryFn: async () => {
      try {
        const response = await fetch(getApiUrl(`/api/vendors/${vendorId}/withdrawals`));
        if (!response.ok) return [];
        return response.json();
      } catch {
        return [];
      }
    },
    enabled: !!vendorId,
  });

  // Withdrawal mutation
  const withdrawMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", `/api/vendors/${vendorId}/withdrawals`, data);
    },
    onSuccess: () => {
      toast({ title: "Success!", description: "Withdrawal request submitted" });
      setShowWithdrawModal(false);
      setWithdrawForm({ amount: "", upiId: "", bankName: "", accountNumber: "", ifscCode: "", accountHolderName: "" });
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/referral-stats`] });
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${vendorId}/withdrawals`] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to withdraw", variant: "destructive" });
    },
  });
  
  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    toast({ title: "Copied!", description: "Referral code copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };
  
  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast({ title: "Copied!", description: "Referral link copied to clipboard" });
  };
  
  const shareReferral = async () => {
    const shareData = {
      title: 'Join Vyora Business Platform',
      text: `Use my referral code ${referralCode} to get ₹200 credits on signup! Join Vyora - the complete business management platform.`,
      url: referralLink,
    };
    
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
        toast({ title: "Copied!", description: "Referral message copied to clipboard" });
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const handleWithdraw = () => {
    const amount = Number(withdrawForm.amount);
    if (amount < 400) {
      toast({ title: "Error", description: "Minimum withdrawal is ₹400 (2 referrals)", variant: "destructive" });
      return;
    }
    if (withdrawMethod === "upi" && !withdrawForm.upiId) {
      toast({ title: "Error", description: "Please enter UPI ID", variant: "destructive" });
      return;
    }
    if (withdrawMethod === "bank_transfer" && (!withdrawForm.bankName || !withdrawForm.accountNumber || !withdrawForm.ifscCode || !withdrawForm.accountHolderName)) {
      toast({ title: "Error", description: "Please fill all bank details", variant: "destructive" });
      return;
    }
    withdrawMutation.mutate({
      amount: withdrawForm.amount,
      withdrawMethod,
      ...(withdrawMethod === "upi" ? { upiId: withdrawForm.upiId } : {
        bankName: withdrawForm.bankName,
        accountNumber: withdrawForm.accountNumber,
        ifscCode: withdrawForm.ifscCode,
        accountHolderName: withdrawForm.accountHolderName,
      }),
    });
  };

  // Calculate earnings based on slider
  const calculateEarnings = (count: number) => count * 200;
  const earnings = calculateEarnings(referralCount[0]);
  const availableBalance = stats?.totalEarnings ? Number(stats.totalEarnings) : 0;
  const canWithdraw = availableBalance >= 400;

  const howItWorks = [
    { step: 1, title: "Share", desc: "Your Code", icon: Share2, color: "from-blue-500 to-blue-600" },
    { step: 2, title: "Friend", desc: "Signs Up", icon: UserPlus, color: "from-purple-500 to-purple-600" },
    { step: 3, title: "They", desc: "Subscribe", icon: CreditCard, color: "from-pink-500 to-pink-600" },
    { step: 4, title: "You Earn", desc: "₹200", icon: Gift, color: "from-emerald-500 to-emerald-600" },
  ];

  const termsConditions = [
    "Referral commission of ₹200 will be credited only when the referred user SUBSCRIBES to any Vyora paid plan.",
    "The referred user must use your referral code during registration.",
    "Minimum withdrawal amount is ₹400 (at least 2 successful referrals required).",
    "Rewards are credited within 7 business days after successful subscription.",
    "Withdrawals are processed within 3-5 business days.",
    "Self-referrals are not allowed and will result in disqualification.",
    "Vyora reserves the right to modify or terminate this program at any time.",
    "Maximum 50 referrals per month per user.",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-600 via-blue-500 to-blue-600 dark:from-blue-900 dark:via-blue-800 dark:to-blue-900">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-blue-600/95 dark:bg-blue-900/95 backdrop-blur-sm">
        <div className="flex items-center gap-3 p-4 max-w-4xl mx-auto">
          <Link href="/vendor/dashboard">
            <Button variant="ghost" size="icon" className="shrink-0 text-white hover:bg-white/20">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-bold text-white">Refer & Earn</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto pb-20 md:pb-6">
        {/* Hero Section */}
        <div className="p-6 text-center">
          <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <Gift className="w-12 h-12 text-white" />
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Earn ₹200 Per Referral
          </h2>
          
          <p className="text-sm text-white/80 max-w-sm mx-auto">
            Invite friends to Vyora and earn rewards when they subscribe
          </p>
        </div>

        {/* Balance Card with Withdraw */}
        <div className="px-4 py-2">
          <Card className="border-0 shadow-xl bg-white dark:bg-background overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Available Balance</p>
                  <p className="text-3xl font-bold text-emerald-600">₹{availableBalance.toLocaleString()}</p>
                </div>
                <Button
                  onClick={() => setShowWithdrawModal(true)}
                  disabled={!canWithdraw}
                  className={cn(
                    "rounded-xl px-6",
                    canWithdraw ? "bg-emerald-600 hover:bg-emerald-700" : "bg-muted text-muted-foreground"
                  )}
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  Withdraw
                </Button>
              </div>
              {!canWithdraw && (
                <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg">
                  <AlertCircle className="w-4 h-4" />
                  <span>Minimum ₹400 required to withdraw (2 referrals)</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Referral Code Card */}
        <div className="px-4 py-2">
          <Card className="border-0 shadow-lg bg-white dark:bg-background overflow-hidden">
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground mb-1">Your Referral Code</p>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl font-bold tracking-widest text-foreground">{referralCode}</span>
                <Button variant="outline" size="icon" className="rounded-lg h-9 w-9" onClick={copyReferralCode}>
                  {copied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <div className="flex gap-2">
                <Button onClick={shareReferral} className="flex-1 bg-blue-600 hover:bg-blue-700 font-semibold rounded-xl">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Now
                </Button>
                <Button onClick={copyReferralLink} variant="outline" className="rounded-xl px-4">
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Row */}
        <div className="px-4 py-3">
          <div className="grid grid-cols-3 gap-3">
            <Card className="border-0 shadow-md bg-white dark:bg-background">
              <CardContent className="p-3 text-center">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-2">
                  <Coins className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-lg font-bold">₹{availableBalance.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">Total Earned</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md bg-white dark:bg-background">
              <CardContent className="p-3 text-center">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-2">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-lg font-bold">{stats?.successfulReferrals || 0}</p>
                <p className="text-[10px] text-muted-foreground">Referrals</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md bg-white dark:bg-background">
              <CardContent className="p-3 text-center">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-2">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <p className="text-lg font-bold">₹{stats?.pendingEarnings ? Number(stats.pendingEarnings).toLocaleString() : 0}</p>
                <p className="text-[10px] text-muted-foreground">Pending</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Earnings Calculator */}
        <div className="px-4 py-2">
          <Card className="border-0 shadow-md bg-white dark:bg-background overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-4 text-white">
              <h3 className="font-bold flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Earnings Calculator
              </h3>
            </div>
            <CardContent className="p-5">
              <div className="text-center mb-4">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <span className="text-3xl font-bold text-emerald-600">₹{earnings.toLocaleString()}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  from <span className="font-bold text-foreground">{referralCount[0]}</span> referrals
                </p>
              </div>
              <Slider value={referralCount} onValueChange={setReferralCount} max={50} min={1} step={1} className="w-full mb-3" />
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 25, 50].map((count) => (
                  <button
                    key={count}
                    onClick={() => setReferralCount([count])}
                    className={cn(
                      "p-2 rounded-lg text-center transition-all text-xs",
                      referralCount[0] === count 
                        ? "bg-emerald-100 dark:bg-emerald-900/30 border-2 border-emerald-500" 
                        : "bg-muted/50 hover:bg-muted"
                    )}
                  >
                    <p className="font-bold">{count}</p>
                    <p className="text-[10px] text-muted-foreground">₹{(count * 200).toLocaleString()}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* How It Works */}
        <div className="px-4 py-4">
          <Card className="border-0 shadow-md bg-white dark:bg-background">
            <CardContent className="p-4">
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                How It Works
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {howItWorks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.step} className="text-center">
                      <div className={cn(
                        "w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center mx-auto mb-2 shadow-lg",
                        item.color
                      )}>
                        <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                      </div>
                      <p className="text-[10px] font-bold text-foreground leading-tight">{item.title}</p>
                      <p className="text-[9px] text-muted-foreground leading-tight">{item.desc}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Withdrawal History */}
        {withdrawals.length > 0 && (
          <div className="px-4 py-2">
            <Card className="border-0 shadow-sm bg-white dark:bg-background">
              <CardContent className="p-4">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-emerald-500" />
                  Withdrawals
                </h3>
                <div className="space-y-2">
                  {withdrawals.slice(0, 3).map((w: any) => (
                    <div key={w.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center",
                          w.status === "completed" ? "bg-emerald-100" : w.status === "failed" ? "bg-red-100" : "bg-amber-100"
                        )}>
                          {w.withdrawMethod === "upi" ? 
                            <Smartphone className={cn("w-4 h-4", w.status === "completed" ? "text-emerald-600" : w.status === "failed" ? "text-red-600" : "text-amber-600")} /> : 
                            <Building2 className={cn("w-4 h-4", w.status === "completed" ? "text-emerald-600" : w.status === "failed" ? "text-red-600" : "text-amber-600")} />
                          }
                        </div>
                        <div>
                          <p className="text-sm font-medium">₹{Number(w.amount).toLocaleString()}</p>
                          <p className="text-[10px] text-muted-foreground capitalize">{w.withdrawMethod?.replace("_", " ")}</p>
                        </div>
                      </div>
                      <span className={cn(
                        "text-xs font-medium px-2 py-1 rounded-full capitalize",
                        w.status === "completed" ? "bg-emerald-100 text-emerald-600" :
                        w.status === "failed" ? "bg-red-100 text-red-600" :
                        "bg-amber-100 text-amber-600"
                      )}>
                        {w.status}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Referral History */}
        <div className="px-4 py-2">
          <Card className="border-0 shadow-sm bg-white dark:bg-background">
            <CardContent className="p-4">
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                Your Referrals
              </h3>
              {referrals.length > 0 ? (
                <div className="space-y-2">
                  {referrals.slice(0, 5).map((ref: any) => (
                    <div key={ref.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <UserPlus className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{ref.referredEmail || ref.referredPhone || "Invited"}</p>
                          <p className="text-[10px] text-muted-foreground capitalize">{ref.status}</p>
                        </div>
                      </div>
                      <span className={cn(
                        "text-xs font-medium px-2 py-1 rounded-full",
                        ref.status === "credited" ? "bg-emerald-100 text-emerald-600" :
                        ref.status === "subscribed" ? "bg-blue-100 text-blue-600" :
                        "bg-amber-100 text-amber-600"
                      )}>
                        {ref.status === "credited" ? "+₹200" : ref.status === "subscribed" ? "Processing" : "Pending"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No referrals yet</p>
                  <p className="text-xs">Share your code to start earning</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Terms & Conditions - Collapsible */}
        <div className="px-4 py-2 pb-4">
          <button
            onClick={() => setShowTerms(!showTerms)}
            className="w-full flex items-center justify-between p-4 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white"
          >
            <span className="text-sm font-medium">Terms & Conditions</span>
            {showTerms ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          
          {showTerms && (
            <div className="mt-2 p-4 rounded-xl bg-white dark:bg-background">
              <ul className="space-y-2">
                {termsConditions.map((term, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">
                      {idx + 1}
                    </span>
                    <span className={idx === 0 || idx === 2 ? "font-medium text-foreground" : ""}>{term}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Withdrawal Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center">
          <div className="bg-background w-full md:max-w-md rounded-t-3xl md:rounded-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-background p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-bold">Withdraw Funds</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowWithdrawModal(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="text-center p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                <p className="text-xs text-muted-foreground">Available</p>
                <p className="text-2xl font-bold text-emerald-600">₹{availableBalance.toLocaleString()}</p>
              </div>
              
              <div>
                <Label className="text-sm">Amount (Min ₹400)</Label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={withdrawForm.amount}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label className="text-sm">Method</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button
                    onClick={() => setWithdrawMethod("upi")}
                    className={cn(
                      "p-4 rounded-xl border-2 text-center transition-all",
                      withdrawMethod === "upi" ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-border hover:border-blue-300"
                    )}
                  >
                    <Smartphone className={cn("w-6 h-6 mx-auto mb-2", withdrawMethod === "upi" ? "text-blue-600" : "text-muted-foreground")} />
                    <p className={cn("text-sm font-medium", withdrawMethod === "upi" ? "text-blue-600" : "")}>UPI</p>
                  </button>
                  <button
                    onClick={() => setWithdrawMethod("bank_transfer")}
                    className={cn(
                      "p-4 rounded-xl border-2 text-center transition-all",
                      withdrawMethod === "bank_transfer" ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-border hover:border-blue-300"
                    )}
                  >
                    <Building2 className={cn("w-6 h-6 mx-auto mb-2", withdrawMethod === "bank_transfer" ? "text-blue-600" : "text-muted-foreground")} />
                    <p className={cn("text-sm font-medium", withdrawMethod === "bank_transfer" ? "text-blue-600" : "")}>Bank</p>
                  </button>
                </div>
              </div>
              
              {withdrawMethod === "upi" && (
                <div>
                  <Label className="text-sm">UPI ID</Label>
                  <Input
                    type="text"
                    placeholder="yourname@upi"
                    value={withdrawForm.upiId}
                    onChange={(e) => setWithdrawForm({ ...withdrawForm, upiId: e.target.value })}
                    className="mt-1"
                  />
                </div>
              )}
              
              {withdrawMethod === "bank_transfer" && (
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm">Account Holder Name</Label>
                    <Input
                      placeholder="As per bank records"
                      value={withdrawForm.accountHolderName}
                      onChange={(e) => setWithdrawForm({ ...withdrawForm, accountHolderName: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Bank Name</Label>
                    <Input
                      placeholder="e.g. State Bank of India"
                      value={withdrawForm.bankName}
                      onChange={(e) => setWithdrawForm({ ...withdrawForm, bankName: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Account Number</Label>
                    <Input
                      placeholder="Enter account number"
                      value={withdrawForm.accountNumber}
                      onChange={(e) => setWithdrawForm({ ...withdrawForm, accountNumber: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">IFSC Code</Label>
                    <Input
                      placeholder="e.g. SBIN0001234"
                      value={withdrawForm.ifscCode}
                      onChange={(e) => setWithdrawForm({ ...withdrawForm, ifscCode: e.target.value.toUpperCase() })}
                      className="mt-1"
                    />
                  </div>
                </div>
              )}
              
              <Button
                onClick={handleWithdraw}
                disabled={withdrawMutation.isPending}
                className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-xl py-6"
              >
                {withdrawMutation.isPending ? "Processing..." : "Request Withdrawal"}
              </Button>
              
              <p className="text-[10px] text-center text-muted-foreground">
                Withdrawals are processed within 3-5 business days
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
