import { Button } from "@/components/ui/button";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { SeoFooterLinks } from "@/components/seo-footer-links";
import { Link } from "wouter";
import { useEffect, useState } from "react";
import {
    Users,
    Wallet,
    Globe,
    BarChart3,
    CheckCircle2,
    ArrowRight,
    TrendingUp,
    Shield,
    Briefcase,
    Star,
    Quote,
    ChevronDown,
    Gift,
    IndianRupee,
    Award,
    Phone,
    Mail
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { FaWhatsapp } from "react-icons/fa";

// Yellow underline SVG matching landing page
const YellowUnderline = () => (
    <svg className="absolute -bottom-2 sm:-bottom-3 md:-bottom-4 lg:-bottom-5 left-0 w-full h-4 sm:h-5 md:h-6 lg:h-7 overflow-visible -z-0" viewBox="0 0 100 24" preserveAspectRatio="none">
        <path d="M 2,12 L 98,6 L 12,20 L 96,22" stroke="#E0E662" strokeWidth="4" vectorEffect="non-scaling-stroke" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const partnerBenefits = [
    {
        icon: Wallet,
        title: "Industry-Leading Commissions",
        description: "Earn up to 30% recurring commission on every subscription you bring to Vyora.",
        color: "text-emerald-600",
        bgColor: "bg-emerald-100"
    },
    {
        icon: TrendingUp,
        title: "Recurring Revenue",
        description: "Your earnings don't stop. Get paid every month as long as the customer stays with Vyora.",
        color: "text-blue-600",
        bgColor: "bg-blue-100"
    },
    {
        icon: BarChart3,
        title: "Real-Time Tracking",
        description: "Access a dedicated dashboard to track your referrals, conversions, and payouts in real time.",
        color: "text-purple-600",
        bgColor: "bg-purple-100"
    },
    {
        icon: Briefcase,
        title: "Marketing Support",
        description: "Get access to premium promotional materials, banners, and co-branded collateral.",
        color: "text-orange-600",
        bgColor: "bg-orange-100"
    },
    {
        icon: Shield,
        title: "Dedicated Channel Manager",
        description: "Receive 1-on-1 support from our partner success team to help you close more deals.",
        color: "text-teal-600",
        bgColor: "bg-teal-100"
    },
    {
        icon: Users,
        title: "Exclusive Partner Community",
        description: "Join an elite network of resellers, agencies, and consultants. Share strategies and grow together.",
        color: "text-indigo-600",
        bgColor: "bg-indigo-100"
    }
];

const tiers = [
    {
        level: "Silver Partner",
        sales: "1 - 10 Sales",
        commission: "20%",
        benefits: [
            "Access to Partner Dashboard",
            "Standard Marketing Kit",
            "Email Support"
        ],
        icon: Star,
        color: "text-gray-400"
    },
    {
        level: "Gold Partner",
        sales: "11 - 50 Sales",
        commission: "25%",
        benefits: [
            "All Silver Benefits",
            "Co-branded Materials",
            "Priority Chat Support",
            "Featured Partner listing"
        ],
        icon: Award,
        color: "text-yellow-500",
        popular: true
    },
    {
        level: "Platinum Partner",
        sales: "50+ Sales",
        commission: "30%",
        benefits: [
            "All Gold Benefits",
            "Dedicated Channel Manager",
            "Revenue Share on Add-ons",
            "Invitation to Annual Summit"
        ],
        icon: Gift,
        color: "text-blue-600"
    }
];

const faqs = [
    { question: "How much does it cost to join?", answer: "Joining the Vyora Partner Program is completely free. There are no hidden fees or minimum commitments required to start." },
    { question: "When and how do I get paid?", answer: "Commissions are calculated automatically and paid out within the first week of every month. You can receive your payments directly to your bank account via NEFT/UPI." },
    { question: "Do I need technical knowledge to sell Vyora?", answer: "Not at all! We provide comprehensive training and ready-to-use marketing materials. You just need to connect businesses with our solution." },
    { question: "Is the commission recurring?", answer: "Yes! You earn a commission not just on the first sale, but for every month/year the customer renews their subscription with Vyora." }
];

export default function PartnerPage() {
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [contactForm, setContactForm] = useState({
        name: "",
        phone: "",
        email: "",
        business: ""
    });

    const handleContactSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        alert("Thank you! Our team will reach out to you within 24 hours.");
        setContactForm({ name: "", phone: "", email: "", business: "" });
        setIsSubmitting(false);
    };

    useEffect(() => {
        document.title = "Become a Vyora Partner - Earn Recurring Commissions";

        const setMeta = (name: string, content: string, attr: string = "name") => {
            let el = document.querySelector(`meta[${attr}="${name}"]`);
            if (!el) { el = document.createElement("meta"); el.setAttribute(attr, name); document.head.appendChild(el); }
            el.setAttribute("content", content);
        };

        setMeta("description", "Join the Vyora Partner Program. Earn up to 30% recurring commissions by bringing businesses to our platform. High conversions, zero investment.");
        setMeta("keywords", "vyora partner program, software reseller india, best saas affiliate programs, software referral, earn recurring commissions, b2b software partner");
        setMeta("robots", "index, follow");
        setMeta("og:title", "Vyora Partner Program - Recurring Revenue", "property");
        setMeta("og:description", "Earn up to 30% revenue share with the fastest growing SaaS platform in India.", "property");
        setMeta("og:url", "https://vyora.club/partner", "property");
        setMeta("og:type", "website", "property");

        let canonicalLink = document.querySelector('link[rel="canonical"]');
        if (!canonicalLink) { canonicalLink = document.createElement("link"); canonicalLink.setAttribute("rel", "canonical"); document.head.appendChild(canonicalLink); }
        canonicalLink.setAttribute("href", "https://vyora.club/partner");

        window.scrollTo(0, 0);
    }, []);

    const faqSchema = {
        "@context": "https://schema.org", "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
            "@type": "Question", name: faq.question,
            acceptedAnswer: { "@type": "Answer", text: faq.answer }
        }))
    };

    const breadcrumbsSchema = {
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://vyora.club" },
            { "@type": "ListItem", position: 2, name: "Partner Program", item: "https://vyora.club/partner" }
        ]
    };

    return (
        <div className="min-h-screen flex flex-col bg-white font-sans selection:bg-blue-100 selection:text-blue-900">
            <style>{`
                @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
                @keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); } 50% { box-shadow: 0 0 40px rgba(59, 130, 246, 0.5); } }
                @keyframes slide-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes scale-in { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
                .animate-float { animation: float 3s ease-in-out infinite; }
                .animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
                .animate-slide-up { animation: slide-up 0.6s ease-out forwards; }
                .animate-scale-in { animation: scale-in 0.5s ease-out forwards; }
                .hover-lift { transition: transform 0.3s ease, box-shadow 0.3s ease; }
                .hover-lift:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
            `}</style>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsSchema) }} />
            <PublicHeader />
            <main className="flex-1">
                {/* HERO SECTION */}
                <section className="pt-32 pb-20 md:pt-40 md:pb-32 bg-white relative overflow-hidden">
                    {/* Background decorations matching landing */}
                    <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-50/50 rounded-full blur-[100px] opacity-70 border border-blue-100/20 translate-x-1/3 -translate-y-1/3" style={{ pointerEvents: 'none' }} />
                    <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-50/50 rounded-full blur-[80px] opacity-50 -translate-x-1/2 translate-y-1/2" style={{ pointerEvents: 'none' }} />

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                        <div className="flex flex-col items-center text-center max-w-5xl mx-auto">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 bg-white/50 backdrop-blur-sm text-gray-700 text-sm font-medium mb-8 animate-slide-up shadow-sm">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                                </span>
                                Vyora Affiliate & Reseller Program
                            </div>

                            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 mb-6 leading-tight tracking-tight animate-slide-up" style={{ fontFamily: 'Poppins, sans-serif', animationDelay: '0.1s' }}>
                                <span className="relative inline-block mt-2 md:mt-0 whitespace-nowrap">
                                    <span className="relative text-gray-900 px-1 z-10">Partner with Vyora.</span>
                                    <YellowUnderline />
                                </span>
                                <br className="hidden md:block" />
                                <span className="relative inline-block mt-2 md:mt-0 whitespace-nowrap">
                                    <span className="text-transparent bg-clip-text bg-gradient-to-br from-blue-700 to-indigo-600 relative z-10">
                                        Grow Your Revenue.
                                    </span>
                                </span>
                            </h1>

                            <p className="text-lg md:text-xl lg:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto animate-slide-up leading-relaxed font-medium" style={{ animationDelay: '0.2s' }}>
                                Join our elite partner network. Help businesses digitize their operations while earning industry-leading recurring commissions up to 30%.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.3s' }}>
                                <Link href="/signup">
                                    <Button size="lg" className="group w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 rounded-md px-8 h-14 text-base md:px-10 md:h-16 md:text-lg font-semibold transition-all duration-300">
                                        Apply Now
                                        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </Link>
                                <Link href="#contact">
                                    <Button size="lg" variant="outline" className="w-full sm:w-auto text-blue-600 border-blue-600 bg-blue-50/50 hover:bg-blue-100 rounded-md px-8 h-14 text-base md:px-10 md:h-16 md:text-lg font-semibold transition-all duration-300 group shadow-sm">
                                        <FaWhatsapp className="w-6 h-6 mr-1 text-blue-600 md:w-7 md:h-7" /> Contact Partner Team
                                    </Button>
                                </Link>
                            </div>

                            <div className="mt-12 flex justify-center gap-8 md:gap-16 opacity-80 flex-wrap animate-slide-up" style={{ animationDelay: '0.4s' }}>
                                <div className="flex flex-col items-center">
                                    <h3 className="text-3xl font-bold text-gray-900">30%</h3>
                                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mt-1">Up To Commission</p>
                                </div>
                                <div className="hidden sm:block w-px h-12 bg-gray-300"></div>
                                <div className="flex flex-col items-center">
                                    <h3 className="text-3xl font-bold text-gray-900">₹0</h3>
                                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mt-1">Joining Fee</p>
                                </div>
                                <div className="hidden sm:block w-px h-12 bg-gray-300"></div>
                                <div className="flex flex-col items-center">
                                    <h3 className="text-3xl font-bold text-gray-900">100+</h3>
                                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mt-1">Active Partners</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* WHY PARTNER WITH US */}
                <section className="py-20 md:py-28 bg-gradient-to-b from-blue-50/50 to-white relative overflow-hidden">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16 md:mb-20 animate-slide-up">
                            <h2 className="text-4xl md:text-5xl font-extrabold text-black tracking-tight mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                Why Become a{' '}
                                <span className="relative inline-block whitespace-nowrap">
                                    Vyora Partner?
                                    <YellowUnderline />
                                </span>
                            </h2>
                            <p className="text-lg md:text-xl text-gray-600 font-medium max-w-2xl mx-auto">
                                We provide you with all the tools, resources, and support you need to succeed and build a sustainable income stream.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                            {partnerBenefits.map((benefit, index) => (
                                <div key={index} className="group relative bg-white/80 backdrop-blur-xl rounded-3xl p-8 md:p-10 shadow-xl shadow-gray-200/40 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 hover:-translate-y-2 border border-white/60 animate-slide-up" style={{ animationDelay: `${index * 0.08}s` }}>
                                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/40 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    <div className="relative z-10">
                                        <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-6 border border-gray-100 group-hover:bg-blue-100 group-hover:shadow-md transition-all duration-500">
                                            <benefit.icon className="w-7 h-7 text-blue-600" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-3">{benefit.title}</h3>
                                        <p className="text-gray-500 font-medium leading-relaxed">{benefit.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* HOW IT WORKS */}
                <section className="py-20 md:py-28 bg-white relative overflow-hidden">
                    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
                        <div className="text-center mb-16 md:mb-20">
                            <h2 className="text-4xl md:text-5xl font-extrabold text-black tracking-tight mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                How It{' '}
                                <span className="relative inline-block whitespace-nowrap">
                                    Works
                                    <YellowUnderline />
                                </span>
                            </h2>
                            <p className="text-lg md:text-xl text-gray-600 font-medium max-w-2xl mx-auto">Start earning in three simple steps.</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 text-center">
                            <div className="group relative bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl shadow-gray-200/40 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-white/60 animate-slide-up">
                                <div className="w-16 h-16 mx-auto bg-blue-600 text-white rounded-2xl flex items-center justify-center text-2xl font-extrabold mb-6 relative z-10 shadow-lg shadow-blue-500/30">
                                    1
                                </div>
                                <div className="hidden md:block absolute top-[4rem] left-[60%] right-[-40%] h-px bg-gradient-to-r from-blue-300 to-indigo-300 border border-dashed z-0"></div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">Sign Up</h3>
                                <p className="text-gray-500 font-medium leading-relaxed">Register for free and get access to your personalized partner dashboard and unique referral links.</p>
                            </div>
                            <div className="group relative bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl shadow-gray-200/40 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-white/60 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                                <div className="w-16 h-16 mx-auto bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-2xl font-extrabold mb-6 relative z-10 shadow-lg shadow-indigo-500/30">
                                    2
                                </div>
                                <div className="hidden md:block absolute top-[4rem] left-[60%] right-[-40%] h-px bg-gradient-to-r from-indigo-300 to-purple-300 border border-dashed z-0"></div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">Refer Businesses</h3>
                                <p className="text-gray-500 font-medium leading-relaxed">Share Vyora with your network, clients, or audience using our professional marketing assets.</p>
                            </div>
                            <div className="group relative bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl shadow-gray-200/40 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-white/60 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                                <div className="w-16 h-16 mx-auto bg-purple-600 text-white rounded-2xl flex items-center justify-center text-2xl font-extrabold mb-6 relative z-10 shadow-lg shadow-purple-500/30">
                                    3
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">Earn Commissions</h3>
                                <p className="text-gray-500 font-medium leading-relaxed">Get paid recurring commissions every month for as long as your referred users stay subscribed.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* COMMISSION TIERS */}
                <section className="py-20 md:py-28 bg-gradient-to-b from-blue-50/50 to-white relative">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16 md:mb-20">
                            <h2 className="text-4xl md:text-5xl font-extrabold text-black tracking-tight mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                Partner Success{' '}
                                <span className="relative inline-block whitespace-nowrap">
                                    Tiers
                                    <YellowUnderline />
                                </span>
                            </h2>
                            <p className="text-lg md:text-xl text-gray-600 font-medium max-w-2xl mx-auto">The more you refer, the more you earn. Climb the tiers to unlock exclusive benefits.</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {tiers.map((tier, index) => (
                                <div key={index} className={`relative rounded-3xl overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl \${tier.popular ? 'border-2 border-blue-600 shadow-2xl scale-105 z-10 bg-white' : 'border border-gray-200 bg-white/80 backdrop-blur-xl mt-4 mb-4 shadow-xl shadow-gray-200/40'}`}>
                                    {tier.popular && (
                                        <div className="absolute top-0 inset-x-0 h-10 bg-blue-600 flex items-center justify-center text-white text-sm font-bold uppercase tracking-wider">
                                            Most Popular
                                        </div>
                                    )}
                                    <div className={`p-8 \${tier.popular ? 'pt-14' : ''}`}>
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-gray-200/50 \${tier.popular ? 'bg-amber-100' : 'bg-gray-100'}`}>
                                            <tier.icon className={`w-8 h-8 \${tier.popular ? 'text-amber-500' : 'text-gray-500'}`} />
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900 mb-1">{tier.level}</h3>
                                        <p className="text-gray-500 font-medium mb-6">{tier.sales}</p>

                                        <div className="mb-6 flex items-baseline">
                                            <span className="text-5xl font-extrabold text-gray-900">{tier.commission}</span>
                                            <span className="text-lg text-gray-500 ml-2 font-medium">/ recurring</span>
                                        </div>

                                        <ul className="space-y-4 mb-8">
                                            {tier.benefits.map((benefit, i) => (
                                                <li key={i} className="flex items-start">
                                                    <CheckCircle2 className={`w-5 h-5 mr-3 mt-0.5 \${tier.popular ? 'text-blue-600' : 'text-gray-400'}`} />
                                                    <span className="text-gray-700 font-medium leading-relaxed">{benefit}</span>
                                                </li>
                                            ))}
                                        </ul>

                                        <Link href="/signup">
                                            <Button className={`w-full py-6 text-lg font-semibold \${tier.popular ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg' : 'bg-white text-gray-900 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`} variant={tier.popular ? 'default' : 'outline'}>
                                                Get Started
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* FAQs */}
                <section className="py-20 md:py-28 bg-white">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16 md:mb-20">
                            <h2 className="text-4xl md:text-5xl font-extrabold text-black tracking-tight mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                Frequently Asked{' '}
                                <span className="relative inline-block whitespace-nowrap">
                                    Questions
                                    <YellowUnderline />
                                </span>
                            </h2>
                            <p className="text-lg md:text-xl text-gray-600 font-medium">Everything you need to know about the Vyora Partner Program.</p>
                        </div>

                        <div className="space-y-4">
                            {faqs.map((faq, index) => (
                                <div key={index} className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg shadow-gray-200/30 border border-white/60 overflow-hidden transition-all duration-300 hover:shadow-xl">
                                    <button
                                        onClick={() => setOpenFaq(openFaq === index ? null : index)}
                                        className="w-full flex items-center justify-between p-6 text-left"
                                    >
                                        <span className="text-lg md:text-xl font-bold text-gray-800 pr-4">{faq.question}</span>
                                        <div className={`w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 transition-transform duration-300 \${openFaq === index ? 'rotate-180' : ''}`}>
                                            <ChevronDown className="w-5 h-5 text-blue-600" />
                                        </div>
                                    </button>
                                    <AnimatePresence>
                                        {openFaq === index && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                <div className="px-6 pb-6 text-gray-600 text-base md:text-lg leading-relaxed font-medium border-t border-gray-100 pt-4">
                                                    {faq.answer}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CONTACT & DEMO FORM - Matching Landing Page */}
                <section id="contact-form" className="py-20 md:py-28 bg-green-50/30">
                    <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
                        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-start">
                            {/* Left Content */}
                            <div className="text-center md:text-left animate-slide-up">
                                <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                    Ready to Get Started?
                                </h2>
                                <p className="text-lg md:text-xl text-gray-600 mb-10 font-medium">
                                    Fill out the form and our team will reach out within 24 hours to help you set up your business on Vyora.
                                </p>

                                {/* Contact Options */}
                                <div className="space-y-5 mb-10">
                                    <a
                                        href="tel:+917704935569"
                                        className="flex items-center gap-5 p-5 bg-blue-50/50 rounded-2xl hover:bg-blue-100/50 transition-all duration-300 group border border-blue-100/50"
                                    >
                                        <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/20">
                                            <Phone className="w-7 h-7 text-white" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 text-lg">Call Us</p>
                                            <p className="text-blue-600 font-bold text-lg">+91 77049 35569</p>
                                        </div>
                                    </a>

                                    <a
                                        href="https://wa.me/917704935569?text=Hi, I'm interested in Vyora for my business"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-5 p-5 bg-green-50/50 rounded-2xl hover:bg-green-100/50 transition-all duration-300 group border border-green-100/50"
                                    >
                                        <div className="w-14 h-14 rounded-full bg-[#25D366] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-lg shadow-green-500/20">
                                            <FaWhatsapp className="w-8 h-8 text-white" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 text-lg">WhatsApp</p>
                                            <p className="text-green-600 font-bold text-lg">+91 77049 35569</p>
                                        </div>
                                    </a>

                                    <a
                                        href="mailto:hello@vyora.club?subject=Interested in Vyora&body=Hi, I would like to know more about Vyora for my business."
                                        className="flex items-center gap-5 p-5 bg-purple-50/50 rounded-2xl hover:bg-purple-100/50 transition-all duration-300 group border border-purple-100/50"
                                    >
                                        <div className="w-14 h-14 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/20">
                                            <Mail className="w-7 h-7 text-white" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 text-lg">Email Us</p>
                                            <p className="text-purple-600 font-bold text-lg">hello@vyora.club</p>
                                        </div>
                                    </a>
                                </div>
                            </div>

                            {/* Contact Form Card */}
                            <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
                                <Card className="p-8 md:p-10 bg-white border-0 shadow-2xl shadow-gray-200/50 rounded-3xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50" />
                                    <h3 className="text-2xl font-bold text-gray-900 mb-8 relative z-10">Book Your Free Demo</h3>
                                    <form onSubmit={handleContactSubmit} className="space-y-5 relative z-10">
                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="text-gray-700 font-bold ml-1">Full Name *</Label>
                                            <Input
                                                id="name"
                                                placeholder="Enter your name"
                                                value={contactForm.name}
                                                onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                                                required
                                                className="h-14 bg-gray-50/50 border-gray-100 focus:bg-white focus:ring-blue-600 rounded-xl transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone" className="text-gray-700 font-bold ml-1">Phone Number *</Label>
                                            <Input
                                                id="phone"
                                                type="tel"
                                                placeholder="+91 98765 43210"
                                                value={contactForm.phone}
                                                onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                                                required
                                                className="h-14 bg-gray-50/50 border-gray-100 focus:bg-white focus:ring-blue-600 rounded-xl transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="text-gray-700 font-bold ml-1">Email Address</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="you@business.com"
                                                value={contactForm.email}
                                                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                                                className="h-14 bg-gray-50/50 border-gray-100 focus:bg-white focus:ring-blue-600 rounded-xl transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="business" className="text-gray-700 font-bold ml-1">Business Name</Label>
                                            <Input
                                                id="business"
                                                placeholder="Your business name"
                                                value={contactForm.business}
                                                onChange={(e) => setContactForm({ ...contactForm, business: e.target.value })}
                                                className="h-14 bg-gray-50/50 border-gray-100 focus:bg-white focus:ring-blue-600 rounded-xl transition-all"
                                            />
                                        </div>
                                        <Button
                                            type="submit"
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-16 font-bold text-lg shadow-xl shadow-blue-500/30 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] mt-4"
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? 'Submitting...' : 'Book Free Demo'}
                                            <ArrowRight className="w-5 h-5 ml-2" />
                                        </Button>
                                    </form>
                                </Card>
                            </div>
                        </div>
                    </div>
                </section>

            </main>
            <SeoFooterLinks pageType="landing" />
            <PublicFooter />
        </div>
    );
}
