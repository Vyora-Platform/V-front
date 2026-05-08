import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import {
    ChevronDown,
    Menu,
    X,
    ExternalLink,
    User,
    ArrowRight,
    Globe,
    Users,
    Sparkles,
    FileText,
    Package,
    Image,
    Calendar,
    Send,
    CreditCard,
    Headphones,
    Dumbbell,
    Scissors,
    Stethoscope,
    GraduationCap,
    ShoppingBag,
    Utensils,
    Car,
    Home,
    Briefcase,
    Camera,
    Music,
    Palette,
    Heart,
    Coffee,
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
    Library,
    Shield,
    Hammer,
    Megaphone,
    Monitor,
    Shirt,
    Tractor,
    Sofa
} from "lucide-react";

const featureCards = [
    { icon: Globe, title: "Free Business Website" },
    { icon: Users, title: "Unlimited Lead & Management" },
    { icon: Sparkles, title: "Automagic Catalogue Creation" },
    { icon: FileText, title: "Hisab-Kitab Management" },
    { icon: Package, title: "Smart Stock Management" },
    { icon: Users, title: "Customer Management" },
    { icon: Image, title: "Free Marketing & Sales Banner" },
    { icon: Users, title: "Employee Management" },
    { icon: Calendar, title: "Daily Greeting Poster" },
    { icon: Send, title: "Bulk Marketing Software" },
    { icon: CreditCard, title: "Payment Gateway" },
    { icon: Headphones, title: "24/7* Customer Support" },
];

const businessCategories = [
    { slug: "fitness-wellness", icon: Dumbbell, name: "Gym & Fitness Centres" },
    { slug: "salons-spas", icon: Scissors, name: "Salon Owners" },
    { slug: "healthcare", icon: Stethoscope, name: "Doctors & Health Clinics" },
    { slug: "education", icon: GraduationCap, name: "Education & Coaching" },
    { slug: "retail", icon: ShoppingBag, name: "Retail Stores" },
    { slug: "restaurants", icon: Utensils, name: "Restaurants & Bars" },
    { slug: "automotive", icon: Car, name: "Car Garages & Mechanics" },
    { slug: "real-estate", icon: Home, name: "Real Estate Agents" },
    { slug: "professional-services", icon: Briefcase, name: "Consulting Firms" },
    { slug: "photography-videography", icon: Camera, name: "Photography Studios" },
    { slug: "events-entertainment", icon: Music, name: "Events & Entertainment" },
    { slug: "professional-services", icon: Palette, name: "Art & Design" },
    { slug: "fitness-wellness", icon: Heart, name: "Yoga & Wellness" },
    { slug: "restaurants", icon: Coffee, name: "Cafes & Bakeries" },
    { slug: "fitness-wellness", icon: Bike, name: "Sports & Recreation" },
    { slug: "travel-tourism", icon: Plane, name: "Tours & Travels" },
    { slug: "education", icon: Baby, name: "Childcare & Preschool" },
    { slug: "home-services", icon: Dog, name: "Pet Services" },
    { slug: "retail", icon: Flower2, name: "Florists & Gifts" },
    { slug: "it-software-agencies", icon: Laptop, name: "IT Services" },
    { slug: "home-services", icon: Wrench, name: "Home Services" },
    { slug: "restaurants", icon: UtensilsCrossed, name: "Catering" },
    { slug: "restaurants", icon: Cake, name: "Bakers & Cake Shops" },
    { slug: "retail", icon: Gem, name: "Jewelry Stores" },
    { slug: "retail", icon: Library, name: "Libraries & Books" },
    { slug: "cleaning-services", icon: Shield, name: "Pest Control Businesses" },
    { slug: "home-services", icon: Hammer, name: "Construction" },
    { slug: "professional-services", icon: Megaphone, name: "Marketing Agencies" },
    { slug: "electronics", icon: Monitor, name: "Electronics" },
    { slug: "fashion", icon: Shirt, name: "Fashion" },
    { slug: "logistics-transport", icon: Tractor, name: "Agriculture" },
    { slug: "retail", icon: Sofa, name: "Furniture" },
];

