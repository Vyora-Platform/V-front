import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Heart,
  Coffee,
  Car,
  Building2,
  Zap,
  Shield,
  TrendingUp,
  Smartphone,
  Star,
  Quote,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Play,
  Rocket,
  Menu,
  X,
  Handshake,
  ExternalLink,
  MessageCircle,
  Clock,
  Award,
  Target,
  Crown,
  Sparkles,
  Gift,
  IndianRupee,
  User,
  MapPin,
  Layers,
  Settings,
  FileText,
  Image,
  Send,
  Headphones,
  CreditCard,
  PieChart,
  ClipboardList,
  Megaphone,
  Mail,
  Phone,
  Utensils,
  Shirt,
  Home,
  Briefcase,
  Camera,
  Music,
  Palette,
  Bike,
  Plane,
  Baby,
  Dog,
  Flower2,
  Laptop,
  Wrench,
  UtensilsCrossed,
  Cake,
  Gem,
  ThumbsUp,
  Map,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useEffect, useState, useRef, TouchEvent } from "react";
import { useToast } from "@/hooks/use-toast";

// Feature cards data like the attached images
const featureCards = [
  {
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&h=300&fit=crop",
    icon: Globe,
    title: "Free Business Website",
    subtitle: "Professional Website Builder",
    description: "Create stunning business websites with integrated tools and mobile-responsive designs",
    features: ["Launch in 24 hours", "Mobile-optimized designs", "Built-in SEO tools"],
  },
  {
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&h=300&fit=crop",
    icon: Users,
    title: "Unlimited Lead & Management",
    subtitle: "Complete Lead Management System",
    description: "Capture, track, and convert unlimited leads with automated follow-up and management tools",
    features: ["Unlimited lead capture", "Automated follow-ups", "Conversion tracking"],
  },
  {
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=300&fit=crop",
    icon: Sparkles,
    title: "Automagic Catalogue Creation",
    subtitle: "AI-Powered Product Catalogues",
    description: "Automatically create professional product catalogues with AI-powered descriptions and pricing",
    features: ["AI-generated descriptions", "Auto pricing suggestions", "Professional layouts"],
  },
  {
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=500&h=300&fit=crop",
    icon: FileText,
    title: "Hisab-Kitab Management",
    subtitle: "Smart Accounting & Billing",
    description: "Complete accounting solution with invoicing, expense tracking, and financial reports",
    features: ["Automated invoicing", "Expense tracking", "GST compliant"],
  },
  {
    image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500&h=300&fit=crop",
    icon: Package,
    title: "Smart Stock Management",
    subtitle: "Inventory Management System",
    description: "AI-powered inventory management with real-time stock updates and alerts",
    features: ["Real-time tracking", "Low stock alerts", "Purchase orders"],
  },
  {
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=500&h=300&fit=crop",
    icon: Users,
    title: "Customer Management",
    subtitle: "Complete CRM Solution",
    description: "Manage customer relationships with detailed profiles, purchase history, and engagement",
    features: ["Customer profiles", "Purchase history", "Loyalty programs"],
  },
  {
    image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=500&h=300&fit=crop",
    icon: Image,
    title: "Free Marketing & Sales Banner",
    subtitle: "Professional Marketing Materials",
    description: "Create stunning marketing banners and sales materials with professional templates",
    features: ["Professional templates", "Custom branding", "Social media ready"],
  },
  {
    image: "https://images.unsplash.com/photo-1531545514256-b1400bc00f31?w=500&h=300&fit=crop",
    icon: Users,
    title: "Employee Management",
    subtitle: "Complete Staff Management System",
    description: "Manage your team efficiently with attendance tracking, payroll management, task assignment, and performance monitoring",
    features: ["Attendance tracking", "Payroll management", "Performance reports"],
  },
  {
    image: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=500&h=300&fit=crop",
    icon: Calendar,
    title: "Daily Greeting Poster",
    subtitle: "Automated Social Media Posts",
    description: "Automatically generate and schedule daily greeting posts for festivals and occasions to keep your brand visible",
    features: ["Automated posting", "Festival greetings", "Brand consistency"],
  },
  {
    image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=500&h=300&fit=crop",
    icon: Send,
    title: "Bulk Marketing Software",
    subtitle: "Mass Communication Tools",
    description: "Send bulk SMS, WhatsApp messages, and emails to your customers with advanced targeting",
    features: ["Bulk messaging", "Advanced targeting", "Campaign analytics"],
  },
  {
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=500&h=300&fit=crop",
    icon: CreditCard,
    title: "Payment Gateway",
    subtitle: "Secure Payment Processing",
    description: "Accept payments online with multiple payment options, instant settlements, and fraud protection",
    features: ["Multiple payment options", "Instant settlements", "Fraud protection"],
  },
  {
    image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=500&h=300&fit=crop",
    icon: Headphones,
    title: "24/7* Customer Support",
    subtitle: "Round-the-Clock Support",
    description: "Get dedicated customer support with live chat, phone support, and priority assistance",
    features: ["24/7 availability", "Live chat support", "Priority assistance"],
  },
];

const testimonials = [
  {
    name: "Rajesh Kumar",
    role: "Owner, FitZone Gym",
    location: "Mumbai",
    initial: "R",
    content: "Since switching to Vyora, our membership management has become seamless. We've seen a 40% increase in member retention and our staff productivity has doubled. The automated reminders alone have saved us ₹50,000 in missed appointments!",
    rating: 5,
    metric: "40% ↑ Retention"
  },
  {
    name: "Priya Sharma",
    role: "Founder, Glamour Studio",
    location: "Delhi NCR",
    initial: "P",
    content: "The mini-website builder was a game-changer for our salon. Within 2 weeks, we started getting 15+ online bookings daily. Our revenue increased by ₹2.5 lakhs in the first quarter!",
    rating: 5,
    metric: "₹2.5L Revenue"
  },
  {
    name: "Dr. Amit Verma",
    role: "Director, HealthFirst Clinic",
    location: "Bangalore",
    initial: "A",
    content: "Managing patient appointments was always chaotic until we found Vyora. Now our front desk operates efficiently, patients love the reminder system, and we've reduced no-shows by 60%.",
    rating: 5,
    metric: "60% ↓ No-shows"
  },
  {
    name: "Sneha Patel",
    role: "CEO, EduBright Academy",
    location: "Ahmedabad",
    initial: "S",
    content: "For our coaching center, tracking student batches and fee payments was a nightmare. Vyora's ledger system and batch management has brought complete transparency. Parents trust us more now!",
    rating: 5,
    metric: "100% Transparency"
  },
];

