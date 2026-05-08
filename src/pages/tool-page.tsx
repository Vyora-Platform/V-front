import { useRoute, useLocation } from "wouter";
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
    CheckCircle2, ArrowRight, ChevronRight, BarChart3,
    Zap, Shield, Sparkles, Target, Activity, Smartphone, TrendingUp,
    MapPin, Building, FileText, Star, Quote, AlertTriangle, ThumbsUp, Clock, Crown,
    ChevronDown, ChevronUp, ChevronLeft, Users, Layers, Settings
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { SeoFooterLinks } from "@/components/seo-footer-links";

const iconCycle = [Sparkles, Target, Activity, Zap, BarChart3, Smartphone, TrendingUp, Shield, Clock, Users, Layers, Settings];

// Data type for dynamically loaded module
type Tool = Record<string, any>;

const generateAnchorText = (toolTitle: string, target: string, type: 'industry' | 'city' | 'blog' | 'tool', variantIndex: number) => {
    const cleanTarget = target.replace(/-/g, ' ');
    const capitalTarget = cleanTarget.replace(/\b\w/g, l => l.toUpperCase());
    if (type === 'industry') {
        const variants = [`${toolTitle} for ${capitalTarget}`, `${capitalTarget} ${toolTitle} Solution`, `Best ${toolTitle} for ${capitalTarget} Businesses`];
        return variants[variantIndex % variants.length];
    } else if (type === 'city') {
        const variants = [`${toolTitle} in ${capitalTarget}`, `${capitalTarget}'s Top ${toolTitle}`, `Best ${toolTitle} Software ${capitalTarget}`];
        return variants[variantIndex % variants.length];
    } else if (type === 'blog') {
        const variants = [`How ${capitalTarget} manage operations`, `Ultimate Guide: ${toolTitle} strategies`, `Why local business needs ${toolTitle}`];
        return variants[variantIndex % variants.length];
    }
    return `${toolTitle} Software`;
};

const injectContext = (text: string, industry: string | null, city: string | null, isTitle: boolean = false) => {
    if (!text) return "";
    let modified = text;
    if (industry) {
        const indName = industry.replace(/-/g, ' ');
        if (isTitle && !modified.toLowerCase().includes(indName.toLowerCase())) {
            modified = modified.includes('?') ? modified.replace(/\?$/, ` for ${indName}?`) : `${modified} for ${indName}`;
        } else { modified = modified.replace(/\byour business\b/gi, `your ${indName}`); }
    }
    if (city) {
        const cityName = city.replace(/-/g, ' ');
        if (isTitle && !modified.toLowerCase().includes(cityName.toLowerCase())) {
            modified = modified.includes('?') ? modified.replace(/\?$/, ` in ${cityName}?`) : `${modified} in ${cityName}`;
        }
    }
    return modified;
};

const topIndustries = ["gyms", "salons", "medical-stores", "restaurants", "retail-shops"];
const topCities = ["mumbai", "delhi", "bangalore", "hyderabad", "kanpur", "lucknow"];
const relatedBlogs = ["how-to-scale-operations", "best-crm-for-small-business", "automating-local-business"];

