import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Building2, User, MapPin, Image as ImageIcon, ShoppingBag, CheckCircle2, ChevronRight, ChevronLeft } from "lucide-react";
import type { INDUSTRY_CATEGORIES } from "@shared/schema";

// Form schemas for each step
const step1Schema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  category: z.string().min(1, "Industry category is required"),
  subcategory: z.string().min(1, "Subcategory is required"),
  customCategory: z.string().optional(),
  customSubcategory: z.string().optional(),
  ownerName: z.string().min(1, "Owner name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  whatsappNumber: z.string().min(10, "Valid WhatsApp number is required"),
});

const step2Schema = z.object({
  street: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  pincode: z.string().min(6, "Valid pincode is required"),
});

const step3Schema = z.object({
  logo: z.string().optional(),
  description: z.string().min(50, "Description must be at least 50 characters").max(200, "Description must not exceed 200 characters"),
});

const step4Schema = z.object({
  setupType: z.string().optional(),
});

type IndustryCategoriesType = typeof INDUSTRY_CATEGORIES;

export default function VendorOnboarding() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  
  // Read signup data from localStorage immediately (synchronously)
  const tempBusinessName = localStorage.getItem("tempBusinessName") || "";
  const tempOwnerName = localStorage.getItem("tempOwnerName") || "";
  const tempPhone = localStorage.getItem("tempPhone") || "";
  const tempEmail = localStorage.getItem("tempEmail") || "";
  
  console.log("🔄 Reading signup data from localStorage...");
  console.log("Business Name:", tempBusinessName);
  console.log("Owner Name:", tempOwnerName);
  console.log("Phone:", tempPhone);
  console.log("Email:", tempEmail);
  
  const [formData, setFormData] = useState({
    step1: {
      businessName: tempBusinessName,
      ownerName: tempOwnerName,
      phone: tempPhone,
      whatsappNumber: tempPhone,
      email: tempEmail,
      category: "",
      subcategory: "",
    } as z.infer<typeof step1Schema>,
    step2: {} as z.infer<typeof step2Schema>,
    step3: {} as z.infer<typeof step3Schema>,
    step4: {} as z.infer<typeof step4Schema>,
  });

  // Fetch industry categories
  const { data: industryCategories } = useQuery<IndustryCategoriesType>({
    queryKey: ["/api/industry-categories"],
  });

  const steps = [
    { number: 1, title: "Basic Information", icon: Building2 },
    { number: 2, title: "Address & Location", icon: MapPin },
    { number: 3, title: "Branding & Media", icon: ImageIcon },
  ];

  const progress = (currentStep / 3) * 100;

  // Fetch user data to get email if not in localStorage
  const userId = localStorage.getItem("userId");
  const { data: userData } = useQuery<any>({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId && !tempEmail,
  });

  // Step 1 Form with prefilled values
  const form1 = useForm<z.infer<typeof step1Schema>>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      businessName: tempBusinessName,
      ownerName: tempOwnerName,
      phone: tempPhone,
      whatsappNumber: tempPhone,
      email: tempEmail,
      category: "",
      subcategory: "",
    },
  });
  
  // Update email from userData if available
  useEffect(() => {
    if (userData?.email && !tempEmail) {
      console.log("✅ Setting email from user data:", userData.email);
      form1.setValue("email", userData.email);
      setFormData({
        ...formData,
        step1: {
          ...formData.step1,
          email: userData.email,
        }
      });
    }
  }, [userData]);
  
  // Clean up temp data when component unmounts or when moving to next step
  useEffect(() => {
    return () => {
      localStorage.removeItem("tempBusinessName");
      localStorage.removeItem("tempOwnerName");
      localStorage.removeItem("tempPhone");
      localStorage.removeItem("tempEmail");
    };
  }, []);

  // Step 2 Form
  const form2 = useForm<z.infer<typeof step2Schema>>({
    resolver: zodResolver(step2Schema),
    defaultValues: formData.step2,
  });

  // Step 3 Form
  const form3 = useForm<z.infer<typeof step3Schema>>({
    resolver: zodResolver(step3Schema),
    defaultValues: formData.step3,
  });

  // Step 4 Form
  const form4 = useForm<z.infer<typeof step4Schema>>({
    resolver: zodResolver(step4Schema),
    defaultValues: formData.step4,
  });

  const selectedCategory = form1.watch("category");
  const subcategories = selectedCategory && industryCategories ? industryCategories[selectedCategory as keyof IndustryCategoriesType] : [];

  const createVendorMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/vendors", data);
      return await response.json();
    },
    onSuccess: (vendor) => {
      console.log("✅ Vendor created:", vendor);
      
      // Store the REAL vendor ID in localStorage
      if (vendor && vendor.id) {
        localStorage.setItem("vendorId", vendor.id);
        console.log("✅ Stored vendor ID:", vendor.id);
      }
      
      localStorage.setItem("vendorOnboarding", "complete");
      
      toast({
        title: "Success!",
        description: "Your vendor profile has been created successfully.",
      });
      
      setLocation("/vendor/dashboard");
    },
    onError: (error) => {
      console.error("❌ Vendor creation error:", error);
      toast({
        title: "Error",
        description: "Failed to create vendor profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleStep1Next = (data: z.infer<typeof step1Schema>) => {
    setFormData({ ...formData, step1: data });
    setCurrentStep(2);
  };

  const handleStep2Next = (data: z.infer<typeof step2Schema>) => {
    setFormData({ ...formData, step2: data });
    setCurrentStep(3);
  };

  const handleStep3Submit = (data: z.infer<typeof step3Schema>) => {
    setFormData({ ...formData, step3: data });
    
    // Get userId from localStorage (set during signup/login)
    const userId = localStorage.getItem("userId");
    
    if (!userId) {
      toast({
        title: "Error",
        description: "User ID not found. Please login again.",
        variant: "destructive",
      });
      return;
    }
    
    // Combine all form data and submit
    const completeData = {
      userId,
      businessName: formData.step1.businessName,
      ownerName: formData.step1.ownerName,
      category: formData.step1.category,
      subcategory: formData.step1.subcategory,
      customCategory: formData.step1.customCategory || null,
      customSubcategory: formData.step1.customSubcategory || null,
      email: formData.step1.email,
      phone: formData.step1.phone,
      whatsappNumber: formData.step1.whatsappNumber,
      street: formData.step2.street,
      city: formData.step2.city,
      state: formData.step2.state,
      pincode: formData.step2.pincode,
      address: `${formData.step2.street}, ${formData.step2.city}, ${formData.step2.state} - ${formData.step2.pincode}`,
      logo: data.logo || null,
      description: data.description,
      onboardingComplete: true,
      status: "approved", // Auto-approve vendors after onboarding
    };

    createVendorMutation.mutate(completeData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">Vendor Onboarding</h1>
          <p className="text-muted-foreground">Complete your profile to start using Vyora</p>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Step {currentStep} of 3</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
        </div>

        {/* Step Indicators */}
        <div className="flex justify-between items-center">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.number;
            const isComplete = currentStep > step.number;

            return (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center border-2 transition-colors ${
                      isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : isComplete
                        ? "border-green-500 bg-green-500 text-white"
                        : "border-muted bg-background text-muted-foreground"
                    }`}
                  >
                    {isComplete ? <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6" /> : <Icon className="h-5 w-5 md:h-6 md:w-6" />}
                  </div>
                  <span className="text-xs md:text-sm font-medium mt-2 hidden md:block">{step.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-2 ${isComplete ? "bg-green-500" : "bg-muted"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {steps.find(s => s.number === currentStep)?.title}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && "Tell us about your business and contact information"}
              {currentStep === 2 && "Where is your business located?"}
              {currentStep === 3 && "Add your business logo and description"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <Form {...form1}>
                <form onSubmit={form1.handleSubmit(handleStep1Next)} className="space-y-6">
                  <FormField
                    control={form1.control}
                    name="businessName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="required">Business Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your business name" {...field} data-testid="input-businessName" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form1.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="required">Industry Category</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-category">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {industryCategories && Object.keys(industryCategories).map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form1.control}
                      name="subcategory"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="required">Subcategory</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} disabled={!selectedCategory}>
                            <FormControl>
                              <SelectTrigger data-testid="select-subcategory">
                                <SelectValue placeholder="Select subcategory" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {subcategories?.map((subcat) => (
                                <SelectItem key={subcat} value={subcat}>
                                  {subcat}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {selectedCategory === "Others" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form1.control}
                        name="customCategory"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Custom Category Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter category name" {...field} data-testid="input-customCategory" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form1.control}
                        name="customSubcategory"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Custom Subcategory Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter subcategory name" {...field} data-testid="input-customSubcategory" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  <FormField
                    control={form1.control}
                    name="ownerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="required">Owner Name / Primary Contact</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter owner name" {...field} data-testid="input-ownerName" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form1.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="required">Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="you@example.com" {...field} data-testid="input-email" />
                          </FormControl>
                          <FormDescription>Used for login & communication</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form1.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="required">Phone Number</FormLabel>
                          <FormControl>
                            <Input type="tel" placeholder="+91 98765 43210" {...field} data-testid="input-phone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form1.control}
                    name="whatsappNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="required">WhatsApp Number</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="+91 98765 43210" {...field} data-testid="input-whatsapp" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end">
                    <Button type="submit" size="lg" data-testid="button-next-step1">
                      Next: Address & Location
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </Form>
            )}

            {/* Step 2: Address & Location */}
            {currentStep === 2 && (
              <Form {...form2}>
                <form onSubmit={form2.handleSubmit(handleStep2Next)} className="space-y-6">
                  <FormField
                    control={form2.control}
                    name="street"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="required">Street Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter street address" {...field} data-testid="input-street" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form2.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="required">City</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter city" {...field} data-testid="input-city" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form2.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="required">State</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter state" {...field} data-testid="input-state" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form2.control}
                      name="pincode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="required">Pincode</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter pincode" {...field} data-testid="input-pincode" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={() => setCurrentStep(1)} data-testid="button-back-step2">
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <Button type="submit" size="lg" data-testid="button-next-step2">
                      Next: Branding & Media
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </Form>
            )}

            {/* Step 3: Branding & Media */}
            {currentStep === 3 && (
              <Form {...form3}>
                <form onSubmit={form3.handleSubmit(handleStep3Submit)} className="space-y-6">
                  <FormField
                    control={form3.control}
                    name="logo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Logo (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  field.onChange(reader.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            data-testid="input-logo"
                          />
                        </FormControl>
                        <FormDescription>Upload your business logo (recommended size: 200x200px)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form3.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="required">Business Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your business in 50-200 characters..."
                            className="min-h-[100px]"
                            {...field}
                            data-testid="input-description"
                          />
                        </FormControl>
                        <FormDescription>
                          {field.value?.length || 0} / 200 characters (minimum 50)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={() => setCurrentStep(2)} data-testid="button-back-step3">
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <Button 
                      type="submit" 
                      size="lg" 
                      disabled={createVendorMutation.isPending}
                      data-testid="button-submit-onboarding"
                    >
                      {createVendorMutation.isPending ? "Submitting..." : "Complete Onboarding"}
                      <CheckCircle2 className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
