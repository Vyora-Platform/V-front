import { useEffect, useMemo } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { blogPosts } from "@/lib/blog-data";
import { PublicHeader } from "@/components/public-header";
import { ChevronRight, Calendar, Clock, User, ArrowRight, ArrowLeft, Tag } from "lucide-react";

export default function BlogPage() {
    const [, params] = useRoute("/blog/:slug");
    const [, setLocation] = useLocation();
    const slug = params?.slug;

    const post = useMemo(() => blogPosts.find(p => p.slug === slug), [slug]);

    // Suggested posts
    const relatedPosts = useMemo(() => {
        if (!post) return [];
        return blogPosts.filter(p => p.slug !== slug).slice(0, 3);
    }, [post, slug]);

    useEffect(() => {
        if (!post) {
            document.title = "Blog Post Not Found | Vyora";
            return;
        }

        document.title = post.metaTitle;
        const meta = document.querySelector('meta[name="description"]');
        if (meta) meta.setAttribute("content", post.metaDescription);

        // Blog schema
        let schema = document.getElementById("blog-post-schema");
        if (!schema) {
            schema = document.createElement("script");
            schema.id = "blog-post-schema";
            schema.setAttribute("type", "application/ld+json");
        }
        schema.textContent = JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.title,
            description: post.metaDescription,
            datePublished: post.datePublished,
            dateModified: post.dateModified,
            author: {
                "@type": "Organization",
                name: "Vyora",
                url: "https://vyora.club"
            },
            publisher: {
                "@type": "Organization",
                name: "Vyora",
                logo: { "@type": "ImageObject", url: "https://vyora.club/logo.png" }
            },
            mainEntityOfPage: { "@type": "WebPage", "@id": `https://vyora.club/blog/${slug}` },
            image: post.image
        });
        if (!document.getElementById("blog-post-schema")) {
            document.head.appendChild(schema);
        }

        // FAQ schema
        if (post.faqs && post.faqs.length > 0) {
            let faqSchema = document.getElementById("blog-faq-schema");
            if (!faqSchema) {
                faqSchema = document.createElement("script");
                faqSchema.id = "blog-faq-schema";
                faqSchema.setAttribute("type", "application/ld+json");
            }
            faqSchema.textContent = JSON.stringify({
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: post.faqs.map(faq => ({
                    "@type": "Question",
                    name: faq.q,
                    acceptedAnswer: { "@type": "Answer", text: faq.a }
                }))
            });
            if (!document.getElementById("blog-faq-schema")) {
                document.head.appendChild(faqSchema);
            }
        }

        window.scrollTo(0, 0);

        return () => {
            document.getElementById("blog-post-schema")?.remove();
            document.getElementById("blog-faq-schema")?.remove();
        };
    }, [post, slug]);

    if (!post) {
        return (
            <div className="min-h-screen bg-white">
                <PublicHeader />
                <div className="max-w-3xl mx-auto px-4 pt-32 pb-20 text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Blog Post Not Found</h1>
                    <p className="text-gray-600 mb-8">The article you're looking for doesn't exist or may have been moved.</p>
                    <Link href="/blog">
                        <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                            <ArrowLeft className="w-4 h-4 inline mr-2" /> Browse All Articles
                        </button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <PublicHeader />

            {/* Breadcrumb */}
            <nav className="max-w-4xl mx-auto px-4 md:px-6 pt-24 pb-2" aria-label="Breadcrumb">
                <ol className="flex items-center gap-1.5 text-sm text-gray-500 flex-wrap">
                    <li><Link href="/" className="hover:text-blue-600 transition-colors">Home</Link></li>
                    <li><ChevronRight className="w-3.5 h-3.5" /></li>
                    <li><Link href="/blog" className="hover:text-blue-600 transition-colors">Blog</Link></li>
                    <li><ChevronRight className="w-3.5 h-3.5" /></li>
                    <li className="text-gray-900 font-medium truncate max-w-[200px]">{post.title}</li>
                </ol>
            </nav>

            {/* Article Header */}
            <header className="max-w-4xl mx-auto px-4 md:px-6 pt-8 pb-8">
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 text-blue-700">
                        <Tag className="w-3 h-3 inline mr-1" />{post.category}
                    </span>
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(post.datePublished).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />{post.readTime}
                    </span>
                </div>

                <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6 leading-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {post.title}
                </h1>

                <p className="text-lg text-gray-600 leading-relaxed mb-6">
                    {post.excerpt}
                </p>

                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                        V
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-gray-900">{post.author}</p>
                        <p className="text-xs text-gray-500">Updated {new Date(post.dateModified).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                    </div>
                </div>
            </header>

            {/* Featured Image */}
            <div className="max-w-4xl mx-auto px-4 md:px-6 mb-10">
                <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-[300px] md:h-[400px] object-cover rounded-2xl"
                    width="1200"
                    height="400"
                    loading="eager"
                    fetchPriority="high"
                />
            </div>

            {/* Article Content */}
            <article className="max-w-3xl mx-auto px-4 md:px-6 pb-12">
                <div
                    className="prose prose-lg prose-gray max-w-none
            prose-headings:font-bold prose-headings:text-gray-900
            prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
            prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
            prose-p:text-gray-700 prose-p:leading-relaxed
            prose-a:text-blue-600 prose-a:font-medium
            prose-li:text-gray-700
            prose-strong:text-gray-900
            prose-table:border-collapse prose-tr:border-b prose-td:p-3 prose-th:p-3 prose-th:text-left prose-th:bg-gray-50"
                    dangerouslySetInnerHTML={{ __html: formatContent(post.content) }}
                />
            </article>

            {/* FAQ Section */}
            {post.faqs && post.faqs.length > 0 && (
                <section className="max-w-3xl mx-auto px-4 md:px-6 pb-12">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Frequently Asked Questions
                    </h2>
                    <div className="space-y-4">
                        {post.faqs.map((faq, i) => (
                            <details key={i} className="group border border-gray-200 rounded-xl overflow-hidden">
                                <summary className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 transition-colors">
                                    <span className="font-semibold text-gray-900 pr-4">{faq.q}</span>
                                    <ChevronRight className="w-5 h-5 text-gray-400 group-open:rotate-90 transition-transform flex-shrink-0" />
                                </summary>
                                <div className="px-5 pb-5 text-gray-600 leading-relaxed">
                                    {faq.a}
                                </div>
                            </details>
                        ))}
                    </div>
                </section>
            )}

            {/* Related Tools */}
            {post.relatedTools && post.relatedTools.length > 0 && (
                <section className="max-w-3xl mx-auto px-4 md:px-6 pb-12">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 md:p-8 border border-blue-100">
                        <h3 className="text-xl font-bold text-gray-900 mb-3">Related Vyora Tools</h3>
                        <p className="text-gray-600 mb-4">Explore the tools mentioned in this article:</p>
                        <div className="flex flex-wrap gap-3">
                            {post.relatedTools.map(tool => (
                                <Link key={tool} href={`/app/${tool}`}>
                                    <button className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-blue-600 hover:text-white transition-all border border-blue-200 hover:border-blue-600">
                                        {tool.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} →
                                    </button>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
                <section className="max-w-4xl mx-auto px-4 md:px-6 pb-16">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        More Articles
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {relatedPosts.map(rPost => (
                            <article
                                key={rPost.slug}
                                className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer"
                                onClick={() => setLocation(`/blog/${rPost.slug}`)}
                            >
                                <img src={rPost.image} alt={rPost.title} className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" width="400" height="144" />
                                <div className="p-4">
                                    <span className="text-xs text-blue-600 font-semibold">{rPost.category}</span>
                                    <h3 className="font-bold text-gray-900 mt-1 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">{rPost.title}</h3>
                                    <p className="text-sm text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3" />{rPost.readTime}</p>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>
            )}

            {/* CTA */}
            <section className="bg-gradient-to-r from-blue-600 to-indigo-700 py-16">
                <div className="max-w-3xl mx-auto px-4 text-center text-white">
                    <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Business?</h2>
                    <p className="text-blue-100 text-lg mb-8">Get started for free — no credit card required.</p>
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

// Simple markdown-ish to HTML converter
function formatContent(content: string): string {
    let html = content.trim();

    // Tables
    html = html.replace(/^(\|.*\|)\n(\|[-:\s|]+\|)\n((?:\|.*\|\n?)*)/gm, (_match, headerRow: string, _separator: string, bodyRows: string) => {
        const headers = headerRow.split('|').filter((c: string) => c.trim()).map((c: string) => `<th>${c.trim()}</th>`).join('');
        const rows = bodyRows.trim().split('\n').map((row: string) => {
            const cells = row.split('|').filter((c: string) => c.trim()).map((c: string) => `<td>${c.trim()}</td>`).join('');
            return `<tr>${cells}</tr>`;
        }).join('');
        return `<table class="w-full border border-gray-200 rounded-lg overflow-hidden my-6"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
    });

    // Headers
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

    // Bold and italic
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

    // Unordered lists
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');

    // Numbered lists
    html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

    // Paragraphs
    html = html.split('\n\n').map(block => {
        const trimmed = block.trim();
        if (!trimmed) return '';
        if (trimmed.startsWith('<h') || trimmed.startsWith('<ul') || trimmed.startsWith('<ol') || trimmed.startsWith('<table') || trimmed.startsWith('<li')) return trimmed;
        return `<p>${trimmed}</p>`;
    }).join('\n');

    return html;
}
