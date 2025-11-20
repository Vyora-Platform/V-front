import HeroSection from "@/components/HeroSection";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Calendar,
  Package,
  Users,
  Wallet,
  Globe,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  Dumbbell,
  Scissors,
  GraduationCap,
  Stethoscope,
  ShoppingBag,
  Hammer,
  Library,
  Store,
  Wrench,
  Heart,
  Coffee,
  Car,
  Building2,
  Zap,
  Shield,
  TrendingUp,
  Smartphone,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import ThemeToggle from "@/components/ThemeToggle";
import { useEffect } from "react";

const features = [
  {
    icon: Calendar,
    title: "Bookings & Appointments",
    description: "Automated scheduling, reminders, and calendar management for service bookings and in-person appointments."
  },
  {
    icon: Package,
    title: "Product Orders",
    description: "Complete order management with inventory tracking, fulfillment workflows, and delivery status updates."
  },
  {
    icon: Globe,
    title: "Mini-Website Builder",
    description: "Create your professional online storefront with custom branding, SEO optimization, and customer reviews."
  },
  {
    icon: Users,
    title: "Team & Employee Management",
    description: "Manage staff, assign tasks, track attendance, handle leave requests, and set role-based permissions."
  },
  {
    icon: Wallet,
    title: "Financial Management",
    description: "Ledger system (Hisab Kitab), expense tracking, supplier payments, and comprehensive transaction history."
  },
  {
    icon: BarChart3,
    title: "Business Analytics",
    description: "Real-time insights on sales, bookings, customer engagement, popular services, and growth metrics."
  },
];

const industries = [
  { icon: Dumbbell, name: "Gyms & Fitness", color: "text-red-500" },
  { icon: Scissors, name: "Salons & Spas", color: "text-pink-500" },
  { icon: GraduationCap, name: "Coaching Centers", color: "text-blue-500" },
  { icon: Stethoscope, name: "Healthcare & Labs", color: "text-green-500" },
  { icon: ShoppingBag, name: "Retail Stores", color: "text-purple-500" },
  { icon: Hammer, name: "Construction", color: "text-orange-500" },
  { icon: Library, name: "Libraries", color: "text-cyan-500" },
  { icon: Coffee, name: "Cafes & Restaurants", color: "text-amber-500" },
  { icon: Car, name: "Auto Services", color: "text-slate-500" },
  { icon: Heart, name: "Wellness Centers", color: "text-rose-500" },
  { icon: Store, name: "Service Providers", color: "text-indigo-500" },
  { icon: Building2, name: "Property Management", color: "text-teal-500" },
];

const benefits = [
  "Three universal interaction types: Bookings, Appointments, Orders",
  "Customizable service and product catalogues",
  "Mobile-first design with dedicated vendor app",
  "Lead management with status workflows",
  "Marketing tools and greeting templates",
  "Complete data ownership and portability",
  "Multi-location and multi-business support",
  "14-day free trial with all features",
];

const pricingPlans = [
  {
    name: "Monthly",
    price: "₹299",
    period: "/month",
    description: "Perfect for trying out",
    features: [
      "All core features",
      "Unlimited bookings & orders",
      "Mini-website builder",
      "Customer & lead management",
      "Analytics dashboard",
      "Mobile app access",
    ],
  },
  {
    name: "Semi-Annual",
    price: "₹1,599",
    period: "/6 months",
    badge: "Most Popular",
    description: "Best value for growing businesses",
    features: [
      "Everything in Monthly",
      "Save ₹200 vs monthly billing",
      "Priority support",
      "Advanced analytics",
      "Custom branding options",
      "Marketing automation",
    ],
  },
  {
    name: "Annual",
    price: "₹3,049",
    period: "/year",
    description: "Maximum savings",
    features: [
      "Everything in Semi-Annual",
      "Save ₹539 vs monthly billing",
      "Dedicated account manager",
      "Custom integrations",
      "Training & onboarding",
      "24/7 premium support",
    ],
  },
];

