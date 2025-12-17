import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";

export default function HeroSection() {
  return (
    <div className="relative min-h-[600px] flex items-center bg-gradient-to-br from-primary/5 via-primary/10 to-background">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-grid-slate-900/[0.04] bg-[size:32px_32px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-20">
        <div className="max-w-3xl">
          <div className="inline-block mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Now serving 13+ industries across India
            </span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
            One Platform for Every Business
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8">
            From gyms to salons, coaching centers to healthcare, retail to construction. Manage bookings, appointments, orders, payments, and grow your business with Vyora.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <Link href="/onboarding">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground hover-elevate active-elevate-2"
                data-testid="button-get-started"
              >
                Start Free Trial <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/vendor/dashboard">
              <Button
                size="lg"
                variant="outline"
                className="hover-elevate active-elevate-2"
                data-testid="button-view-demo"
              >
                View Live Demo
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              "3 Interaction Types: Bookings, Appointments, Orders",
              "Complete Catalogue & Inventory Management",
              "Mini-Website Builder with Custom Branding",
              "Mobile-First Design with Dedicated App"
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2 text-foreground">
                <CheckCircle2 className="w-5 h-5 text-chart-2 flex-shrink-0" />
                <span className="text-sm md:text-base">{feature}</span>
              </div>
            ))}
          </div>

          {/* Trust badges */}
          <div className="mt-12 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-chart-2" />
              <span>14-Day Free Trial</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-chart-2" />
              <span>No Credit Card Required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-chart-2" />
              <span>Cancel Anytime</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
