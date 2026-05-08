import { Link } from "wouter";
import { Helmet } from "react-helmet";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { TOOLS, INDUSTRIES, CITIES, SUBCITIES, FEATURES } from "@/lib/seo-data";

export default function SeoHub({ params }: { params?: any }) {
  const type = params?.type || "tools"; // tools | industries | cities | features
  
  let title = "Business Tools";
  let items: any[] = TOOLS;
  let linkPrefix = "";

  if (type === "industries") {
    title = "Supported Industries";
    items = INDUSTRIES;
  } else if (type === "cities") {
    title = "Available Cities";
    items = CITIES;
  } else if (type === "features") {
    title = "Platform Features";
    items = FEATURES;
  } else if (type === "subcities") {
    title = "Local Delivery Areas";
    items = Object.values(SUBCITIES).flat();
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Helmet>
        <title>Vyora {title} | All-in-One Platform</title>
        <meta name="description" content={`Explore all ${title.toLowerCase()} supported by Vyora's operating system.`} />
      </Helmet>

      <PublicHeader />

      <main className="flex-grow pt-24 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
            Select a specific category below to learn how Vyora transforms your operational workflow.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, idx) => {
            const isString = typeof item === 'string';
            const slug = isString ? item.toLowerCase().replace(/\s+/g, '-') : item.slug;
            const name = isString ? item : item.name;
            const desc = isString ? `Business solutions in ${item}` : item.desc;
            
            // Determine link based on type
            let href = `/${slug}`;
            if (type === 'cities') href = `/tools/in/${slug}`;
            if (type === 'industries') href = `/tools/${slug}`;

            return (
              <Link key={slug || idx} href={href}>
                <a className="bg-white px-6 py-8 rounded-2xl shadow-sm border border-gray-100 hover:border-blue-500 hover:shadow-md transition-all flex flex-col items-center text-center group font-sans">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {name}
                  </h3>
                  <p className="mt-2 text-gray-500 text-sm">{desc || 'Explore Vyora'}</p>
                </a>
              </Link>
            );
          })}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