const faqs = [
  {
    question: "What industries does Vyora support?",
    answer: "Vyora is designed as a universal platform supporting 190+ categories including gyms, salons, healthcare clinics, coaching centers, retail stores, restaurants, auto services, wellness centers, and many more. Our flexible system adapts to any service or product-based business."
  },
  {
    question: "How long does it take to set up Vyora for my business?",
    answer: "You can get started in under 5 minutes! Our guided onboarding walks you through the setup process. Most businesses are fully operational within 24-48 hours, including website creation, service catalogue setup, and staff onboarding."
  },
  {
    question: "Is my business data secure with Vyora?",
    answer: "Absolutely. We use bank-grade encryption (256-bit SSL), secure cloud infrastructure, and comply with data protection regulations. Your data is backed up daily and you maintain complete ownership. We never share your data with third parties."
  },
  {
    question: "Is there a free plan available?",
    answer: "Yes! We offer a completely free plan with essential features to get started. You can explore the platform, create your mini-website, and manage basic operations at no cost. Upgrade to Pro anytime for advanced features."
  },
  {
    question: "What kind of support does Vyora provide?",
    answer: "We offer 24/7 customer support via chat, email, and phone. Pro plans include a dedicated account manager, personalized training sessions, and priority support. Our help center also has detailed guides and video tutorials."
  },
];

// All features list for uniform cards - Free features grouped at top
const allFeatures = [
  // Free features first (grouped together)
  "Customers Management",
  "Employees Management", 
  "Leads Management",
  // Pro features
  "POS Management",
  "Bookings Management",
  "Appointments Management",
  "Orders Management",
  "Suppliers Management",
  "Expenses Management",
  "Quotations Management",
  "Hisab Kitab Management",
  "Services Catalogue Management",
  "Products Catalogue Management",
  "Stock Turnover Management",
  "Attendance Management",
  "Leaves Management",
  "Tasks Management",
  "Greeting & Marketing Management",
  "Website Builder Management",
  "Offers & Coupons Management",
  "24/7 Priority Support",
];

// Free plan included features
const freeFeatures = ["Customers Management", "Employees Management", "Leads Management"];

const pricingPlans = [
  {
    name: "Free",
    price: "₹0",
    period: "/forever",
    description: "Perfect to get started",
    icon: Sparkles,
  },
  {
    name: "Pro",
    price: "₹13",
    period: "/day",
    originalPrice: "₹499",
    offerPrice: "₹399",
    badge: "Most Popular",
    description: "All tools, unlimited usage",
    icon: Crown,
  },
];

// Competitor comparison data
const competitorComparison = [
  { feature: "Customer Management", vyoraFree: true, vyoraPro: true, zoho: "₹800/mo", freshworks: "₹999/mo", hubspot: "₹4500/mo" },
  { feature: "Employee Management", vyoraFree: true, vyoraPro: true, zoho: "₹500/mo", freshworks: "₹600/mo", hubspot: "Not Available" },
  { feature: "Leads Management", vyoraFree: true, vyoraPro: true, zoho: "₹800/mo", freshworks: "₹999/mo", hubspot: "Free (Limited)" },
  { feature: "POS System", vyoraFree: false, vyoraPro: true, zoho: "₹1500/mo", freshworks: "Not Available", hubspot: "Not Available" },
  { feature: "Bookings & Appointments", vyoraFree: false, vyoraPro: true, zoho: "₹600/mo", freshworks: "₹800/mo", hubspot: "₹2000/mo" },
  { feature: "Website Builder", vyoraFree: false, vyoraPro: true, zoho: "₹1000/mo", freshworks: "Not Available", hubspot: "₹3000/mo" },
  { feature: "Hisab Kitab (Accounting)", vyoraFree: false, vyoraPro: true, zoho: "₹1200/mo", freshworks: "Not Available", hubspot: "Not Available" },
  { feature: "Marketing & Greeting", vyoraFree: false, vyoraPro: true, zoho: "₹1500/mo", freshworks: "₹2000/mo", hubspot: "₹3500/mo" },
  { feature: "Stock Management", vyoraFree: false, vyoraPro: true, zoho: "₹800/mo", freshworks: "Not Available", hubspot: "Not Available" },
  { feature: "Monthly Cost", vyoraFree: "₹0", vyoraPro: "₹399", zoho: "₹8,700+", freshworks: "₹5,400+", hubspot: "₹13,000+" },
];

// Stats data - Like attached image
const statsData = [
  { icon: Building2, value: "12,000+", label: "Active Businesses", color: "bg-blue-500" },
  { icon: Settings, value: "20+", label: "Management Tools", color: "bg-emerald-500" },
  { icon: Layers, value: "190+", label: "Business Categories", color: "bg-purple-500" },
  { icon: MapPin, value: "600+", label: "Cities Covered", color: "bg-orange-500" },
];

// Business Categories data with colors
const businessCategories = [
  { icon: Dumbbell, name: "Gym & Fitness", description: "Membership management, class scheduling", color: "bg-red-500" },
  { icon: Scissors, name: "Salon & Spa", description: "Appointment booking, service catalogue", color: "bg-pink-500" },
  { icon: Stethoscope, name: "Healthcare", description: "Patient management, appointments", color: "bg-blue-500" },
  { icon: GraduationCap, name: "Education", description: "Student batches, fee management", color: "bg-indigo-500" },
  { icon: ShoppingBag, name: "Retail & E-commerce", description: "Inventory, POS, online store", color: "bg-purple-500" },
  { icon: Utensils, name: "Restaurants", description: "Table booking, menu management", color: "bg-orange-500" },
  { icon: Car, name: "Auto Services", description: "Service booking, parts inventory", color: "bg-gray-600" },
  { icon: Home, name: "Real Estate", description: "Property listings, client management", color: "bg-teal-500" },
  { icon: Briefcase, name: "Consulting", description: "Client management, project tracking", color: "bg-slate-600" },
  { icon: Camera, name: "Photography", description: "Booking management, portfolio", color: "bg-amber-500" },
  { icon: Music, name: "Events & Entertainment", description: "Event booking, vendor management", color: "bg-violet-500" },
  { icon: Palette, name: "Art & Design", description: "Project management, client galleries", color: "bg-rose-500" },
  { icon: Heart, name: "Wellness Centers", description: "Therapy sessions, membership", color: "bg-green-500" },
  { icon: Coffee, name: "Cafes & Bakeries", description: "Menu management, orders", color: "bg-yellow-600" },
  { icon: Bike, name: "Sports & Recreation", description: "Court booking, equipment rental", color: "bg-cyan-500" },
  { icon: Plane, name: "Travel & Tourism", description: "Trip planning, booking management", color: "bg-sky-500" },
  { icon: Baby, name: "Childcare", description: "Enrollment, attendance", color: "bg-lime-500" },
  { icon: Dog, name: "Pet Services", description: "Grooming appointments, boarding", color: "bg-emerald-500" },
  { icon: Flower2, name: "Florists", description: "Order management, delivery tracking", color: "bg-fuchsia-500" },
  { icon: Laptop, name: "IT Services", description: "Project management, client portal", color: "bg-blue-600" },
  { icon: Wrench, name: "Home Services", description: "Booking, technician dispatch", color: "bg-stone-500" },
  { icon: UtensilsCrossed, name: "Catering", description: "Event booking, menu planning", color: "bg-red-600" },
  { icon: Cake, name: "Bakery", description: "Custom orders, delivery", color: "bg-pink-600" },
  { icon: Gem, name: "Jewelry", description: "Inventory, custom orders", color: "bg-amber-600" },
  { icon: Library, name: "Libraries", description: "Book management, memberships", color: "bg-brown-500" },
  { icon: Store, name: "Retail Stores", description: "Inventory, billing, loyalty", color: "bg-indigo-600" },
  { icon: Hammer, name: "Construction", description: "Project tracking, invoicing", color: "bg-orange-600" },
  { icon: Megaphone, name: "Marketing Agencies", description: "Campaign management, analytics", color: "bg-purple-600" },
];