export default function Landing() {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    // Redirect to dashboard if already authenticated
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    
    if (token && userId) {
      console.log('✅ [Landing] User already authenticated, redirecting to dashboard...');
      setLocation('/vendor/dashboard');
      return;
    }
    
    // Set page title and meta tags
    document.title = "Vyora - Universal Business Marketplace Platform for All Industries";
    
    // Update or create meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", "Vyora is the complete business management platform for gyms, salons, coaching centers, retail, healthcare, and more. Manage bookings, appointments, orders, payments, and grow your business with ease. Start your 14-day free trial at vyora.club");
    } else {
      const meta = document.createElement('meta');
      meta.name = "description";
      meta.content = "Vyora is the complete business management platform for gyms, salons, coaching centers, retail, healthcare, and more. Manage bookings, appointments, orders, payments, and grow your business with ease. Start your 14-day free trial at vyora.club";
      document.head.appendChild(meta);
    }

    // Open Graph tags
    const ogTags = [
      { property: "og:title", content: "Vyora - Universal Business Marketplace Platform" },
      { property: "og:description", content: "Complete business management for all industries. Manage bookings, appointments, orders, and payments. Start your 14-day free trial." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://vyora.club" },
    ];

    ogTags.forEach(tag => {
      let ogTag = document.querySelector(`meta[property="${tag.property}"]`);
      if (!ogTag) {
        ogTag = document.createElement('meta');
        ogTag.setAttribute('property', tag.property);
        document.head.appendChild(ogTag);
      }
      ogTag.setAttribute('content', tag.content);
    });
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="text-2xl">🚀</div>
              <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Vyora
              </h1>
              <span className="text-xs text-muted-foreground hidden sm:inline">.club</span>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Link href="/vendor/dashboard">
                <Button variant="ghost" data-testid="link-vendor-portal">
                  Vendor Portal
                </Button>
              </Link>
              <Link href="/admin/dashboard">
                <Button data-testid="link-admin-panel">
                  Admin Panel
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <HeroSection />

      {/* Industries Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Built for Every Business Type
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Vyora adapts to your industry with flexible workflows for bookings, appointments, and orders
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {industries.map((industry, idx) => (
              <Card key={idx} className="p-6 text-center hover-elevate cursor-pointer transition-all" data-testid={`industry-${idx}`}>
                <div className="flex flex-col items-center gap-3">
                  <industry.icon className={`w-10 h-10 ${industry.color}`} />
                  <span className="text-sm font-medium text-foreground">{industry.name}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Everything Your Business Needs
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Complete business management platform with powerful features to streamline operations and grow your revenue
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <Card key={idx} className="p-6 hover-elevate" data-testid={`feature-${idx}`}>
                <div className="p-3 rounded-lg bg-primary/10 w-fit mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Why Choose Vyora?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Industry-agnostic platform designed to centralize customer interactions and operations for diverse businesses. From gyms to healthcare, retail to coaching centers.
              </p>
              <div className="space-y-3 mb-8">
                {benefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-chart-2 flex-shrink-0" />
                    <span className="text-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
              <Link href="/onboarding">
                <Button size="lg" data-testid="button-start-trial">
                  Start 14-Day Free Trial <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-6 text-center">
                <TrendingUp className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-3xl font-bold text-foreground mb-2">3x</h3>
                <p className="text-sm text-muted-foreground">Faster Growth</p>
              </Card>
              <Card className="p-6 text-center">
                <Smartphone className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-3xl font-bold text-foreground mb-2">100%</h3>
                <p className="text-sm text-muted-foreground">Mobile Optimized</p>
              </Card>
              <Card className="p-6 text-center">
                <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-3xl font-bold text-foreground mb-2">Full</h3>
                <p className="text-sm text-muted-foreground">Data Ownership</p>
              </Card>
              <Card className="p-6 text-center">
                <Zap className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-3xl font-bold text-foreground mb-2">24/7</h3>
                <p className="text-sm text-muted-foreground">Support</p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Start with a 14-day free trial. No credit card required. Cancel anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pricingPlans.map((plan, idx) => (
              <Card 
                key={idx} 
                className={`p-8 ${idx === 1 ? 'border-primary border-2 hover-elevate-2' : 'hover-elevate'} relative`}
                data-testid={`pricing-plan-${idx}`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 right-6 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold">
                    {plan.badge}
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIdx) => (
                    <li key={featureIdx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-chart-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/onboarding">
                  <Button 
                    className="w-full" 
                    variant={idx === 1 ? "default" : "outline"}
                    data-testid={`button-choose-${plan.name.toLowerCase()}`}
                  >
                    Start Free Trial
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center px-4 md:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Ready to Transform Your Business?
          </h2>
          <p className="text-lg mb-8 text-primary-foreground/90">
            Join businesses across India who trust Vyora to streamline operations and grow revenue. Start your free trial today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/onboarding">
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-white/90 border-white hover-elevate active-elevate-2"
                data-testid="button-signup"
              >
                Start Free Trial <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="bg-primary/10 backdrop-blur-sm text-white border-white/30 hover:bg-white/20"
              data-testid="button-demo"
            >
              Schedule a Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-12">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="text-2xl">🚀</div>
                <h3 className="text-lg font-bold text-foreground" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Vyora
                </h3>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Universal business marketplace platform for all industries
              </p>
              <p className="text-sm text-muted-foreground">
                vyora.club
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="cursor-pointer hover:text-foreground">Features</li>
                <li className="cursor-pointer hover:text-foreground">Pricing</li>
                <li className="cursor-pointer hover:text-foreground">Industries</li>
                <li className="cursor-pointer hover:text-foreground">Integrations</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="cursor-pointer hover:text-foreground">About Us</li>
                <li className="cursor-pointer hover:text-foreground">Blog</li>
                <li className="cursor-pointer hover:text-foreground">Careers</li>
                <li className="cursor-pointer hover:text-foreground">Contact</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="cursor-pointer hover:text-foreground">Privacy Policy</li>
                <li className="cursor-pointer hover:text-foreground">Terms of Service</li>
                <li className="cursor-pointer hover:text-foreground">Security</li>
                <li className="cursor-pointer hover:text-foreground">Compliance</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
            © 2025 Vyora. All rights reserved. Made with ❤️ for businesses across India.
          </div>
        </div>
      </footer>
    </div>
  );
}
