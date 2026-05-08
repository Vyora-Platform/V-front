import { useLocation, Link } from "wouter";

export function PublicFooter() {
    const [location, setLocation] = useLocation();

    const handleNavClick = (sectionId: string) => {
        if (location !== "/") {
            setLocation(`/#${sectionId}`);
        } else {
            document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
        }
    };

    return (
        <footer className="bg-blue-600 text-white py-12 md:py-20">
            <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
                {/* Footer Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 mb-12">
                    {/* Brand */}
                    <div className="col-span-2 lg:col-span-1">
                        <div className="flex items-center gap-3 mb-5">
                            <img
                                src="/logo.png"
                                alt="Vyora Logo"
                                className="h-24 md:h-28 w-auto object-contain bg-white rounded-xl p-2 cursor-pointer shadow-lg"
                                onClick={() => setLocation("/")}
                            />
                        </div>
                        <p className="text-base text-blue-100 leading-relaxed max-w-xs">
                            Universal business marketplace platform for all industries. Empowering 12,000+ businesses across India.
                        </p>
                    </div>

                    {/* Industries */}
                    <div>
                        <h4 className="font-bold text-white mb-4 text-lg">Industries</h4>
                        <ul className="space-y-3 text-base text-blue-100">
                            <li><Link href="/category/fitness-wellness"><a className="hover:text-white transition-colors">Gym & Fitness</a></Link></li>
                            <li><Link href="/category/salons-spas"><a className="hover:text-white transition-colors">Salons & Spas</a></Link></li>
                            <li><Link href="/category/healthcare"><a className="hover:text-white transition-colors">Healthcare</a></Link></li>
                            <li><Link href="/category/education"><a className="hover:text-white transition-colors">Education</a></Link></li>
                            <li><Link href="/category/retail"><a className="hover:text-white transition-colors">Retail Stores</a></Link></li>
                            <li><Link href="/category/restaurants"><a className="hover:text-white transition-colors">Restaurants</a></Link></li>
                        </ul>
                    </div>

                    {/* Solutions */}
                    <div>
                        <h4 className="font-bold text-white mb-4 text-lg">Solutions</h4>
                        <ul className="space-y-3 text-base text-blue-100">
                            <li><button onClick={() => handleNavClick('features')} className="hover:text-white transition-colors text-left">Free Website</button></li>
                            <li><button onClick={() => handleNavClick('features')} className="hover:text-white transition-colors text-left">CRM & Deals</button></li>
                            <li><button onClick={() => handleNavClick('features')} className="hover:text-white transition-colors text-left">AI Catalogue</button></li>
                            <li><button onClick={() => handleNavClick('features')} className="hover:text-white transition-colors text-left">Hisab Kitab</button></li>
                            <li><button onClick={() => handleNavClick('pricing')} className="hover:text-white transition-colors text-left">Pricing Plans</button></li>
                        </ul>
                    </div>

                    {/* Resources */}
                    <div>
                        <h4 className="font-bold text-white mb-4 text-lg">Resources</h4>
                        <ul className="space-y-3 text-base text-blue-100">
                            <li><button onClick={() => handleNavClick('faq')} className="hover:text-white transition-colors text-left">FAQs</button></li>
                            <li><button onClick={() => handleNavClick('testimonials')} className="hover:text-white transition-colors text-left">Testimonials</button></li>
                            <li><a href="https://wa.me/918887178734" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Become a Partner</a></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="font-bold text-white mb-4 text-lg">Legal</h4>
                        <ul className="space-y-3 text-base text-blue-100">
                            <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-blue-400 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-base">
                    <p className="text-blue-100">© {new Date().getFullYear()} Vyora. All rights reserved.</p>
                    <p className="text-blue-200 text-center sm:text-right">Made with ❤️ in India</p>
                </div>
            </div>
        </footer>
    );
}