export function PublicHeader() {
    const [location, setLocation] = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleNavClick = (sectionId: string) => {
        setMobileMenuOpen(false);
        if (location !== "/") {
            setLocation(`/#${sectionId}`);
        } else {
            document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
        }
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
                <div className="flex h-16 md:h-22 items-center justify-between py-2 md:py-3">
                    {/* Logo */}
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => setLocation("/")}>
                        <img
                            src="/logo.png"
                            alt="Vyora Logo"
                            className="h-16 md:h-18 w-auto object-contain"
                        />
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex items-center gap-8">
                        <div className="relative group p-4 -m-4">
                            <button className="text-base font-semibold text-gray-700 hover:text-blue-600 transition-colors flex items-center gap-1">
                                Industries <ChevronDown className="w-4 h-4" />
                            </button>
                            <div className="absolute top-full left-0 w-72 bg-white rounded-xl shadow-xl py-2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-gray-100 max-h-[70vh] overflow-y-auto">
                                <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider bg-white sticky top-0 z-10 border-b border-gray-50 mb-1">Built for Every Business</div>
                                <div className="grid grid-cols-1 gap-1">
                                    {businessCategories.map((category, idx) => (
                                        <Link key={idx} href={`/category/${category.slug}`}>
                                            <a onClick={(e) => { e.preventDefault(); window.scrollTo(0, 0); setLocation(`/category/${category.slug}`); }} className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 font-medium transition-colors cursor-pointer">
                                                <category.icon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                                <span className="truncate">{category.name}</span>
                                            </a>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="relative group p-4 -m-4">
                            <button className="text-base font-semibold text-gray-700 hover:text-blue-600 transition-colors flex items-center gap-1">
                                Solutions <ChevronDown className="w-4 h-4" />
                            </button>
                            <div className="absolute top-full left-0 w-72 bg-white rounded-xl shadow-xl py-2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-gray-100 max-h-[70vh] overflow-y-auto">
                                <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider bg-white sticky top-0 z-10 border-b border-gray-50 mb-1">Features & Apps</div>
                                {featureCards.map((feature, idx) => (
                                    <Link key={idx} href={`/app/${feature.title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')}`}>
                                        <a className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 font-medium transition-colors cursor-pointer">
                                            <feature.icon className="w-4 h-4 text-blue-500" />
                                            {feature.title}
                                        </a>
                                    </Link>
                                ))}

                            </div>
                        </div>

                        <button onClick={() => handleNavClick('pricing')} className="text-base font-semibold text-gray-700 hover:text-blue-600 transition-colors">Pricing</button>

                        <div className="relative group p-4 -m-4">
                            <button className="text-base font-semibold text-gray-700 hover:text-blue-600 transition-colors flex items-center gap-1">
                                Resources <ChevronDown className="w-4 h-4" />
                            </button>
                            <div className="absolute top-full left-0 w-48 bg-white rounded-xl shadow-xl py-2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-gray-100">
                                <button onClick={() => handleNavClick('faq')} className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600">FAQs</button>
                                <button onClick={() => handleNavClick('testimonials')} className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600">Testimonials</button>
                            </div>
                        </div>

                        <a href="https://wa.me/918887178734" target="_blank" rel="noopener noreferrer" className="text-base font-semibold text-gray-700 hover:text-blue-600 transition-colors flex items-center gap-1">
                            Become Our Partner
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
                    <div className="lg:hidden pb-20 border-t border-gray-100 animate-fade-in bg-white overflow-y-auto overscroll-none" style={{ maxHeight: 'calc(100vh - 85px)' }}>
                        <nav className="flex flex-col gap-1">
                            <div className="px-4 py-2">
                                <div className="text-sm font-bold text-gray-400 uppercase mb-2">Industries</div>
                                <div className="pl-2 border-l-2 border-gray-100 mb-2 space-y-1 max-h-48 overflow-y-auto">
                                    {businessCategories.map((category, idx) => (
                                        <Link key={idx} href={`/category/${category.slug}`}>
                                            <a onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); window.scrollTo(0, 0); setLocation(`/category/${category.slug}`); }} className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-gray-600 font-medium hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors cursor-pointer">
                                                <category.icon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                                <span className="truncate">{category.name}</span>
                                            </a>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                            <div className="px-4 py-2">
                                <div className="text-sm font-bold text-gray-400 uppercase mb-2">Solutions</div>
                                <div className="pl-2 border-l-2 border-gray-100 mb-2 space-y-1 max-h-48 overflow-y-auto">
                                    {featureCards.map((feature, idx) => (
                                        <Link key={idx} href={`/app/${feature.title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')}`}>
                                            <a onClick={() => setMobileMenuOpen(false)} className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-gray-600 font-medium hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors cursor-pointer">
                                                <feature.icon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                                {feature.title}
                                            </a>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                            <button onClick={() => handleNavClick('pricing')} className="px-4 py-3 text-left text-gray-700 font-semibold hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors">Pricing</button>
                            <div className="px-4 py-2">
                                <div className="text-sm font-bold text-gray-400 uppercase mb-1">Resources</div>
                                <button onClick={() => handleNavClick('faq')} className="w-full px-4 py-2 text-left text-gray-700 font-semibold hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors">FAQs</button>
                                <button onClick={() => handleNavClick('testimonials')} className="w-full px-4 py-2 text-left text-gray-700 font-semibold hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors">Testimonials</button>
                            </div>
                            <Link href="/partner">
                                <a className="px-4 py-3 text-left text-gray-700 font-semibold hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors flex items-center gap-2 block">
                                    Become Our Partner
                                </a>
                            </Link>
                            <Link href="/login">
                                <a className="mx-4 mt-2 mb-2 block px-4 py-3 text-center text-gray-700 font-semibold hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors border-2 border-gray-800">Login</a>
                            </Link>

                            <Link href="/signup">
                                <a className="mx-4 mt-1 block px-4 py-4 text-center text-white font-bold bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-2">
                                    Get Started Free
                                    <ArrowRight className="w-5 h-5" />
                                </a>
                            </Link>
                        </nav>
                    </div>
                )}
            </div>
        </header>
    );
}
