import { useRoute } from "wouter";
import { Link } from "wouter";
import { Helmet } from "react-helmet";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { SeoFooterLinks } from "@/components/seo-footer-links";
import { TOOLS, INDUSTRIES, CITIES, SUBCITIES, isTool, isIndustry, isCity, isSubcity, isFeature } from "@/lib/seo-data";

export default function SeoPage({ params }: { params?: any }) {
  // Extract params based on wouter route matches
  const toolSlug = params?.tool || null;
  const industrySlug = params?.industry || null;
  const citySlug = params?.city || null;
  const subcitySlug = params?.subcity || null;
  const featureSlug = params?.feature || null;
  const genericSlug = params?.slug || null;
  
  // Resolve exact entities
  let tool = isTool(toolSlug || genericSlug);
  let industry = isIndustry(industrySlug || genericSlug);
  let city = isCity(citySlug || genericSlug);
  let subcity = isSubcity(subcitySlug || genericSlug);
  let feature = isFeature(featureSlug || genericSlug);

  // Cross-reference fallbacks for generic routes like /:tool/:slug2
  if (params?.slug2) {
    if (isIndustry(params.slug2)) industry = isIndustry(params.slug2);
    else if (isCity(params.slug2)) city = isCity(params.slug2);
    else if (isSubcity(params.slug2)) subcity = isSubcity(params.slug2);
  }
  if (params?.slug3) {
    if (isCity(params.slug3)) city = isCity(params.slug3);
  }

  // If not a valid SEO page, we should ideally render a 404, but for simple rendering:
  if (!tool && !feature) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-4xl font-bold mb-4">Page Not Found</h1>
        <Link href="/">
          <a className="text-blue-600 hover:underline">Return to Home</a>
        </Link>
      </div>
    );
  }

  const primaryEntity = feature || tool;
  const pageTitlePart = primaryEntity?.name || "Business Software";
  const industryText = industry ? ` for ${industry.name}` : "";
  const locationText = subcity ? ` in ${subcity.name}, ${city?.name || 'India'}` : city ? ` in ${city.name}` : "";
  
  const fullTitle = `Best ${pageTitlePart}${industryText}${locationText} | Vyora`;
  const metaDescription = `Looking for the best ${pageTitlePart} ${industryText} ${locationText}? Vyora offers a complete suite to automate your business, manage billing, and scale effectively.`;
  
  const currentUrl = `https://vyora.club${location.pathname}`;

  // JSON-LD Generation
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Vyora",
    "url": "https://vyora.club",
    "logo": "https://vyora.club/logo.png",
    "description": "Premium All-in-One Business Management & Free Website Builder Software in India.",
    "sameAs": ["https://twitter.com/vyora_club", "https://linkedin.com/company/vyora"]
  };

  const softwareSchema = {
    "@context": "https://schema.org/",
    "@type": "SoftwareApplication",
    "name": `Vyora ${pageTitlePart}`,
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web, Windows, iOS, Android",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "INR"
    },
    "description": metaDescription
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `What is the best ${pageTitlePart}${industryText}${locationText}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Vyora is considered the best ${pageTitlePart} ${locationText} because of its completely integrated automation, seamless billing, and zero-learning curve for staff.`
        }
      },
      {
        "@type": "Question",
        "name": `How much does Vyora cost ${locationText}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Vyora offers a free tier to build your brand online, followed by completely transparent, affordable premium plans designed specifically for scale.`
        }
      },
      {
        "@type": "Question",
        "name": `Can I use this software on mobile?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Yes, Vyora's architecture is fully responsive and natively optimized for mobile usage everywhere ${locationText}.`
        }
      },
      {
        "@type": "Question",
        "name": `Is support available in ${city ? city.name : 'India'}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Absolutely. We provide dedicated onboarding and highly responsive support networks across ${city ? city.name : 'all major cities'}.`
        }
      },
      {
        "@type": "Question",
        "name": `Does it require technical knowledge?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `No. Our ${pageTitlePart} is specifically engineered to be intuitive. If you can use a smartphone, you can master Vyora.`
        }
      }
    ]
  };

  // Breadcrumb Schema
  const breadcrumbList = [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://vyora.club/" },
    { "@type": "ListItem", "position": 2, "name": "Tools", "item": "https://vyora.club/tools" }
  ];
  let position = 3;
  if (tool) {
    breadcrumbList.push({ "@type": "ListItem", "position": position++, "name": tool.name, "item": `https://vyora.club/${tool.slug}` });
  }
  if (industry) {
    breadcrumbList.push({ "@type": "ListItem", "position": position++, "name": industry.name, "item": `https://vyora.club${location.pathname.split(`/${industry.slug}`)[0]}/${industry.slug}` });
  }
  if (city) {
    breadcrumbList.push({ "@type": "ListItem", "position": position++, "name": city.name, "item": currentUrl });
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbList
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Helmet>
        <title>{fullTitle}</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={currentUrl} />
        <meta property="og:title" content={fullTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:image" content={`https://vyora.club/og${location.pathname === '/' ? '/index' : location.pathname}.png`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">{JSON.stringify(organizationSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(softwareSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

      <PublicHeader />

      <main className="flex-grow">
        {/* Dynamic Hero Section with Gradient */}
        <div className="relative overflow-hidden bg-white pt-24 pb-16">
          <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-blue-50 to-white -z-10" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Breadcrumbs */}
            <nav className="flex mb-12 text-sm font-medium" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2 text-gray-400">
                <li><Link href="/"><a className="hover:text-blue-600 transition-colors">Home</a></Link></li>
                <li><span className="mx-2">/</span></li>
                <li><Link href="/tools"><a className="hover:text-blue-600 transition-colors">Tools</a></Link></li>
                {tool && (
                  <>
                    <li><span className="mx-2">/</span></li>
                    <li><Link href={`/${tool.slug}`}><a className="hover:text-blue-600 transition-colors">{tool.name}</a></Link></li>
                  </>
                )}
                {industry && (
                  <>
                    <li><span className="mx-2">/</span></li>
                    <li className="text-gray-900 font-semibold">{industry.name}</li>
                  </>
                )}
              </ol>
            </nav>

            <div className="text-center lg:text-left grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-gray-900 leading-[1.1]">
                  The Premium <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">{pageTitlePart}</span>
                  <br />
                  <span className="text-2xl md:text-3xl text-gray-500 font-medium block mt-4">
                    Architected for Businesses {locationText}
                  </span>
                </h1>
                <p className="mt-8 text-xl text-gray-500 max-w-2xl leading-relaxed">
                  {metaDescription} Vyora isn't just software; it's the operational nervous system for {industry?.name || 'modern companies'} across {city || 'India'}.
                </p>
                <div className="mt-10 flex flex-wrap justify-center lg:justify-start gap-4">
                  <Link href="/vendor-signup">
                    <a className="px-8 py-4 bg-blue-600 text-white text-lg font-bold rounded-2xl shadow-[0_20px_50px_rgba(37,99,235,0.3)] hover:bg-blue-700 transition-all hover:scale-105 active:scale-95">
                      Get My Free Account
                    </a>
                  </Link>
                  <Link href="#intelligence">
                    <a className="px-8 py-4 bg-white text-gray-900 border border-gray-200 text-lg font-bold rounded-2xl hover:bg-gray-50 transition-all">
                      Explore Intelligence
                    </a>
                  </Link>
                </div>
              </div>
              <div className="relative">
                <div className="absolute -inset-4 bg-blue-100/50 rounded-3xl blur-2xl -z-10" />
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-2xl">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold">V</div>
                    <div>
                      <h3 className="font-bold text-gray-900">Vyora Operating System</h3>
                      <p className="text-sm text-gray-500">v4.0 Enterprise Edition</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {[
                      "Automated Workflow Orchestration",
                      "Real-time Inventory Intelligence",
                      "Localized Tax & Billing (GST Ready)",
                      "AI-Powered Client Retention"
                    ].map((feat, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm font-semibold text-gray-700">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Vyora Intelligence (AEO Section) */}
        <section id="intelligence" className="py-20 bg-gray-900 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-900/10 blur-[120px] rounded-full pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row gap-12 items-center">
              <div className="flex-1 text-white">
                <span className="text-blue-400 font-bold tracking-widest uppercase text-sm mb-4 block">Engineered Performance</span>
                <h2 className="text-3xl md:text-4xl font-bold mb-8">
                  Vyora Intelligence: How We Power {industry?.name || 'Businesses'} {locationText}
                </h2>
                <div className="prose prose-invert max-w-none text-gray-400 text-lg">
                  <p>
                    For too long, {industry?.name || 'enterprises'} {locationText} have been forced to choose between complex, expensive platforms and outdated manual tracking. <strong>Vyora Intelligence</strong> removes this friction.
                  </p>
                  <p className="mt-4">
                    Our platform utilizes highly localized algorithms to understand the specific market dynamics {locationText}. By predicting client behavior and automating the boring repetitive tasks, we enable business owners to focus purely on growth and scaling their brand locally.
                  </p>
                </div>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-4">
                {[
                  { label: "Uptime", val: "99.9%" },
                  { label: "Automation", val: "24/7" },
                  { label: "Latency", val: "<50ms" },
                  { label: "Security", val: "TLS 1.3" }
                ].map((stat, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm text-center">
                    <div className="text-2xl font-bold text-blue-400 mb-1">{stat.val}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-widest">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Long Form Content Layer (800+ words SEO strategy) */}
        <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Dominating Operations {locationText}
              </h2>
              <div className="space-y-6 text-gray-600 leading-relaxed text-lg">
                <p>
                  Operating a modern business structure anywhere {locationText} demands robust and intuitive technology. As consumer expectations shift rapidly, legacy desktop platforms simply cannot keep up with real-time operational demands.
                </p>
                <p>
                  Vyora's {pageTitlePart} completely re-engineers how you connect with your clients. Whether you run a single outlet {subcity ? `in ${subcity.name}` : city ? `locally in ${city.name}` : 'in your city'} or oversee a massive network across India, the system scales inherently to your load. 
                  The platform ensures that every single interaction, workflow, and financial transaction is logged securely in the cloud.
                </p>
                <p>
                  When you deploy this {pageTitlePart} {industryText}, you immediately unlock granular analytics. You can finally stop guessing your next quarter's projections. By tracking core performance indicators dynamically, your expansion {locationText} becomes highly predictable and completely transparent.
                </p>
                <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">Core Automation Strengths</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Zero-Latency Infrastructure:</strong> Built for flawless speed, ensuring queues keep moving locally {locationText}.</li>
                  <li><strong>Hyper-Localized Metrics:</strong> Track your retention exactly where it matters.</li>
                  <li><strong>Automated Client Nurturing:</strong> Keep your customer base engaged without lifting a finger.</li>
                  <li><strong>Bank-Grade Security Ledger:</strong> Complete peace of mind for you and your clients.</li>
                </ul>
              </div>
            </div>
            
            <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Instant Growth Impact
              </h2>
              <div className="space-y-6 text-gray-600 leading-relaxed text-lg">
                <p>
                  The impact of transitioning to a premium {pageTitlePart} is almost immediate. Routine tasks that historically consumed hours of administrative time {locationText} are resolved instantly.
                </p>
                <p>
                  Particulary {industryText}, the ability to sync offline engagements with a digital dashboard gives you absolute centralized control. You maintain perfect oversight even when away from your primary premises.
                </p>
                <p>
                  Furthermore, deploying this ecosystem acts as a potent acquisition magnet. When users {locationText} search for rapid, reliable services {industryText}, your robust, automated backend ensures your front-end customer experience is impeccable and thoroughly trusted.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* The 5+ FAQ Schema Block */}
        <section className="bg-slate-900 text-white py-20 mb-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold mb-10 text-center">Frequently Asked Questions</h2>
            <div className="space-y-6">
              {faqSchema.mainEntity.map((faq, idx) => (
                <div key={idx} className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                  <h3 className="text-xl font-semibold mb-3">{faq.name}</h3>
                  <p className="text-slate-300 leading-relaxed">{faq.acceptedAnswer.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SeoFooterLinks pageType="seo" currentSlug={tool ? tool.slug : "tool"} currentTitle={pageTitlePart} />
      <PublicFooter />
    </div>
  );
}
