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
  Monitor,
  Tractor,
  Sofa,
  Layout,
  List,
  BookOpen,
  UserCheck,
  LogOut,
  CheckSquare,
  Tag,
  Truck,
  BarChart,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useEffect, useState, useRef, TouchEvent, useMemo } from "react";
import { motion, AnimatePresence, useScroll, useTransform, MotionValue } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { SeoFooterLinks } from "@/components/seo-footer-links";
import { FaWhatsapp } from "react-icons/fa";

// Data types for dynamically loaded modules
// Data types for dynamically loaded modules
type Category = { name: string; slug: string; icon: any; accentColor: any; description: string;[key: string]: any };
type Tool = { title: string; slug: string; category: string; description: string;[key: string]: any };

const partnerTiers = [
  {
    level: "Silver Partner",
    sales: "1 - 10 Sales",
    commission: "20%",
    benefits: ["Access to Partner Dashboard", "Standard Marketing Kit", "Email Support"],
    icon: Star,
    color: "text-gray-400"
  },
  {
    level: "Gold Partner",
    sales: "11 - 50 Sales",
    commission: "25%",
    benefits: ["All Silver Benefits", "Co-branded Materials", "Priority Chat Support", "Featured Partner listing"],
    icon: Award,
    color: "text-yellow-500",
    popular: true
  },
  {
    level: "Platinum Partner",
    sales: "50+ Sales",
    commission: "30%",
    benefits: ["All Gold Benefits", "Dedicated Channel Manager", "Revenue Share on Add-ons", "Invitation to Annual Summit"],
    icon: Gift,
    color: "text-blue-600"
  }
];

// Feature cards data like the attached images
const featureCards = [
  {
    image: "https://illustrations.popsy.co/amber/customer-support.svg",
    icon: Users,
    title: "Customers Management",
    description: "Keep track of all your customer details, purchase history, and preferences in one central dashboard."
  },
  {
    image: "https://illustrations.popsy.co/amber/work-from-home.svg",
    icon: Users,
    title: "Employees Management",
    description: "Manage your team efficiently, track roles, performance, and streamline internal communication."
  },
  {
    image: "https://illustrations.popsy.co/amber/digital-marketing.svg",
    icon: Target,
    title: "Leads Management",
    description: "Convert prospects into customers by tracking every lead interaction and sales stage effectively."
  },
  {
    image: "https://illustrations.popsy.co/amber/online-shopping.svg",
    icon: Layout,
    title: "POS Management",
    description: "Streamline your sales points with a fast, reliable, and integrated point-of-sale system."
  },
  {
    image: "https://illustrations.popsy.co/amber/calendar.svg",
    icon: Calendar,
    title: "Bookings Management",
    description: "Handle reservations and bookings effortlessly with a real-time availability calendar."
  },
  {
    image: "https://illustrations.popsy.co/amber/remote-work.svg",
    icon: Clock,
    title: "Appointments Management",
    description: "Schedule and manage client appointments with automated reminders to reduce no-shows."
  },
  {
    image: "https://illustrations.popsy.co/amber/delivery.svg",
    icon: ShoppingBag,
    title: "Orders Management",
    description: "Track orders from placement to delivery, ensuring timely fulfillment and customer satisfaction."
  },
  {
    image: "https://illustrations.popsy.co/amber/freelancer.svg",
    icon: Truck,
    title: "Suppliers Management",
    description: "Manage vendor relationships, purchase orders, and track supplier performance in one place."
  },
  {
    image: "https://illustrations.popsy.co/amber/payment-processed.svg",
    icon: CreditCard,
    title: "Expenses Management",
    description: "Monitor and categorize business expenses to keep your finances healthy and transparent."
  },
  {
    image: "https://illustrations.popsy.co/amber/creative-writing.svg",
    icon: FileText,
    title: "Quotations Management",
    description: "Create professional quotes and estimates quickly to win more business and close deals faster."
  },
  {
    image: "https://illustrations.popsy.co/amber/finances.svg",
    icon: BookOpen,
    title: "Hisab Kitab Management",
    description: "Digital accounting for daily transactions, credit tracking, and clear financial summaries."
  },
  {
    image: "https://illustrations.popsy.co/amber/web-design.svg",
    icon: List,
    title: "Services Catalogue Management",
    description: "Display your service offerings with professional descriptions and clear pricing options."
  },
  {
    image: "https://illustrations.popsy.co/amber/product-launch.svg",
    icon: Package,
    title: "Products Catalogue Management",
    description: "Showcase your product inventory with high-quality images and real-time stock availability."
  },
  {
    image: "https://illustrations.popsy.co/amber/data-analysis.svg",
    icon: BarChart,
    title: "Stock Turnover Management",
    description: "Analyze how quickly your inventory is sold and replaced to optimize your stock levels."
  },
  {
    image: "https://illustrations.popsy.co/amber/success.svg",
    icon: UserCheck,
    title: "Attendance Management",
    description: "Track staff clock-ins, clock-outs, and work hours automatically with detailed reports."
  },
  {
    image: "https://illustrations.popsy.co/amber/home-office.svg",
    icon: LogOut,
    title: "Leaves Management",
    description: "Manage employee leave requests, approvals, and balances without any manual paperwork."
  },
  {
    image: "https://illustrations.popsy.co/amber/project-management.svg",
    icon: CheckSquare,
    title: "Tasks Management",
    description: "Organize daily business operations and assign tasks to team members to stay productive."
  },
  {
    image: "https://illustrations.popsy.co/amber/social-media.svg",
    icon: Megaphone,
    title: "Greeting & Marketing Management",
    description: "Engage customers with automated greetings, festive wishes, and targeted marketing campaigns."
  },
  {
    image: "https://illustrations.popsy.co/amber/blogging.svg",
    icon: Globe,
    title: "Website Builder Management",
    description: "Create and update your business website instantly with our AI-driven builder."
  },
  {
    image: "https://illustrations.popsy.co/amber/gift.svg",
    icon: Tag,
    title: "Offers & Coupons Management",
    description: "Boost sales by creating and managing promotional offers, discounts, and custom coupons."
  },
  {
    image: "https://illustrations.popsy.co/amber/support.svg",
    icon: Headphones,
    title: "24/7 Priority Support",
    description: "Get dedicated assistance whenever you need it with our round-the-clock expert support team."
  }
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
  {
    name: "Vikram Singh",
    role: "CEO, Tech Solutions Hub",
    location: "Pune",
    initial: "V",
    content: "Vyora's invoicing and payment reminders have transformed our cash flow. We get paid 2x faster now, and the automated GST reports save our accountant hours every month.",
    rating: 5,
    metric: "2x Faster Payments"
  }
];

