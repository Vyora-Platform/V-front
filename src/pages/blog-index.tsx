import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { blogPosts } from "@/lib/blog-data";
import { PublicHeader } from "@/components/public-header";
import { ArrowRight, ChevronRight, Calendar, Clock, Tag } from "lucide-react";

export default function BlogIndex() {
    const [, setLocation] = useLocation();

    useEffect(() => {
        document.title = "Blog | Business Tips, Guides & Industry Insights | Vyora";
        const meta = document.querySelector('meta[name="description"]');
        if (meta) meta.setAttribute("content", "Read expert articles on business management, billing, CRM, digital marketing, and more. Practical tips for Indian small business owners.");

        // Blog schema
        let schema = document.getElementById("blog-index-schema");
        if (!schema) {
            schema = document.createElement("script");
            schema.id = "blog-index-schema";
            schema.setAttribute("type", "application/ld+json");
            schema.textContent = JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Blog",
                name: "Vyora Blog",
                description: "Business tips, guides & industry insights for Indian businesses",
                url: "https://vyora.club/blog",
                publisher: {
                    "@type": "Organization",
                    name: "Vyora",
                    url: "https://vyora.club"
                },
                blogPost: blogPosts.map(post => ({
                    "@type": "BlogPosting",
                    headline: post.title,
                    datePublished: post.datePublished,
                    url: `https://vyora.club/blog/${post.slug}`
                }))
            });
            document.head.appendChild(schema);
        }
        return () => {
            document.getElementById("blog-index-schema")?.remove();
        };
    }, []);

    // Featured post is the latest
    const featuredPost = blogPosts[0];
    const otherPosts = blogPosts.slice(1);

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            <PublicHeader />

            {/* Breadcrumb */}
            <nav className="max-w-7xl mx-auto px-4 md:px-6 pt-24 pb-2" aria-label="Breadcrumb">
                <ol className="flex items-center gap-1.5 text-sm text-gray-500">
                    <li><Link href="/" className="hover:text-blue-600 transition-colors">Home</Link></li>
                    <li><ChevronRight className="w-3.5 h-3.5" /></li>
                    <li className="text-gray-900 font-medium">Blog</li>
                </ol>
            </nav>

            {/* Hero */}
            <section className="max-w-7xl mx-auto px-4 md:px-6 pt-8 pb-12">
                <div className="text-center max-w-3xl mx-auto">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 tracking-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Vyora{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                            Blog
                        </span>
                    </h1>
                    <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
                        Expert guides, industry insights, and practical tips to help your Indian business thrive in 2025.
                    </p>
                </div>
            </section>

            {/* Featured Post */}
            <section className="max-w-7xl mx-auto px-4 md:px-6 pb-12">
                <article
                    className="group grid grid-cols-1 md:grid-cols-2 gap-6 bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all cursor-pointer"
                    onClick={() => setLocation(`/blog/${featuredPost.slug}`)}
                >
                    <div className="relative h-64 md:h-auto overflow-hidden">
                        <img
                            src={featuredPost.image}
                            alt={featuredPost.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="eager"
                            width="600"
                            height="400"
                        />
                        <div className="absolute top-4 left-4">
                            <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-blue-600 text-white">Featured</span>
                        </div>
                    </div>
                    <div className="p-6 md:p-8 flex flex-col justify-center">
                        <div className="flex items-center gap-3 mb-3 flex-wrap">
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
                                <Tag className="w-3 h-3 inline mr-1" />{featuredPost.category}
                            </span>
                            <span className="text-sm text-gray-500 flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(featuredPost.datePublished).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                            {featuredPost.title}
                        </h2>
                        <p className="text-gray-600 leading-relaxed mb-4">{featuredPost.excerpt}</p>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-500 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />{featuredPost.readTime}
                            </span>
                            <span className="text-blue-600 font-semibold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                                Read Article <ArrowRight className="w-4 h-4" />
                            </span>
                        </div>
                    </div>
                </article>
            </section>

            {/* All Posts Grid */}
            <section className="max-w-7xl mx-auto px-4 md:px-6 pb-20">
                <h2 className="text-2xl font-bold text-gray-900 mb-8" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    All Articles
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {otherPosts.map(post => (
                        <article
                            key={post.slug}
                            className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer hover:-translate-y-1"
                            onClick={() => setLocation(`/blog/${post.slug}`)}
                        >
                            <div className="relative h-48 overflow-hidden">
                                <img
                                    src={post.image}
                                    alt={post.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    loading="lazy"
                                    width="400"
                                    height="192"
                                />
                            </div>
                            <div className="p-5">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{post.category}</span>
                                    <span className="text-xs text-gray-400">
                                        {new Date(post.datePublished).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                </div>
                                <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                    {post.title}
                                </h3>
                                <p className="text-gray-600 text-sm leading-relaxed line-clamp-2 mb-3">
                                    {post.excerpt}
                                </p>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />{post.readTime}
                                    </span>
                                    <span className="text-blue-600 font-semibold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                                        Read <ArrowRight className="w-3.5 h-3.5" />
                                    </span>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="bg-gradient-to-r from-blue-600 to-indigo-700 py-16">
                <div className="max-w-4xl mx-auto px-4 text-center text-white">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Grow Your Business?</h2>
                    <p className="text-blue-100 text-lg mb-8">Join 12,000+ businesses using Vyora. Get started for free today.</p>
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
