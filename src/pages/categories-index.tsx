import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { categoriesData } from "@/lib/categories-data";
import { PublicHeader } from "@/components/public-header";
import { ArrowRight, ChevronRight } from "lucide-react";

export default function CategoriesIndex() {
    const [, setLocation] = useLocation();

    useEffect(() => {
        document.title = "Business Categories We Serve | Vyora for Every Industry";
        const meta = document.querySelector('meta[name="description"]');
        if (meta) meta.setAttribute("content", "Vyora serves 30+ business categories across India. Restaurants, retail, healthcare, fitness, salons, education, and more. Find your industry solution.");

        // JSON-LD
        let schema = document.getElementById("categories-index-schema");
        if (!schema) {
            schema = document.createElement("script");
            schema.id = "categories-index-schema";
            schema.setAttribute("type", "application/ld+json");
            schema.textContent = JSON.stringify({
                "@context": "https://schema.org",
                "@type": "CollectionPage",
                name: "Business Categories",
                description: "Vyora serves 30+ industries across India",
                url: "https://vyora.club/categories",
                mainEntity: {
                    "@type": "ItemList",
                    numberOfItems: categoriesData.length,
                    itemListElement: categoriesData.map((cat, i) => ({
                        "@type": "ListItem",
                        position: i + 1,
                        name: cat.name,
                        url: `https://vyora.club/category/${cat.slug}`
                    }))
                }
            });
            document.head.appendChild(schema);
        }
        return () => {
            const existing = document.getElementById("categories-index-schema");
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
                    <li className="text-gray-900 font-medium">Categories</li>
                </ol>
            </nav>

            {/* Hero */}
            <section className="max-w-7xl mx-auto px-4 md:px-6 pt-8 pb-12">
                <div className="text-center max-w-3xl mx-auto">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 tracking-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Built for{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                            Every Industry
                        </span>
                    </h1>
                    <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
                        From restaurants to real estate, healthcare to education — Vyora powers <strong>{categoriesData.length}+</strong> business categories with industry-specific tools and workflows.
                    </p>
                </div>
            </section>

            {/* Categories Grid */}
            <section className="max-w-7xl mx-auto px-4 md:px-6 pb-20">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {categoriesData.map((cat) => {
                        const Icon = cat.icon;
                        return (
                            <article
                                key={cat.slug}
                                className="group relative overflow-hidden bg-white rounded-2xl border border-gray-200 hover:shadow-xl hover:border-blue-200 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                                onClick={() => setLocation(`/category/${cat.slug}`)}
                            >
                                {/* Image header */}
                                <div className="relative h-36 overflow-hidden">
                                    <img
                                        src={cat.image}
                                        alt={cat.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        loading="lazy"
                                        width="400"
                                        height="144"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                                    <div className="absolute bottom-3 left-3 right-3">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center`}>
                                                <Icon className="w-4 h-4 text-white" />
                                            </div>
                                            <h2 className="text-white font-bold text-sm truncate">{cat.name}</h2>
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-4">
                                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-2 mb-3">
                                        {cat.subtitle}
                                    </p>

                                    {/* Stats */}
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {cat.stats.slice(0, 2).map((stat, i) => (
                                            <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold">
                                                {stat.value} {stat.label}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="flex items-center text-blue-600 font-semibold text-sm group-hover:gap-2 transition-all">
                                        Explore <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </section>

            {/* CTA Section */}
            <section className="bg-gradient-to-r from-blue-600 to-indigo-700 py-16">
                <div className="max-w-4xl mx-auto px-4 text-center text-white">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Don't See Your Industry?</h2>
                    <p className="text-blue-100 text-lg mb-8">Vyora is flexible enough for any business. Get started free and customize it for your needs.</p>
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
