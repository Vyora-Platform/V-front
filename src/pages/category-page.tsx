import { useRoute, useLocation, Link } from "wouter";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    CheckCircle2, ArrowRight, ChevronRight, BarChart3,
    Zap, Shield, Sparkles, Target, Activity, Smartphone, TrendingUp,
    MapPin, Building, FileText, Star, Quote, AlertTriangle, ThumbsUp, Clock, Crown,
    ChevronDown, ChevronUp, ChevronLeft, Users, Layers, Settings,
    HelpCircle, Lightbulb, BookOpen, ExternalLink, ShoppingBag
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { SeoFooterLinks } from "@/components/seo-footer-links";

// Data types for dynamically loaded modules
type Category = Record<string, any>;
type Tool = Record<string, any>;

const iconCycle = [Sparkles, Target, Activity, Zap, BarChart3, Smartphone, TrendingUp, Shield, Clock, Users, Layers, Settings];

// Yellow underline SVG matching landing page
const YellowUnderline = () => (
    <svg className="absolute -bottom-2 sm:-bottom-3 md:-bottom-4 left-0 w-full h-4 sm:h-5 md:h-6 overflow-visible -z-0" viewBox="0 0 100 24" preserveAspectRatio="none">
        <path d="M 2,12 L 98,6 L 12,20 L 96,22" stroke="#E0E662" strokeWidth="4" vectorEffect="non-scaling-stroke" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export default function CategoryPage() {
    const [match, params] = useRoute("/category/:slug");
    const [openFaq, setOpenFaq] = useState<number | null>(0);
    const [currentTestimonial, setCurrentTestimonial] = useState(0);
    const [, setLocation] = useLocation();

    // State for lazily loaded data
    const [isLoading, setIsLoading] = useState(true);
    const [categoriesData, setCategoriesData] = useState<Category[]>([]);
    const [toolsData, setToolsData] = useState<Tool[]>([]);
    const [categoryTaxonomyMap, setCategoryTaxonomyMap] = useState<Record<string, { pageType: string; contentStrategy: string }>>({});

    useEffect(() => {
        let isMounted = true;
        Promise.all([
            import("@/lib/categories-data").then(m => m.categoriesData),
            import("@/lib/tools-data").then(m => m.toolsData),
            import("@/lib/category-taxonomy-data").then(m => m.categoryTaxonomyMap)
        ])
            .then(([catData, toolData, taxMap]) => {
                if (isMounted) {
                    setCategoriesData(catData);
                    setToolsData(toolData);
                    setCategoryTaxonomyMap(taxMap);
                    setIsLoading(false);
                }
            })
            .catch(console.error);
        return () => { isMounted = false; };
    }, []);

    const slug = params?.slug || "";

    // Find category from data
    const category = categoriesData.find((c) => c.slug === slug);

    // Auto-rotate testimonials
    useEffect(() => {
        if (!category?.testimonials?.length) return;
        const interval = setInterval(() => {
            setCurrentTestimonial(prev => (prev + 1) % category.testimonials.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [category]);

    useEffect(() => {
        if (!isLoading && !category) {
            setLocation("/404");
            return;
        }
        if (category) {
            document.title = category.metaTitle || `${category.name} Software & Tools | Vyora`;
            const setMeta = (name: string, content: string, attr: string = "name") => {
                let el = document.querySelector(`meta[${attr}="${name}"]`);
                if (!el) { el = document.createElement("meta"); el.setAttribute(attr, name); document.head.appendChild(el); }
                el.setAttribute("content", content);
            };
            setMeta("description", category.metaDescription || category.description);
            setMeta("robots", "index, follow");
            const canonicalUrl = `https://vyora.club/category/${slug}`;
            let canonicalLink = document.querySelector('link[rel="canonical"]');
            if (!canonicalLink) { canonicalLink = document.createElement("link"); canonicalLink.setAttribute("rel", "canonical"); document.head.appendChild(canonicalLink); }
            canonicalLink.setAttribute("href", canonicalUrl);
            setMeta("og:title", category.metaTitle || category.name, "property");
            setMeta("og:description", category.metaDescription || category.description, "property");
            setMeta("og:url", canonicalUrl, "property");
            setMeta("og:type", "website", "property");
            if (category.image) setMeta("og:image", category.image, "property");
            // Additional SEO meta tags for AI discoverability
            setMeta("twitter:card", "summary_large_image", "name");
            setMeta("twitter:title", category.metaTitle || category.name, "name");
            setMeta("twitter:description", category.metaDescription || category.description, "name");
            setMeta("article:section", category.name, "property");
            setMeta("article:tag", `${category.name} software, ${category.name} tools, ${category.name} management, Vyora`, "property");
            window.scrollTo(0, 0);
        }
    }, [category, slug]);

    if (!match) return null;

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
                <div className="w-12 h-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
            </div>
        );
    }

    if (!category) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-white">
                <PublicHeader />
                <main className="flex-1 flex flex-col items-center justify-center w-full px-4 text-center">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">Category not found</h1>
                    <p className="text-lg text-gray-600 mb-8 max-w-md">We couldn't find the business category you're looking for. It may have been moved or doesn't exist.</p>
                    <Link href="/">
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-md h-12 px-8 text-lg shadow-lg shadow-blue-500/20">
                            Return to Home
                        </Button>
                    </Link>
                </main>
                <PublicFooter />
            </div>
        );
    }

    const canonicalUrl = `https://vyora.club/category/${slug}`;

    // ===== ENHANCED STRUCTURED DATA MATRIX =====

    // 1. FAQPage Schema
    const faqSchema = category.faqs ? {
        "@context": "https://schema.org", "@type": "FAQPage",
        mainEntity: category.faqs.map((faq) => ({
            "@type": "Question", name: faq.q,
            acceptedAnswer: { "@type": "Answer", text: faq.a }
        }))
    } : null;

    // 2. Service Schema with enhanced provider details
    const serviceSchema = {
        "@context": "https://schema.org",
        "@type": "Service",
        name: `${category.name} Software & Management Solutions`,
        serviceType: category.name,
        description: category.description,
        url: canonicalUrl,
        provider: {
            "@type": "Organization",
            name: "Vyora",
            url: "https://vyora.club",
            logo: "https://vyora.club/logo.png",
            sameAs: [
                "https://www.linkedin.com/company/vyora",
                "https://twitter.com/vyora"
            ]
        },
        areaServed: { "@type": "Country", name: "India" },
        hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: `${category.name} Products & Services`,
            itemListElement: [
                ...(category.products || []).map((p, i) => ({
                    "@type": "Offer",
                    itemOffered: {
                        "@type": "SoftwareApplication",
                        name: p.name,
                        description: p.description,
                        applicationCategory: "BusinessApplication",
                        operatingSystem: "Web Browser"
                    }
                })),
                ...(category.services || []).map((s, i) => ({
                    "@type": "Offer",
                    itemOffered: {
                        "@type": "Service",
                        name: s.name,
                        description: s.description
                    }
                }))
            ]
        }
    };

    // 3. BreadcrumbList Schema
    const breadcrumbsSchema = {
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://vyora.club" },
            { "@type": "ListItem", position: 2, name: "Business Categories", item: "https://vyora.club/#categories" },
            { "@type": "ListItem", position: 3, name: category.name, item: canonicalUrl }
        ]
    };

    // 4. WebPage Schema for AI retrieval
    const webPageSchema = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: category.metaTitle || `${category.name} Software & Tools`,
        description: category.metaDescription || category.description,
        url: canonicalUrl,
        isPartOf: {
            "@type": "WebSite",
            name: "Vyora",
            url: "https://vyora.club"
        },
        about: {
            "@type": "Thing",
            name: category.name,
            description: category.definitionBlock
        },
        speakable: {
            "@type": "SpeakableSpecification",
            cssSelector: [".ai-definition-block", ".ai-answer-box", ".ai-summary-block"]
        }
    };

    // 5. ItemList Schema for products
    const itemListSchema = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: `${category.name} Software Products by Vyora`,
        numberOfItems: (category.products?.length || 0) + (category.services?.length || 0),
        itemListElement: [
            ...(category.products || []).map((p, i) => ({
                "@type": "ListItem",
                position: i + 1,
                name: p.name,
                description: p.description,
                url: canonicalUrl
            })),
            ...(category.services || []).map((s, i) => ({
                "@type": "ListItem",
                position: (category.products?.length || 0) + i + 1,
                name: s.name,
                description: s.description,
                url: canonicalUrl
            }))
        ]
    };

    const CategoryIcon = category.icon;

    // Show 3 testimonials at a time in desktop view
    const visibleTestimonials = category.testimonials ? category.testimonials.slice(0, 3) : [];
    const remainingTestimonials = category.testimonials ? category.testimonials.slice(3) : [];

    // Combine products and services for the detailed features section
    const combinedFeatures = [
        ...(category.products || []).map(p => ({ title: p.name, description: p.description, type: 'product', subs: p.subcategories })),
        ...(category.services || []).map(s => ({ title: s.name, description: s.description, type: 'service', subs: s.subcategories }))
    ];

    // Find related categories safely
    const relatedLinks = (category.relatedCategories || []).map(relSlug =>
        categoriesData.find(c => c.slug === relSlug)
    ).filter(Boolean) as typeof categoriesData;

    // Cross-link to relevant tools
    const relevantTools = toolsData ? toolsData.slice(0, 6) : [];

    // Generate AI-friendly summary sentence
    const aiSummary = `Vyora provides ${category.name.toLowerCase()} businesses with ${(category.products || []).map(p => p.name.toLowerCase()).join(', ')}${category.services?.length ? `, and services like ${(category.services || []).map(s => s.name.toLowerCase()).join(', ')}` : ''}. ${category.description}`;

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-blue-100 selection:text-blue-900 overflow-hidden">
            {/* CSS Animations matching landing page */}
            <style dangerouslySetInnerHTML={{
                __html: `
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
            `}} />

            {/* ===== STRUCTURED DATA MATRIX ===== */}
            {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />

            <PublicHeader />

            <main className="flex-1" itemScope itemType="https://schema.org/Service">
                {/* Hidden semantic metadata for search engines */}
                <meta itemProp="name" content={`${category.name} Software Solutions`} />
                <meta itemProp="description" content={category.description} />
                <meta itemProp="url" content={canonicalUrl} />

                {/* ===== 1. HERO — Enhanced with AI-Optimized Structure ===== */}
                <section className="pt-32 pb-20 md:pt-40 md:pb-32 bg-white relative overflow-hidden">
                    {/* Background blobs */}
                    <div className={`absolute top-0 right-0 w-[800px] h-[800px] ${category.accentColor.bg} rounded-full blur-[100px] opacity-60 translate-x-1/3 -translate-y-1/3 pointer-events-none`} />
                    <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-50/50 rounded-full blur-[80px] opacity-50 -translate-x-1/2 translate-y-1/2 pointer-events-none" />

                    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative z-10">
                        <div className="flex flex-col items-center text-center max-w-5xl mx-auto">
                            {/* Visible Breadcrumb for navigation & SEO */}
                            <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8 animate-slide-up" aria-label="Breadcrumb">
                                <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
                                <ChevronRight className="w-3.5 h-3.5" />
                                <span className="text-gray-400">Categories</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                                <span className="font-semibold text-gray-900">{category.name}</span>
                            </nav>

                            {/* Badge */}
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 bg-white/50 backdrop-blur-sm text-gray-700 text-sm font-medium mb-8 animate-slide-up shadow-sm">
                                <span className="relative flex h-2 w-2">
                                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${category.accentColor.bg.replace('/10', '')} opacity-75`}></span>
                                    <span className={`relative inline-flex rounded-full h-2 w-2 ${category.accentColor.text}`}></span>
                                </span>
                                {category.subtitle}
                            </div>

                            {/* H1 Title — Primary SEO Target */}
                            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 mb-6 leading-tight tracking-tight animate-slide-up capitalize" style={{ fontFamily: 'Poppins, sans-serif', animationDelay: '0.1s' }}>
                                Best Software For
                                <br />
                                <span className="relative inline-block whitespace-nowrap mt-2">
                                    <span className="relative text-transparent bg-clip-text bg-gradient-to-br from-gray-900 to-gray-700 px-1 z-10">{category.name}</span>
                                    <YellowUnderline />
                                </span>
                            </h1>

                            {/* AI-friendly summary paragraph — speakable */}
                            <p className="ai-summary-block text-lg md:text-xl lg:text-2xl text-gray-600 mb-6 max-w-3xl mx-auto animate-slide-up leading-relaxed font-medium" style={{ animationDelay: '0.2s' }}>
                                {category.description}
                            </p>

                            {/* AI Definition Block — structured for extraction */}
                            <div className="ai-definition-block text-base md:text-lg text-gray-500 mb-10 max-w-2xl mx-auto animate-slide-up italic border-l-4 border-blue-500 pl-4 py-1 text-left" style={{ animationDelay: '0.25s' }}>
                                <strong className="not-italic text-gray-700">Definition:</strong> {category.definitionBlock}
                            </div>

                            {/* CTAs */}
                            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.3s' }}>
                                <Link href="/signup">
                                    <Button size="lg" className="group w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 rounded-md px-8 h-14 text-base md:px-10 md:h-16 md:text-lg font-semibold transition-all duration-300">
                                        Explore Solutions <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </Link>
                                <Link href="/#contact-form">
                                    <Button size="lg" variant="outline" className="w-full sm:w-auto text-gray-700 border-gray-300 bg-white hover:bg-gray-50 rounded-md px-8 h-14 text-base md:px-10 md:h-16 md:text-lg font-semibold transition-all duration-300 group shadow-sm">
                                        Speak to an Expert
                                    </Button>
                                </Link>
                            </div>

                            {/* Hero Image */}
                            {category.image && (
                                <div className="mt-14 md:mt-20 w-full max-w-4xl lg:max-w-5xl mx-auto animate-slide-up px-2 sm:px-0" style={{ animationDelay: '0.4s' }}>
                                    <div className="relative w-full overflow-hidden shadow-2xl rounded-xl md:rounded-2xl border border-gray-200/50 bg-gray-100 flex items-center justify-center aspect-[16/9] bg-gradient-to-br from-gray-50 to-gray-200">
                                        {category.image.includes('unsplash') || category.image.includes('placeholder') ? (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <CategoryIcon className={`w-32 h-32 ${category.accentColor.text} opacity-20 mb-6 drop-shadow-xl animate-float`} />
                                                <div className="glass-panel px-8 py-6 rounded-2xl flex items-center gap-4 border border-white/50 shadow-xl backdrop-blur-md bg-white/40">
                                                    <div className={`w-16 h-16 rounded-xl ${category.accentColor.bg} flex items-center justify-center shadow-inner`}>
                                                        <CategoryIcon className={`w-8 h-8 ${category.accentColor.text}`} />
                                                    </div>
                                                    <div>
                                                        <div className="text-xl font-bold text-gray-900">{category.name} Dashboard</div>
                                                        <div className="text-sm font-medium text-gray-500">Comprehensive Management Suite</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <img src={category.image} alt={`${category.name} software dashboard by Vyora — complete management suite`} className="w-full aspect-[16/9] object-cover object-top" loading="eager" />
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* ===== 2. AI ANSWER BOX — "What is {Category} Software?" ===== */}
                <section className="py-16 md:py-20 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden">
                    <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8">
                        <article className="ai-answer-box" itemScope itemType="https://schema.org/Article">
                            <header>
                                <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                    What Is{' '}
                                    <span className="relative inline-block whitespace-nowrap">
                                        <span className={category.accentColor.text}>{category.name}</span>
                                        <YellowUnderline />
                                    </span>{' '}
                                    Software?
                                </h2>
                            </header>
                            <div className="prose prose-lg max-w-none" itemProp="articleBody">
                                <p className="text-gray-700 text-lg leading-relaxed mb-6 font-medium">
                                    {category.name} software is a specialized business management platform designed to digitize and streamline operations for {category.name.toLowerCase()} businesses. {category.definitionBlock}
                                </p>
                                <div className="bg-blue-50 rounded-2xl p-6 md:p-8 border border-blue-100">
                                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <Lightbulb className="w-5 h-5 text-blue-600" />
                                        Key Capabilities at a Glance
                                    </h3>
                                    <ul className="grid md:grid-cols-2 gap-3">
                                        {combinedFeatures.slice(0, 6).map((f, i) => (
                                            <li key={i} className="flex items-start gap-2 text-gray-700 font-medium">
                                                <CheckCircle2 className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                                                <span><strong>{f.title}</strong> — {f.description}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </article>
                    </div>
                </section>

                {/* ===== 3. "Why Do Businesses Need?" — Direct Question H2 ===== */}
                <section className="py-16 md:py-20 bg-gray-50 relative overflow-hidden">
                    <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8">
                        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-8" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            Why Do{' '}
                            <span className="relative inline-block whitespace-nowrap">
                                <span className={category.accentColor.text}>{category.name}</span>
                                <YellowUnderline />
                            </span>{' '}
                            Businesses Need Software?
                        </h2>
                        <p className="text-lg text-gray-600 font-medium mb-8 leading-relaxed">
                            Modern {category.name.toLowerCase()} businesses face increasing competition, rising customer expectations, and complex operational demands. Without the right software tools, businesses struggle with inefficiency, revenue leakage, and inconsistent customer experiences.
                        </p>
                        <div className="grid md:grid-cols-2 gap-6">
                            {(category.bulletFacts || []).slice(0, 4).map((fact, index) => (
                                <div key={index} className="flex items-start gap-3 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                                    <div className={`mt-0.5 shadow-sm rounded-full bg-white p-0.5 ${category.accentColor.text} flex-shrink-0`}>
                                        <CheckCircle2 className="w-5 h-5 fill-current border-none" stroke="white" />
                                    </div>
                                    <p className="text-gray-700 font-medium text-base leading-snug">{fact}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ===== 4. STATS ===== */}
                {category.stats && category.stats.length > 0 && (
                    <section className="pt-8 pb-20 md:pt-12 md:pb-28 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden">
                        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative z-10">
                            <div className="flex flex-col items-center text-center mb-16 md:mb-20 animate-slide-up">
                                <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-black tracking-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                    Industry{' '}
                                    <span className="relative inline-block whitespace-nowrap">
                                        Impact
                                        <YellowUnderline />
                                    </span>
                                </h2>
                                <p className="text-lg text-gray-600 font-medium mt-4 max-w-2xl">Measurable results that {category.name.toLowerCase()} businesses achieve with the Vyora platform.</p>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
                                {category.stats.map((stat, i) => (
                                    <div key={i} className="group relative bg-white/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 lg:p-10 shadow-xl shadow-gray-200/40 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-white/60 animate-slide-up" style={{ animationDelay: `${i * 0.15}s` }}>
                                        <div className={`absolute inset-0 rounded-3xl ${category.accentColor.bg} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                                        <div className="relative z-10 flex flex-col items-center text-center">
                                            <span className={`text-4xl md:text-5xl font-extrabold ${category.accentColor.text} mb-2`}>{stat.value}</span>
                                            <span className="text-sm md:text-base font-medium text-gray-600">{stat.label}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* ===== 5. BULLET FACTS / WHY UPGRADE ===== */}
                {category.bulletFacts && category.bulletFacts.length > 0 && (
                    <section className="py-20 bg-white relative overflow-hidden">
                        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
                            <div className="grid md:grid-cols-2 gap-12 items-center">
                                <div>
                                    <h2 className="text-3xl md:text-4xl font-extrabold text-black tracking-tight mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                        How Does Vyora Help
                                        <br />
                                        <span className="relative inline-block whitespace-nowrap mt-2">
                                            <span className={category.accentColor.text}>{category.name}</span>
                                            <YellowUnderline />
                                        </span> Businesses?
                                    </h2>
                                    <p className="text-lg text-gray-600 mb-8 font-medium leading-relaxed">
                                        Vyora delivers a complete operations suite that automates manual work, protects revenue, and elevates the customer experience for {category.name.toLowerCase()} businesses.
                                    </p>

                                    <div className="space-y-4">
                                        {category.bulletFacts.map((fact, index) => (
                                            <div key={index} className="flex items-start gap-3">
                                                <div className={`mt-1 shadow-sm rounded-full bg-white p-0.5 ${category.accentColor.text} flex-shrink-0`}>
                                                    <CheckCircle2 className="w-5 h-5 fill-current border-none" stroke="white" />
                                                </div>
                                                <p className="text-gray-700 font-medium text-lg leading-snug">{fact}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-10">
                                        <Link href="/signup">
                                            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg rounded-md px-8 h-14 text-base font-semibold hover:shadow-xl hover:-translate-y-1 transition-all">
                                                Start Modernizing Today <ArrowRight className="w-5 h-5 ml-2" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>

                                <div className="relative hidden md:block">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-gray-50 to-gray-100 rounded-[2rem] transform rotate-3 scale-105 border border-gray-200"></div>
                                    <div className="relative bg-white rounded-3xl p-8 shadow-2xl border border-gray-100 flex flex-col gap-6">
                                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-12 h-12 rounded-xl ${category.accentColor.bg} flex items-center justify-center`}>
                                                    <CategoryIcon className={`w-6 h-6 ${category.accentColor.text}`} />
                                                </div>
                                                <div className="font-bold text-gray-800 text-lg">Performance Metrics</div>
                                            </div>
                                            <div className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold font-mono">+42%</div>
                                        </div>

                                        <div className="space-y-4">
                                            {[1, 2, 3].map((item) => (
                                                <div key={item} className="w-full bg-gray-50 rounded-xl p-4 flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center">
                                                        <Activity className="w-5 h-5 text-gray-400" />
                                                    </div>
                                                    <div className="flex-1 space-y-2">
                                                        <div className="w-1/3 h-2 bg-gray-200 rounded-full"></div>
                                                        <div className="w-2/3 h-2 bg-gray-100 rounded-full"></div>
                                                    </div>
                                                    <div className="w-12 h-6 bg-blue-50 rounded text-[10px] font-bold text-blue-600 flex items-center justify-center">Opt</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* ===== 6. PRODUCTS & SERVICES GRID ===== */}
                <section className="py-20 md:py-28 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
                    <div className="absolute inset-0 max-w-7xl mx-auto -z-10">
                        <div className={`absolute top-32 right-20 w-80 h-80 ${category.accentColor.bg} rounded-full blur-3xl opacity-50`} />
                        <div className="absolute bottom-20 left-16 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-50" />
                    </div>

                    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative z-10">
                        <div className="text-center max-w-3xl mx-auto mb-20">
                            <h2 className="text-4xl md:text-5xl font-extrabold text-black tracking-tight mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                How Vyora Helps Your{' '}
                                <span className="relative inline-block whitespace-nowrap">
                                    {category.name}
                                    <YellowUnderline />
                                </span>{' '}Business
                            </h2>
                            <p className="text-lg text-gray-600 font-medium">Vyora provides specialized software products and service modules built specifically for {category.name.toLowerCase()} businesses — from billing and inventory to marketing and customer management.</p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                            {combinedFeatures.map((feature, i) => {
                                const DynIcon = iconCycle[i % iconCycle.length];
                                // Match card to a relevant tool slug for CTA
                                const featureToolMap: Record<string, string> = {
                                    'billing': 'hisab-kitab-management', 'invoicing': 'hisab-kitab-management', 'accounting': 'hisab-kitab-management', 'gst': 'hisab-kitab-management',
                                    'inventory': 'smart-stock-management', 'stock': 'smart-stock-management',
                                    'website': 'free-business-website', 'online presence': 'free-business-website', 'digital': 'free-business-website',
                                    'crm': 'customer-management', 'customer': 'customer-management', 'loyalty': 'customer-management',
                                    'lead': 'unlimited-lead-management', 'marketing': 'bulk-marketing-software',
                                    'catalogue': 'automagic-catalogue-creation', 'menu': 'automagic-catalogue-creation',
                                    'employee': 'employee-management', 'staff': 'employee-management', 'attendance': 'employee-management', 'payroll': 'employee-management',
                                    'payment': 'payment-gateway', 'upi': 'payment-gateway',
                                    'support': 'customer-support', 'helpdesk': 'customer-support',
                                    'banner': 'free-marketing-sales-banner', 'poster': 'daily-greeting-poster',
                                };
                                const matchKey = Object.keys(featureToolMap).find(k => feature.title.toLowerCase().includes(k));
                                const toolSlug = matchKey ? featureToolMap[matchKey] : 'free-business-website';

                                return (
                                    <div key={i} className="flex flex-col h-full bg-white rounded-3xl p-8 shadow-xl shadow-gray-200/50 border border-gray-100 hover:shadow-2xl hover:border-gray-200 hover:-translate-y-2 transition-all duration-300">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className={`w-14 h-14 rounded-2xl ${feature.type === 'product' ? 'bg-blue-50 text-blue-600' : category.accentColor.bg + ' ' + category.accentColor.text} flex items-center justify-center shadow-inner`}>
                                                <DynIcon className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <span className={`text-xs font-bold tracking-wider uppercase ${feature.type === 'product' ? 'text-blue-500' : category.accentColor.text}`}>
                                                    {feature.type === 'product' ? 'Software Product' : 'Service Module'}
                                                </span>
                                                <h3 className="text-xl font-bold text-gray-900 leading-tight">{feature.title}</h3>
                                            </div>
                                        </div>

                                        <p className="text-gray-600 font-medium leading-relaxed mb-5 flex-grow">{feature.description}</p>

                                        {feature.subs && feature.subs.length > 0 && (
                                            <div className="pt-5 border-t border-gray-100 mb-5">
                                                <h4 className="text-sm border-b border-gray-100 pb-2 mb-3 font-semibold text-gray-900">How Vyora Helps:</h4>
                                                <ul className="grid grid-cols-1 gap-1.5">
                                                    {feature.subs.slice(0, 5).map((sub, idx) => (
                                                        <li key={idx} className="flex items-center text-sm text-gray-600 font-medium">
                                                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mr-2 flex-shrink-0" />
                                                            {sub}
                                                        </li>
                                                    ))}
                                                    {feature.subs.length > 5 && (
                                                        <li className="text-xs text-gray-400 font-medium italic pt-1">
                                                            + {feature.subs.length - 5} more capabilities...
                                                        </li>
                                                    )}
                                                </ul>
                                            </div>
                                        )}

                                        <div className="mt-auto">
                                            <Link href={`/app/${toolSlug}`}>
                                                <span className="inline-flex items-center text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer group">
                                                    Get Started Free
                                                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                                                </span>
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* ===== 7. COMPARISON TABLE ===== */}
                {category.comparisonTable && category.comparisonTable.length > 0 && (
                    <section className="py-20 bg-white border-y border-gray-100">
                        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
                            <div className="text-center max-w-3xl mx-auto mb-16">
                                <h2 className="text-3xl md:text-5xl font-extrabold text-black tracking-tight mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                    How Does Vyora Compare to{' '}
                                    <span className="relative inline-block whitespace-nowrap">
                                        Alternatives
                                        <YellowUnderline />
                                    </span>?
                                </h2>
                                <p className="text-lg text-gray-600 font-medium">See how Vyora's specialized tools for {category.name.toLowerCase()} businesses compare to other methods.</p>
                            </div>

                            <div className="overflow-x-auto rounded-2xl shadow-xl border border-gray-200">
                                <table className="w-full text-left border-collapse min-w-[800px]">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-200">
                                            <th className="py-5 px-6 font-bold text-gray-900 text-lg w-1/4">Capability</th>
                                            <th className="py-5 px-6 w-1/4 border-x border-gray-200 relative bg-blue-50/50">
                                                <div className="absolute top-0 left-0 w-full h-1 bg-blue-600"></div>
                                                <div className="flex items-center gap-2 text-blue-700 font-extrabold text-xl">
                                                    <Sparkles className="w-5 h-5" /> Vyora Platform
                                                </div>
                                            </th>
                                            <th className="py-5 px-6 font-semibold text-gray-600 w-1/4">Traditional Software</th>
                                            <th className="py-5 px-6 font-semibold text-gray-600 w-1/4">Manual / Pen & Paper</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {category.comparisonTable.map((row, i) => (
                                            <tr key={i} className={`hover:bg-gray-50/50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                                                <td className="py-4 px-6 font-semibold text-gray-800">{row.feature}</td>
                                                <td className="py-4 px-6 font-medium text-gray-900 border-x border-gray-200 bg-blue-50/30 flex items-start gap-2">
                                                    <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                                    {row.vyora}
                                                </td>
                                                <td className="py-4 px-6 text-gray-600 text-sm font-medium">{row.traditional}</td>
                                                <td className="py-4 px-6 text-gray-500 text-sm">{row.manual}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>
                )}

                {/* ===== 8. TESTIMONIALS ===== */}
                {category.testimonials && category.testimonials.length > 0 && (
                    <section className="py-20 md:py-28 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
                        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative z-10">
                            <div className="text-center max-w-3xl mx-auto mb-16">
                                <h2 className="text-4xl md:text-5xl font-extrabold text-black tracking-tight mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                    What Do {category.name}{' '}
                                    <span className="relative inline-block whitespace-nowrap">
                                        Owners Say
                                        <YellowUnderline />
                                    </span>?
                                </h2>
                                <p className="text-lg text-gray-600 font-medium">Hear from business owners in your industry who transformed their operations with Vyora.</p>
                            </div>

                            {/* First row: 3 testimonials */}
                            <div className="grid md:grid-cols-3 gap-6 lg:gap-8 mb-8">
                                {visibleTestimonials.map((t, i) => (
                                    <div key={i} className="group relative bg-white/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-xl shadow-gray-200/40 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-white/60" itemScope itemType="https://schema.org/Review">
                                        <div className="flex items-center gap-1 mb-4">
                                            {[...Array(t.rating)].map((_, s) => <Star key={s} className="w-5 h-5 text-amber-400 fill-amber-400" />)}
                                        </div>
                                        <Quote className="w-8 h-8 text-gray-200 mb-3" />
                                        <p className="text-gray-700 text-base leading-relaxed mb-6 font-medium" itemProp="reviewBody">{t.content}</p>
                                        <div className="flex items-center justify-between border-t border-gray-100 pt-5">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-11 h-11 rounded-full ${category.accentColor.highlight} flex items-center justify-center text-white font-bold text-base shadow-lg`}>{t.initial}</div>
                                                <div>
                                                    <div className="text-gray-900 font-bold text-sm" itemProp="author">{t.name}</div>
                                                    <div className="text-gray-500 text-xs">{t.role}</div>
                                                    <div className="text-gray-400 text-xs flex items-center gap-1"><MapPin className="w-3 h-3" />{t.location}</div>
                                                </div>
                                            </div>
                                            <div className={`px-3 py-1.5 rounded-full ${category.accentColor.bg} ${category.accentColor.text} text-xs font-bold`}>{t.metric}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Remaining testimonials */}
                            {remainingTestimonials.length > 0 && (
                                <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {remainingTestimonials.map((t, i) => (
                                        <div key={i + 3} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                            <div className="flex items-center gap-1 mb-3">
                                                {[...Array(t.rating)].map((_, s) => <Star key={s} className="w-4 h-4 text-amber-400 fill-amber-400" />)}
                                            </div>
                                            <p className="text-gray-600 text-sm leading-relaxed mb-4 italic line-clamp-4">"{t.content}"</p>
                                            <div className="flex flex-col mt-auto pt-4">
                                                <div className="text-gray-900 font-bold text-sm">{t.name}</div>
                                                <div className="text-gray-500 text-xs">{t.role}, {t.location}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* ===== 9. FAQ ===== */}
                <section className="py-20 md:py-28 bg-white border-t border-gray-100">
                    <div className="max-w-4xl mx-auto px-4 md:px-6">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl font-extrabold text-black tracking-tight mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                Frequently Asked{' '}
                                <span className="relative inline-block whitespace-nowrap">
                                    Questions
                                    <YellowUnderline />
                                </span>
                            </h2>
                            <p className="text-lg text-gray-600 font-medium">Common questions about Vyora's {category.name.toLowerCase()} software solutions — answered clearly.</p>
                        </div>
                        {category.faqs && category.faqs.length > 0 && (
                            <div className="space-y-4">
                                {category.faqs.map((faq, index) => (
                                    <div key={index}
                                        className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm hover:shadow-md border border-gray-200 overflow-hidden transition-all duration-300">
                                        <button onClick={() => setOpenFaq(openFaq === index ? null : index)}
                                            className="w-full flex items-center justify-between p-6 text-left">
                                            <span className="text-lg font-bold text-gray-800 pr-4">
                                                {faq.q}
                                            </span>
                                            <div className={`w-8 h-8 rounded-lg ${category.accentColor.bg} flex items-center justify-center flex-shrink-0 transition-transform duration-300 ${openFaq === index ? 'rotate-180' : ''}`}>
                                                <ChevronDown className={`w-5 h-5 ${category.accentColor.text}`} />
                                            </div>
                                        </button>
                                        <AnimatePresence>
                                            {openFaq === index && (
                                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
                                                    <div className="px-6 pb-6 text-gray-600 text-base leading-relaxed font-medium border-t border-gray-100 pt-4">
                                                        {faq.a}
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

                {/* ===== 10. CROSS-LINK TO TOOLS — Internal Authority Graph ===== */}
                {relevantTools.length > 0 && (
                    <section className="py-16 md:py-20 bg-gray-50 border-t border-gray-200">
                        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
                            <div className="mb-12">
                                <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                    Explore Vyora's Business{' '}
                                    <span className="relative inline-block whitespace-nowrap">
                                        Tools
                                        <YellowUnderline />
                                    </span>
                                </h2>
                                <p className="text-gray-600 font-medium">These tools power {category.name.toLowerCase()} and other businesses on the Vyora platform.</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {relevantTools.map((tool, idx) => {
                                    const ToolIcon = tool.icon;
                                    return (
                                        <Link key={idx} href={`/app/${tool.slug}`}>
                                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                                        <ToolIcon className="w-5 h-5 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors text-sm">{tool.title}</span>
                                                        <p className="text-xs text-gray-500 line-clamp-1">{tool.subtitle}</p>
                                                    </div>
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </section>
                )}

                {/* ===== 11. INTERNAL LINKING / RELATED CATEGORIES ===== */}
                {relatedLinks.length > 0 && (
                    <section className="py-20 bg-white border-t border-gray-200">
                        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
                            <div className="mb-12">
                                <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                    Explore Related Industries
                                </h2>
                                <p className="text-gray-600">Discover how other business sectors leverage Vyora's specialized software suites.</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {relatedLinks.map((rel, idx) => {
                                    const RelIcon = rel.icon;
                                    return (
                                        <Link key={idx} href={`/category/${rel.slug}`}>
                                            <div className="bg-gray-50 p-5 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-lg ${rel.accentColor.bg} flex items-center justify-center`}>
                                                        <RelIcon className={`w-5 h-5 ${rel.accentColor.text}`} />
                                                    </div>
                                                    <span className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{rel.name}</span>
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </section>
                )}

                {/* ===== 12. COMPLETE PRODUCT & SERVICE DIRECTORY ===== */}
                {categoryTaxonomyMap[slug] && (
                    <section className="py-20 bg-white border-t border-gray-100">
                        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
                            <div className="text-center max-w-3xl mx-auto mb-16">
                                <h2 className="text-3xl md:text-5xl font-extrabold text-black tracking-tight mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                    Complete{' '}
                                    <span className="relative inline-block whitespace-nowrap">
                                        {category.name}
                                        <YellowUnderline />
                                    </span>{' '}Directory
                                </h2>
                                <p className="text-lg text-gray-600 font-medium">
                                    Explore every product and service category available for {category.name.toLowerCase()} businesses on Vyora's platform.
                                </p>
                            </div>

                            {/* ── PRODUCTS ── */}
                            {categoryTaxonomyMap[slug].products.length > 0 && (
                                <div className="mb-16">
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className={`w-10 h-10 rounded-xl ${category.accentColor.bg} flex items-center justify-center`}>
                                            <ShoppingBag className={`w-5 h-5 ${category.accentColor.text}`} />
                                        </div>
                                        <h3 className="text-2xl font-extrabold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                            Products for {category.name}
                                        </h3>
                                    </div>
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {categoryTaxonomyMap[slug].products.map((group, gi) => (
                                            <div key={gi} className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:border-gray-200 transition-colors">
                                                <h4 className="text-base font-bold text-gray-900 mb-4 pb-3 border-b border-gray-200">
                                                    {group.name}
                                                </h4>
                                                <ul className="space-y-2">
                                                    {group.items.map((item, ii) => (
                                                        <li key={ii}>
                                                            <Link
                                                                href={`/category/${slug}?product=${encodeURIComponent(item.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))}`}
                                                                className="text-sm text-gray-600 hover:text-blue-600 font-medium transition-colors flex items-center gap-2 group"
                                                            >
                                                                <span className="w-1.5 h-1.5 rounded-full bg-gray-300 group-hover:bg-blue-500 transition-colors flex-shrink-0" />
                                                                {item}
                                                            </Link>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── SERVICES ── */}
                            {categoryTaxonomyMap[slug].services.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className={`w-10 h-10 rounded-xl ${category.accentColor.bg} flex items-center justify-center`}>
                                            <Settings className={`w-5 h-5 ${category.accentColor.text}`} />
                                        </div>
                                        <h3 className="text-2xl font-extrabold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                            Services for {category.name}
                                        </h3>
                                    </div>
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {categoryTaxonomyMap[slug].services.map((group, gi) => (
                                            <div key={gi} className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:border-gray-200 transition-colors">
                                                <h4 className="text-base font-bold text-gray-900 mb-4 pb-3 border-b border-gray-200">
                                                    {group.name}
                                                </h4>
                                                <ul className="space-y-2">
                                                    {group.items.map((item, ii) => (
                                                        <li key={ii}>
                                                            <Link
                                                                href={`/category/${slug}?service=${encodeURIComponent(item.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))}`}
                                                                className="text-sm text-gray-600 hover:text-blue-600 font-medium transition-colors flex items-center gap-2 group"
                                                            >
                                                                <span className="w-1.5 h-1.5 rounded-full bg-gray-300 group-hover:bg-blue-500 transition-colors flex-shrink-0" />
                                                                {item}
                                                            </Link>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* ===== 13. BOTTOM CTA ===== */}
                <section className="py-24 px-4 md:px-6 lg:px-8 bg-white">
                    <div className={`max-w-6xl mx-auto relative overflow-hidden rounded-3xl ${category.accentColor.highlight || 'bg-blue-600'} shadow-2xl`}>
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/20 rounded-full blur-[100px] translate-x-1/3 -translate-y-1/3" />
                        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-black/10 rounded-full blur-[80px] -translate-x-1/2 translate-y-1/2" />
                        <div className="relative z-10 p-12 md:p-24 flex flex-col items-center text-center">
                            <h3 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-white mb-4 tracking-tight max-w-4xl" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                Ready to Transform Your {category.name} Business?
                            </h3>
                            <p className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl font-medium">
                                Deploy Vyora's full suite of {category.name.toLowerCase()} software today. Free to start, no credit card required.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link href="/signup">
                                    <Button size="lg" className="group w-full sm:w-auto bg-white text-gray-900 hover:bg-gray-50 rounded-md h-16 px-10 text-xl font-semibold transition-all duration-300 shadow-xl">
                                        Start your Free Trial <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </Link>
                                <Link href="/#contact-form">
                                    <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-md h-16 px-10 text-xl font-semibold border-2 border-white/40 text-white hover:border-white hover:bg-white/10 transition-all duration-300">
                                        Request Custom Demo
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* ===== SEO FOOTER LINKS ===== */}
            <SeoFooterLinks pageType="category" currentSlug={slug} currentTitle={category.name} />

            <PublicFooter />
        </div>
    );
}
