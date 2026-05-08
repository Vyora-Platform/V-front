import { useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Search } from "lucide-react";
import { PublicHeader } from "@/components/public-header";

export default function NotFound() {
  useEffect(() => {
    document.title = "404 — Page Not Found | Vyora";

    // Add noindex meta
    let robotsMeta = document.querySelector('meta[name="robots"]');
    if (!robotsMeta) {
      robotsMeta = document.createElement("meta");
      robotsMeta.setAttribute("name", "robots");
      document.head.appendChild(robotsMeta);
    }
    robotsMeta.setAttribute("content", "noindex, nofollow");

    return () => {
      if (robotsMeta) {
        robotsMeta.setAttribute("content", "index, follow, max-image-preview:large");
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <PublicHeader />

      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 pt-20">
        {/* 404 Visual */}
        <div className="relative mb-8">
          <div className="text-[120px] md:text-[180px] font-extrabold text-gray-100 leading-none select-none" style={{ fontFamily: 'Poppins, sans-serif' }}>
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-blue-100 flex items-center justify-center">
              <Search className="w-10 h-10 md:w-12 md:h-12 text-blue-600" />
            </div>
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 text-center" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Page Not Found
        </h1>
        <p className="text-gray-600 text-lg mb-8 text-center max-w-md">
          The page you're looking for doesn't exist or has been moved. Let's get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mb-12">
          <Link href="/">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-base" data-testid="button-home">
              <Home className="h-4 w-4 mr-2" />
              Go to Homepage
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="px-6 py-3 text-base"
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>

        {/* Helpful Links */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-md w-full">
          <h2 className="font-semibold text-gray-900 mb-3">Helpful Links</h2>
          <ul className="space-y-2">
            <li>
              <Link href="/tools" className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors">
                → Browse All Business Tools
              </Link>
            </li>
            <li>
              <Link href="/categories" className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors">
                → Explore Business Categories
              </Link>
            </li>
            <li>
              <Link href="/blog" className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors">
                → Read Our Blog
              </Link>
            </li>
            <li>
              <Link href="/signup" className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors">
                → Get Started Free
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