const faqs = [
  { question: "What are the pricing options for Vyora?", answer: "Vyora offers a simple Lifetime plan at ₹1999 including taxes for complete access." },
  { question: "Do I need technical skills to build my website on Vyora?", answer: "Not at all. Vyora is designed for business owners, not developers. Our AI-powered mini-website builder creates professional, mobile-ready websites automatically based on your business details. You can update it anytime with a simple visual interface." },
  { question: "How safe is my business data on Vyora?", answer: "We take your data security seriously. Vyora uses bank-grade 256-bit encryption and secure cloud servers. Your data is backed up daily, and we never share your business information with third parties without your explicit consent." },
  { question: "Can I use my own custom domain with the website?", answer: "Currently, you get a free verified subdomain (e.g., yourname.vyora.club). Custom domain connection is a feature coming soon in our Vyora Pro+ plan, which will allow you to use any domain you own." },
  { question: "What kind of support is available?", answer: "We provide 24/7 priority customer support for all users. Pro users get access to dedicated account managers and faster resolution times." },
  { question: "Can Vyora help with my GST billing?", answer: "Absolutely! Vyora's Hisab-Kitab tool is fully equipped to handle GST billing, create compliant invoices, and generate the necessary tax reports for your CA, saving you hours of manual work." }
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

// Pricing plan included features (both plans include everything now)
const pricingPlans = [
  {
    name: "Lifetime",
    price: "₹1999",
    period: "/forever",
    badge: "Most Popular",
    description: "Includes taxes. Full access.",
    icon: Crown,
  },
];

// Competitor comparison data
const competitorComparison = [
  { feature: "Customer Management", vyoraLifetime: true, zoho: "₹800/mo", freshworks: "₹999/mo", hubspot: "₹4500/mo" },
  { feature: "Employee Management", vyoraLifetime: true, zoho: "₹500/mo", freshworks: "₹600/mo", hubspot: "Not Available" },
  { feature: "Leads Management", vyoraLifetime: true, zoho: "₹800/mo", freshworks: "₹999/mo", hubspot: "Free (Limited)" },
  { feature: "POS System", vyoraLifetime: true, zoho: "₹1500/mo", freshworks: "Not Available", hubspot: "Not Available" },
  { feature: "Bookings & Appointments", vyoraLifetime: true, zoho: "₹600/mo", freshworks: "₹800/mo", hubspot: "₹2000/mo" },
  { feature: "Website Builder", vyoraLifetime: true, zoho: "₹1000/mo", freshworks: "Not Available", hubspot: "₹3000/mo" },
  { feature: "Hisab Kitab (Accounting)", vyoraLifetime: true, zoho: "₹1200/mo", freshworks: "Not Available", hubspot: "Not Available" },
  { feature: "Marketing & Greeting", vyoraLifetime: true, zoho: "₹1500/mo", freshworks: "₹2000/mo", hubspot: "₹3500/mo" },
  { feature: "Stock Management", vyoraLifetime: true, zoho: "₹800/mo", freshworks: "Not Available", hubspot: "Not Available" },
  { feature: "Total Cost", vyoraLifetime: "₹1999 (One-time)", zoho: "₹8,700+", freshworks: "₹5,400+", hubspot: "₹13,000+" },
];

// Stats data - Like attached image
const statsData = [
  { icon: Building2, value: "12,000+", label: "Active Businesses", color: "bg-blue-500" },
  { icon: Settings, value: "20+", label: "Management Apps", color: "bg-emerald-500" },
  { icon: Layers, value: "190+", label: "Business Categories", color: "bg-purple-500" },
  { icon: MapPin, value: "600+", label: "Cities Covered", color: "bg-orange-500" },
];

// Business Categories data with images and colors
const businessCategories = [
  { slug: "fitness-wellness", image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=200&h=200&fit=crop&q=80", icon: Dumbbell, name: "Gym & Fitness Centres", description: "Membership management, class scheduling", color: "bg-red-500" },
  { slug: "salons-spas", image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=200&h=200&fit=crop&q=80", icon: Scissors, name: "Salon Owners", description: "Appointment booking, service catalogue", color: "bg-pink-500" },
  { slug: "healthcare", image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&h=200&fit=crop&q=80", icon: Stethoscope, name: "Doctors & Health Clinics", description: "Patient management, appointments", color: "bg-blue-500" },
  { slug: "education", image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=200&h=200&fit=crop&q=80", icon: GraduationCap, name: "Education & Coaching", description: "Student batches, fee management", color: "bg-indigo-500" },
  { slug: "retail", image: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=200&h=200&fit=crop&q=80", icon: ShoppingBag, name: "Retail Stores", description: "Inventory, POS, online store", color: "bg-purple-500" },
  { slug: "restaurants", image: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=200&h=200&fit=crop&q=80", icon: Utensils, name: "Restaurants & Bars", description: "Table booking, menu management", color: "bg-orange-500" },
  { slug: "automotive", image: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=200&h=200&fit=crop&q=80", icon: Car, name: "Car Garages & Mechanics", description: "Service booking, parts inventory", color: "bg-gray-600" },
  { slug: "real-estate", image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200&h=200&fit=crop&q=80", icon: Home, name: "Real Estate Agents", description: "Property listings, client management", color: "bg-teal-500" },
  { slug: "professional-services", image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200&h=200&fit=crop&q=80", icon: Briefcase, name: "Consulting Firms", description: "Client management, project tracking", color: "bg-slate-600" },
  { slug: "photography-videography", image: "https://images.unsplash.com/photo-1554046985-78e8b15ca850?w=200&h=200&fit=crop&q=80", icon: Camera, name: "Photography Studios", description: "Booking management, portfolio", color: "bg-amber-500" },
  { slug: "events-entertainment", image: "https://images.unsplash.com/photo-1516450360452-9312f5e86ce7?w=200&h=200&fit=crop&q=80", icon: Music, name: "Events & Entertainment", description: "Event booking, vendor management", color: "bg-violet-500" },
  { slug: "professional-services", image: "https://images.unsplash.com/photo-1600607686527-6fb886090705?w=200&h=200&fit=crop&q=80", icon: Palette, name: "Art & Design", description: "Project management, client galleries", color: "bg-rose-500" },
  { slug: "fitness-wellness", image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=200&h=200&fit=crop&q=80", icon: Heart, name: "Yoga & Wellness", description: "Therapy sessions, membership", color: "bg-green-500" },
  { slug: "restaurants", image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200&h=200&fit=crop&q=80", icon: Coffee, name: "Cafes & Bakeries", description: "Menu management, orders", color: "bg-yellow-600" },
  { slug: "fitness-wellness", image: "https://images.unsplash.com/photo-1526501174620-1e52002f5a6b?w=200&h=200&fit=crop&q=80", icon: Bike, name: "Sports & Recreation", description: "Court booking, equipment rental", color: "bg-cyan-500" },
  { slug: "travel-tourism", image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=200&h=200&fit=crop&q=80", icon: Plane, name: "Tours & Travels", description: "Trip planning, booking management", color: "bg-sky-500" },
  { slug: "education", image: "https://images.unsplash.com/photo-1603569283847-aa295f0d016a?w=200&h=200&fit=crop&q=80", icon: Baby, name: "Childcare & Preschool", description: "Enrollment, attendance", color: "bg-lime-500" },
  { slug: "home-services", image: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=200&h=200&fit=crop&q=80", icon: Dog, name: "Pet Services", description: "Grooming appointments, boarding", color: "bg-emerald-500" },
  { slug: "retail", image: "https://images.unsplash.com/photo-1563241598-ebbc27643b1e?w=200&h=200&fit=crop&q=80", icon: Flower2, name: "Florists & Gifts", description: "Order management, delivery tracking", color: "bg-fuchsia-500" },
  { slug: "it-software-agencies", image: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=200&h=200&fit=crop&q=80", icon: Laptop, name: "IT Services", description: "Project management, client portal", color: "bg-blue-600" },
  { slug: "home-services", image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=200&h=200&fit=crop&q=80", icon: Wrench, name: "Home Services", description: "Booking, technician dispatch", color: "bg-stone-500" },
  { slug: "restaurants", image: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=200&h=200&fit=crop&q=80", icon: UtensilsCrossed, name: "Catering", description: "Event booking, menu planning", color: "bg-red-600" },
  { slug: "restaurants", image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200&h=200&fit=crop&q=80", icon: Cake, name: "Bakers & Cake Shops", description: "Custom orders, delivery", color: "bg-pink-600" },
  { slug: "retail", image: "https://images.unsplash.com/photo-1599643478524-fb524ad949e2?w=200&h=200&fit=crop&q=80", icon: Gem, name: "Jewelry Stores", description: "Inventory, custom orders", color: "bg-amber-600" },
  { slug: "retail", image: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=200&h=200&fit=crop&q=80", icon: Library, name: "Libraries & Books", description: "Book management, memberships", color: "bg-brown-500" },
  { slug: "cleaning-services", image: "https://images.unsplash.com/photo-1586880244406-556ebe35f282?w=200&h=200&fit=crop&q=80", icon: Shield, name: "Pest Control Businesses", description: "Inventory, billing, loyalty", color: "bg-indigo-600" },
  { slug: "home-services", image: "https://images.unsplash.com/photo-1504307651254-35680f356f58?w=200&h=200&fit=crop&q=80", icon: Hammer, name: "Construction", description: "Project tracking, invoicing", color: "bg-orange-600" },
  { slug: "professional-services", image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=200&h=200&fit=crop&q=80", icon: Megaphone, name: "Marketing Agencies", description: "Campaign management, analytics", color: "bg-purple-600" },
  { slug: "electronics", image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=200&h=200&fit=crop&q=80", icon: Monitor, name: "Electronics", description: "Product catalog, repairs & sales", color: "bg-cyan-600" },
  { slug: "fashion", image: "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=200&h=200&fit=crop&q=80", icon: Shirt, name: "Fashion", description: "Inventory, styling & collections", color: "bg-pink-600" },
  { slug: "logistics-transport", image: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=200&h=200&fit=crop&q=80", icon: Tractor, name: "Agriculture", description: "Farm management, supply chain", color: "bg-green-600" },
  { slug: "retail", image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200&h=200&fit=crop&q=80", icon: Sofa, name: "Furniture", description: "Showroom, orders & delivery", color: "bg-yellow-700" },
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


function StackedFeatureCard({ feature, index, total, scrollYProgress }: { feature: any, index: number, total: number, scrollYProgress: MotionValue<number> }) {
  const segment = 1 / total;

  const fadeStart = Math.max(0, (index - 0.15) * segment);
  const fadeEnd = Math.max(0, index * segment);
  const fadeOutStart = Math.min(1, (index + 0.85) * segment);
  const fadeOutEnd = Math.min(1, (index + 1) * segment);

  const opacity = useTransform(
    scrollYProgress,
    [fadeStart, fadeEnd, fadeOutStart, fadeOutEnd],
    index === 0 ? [1, 1, 1, 0] :
      index === total - 1 ? [0, 1, 1, 1] :
        [0, 1, 1, 0]
  );

  const y = useTransform(
    scrollYProgress,
    [fadeStart, fadeEnd, fadeOutStart, fadeOutEnd],
    index === 0 ? [0, 0, 0, -40] :
      index === total - 1 ? [40, 0, 0, 0] :
        [40, 0, 0, -40]
  );

  const zIndex = useTransform(
    scrollYProgress,
    [fadeStart, fadeEnd, fadeOutStart, fadeOutEnd],
    index === 0 ? [2, 2, 1, 0] :
      index === total - 1 ? [0, 2, 2, 2] :
        [0, 2, 1, 0]
  );

  const gradients = [
    "from-blue-600 to-cyan-500",
    "from-purple-600 to-pink-500",
    "from-emerald-500 to-teal-400",
    "from-orange-500 to-rose-500",
    "from-indigo-500 to-blue-600",
    "from-pink-600 to-rose-500",
  ];
  const gradient = gradients[index % gradients.length];

  const badgeColors = [
    "bg-blue-100 text-blue-700",
    "bg-purple-100 text-purple-700",
    "bg-emerald-100 text-emerald-700",
    "bg-orange-100 text-orange-700",
    "bg-indigo-100 text-indigo-700",
    "bg-pink-100 text-pink-700",
  ];
  const badgeColor = badgeColors[index % badgeColors.length];

  return (
    <motion.div
      style={{
        y,
        opacity,
        zIndex,
      }}
      className="absolute inset-x-2 sm:inset-x-4 lg:inset-x-8 top-0 bottom-2 lg:bottom-4 rounded-3xl lg:rounded-[2rem] overflow-hidden bg-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 flex flex-col transform-gpu transition-shadow duration-300"
    >
      <div className="flex flex-col w-full h-full items-stretch overflow-hidden">
        <div className="w-full flex flex-col justify-start bg-white flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-6 lg:p-10">

          <div className="flex flex-row items-center gap-4 sm:gap-6 mb-5 lg:mb-8 shrink-0">
            <div className="w-[72px] h-[72px] sm:w-[88px] sm:h-[88px] lg:w-[120px] lg:h-[120px] rounded-2xl lg:rounded-[2rem] overflow-hidden shrink-0 shadow-md border border-gray-100 relative bg-gray-50">
              <motion.img
                src={feature.image}
                className="w-full h-full object-cover"
                initial={{ scale: 1.05 }}
                whileInView={{ scale: 1 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-black/5 to-transparent pointer-events-none" />
            </div>

            <div className="flex flex-col">
              <Badge className={`${badgeColor} w-fit border-0 rounded-md px-2 py-0.5 lg:px-3 lg:py-1 text-[10px] lg:text-[12px] font-bold mb-1 lg:mb-2 uppercase tracking-wide`}>
                Module {index + 1}
              </Badge>
              <h3 className="text-xl sm:text-2xl lg:text-4xl font-extrabold text-gray-900 tracking-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {feature.title}
              </h3>
              <p className={`text-sm sm:text-base lg:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${gradient} mt-1 lg:mt-2`}>
                {feature.subtitle}
              </p>
            </div>
          </div>

          <div className="mb-6 lg:mb-8 shrink-0">
            <p className="text-gray-500 font-medium leading-relaxed text-sm sm:text-[15px] lg:text-lg max-w-2xl">
              {feature.description}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4 lg:gap-x-6 mb-6 lg:mb-10 shrink-0">
            {feature.features.map((item: string, idx: number) => (
              <div key={idx} className="flex items-center gap-3 bg-gray-50/70 rounded-xl p-3 lg:p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-5 h-5 lg:w-6 lg:h-6 bg-white text-blue-600 rounded-full flex items-center justify-center text-[10px] lg:text-xs font-bold shrink-0 shadow-sm">
                  ✓
                </div>
                <span className="text-sm lg:text-base text-gray-800 font-bold">
                  {item}
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-auto pt-6 lg:pt-8 border-t border-gray-100 shrink-0">
            <div className="flex items-center gap-3 lg:gap-4">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-50 rounded-xl items-center justify-center flex shadow-inner shrink-0 text-blue-600">
                <feature.icon className="h-5 w-5 lg:h-6 lg:w-6" />
              </div>
              <div>
                <div className="text-base lg:text-xl font-black text-gray-900 leading-none">
                  Unlimited Access
                </div>
                <div className="text-[10px] lg:text-[11px] font-bold text-gray-500 mt-1 uppercase tracking-widest">
                  Included Forever
                </div>
              </div>
            </div>

            <Link href="/signup">
              <Button
                className="w-full sm:w-auto h-10 lg:h-12 rounded-xl text-sm lg:text-base font-bold group/btn bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 transition-all px-8"
              >
                Launch App
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function Landing() {
  const [, setLocation] = useLocation();
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const { toast } = useToast();
  const [contactForm, setContactForm] = useState({ name: '', phone: '', email: '', business: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const scrollWrapperRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: scrollWrapperRef,
    offset: ["start start", "end end"]
  });

  // Modern Autoplay Carousel Logic
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % featureCards.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const mobileDotIndexes = Array.from({ length: Math.min(5, featureCards.length) }, (_, i) => {
    const start = Math.max(0, Math.min(activeFeature - 2, featureCards.length - 5));
    return start + i;
  });

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
    document.title = "Vyora | India's Best Complete Business Management & Marketing Software";

    // Inject Root SEO Schema
    let schemaScript = document.getElementById("vyora-root-schema");
    if (!schemaScript) {
      schemaScript = document.createElement("script") as HTMLScriptElement;
      schemaScript.id = "vyora-root-schema";
      schemaScript.type = "application/ld+json";
      schemaScript.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Organization",
            "@id": "https://vyora.club/#organization",
            "name": "Vyora",
            "url": "https://vyora.club",
            "logo": "https://vyora.club/logo.png",
            "description": "Vyora is India's best complete business management and marketing platform.",
            "sameAs": []
          },
          {
            "@type": "WebSite",
            "@id": "https://vyora.club/#website",
            "url": "https://vyora.club",
            "name": "Vyora App",
            "publisher": { "@id": "https://vyora.club/#organization" }
          },
          {
            "@type": "SoftwareApplication",
            "@id": "https://vyora.club/#software",
            "name": "Vyora | India's Best Complete Business Management & Marketing Software",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "All",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "INR"
            }
          }
        ]
      });
      document.head.appendChild(schemaScript);
    }

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

    return () => {
      observer.disconnect();
      const existingScript = document.getElementById("vyora-root-schema");
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [setLocation]);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
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
      <PublicHeader />

      <main>
        {/* ===== HERO SECTION ===== */}
        <section className="pt-24 pb-20 md:pt-28 md:pb-32 bg-white relative overflow-hidden">
          {/* Background decorations - More subtle */}
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-50/50 rounded-full blur-[100px] opacity-70 border border-blue-100/20 translate-x-1/3 -translate-y-1/3" pointer-events="none" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-50/50 rounded-full blur-[80px] opacity-50 -translate-x-1/2 translate-y-1/2" pointer-events="none" />

          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative z-10">
            <div className="flex flex-col items-center text-center pt-8 md:pt-12 lg:pt-16 max-w-6xl mx-auto px-4 sm:px-6">
              {/* Badge - Minimalist pill */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-white/50 backdrop-blur-sm text-gray-700 text-sm sm:text-base font-semibold mb-7 lg:mb-9 animate-slide-up shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                </span>
                Trusted by 12,000+ businesses
              </div>

              <h1 className="text-[52px] leading-[0.95] sm:text-[74px] lg:text-[96px] font-black text-[#0b1f44] mb-5 sm:mb-6 tracking-[-0.03em] animate-slide-up max-w-5xl mx-auto w-full" style={{ fontFamily: 'Poppins, sans-serif', animationDelay: '0.1s' }}>
                <span className="sr-only">Vyora Business Management and Marketing Software: </span>
                <span className="block">Stop Using</span>
                <span className="block">Multiple Tools.</span>
                <span className="block mt-1 text-[#0b1f44]">
                  Manage Your <span className="italic text-[#d92d20] font-medium" style={{ fontFamily: 'Georgia, Times New Roman, serif' }}>Entire Business</span>
                </span>
                <span className="block text-[#0b1f44]">
                  on Vyora.
                </span>
              </h1>

              <p className="text-[15px] sm:text-lg lg:text-[21px] text-gray-500 mb-8 sm:mb-11 max-w-3xl mx-auto animate-slide-up leading-relaxed font-medium px-2 sm:px-0">
                From gyms to salons, coaching centers to healthcare. Manage bookings, appointments, orders, payments, and grow your business with Vyora.
              </p>

              {/* CTA Buttons - Premium MNC style */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <Link href="/signup" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 h-12 sm:h-14 text-sm sm:text-base font-bold shadow-lg shadow-blue-500/30 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center group"
                  >
                    Start for Free
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl px-8 h-12 sm:h-14 text-sm sm:text-base font-bold shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex items-center justify-center group"
                  onClick={() => scrollToSection('contact-form')}
                >
                  <FaWhatsapp className="w-5 h-5 mr-2 text-green-500 group-hover:scale-110 transition-transform" />
                  Book Free Demo
                </Button>
              </div>

              {/* YouTube Video Embed */}
              <div className="mt-10 md:mt-14 w-full max-w-3xl lg:max-w-4xl mx-auto animate-slide-up px-2 sm:px-0" style={{ animationDelay: '0.4s' }}>
                <div className="relative w-full overflow-hidden shadow-2xl rounded-xl md:rounded-2xl border border-gray-200/50 bg-gray-100" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    className="absolute top-0 left-0 w-full h-full rounded-xl md:rounded-2xl"
                    src="https://www.youtube.com/embed/mtPqxJBMXCQ?list=PLvr0s6WLGo2bCGXjB5ecHQ-JLPgmxMULe&rel=0&autoplay=1&mute=1"
                    title="Vyora SaaS Demo"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen>
                  </iframe>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== MINIMALIST SLIDER SECTION (MATCHING IMAGE) ===== */}
        <section id="features" className="py-8 sm:py-12 lg:py-16 bg-[#fdfaf5] relative overflow-hidden" data-testid="modules-overview-section">
          {/* Subtle gradient/glow on right side */}
          <div className="absolute top-0 right-0 w-[40%] h-full bg-gradient-to-l from-orange-100/20 to-transparent pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            {/* Section Header */}
            <div className="text-center mb-8 sm:mb-12 lg:mb-14 animate-fade-in">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-3 sm:mb-4 tracking-tight leading-tight">
                Everything Your{' '}
                <span className="text-blue-600">Business Needs</span>
              </h2>
              <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-3xl mx-auto font-bold px-4">
                Complete suite of apps to manage, grow, and scale your business effortlessly
              </p>
            </div>

            <div className="flex flex-col lg:flex-row items-center gap-6 sm:gap-10 lg:gap-16 min-h-0 lg:min-h-[380px]">

              {/* Left: Illustration/Image */}
              <div className="w-full lg:w-[50%] flex justify-center items-center">
                <div className="relative w-full max-w-[500px]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeFeature}
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 30 }}
                      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                      className="w-full h-[220px] sm:h-[300px] lg:h-[350px] flex items-center justify-center"
                    >
                      <img
                        src={featureCards[activeFeature].image}
                        className="w-full h-full object-contain drop-shadow-sm"
                        alt={featureCards[activeFeature].title}
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* Right: Content */}
              <div className="w-full lg:w-[50%] flex flex-col justify-center text-center lg:text-left">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeFeature}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="max-w-lg mx-auto lg:mx-0"
                  >
                    <div className="mb-4 sm:mb-5">
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-gray-400 text-gray-900 text-sm font-bold tracking-wide">
                        {String(activeFeature + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-[900] text-gray-900 leading-[1.1] mb-3 sm:mb-5">
                      {featureCards[activeFeature].title.split(' ').length > 1 ? (
                        <>
                          {featureCards[activeFeature].title.split(' ').slice(0, -1).join(' ')}{' '}
                          <span className="bg-[#ffcc00] px-2 py-0.5 inline-block whitespace-nowrap">
                            {featureCards[activeFeature].title.split(' ').slice(-1)}
                          </span>
                        </>
                      ) : (
                        <span className="bg-[#ffcc00] px-2 py-0.5 inline-block">
                          {featureCards[activeFeature].title}
                        </span>
                      )}
                    </h2>
                    <p className="text-base sm:text-lg lg:text-xl text-gray-700 font-medium leading-relaxed">
                      {featureCards[activeFeature].description}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Controls Bar */}
            <div className="flex items-center justify-between mt-8 sm:mt-12 pt-4 sm:pt-5 lg:pt-6 border-t-0 lg:border-t lg:border-gray-200/40 gap-4">
              {/* Pagination Dots */}
              <div className="flex items-center gap-2.5 lg:hidden">
                {mobileDotIndexes.map((idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveFeature(idx)}
                    className={`transition-all duration-300 rounded-full shrink-0 ${idx === activeFeature
                        ? 'w-7 h-2.5 bg-[#e67e22]'
                        : 'w-2.5 h-2.5 bg-gray-300'
                      }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
              <div className="hidden lg:flex items-center gap-2 sm:gap-2.5 overflow-x-auto max-w-full pb-1 no-scrollbar">
                {featureCards.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveFeature(idx)}
                    className={`transition-all duration-300 rounded-full shrink-0 ${idx === activeFeature
                        ? 'w-7 h-2.5 bg-[#e67e22]'
                        : 'w-2.5 h-2.5 bg-gray-300'
                      }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>

              {/* Navigation Arrows */}
              <div className="flex items-center gap-2.5 sm:gap-3">
                <button
                  onClick={() => setActiveFeature(prev => prev === 0 ? featureCards.length - 1 : prev - 1)}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-gray-400/80 bg-transparent flex items-center justify-center hover:bg-white transition-all text-gray-500 hover:text-gray-900"
                >
                  <ChevronLeft className="w-4.5 h-4.5 sm:w-5 sm:h-5 stroke-[1.8px]" />
                </button>
                <button
                  onClick={() => setActiveFeature(prev => (prev + 1) % featureCards.length)}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-gray-400/80 bg-transparent flex items-center justify-center hover:bg-white transition-all text-gray-500 hover:text-gray-900"
                >
                  <ChevronRight className="w-4.5 h-4.5 sm:w-5 sm:h-5 stroke-[1.8px]" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ===== STATS SECTION - Premium Design ===== */}
        <section className="pt-8 pb-12 md:pt-12 md:pb-16 bg-gradient-to-b from-blue-50/50 to-white relative overflow-hidden">
          {/* Animated background blur */}
          <div className="absolute inset-0 max-w-7xl mx-auto -z-10">
            <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl animate-pulse-glow" />
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
          </div>

          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative z-10">
            <div className="flex flex-col items-center text-center mb-10 md:mb-14 animate-slide-up">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-black tracking-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Loved by{' '}
                <span className="relative inline-block whitespace-nowrap">
                  Businesses
                  <svg className="absolute -bottom-3 md:-bottom-4 left-0 w-full h-4 md:h-5 overflow-visible" viewBox="0 0 100 24" preserveAspectRatio="none">
                    <path d="M 5,12 L 95,6 L 15,20 L 98,22" stroke="#2563EB" strokeWidth="4" vectorEffect="non-scaling-stroke" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                , Trusted by{' '}
                <span className="relative inline-block whitespace-nowrap">
                  Brands
                  <svg className="absolute -bottom-3 md:-bottom-4 left-0 w-full h-4 md:h-5 overflow-visible" viewBox="0 0 100 24" preserveAspectRatio="none">
                    <path d="M 5,12 L 95,6 L 15,20 L 98,22" stroke="#2563EB" strokeWidth="4" vectorEffect="non-scaling-stroke" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </h2>
            </div>

            {/* Stats - Horizontal Card Layout */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 lg:gap-8 max-w-4xl mx-auto">
              {statsData.map((stat, idx) => (
                <div
                  key={idx}
                  className="group flex flex-col md:flex-row items-center md:items-center gap-2 md:gap-5 bg-white rounded-2xl md:rounded-[2rem] p-4 md:p-6 lg:p-8 shadow-[0_4px_20px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100 transition-all duration-300 animate-slide-up hover:-translate-y-1"
                  style={{ animationDelay: `${idx * 0.15}s` }}
                >
                  <div className="w-12 h-12 md:w-20 md:h-20 shrink-0 bg-blue-50 rounded-xl lg:rounded-[1.5rem] flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                    <stat.icon className="w-6 h-6 md:w-10 md:h-10 lg:w-12 lg:h-12 text-blue-600" strokeWidth={2.5} />
                  </div>
                  <div className="text-center md:text-left flex flex-col justify-center">
                    <div className="text-xl sm:text-2xl md:text-3xl lg:text-[2.75rem] font-black text-[#1F2937] tracking-tight leading-none mb-1 animate-number-count" style={{ animationDelay: `${idx * 0.15 + 0.3}s` }}>
                      {stat.value}
                    </div>
                    <div className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-500 font-bold tracking-wide break-words">
                      {stat.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== SECTION DIVIDER ===== */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

        {/* ===== BUSINESS CATEGORIES SECTION - Scrolling Marquee like Attached Image ===== */}
        <section className="py-16 md:py-20 bg-white overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
            <div className="text-center mb-10 md:mb-14">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Built for Every Business Category
              </h2>
              <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
                You focus on your craft and leave the hassle of growth marketing to Vyora
              </p>
            </div>
          </div>

          <style>{`
            .marquee-container {
              overflow: hidden;
              mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
              -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
            }
            .marquee-track {
              display: flex;
              width: max-content;
              animation: marquee-scroll 28s linear infinite;
              gap: 1.5rem;
              padding-right: 1.5rem;
              will-change: transform;
            }
            .marquee-track-reverse {
              display: flex;
              width: max-content;
              animation: marquee-scroll-reverse 32s linear infinite;
              gap: 1.5rem;
              padding-right: 1.5rem;
              will-change: transform;
            }
            .marquee-track:hover, .marquee-track-reverse:hover {
              animation-play-state: paused;
            }
            .category-card {
              background-color: #ffffff;
              border: 1px solid #eef2f6;
              border-radius: 12px;
              width: 320px;
              height: 110px;
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 0;
              position: relative;
              overflow: hidden;
              transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.4s cubic-bezier(0.4, 0, 0.2, 1);
              flex-shrink: 0;
              cursor: pointer;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
            }
            .category-card:hover {
              transform: translateY(-5px);
              box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
              border-color: #e2e8f0;
              background-color: #fafbfc;
            }
            .category-image-wrapper {
              position: absolute;
              right: -5px;
              bottom: 0;
              height: 120%;
              width: 140px;
              display: flex;
              align-items: flex-end;
              justify-content: flex-end;
              pointer-events: none;
              animation: float-img 3s ease-in-out infinite;
              transform-origin: bottom center;
            }
            @keyframes float-img {
              0%, 100% { transform: translateY(0) scale(1); }
              50% { transform: translateY(-4px) scale(1.03); }
            }
            .category-image {
              height: 100%;
              width: 100%;
              object-fit: cover;
              object-position: center;
              mix-blend-mode: multiply;
              border-bottom-right-radius: 12px;
              opacity: 0.95;
              mask-image: linear-gradient(to left, black 50%, transparent 100%);
              -webkit-mask-image: linear-gradient(to left, black 50%, transparent 100%);
              filter: saturate(1.1) contrast(1.05);
            }
            @media (min-width: 768px) {
              .category-card {
                width: 380px;
                height: 120px;
              }
              .category-image-wrapper {
                width: 160px;
              }
            }
          `}</style>

          {/* Marquee Row 1 - Left to Right */}
          <div className="marquee-container mb-6 lg:mb-8 mt-12 md:mt-20">
            <div className="marquee-track" style={{ animationDuration: '38s' }}>
              {[...businessCategories.slice(0, 8), ...businessCategories.slice(0, 8)].map((category, idx) => (
                <Link key={idx} href={`/category/${category.slug}`} className="category-card group cursor-pointer" onClick={(e) => { e.preventDefault(); window.scrollTo(0, 0); setLocation(`/category/${category.slug}`); }}>
                  <div className="px-6 md:px-8 flex-1 z-10 w-2/3">
                    <h4 className="font-bold text-gray-900 text-lg md:text-xl leading-snug group-hover:text-blue-600 transition-colors">
                      {category.name}
                    </h4>
                  </div>
                  <div className="category-image-wrapper">
                    <img src={category.image} alt={category.name} className="category-image" loading="lazy" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Marquee Row 2 - Right to Left */}
          <div className="marquee-container mb-6 lg:mb-8">
            <div className="marquee-track-reverse" style={{ animationDuration: '42s' }}>
              {[...businessCategories.slice(8, 16), ...businessCategories.slice(8, 16)].map((category, idx) => (
                <Link key={idx} href={`/category/${category.slug}`} className="category-card group cursor-pointer" onClick={(e) => { e.preventDefault(); window.scrollTo(0, 0); setLocation(`/category/${category.slug}`); }}>
                  <div className="px-6 md:px-8 flex-1 z-10 w-2/3">
                    <h4 className="font-bold text-gray-900 text-lg md:text-xl leading-snug group-hover:text-blue-600 transition-colors">
                      {category.name}
                    </h4>
                  </div>
                  <div className="category-image-wrapper">
                    <img src={category.image} alt={category.name} className="category-image" loading="lazy" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Marquee Row 3 - Left to Right */}
          <div className="marquee-container mb-6 lg:mb-8">
            <div className="marquee-track" style={{ animationDuration: '36s' }}>
              {[...businessCategories.slice(16, 24), ...businessCategories.slice(16, 24)].map((category, idx) => (
                <Link key={idx} href={`/category/${category.slug}`} className="category-card group cursor-pointer" onClick={(e) => { e.preventDefault(); window.scrollTo(0, 0); setLocation(`/category/${category.slug}`); }}>
                  <div className="px-6 md:px-8 flex-1 z-10 w-2/3">
                    <h4 className="font-bold text-gray-900 text-lg md:text-xl leading-snug group-hover:text-blue-600 transition-colors">
                      {category.name}
                    </h4>
                  </div>
                  <div className="category-image-wrapper">
                    <img src={category.image} alt={category.name} className="category-image" loading="lazy" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Marquee Row 4 - Right to Left */}
          <div className="marquee-container">
            <div className="marquee-track-reverse" style={{ animationDuration: '40s' }}>
              {[...businessCategories.slice(24, 32), ...businessCategories.slice(24, 32)].map((category, idx) => (
                <Link key={idx} href={`/category/${category.slug}`} className="category-card group cursor-pointer" onClick={(e) => { e.preventDefault(); window.scrollTo(0, 0); setLocation(`/category/${category.slug}`); }}>
                  <div className="px-6 md:px-8 flex-1 z-10 w-2/3">
                    <h4 className="font-bold text-gray-900 text-lg md:text-xl leading-snug group-hover:text-blue-600 transition-colors">
                      {category.name}
                    </h4>
                  </div>
                  <div className="category-image-wrapper">
                    <img src={category.image} alt={category.name} className="category-image" loading="lazy" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Combined CTA Button */}
          <div className="text-center mt-12 md:mt-16 animate-slide-up">
            <Link href="/signup">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 md:px-10 h-14 md:h-16 text-base md:text-lg font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-1 transition-all duration-300 group btn-arrow">
                Get Vyora For Any Industry
                <ArrowRight className="w-5 h-5 ml-2 arrow-icon group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </section>

        {/* ===== SECTION DIVIDER ===== */}
        <div className="h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent" />

        {/* ===== HOW IT WORKS SECTION - Clean UI with Bluish Background ===== */}
        <section id="how-it-works" className="py-16 md:py-24 bg-gradient-to-b from-blue-50/80 to-white relative overflow-hidden">
          {/* Decorative Backgrounds - Light Bluish */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl opacity-60 mix-blend-multiply pointer-events-none" />
          <div className="absolute top-1/2 left-0 w-80 h-80 bg-blue-50/60 rounded-full blur-3xl opacity-50 mix-blend-multiply pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-16 md:mb-24 animate-slide-up">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight leading-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
                From Setup to Success in{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                  4 Simple Steps
                </span>
              </h2>
              <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto font-medium leading-relaxed">
                Launch your entire digital business infrastructure in minutes.<br className="hidden md:block" /> No coding, no complicated setup, just immediate results.
              </p>
            </div>

            <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 max-w-6xl mx-auto">
              {/* Snake Connecting Line (Desktop Only - Horizontal) */}
              <div className="hidden lg:block absolute top-[60px] left-[12.5%] right-[12.5%] h-[12px] z-0 opacity-60 pointer-events-none">
                <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M 0 6 C 16.6 -6, 33.3 18, 50 6 C 66.6 -6, 83.3 18, 100 6" stroke="url(#snake-grad-horiz)" strokeWidth="2" strokeDasharray="4 4" strokeLinecap="round" strokeLinejoin="round" />
                  <defs>
                    <linearGradient id="snake-grad-horiz" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.1" />
                      <stop offset="50%" stopColor="#6366F1" stopOpacity="1" />
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.1" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              {/* Snake Connecting Line (Mobile Only - Vertical) */}
              <div className="block sm:hidden absolute top-[10%] bottom-[10%] left-[52px] w-[12px] z-0 opacity-60 pointer-events-none">
                <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 12 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M 6 0 C -6 16.6, 18 33.3, 6 50 C -6 66.6, 18 83.3, 6 100" stroke="url(#snake-grad-vert)" strokeWidth="2" strokeDasharray="4 4" strokeLinecap="round" strokeLinejoin="round" />
                  <defs>
                    <linearGradient id="snake-grad-vert" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.1" />
                      <stop offset="50%" stopColor="#6366F1" stopOpacity="1" />
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.1" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              {[
                {
                  title: "Create Account",
                  desc: "Sign up with your phone number. Instantly secure your business profile.",
                  icon: User,
                  color: "text-blue-600",
                  bgLight: "bg-blue-50",
                  glow: "group-hover:border-blue-200"
                },
                {
                  title: "Setup Business",
                  desc: "Enter your industry details. Our AI builds your mini-website automatically.",
                  icon: Building2,
                  color: "text-purple-600",
                  bgLight: "bg-purple-50",
                  glow: "group-hover:border-purple-200"
                },
                {
                  title: "Add Offerings",
                  desc: "Upload services or products. Generate AI descriptions matching your brand.",
                  icon: Package,
                  color: "text-pink-600",
                  bgLight: "bg-pink-50",
                  glow: "group-hover:border-pink-200"
                },
                {
                  title: "Start Managing",
                  desc: "Access your dashboard to track leads, send invoices, and run marketing centrally.",
                  icon: TrendingUp,
                  color: "text-emerald-600",
                  bgLight: "bg-emerald-50",
                  glow: "group-hover:border-emerald-200"
                }
              ].map((step, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, delay: idx * 0.15 }}
                  className={`relative z-10 bg-white rounded-3xl p-6 lg:p-8 border-2 border-transparent shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_20px_50px_rgb(0,0,0,0.08)] hover:-translate-y-3 transition-all duration-500 group overflow-hidden ${step.glow}`}
                >

                  {/* Giant Faded Number Watermark like attached image */}
                  <div className="absolute right-0 bottom-0 translate-x-4 translate-y-8 text-[180px] leading-none font-black text-[#F9FAFB] group-hover:text-[#EFF6FF] group-hover:scale-110 group-hover:-translate-y-2 transition-all duration-500 z-0 select-none pointer-events-none origin-bottom-right" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {idx + 1}
                  </div>

                  <div className="relative z-10">
                    {/* Step Icon Node */}
                    <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl ${step.bgLight} shadow-sm flex items-center justify-center mb-6 lg:mb-8 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3`}>
                      <step.icon className={`w-7 h-7 md:w-8 md:h-8 ${step.color}`} strokeWidth={2} />
                    </div>

                    <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300">
                      {step.title}
                    </h3>
                    <p className="text-sm md:text-base text-gray-600 leading-relaxed font-medium transition-colors duration-300 group-hover:text-gray-800">
                      {step.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Bottom CTA */}
            <div className="mt-16 md:mt-24 text-center animate-slide-up" style={{ animationDelay: '0.6s' }}>
              <Link href="/signup">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 md:px-10 h-14 md:h-16 text-base md:text-lg font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-1 transition-all duration-300 group btn-arrow">
                  Get 3 Free Apps, Forever
                  <ArrowRight className="w-5 h-5 ml-2 arrow-icon group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </div>
        </section>


        {/* ===== PRICING SECTION ===== */}
        <section id="pricing" className="py-16 md:py-24 bg-white relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
            <div className="text-center mb-16 md:mb-20 max-w-4xl mx-auto">
              <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-blue-100 bg-blue-50/60 text-blue-700 text-xs sm:text-sm font-semibold tracking-wide mb-5">
                Pricing
              </div>
              <h2 className="text-[32px] leading-[1.15] sm:text-5xl lg:text-[58px] font-extrabold text-[#111827] mb-5 tracking-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Simple, transparent <span className="text-blue-600">pricing</span>
              </h2>
              <p className="text-base sm:text-lg lg:text-[22px] text-gray-600 leading-relaxed max-w-3xl mx-auto">
                Everything you need to grow your business. Honest, straightforward pricing. No hidden charges.
              </p>
            </div>

            <div className="flex justify-center mb-20">
              {pricingPlans.map((plan, idx) => {
                const isPremium = true;
                return (
                  <div
                    key={idx}
                    className={`relative rounded-2xl bg-white p-8 md:p-10 transition-all duration-300 ease-in-out cursor-default overflow-hidden
                      ${isPremium
                        ? 'border-2 border-blue-600 shadow-[0_10px_15px_-3px_rgba(37,99,235,0.1)] transform hover:-translate-y-2'
                        : 'border border-[#eef2f6] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1)] hover:-translate-y-2'}`}
                  >
                    {isPremium && (
                      <div className="absolute top-0 right-0">
                        <div className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-bl-2xl uppercase tracking-wider">
                          {plan.badge}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-4 mb-6">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${isPremium ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-600'}`}>
                        <plan.icon className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                        <p className="text-sm text-gray-500">{plan.description}</p>
                      </div>
                    </div>

                    <div className="mb-8 pb-8 border-b border-gray-100">
                      <div className="flex items-baseline gap-1 py-3">
                        <span className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">{plan.price}</span>
                        <span className="text-base text-gray-500 font-medium">{plan.period}</span>
                      </div>
                    </div>

                    <ul className="space-y-4 mb-10 h-64 overflow-y-auto pr-4 custom-scrollbar">
                      {allFeatures.map((feature, featureIdx) => (
                        <li key={featureIdx} className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                          </div>
                          <span className="text-[15px] leading-snug text-gray-700 font-medium">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <Link href="/signup" className="block">
                      <Button
                        className={`w-full h-14 rounded-xl text-[15px] font-bold transition-all
                          ${isPremium
                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
                            : 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-200'}`}
                      >
                        {isPremium ? 'Get Lifetime Access' : 'Start Monthly Plan'}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                );
              })}
            </div>

            {/* Clean Competitor Comparison Table */}
            <div className="mt-20">
              <div className="text-center mb-10">
                <h3 className="text-2xl md:text-3xl font-bold text-[#1a202c] mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Compare with alternatives
                </h3>
              </div>

              <div className="max-w-5xl mx-auto overflow-x-auto pb-4">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr>
                      <th className="px-6 py-4 text-sm font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 w-[30%]">Features</th>
                      <th className="px-4 py-4 text-center border-b-2 border-blue-600 w-[20%]">
                        <span className="block text-blue-600 font-bold">Vyora Lifetime</span>
                        <span className="text-blue-500 text-sm font-normal">₹1999/life</span>
                      </th>
                      <th className="px-4 py-4 text-center border-b border-gray-100">
                        <span className="block text-gray-900 font-bold">Zoho</span>
                        <span className="text-gray-400 text-sm font-normal">Basic</span>
                      </th>
                      <th className="px-4 py-4 text-center border-b border-gray-100">
                        <span className="block text-gray-900 font-bold">Freshworks</span>
                        <span className="text-gray-400 text-sm font-normal">Suite</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {competitorComparison.map((row, idx) => {
                      const isLast = idx === competitorComparison.length - 1;
                      // Use type assertion anywhere we look up keys dynamically or cast via typing
                      const r = row as any;
                      return (
                        <tr key={idx} className={`hover:bg-gray-50 transition-colors ${isLast ? 'bg-gray-50' : ''}`}>
                          <td className={`px-6 py-4 text-sm ${isLast ? 'font-bold text-gray-900' : 'font-medium text-gray-700'} border-b border-gray-100`}>
                            {r.feature}
                          </td>

                          <td className={`px-4 py-4 text-center border-b border-gray-100 bg-blue-50/10`}>
                            {typeof r.vyoraLifetime === 'boolean' ? (
                              r.vyoraLifetime ? <CheckCircle2 className="w-5 h-5 text-blue-600 mx-auto" strokeWidth={2.5} /> : <span className="text-gray-300">—</span>
                            ) : (
                              <span className={`font-bold ${isLast ? 'text-blue-600 text-lg' : 'text-gray-900'}`}>{r.vyoraLifetime}</span>
                            )}
                          </td>
                          <td className={`px-4 py-4 text-center text-sm text-gray-500 border-b border-gray-100`}>
                            {r.zoho === 'Not Available' ? <span className="text-gray-300">—</span> : r.zoho}
                          </td>
                          <td className={`px-4 py-4 text-center text-sm text-gray-500 border-b border-gray-100`}>
                            {r.freshworks === 'Not Available' ? <span className="text-gray-300">—</span> : r.freshworks}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <style>{`
            .box-shadow-pro {
              box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.1), 0 4px 6px -2px rgba(37, 99, 235, 0.05);
            }
            .box-shadow-pro:hover {
              box-shadow: 0 20px 25px -5px rgba(37, 99, 235, 0.15), 0 10px 10px -5px rgba(37, 99, 235, 0.04);
            }
            .custom-scrollbar::-webkit-scrollbar {
              width: 4px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: transparent;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background-color: #e2e8f0;
              border-radius: 4px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background-color: #cbd5e1;
            }
          `}</style>
        </section>

        {/* ===== SECTION DIVIDER ===== */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

        {/* ===== BECOME A PARTNER SECTION - Clean White Background ===== */}
        <section className="py-16 md:py-24 bg-white relative overflow-hidden">
          {/* Background elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50/40 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-50/30 rounded-full blur-3xl" />

          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative">
            <div className="grid lg:grid-cols-2 gap-10 md:gap-16 items-center">
              {/* Left Content */}
              <div className="text-center lg:text-left">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Become a{' '}
                  <span className="relative inline-block whitespace-nowrap">
                    <span className="text-blue-600 relative z-10">Vyora Partner</span>
                    <svg className="absolute -bottom-3 md:-bottom-4 left-0 w-full h-4 md:h-5 overflow-visible" viewBox="0 0 100 24" preserveAspectRatio="none">
                      <path d="M 5,12 L 95,6 L 15,20 L 98,22" stroke="#fbbf24" strokeWidth="4" vectorEffect="non-scaling-stroke" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </h2>
                <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed">
                  Join our growing network of partners and earn while helping businesses grow. Our partner program offers industry-leading commissions and bonuses.
                </p>

                <div className="space-y-4 mb-8">
                  {[
                    "Up to 50% recurring commission on all referrals",
                    "Lucrative performance bonuses",
                    "Dedicated partner dashboard & real-time analytics",
                    "Marketing materials & sales support kit",
                    "Priority access to new features & updates",
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center lg:items-center justify-center lg:justify-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-gray-700 text-base md:text-lg font-medium">{item}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-center lg:justify-start">
                  <a href="https://wa.me/918887178734" target="_blank" rel="noopener noreferrer">
                    <Button size="lg" className="btn-arrow bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/30 rounded-xl px-8 h-14 font-semibold hover-lift">
                      <Handshake className="w-5 h-5 mr-2" />
                      Join Partner Program
                      <ArrowRight className="w-4 h-4 ml-2 arrow-icon" />
                    </Button>
                  </a>
                </div>
              </div>

              {/* Right - Earnings Card */}
              <div className="relative">
                <Card className="bg-white border-gray-200 shadow-2xl p-6 md:p-8 hover-lift">
                  <div className="text-center mb-8">
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center mb-4 animate-float shadow-xl">
                      <Gift className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">Partner Earnings</h3>
                    <p className="text-gray-500 text-sm">What you can earn monthly</p>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-blue-50/50 rounded-xl p-5 border border-blue-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-700 font-medium">Commission Rate</span>
                        <span className="text-3xl font-bold text-blue-600">Up to 50%</span>
                      </div>
                      <p className="text-sm text-gray-500">Recurring on every referral</p>
                    </div>

                    <div className="bg-blue-50/50 rounded-xl p-5 border border-blue-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-700 font-medium">Monthly Bonus</span>
                        <span className="text-3xl font-bold text-blue-600 flex items-center">
                          <IndianRupee className="w-6 h-6" />18,000
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">Additional performance bonus</p>
                    </div>

                    <div className="bg-blue-50/50 rounded-xl p-5 border border-blue-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-700 font-medium">Top Earnings</span>
                        <span className="text-3xl font-bold text-blue-600 flex items-center">
                          <IndianRupee className="w-6 h-6" />1.2L+
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">What top partners earn monthly</p>
                    </div>
                  </div>
                </Card>


              </div>
            </div>
          </div>
        </section>





        {/* ===== SECTION DIVIDER ===== */}
        <div className="h-px bg-gradient-to-r from-transparent via-purple-200 to-transparent" />

        {/* ===== USERS SOCIAL PROOF SECTION ===== */}
        <section className="py-14 md:py-20 bg-[#f6f6f7] overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
            <div className="relative rounded-[2rem] md:rounded-[2.5rem] bg-[#f3f3f5] border border-[#ececf0] min-h-[340px] md:min-h-[500px] px-3 sm:px-6 md:px-10 py-10 md:py-14 overflow-hidden">
              <div className="hidden md:block absolute top-4 left-6 w-20 h-20 border-l-4 border-b-4 border-[#c8cbd3] rounded-bl-[64px] opacity-70" />
              <div className="hidden md:block absolute bottom-4 right-6 w-20 h-20 border-r-4 border-t-4 border-[#c8cbd3] rounded-tr-[64px] opacity-70" />

              <div className="absolute inset-x-0 top-7 sm:top-8 md:top-10 flex justify-center gap-2 sm:gap-3 md:gap-4">
                {["https://i.pravatar.cc/120?img=61", "https://i.pravatar.cc/120?img=56", "https://i.pravatar.cc/120?img=49", "https://i.pravatar.cc/120?img=35", "https://i.pravatar.cc/120?img=24", "https://i.pravatar.cc/120?img=22"].map((src, idx) => (
                  <div key={`top-r-${idx}`} className={`${idx > 3 ? 'hidden md:block' : 'block'} w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-2xl bg-[#d9dbe1] overflow-hidden`}>
                    <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </div>
                ))}
              </div>

              <div className="absolute inset-y-0 left-2 sm:left-4 md:left-8 flex flex-col justify-center gap-2 sm:gap-3 md:gap-4">
                {["https://i.pravatar.cc/120?img=32", "https://i.pravatar.cc/120?img=13", "https://i.pravatar.cc/120?img=50", "https://i.pravatar.cc/120?img=68"].map((src, idx) => (
                  <div key={`left-r-${idx}`} className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-2xl bg-[#d9dbe1] overflow-hidden">
                    <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </div>
                ))}
              </div>

              <div className="absolute inset-y-0 right-2 sm:right-4 md:right-8 flex flex-col justify-center gap-2 sm:gap-3 md:gap-4">
                {["https://i.pravatar.cc/120?img=15", "https://i.pravatar.cc/120?img=5", "https://i.pravatar.cc/120?img=44", "https://i.pravatar.cc/120?img=63"].map((src, idx) => (
                  <div key={`right-r-${idx}`} className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-2xl bg-[#d9dbe1] overflow-hidden">
                    <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </div>
                ))}
              </div>

              <div className="absolute inset-x-0 bottom-7 sm:bottom-8 md:bottom-10 flex justify-center gap-2 sm:gap-3 md:gap-4">
                {["https://i.pravatar.cc/120?img=17", "https://i.pravatar.cc/120?img=8", "https://i.pravatar.cc/120?img=47", "https://i.pravatar.cc/120?img=12", "https://i.pravatar.cc/120?img=40", "https://i.pravatar.cc/120?img=26"].map((src, idx) => (
                  <div key={`bottom-r-${idx}`} className={`${idx > 3 ? 'hidden md:block' : 'block'} w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-2xl bg-[#d9dbe1] overflow-hidden`}>
                    <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </div>
                ))}
              </div>

              <div className="relative z-10 flex items-center justify-center min-h-[280px] md:min-h-[380px] px-4">
                <div className="bg-white rounded-[44px] md:rounded-[64px] px-6 sm:px-10 md:px-16 py-8 md:py-10 shadow-[0_10px_40px_rgba(0,0,0,0.06)] text-center max-w-4xl">
                  <h3 className="text-[30px] sm:text-[42px] md:text-[64px] leading-[1.05] font-black text-[#101828] tracking-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Join 12 Thousand Businesses
                  </h3>
                  <p className="mt-2 md:mt-3 text-lg sm:text-2xl md:text-[36px] font-semibold text-[#2d2f36]">
                    who grow their business with Vyora
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== TESTIMONIALS SECTION - Infinite Scroll ===== */}
        <section id="testimonials" className="py-16 md:py-20 bg-gray-50 overflow-hidden">
          <style>{`
          @keyframes infiniteScroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .testimonial-track {
            display: flex;
            width: max-content;
            animation: infiniteScroll 30s linear infinite;
          }
          .testimonial-track:hover,
          .testimonial-track:active {
            animation-play-state: paused;
          }
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
          </div>

          <div className="relative w-full max-w-[100vw]">
            {/* Left and right fade gradients for smooth entering/exiting effect */}
            <div className="absolute left-0 top-0 bottom-0 w-12 md:w-32 bg-gradient-to-r from-gray-50 to-transparent z-10 pointer-events-none"></div>
            <div className="absolute right-0 top-0 bottom-0 w-12 md:w-32 bg-gradient-to-l from-gray-50 to-transparent z-10 pointer-events-none"></div>

            <div className="testimonial-track py-4 cursor-grab active:cursor-grabbing">
              {/* Group 1 */}
              <div className="flex gap-5 md:gap-6 pr-5 md:pr-6">
                {testimonials.map((testimonial, idx) => (
                  <Card key={idx} className="w-[300px] md:w-[400px] flex-shrink-0 flex flex-col p-5 md:p-6 border-0 shadow-lg hover:shadow-xl bg-white transition-shadow">
                    <div className="flex items-center gap-1 mb-4">
                      {Array.from({ length: testimonial.rating }).map((_, i) => (
                        <Star key={`g1-${idx}-${i}`} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>

                    <div className="relative mb-5 flex-grow">
                      <Quote className="absolute -top-2 -left-2 w-8 h-8 text-blue-100" />
                      <p className="text-gray-600 leading-relaxed pl-6 text-sm md:text-base">
                        {testimonial.content}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
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
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs shadow-sm">
                        {testimonial.metric}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
              {/* Group 2 */}
              <div className="flex gap-5 md:gap-6 pr-5 md:pr-6">
                {testimonials.map((testimonial, idx) => (
                  <Card key={idx} className="w-[300px] md:w-[400px] flex-shrink-0 flex flex-col p-5 md:p-6 border-0 shadow-lg hover:shadow-xl bg-white transition-shadow">
                    <div className="flex items-center gap-1 mb-4">
                      {Array.from({ length: testimonial.rating }).map((_, i) => (
                        <Star key={`g2-${idx}-${i}`} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>

                    <div className="relative mb-5 flex-grow">
                      <Quote className="absolute -top-2 -left-2 w-8 h-8 text-blue-100" />
                      <p className="text-gray-600 leading-relaxed pl-6 text-sm md:text-base">
                        {testimonial.content}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
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
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs shadow-sm">
                        {testimonial.metric}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
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

        {/* ===== CONTACT US LEAD GENERATION FORM - Clean White Background ===== */}
        <section id="contact-form" className="py-16 md:py-20 bg-white">
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
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
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
              <Card className="p-6 md:p-8 bg-white border border-gray-200 shadow-xl">
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

      </main>

      {/* ===== SEO FOOTER LINKS ===== */}
      <SeoFooterLinks pageType="landing" />

      {/* ===== FOOTER - Blue Solid Background ===== */}
      <PublicFooter />
    </div >
  );
}