// Why Vyora benefits with data - MNC Level
const whyVyoraBenefits = [
  { 
    icon: TrendingUp, 
    title: "Revenue Growth", 
    description: "Businesses using Vyora see an average 3x revenue increase within the first 12 months through better operations and customer management", 
    stat: "300%",
    highlight: "Growth",
    subtext: "Avg. Annual Increase"
  },
  { 
    icon: Clock, 
    title: "Time Savings", 
    description: "Save over 35 hours per week by automating bookings, reminders, invoicing, and customer follow-ups", 
    stat: "35+",
    highlight: "Hours/Week",
    subtext: "Time Saved"
  },
  { 
    icon: Users, 
    title: "Customer Retention", 
    description: "Our smart CRM and automated engagement tools help businesses retain 50% more customers", 
    stat: "50%",
    highlight: "Increase",
    subtext: "Customer Retention"
  },
  { 
    icon: Shield, 
    title: "Platform Reliability", 
    description: "Bank-grade 256-bit encryption, daily backups, and industry-leading uptime for uninterrupted operations", 
    stat: "99.9%",
    highlight: "Uptime",
    subtext: "Server Availability"
  },
  { 
    icon: IndianRupee, 
    title: "Cost Reduction", 
    description: "Replace 5+ separate software subscriptions with one unified platform, saving ₹15,000+ monthly", 
    stat: "₹15K+",
    highlight: "Monthly",
    subtext: "Savings per Month"
  },
  { 
    icon: Headphones, 
    title: "Support Response", 
    description: "Dedicated support team available 24/7 with average response time under 2 minutes via chat", 
    stat: "<2",
    highlight: "Minutes",
    subtext: "Avg. Response Time"
  },
];

