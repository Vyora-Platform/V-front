import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { toolsData } from "@/lib/tools-data";
import { PublicHeader } from "@/components/public-header";
import {
    ArrowRight, ChevronRight, Globe, BarChart, FileText,
    Users, Package, CreditCard, Calendar, Send, Image,
    Headphones, Sparkles, Settings
} from "lucide-react";

const iconMap: Record<string, any> = {
    Globe, BarChart, FileText, Users, Package, CreditCard,
    Calendar, Send, Image, Headphones, Sparkles, Settings
};

export default function ToolsIndex() {
    const [, setLocation] = useLocation();

    useEffect(() => {
        document.title = "All Business Tools & Software | Vyora App Suite";
        const meta = document.querySelector('meta[name="description"]');
        if (meta) meta.setAttribute("content", "Explore Vyora's complete suite of 12+ free business tools. Website builder, CRM, billing, inventory, employee management, and more.");

        // JSON-LD
        let schema = document.getElementById("tools-index-schema");
        if (!schema) {
            schema = document.createElement("script");
            schema.id = "tools-index-schema";
            schema.setAttribute("type", "application/ld+json");
            schema.textContent = JSON.stringify({
                "@context": "https://schema.org",
                "@type": "CollectionPage",
                name: "Vyora Business Tools",
                description: "Complete suite of free business management tools",
                url: "https://vyora.club/tools",
                mainEntity: {
                    "@type": "ItemList",
                    numberOfItems: toolsData.length,
                    itemListElement: toolsData.map((tool, i) => ({
                        "@type": "ListItem",
                        position: i + 1,
                        name: tool.title,
                        url: `https://vyora.club/app/${tool.slug}`
                    }))
                }
            });
            document.head.appendChild(schema);
        }
        return () => {
            const existing = document.getElementById("tools-index-schema");
            if (existing) existing.remove();
        };
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            <PublicHeader />

            {/* Breadcrumb */}
            <nav className="max-w-7xl mx-auto px-4 md:px-6 pt-24 pb-2" aria-label="Breadcrumb">
                <ol className="flex items-center gap-1.5 text-sm text-gray-500">
                    <li><Link href="/" className="hover:text-blue-600 transition-colors">Home</Link></li>
                    <li><ChevronRight className="w-3.5 h-3.5" /></li>
                    <li className="text-gray-900 font-medium">Tools</li>
                </ol>
            </nav>

            {/* Hero */}
            <section className="max-w-7xl mx-auto px-4 md:px-6 pt-8 pb-12">
                <div className="text-center max-w-3xl mx-auto">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 tracking-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        All Business{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                            Tools & Software
                        </span>
                    </h1>
                    <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
                        Everything your business needs in one unified platform. From website building to CRM, billing to marketing — explore our complete suite of <strong>{toolsData.length}+</strong> free business management tools.
                    </p>
                </div>
            </section>

            {/* Tools Grid */}
            <section className="max-w-7xl mx-auto px-4 md:px-6 pb-20">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                    {toolsData.map((tool, idx) => (
                        <article
                            key={tool.slug}
                            className="group relative bg-white rounded-2xl border border-gray-200 p-6 md:p-8 hover:shadow-xl hover:border-blue-200 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                            onClick={() => setLocation(`/app/${tool.slug}`)}
                        >
                            <div className="flex items-start gap-4 mb-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
                                    <Settings className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                        {tool.title}
                                    </h2>
                                    {tool.metaTitle && (
                                        <p className="text-sm text-gray-500 mt-0.5 truncate">{tool.metaTitle.split('|')[0].trim()}</p>
                                    )}
                                </div>
                            </div>

                            <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">
                                {tool.description}
                            </p>

                            {/* Feature pills */}
                            {tool.features && tool.features.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mb-4">
                                    {tool.features.slice(0, 3).map((feat: string, i: number) => (
                                        <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-medium">
                                            {feat}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <div className="flex items-center text-blue-600 font-semibold text-sm group-hover:gap-2 transition-all">
                                Explore Tool <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </article>
                    ))}
                </div>
            </section>

            {/* CTA Section */}
            <section className="bg-gradient-to-r from-blue-600 to-indigo-700 py-16">
                <div className="max-w-4xl mx-auto px-4 text-center text-white">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Grow Your Business?</h2>
                    <p className="text-blue-100 text-lg mb-8">Get started for free — no credit card required. All tools, unlimited usage.</p>
                    <Link href="/signup">
                        <button className="bg-white text-blue-600 font-bold px-8 py-4 rounded-xl text-lg hover:bg-blue-50 transition-colors shadow-xl">
                            Get Started Free <ArrowRight className="w-5 h-5 inline ml-2" />
                        </button>
                    </Link>
                </div>
            </section>
        </div>
    );
}