// Yellow underline SVG matching landing page
const YellowUnderline = () => (
    <svg className="absolute -bottom-2 sm:-bottom-3 md:-bottom-4 left-0 w-full h-4 sm:h-5 md:h-6 overflow-visible -z-0" viewBox="0 0 100 24" preserveAspectRatio="none">
        <path d="M 2,12 L 98,6 L 12,20 L 96,22" stroke="#E0E662" strokeWidth="4" vectorEffect="non-scaling-stroke" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export default function ToolPage() {
    const [match, params] = useRoute("/app/:toolSlug");
    const [, setLocation] = useLocation();
    const [openFaq, setOpenFaq] = useState<number | null>(0);
    const [currentTestimonial, setCurrentTestimonial] = useState(0);

    const [isLoading, setIsLoading] = useState(true);
    const [toolsData, setToolsData] = useState<Tool[]>([]);

    useEffect(() => {
        let isMounted = true;
        import("@/lib/tools-data").then(m => {
            if (isMounted) {
                setToolsData(m.toolsData);
                setIsLoading(false);
            }
        }).catch(console.error);
        return () => { isMounted = false; };
    }, []);

    const rawSlug = params?.toolSlug || "";
    let baseSlug = rawSlug;
    let industry: string | null = null;
    let city: string | null = null;

    const fullMatch = rawSlug.match(/^(.+)-for-(.+)-in-(.+)$/);
    const indMatch = rawSlug.match(/^(.+)-for-(.+)$/);
    const ctyMatch = rawSlug.match(/^(.+)-in-(.+)$/);

    if (fullMatch) { baseSlug = fullMatch[1]; industry = fullMatch[2]; city = fullMatch[3]; }
    else if (indMatch) { baseSlug = indMatch[1]; industry = indMatch[2]; }
    else if (ctyMatch) { baseSlug = ctyMatch[1]; city = ctyMatch[2]; }

    const tool = toolsData.find((t) => t.slug === baseSlug);
    const isCityPage = !!city;
    const isIndustryPage = !!industry;

    const pageContext = useMemo(() => {
        if (!tool) return null;
        let titleSuffix = "";
        if (industry && city) titleSuffix = ` for ${industry.replace(/-/g, ' ')} in ${city.replace(/-/g, ' ')}`;
        else if (industry) titleSuffix = ` for ${industry.replace(/-/g, ' ')}`;
        else if (city) titleSuffix = ` in ${city.replace(/-/g, ' ')}`;
        return { titleSuffix };
    }, [tool, industry, city]);

    // Auto-rotate testimonials
    useEffect(() => {
        if (!tool?.testimonials?.length) return;
        const interval = setInterval(() => {
            setCurrentTestimonial(prev => (prev + 1) % tool.testimonials.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [tool]);

    useEffect(() => {
        if (!isLoading && !tool && rawSlug) {
            setLocation("/404");
            return;
        }

        if (tool && pageContext) {
            document.title = tool.metaTitle || `${tool.title}${pageContext.titleSuffix} | Vyora Software Hub`;
            const setMeta = (name: string, content: string, attr: string = "name") => {
                let el = document.querySelector(`meta[${attr}="${name}"]`);
                if (!el) { el = document.createElement("meta"); el.setAttribute(attr, name); document.head.appendChild(el); }
                el.setAttribute("content", content);
            };
            setMeta("description", tool.metaDescription || tool.description);
            setMeta("robots", "index, follow");
            const canonicalUrl = `https://vyora.club/app/${rawSlug}`;
            let canonicalLink = document.querySelector('link[rel="canonical"]');
            if (!canonicalLink) { canonicalLink = document.createElement("link"); canonicalLink.setAttribute("rel", "canonical"); document.head.appendChild(canonicalLink); }
            canonicalLink.setAttribute("href", canonicalUrl);
            setMeta("og:title", tool.metaTitle || tool.title, "property");
            setMeta("og:description", tool.metaDescription || tool.description, "property");
            setMeta("og:url", canonicalUrl, "property");
            setMeta("og:type", "website", "property");
            if (tool.mainImage) setMeta("og:image", tool.mainImage, "property");
            window.scrollTo(0, 0);
        }
    }, [tool, pageContext, rawSlug, isLoading]);

    if (!match) return null;

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
                <div className="w-12 h-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
            </div>
        );
    }

    if (!tool) return null;

    const canonicalUrl = `https://vyora.club/app/${rawSlug}`;

    // JSON-LD Schemas
    const faqSchema = {
        "@context": "https://schema.org", "@type": "FAQPage",
        mainEntity: tool.faqs?.map((faq: any) => ({
            "@type": "Question", name: injectContext(faq.q, industry, city, true),
            acceptedAnswer: { "@type": "Answer", text: injectContext(faq.a, industry, city) }
        })) || []
    };
    const today = new Date().toISOString().split('T')[0];
    const softwareSchema = {
        "@context": "https://schema.org", "@type": "SoftwareApplication", name: tool.title,
        applicationCategory: "BusinessApplication", description: tool.description, operatingSystem: "All", url: canonicalUrl,
        offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
        datePublished: "2024-01-01",
        dateModified: today
    };
    const howToSchema = tool.howItWorks ? {
        "@context": "https://schema.org", "@type": "HowTo", name: `How to use ${tool.title}`, description: tool.description,
        step: tool.howItWorks.map((s: any) => ({ "@type": "HowToStep", name: s.title, text: s.description }))
    } : null;
    const reviewSchema = tool.testimonials ? {
        "@context": "https://schema.org", "@type": "Product", name: tool.title, description: tool.description,
        review: tool.testimonials.map((t: any) => ({
            "@type": "Review", author: { "@type": "Person", name: t.name },
            reviewRating: { "@type": "Rating", ratingValue: t.rating }, reviewBody: t.content
        }))
    } : null;
    const breadcrumbsSchema = {
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://vyora.club" },
            { "@type": "ListItem", position: 2, name: "Apps", item: "https://vyora.club/app" },
            { "@type": "ListItem", position: 3, name: tool.title, item: `https://vyora.club/app/${baseSlug}` },
            ...(industry ? [{ "@type": "ListItem", position: 4, name: industry.replace(/-/g, ' '), item: `https://vyora.club/app/${baseSlug}-for-${industry}` }] : []),
            ...(city ? [{ "@type": "ListItem", position: industry ? 5 : 4, name: city.replace(/-/g, ' '), item: canonicalUrl }] : []),
        ]
    };

    const relatedToolsData = (tool.relatedTools || []).map((slug: string) => toolsData.find((t) => t.slug === slug)).filter(Boolean);

    // Show 3 testimonials at a time in desktop view
    const visibleTestimonials = tool.testimonials ? tool.testimonials.slice(0, 3) : [];
    const remainingTestimonials = tool.testimonials ? tool.testimonials.slice(3) : [];

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-blue-100 selection:text-blue-900 overflow-hidden">
            {/* CSS Animations matching landing page */}
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
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsSchema) }} />
            {howToSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />}
            {reviewSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewSchema) }} />}

            <PublicHeader />

            <main className="flex-1">

                {/* ===== 1. HERO — Matching Landing Page Exactly ===== */}
                <section className="pt-32 pb-20 md:pt-40 md:pb-32 bg-white relative overflow-hidden">
                    {/* Background blobs matching landing hero */}
                    <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-50/50 rounded-full blur-[100px] opacity-70 translate-x-1/3 -translate-y-1/3 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-50/50 rounded-full blur-[80px] opacity-50 -translate-x-1/2 translate-y-1/2 pointer-events-none" />

                    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative z-10">
                        <div className="flex flex-col items-center text-center max-w-5xl mx-auto">
                            {/* Breadcrumb hidden for SR */}
                            <nav className="sr-only" aria-label="Breadcrumb">
                                <Link href="/">Home</Link> / <span>Apps</span> / <span>{tool.title}</span>
                            </nav>

                            {/* Badge — same style as landing */}
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 bg-white/50 backdrop-blur-sm text-gray-700 text-sm font-medium mb-8 animate-slide-up shadow-sm">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                                </span>
                                {tool.subtitle}
                            </div>

                            {/* Title — Poppins heading + yellow underlines */}
                            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 mb-6 leading-tight tracking-tight animate-slide-up capitalize" style={{ fontFamily: 'Poppins, sans-serif', animationDelay: '0.1s' }}>
                                <span className="relative inline-block whitespace-nowrap">
                                    <span className="relative text-gray-900 px-1 z-10">{tool.title}</span>
                                    <YellowUnderline />
                                </span>
                                <br className="hidden md:block" />
                                <span className="text-transparent bg-clip-text bg-gradient-to-br from-blue-700 to-indigo-600 mt-2 inline-block">
                                    {industry ? `for ${industry.replace(/-/g, ' ')}` : (city ? `in ${city.replace(/-/g, ' ')}` : "for Your Business")}
                                </span>
                            </h1>

                            <p className="text-lg md:text-xl lg:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto animate-slide-up leading-relaxed font-medium" style={{ animationDelay: '0.2s' }}>
                                {tool.description}. A {tool.definitionX} that helps you {tool.definitionY}.
                            </p>

                            {/* CTAs — exactly matching landing */}
                            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.3s' }}>
                                <Link href="/signup">
                                    <Button size="lg" className="group w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 rounded-md px-8 h-14 text-base md:px-10 md:h-16 md:text-lg font-semibold transition-all duration-300">
                                        Get Started — It's Free <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </Link>
                                <Link href="/#contact-form">
                                    <Button size="lg" variant="outline" className="w-full sm:w-auto text-blue-600 border-blue-600 bg-blue-50/50 hover:bg-blue-100 rounded-md px-8 h-14 text-base md:px-10 md:h-16 md:text-lg font-semibold transition-all duration-300 group shadow-sm">
                                        <FaWhatsapp className="w-6 h-6 mr-1 text-blue-600 md:w-7 md:h-7" /> Book Free Demo
                                    </Button>
                                </Link>
                            </div>

                            {/* Hero Image */}
                            {tool.mainImage && (
                                <div className="mt-10 md:mt-14 w-full max-w-4xl lg:max-w-5xl mx-auto animate-slide-up px-2 sm:px-0" style={{ animationDelay: '0.4s' }}>
                                    <div className="relative w-full overflow-hidden shadow-2xl rounded-xl md:rounded-2xl border border-gray-200/50 bg-gray-100">
                                        <img src={tool.mainImage} alt={`${tool.title} dashboard interface`} className="w-full aspect-[16/9] object-cover object-top" loading="eager" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* ===== 2. STATS — Glassmorphic like landing ===== */}
                {tool.stats && (
                    <section className="pt-8 pb-20 md:pt-12 md:pb-28 bg-gradient-to-b from-blue-50/50 to-white relative overflow-hidden">
                        <div className="absolute inset-0 max-w-7xl mx-auto -z-10">
                            <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl animate-pulse-glow" />
                            <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
                        </div>
                        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative z-10">
                            <div className="flex flex-col items-center text-center mb-16 md:mb-20 animate-slide-up">
                                <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-black tracking-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                    Numbers That{' '}
                                    <span className="relative inline-block whitespace-nowrap">
                                        Speak
                                        <YellowUnderline />
                                    </span>
                                </h2>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
                                {tool.stats.map((stat: any, i: number) => (
                                    <div key={i} className="group relative bg-white/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 lg:p-10 shadow-xl shadow-gray-200/40 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 hover:-translate-y-2 border border-white/60 animate-slide-up" style={{ animationDelay: `${i * 0.15}s` }}>
                                        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/40 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                        <div className="relative z-10 flex flex-col items-center text-center">
                                            <span className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-blue-700 to-indigo-600 mb-2">{stat.value}</span>
                                            <span className="text-sm md:text-base font-medium text-gray-500">{stat.label}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* ===== 3. PROBLEM / SOLUTION ===== */}
                {tool.problemStatement && (
                    <section className="py-20 md:py-28 bg-white relative overflow-hidden">
                        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
                            <div className="text-center max-w-3xl mx-auto mb-16">
                                <h2 className="text-4xl md:text-5xl font-extrabold text-black tracking-tight mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                    The Problem{' '}
                                    <span className="relative inline-block whitespace-nowrap">
                                        We Solve
                                        <YellowUnderline />
                                    </span>
                                    {pageContext?.titleSuffix}
                                </h2>
                                <p className="text-lg text-gray-600 font-medium">See the difference Vyora makes for your daily operations.</p>
                            </div>
                            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                                <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                                    className="relative bg-white/80 backdrop-blur-xl rounded-3xl p-8 md:p-10 shadow-xl shadow-gray-200/40 border border-red-100 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
                                    <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-6">
                                        <AlertTriangle className="w-7 h-7 text-red-500" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Without Vyora</h3>
                                    <p className="text-gray-600 text-lg leading-relaxed font-medium">{tool.problemStatement}</p>
                                </motion.div>
                                <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                                    className="relative bg-white/80 backdrop-blur-xl rounded-3xl p-8 md:p-10 shadow-xl shadow-gray-200/40 border border-green-100 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
                                    <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mb-6">
                                        <ThumbsUp className="w-7 h-7 text-green-600" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-4">With Vyora</h3>
                                    <p className="text-gray-600 text-lg leading-relaxed font-medium">{tool.solutionStatement}</p>
                                </motion.div>
                            </div>
                        </div>
                    </section>
                )}

                {/* ===== 4. SHOWCASE (Zigzag Feature Spotlight) ===== */}
                {tool.showcase && tool.showcase.length > 0 && (
                    <section className="py-20 md:py-28 bg-gradient-to-b from-blue-50/50 to-white relative overflow-hidden">
                        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
                            <div className="text-center max-w-3xl mx-auto mb-20">
                                <h2 className="text-4xl md:text-5xl font-extrabold text-black tracking-tight mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                    See It{' '}
                                    <span className="relative inline-block whitespace-nowrap">
                                        In Action
                                        <YellowUnderline />
                                    </span>
                                </h2>
                                <p className="text-lg text-gray-600 font-medium">Deep dive into the features that set {tool.title} apart from everything else.</p>
                            </div>
                            <div className="space-y-20 md:space-y-28">
                                {tool.showcase.map((item: any, i: number) => (
                                    <motion.div key={i} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }}
                                        className={`flex flex-col ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-10 md:gap-16 items-center`}>
                                        <div className="flex-1 w-full">
                                            <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-200/50">
                                                <img src={item.image} alt={item.title} className="w-full aspect-[16/10] object-cover" loading="lazy" />
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30">
                                                <span className="text-white font-bold text-lg">{i + 1}</span>
                                            </div>
                                            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">{item.title}</h3>
                                            <p className="text-gray-600 text-lg leading-relaxed font-medium">{item.description}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* ===== 5. HOW IT WORKS ===== */}
                {tool.howItWorks && (
                    <section className="py-20 md:py-28 bg-white relative overflow-hidden">
                        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
                            <div className="text-center max-w-3xl mx-auto mb-20">
                                <h2 className="text-4xl md:text-5xl font-extrabold text-black tracking-tight mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                    How{' '}
                                    <span className="relative inline-block whitespace-nowrap">
                                        It Works
                                        <YellowUnderline />
                                    </span>
                                    {pageContext?.titleSuffix}
                                </h2>
                                <p className="text-lg text-gray-600 font-medium">Get started in {tool.howItWorks.length} easy steps. No technical expertise required.</p>
                            </div>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                                {tool.howItWorks.map((step: any, i: number) => (
                                    <div key={i}
                                        className="group relative bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl shadow-gray-200/40 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 hover:-translate-y-2 border border-white/60 animate-slide-up"
                                        style={{ animationDelay: `${i * 0.15}s` }}>
                                        {i < (tool.howItWorks.length - 1) && (
                                            <div className="hidden lg:block absolute top-1/2 -right-4 w-8 text-gray-300 z-20">
                                                <ArrowRight className="w-6 h-6" />
                                            </div>
                                        )}
                                        <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30">
                                            <span className="text-white font-extrabold text-xl">{step.step}</span>
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                                        <p className="text-gray-500 font-medium leading-relaxed">{step.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* ===== 6. DETAILED FEATURES GRID ===== */}
                {tool.detailedFeatures && (
                    <section className="py-20 md:py-28 bg-gradient-to-b from-blue-50/50 to-white relative overflow-hidden">
                        <div className="absolute inset-0 max-w-7xl mx-auto -z-10">
                            <div className="absolute top-32 right-20 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl" />
                            <div className="absolute bottom-20 left-16 w-64 h-64 bg-indigo-400/10 rounded-full blur-3xl" />
                        </div>
                        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative z-10">
                            <div className="text-center max-w-3xl mx-auto mb-20">
                                <h2 className="text-4xl md:text-5xl font-extrabold text-black tracking-tight mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                    Everything{' '}
                                    <span className="relative inline-block whitespace-nowrap">
                                        You Need
                                        <YellowUnderline />
                                    </span>
                                    {pageContext?.titleSuffix}
                                </h2>
                                <p className="text-lg text-gray-600 font-medium">Powerful features designed to transform how {industry ? industry.replace(/-/g, ' ') : 'your business'} operates{city ? ` in ${city.replace(/-/g, ' ')}` : ''}.</p>
                            </div>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                                {tool.detailedFeatures.map((feature: any, i: number) => {
                                    const DynIcon = iconCycle[i % iconCycle.length];
                                    return (
                                        <div key={i}
                                            className="group relative bg-white/80 backdrop-blur-xl rounded-3xl p-8 md:p-10 shadow-xl shadow-gray-200/40 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 hover:-translate-y-2 border border-white/60 animate-slide-up"
                                            style={{ animationDelay: `${i * 0.08}s` }}>
                                            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/40 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                            <div className="relative z-10">
                                                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-6 border border-gray-100 group-hover:bg-blue-100 group-hover:shadow-md transition-all duration-500">
                                                    <DynIcon className="w-7 h-7 text-blue-600" />
                                                </div>
                                                <h3 className="text-xl font-bold text-gray-900 mb-3">{injectContext(feature.title, industry, city, true)}</h3>
                                                <p className="text-gray-500 font-medium leading-relaxed">{injectContext(feature.description, industry, city)}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>
                )}

                {/* ===== 7. BENEFITS ===== */}
                {tool.benefits && (
                    <section className="py-20 md:py-28 bg-white">
                        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
                            <div className="text-center max-w-3xl mx-auto mb-16">
                                <h2 className="text-4xl md:text-5xl font-extrabold text-black tracking-tight mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                    Why Businesses{' '}
                                    <span className="relative inline-block whitespace-nowrap">
                                        Choose Us
                                        <YellowUnderline />
                                    </span>
                                </h2>
                                <p className="text-lg text-gray-600 font-medium">Real results that impact your bottom line.</p>
                            </div>
                            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                                {tool.benefits.map((benefit: any, i: number) => (
                                    <div key={i} className="group relative bg-white/80 backdrop-blur-xl rounded-3xl p-8 text-center shadow-xl shadow-gray-200/40 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 hover:-translate-y-2 border border-white/60 animate-slide-up" style={{ animationDelay: `${i * 0.12}s` }}>
                                        <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/30">
                                            <CheckCircle2 className="w-8 h-8 text-white" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-3">{benefit.title}</h3>
                                        <p className="text-gray-500 font-medium leading-relaxed">{benefit.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* ===== 8. TESTIMONIALS — Landing page style ===== */}
                {tool.testimonials && tool.testimonials.length > 0 && (
                    <section className="py-20 md:py-28 bg-gradient-to-b from-blue-50/50 to-white relative overflow-hidden">
                        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative z-10">
                            <div className="text-center max-w-3xl mx-auto mb-16">
                                <h2 className="text-4xl md:text-5xl font-extrabold text-black tracking-tight mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                    Loved by{' '}
                                    <span className="relative inline-block whitespace-nowrap">
                                        Real Businesses
                                        <YellowUnderline />
                                    </span>
                                </h2>
                                <p className="text-lg text-gray-600 font-medium">Hear from business owners who transformed their operations with {tool.title}.</p>
                            </div>

                            {/* First row: 3 testimonials */}
                            <div className="grid md:grid-cols-3 gap-6 lg:gap-8 mb-8">
                                {visibleTestimonials.map((t: any, i: number) => (
                                    <div key={i} className="group relative bg-white/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-xl shadow-gray-200/40 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 hover:-translate-y-2 border border-white/60 animate-slide-up" style={{ animationDelay: `${i * 0.15}s` }}>
                                        <div className="flex items-center gap-1 mb-4">
                                            {[...Array(t.rating)].map((_: any, s: number) => <Star key={s} className="w-5 h-5 text-amber-400 fill-amber-400" />)}
                                        </div>
                                        <Quote className="w-8 h-8 text-blue-200 mb-3" />
                                        <p className="text-gray-600 text-base leading-relaxed mb-6 font-medium">{t.content}</p>
                                        <div className="flex items-center justify-between border-t border-gray-100 pt-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-11 h-11 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-base shadow-lg shadow-blue-500/30">{t.initial}</div>
                                                <div>
                                                    <div className="text-gray-900 font-bold text-sm">{t.name}</div>
                                                    <div className="text-gray-500 text-xs">{t.role}</div>
                                                    <div className="text-gray-400 text-xs flex items-center gap-1"><MapPin className="w-3 h-3" />{t.location}</div>
                                                </div>
                                            </div>
                                            <div className="px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">{t.metric}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Remaining testimonials in a scrollable row */}
                            {remainingTestimonials.length > 0 && (
                                <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {remainingTestimonials.map((t: any, i: number) => (
                                        <div key={i + 3} className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg shadow-gray-200/30 border border-white/60 hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
                                            <div className="flex items-center gap-1 mb-3">
                                                {[...Array(t.rating)].map((_: any, s: number) => <Star key={s} className="w-4 h-4 text-amber-400 fill-amber-400" />)}
                                            </div>
                                            <p className="text-gray-600 text-sm leading-relaxed mb-4 font-medium line-clamp-4">{t.content}</p>
                                            <div className="flex items-center gap-2 border-t border-gray-100 pt-4">
                                                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md">{t.initial}</div>
                                                <div>
                                                    <div className="text-gray-900 font-bold text-xs">{t.name}</div>
                                                    <div className="text-gray-400 text-xs">{t.role}</div>
                                                </div>
                                                <div className="ml-auto px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold">{t.metric}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* ===== 9. PRICING CTA ===== */}
                <section className="py-20 md:py-28 bg-white">
                    <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8">
                        <div className="text-center max-w-3xl mx-auto mb-12">
                            <h2 className="text-4xl md:text-5xl font-extrabold text-black tracking-tight mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                Simple,{' '}
                                <span className="relative inline-block whitespace-nowrap">
                                    Transparent
                                    <YellowUnderline />
                                </span>
                                {' '}Pricing
                            </h2>
                            <p className="text-lg text-gray-600 font-medium">Start free. Upgrade when you're ready. No hidden fees, ever.</p>
                        </div>
                        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 text-center shadow-xl shadow-gray-200/40 border border-white/60 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                                <Sparkles className="w-10 h-10 text-gray-600 mx-auto mb-4" />
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">Free Plan</h3>
                                <div className="text-4xl font-extrabold text-gray-900 mb-1">₹0<span className="text-lg font-medium text-gray-500">/forever</span></div>
                                <p className="text-gray-500 font-medium mb-6">Essential tools to get your business started</p>
                                <Link href="/signup"><Button className="w-full rounded-md h-12 font-semibold bg-gray-100 text-gray-800 hover:bg-gray-200 shadow-sm" variant="outline">Get Started Free</Button></Link>
                            </div>
                            <div className="bg-blue-600 rounded-3xl p-8 text-center text-white relative overflow-hidden shadow-2xl shadow-blue-500/40 hover:-translate-y-2 transition-all duration-500">
                                <div className="absolute top-3 right-3 bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm">Most Popular</div>
                                <Crown className="w-10 h-10 text-white/80 mx-auto mb-4" />
                                <h3 className="text-2xl font-bold mb-2">Pro Plan</h3>
                                <div className="text-4xl font-extrabold mb-1">₹13<span className="text-lg font-medium text-white/80">/day</span></div>
                                <p className="text-white/80 font-medium mb-1">All tools, unlimited everything</p>
                                <p className="text-sm text-white/60 mb-6 line-through">₹499/month → ₹399/month</p>
                                <Link href="/signup"><Button className="w-full rounded-md h-12 font-semibold bg-white text-blue-600 hover:bg-blue-50 shadow-lg">Start Pro Trial <ArrowRight className="w-4 h-4 ml-1" /></Button></Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ===== 10. FAQ ===== */}
                <section className="py-20 md:py-28 bg-gradient-to-b from-blue-50/50 to-white">
                    <div className="max-w-4xl mx-auto px-4 md:px-6">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl font-extrabold text-black tracking-tight mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                Frequently Asked{' '}
                                <span className="relative inline-block whitespace-nowrap">
                                    Questions
                                    <YellowUnderline />
                                </span>
                                {pageContext?.titleSuffix}
                            </h2>
                            <p className="text-lg text-gray-600 font-medium">Everything you need to know about {tool.title}.</p>
                        </div>
                        {tool.faqs && tool.faqs.length > 0 && (
                            <div className="space-y-4">
                                {tool.faqs.map((faq: any, index: number) => (
                                    <div key={index}
                                        className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg shadow-gray-200/30 border border-white/60 overflow-hidden transition-all duration-300 hover:shadow-xl">
                                        <button onClick={() => setOpenFaq(openFaq === index ? null : index)}
                                            className="w-full flex items-center justify-between p-6 text-left">
                                            <span className="text-lg md:text-xl font-bold text-gray-800 pr-4">
                                                {injectContext(faq.q, industry, city, true)}
                                            </span>
                                            <div className={`w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 transition-transform duration-300 ${openFaq === index ? 'rotate-180' : ''}`}>
                                                <ChevronDown className="w-5 h-5 text-blue-600" />
                                            </div>
                                        </button>
                                        <AnimatePresence>
                                            {openFaq === index && (
                                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
                                                    <div className="px-6 pb-6 text-gray-600 text-base md:text-lg leading-relaxed font-medium border-t border-gray-100 pt-4">
                                                        {injectContext(faq.a, industry, city)}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* ===== 11. RELATED TOOLS + INTERNAL LINKS ===== */}
                <section className="py-20 md:py-28 bg-white border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
                        {relatedToolsData.length > 0 && (
                            <div className="mb-16">
                                <h2 className="text-3xl md:text-4xl font-extrabold text-black tracking-tight mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                    Explore{' '}
                                    <span className="relative inline-block whitespace-nowrap">
                                        Related Tools
                                        <YellowUnderline />
                                    </span>
                                </h2>
                                <p className="text-lg text-gray-600 font-medium mb-10">Maximize your results by combining {tool.title} with these powerful tools.</p>
                                <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
                                    {relatedToolsData.map((relTool: any, i: number) => (
                                        <Link key={i} href={`/app/${relTool.slug}`}>
                                            <div className="group bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl shadow-gray-200/40 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 hover:-translate-y-2 border border-white/60 cursor-pointer">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                                                        <relTool.icon className="w-5 h-5 text-white" />
                                                    </div>
                                                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{relTool.title}</h3>
                                                </div>
                                                <p className="text-gray-500 text-sm font-medium mb-4">{relTool.description}</p>
                                                <span className="text-blue-600 font-semibold text-sm flex items-center gap-1">
                                                    Learn more <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                                </span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* SEO Cluster Links */}
                        <div className="grid md:grid-cols-3 gap-12 pt-8 border-t border-gray-200">
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800 border-b border-gray-200 pb-3">
                                    <Building className="w-5 h-5 text-blue-600" /> {tool.title} by Industry
                                </h3>
                                <ul className="space-y-3">
                                    {topIndustries.map((ind, i) => (
                                        <li key={i}><Link href={`/app/${baseSlug}-for-${ind}`} className="text-gray-600 hover:text-blue-600 font-medium hover:underline flex items-center group transition-colors text-sm">
                                            <ChevronRight className="w-4 h-4 mr-2 text-gray-300 group-hover:text-blue-500" />
                                            {generateAnchorText(tool.title, ind, 'industry', i)}
                                        </Link></li>
                                    ))}
                                </ul>
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800 border-b border-gray-200 pb-3">
                                    <MapPin className="w-5 h-5 text-blue-600" /> {tool.title} by City
                                </h3>
                                <ul className="space-y-3">
                                    {topCities.map((c, i) => (
                                        <li key={i}><Link href={`/app/${baseSlug}-in-${c}`} className="text-gray-600 hover:text-blue-600 font-medium hover:underline flex items-center group transition-colors text-sm">
                                            <ChevronRight className="w-4 h-4 mr-2 text-gray-300 group-hover:text-blue-500" />
                                            {generateAnchorText(tool.title, c, 'city', i)}
                                        </Link></li>
                                    ))}
                                </ul>
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800 border-b border-gray-200 pb-3">
                                    <FileText className="w-5 h-5 text-blue-600" /> Insights & Guides
                                </h3>
                                <ul className="space-y-3">
                                    {relatedBlogs.map((blog, i) => (
                                        <li key={i}><Link href={`/blog/${blog}`} className="text-gray-600 hover:text-blue-600 font-medium hover:underline flex items-center group transition-colors text-sm">
                                            <ChevronRight className="w-4 h-4 mr-2 text-gray-300 group-hover:text-blue-500" />
                                            {generateAnchorText(tool.title, blog, 'blog', i)}
                                        </Link></li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {(isIndustryPage || isCityPage) && (
                            <div className="mt-10 pt-8 border-t border-gray-200 flex flex-wrap gap-4 text-sm font-medium">
                                <Link href={`/app/${baseSlug}`} className="px-4 py-2 rounded-md bg-white border border-gray-300 text-gray-700 hover:border-blue-400 hover:text-blue-600 transition-colors shadow-sm">
                                    &larr; Return to Core {tool.title}
                                </Link>
                                {isCityPage && industry && (
                                    <Link href={`/app/${baseSlug}-for-${industry}`} className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm">
                                        &larr; Back to {industry.replace(/-/g, ' ')} Software
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>
                </section>

                {/* ===== 12. BOTTOM CTA ===== */}
                <section className="py-24 px-4 md:px-6 lg:px-8 bg-white">
                    <div className="max-w-6xl mx-auto relative overflow-hidden rounded-3xl bg-blue-600 shadow-2xl shadow-blue-500/40">
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-400/20 rounded-full blur-[100px] translate-x-1/3 -translate-y-1/3" />
                        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-400/20 rounded-full blur-[80px] -translate-x-1/2 translate-y-1/2" />
                        <div className="relative z-10 p-12 md:p-24 flex flex-col items-center text-center">
                            <h3 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-white mb-4 tracking-tight max-w-4xl" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                Ready to Transform Your Business?
                            </h3>
                            <p className="text-lg md:text-xl text-blue-100 mb-10 max-w-2xl font-medium">
                                Deploy {tool.title}{pageContext?.titleSuffix} today. Free to start, no credit card required.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link href="/signup">
                                    <Button size="lg" className="group w-full sm:w-auto bg-white text-blue-600 hover:bg-blue-50 rounded-md h-16 px-10 text-xl font-semibold transition-all duration-300 shadow-xl">
                                        Start your Free Trial <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </Link>
                                <Link href="/">
                                    <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-md h-16 px-10 text-xl font-semibold border-2 border-white/40 text-white hover:border-white hover:bg-white/10 transition-all duration-300">
                                        Explore All Tools
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* ===== SEO FOOTER LINKS ===== */}
            <SeoFooterLinks pageType="tool" currentSlug={baseSlug} currentTitle={tool.title} />

            <PublicFooter />
        </div>
    );
}