export default function Landing() {
  const [, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [contactForm, setContactForm] = useState({ name: '', phone: '', email: '', business: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const { toast } = useToast();
  
  // Swipe handling for feature cards
  const touchStartY = useRef<number>(0);
  const touchEndY = useRef<number>(0);
  const swipeContainerRef = useRef<HTMLDivElement>(null);
  
  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    touchStartY.current = e.touches[0].clientY;
  };
  
  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    touchEndY.current = e.touches[0].clientY;
  };
  
  const handleTouchEnd = () => {
    const swipeDistance = touchStartY.current - touchEndY.current;
    const minSwipeDistance = 50;
    
    if (swipeDistance > minSwipeDistance) {
      // Swipe up - next card
      setActiveFeature(prev => Math.min(featureCards.length - 1, prev + 1));
    } else if (swipeDistance < -minSwipeDistance) {
      // Swipe down - previous card
      setActiveFeature(prev => Math.max(0, prev - 1));
    }
  };
  
  // Mouse wheel handler for desktop
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (Math.abs(e.deltaY) > 30) {
      if (e.deltaY > 0) {
        setActiveFeature(prev => Math.min(featureCards.length - 1, prev + 1));
      } else {
        setActiveFeature(prev => Math.max(0, prev - 1));
      }
    }
  };
  
  useEffect(() => {
    // Redirect to dashboard if already authenticated
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    
    if (token && userId) {
      console.log('✅ [Landing] User already authenticated, redirecting based on role...');
      if (userRole === 'admin' || userRole === 'employee') {
        setLocation('/admin/dashboard');
      } else {
        setLocation('/vendor/dashboard');
      }
      return;
    }
    
    // Set page title and meta tags
    document.title = "Vyora - Universal Business Marketplace Platform for All Industries";
    
    // Scroll reveal animation using IntersectionObserver
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };
    
    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
        }
      });
    };
    
    const observer = new IntersectionObserver(observerCallback, observerOptions);
    
    // Observe all scroll-reveal elements
    const scrollElements = document.querySelectorAll('.scroll-reveal');
    scrollElements.forEach(el => observer.observe(el));
    
    return () => observer.disconnect();
  }, [setLocation]);

  // Auto-play carousel for features section
  useEffect(() => {
    const autoPlayInterval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % featureCards.length);
    }, 4000); // Auto-slide every 4 seconds

    return () => clearInterval(autoPlayInterval);
  }, []);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  // Handle demo request form submission
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/demo-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactForm.name,
          phone: contactForm.phone,
          email: contactForm.email,
          businessName: contactForm.business,
          source: 'contact_form',
          status: 'new',
        }),
      });
      
      if (response.ok) {
        toast({
          title: "Demo Request Submitted!",
          description: "Our team will reach out to you within 24 hours to schedule your demo.",
        });
        setContactForm({ name: '', phone: '', email: '', business: '' });
      } else {
        throw new Error('Failed to submit');
      }
    } catch (error) {
      toast({
        title: "Request Received!",
        description: "Thank you! We'll contact you soon to schedule your demo.",
      });
      setContactForm({ name: '', phone: '', email: '', business: '' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* CSS Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }
          50% { box-shadow: 0 0 40px rgba(59, 130, 246, 0.5); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-in-left {
          from { opacity: 0; transform: translateX(-50px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(50px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes arrow-bounce {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(4px); }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes marquee-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marquee-scroll-reverse {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        @keyframes count-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes number-count {
          0% { opacity: 0; transform: scale(0.5); }
          50% { transform: scale(1.1); }
          100% { opacity: 1; transform: scale(1); }
        }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
        .animate-slide-up { animation: slide-up 0.6s ease-out forwards; }
        .animate-slide-in-left { animation: slide-in-left 0.7s ease-out forwards; }
        .animate-slide-in-right { animation: slide-in-right 0.7s ease-out forwards; }
        .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
        .animate-scale-in { animation: scale-in 0.5s ease-out forwards; }
        .animate-count-up { animation: count-up 0.8s ease-out forwards; }
        .animate-number-count { animation: number-count 1s ease-out forwards; }
        .hover-lift { transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .hover-lift:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
        .btn-arrow:hover .arrow-icon { animation: arrow-bounce 0.5s ease-in-out infinite; }
        .gradient-animate { 
          background-size: 200% 200%;
          animation: gradient-shift 4s ease infinite;
        }
        .marquee-container {
          overflow: hidden;
          mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
          -webkit-mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
        }
        .marquee-track {
          display: flex;
          animation: marquee-scroll 8s linear infinite;
        }
        .marquee-track-reverse {
          display: flex;
          animation: marquee-scroll-reverse 8s linear infinite;
        }
        .marquee-track:hover, .marquee-track-reverse:hover {
          animation-play-state: paused;
        }
        .feature-zigzag:nth-child(odd) .feature-content { flex-direction: row; }
        .feature-zigzag:nth-child(even) .feature-content { flex-direction: row-reverse; }
        @media (max-width: 768px) {
          .feature-zigzag:nth-child(odd) .feature-content,
          .feature-zigzag:nth-child(even) .feature-content { flex-direction: column; }
        }
        /* Scroll Reveal Animation */
        .scroll-reveal {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.35s ease-out, transform 0.35s ease-out;
        }
        .scroll-reveal.revealed {
          opacity: 1;
          transform: translateY(0);
        }
        /* Horizontal card carousel */
        .carousel-container {
          position: relative;
          width: 100%;
          overflow: hidden;
        }
        .carousel-track {
          display: flex;
          transition: transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .carousel-slide {
          flex-shrink: 0;
          width: 100%;
          padding: 0 1rem;
        }
        @media (min-width: 768px) {
          .carousel-slide {
            padding: 0 2rem;
          }
        }
      `}</style>

      {/* ===== HEADER NAVIGATION ===== */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex h-18 md:h-20 items-center justify-between py-3">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <img 
                src="https://abizuwqnqkbicrhorcig.storage.supabase.co/storage/v1/object/public/vyora-bucket/partners-vyora/p/IMAGE/logo-vyora.png" 
                alt="Vyora Logo" 
                className="h-12 md:h-14 w-auto object-contain"
              />
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              <button onClick={() => scrollToSection('features')} className="text-base font-semibold text-gray-700 hover:text-blue-600 transition-colors">Features</button>
              <button onClick={() => scrollToSection('why-vyora')} className="text-base font-semibold text-gray-700 hover:text-blue-600 transition-colors">Why Vyora</button>
              <button onClick={() => scrollToSection('testimonials')} className="text-base font-semibold text-gray-700 hover:text-blue-600 transition-colors">Testimonials</button>
              <button onClick={() => scrollToSection('pricing')} className="text-base font-semibold text-gray-700 hover:text-blue-600 transition-colors">Pricing</button>
              <button onClick={() => scrollToSection('faq')} className="text-base font-semibold text-gray-700 hover:text-blue-600 transition-colors">FAQs</button>
              <a href="https://partners.vyora.club" target="_blank" rel="noopener noreferrer" className="text-base font-semibold text-gray-700 hover:text-blue-600 transition-colors flex items-center gap-1">
                Become Our Partner <ExternalLink className="w-4 h-4" />
              </a>
            </nav>
            
            {/* CTA Buttons */}
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="outline" className="hidden sm:flex items-center gap-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 font-semibold border-2 border-gray-800 rounded-lg h-11 px-4">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-base font-semibold">Login</span>
                </Button>
              </Link>
              {/* Get Started button - hidden on mobile, visible on desktop */}
              <Link href="/signup" className="hidden md:block">
                <Button className="btn-arrow bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 rounded-lg px-5 md:px-6 h-11 text-base font-semibold">
                  Get Started Free
                  <ArrowRight className="w-4 h-4 ml-2 arrow-icon" />
                </Button>
              </Link>
              {/* Mobile menu button */}
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
          
          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="lg:hidden py-4 border-t border-gray-100 animate-fade-in">
              <nav className="flex flex-col gap-1">
                <button onClick={() => scrollToSection('features')} className="px-4 py-3 text-left text-gray-700 font-semibold hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors">Features</button>
                <button onClick={() => scrollToSection('why-vyora')} className="px-4 py-3 text-left text-gray-700 font-semibold hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors">Why Vyora</button>
                <button onClick={() => scrollToSection('testimonials')} className="px-4 py-3 text-left text-gray-700 font-semibold hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors">Testimonials</button>
                <button onClick={() => scrollToSection('pricing')} className="px-4 py-3 text-left text-gray-700 font-semibold hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors">Pricing</button>
                <button onClick={() => scrollToSection('faq')} className="px-4 py-3 text-left text-gray-700 font-semibold hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors">FAQs</button>
                <a href="https://partners.vyora.club" target="_blank" rel="noopener noreferrer" className="px-4 py-3 text-left text-gray-700 font-semibold hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors flex items-center gap-2">
                  Become Our Partner <ExternalLink className="w-4 h-4" />
                </a>
                <Link href="/login" className="px-4 py-3 text-left text-gray-700 font-semibold hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors">Login</Link>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* ===== HERO SECTION ===== */}
      <section className="pt-28 md:pt-36 pb-8 md:pb-12 bg-gradient-to-b from-blue-50 via-white to-white relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-20 left-0 w-72 h-72 md:w-96 md:h-96 bg-blue-100/60 rounded-full blur-3xl -translate-x-1/2" />
        <div className="absolute top-1/3 right-0 w-64 h-64 md:w-80 md:h-80 bg-blue-100/50 rounded-full blur-3xl translate-x-1/2" />
        
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-6 animate-slide-up">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-600 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                </span>
                Trusted by 12,000+ businesses across India
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight animate-slide-up" style={{ fontFamily: 'Poppins, sans-serif', animationDelay: '0.1s' }}>
                One Platform for{' '}
                <span className="text-blue-600">
                  Every Business
                </span>
              </h1>
              
              <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-xl mx-auto lg:mx-0 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                From gyms to salons, coaching centers to healthcare. Manage bookings, appointments, orders, payments, and grow your business with Vyora.
              </p>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <Link href="/signup">
                  <Button
                    size="lg"
                    className="btn-arrow w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/30 rounded-lg px-8 h-14 text-base font-semibold"
                  >
                    Get Started Free
                    <ArrowRight className="w-5 h-5 ml-2 arrow-icon" />
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto border-2 border-gray-300 hover:border-blue-600 hover:text-blue-600 rounded-lg px-8 h-14 text-base font-semibold hover-lift"
                  onClick={() => scrollToSection('contact-form')}
                >
                  <Play className="w-5 h-5 mr-2" />
                  Book a Demo
                </Button>
              </div>
            </div>
            
            {/* Right - Hero Image */}
            <div className="relative animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <div className="relative">
                <img 
                  src="https://www.buyfayipartner.com/assets/img/shop.png" 
                  alt="Vyora Business Platform" 
                  className="w-full max-w-lg mx-auto lg:max-w-none animate-float"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== STATS SECTION - Like Attached Image ===== */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-blue-50 to-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 text-center mb-12" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Loved by Businesses, Trusted by Brands
          </h2>
          
          {/* Stats - Card Layout with Icons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {statsData.map((stat, idx) => (
              <div key={idx} className="group bg-white rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100">
                <div className={`w-14 h-14 md:w-16 md:h-16 ${stat.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className="w-7 h-7 md:w-8 md:h-8 text-white" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-1 animate-number-count" style={{ animationDelay: `${idx * 0.15}s` }}>
                  {stat.value}
                </div>
                <div className="text-sm md:text-base text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SECTION DIVIDER ===== */}
      <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

      {/* ===== BUSINESS CATEGORIES SECTION - 4 Columns with Fast Marquee ===== */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-white to-gray-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-10 md:mb-14">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Built for Every Business Category
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              From fitness to healthcare, retail to services — Vyora adapts to your industry
            </p>
          </div>
        </div>

        {/* Marquee Row 1 - Left to Right (3 columns) */}
        <div className="marquee-container mb-6">
          <div className="marquee-track">
            {[...businessCategories.slice(0, 9), ...businessCategories.slice(0, 9)].map((category, idx) => (
              <div key={idx} className="flex-shrink-0 w-80 md:w-96 mx-3">
                <Card className={`p-6 md:p-8 h-32 md:h-36 border-0 shadow-xl hover:shadow-2xl transition-all hover:scale-105 ${
                  idx % 3 === 0 ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                  idx % 3 === 1 ? 'bg-gradient-to-br from-emerald-500 to-green-600' :
                  'bg-gradient-to-br from-violet-500 to-purple-600'
                }`}>
                  <div className="flex items-center gap-5 h-full">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
                      <category.icon className="w-8 h-8 md:w-10 md:h-10 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-white text-lg md:text-xl">{category.name}</h4>
                      <p className="text-sm md:text-base text-white/80">{category.description}</p>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>

        {/* Marquee Row 2 - Right to Left (3 columns) */}
        <div className="marquee-container mb-6">
          <div className="marquee-track-reverse">
            {[...businessCategories.slice(9, 18), ...businessCategories.slice(9, 18)].map((category, idx) => (
              <div key={idx} className="flex-shrink-0 w-80 md:w-96 mx-3">
                <Card className={`p-6 md:p-8 h-32 md:h-36 border-0 shadow-xl hover:shadow-2xl transition-all hover:scale-105 ${
                  idx % 3 === 0 ? 'bg-gradient-to-br from-rose-500 to-pink-600' :
                  idx % 3 === 1 ? 'bg-gradient-to-br from-amber-500 to-orange-600' :
                  'bg-gradient-to-br from-cyan-500 to-teal-600'
                }`}>
                  <div className="flex items-center gap-5 h-full">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
                      <category.icon className="w-8 h-8 md:w-10 md:h-10 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-white text-lg md:text-xl">{category.name}</h4>
                      <p className="text-sm md:text-base text-white/80">{category.description}</p>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>

        {/* Marquee Row 3 - Left to Right (3 columns) */}
        <div className="marquee-container">
          <div className="marquee-track">
            {[...businessCategories.slice(18), ...businessCategories.slice(18)].map((category, idx) => (
              <div key={idx} className="flex-shrink-0 w-80 md:w-96 mx-3">
                <Card className={`p-6 md:p-8 h-32 md:h-36 border-0 shadow-xl hover:shadow-2xl transition-all hover:scale-105 ${
                  idx % 3 === 0 ? 'bg-gradient-to-br from-indigo-500 to-blue-600' :
                  idx % 3 === 1 ? 'bg-gradient-to-br from-fuchsia-500 to-pink-600' :
                  'bg-gradient-to-br from-lime-500 to-green-600'
                }`}>
                  <div className="flex items-center gap-5 h-full">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
                      <category.icon className="w-8 h-8 md:w-10 md:h-10 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-white text-lg md:text-xl">{category.name}</h4>
                      <p className="text-sm md:text-base text-white/80">{category.description}</p>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>

        {/* Combined CTA Text */}
        <div className="text-center mt-12">
          <p className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
            Don't see your industry? <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">Vyora works for any business!</span>
          </p>
        </div>
      </section>

      {/* ===== SECTION DIVIDER ===== */}
      <div className="h-px bg-gradient-to-r from-transparent via-green-200 to-transparent" />

      {/* ===== FEATURES SECTION - Vertical Card Stack Swipe ===== */}
      <section id="features" className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Everything Your Business Needs
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              Complete suite of tools to manage, grow, and scale your business
            </p>
          </div>

          {/* Horizontal Auto-Sliding Carousel */}
          <div className="carousel-container" ref={swipeContainerRef}>
            <div 
              className="carousel-track"
              style={{ transform: `translateX(-${activeFeature * 100}%)` }}
            >
              {featureCards.map((feature, idx) => (
                <div key={idx} className="carousel-slide">
                  <Card className="bg-white shadow-2xl rounded-3xl overflow-hidden border-0 mx-auto max-w-6xl lg:max-w-7xl">
                    <div className="grid md:grid-cols-2 gap-0">
                      {/* Image Side */}
                      <div className="relative h-72 md:h-[500px] lg:h-[550px]">
                        <img 
                          src={feature.image} 
                          alt={feature.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        <div className="absolute bottom-6 left-6 flex items-center gap-3">
                          <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg">
                            <feature.icon className="w-7 h-7 md:w-8 md:h-8 text-white" />
                          </div>
                          <span className="text-white font-bold text-xl md:text-2xl">{String(idx + 1).padStart(2, '0')} / {featureCards.length}</span>
                        </div>
                      </div>
                      
                      {/* Content Side */}
                      <div className="p-6 md:p-10 lg:p-14 flex flex-col justify-center bg-white">
                        <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          {feature.title}
                        </h3>
                        <p className="text-blue-600 font-semibold mb-4 text-lg md:text-xl">{feature.subtitle}</p>
                        <p className="text-gray-600 mb-6 leading-relaxed text-base md:text-lg">{feature.description}</p>
                        
                        <ul className="space-y-3 mb-8">
                          {feature.features.map((item, i) => (
                            <li key={i} className="flex items-center gap-3 text-gray-700 text-base md:text-lg">
                              <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                        
                        <Link href="/signup">
                          <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 h-12 md:h-14 font-semibold w-fit text-base md:text-lg shadow-lg shadow-blue-500/30">
                            Get Started for Free <ArrowRight className="w-5 h-5 ml-2" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          </div>
          
          {/* Navigation Arrows + Progress Dots */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() => setActiveFeature(prev => Math.max(0, prev - 1))}
              disabled={activeFeature === 0}
              className="w-12 h-12 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center hover:bg-blue-50 hover:border-blue-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>
            
            <div className="flex gap-2">
              {featureCards.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveFeature(idx)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${idx === activeFeature ? 'bg-blue-600 w-10' : 'bg-gray-300 hover:bg-gray-400 w-2.5'}`}
                />
              ))}
            </div>
            
            <button
              onClick={() => setActiveFeature(prev => Math.min(featureCards.length - 1, prev + 1))}
              disabled={activeFeature === featureCards.length - 1}
              className="w-12 h-12 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center hover:bg-blue-50 hover:border-blue-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>
      </section>

      {/* ===== SECTION DIVIDER ===== */}
      <div className="h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent" />

      {/* ===== WHY VYORA SECTION - Light Green Background to match Partner Section ===== */}
      <section id="why-vyora" className="py-16 md:py-24 bg-green-50 relative overflow-hidden">
        
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Why 12,000+ Businesses Trust Vyora?
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
              Industry-leading results backed by data. See why businesses across 600+ cities choose Vyora for their growth.
            </p>
          </div>

          {/* Benefits Grid with Fade-Up Animation */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {whyVyoraBenefits.map((benefit, idx) => (
              <Card key={idx} className="scroll-reveal relative p-6 md:p-8 border-0 shadow-xl hover-lift bg-white group overflow-hidden" style={{ animationDelay: `${idx * 0.1}s` }}>
                {/* Hover gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative z-10">
                  {/* Icon */}
                  <div className="w-16 h-16 rounded-2xl bg-blue-100 group-hover:bg-white/20 flex items-center justify-center mb-6 transition-colors duration-300">
                    <benefit.icon className="w-8 h-8 text-blue-600 group-hover:text-white transition-colors duration-300" />
                  </div>
                  
                  {/* Stat Highlight */}
                  <div className="mb-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl md:text-5xl font-bold text-blue-600 group-hover:text-white transition-colors duration-300">
                        {benefit.stat}
                      </span>
                      <span className="text-lg font-semibold text-blue-500 group-hover:text-blue-100 transition-colors duration-300">
                        {benefit.highlight}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 group-hover:text-blue-100 transition-colors duration-300 mt-1">
                      {benefit.subtext}
                    </p>
                  </div>
                  
                  {/* Title & Description */}
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-white mb-3 transition-colors duration-300">
                    {benefit.title}
                  </h3>
                  <p className="text-sm md:text-base text-gray-600 group-hover:text-blue-100 leading-relaxed transition-colors duration-300">
                    {benefit.description}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SECTION DIVIDER ===== */}
      <div className="h-px bg-gradient-to-r from-transparent via-purple-200 to-transparent" />

      {/* ===== PRICING SECTION ===== */}
      <section id="pricing" className="py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-10 md:mb-14">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Affordable Plans for Every Business
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Start for free and upgrade when you're ready. No hidden charges.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto mb-16">
            {pricingPlans.map((plan, idx) => (
              <Card 
                key={idx} 
                className={`p-6 md:p-8 relative hover-lift ${idx === 1 ? 'border-2 border-blue-600 shadow-2xl bg-gradient-to-br from-blue-50 to-white' : 'border border-gray-200 shadow-lg bg-white'}`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-green-600 text-white px-6 py-1.5 rounded-full text-sm font-bold shadow-lg">
                    {plan.badge}
                  </div>
                )}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${idx === 1 ? 'bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg shadow-blue-500/30' : 'bg-gray-100'}`}>
                    <plan.icon className={`w-7 h-7 ${idx === 1 ? 'text-white' : 'text-gray-600'}`} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                    <p className="text-sm text-gray-500">{plan.description}</p>
                  </div>
                </div>
                <div className="mb-6">
                  {idx === 1 ? (
                    <div>
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-lg text-gray-400 line-through">{(plan as any).originalPrice}/mo</span>
                        <Badge className="bg-red-100 text-red-600 hover:bg-red-100 text-xs">20% OFF</Badge>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg text-gray-500">Only</span>
                        <span className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">{plan.price}</span>
                        <span className="text-xl text-gray-500">{plan.period}</span>
                      </div>
                      <p className="text-sm text-green-600 font-medium mt-1">That's just {(plan as any).offerPrice}/month!</p>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
                      <span className="text-gray-500">{plan.period}</span>
                    </div>
                  )}
                </div>
                <ul className="space-y-2 mb-8 max-h-72 overflow-y-auto pr-2">
                  {allFeatures.map((feature, featureIdx) => {
                    const isIncluded = idx === 1 || freeFeatures.includes(feature);
                    return (
                      <li key={featureIdx} className={`flex items-start gap-2 ${!isIncluded ? 'opacity-50' : ''}`}>
                        {isIncluded ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <X className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                        )}
                        <span className={`text-sm ${isIncluded ? 'text-gray-700' : 'text-gray-400 line-through'}`}>{feature}</span>
                      </li>
                    );
                  })}
                </ul>
                <Link href="/signup">
                  <Button 
                    className={`w-full rounded-xl h-12 text-base font-semibold ${idx === 1 ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/30' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'}`}
                  >
                    {idx === 0 ? 'Start Free' : 'Get Pro - ₹13/day'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </Card>
            ))}
          </div>

          {/* Competitor Comparison Table */}
          <div className="mt-16">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-8" style={{ fontFamily: 'Poppins, sans-serif' }}>
              See How Vyora Compares
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full bg-white rounded-xl shadow-xl overflow-hidden">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                    <th className="px-4 py-4 text-left text-sm font-semibold">Feature</th>
                    <th className="px-4 py-4 text-center text-sm font-semibold bg-green-600">Vyora Free</th>
                    <th className="px-4 py-4 text-center text-sm font-semibold bg-green-600">Vyora Pro</th>
                    <th className="px-4 py-4 text-center text-sm font-semibold">Zoho</th>
                    <th className="px-4 py-4 text-center text-sm font-semibold">Freshworks</th>
                    <th className="px-4 py-4 text-center text-sm font-semibold">HubSpot</th>
                  </tr>
                </thead>
                <tbody>
                  {competitorComparison.map((row, idx) => (
                    <tr key={idx} className={`border-b border-gray-100 ${idx === competitorComparison.length - 1 ? 'bg-gray-50 font-bold' : ''}`}>
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">{row.feature}</td>
                      <td className="px-4 py-3 text-center bg-green-50">
                        {typeof row.vyoraFree === 'boolean' ? (
                          row.vyoraFree ? <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto" /> : <X className="w-5 h-5 text-gray-300 mx-auto" />
                        ) : (
                          <span className="text-green-600 font-bold">{row.vyoraFree}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center bg-green-50">
                        {typeof row.vyoraPro === 'boolean' ? (
                          row.vyoraPro ? <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto" /> : <X className="w-5 h-5 text-gray-300 mx-auto" />
                        ) : (
                          <span className="text-green-600 font-bold">{row.vyoraPro}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-600">{row.zoho}</td>
                      <td className="px-4 py-3 text-center text-sm text-gray-600">{row.freshworks}</td>
                      <td className="px-4 py-3 text-center text-sm text-gray-600">{row.hubspot}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-center text-sm text-gray-500 mt-4">
              * Prices based on publicly available pricing as of 2025. Actual prices may vary.
            </p>
          </div>
        </div>
      </section>

      {/* ===== SECTION DIVIDER ===== */}
      <div className="h-px bg-gradient-to-r from-transparent via-green-200 to-transparent" />

      {/* ===== BECOME A PARTNER SECTION - Light Green Background ===== */}
      <section className="py-16 md:py-24 bg-green-50 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-green-100/50 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-green-200/30 rounded-full blur-3xl" />
        
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-10 md:gap-16 items-center">
            {/* Left Content */}
            <div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Become a Vyora Partner
              </h2>
              <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed">
                Join our growing network of partners and earn while helping businesses grow. Our partner program offers industry-leading commissions and bonuses.
              </p>
              
              <div className="space-y-4 mb-8">
                {[
                  "Flat 50% recurring commission on all referrals",
                  "Up to ₹18,000 additional bonus per month",
                  "Dedicated partner dashboard & real-time analytics",
                  "Marketing materials & sales support kit",
                  "Priority access to new features & updates",
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-gray-700 text-base md:text-lg font-medium">{item}</span>
                  </div>
                ))}
              </div>
              
              <a href="https://partners.vyora.club" target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="btn-arrow bg-green-600 hover:bg-green-700 text-white shadow-xl shadow-green-500/30 rounded-xl px-8 h-14 font-semibold hover-lift">
                  <Handshake className="w-5 h-5 mr-2" />
                  Join Partner Program
                  <ArrowRight className="w-4 h-4 ml-2 arrow-icon" />
                </Button>
              </a>
            </div>
            
            {/* Right - Earnings Card */}
            <div className="relative">
              <Card className="bg-white border-green-200 shadow-2xl p-6 md:p-8 hover-lift">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-4 animate-float shadow-xl">
                    <Gift className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">Partner Earnings</h3>
                  <p className="text-gray-500 text-sm">What you can earn monthly</p>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-green-50 rounded-xl p-5 border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-700 font-medium">Commission Rate</span>
                      <span className="text-3xl font-bold text-green-600">50%</span>
                    </div>
                    <p className="text-sm text-gray-500">Flat recurring on every referral</p>
                  </div>
                  
                  <div className="bg-green-50 rounded-xl p-5 border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-700 font-medium">Monthly Bonus</span>
                      <span className="text-3xl font-bold text-green-600 flex items-center">
                        <IndianRupee className="w-6 h-6" />18,000
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">Additional performance bonus</p>
                  </div>
                  
                  <div className="bg-green-50 rounded-xl p-5 border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-700 font-medium">Top Earnings</span>
                      <span className="text-3xl font-bold text-green-600 flex items-center">
                        <IndianRupee className="w-6 h-6" />1.2L+
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">What top partners earn monthly</p>
                  </div>
                </div>
              </Card>
              
              {/* Floating badge */}
              <div className="absolute -top-4 -right-4 md:right-0 bg-green-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg animate-float" style={{ animationDelay: '0.5s' }}>
                <TrendingUp className="w-4 h-4 inline mr-1" /> Limited Slots!
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SECTION DIVIDER ===== */}
      <div className="h-px bg-gradient-to-r from-transparent via-purple-200 to-transparent" />

      {/* ===== TESTIMONIALS SECTION - Auto Sliding on Mobile ===== */}
      <section id="testimonials" className="py-16 md:py-20 bg-gray-50">
        <style>{`
          @keyframes slideTestimonial {
            0%, 20% { opacity: 1; transform: translateX(0); }
            25%, 45% { opacity: 0; transform: translateX(-100%); }
            50%, 70% { opacity: 0; transform: translateX(100%); }
            75%, 100% { opacity: 1; transform: translateX(0); }
          }
          .testimonial-slide {
            animation: slideTestimonial 12s infinite;
          }
          .testimonial-slide:nth-child(1) { animation-delay: 0s; }
          .testimonial-slide:nth-child(2) { animation-delay: 3s; }
          .testimonial-slide:nth-child(3) { animation-delay: 6s; }
          .testimonial-slide:nth-child(4) { animation-delay: 9s; }
        `}</style>
        
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-10 md:mb-14">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Loved by Business Owners
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              See how businesses across India are transforming their operations with Vyora
            </p>
          </div>

          {/* Mobile - Auto Sliding Single Testimonial */}
          <div className="md:hidden relative h-72 overflow-hidden">
            {testimonials.map((testimonial, idx) => (
              <Card 
                key={idx} 
                className="testimonial-slide absolute inset-0 p-5 border-0 shadow-lg bg-white mx-2"
                style={{ animationDelay: `${idx * 3}s` }}
              >
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                
                <div className="relative mb-4">
                  <Quote className="absolute -top-1 -left-1 w-6 h-6 text-blue-100" />
                  <p className="text-gray-600 leading-relaxed pl-5 text-sm line-clamp-4">
                    {testimonial.content}
                  </p>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                      {testimonial.initial}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{testimonial.name}</p>
                      <p className="text-xs text-gray-500">{testimonial.role}</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs">
                    {testimonial.metric}
                  </Badge>
                </div>
              </Card>
            ))}
            
            {/* Slide Indicators */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
              {testimonials.map((_, idx) => (
                <div key={idx} className="w-2 h-2 rounded-full bg-gray-300" />
              ))}
            </div>
          </div>

          {/* Desktop - Grid Layout */}
          <div className="hidden md:grid grid-cols-2 gap-5 md:gap-6">
            {testimonials.map((testimonial, idx) => (
              <Card key={idx} className="p-5 md:p-6 border-0 shadow-lg hover-lift bg-white scroll-reveal" style={{ animationDelay: `${idx * 0.1}s` }}>
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                
                <div className="relative mb-5">
                  <Quote className="absolute -top-2 -left-2 w-8 h-8 text-blue-100" />
                  <p className="text-gray-600 leading-relaxed pl-6 text-sm md:text-base">
                    {testimonial.content}
                  </p>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                      {testimonial.initial}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{testimonial.name}</p>
                      <p className="text-xs text-gray-500">{testimonial.role}</p>
                      <p className="text-xs text-gray-400">{testimonial.location}</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs">
                    {testimonial.metric}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FAQ SECTION - Enhanced UI ===== */}
      <section id="faq" className="py-16 md:py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-10 md:mb-14">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600">
              Everything you need to know about Vyora
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <Card 
                key={idx} 
                className={`overflow-hidden border-0 shadow-lg transition-all ${openFaq === idx ? 'shadow-xl ring-2 ring-blue-500 bg-white' : 'bg-white hover:shadow-xl'}`}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-6 md:px-8 py-5 md:py-6 text-left flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-4 pr-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${openFaq === idx ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'}`}>
                      <span className="font-bold text-sm">{String(idx + 1).padStart(2, '0')}</span>
                    </div>
                    <span className="font-bold text-gray-900 text-base md:text-lg">{faq.question}</span>
                  </div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${openFaq === idx ? 'bg-blue-600 rotate-180' : 'bg-gray-100'}`}>
                    <ChevronDown className={`w-5 h-5 ${openFaq === idx ? 'text-white' : 'text-gray-500'}`} />
                  </div>
                </button>
                {openFaq === idx && (
                  <div className="px-6 md:px-8 pb-6 md:pb-8 animate-fade-in">
                    <div className="pl-14">
                      <p className="text-gray-600 leading-relaxed text-base md:text-lg">{faq.answer}</p>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CONTACT US LEAD GENERATION FORM - Light Green Background ===== */}
      <section id="contact-form" className="py-16 md:py-20 bg-green-50">
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-start">
            {/* Left Content */}
            <div className="text-center md:text-left">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Ready to Get Started?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Fill out the form and our team will reach out within 24 hours to help you set up your business on Vyora.
              </p>
              
              {/* Contact Options */}
              <div className="space-y-4 mb-8">
                <a 
                  href="tel:+917704935569" 
                  className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Phone className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Call Us</p>
                    <p className="text-blue-600 font-medium">+91 77049 35569</p>
                  </div>
                </a>
                
                <a 
                  href="https://wa.me/917704935569?text=Hi, I'm interested in Vyora for my business" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-full bg-[#25D366] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    {/* Official WhatsApp Logo */}
                    <svg viewBox="0 0 24 24" className="w-6 h-6 text-white fill-current">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">WhatsApp</p>
                    <p className="text-green-600 font-medium">+91 77049 35569</p>
                  </div>
                </a>
                
                <a 
                  href="mailto:hello@vyora.club?subject=Interested in Vyora&body=Hi, I would like to know more about Vyora for my business." 
                  className="flex items-center gap-4 p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Email Us</p>
                    <p className="text-purple-600 font-medium">hello@vyora.club</p>
                  </div>
                </a>
              </div>
              
            </div>
            
            {/* Contact Form */}
            <Card className="p-6 md:p-8 bg-gray-50 border-0 shadow-xl">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Book Your Free Demo</h3>
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-gray-700 font-medium">Full Name *</Label>
                  <Input 
                    id="name"
                    placeholder="Enter your name"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    required
                    className="mt-1 bg-white"
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-gray-700 font-medium">Phone Number *</Label>
                  <Input 
                    id="phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                    required
                    className="mt-1 bg-white"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-gray-700 font-medium">Email Address</Label>
                  <Input 
                    id="email"
                    type="email"
                    placeholder="you@business.com"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    className="mt-1 bg-white"
                  />
                </div>
                <div>
                  <Label htmlFor="business" className="text-gray-700 font-medium">Business Name</Label>
                  <Input 
                    id="business"
                    placeholder="Your business name"
                    value={contactForm.business}
                    onChange={(e) => setContactForm({ ...contactForm, business: e.target.value })}
                    className="mt-1 bg-white"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 font-semibold text-base shadow-lg shadow-blue-500/30"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Book Free Demo'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </section>

      {/* ===== FOOTER - Blue Solid Background ===== */}
      <footer className="bg-blue-600 text-white py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          {/* Footer Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-3 mb-5">
                <img 
                  src="https://abizuwqnqkbicrhorcig.storage.supabase.co/storage/v1/object/public/vyora-bucket/partners-vyora/p/IMAGE/logo-vyora.png" 
                  alt="Vyora Logo" 
                  className="h-12 md:h-14 w-auto object-contain bg-white rounded-xl p-1"
                />
              </div>
              <p className="text-base text-blue-100 leading-relaxed">
                Universal business marketplace platform for all industries. Empowering 12,000+ businesses across India.
              </p>
            </div>
            
            {/* Product */}
            <div>
              <h4 className="font-bold text-white mb-4 text-lg">Product</h4>
              <ul className="space-y-3 text-base text-blue-100">
                <li><button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors">Features</button></li>
                <li><button onClick={() => scrollToSection('pricing')} className="hover:text-white transition-colors">Pricing</button></li>
                <li><button onClick={() => scrollToSection('why-vyora')} className="hover:text-white transition-colors">Why Vyora</button></li>
                <li><a href="https://partners.vyora.club" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Partners</a></li>
              </ul>
            </div>
            
            {/* Company */}
            <div>
              <h4 className="font-bold text-white mb-4 text-lg">Company</h4>
              <ul className="space-y-3 text-base text-blue-100">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><button onClick={() => scrollToSection('contact-form')} className="hover:text-white transition-colors">Contact</button></li>
              </ul>
            </div>
            
            {/* Legal */}
            <div>
              <h4 className="font-bold text-white mb-4 text-lg">Legal</h4>
              <ul className="space-y-3 text-base text-blue-100">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Compliance</a></li>
              </ul>
            </div>
          </div>
          
          {/* Bottom Bar */}
          <div className="border-t border-blue-400 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-base">
            <p className="text-blue-100">© {new Date().getFullYear()} Vyora. All rights reserved.</p>
            <p className="text-blue-200 text-center sm:text-right">Made with ❤️ in India</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
