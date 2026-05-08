import {
    Globe, Users, Sparkles, FileText, Package, Image,
    Calendar, Send, CreditCard, Headphones, BarChart3, Clock, TrendingUp, ShieldCheck,
    Zap, Settings, Smartphone
} from "lucide-react";

export const toolsData = [
    {
        slug: "free-business-website",
        icon: Globe,
        title: "Free Business Website",
        subtitle: "Professional Website Builder",
        description: "Create stunning business websites with integrated apps and mobile-responsive designs",
        definitionX: "comprehensive website deployment platform",
        definitionY: "digital presence challenges and establish online authority",
        mainImage: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2426&ixlib=rb-4.0.3",
        features: ["Launch in 24 hours", "Mobile-optimized designs", "Built-in SEO apps", "Custom domain support", "Fast loading times"],
        showcase: [
            {
                title: "Drag & Drop Visual Builder",
                description: "Design your website visually without writing a single line of code. Simply drag elements onto the canvas, edit text inline, and see changes instantly before publishing globally.",
                image: "https://images.unsplash.com/photo-1555421689-491a97ff2040?auto=format&fit=crop&q=80&w=2070&ixlib=rb-4.0.3"
            },
            {
                title: "Mobile-First Architecture",
                description: "Over 70% of web traffic comes from mobile devices. Our engine inherently structures your website to load flawlessly and instantly on modern smartphones and tablets.",
                image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2070&ixlib=rb-4.0.3"
            }
        ],
        detailedFeatures: [
            { title: "Drag & Drop Builder", description: "Design your website visually without writing a single line of code. Simply drag elements onto the canvas." },
            { title: "Mobile Responsive", description: "Your website automatically adapts to look perfect on smartphones, tablets, and desktop computers." },
            { title: "SEO Optimized", description: "Built-in apps to help your website rank higher on Google search results and attract more organic traffic." },
            { title: "Custom Domain", description: "Connect your own professional domain name (like www.yourbusiness.com) to build brand credibility." },
            { title: "Lightning Fast", description: "Hosted on global CDNs ensuring your website loads in milliseconds for visitors anywhere." },
            { title: "Secure Hosting", description: "Free SSL certificates included automatically to keep your website and visitors secure." }
        ],
        benefits: [
            { title: "Increase Online Visibility", description: "Get discovered by thousands of potential customers searching online for your services." },
            { title: "Build Trust & Credibility", description: "A professional website acts as your digital storefront, establishing trust before the first contact." },
            { title: "24/7 Lead Generation", description: "Your website works around the clock, capturing inquiries and sales even while you sleep." }
        ],
        faqs: [
            { q: "Is the business website actually free?", a: "Yes, 100% free — no hidden charges, no trial limits. Our free plan gives you a professional mini-website with your branding, contact details, and product showcase. You can stay on the free plan forever or upgrade for premium features like custom domains and advanced SEO." },
            { q: "Do I need coding skills to build my site?", a: "Not at all. Vyora's website builder is designed for people who've never touched code in their lives. You simply pick a template, drag and drop your content, upload photos, and hit publish. If you can use WhatsApp, you can build your website." },
            { q: "Will the website work on mobile devices?", a: "Absolutely. Every single template is 100% mobile-responsive. Your website will look stunning on smartphones, tablets, laptops, and desktops. Since 80% of Indian internet users browse on mobile, this is critical for your business success." },
            { q: "Can I connect my own domain name?", a: "Yes! You can connect a custom domain (like yourbusiness.com) or get a free Vyora subdomain (yourbusiness.vyora.club). We even guide you step-by-step through the domain setup process — takes less than 5 minutes." },
            { q: "How long does it take to build and launch my website?", a: "Most business owners go live within 30 minutes to 2 hours. Pick a template, customize it with your details, and publish. Our fastest user launched a complete e-commerce site in just 18 minutes!" },
            { q: "Will my website appear on Google search?", a: "Yes, every Vyora website is built with SEO best practices baked in — proper meta tags, sitemap generation, mobile optimization, and fast loading speeds. Most businesses start appearing in local Google searches within 2-4 weeks of launch." },
            { q: "Can I add an online store to my website?", a: "Absolutely. You can showcase your products with prices, descriptions, and images. Customers can browse, add to cart, and inquire or order directly. Pair it with our Payment Gateway tool for a complete e-commerce experience." },
            { q: "What if I need help building my site?", a: "Our 24/7 support team is just a chat message away. We also provide step-by-step video tutorials, a knowledge base with 100+ articles, and even offer free 1-on-1 onboarding calls for Pro plan users." },
            { q: "Can I track how many visitors my website gets?", a: "Yes, the built-in analytics dashboard shows you visitor count, page views, popular pages, traffic sources, and device breakdown. For advanced analytics, you can easily connect Google Analytics with one click." },
            { q: "Is there a limit to how many pages I can create?", a: "The free plan includes up to 5 pages — more than enough for most small businesses (Home, About, Services, Gallery, Contact). Pro plan users get unlimited pages, perfect for businesses with extensive catalogs or multiple locations." }
        ],
        testimonials: [
            { name: "Vikram Mehta", role: "Owner, Mehta Electronics", location: "Pune", initial: "V", content: "We had zero online presence before Vyora. Within a week, our mini-website was live and we started getting 10+ inquiries daily from Google. Our revenue jumped 35% in just the first quarter!", rating: 5, metric: "35% ↑ Revenue" },
            { name: "Ananya Desai", role: "Founder, Bloom Florals", location: "Surat", initial: "A", content: "As a small florist, I couldn't afford a developer. Vyora's drag-and-drop builder let me create a stunning website that now generates 70% of my orders online. Best decision I ever made.", rating: 5, metric: "70% Online Orders" },
            { name: "Mohammed Farhan", role: "Manager, QuickBite Restaurant", location: "Hyderabad", initial: "M", content: "Our restaurant website with integrated menu and ordering went live in under 2 hours. Customers love browsing our menu online before visiting. Footfall is up 25% since launch!", rating: 5, metric: "25% ↑ Footfall" },
            { name: "Kavita Joshi", role: "Owner, Kavita's Boutique", location: "Jaipur", initial: "K", content: "I was spending ₹5,000/month on a freelancer to maintain a basic WordPress site. Vyora gave me a better-looking website for free, and I manage it myself in 10 minutes a week. Saved ₹60K annually!", rating: 5, metric: "₹60K Saved/Year" },
            { name: "Rajesh Kumar", role: "Director, Kumar Hardware", location: "Lucknow", initial: "R", content: "At 58, I'm not exactly tech-savvy. But I built our hardware store website in one afternoon — added all 200+ products with photos and prices. My son was impressed, and our phone inquiries tripled.", rating: 5, metric: "3x Phone Inquiries" },
            { name: "Deepa Nair", role: "Founder, GreenLeaf Organics", location: "Kochi", initial: "D", content: "We sell organic produce and needed a simple way to showcase our weekly availability. The website builder with catalog integration is perfect — customers check our site every Monday for fresh stock lists.", rating: 5, metric: "Weekly Repeat Visits" },
            { name: "Arjun Patel", role: "CEO, FitZone Gym", location: "Ahmedabad", initial: "A", content: "Our gym website now handles membership inquiries, class schedules, and trainer profiles. We stopped paying for 3 separate tools. The integrated contact form alone brings in 15 new leads weekly.", rating: 5, metric: "15 Leads/Week" },
            { name: "Sneha Reddy", role: "Owner, Sparkle Salon", location: "Bangalore", initial: "S", content: "I love how professional our salon website looks — it genuinely rivals websites of big chains. Customers tell us they chose us over competitors specifically because our online presence felt trustworthy.", rating: 5, metric: "Trust-Based Wins" },
            { name: "Manish Gupta", role: "Partner, Gupta & Sons Jewellers", location: "Delhi", initial: "M", content: "For a jewelry business, presentation is everything. The website templates are elegant and showcase our pieces beautifully. We've started getting orders from customers in other cities who found us online.", rating: 5, metric: "Pan-India Orders" },
            { name: "Fatima Shaikh", role: "Principal, Little Stars Preschool", location: "Mumbai", initial: "F", content: "Parents today research everything online before enrolling their children. Our Vyora website with gallery, curriculum details, and admission form has increased enrollments by 40% this academic year.", rating: 5, metric: "40% ↑ Enrollments" }
        ],
        problemStatement: "Without a professional website, your business is invisible to 85% of customers who search online before making a purchase. You're losing leads to competitors who show up on Google while you rely only on word-of-mouth.",
        solutionStatement: "With Vyora's Free Business Website, you launch a stunning, mobile-optimized site in under 24 hours — no coding, no designer fees. Start appearing on Google instantly and capture leads 24/7 while you focus on running your business.",
        howItWorks: [
            { step: 1, title: "Sign Up & Choose a Template", description: "Create your free account and pick from dozens of industry-specific, professionally designed templates." },
            { step: 2, title: "Customize Your Brand", description: "Add your logo, brand colors, products, services, and contact details using the drag-and-drop editor." },
            { step: 3, title: "Connect Your Domain", description: "Link your custom domain name or use a free Vyora subdomain to go live instantly." },
            { step: 4, title: "Go Live & Grow", description: "Publish your website and start receiving leads, inquiries, and orders from day one." }
        ],
        stats: [
            { value: "24hrs", label: "Average Launch Time" },
            { value: "3x", label: "More Leads vs No Website" },
            { value: "99.9%", label: "Uptime Guarantee" },
            { value: "0", label: "Coding Required" }
        ],
        accentColor: { gradient: "from-blue-600 to-cyan-500", light: "bg-blue-50", dark: "bg-blue-600", ring: "ring-blue-500" },
        metaTitle: "Free Business Website Builder | Create Professional Site in 24 Hours - Vyora",
        metaDescription: "Build a stunning, mobile-responsive business website for free with Vyora. No coding needed. SEO-optimized, custom domain support, and live in 24 hours.",
        relatedTools: ["unlimited-lead-management", "automagic-catalogue-creation", "free-marketing-sales-banner"]
    },
    {
        slug: "unlimited-lead-management",
        icon: Users,
        title: "Unlimited Lead Management",
        subtitle: "Complete Lead Management System",
        description: "Capture, track, and convert unlimited leads with automated follow-up and management apps",
        definitionX: "centralized customer relationship management system",
        definitionY: "lead leakage and streamline follow-up conversions",
        mainImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2070&ixlib=rb-4.0.3",
        features: ["Unlimited lead capture", "Automated follow-ups", "Conversion tracking", "Lead assignment", "Custom pipelines"],
        showcase: [
            {
                title: "Automated Lead Routing",
                description: "Instantly capture leads from Facebook, Google Ads, and your Website. Route them automatically to the correct sales agent based on geographic or product rules.",
                image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2426&ixlib=rb-4.0.3"
            },
            {
                title: "Visual Sales Pipelines",
                description: "Track the exact progression of every potential deal. Use drag-and-drop Kanban boards to move leads from 'New Inquiry' through to 'Closed Won'.",
                image: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&q=80&w=2076&ixlib=rb-4.0.3"
            }
        ],
        detailedFeatures: [
            { title: "Centralized Dashboard", description: "View and manage all your leads from across platforms (Facebook, Google, Website) in one unified inbox." },
            { title: "Automated Follow-ups", description: "Set up trigger-based SMS and WhatsApp messages to nurture leads instantly without manual effort." },
            { title: "Sales Pipeline", description: "Visualize your sales process with customizable drag-and-drop kanban boards." },
            { title: "Lead Scoring", description: "Automatically prioritize hot leads based on their interaction and engagement levels." },
            { title: "Team Assignment", description: "Automatically distribute incoming leads among your sales team using round-robin or custom logic." },
            { title: "Conversion Analytics", description: "Track exactly which campaigns and channels are driving the highest quality leads." }
        ],
        benefits: [
            { title: "Zero Lead Leakage", description: "Never lose track of a potential customer again. Every inquiry is logged, tracked, and followed up." },
            { title: "Higher Conversion Rates", description: "Speed to lead is critical. Automated immediate responses dramatically increase your chances of closing." },
            { title: "Scale Your Sales Strategy", description: "Process 10 or 10,000 leads with the exact same efficiency through automated workflows." }
        ],
        faqs: [
            { q: "What is an unlimited lead management system?", a: "Think of it as a smart notebook that never runs out of pages — it captures every potential customer from every channel (website, WhatsApp, social media, walk-ins) and reminds you exactly when and how to follow up. No lead ever gets forgotten." },
            { q: "How are follow-ups automated?", a: "You set up simple rules like 'If a lead doesn't respond in 24 hours, send a WhatsApp reminder.' The system handles the rest — sending personalized messages via SMS, email, or WhatsApp at exactly the right time, without you lifting a finger." },
            { q: "Can I assign leads to specific team members?", a: "Absolutely. You can manually assign leads or set up automatic routing — round-robin (equal distribution), geography-based, or product-based. Your sales team always knows exactly which leads are theirs." },
            { q: "Does this integrate with Facebook and Google Ads?", a: "Yes! Leads from Facebook Lead Ads, Google Ads forms, Instagram, and your website flow directly into Vyora. No more downloading CSVs or copy-pasting contact details — it's all automatic and instant." },
            { q: "How many leads can I store?", a: "Truly unlimited. Whether you have 10 leads or 100,000, there are zero database caps. We've designed the system to scale with your business growth so you never have to worry about 'plans' or 'tiers' limiting your contacts." },
            { q: "Can I see which leads are most likely to convert?", a: "Yes! The lead scoring system automatically ranks prospects based on engagement — who opened your messages, who visited your website, who responded. Hot leads rise to the top so your team focuses on the right people first." },
            { q: "What if a lead comes in at midnight?", a: "The system responds instantly, 24/7. You can set up auto-reply messages that acknowledge the inquiry, share basic information, and assure the customer that your team will follow up during business hours. No lead feels ignored." },
            { q: "Can I track my sales team's performance?", a: "Definitely. The analytics dashboard shows each team member's response time, follow-up rate, conversion rate, and pipeline value. It's perfect for identifying top performers and coaching those who need help." },
            { q: "Is there a mobile app for managing leads on the go?", a: "Yes, everything works beautifully on mobile. Your sales team can view leads, add notes, make calls, send WhatsApp messages, and update pipeline stages from their smartphone — whether they're in the office or on the road." },
            { q: "How is this different from a regular spreadsheet?", a: "A spreadsheet can't send automated follow-ups, score leads, route inquiries to the right person, or notify you when a hot lead visits your website. Vyora does all of this and more — turning chaotic lead tracking into a systematic, conversion-optimized machine." }
        ],
        testimonials: [
            { name: "Suresh Reddy", role: "Sales Head, AutoZone Cars", location: "Chennai", initial: "S", content: "We were losing 40% of our leads because nobody followed up on time. After deploying Vyora's lead management, our conversion rate tripled in just 2 months. The automated WhatsApp follow-ups are an absolute game-changer!", rating: 5, metric: "3x Conversions" },
            { name: "Kavita Joshi", role: "Director, BrightPath Education", location: "Jaipur", initial: "K", content: "Managing inquiries from 5 different sources was chaos. Vyora unified everything into one dashboard. We now respond to every lead within 5 minutes and our enrollments are up 60%.", rating: 5, metric: "60% ↑ Enrollments" },
            { name: "Amit Saxena", role: "Owner, Saxena Real Estate", location: "Noida", initial: "A", content: "In real estate, the first broker to respond wins the deal. Vyora's instant notifications and auto-replies mean we're always first. Our closing rate went from 8% to 22% in three months.", rating: 5, metric: "22% Close Rate" },
            { name: "Priya Menon", role: "Marketing Head, WellnessHub", location: "Kochi", initial: "P", content: "We run Facebook ads that generate 200+ leads daily. Before Vyora, half were wasted. Now every single lead gets a personalized WhatsApp within 30 seconds. Our cost-per-acquisition dropped by 45%.", rating: 5, metric: "45% ↓ CPA" },
            { name: "Rahul Sharma", role: "Founder, TechLearn Academy", location: "Pune", initial: "R", content: "Our counselors used to juggle 50 open tabs and sticky notes. Now they have a single Kanban board showing exactly where each student inquiry stands. Response time went from 2 days to 2 hours.", rating: 5, metric: "2hr Response" },
            { name: "Deepti Agarwal", role: "Sales Manager, HomeDecor LLP", location: "Indore", initial: "D", content: "The lead scoring feature is brilliant. Instead of calling 100 random leads, my team now focuses on the 20 hottest prospects. We're closing 35% more deals with the same team size.", rating: 5, metric: "35% ↑ Deals" },
            { name: "Vikram Singh", role: "Director, V-Auto Dealers", location: "Chandigarh", initial: "V", content: "Managing leads across 3 showrooms was impossible before Vyora. Now the auto-routing sends each lead to the nearest location's salespeople. No duplicates, no confusion, no missed opportunities.", rating: 5, metric: "Zero Duplicates" },
            { name: "Nandini Rao", role: "Owner, GlowUp Skin Clinic", location: "Hyderabad", initial: "N", content: "We used to lose track of patients who inquired about treatments. Vyora's drip campaign sends them helpful content over 2 weeks, and 30% end up booking. The automated nurturing literally pays for itself.", rating: 5, metric: "30% Booking Rate" },
            { name: "Kartik Mehta", role: "CEO, FoodCloud Kitchens", location: "Mumbai", initial: "K", content: "With 4 cloud kitchen brands, tracking franchise inquiries was a mess. Vyora let us set up separate pipelines for each brand while viewing everything in one master dashboard. Franchise leads are up 50%.", rating: 5, metric: "50% ↑ Leads" },
            { name: "Anita Bose", role: "Partner, Bose Law Associates", location: "Kolkata", initial: "A", content: "For a law firm, confidentiality and organization are paramount. Vyora's lead management keeps client inquiries perfectly organized with notes, documents, and follow-up schedules. We've onboarded 40% more clients this year.", rating: 5, metric: "40% ↑ Clients" }
        ],
        problemStatement: "Every day, businesses lose 30-50% of their leads because inquiries fall through the cracks. Spreadsheets can't send follow-ups, phone reminders get forgotten, and by the time you respond, the customer has already gone to your competitor.",
        solutionStatement: "Vyora's Unlimited Lead Management captures every lead from every source — Facebook, Google, WhatsApp, website — into one intelligent dashboard. Automated follow-ups fire within seconds, and visual pipelines ensure zero leads ever slip away again.",
        howItWorks: [
            { step: 1, title: "Connect Your Lead Sources", description: "Integrate Facebook Ads, Google Ads, your website forms, and WhatsApp to auto-capture every inquiry." },
            { step: 2, title: "Auto-Route & Assign", description: "Leads are automatically assigned to the right salesperson based on geography, product interest, or round-robin rules." },
            { step: 3, title: "Nurture with Automation", description: "Set up trigger-based SMS, email, and WhatsApp sequences that engage leads without manual effort." },
            { step: 4, title: "Track & Close", description: "Visualize your entire pipeline on a Kanban board, identify hot leads, and close deals faster." }
        ],
        stats: [
            { value: "∞", label: "Unlimited Leads" },
            { value: "5s", label: "Avg. Response Time" },
            { value: "3x", label: "Higher Conversion" },
            { value: "0%", label: "Lead Leakage" }
        ],
        accentColor: { gradient: "from-emerald-600 to-teal-500", light: "bg-emerald-50", dark: "bg-emerald-600", ring: "ring-emerald-500" },
        metaTitle: "Unlimited Lead Management Software | Capture & Convert Leads - Vyora",
        metaDescription: "Never lose a lead again. Vyora's unlimited lead management captures, tracks, and converts leads with automated follow-ups, visual pipelines, and smart routing.",
        relatedTools: ["customer-management", "bulk-marketing-software", "free-business-website"]
    },
    {
        slug: "automagic-catalogue-creation",
        icon: Sparkles,
        title: "Automagic Catalogue Creation",
        subtitle: "AI-Powered Product Catalogues",
        description: "Automatically create professional product catalogues with AI-powered descriptions and pricing",
        definitionX: "generative AI catalog structuring tool",
        definitionY: "the manual data entry associated with product listings",
        mainImage: "https://images.unsplash.com/photo-1555421689-491a97ff2040?auto=format&fit=crop&q=80&w=2070&ixlib=rb-4.0.3",
        features: ["AI-generated descriptions", "Auto pricing suggestions", "Professional layouts", "Bulk upload support", "One-click publishing"],
        showcase: [
            {
                title: "Generative AI Descriptions",
                description: "Stop writing tedious product text. Feed the engine a single image or basic title, and watch it generate SEO-optimized, highly converting descriptions instantly.",
                image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2070&ixlib=rb-4.0.3"
            },
            {
                title: "Automated Categorization Hub",
                description: "Upload thousands of SKUs in a raw format and let our machine learning algorithms automatically categorize, tag, and structure your entire inventory taxonomy.",
                image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2426&ixlib=rb-4.0.3"
            }
        ],
        detailedFeatures: [
            { title: "AI Content Generation", description: "Instantly write persuasive, SEO-optimized product descriptions from just a few bullet points." },
            { title: "Smart Categorization", description: "Automatically sort and tag thousands of products into logical hierarchies using machine learning." },
            { title: "Dynamic Pricing Module", description: "Update prices across your entire catalog in seconds based on margins or currency fluctuations." },
            { title: "High-Res Image Handling", description: "Auto-compression and formatting of product imagery for lightning-fast loading speeds." },
            { title: "B2B & B2C Views", description: "Toggle between wholesale and retail pricing modes for different customer segments." },
            { title: "PDF Export", description: "Generate beautiful, print-ready PDF catalogs directly from your digital inventory." }
        ],
        benefits: [
            { title: "Save Hundreds of Hours", description: "Eliminate the mind-numbing manual data entry associated with building product listings." },
            { title: "Rank Higher on Google", description: "AI-generated descriptions are perfectly structured for search engine optimization." },
            { title: "Professional Presentation", description: "Ensure every product looks premium, increasing perceived value and conversion rates." }
        ],
        faqs: [
            { q: "How does the AI generate descriptions?", a: "Simply upload a product image or type a basic name like 'Blue Cotton Kurta.' Our AI analyzes visual and textual cues to write compelling, SEO-optimized descriptions that actually convert — no copywriter needed." },
            { q: "Can I export my catalogue as a PDF?", a: "Yes! Generate beautifully formatted, print-ready PDF catalogs with your branding, product images, and pricing. Perfect for trade shows, WhatsApp sharing, or printing physical lookbooks." },
            { q: "How does the auto-pricing feature work?", a: "The system analyzes your cost price, desired margins, and market competitor data to suggest optimal pricing. You can also set bulk rules like '30% margin on all electronics' and apply them instantly." },
            { q: "Is there a limit to how many products I can add?", a: "Absolutely not. Whether you have 10 products or 50,000, the system handles it effortlessly. Our largest customer has 85,000 SKUs catalogued and running smoothly." },
            { q: "Can I bulk-upload products via spreadsheet?", a: "Yes! Just upload a CSV or Excel file with your product names, prices, and categories. The AI fills in descriptions, suggests images, and organizes everything into a professional catalog structure within minutes." },
            { q: "Will it work for my specific industry?", a: "The AI has been trained across 50+ industries — fashion, electronics, food, industrial supplies, jewelry, automotive parts, and more. It adapts its language, formatting, and categorization style to match your sector." },
            { q: "Can I create separate catalogs for wholesale and retail?", a: "Absolutely. Toggle between B2B (wholesale) and B2C (retail) views with different pricing, minimum order quantities, and descriptions — all from the same product database." },
            { q: "How does the smart categorization work?", a: "Upload products in any order and the AI automatically sorts them into logical categories and subcategories. A clothing store's uploads automatically get organized into Men's, Women's, Kids, and then by garment type." },
            { q: "Can customers browse my catalog online?", a: "Yes! Your catalog gets a beautiful, mobile-responsive online storefront link that you can share via WhatsApp, social media, or embed on your website. Customers can browse, search, and inquire directly." },
            { q: "How quickly can I set up my first catalog?", a: "Most businesses go from zero to a published catalog in under 2 hours. If you have a spreadsheet ready, the AI can process and publish 1,000+ products in about 30 minutes." }
        ],
        testimonials: [
            { name: "Deepak Agarwal", role: "Owner, Agarwal Textiles", location: "Jaipur", initial: "D", content: "We had 3,000+ fabric SKUs and listing them was taking months. Vyora's AI catalogued everything in 2 days with beautiful descriptions. Our wholesale inquiries doubled!", rating: 5, metric: "2x Inquiries" },
            { name: "Nisha Bhatia", role: "Founder, NB Cosmetics", location: "Mumbai", initial: "N", content: "The AI-generated product descriptions are genuinely better than what our copywriter produced. Our online catalogue now drives 45% of total sales. The PDF export is phenomenal for trade shows.", rating: 5, metric: "45% Online Sales" },
            { name: "Rakesh Verma", role: "Director, Verma Auto Parts", location: "Ludhiana", initial: "R", content: "We deal in 12,000+ auto parts. Manually cataloguing them would have taken a year. Vyora's AI did it in a week — with accurate technical descriptions. Mechanics search our catalog and order directly.", rating: 5, metric: "12K Products/Week" },
            { name: "Sunita Yadav", role: "Owner, Sunita's Kitchen", location: "Patna", initial: "S", content: "I sell homemade pickles and snacks. The AI wrote descriptions that made my simple products sound gourmet! My WhatsApp catalog link gets shared by customers to their friends. Orders are up 60%.", rating: 5, metric: "60% ↑ Orders" },
            { name: "Faizal Khan", role: "Manager, Khan Furniture", location: "Nagpur", initial: "F", content: "The PDF catalog we generated looks like something from a luxury brand. Our dealers were shocked — they thought we hired an expensive agency. It's just Vyora AI doing its magic.", rating: 5, metric: "Premium PDFs" },
            { name: "Prerna Desai", role: "Founder, Prerna Boutique", location: "Ahmedabad", initial: "P", content: "Seasonal collections used to take 2 weeks to catalog. Now I upload 200 new designs and the AI creates the entire lookbook in 3 hours — with size guides, fabric details, and care instructions.", rating: 5, metric: "3hr Lookbooks" },
            { name: "Vijay Krishnamurthy", role: "CEO, TechMax Distributors", location: "Chennai", initial: "V", content: "The B2B/B2C toggle is genius. Our dealers see wholesale prices while retail customers see MRP. Same catalog, two views. It's saved us from maintaining separate spreadsheets for different audiences.", rating: 5, metric: "Dual Pricing" },
            { name: "Aarti Gupta", role: "Owner, Green Grocers", location: "Delhi", initial: "A", content: "For perishable goods, the catalog updates daily with available items and prices. Customers check our online catalog every morning. We've eliminated 90% of 'is this available?' phone calls.", rating: 5, metric: "90% ↓ Calls" },
            { name: "Hemant Joshi", role: "Partner, Joshi Hardware", location: "Pune", initial: "H", content: "Our hardware catalog has 8,000 items across 200 categories. The AI categorized everything perfectly — nails with nails, paints with paints, tools with tools. Customers find products 5x faster now.", rating: 5, metric: "5x Faster Search" },
            { name: "Meena Pillai", role: "Director, Spice Route Exports", location: "Kochi", initial: "M", content: "We export spices to 15 countries. The AI generates descriptions in English that perfectly highlight origin, grade, and certifications. Our international buyers love the professional catalog PDFs.", rating: 5, metric: "International Ready" }
        ],
        problemStatement: "Manually writing product descriptions, organizing categories, and maintaining pricing across hundreds of SKUs burns weeks of productivity. Poorly listed products get ignored by customers and rank nowhere on search engines.",
        solutionStatement: "Vyora's Automagic Catalogue uses AI to generate compelling, SEO-optimized product descriptions from a single image or title. Thousands of SKUs get categorized, priced, and published in hours — not weeks.",
        howItWorks: [
            { step: 1, title: "Upload Your Products", description: "Bulk-upload product images, names, or spreadsheets — the AI takes it from there." },
            { step: 2, title: "AI Generates Descriptions", description: "Watch as the engine writes compelling, SEO-optimized descriptions and suggests smart pricing." },
            { step: 3, title: "Review & Customize", description: "Fine-tune categories, adjust pricing tiers, and toggle between B2B and B2C views." },
            { step: 4, title: "Publish or Export PDF", description: "Go live on your website instantly or export professional print-ready PDF catalogues." }
        ],
        stats: [
            { value: "10x", label: "Faster Than Manual" },
            { value: "50K+", label: "Products Catalogued" },
            { value: "AI", label: "Powered Descriptions" },
            { value: "1-Click", label: "PDF Export" }
        ],
        accentColor: { gradient: "from-purple-600 to-pink-500", light: "bg-purple-50", dark: "bg-purple-600", ring: "ring-purple-500" },
        metaTitle: "AI-Powered Product Catalogue Creator | Auto Descriptions & Pricing - Vyora",
        metaDescription: "Create stunning product catalogues in minutes with AI. Auto-generate SEO descriptions, smart pricing, bulk uploads, and PDF exports. Free to start.",
        relatedTools: ["smart-stock-management", "free-business-website", "free-marketing-sales-banner"]
    },
    {
        slug: "hisab-kitab-management",
        icon: FileText,
        title: "Hisab-Kitab Management",
        subtitle: "Smart Accounting & Billing",
        description: "Complete accounting solution with invoicing, expense tracking, and financial reports",
        definitionX: "comprehensive bookkeeping and financial ledger system",
        definitionY: "cashflow tracking and regulatory documentation challenges",
        mainImage: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&q=80&w=2076&ixlib=rb-4.0.3",
        features: ["Automated invoicing", "Expense tracking", "GST compliant", "Ledger management", "Profit & loss reports"],
        showcase: [
            {
                title: "GST Invoicing & Taxation",
                description: "Generate beautiful, compliant invoices with automated CGST, SGST, and IGST computations. Instantly deliver them to clients via email or WhatsApp.",
                image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2426&ixlib=rb-4.0.3"
            },
            {
                title: "Real-Time Financial Health",
                description: "Stop waiting for month-end reports. Access instant Profit & Loss statements, balance sheets, and outstanding payable ledgers with a single click.",
                image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2070&ixlib=rb-4.0.3"
            }
        ],
        detailedFeatures: [
            { title: "1-Click Invoicing", description: "Generate professional, branded invoices and send them directly to clients via WhatsApp or Email." },
            { title: "GST Compliance", description: "Automatically calculate CGST, SGST, and IGST to ensure complete tax compliance." },
            { title: "Auto-Reconciliation", description: "Match payments to invoices automatically, saving hours of manual ledger auditing." },
            { title: "Vendor Management", description: "Track outstanding payables and manage supplier ledgers from a dedicated dashboard." },
            { title: "Expense Tracking", description: "Log daily operational expenses rapidly to maintain a real-time view of cash flow." },
            { title: "Financial Reporting", description: "Generate instant Profit & Loss statements, balance sheets, and tax liability reports." }
        ],
        benefits: [
            { title: "Financial Clarity", description: "Know exactly how much money your business is making and spending in real-time." },
            { title: "Get Paid Faster", description: "Automated payment reminders and integrated payment links reduce outstanding dues." },
            { title: "Audit-Ready Always", description: "Keep your books perfectly organized for tax season without scrambling for invoices." }
        ],
        faqs: [
            { q: "Is the billing system GST compliant?", a: "100% GST compliant. The system automatically computes CGST, SGST, and IGST based on the latest Indian tax slabs. Your invoices are audit-ready from day one, and tax filing becomes a 10-minute task instead of a 3-day headache." },
            { q: "Can I track daily business expenses?", a: "Yes! Log expenses in seconds — rent, electricity, salaries, raw materials, transport. The system categorizes everything and shows you real-time cash flow so you always know exactly where your money is going." },
            { q: "Do I need accounting knowledge to use this?", a: "Not at all. If you can use WhatsApp, you can use Hisab-Kitab. It's designed like a digital version of your traditional bahi-khata (ledger), but with automated calculations, GST compliance, and instant reports." },
            { q: "Can I generate profit and loss statements?", a: "Absolutely. One-click P&L statements for any date range — daily, weekly, monthly, or yearly. Share them directly with your CA via WhatsApp or email. No more end-of-year panic." },
            { q: "Can I send invoices via WhatsApp?", a: "Yes! Generate a professional GST invoice and share it directly to your customer's WhatsApp in one tap. You can also send via email or print a physical copy. The customer gets a clean, branded document." },
            { q: "Does it track who owes me money?", a: "Yes, the outstanding receivables dashboard shows exactly who owes you, how much, and for how long. You can send automated payment reminders via SMS or WhatsApp — no awkward phone calls needed." },
            { q: "Can multiple people access the accounts?", a: "Yes, with role-based access. Your CA can have view-only access, your accountant can enter transactions, and you see the full dashboard. Everyone sees only what they need to." },
            { q: "Is my financial data secure?", a: "Bank-level security with 256-bit encryption, daily backups, and cloud storage. Your data is safer than a physical ledger — it can't be lost to fire, water damage, or theft." },
            { q: "Can I track inventory costs alongside accounting?", a: "Yes! Pair it with our Smart Stock Management tool for seamless inventory-to-accounting integration. When you sell an item, the cost of goods sold is automatically reflected in your P&L." },
            { q: "Does it support multiple bank accounts?", a: "Yes, link and reconcile multiple bank accounts and payment gateways. The system shows a consolidated view of all your financial streams in one dashboard." }
        ],
        testimonials: [
            { name: "Ramesh Gupta", role: "Owner, Gupta General Store", location: "Lucknow", initial: "R", content: "Switched from paper ledgers to Vyora's Hisab-Kitab. Now I know exactly how much profit I make daily. Tax filing used to take a week — now it's done in minutes with auto-generated GST reports!", rating: 5, metric: "90% ↓ Tax Time" },
            { name: "Pooja Nair", role: "CA, Nair & Associates", location: "Kochi", initial: "P", content: "I recommend Vyora to all my small business clients. The auto-reconciliation and expense tracking saves them from the chaos of manual bookkeeping. Audit preparation is now effortless.", rating: 5, metric: "100% Audit Ready" },
            { name: "Manoj Pandey", role: "Owner, Pandey Kirana", location: "Varanasi", initial: "M", content: "At 62 years old, I was terrified of leaving my paper bahi-khata. But Hisab-Kitab looks and feels just like my familiar ledger — only it does all the math automatically. My son helped me set it up in 20 minutes.", rating: 5, metric: "20min Setup" },
            { name: "Snehal Patil", role: "Manager, Fresh Dairy Farm", location: "Kolhapur", initial: "S", content: "With 200+ daily transactions, manual billing was chaos. Now every sale generates an instant GST invoice, and I can see total collections in real-time. Outstanding dues are visible at a glance.", rating: 5, metric: "200+ Daily Invoices" },
            { name: "Arun Krishnan", role: "Director, AK Engineering", location: "Coimbatore", initial: "A", content: "Our CA used to spend 5 days organizing our books every quarter. Now he downloads everything in one click. The P&L reports are so detailed that our bank approved a loan based on Vyora reports alone.", rating: 5, metric: "Loan Approved" },
            { name: "Rekha Sharma", role: "Owner, Rekha's Boutique", location: "Jaipur", initial: "R", content: "I used to forget half my expenses and think I was making more profit than I actually was. Hisab-Kitab showed me the real picture. I've since cut unnecessary costs and increased actual profit by 25%.", rating: 5, metric: "25% ↑ Profit" },
            { name: "Imran Siddiqui", role: "Partner, Siddiqui Traders", location: "Hyderabad", initial: "I", content: "We deal with 50+ suppliers. Tracking who we owe and who owes us was a nightmare. The vendor ledger and receivables dashboard now give us crystal clarity. Payment disputes have dropped to zero.", rating: 5, metric: "Zero Disputes" },
            { name: "Kavita Deshmukh", role: "Owner, Kavita Tiffin Services", location: "Pune", initial: "K", content: "Running a tiffin service with 300 daily orders, I need to know my food costs vs revenue instantly. The expense categorization and daily P&L feature is exactly what I needed. Game-changer!", rating: 5, metric: "Daily P&L" },
            { name: "Bharat Shah", role: "CEO, Shah Textiles Group", location: "Surat", initial: "B", content: "We migrated from Tally to Vyora and haven't looked back. The interface is 10x simpler, WhatsApp invoice sharing saves hours, and the cloud access means I check numbers from anywhere.", rating: 5, metric: "Tally → Vyora" },
            { name: "Anita Jain", role: "Founder, HomeBakers Co.", location: "Delhi", initial: "A", content: "As a home-based baker, I never tracked costs properly. Hisab-Kitab showed me that my popular chocolate cake was actually losing money after ingredient costs! I adjusted pricing and now every item is profitable.", rating: 5, metric: "100% Profitable" }
        ],
        problemStatement: "Most small businesses track finances on paper or basic spreadsheets. This leads to missed expenses, incorrect tax calculations, monthly P&L confusion, and panic during audit season. You never truly know if your business is profitable.",
        solutionStatement: "Vyora's Hisab-Kitab Management digitizes your entire financial workflow — automated GST invoicing, real-time expense tracking, instant P&L reports, and auto-reconciliation. Know exactly where every rupee goes, always.",
        howItWorks: [
            { step: 1, title: "Record Sales & Expenses", description: "Log transactions in seconds — create GST-compliant invoices and track expenses with one tap." },
            { step: 2, title: "Auto-Calculate Taxes", description: "CGST, SGST, IGST are computed automatically. No manual tax math ever again." },
            { step: 3, title: "Track Cash Flow", description: "See real-time dashboards showing income, expenses, outstanding payments, and net profit." },
            { step: 4, title: "Generate Reports", description: "Export P&L statements, balance sheets, and tax reports instantly for your CA or auditor." }
        ],
        stats: [
            { value: "₹0", label: "Accounting Errors" },
            { value: "5min", label: "Daily Bookkeeping" },
            { value: "100%", label: "GST Compliant" },
            { value: "1-Click", label: "P&L Reports" }
        ],
        accentColor: { gradient: "from-amber-600 to-orange-500", light: "bg-amber-50", dark: "bg-amber-600", ring: "ring-amber-500" },
        metaTitle: "Hisab-Kitab Accounting Software | GST Billing & Financial Reports - Vyora",
        metaDescription: "Simplify accounting with Vyora's Hisab-Kitab. Auto GST invoicing, expense tracking, P&L reports, and payment reconciliation. Built for Indian businesses.",
        relatedTools: ["payment-gateway", "smart-stock-management", "customer-management"]
    },
    {
        slug: "smart-stock-management",
        icon: Package,
        title: "Smart Stock Management",
        subtitle: "Inventory Management System",
        description: "AI-powered inventory management with real-time stock updates and alerts",
        definitionX: "real-time inventory control and prediction algorithm",
        definitionY: "stockouts and inventory holding cost inefficiencies",
        mainImage: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2426&ixlib=rb-4.0.3",
        features: ["Real-time tracking", "Low stock alerts", "Purchase orders", "Multi-warehouse support", "Barcode scanning"],
        showcase: [
            {
                title: "Multi-Warehouse Architecture",
                description: "Seamlessly track units across different retail stores, warehouses, and transit vehicles. Transfer stock between unities with complete audit trails.",
                image: "https://images.unsplash.com/photo-1555421689-491a97ff2040?auto=format&fit=crop&q=80&w=2070&ixlib=rb-4.0.3"
            },
            {
                title: "Predictive Restocking",
                description: "The AI engine analyzes historical sales velocity to alert you precisely when to reorder stock, preventing both dead-capital overstocking and costly stockouts.",
                image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2070&ixlib=rb-4.0.3"
            }
        ],
        detailedFeatures: [
            { title: "Real-Time Sync", description: "Inventory updates instantly across all sales channels the moment an item is sold or restocked." },
            { title: "Low Stock Alerts", description: "Receive automated notifications before you run out of your best-selling products." },
            { title: "Purchase Order Automation", description: "Automatically generate supplier POs based on intelligent reorder point algorithms." },
            { title: "Barcode Integration", description: "Scan items using a standard barcode scanner or your smartphone camera for rapid auditing." },
            { title: "Multi-Location Support", description: "Track inventory accurately across multiple retail stores and central warehouses." },
            { title: "Expiry Tracking", description: "Monitor batch numbers and expiration dates to prioritize the sale of older stock." }
        ],
        benefits: [
            { title: "Eliminate Stockouts", description: "Never miss a sale because a popular item unexpectedly ran out of stock." },
            { title: "Reduce Dead Stock", description: "Identify slow-moving items and liquidate them before they tie up crucial capital." },
            { title: "Prevent Shrinkage", description: "Maintain strict accountability over your inventory to drastically reduce theft and misplacement." }
        ],
        faqs: [
            { q: "How do low stock alerts work?", a: "You set your own 'reorder point' for each item — say, 20 units for a popular product. The moment stock dips to 20, you get an instant notification via app, email, or SMS. No more surprise stockouts during peak hours." },
            { q: "Can I manage multiple retail locations?", a: "Absolutely. Track inventory across unlimited stores, warehouses, and even vehicles in transit. Transfer stock between locations with a few taps and maintain a complete audit trail of every movement." },
            { q: "Does the system support barcode scanning?", a: "Yes! Use any standard barcode scanner or simply your smartphone camera. Scan items for instant stock checks, rapid receiving of deliveries, or quick physical inventory audits." },
            { q: "Can I automate purchase orders?", a: "Yes. When stock hits your defined threshold, the system auto-drafts a purchase order with the right quantities based on your sales velocity. Just review, approve, and send to your supplier — done in 30 seconds." },
            { q: "How does expiry tracking work?", a: "Add batch numbers and expiry dates when receiving stock. The system uses FIFO (First In, First Out) logic and alerts you 30/60/90 days before items expire. Perfect for pharmacies, food businesses, and cosmetics shops." },
            { q: "Can I see which products are selling fastest?", a: "Yes! The sales velocity dashboard shows your top movers, slow movers, and dead stock. This helps you stock more of what sells and clear out what doesn't — freeing up capital and shelf space." },
            { q: "Does it integrate with my billing system?", a: "Seamlessly. When paired with Vyora's Hisab-Kitab, every sale automatically deducts from inventory and records the transaction — zero manual entry, zero discrepancies between your books and your shelves." },
            { q: "Can my staff access it on their phones?", a: "Yes, the mobile app lets staff check stock levels, receive deliveries, do stock counts, and view alerts from anywhere. Perfect for warehouse managers and delivery teams on the move." },
            { q: "How do stock transfers between locations work?", a: "Initiate a transfer from Location A to Location B with quantities and items. The system tracks items as 'in transit' until received at the destination. Both locations see accurate, real-time numbers throughout." },
            { q: "Is there a way to handle returns and damaged goods?", a: "Yes. Log returns or damaged items separately with reason codes. This maintains accurate stock levels and gives you data on return patterns — helping you identify and address quality issues with specific products or suppliers." }
        ],
        testimonials: [
            { name: "Arjun Kapoor", role: "Owner, Kapoor Medical Store", location: "Kanpur", initial: "A", content: "Before Vyora, expired medicines were our biggest loss. Now the expiry tracking and FIFO alerts have reduced waste by 80%. The low stock alerts alone saved us ₹2 lakhs last quarter.", rating: 5, metric: "80% ↓ Waste" },
            { name: "Lakshmi Iyer", role: "Manager, SuperMart Retail", location: "Coimbatore", initial: "L", content: "Managing 3 store locations from one dashboard is magical. Stock transfers are seamless, and real-time sync means we never oversell. Our stockout incidents dropped to near zero.", rating: 5, metric: "~0 Stockouts" },
            { name: "Ravi Shankar", role: "Director, Shankar Electronics", location: "Bangalore", initial: "R", content: "We were sitting on ₹15 lakhs of dead stock without knowing it. The slow-moving inventory report was eye-opening. We liquidated everything with targeted clearance and reinvested the capital wisely.", rating: 5, metric: "₹15L Freed Up" },
            { name: "Parveen Kaur", role: "Owner, Fresh Bakes Bakery", location: "Amritsar", initial: "P", content: "For a bakery, ingredient freshness is everything. The expiry tracking sends me alerts 7 days before items expire. Food waste dropped by 60% and my margins improved dramatically.", rating: 5, metric: "60% ↓ Food Waste" },
            { name: "Santosh Mishra", role: "Manager, Mishra Hardware", location: "Patna", initial: "S", content: "Physical stock counts used to take my team 2 full days every month. With barcode scanning, we complete the entire audit in 4 hours. Discrepancies identified and resolved instantly.", rating: 5, metric: "4hr Audit" },
            { name: "Divya Raghavan", role: "CEO, FashionFirst Chain", location: "Chennai", initial: "D", content: "With 5 retail stores, we used to have size mismatches — Medium selling fast in one store while sitting idle in another. Smart transfers between locations solved this completely.", rating: 5, metric: "Balanced Stock" },
            { name: "Mohit Aggarwal", role: "Owner, Aggarwal Distributors", location: "Delhi", initial: "M", content: "Auto-generated purchase orders have simplified our supplier management dramatically. We used to call suppliers manually — now the system drafts POs based on exact requirements. Procurement is 70% faster.", rating: 5, metric: "70% Faster POs" },
            { name: "Shalini Nair", role: "Founder, Organica Health", location: "Kochi", initial: "S", content: "Our organic products have short shelf lives. The batch tracking and expiry management ensure we always sell the oldest stock first. Customer complaints about freshness? Zero since we started.", rating: 5, metric: "Zero Complaints" },
            { name: "Vinod Tiwari", role: "Partner, City Pharmacy", location: "Lucknow", initial: "V", content: "The multi-warehouse feature is perfect for our pharmacy chain. Central warehouse feeds 8 stores. We know exactly what's where, and auto-reorder ensures our shelves are never empty.", rating: 5, metric: "8-Store Coverage" },
            { name: "Neha Saxena", role: "Director, CraftWorld Supplies", location: "Jaipur", initial: "N", content: "We sell 3,000+ craft supply items. Before Vyora, we'd discover stockouts only when customers asked. Now proactive alerts mean we reorder before running out. Customer satisfaction is at an all-time high.", rating: 5, metric: "All-Time High CX" }
        ],
        problemStatement: "Running out of best-sellers loses you sales. Overstocking ties up capital. Expired products are pure waste. Without real-time inventory visibility across locations, you're flying blind — and it's costing you thousands every month.",
        solutionStatement: "Vyora's Smart Stock Management gives you real-time inventory tracking across all locations, AI-powered reorder alerts, barcode scanning, and expiry monitoring. Never run out, never overstock, and never lose money to dead inventory again.",
        howItWorks: [
            { step: 1, title: "Add Your Inventory", description: "Import your stock via spreadsheet or manually add items with barcode scanning support." },
            { step: 2, title: "Set Reorder Thresholds", description: "Define minimum stock levels per item — the system alerts you before you run out." },
            { step: 3, title: "Track Across Locations", description: "Monitor stock in real-time across multiple stores, warehouses, and transit points." },
            { step: 4, title: "Auto-Generate POs", description: "Let the system automatically create purchase orders for your suppliers when thresholds hit." }
        ],
        stats: [
            { value: "Real-Time", label: "Stock Sync" },
            { value: "80%", label: "Less Dead Stock" },
            { value: "Multi", label: "Location Support" },
            { value: "AI", label: "Reorder Predictions" }
        ],
        accentColor: { gradient: "from-orange-600 to-red-500", light: "bg-orange-50", dark: "bg-orange-600", ring: "ring-orange-500" },
        metaTitle: "Smart Stock & Inventory Management Software | Real-Time Tracking - Vyora",
        metaDescription: "AI-powered inventory management with real-time tracking, low-stock alerts, barcode scanning, multi-location support, and automated purchase orders.",
        relatedTools: ["hisab-kitab-management", "automagic-catalogue-creation", "payment-gateway"]
    },
    {
        slug: "customer-management",
        icon: Users,
        title: "Customer Management",
        subtitle: "Complete CRM Solution",
        description: "Manage customer relationships with detailed profiles, purchase history, and engagement",
        definitionX: "retention-focused customer database architecture",
        definitionY: "fragmented customer data and generalized engagement",
        mainImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2070&ixlib=rb-4.0.3",
        features: ["Customer profiles", "Purchase history", "Loyalty programs", "Activity logging", "Targeted segmentation"],
        showcase: [
            {
                title: "360-Degree Contact Profiles",
                description: "Stop hunting for client information across spreadsheets. Access their entire email history, purchase ledgers, and lifetime value in a single, perfectly organized dashboard view.",
                image: "https://images.unsplash.com/photo-1555421689-491a97ff2040?auto=format&fit=crop&q=80&w=2070&ixlib=rb-4.0.3"
            },
            {
                title: "Hyper-Targeted Segmentation",
                description: "Group customers instantly based on purchasing habits. Want to email every customer who bought product X but not product Y? Run the query and deploy the campaign in seconds.",
                image: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&q=80&w=2076&ixlib=rb-4.0.3"
            }
        ],
        detailedFeatures: [
            { title: "360° Customer Profiles", description: "View complete contact details, interaction history, and lifetime value in a single snapshot." },
            { title: "Interaction Timeline", description: "Keep a chronological record of every call, email, meeting, and purchase associated with a client." },
            { title: "Loyalty Programs", description: "Design point-based reward systems to encourage repeat business and deepen customer retention." },
            { title: "Dynamic Segmentation", description: "Instantly group your customers based on demographics, purchase behavior, or geographic location." },
            { title: "Feedback Management", description: "Automatically collect and analyze customer reviews, NPS scores, and general feedback." },
            { title: "Custom Fields", description: "Tailor the database to collect industry-specific data points vital to your unique operations." }
        ],
        benefits: [
            { title: "Boost Customer Retention", description: "Personalized engagement makes customers feel valued, dramatically increasing repeat purchases." },
            { title: "Upsell with Precision", description: "Use historical purchase data to predict and offer exactly what your customers need next." },
            { title: "Protect Customer Relationships", description: "If a salesperson leaves, the relationship history stays securely within your company." }
        ],
        faqs: [
            { q: "What data is stored in a customer profile?", a: "Everything that matters — name, contact details, complete purchase history, interaction timeline (calls, emails, meetings), lifetime value, loyalty points, preferences, feedback scores, and any custom fields you add. It's like having a personal dossier on every customer." },
            { q: "Can I create loyalty programs?", a: "Absolutely! Design point-based or tier-based loyalty programs customized to your business. Reward repeat purchases, referrals, or specific actions. Customers see their points balance and the rewards drive them to come back again and again." },
            { q: "Is it easy to segment my customer base?", a: "Incredibly easy. Filter by spending amount, visit frequency, location, last purchase date, product category, or any custom tag. Want to find 'all customers from Delhi who bought above ₹5,000 but haven't visited in 60 days'? One query, instant results." },
            { q: "Does the system track lifetime value?", a: "Yes, automatically. For every customer, you see their total spending since day one, average order value, purchase frequency, and predicted future value. This helps you identify who your true VIP customers are — and treat them accordingly." },
            { q: "Can I send targeted campaigns based on customer data?", a: "Yes! When paired with our Bulk Marketing tool, you can send hyper-personalized WhatsApp, SMS, or email campaigns to any customer segment. Birthday offers to this week's birthday customers? Done in 3 clicks." },
            { q: "What happens to customer data when an employee leaves?", a: "Everything stays safe in the system. Unlike personal phone contacts or Excel files employees might take with them, all interaction history, notes, and relationship data belongs to your business and is permanently preserved." },
            { q: "Can I collect and track customer feedback?", a: "Yes! Automatically send feedback requests after purchases via WhatsApp or SMS. Track Net Promoter Score (NPS), individual reviews, and overall satisfaction trends. Address negative feedback before it becomes a public complaint." },
            { q: "Does it work for B2B customers too?", a: "Perfectly. Add company name, GST number, credit terms, multiple contact persons per organization, and track deal pipelines. The system flexes between B2B and B2C use cases seamlessly." },
            { q: "Can I import my existing customer data?", a: "Yes! Upload a CSV or Excel file with your existing contacts and the system maps fields automatically. You can also sync from Google Contacts or your phone. Duplicate detection ensures clean data from day one." },
            { q: "How does the interaction timeline work?", a: "Every touchpoint is logged chronologically — purchases, phone calls, complaints, feedback, email conversations, WhatsApp messages, and manual notes. Before calling a customer, your team sees the full history at a glance. No repeated questions, no context loss." }
        ],
        testimonials: [
            { name: "Sahil Malhotra", role: "Owner, FitLife Gym Chain", location: "Delhi NCR", initial: "S", content: "Knowing each member's workout preferences and purchase history lets us upsell personal training packages perfectly. Retention improved by 45% in 3 months with automated birthday offers and renewal reminders.", rating: 5, metric: "45% ↑ Retention" },
            { name: "Meera Krishnan", role: "Founder, Glow Beauty Lounge", location: "Bangalore", initial: "M", content: "Customer segmentation changed everything. We send targeted offers to clients who haven't visited in 30 days and win back 30% of them every month. The loyalty points system keeps regulars coming back.", rating: 5, metric: "30% Win-Back Rate" },
            { name: "Rajat Khanna", role: "Director, Khanna Jewellers", location: "Chandigarh", initial: "R", content: "In jewelry, knowing a customer's taste is everything. The profile tells my staff exactly what Mrs. Sharma prefers — gold over diamond, traditional over modern. Personalization has boosted repeat sales by 55%.", rating: 5, metric: "55% ↑ Repeat Sales" },
            { name: "Asha Patel", role: "Owner, Little Stars Playschool", location: "Ahmedabad", initial: "A", content: "We track every parent interaction — admissions queries, fee payments, feedback, event participation. When re-enrollment time comes, we know exactly who needs a personal touch. Our retention rate hit 92%.", rating: 5, metric: "92% Retention" },
            { name: "Vikram Desai", role: "Founder, V-Wellness Spa", location: "Mumbai", initial: "V", content: "The feedback collection feature is gold. We identified that 3 customers had bad experiences with one therapist. We retrained her, and negative reviews stopped completely. Proactive quality control.", rating: 5, metric: "Zero Bad Reviews" },
            { name: "Neelam Tiwari", role: "Manager, Royal Sarees", location: "Varanasi", initial: "N", content: "Our staff used to keep customer preferences in their heads. When someone quit, we lost that knowledge. Now everything — color preferences, budget range, occasions — is in the system permanently.", rating: 5, metric: "Zero Knowledge Loss" },
            { name: "Siddharth Rao", role: "CEO, GreenCart Organics", location: "Hyderabad", initial: "S", content: "The lifetime value calculation was eye-opening. We discovered 15% of our customers generated 60% of revenue. We created a VIP tier with exclusive perks and their spending increased by another 20%.", rating: 5, metric: "20% ↑ VIP Spend" },
            { name: "Priya Menon", role: "Founder, Priya's Pet Care", location: "Kochi", initial: "P", content: "I track each pet's breed, vaccination schedule, grooming preferences, and owner instructions. My clients are amazed when we remember their pet's favorite shampoo or dietary restrictions. Pure delight!", rating: 5, metric: "Personalized Care" },
            { name: "Manish Joshi", role: "Partner, Joshi Auto Workshop", location: "Pune", initial: "M", content: "We know every car's service history — when it was last serviced, which parts were replaced, upcoming maintenance. Automated reminders bring customers back on schedule. Revenue is up 35% from repeat service.", rating: 5, metric: "35% ↑ Revenue" },
            { name: "Deepti Agarwal", role: "Owner, Cake Kingdom", location: "Lucknow", initial: "D", content: "The birthday tracking feature sends automated greetings with a 15% discount. Last month alone, 45 customers ordered birthday cakes because of the reminder. The feature literally pays for itself every week.", rating: 5, metric: "45 Cakes/Month" }
        ],
        problemStatement: "Customer data scattered across Excel sheets, phone contacts, and paper registers means you can't personalize communication. You don't know who your best customers are, who's about to churn, or what drives repeat purchases.",
        solutionStatement: "Vyora's Customer Management builds a 360° profile for every customer — purchase history, interaction timeline, lifetime value, and loyalty points — all in one dashboard. Segment, personalize, and retain like a Fortune 500 company.",
        howItWorks: [
            { step: 1, title: "Import Your Customers", description: "Upload your existing customer list or start fresh — every new transaction auto-creates a profile." },
            { step: 2, title: "Build Rich Profiles", description: "Track every interaction, purchase, feedback, and preference automatically over time." },
            { step: 3, title: "Segment & Target", description: "Group customers by spending, frequency, location, or custom tags for precision campaigns." },
            { step: 4, title: "Retain & Grow", description: "Deploy loyalty programs, automated re-engagement campaigns, and personalized offers." }
        ],
        stats: [
            { value: "360°", label: "Customer Profiles" },
            { value: "45%", label: "Better Retention" },
            { value: "∞", label: "Custom Segments" },
            { value: "LTV", label: "Auto-Calculated" }
        ],
        accentColor: { gradient: "from-indigo-600 to-violet-500", light: "bg-indigo-50", dark: "bg-indigo-600", ring: "ring-indigo-500" },
        metaTitle: "Customer Management & CRM Software | 360° Profiles & Loyalty - Vyora",
        metaDescription: "Build deep customer relationships with Vyora's CRM. 360° profiles, purchase history, loyalty programs, segmentation, and automated engagement tools.",
        relatedTools: ["unlimited-lead-management", "bulk-marketing-software", "hisab-kitab-management"]
    },
    {
        slug: "free-marketing-sales-banner",
        icon: Image,
        title: "Free Marketing & Sales Banner",
        subtitle: "Professional Marketing Materials",
        description: "Create stunning marketing banners and sales materials with professional templates",
        definitionX: "graphical asset generation and publishing suite",
        definitionY: "the high costs of professional graphic design workflows",
        mainImage: "https://images.unsplash.com/photo-1555421689-491a97ff2040?auto=format&fit=crop&q=80&w=2070&ixlib=rb-4.0.3",
        features: ["Professional templates", "Custom branding", "Social media ready", "Drag-and-drop editor", "One-click export"],
        showcase: [
            {
                title: "Enterprise Brand Kinetics",
                description: "Maintain absolute visual consistency. Set your brand's colors, fonts, and logos once, and our engine will globally apply them to every new template you generate.",
                image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2426&ixlib=rb-4.0.3"
            },
            {
                title: "One-Click Dimension Formatting",
                description: "Design a flyer once and instantly adapt it perfectly for an Instagram Post, LinkedIn Banner, or physical Print Poster without manual resizing.",
                image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2070&ixlib=rb-4.0.3"
            }
        ],
        detailedFeatures: [
            { title: "Premium Templates", description: "Access hundreds of professionally designed templates optimized for various industries and platforms." },
            { title: "Brand Kit Integration", description: "Store your logos, brand colors, and custom fonts for one-click application across all designs." },
            { title: "Auto-Resizing", description: "Instantly adapt a single design perfectly to Instagram, Facebook, LinkedIn, or print formats." },
            { title: "Advanced Typography", description: "Access premium font libraries and apply stunning text effects, shadows, and gradients." },
            { title: "Background Removal", description: "Isolate product images instantly with our AI-powered one-click background removal tool." },
            { title: "Stock Media Library", description: "Pulls from millions of royalty-free, high-resolution commercial images and vectors." }
        ],
        benefits: [
            { title: "Eliminate Design Costs", description: "Stop paying expensive agency retainers for basic social media updates and promotional banners." },
            { title: "Maintain Brand Consistency", description: "Ensure every piece of communication looks like it came from an elite corporate marketing department." },
            { title: "Capitalize on Trends Instantly", description: "Launch flash sales and capitalized on viral trends in minutes, not days." }
        ],
        faqs: [
            { q: "Are the templates customizable?", a: "Completely! Change colors, fonts, images, text, layout — everything. Start from a professional template and make it 100% yours in minutes. Your customers will think you hired a design agency." },
            { q: "Do I need to pay for stock images?", a: "No! We include access to millions of royalty-free, high-resolution images and vectors. Search by keyword, drag into your design, and you're done. No watermarks, no licensing headaches, no extra costs." },
            { q: "Can I export banners for different social platforms?", a: "One-click magic! Design once, then instantly resize for Instagram Post, Instagram Story, Facebook Cover, LinkedIn Banner, WhatsApp Status, and print formats. No manual cropping or awkward stretching." },
            { q: "Can I upload my own business logo?", a: "Absolutely. Upload your logo once to the Brand Kit and it's available across all templates. You can also save your brand colors and fonts so every design stays perfectly on-brand." },
            { q: "Is it really free?", a: "Yes! The core banner maker with templates, stock images, and export features is completely free. Premium templates and advanced features like team collaboration are available on the Pro plan, but most businesses never need to upgrade." },
            { q: "Can I create banners for print (posters, pamphlets)?", a: "Yes! Export in high-resolution CMYK format perfect for printing. Choose standard print sizes like A4, A3, flyer, or business card dimensions. The output is print-shop ready — just download and send to your printer." },
            { q: "How is this different from Canva?", a: "While Canva is great for general design, our templates are specifically designed for Indian businesses — festival themes, Indian cultural occasions, and industry-specific layouts for shops, restaurants, salons, and more. Plus, it's completely integrated with your Vyora ecosystem." },
            { q: "Can my team members also create banners?", a: "Yes! Add team members with their own access. They can create designs using your locked Brand Kit (logo, colors, fonts), ensuring brand consistency even when multiple people create marketing materials." },
            { q: "Can I schedule social media posts directly from the tool?", a: "Yes! Connect your social media accounts and schedule posts to go live at specific times. Design the banner, write the caption, pick the time, and the system handles the rest — no need for a separate scheduling tool." },
            { q: "Do you have templates for specific Indian festivals?", a: "Hundreds! Diwali, Holi, Eid, Christmas, Navratri, Pongal, Onam, Independence Day, Republic Day, Raksha Bandhan, and 200+ more. Each festival has 10-15 template variations to choose from." }
        ],
        testimonials: [
            { name: "Ritika Sharma", role: "Owner, Ritika Boutique", location: "Chandigarh", initial: "R", content: "I used to spend ₹5,000/month on a freelance designer for basic social media posts. Now I create professional banners in 2 minutes flat. The templates are gorgeous and my brand looks incredibly polished.", rating: 5, metric: "₹60K/yr Saved" },
            { name: "Karan Singh", role: "Marketing Head, TechNova Solutions", location: "Gurugram", initial: "K", content: "One-click resizing for different platforms is a lifesaver. We create campaign visuals for Instagram, LinkedIn, and WhatsApp in minutes. Our engagement rate has doubled since we started using Vyora banners.", rating: 5, metric: "2x Engagement" },
            { name: "Ananya Reddy", role: "Founder, Bloom Flowers", location: "Hyderabad", initial: "A", content: "For Valentine's Day, I created 15 different promotional banners in one evening — different offers for roses, bouquets, and gift baskets. Each one looked professionally designed. My Instagram blew up with orders!", rating: 5, metric: "15 Designs/Evening" },
            { name: "Prakash Mehta", role: "Owner, Mehta Electronics", location: "Rajkot", initial: "P", content: "During the festive season, we need a new banner almost daily — Navratri offers, Diwali deals, New Year sales. The festival template library is perfect. What used to cost ₹2,000 per design is now free.", rating: 5, metric: "₹0 Design Cost" },
            { name: "Zara Hussain", role: "Director, ZH Interior Studio", location: "Delhi", initial: "Z", content: "The Brand Kit feature is brilliant. I saved my exact brand colors (#2B5F8A), logo, and preferred font. Now every design my assistant creates automatically looks premium and consistent.", rating: 5, metric: "Brand Consistency" },
            { name: "Suresh Iyer", role: "Manager, GreenLeaf Restaurant", location: "Chennai", initial: "S", content: "We change our daily specials menu and need fresh WhatsApp status banners every morning. With saved templates, my staff creates the day's promotional graphic in literally 60 seconds.", rating: 5, metric: "60sec/Banner" },
            { name: "Pooja Bhandari", role: "Owner, PB Salon", location: "Dehradun", initial: "P", content: "My salon's Instagram went from 500 followers to 8,000 in 4 months. The secret? Consistent, professional-looking posts created with Vyora templates. Customers say we look like a premium franchise.", rating: 5, metric: "16x Followers" },
            { name: "Rahul Khanna", role: "Partner, Khanna Real Estate", location: "Noida", initial: "R", content: "Property listing banners used to go through a designer with 3-day turnaround. Now my agents create their own listing banners with photos, price, and specs in under 5 minutes. Speed to market is everything.", rating: 5, metric: "5min Listings" },
            { name: "Gayatri Nair", role: "Founder, Yoga with Gayatri", location: "Kochi", initial: "G", content: "As a solo yoga instructor, I can't afford a designer. These templates make my class schedules, workshop announcements, and motivational posts look like they came from a professional marketing team.", rating: 5, metric: "Pro-Level Posts" },
            { name: "Amjad Patel", role: "CEO, Patel Group of Hotels", location: "Ahmedabad", initial: "A", content: "We manage 4 hotel properties, each needing unique promotional materials for events, seasonal offers, and menu updates. The team collaboration with Brand Kit ensures all properties maintain our luxury brand standard.", rating: 5, metric: "4 Hotels Covered" }
        ],
        problemStatement: "Professional marketing materials require expensive designers or complex tools like Photoshop. Small businesses either settle for amateur-looking graphics or spend thousands monthly on freelance designers — both hurt brand perception and growth.",
        solutionStatement: "Vyora's Free Marketing & Sales Banner tool gives you access to hundreds of premium templates, drag-and-drop editing, brand kit integration, and one-click multi-platform export. Create stunning, professional marketing materials in minutes — for free.",
        howItWorks: [
            { step: 1, title: "Browse Premium Templates", description: "Choose from hundreds of industry-specific, professionally designed templates for any occasion." },
            { step: 2, title: "Customize with Your Brand", description: "Apply your brand colors, logos, fonts, and messaging with the visual drag-and-drop editor." },
            { step: 3, title: "Auto-Resize for Platforms", description: "One-click adaptation for Instagram, Facebook, LinkedIn, WhatsApp, and print formats." },
            { step: 4, title: "Download & Share", description: "Export in high-resolution formats and share directly to your social media accounts." }
        ],
        stats: [
            { value: "500+", label: "Premium Templates" },
            { value: "₹0", label: "Design Costs" },
            { value: "1-Click", label: "Multi-Platform Resize" },
            { value: "2min", label: "Avg. Creation Time" }
        ],
        accentColor: { gradient: "from-pink-600 to-rose-500", light: "bg-pink-50", dark: "bg-pink-600", ring: "ring-pink-500" },
        metaTitle: "Free Marketing Banner Maker | Professional Sales Posters & Graphics - Vyora",
        metaDescription: "Create stunning marketing banners and sales posters for free. 500+ templates, brand kit, auto-resize for social media, and drag-and-drop editor.",
        relatedTools: ["daily-greeting-poster", "bulk-marketing-software", "free-business-website"]
    },
    {
        slug: "employee-management",
        icon: Users,
        title: "Employee Management",
        subtitle: "Complete Staff Management System",
        description: "Manage your team efficiently with attendance tracking, payroll management, task assignment, and performance monitoring",
        definitionX: "workforce operations and human resources hub",
        definitionY: "administrative overhead regarding staff coordination",
        mainImage: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2426&ixlib=rb-4.0.3",
        features: ["Attendance tracking", "Payroll management", "Performance reports", "Role-based access", "Task delegation"],
        showcase: [
            {
                title: "Automated Digital Payroll",
                description: "Say goodbye to Excel spreadsheets. The platform automatically ingests attendance hours, calculates leave deductions, applies tax brackets, and generates secure digital payslips in seconds.",
                image: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&q=80&w=2076&ixlib=rb-4.0.3"
            },
            {
                title: "Geolocation Time Tracking",
                description: "Ensure your field staff or remote workers are exactly where they need to be. Employees can clock-in via mobile utilizing trusted GPS boundaries.",
                image: "https://images.unsplash.com/photo-1555421689-491a97ff2040?auto=format&fit=crop&q=80&w=2070&ixlib=rb-4.0.3"
            }
        ],
        detailedFeatures: [
            { title: "Biometric Integration", description: "Seamlessly connect with fingerprint or face-recognition hardware for foolproof time tracking." },
            { title: "Geolocation Clock-ins", description: "Ensure remote or field staff are exactly where they should be when they clock in via GPS." },
            { title: "Automated Payroll", description: "Instantly calculate wages, deduct taxes, apply bonuses, and generate compliant payslips." },
            { title: "Task Delegation", description: "Assign critical daily operational tasks to specific staff members and track completion in real-time." },
            { title: "Leave Management", description: "Streamline digital leave requests, approvals, and maintain accurate accrual balances." },
            { title: "Role-Based Security", description: "Limit sensitive system access ensuring employees only see data relevant to their specific roles." }
        ],
        benefits: [
            { title: "Eradicate Time Theft", description: "Ensure you are only paying for actual hours worked through strict digital verification." },
            { title: "Automate Payroll Headaches", description: "Turn a multi-day manual calculation nightmare into a 5-minute automated process." },
            { title: "Boost Accountability", description: "Clear task assignment leaves no room for confusion regarding who is responsible for what." }
        ],
        faqs: [
            { q: "How is employee attendance tracked?", a: "Multiple ways — in-app GPS-verified clock-in from their phone, biometric fingerprint/face scanners at your premises, or manual entry for flexibility. Every punch is timestamped, geolocated, and tamper-proof." },
            { q: "Does the system handle payroll calculations?", a: "Completely automated. It takes attendance hours, applies wage rates, calculates overtime, deducts advances and loans, applies tax brackets, and generates digital payslips — all in under 5 minutes for your entire team." },
            { q: "Can I restrict what my employees see?", a: "Absolutely. Role-Based Access Control (RBAC) means a delivery boy only sees his tasks, a store manager sees their outlet's data, and you see everything. No one sees salary data, customer info, or financials they shouldn't." },
            { q: "How are tasks assigned and monitored?", a: "Create tasks, set deadlines, assign to specific team members, and track completion in real-time. Employees see their task list on their app. You see a dashboard with progress bars and overdue alerts." },
            { q: "Can I track employees who work in the field?", a: "Yes! Field staff clock in from their location using the mobile app. GPS verification ensures they're actually at the client site, delivery location, or assigned area — not marking attendance from home." },
            { q: "How does the leave management work?", a: "Employees submit leave requests digitally. You approve or reject with one tap. The system maintains accurate leave balances (earned, sick, casual), and approved leaves automatically reflect in payroll calculations." },
            { q: "Can I manage staff across multiple branches?", a: "Yes! Manage employees from all your locations in one dashboard. Filter by branch, compare performance across outlets, and transfer staff between locations with automatic payroll adjustments." },
            { q: "Does it prevent buddy-punching (fake attendance)?", a: "Completely. GPS verification ensures employees are physically at the work location. Biometric integration makes it impossible for someone to mark attendance on behalf of another. We've eliminated time theft for thousands of businesses." },
            { q: "Can I track advances and loans given to employees?", a: "Yes. Record advances, set up automatic monthly deductions from salary, and track outstanding balances. Both you and the employee have full transparency on what's been given and what's been recovered." },
            { q: "Is there a mobile app for employees?", a: "Yes! Employees get a simple, clean mobile app to clock in/out, view their attendance history, check payslips, submit leave requests, view assigned tasks, and see their shift schedules — all without needing your help." }
        ],
        testimonials: [
            { name: "Harish Tiwari", role: "Owner, QuickServe Restaurant Chain", location: "Varanasi", initial: "H", content: "With 35 employees across 3 outlets, payroll used to take 2 full days. Vyora automated everything — attendance, overtime, deductions. Now it's done in 10 minutes. We also caught ₹40K in ghost attendance.", rating: 5, metric: "₹40K Saved/Mo" },
            { name: "Divya Menon", role: "HR Manager, UrbanFit Studios", location: "Kochi", initial: "D", content: "GPS-based clock-ins for our field trainers was revolutionary. No more buddy-punching or fake attendance. Task assignment and tracking keeps the entire team accountable and efficient.", rating: 5, metric: "0% Time Theft" },
            { name: "Naveen Kumar", role: "Owner, Kumar Logistics", location: "Bangalore", initial: "N", content: "Our 50 delivery drivers used to call in their attendance. Now GPS-verified clock-ins prove they're at the assigned route. Fake attendance claims dropped from ₹60K/month to literally zero.", rating: 5, metric: "₹0 Fake Claims" },
            { name: "Sarita Devi", role: "Director, Rainbow Preschool Chain", location: "Patna", initial: "S", content: "Managing 4 preschools with 60 teachers was a nightmare. Leave tracking, substitutes, payroll — all manual. Now everything is automated. Parents even get notified if their child's teacher is absent.", rating: 5, metric: "60 Staff Managed" },
            { name: "Rajesh Agarwal", role: "GM, Hotel Royal Palace", location: "Udaipur", initial: "R", content: "Our hotel operates 3 shifts with 80 staff. Automated shift scheduling and payroll for night shift differentials was impossible before. Vyora handles all of it — including holiday overtime calculations.", rating: 5, metric: "3-Shift Auto Payroll" },
            { name: "Fathima Begum", role: "Owner, Fathima Catering", location: "Hyderabad", initial: "F", content: "I hire 20 extra workers for wedding season. Adding temporary staff, tracking their hours, and calculating daily wages used to be chaotic. Now I add them in 2 minutes and the system tracks everything automatically.", rating: 5, metric: "Easy Temp Staff" },
            { name: "Ashok Prajapati", role: "Factory Owner, Prajapati Ceramics", location: "Morbi", initial: "A", content: "With piece-rate workers, I need to track output per worker per day. The task completion feature lets me log production counts and calculate wages based on actual output. Disputes over wages have vanished.", rating: 5, metric: "Zero Wage Disputes" },
            { name: "Preeti Chopra", role: "HR Head, GreenTech Solutions", location: "Noida", initial: "P", content: "The role-based access is perfect. Team leads see their team's attendance, department heads see department data, and only HR sees salary information. Clean, secure, and organized.", rating: 5, metric: "Secure Access" },
            { name: "Vikrant Singh", role: "Owner, Singh Security Services", location: "Delhi", initial: "V", content: "Our 120 security guards work at different client sites. GPS clock-ins at each site give our clients confidence that guards are genuinely on duty. Client complaints about absent guards dropped to zero.", rating: 5, metric: "120 Guards Tracked" },
            { name: "Lakshmi Sundaram", role: "Manager, Sundaram Textiles", location: "Madurai", initial: "L", content: "The advance tracking feature is underrated. Workers used to forget how much advance they'd taken, causing monthly disputes. Now both sides see the exact balance. Trust has improved and turnover decreased.", rating: 5, metric: "↓ Staff Turnover" }
        ],
        problemStatement: "Managing employee attendance on paper, calculating payroll in Excel, and tracking tasks via WhatsApp messages leads to errors, time theft, disputes, and hours of administrative overhead every single month.",
        solutionStatement: "Vyora's Employee Management automates attendance with GPS/biometric tracking, calculates payroll instantly with tax deductions, and provides clear task assignment dashboards — turning days of admin work into minutes.",
        howItWorks: [
            { step: 1, title: "Add Your Team", description: "Register employees with roles, salaries, and access permissions in the centralized dashboard." },
            { step: 2, title: "Track Attendance", description: "Employees clock in/out via app with GPS verification or biometric integration — no manipulation possible." },
            { step: 3, title: "Auto-Calculate Payroll", description: "The system computes wages, overtime, deductions, advances, and generates digital payslips automatically." },
            { step: 4, title: "Assign & Monitor Tasks", description: "Deploy tasks to specific staff, set deadlines, and track real-time completion from your dashboard." }
        ],
        stats: [
            { value: "10min", label: "Payroll Processing" },
            { value: "0%", label: "Attendance Fraud" },
            { value: "GPS", label: "Verified Clock-ins" },
            { value: "RBAC", label: "Role-Based Access" }
        ],
        accentColor: { gradient: "from-teal-600 to-cyan-500", light: "bg-teal-50", dark: "bg-teal-600", ring: "ring-teal-500" },
        metaTitle: "Employee Management Software | Attendance, Payroll & Tasks - Vyora",
        metaDescription: "Automate employee attendance tracking, payroll calculations, task assignment, and leave management. GPS-verified, biometric-ready, and role-based access control.",
        relatedTools: ["hisab-kitab-management", "customer-management", "customer-support"]
    },
    {
        slug: "daily-greeting-poster",
        icon: Calendar,
        title: "Daily Greeting Poster",
        subtitle: "Automated Social Media Posts",
        description: "Automatically generate and schedule daily greeting posts for festivals and occasions to keep your brand visible",
        definitionX: "programmatic social media engagement engine",
        definitionY: "inconsistent branded communication and audience interaction",
        mainImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2070&ixlib=rb-4.0.3",
        features: ["Automated posting", "Festival greetings", "Brand consistency", "Custom scheduling", "Analytics tracking"],
        showcase: [
            {
                title: "Hands-Free Social Presence",
                description: "Connect your Facebook, Instagram, and LinkedIn accounts natively. The engine independently publishes perfectly timed, fully-branded artistic posts every single day.",
                image: "https://images.unsplash.com/photo-1555421689-491a97ff2040?auto=format&fit=crop&q=80&w=2070&ixlib=rb-4.0.3"
            },
            {
                title: "Intelligent Festival Calendar",
                description: "Never miss an opportunity to connect with your local community. The database continuously updates and recognizes pan-Indian and hyper-regional festivals seamlessly.",
                image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2426&ixlib=rb-4.0.3"
            }
        ],
        detailedFeatures: [
            { title: "Auto-Generated Content", description: "Wake up to fresh, completely formulated social posts tailored to the day's special events or festivals." },
            { title: "Multi-Platform Publishing", description: "Broadcast automatically and simultaneously to Facebook, Instagram, LinkedIn, and WhatsApp." },
            { title: "Smart Logo Injection", description: "Your business logo and contact information are immaculately composited onto every design." },
            { title: "Extensive Calendar", description: "Pre-loaded with all major national, regional, and minor cultural festivals and significant days." },
            { title: "Caption Generation", description: "Uses AI to generate contextual, engaging textual captions and relevant hashtags alongside the graphics." },
            { title: "Engagement Analytics", description: "Monitor the reach, likes, and shares of your automated posts directly from the central dashboard." }
        ],
        benefits: [
            { title: "Effortless Consistency", description: "Stay at the top of your customers' minds without having to remember what to post every day." },
            { title: "Show Local Relevance", description: "Celebrate regional festivals automatically to forge deeper connections with your local customer base." },
            { title: "Maximize Organic Reach", description: "Continuous posting significantly boosts your algorithmic favorability on major social networks." }
        ],
        faqs: [
            { q: "What are greeting posters?", a: "Think of them as branded social media graphics that celebrate festivals, national days, and special occasions — with your business logo, colors, and contact details beautifully embedded. They keep your brand visible to customers 365 days a year." },
            { q: "Can the system post automatically?", a: "Yes! Connect your Facebook, Instagram, and WhatsApp Business accounts once. The system auto-publishes perfectly timed greeting posts every single day without you lifting a finger. Wake up and your social media is already active." },
            { q: "Will my business logo be on the posters?", a: "Always. Upload your logo, brand colors, and contact details once. Every generated poster automatically incorporates your branding — making it look like you hired a designer for each post." },
            { q: "Does the calendar include regional festivals?", a: "Absolutely! We cover 500+ occasions including pan-Indian festivals (Diwali, Eid, Christmas), regional celebrations (Pongal, Onam, Bihu, Chhath), national days, international days, and even industry-specific observances." },
            { q: "Can I preview and edit posts before they go live?", a: "Yes! You can preview every auto-generated post, edit the caption or design, and approve it before publishing. Or set it to full autopilot if you're comfortable with the AI's selections." },
            { q: "How many designs are generated for each occasion?", a: "The system generates 3-5 design variations for each occasion. You can pick your favorite or let the AI auto-select based on your past preferences and what performs best with your audience." },
            { q: "Will it post on Sundays and holidays too?", a: "Every single day — including weekends, public holidays, and especially on festivals when social media engagement peaks. That's actually when greeting posts perform best!" },
            { q: "Can I add custom text or offers to the posters?", a: "Yes! Add your own promotional message like '20% off on Diwali — Shop Now!' or custom greetings. The AI integrates your text seamlessly into the design while keeping it visually appealing." },
            { q: "Does it support local languages?", a: "Yes! Generate greeting text in Hindi, Tamil, Bengali, Marathi, Gujarati, Telugu, Kannada, and more. Send Onam greetings in Malayalam and Navratri wishes in Gujarati for maximum local impact." },
            { q: "How does this help my business grow?", a: "Consistent daily posting increases your social media visibility by 5-10x. The algorithm rewards regular posting, your brand stays top-of-mind, and festival posts create emotional connections with customers that drive foot traffic and sales." }
        ],
        testimonials: [
            { name: "Amit Saxena", role: "Owner, Saxena Sweets", location: "Agra", initial: "A", content: "We never miss a festival greeting now. Our customers feel personally connected when they see Diwali, Eid, or Holi posts with our brand. Social media followers went from 200 to 5,000 in 6 months!", rating: 5, metric: "25x Followers" },
            { name: "Fatima Sheikh", role: "Founder, FreshBites Cafe", location: "Pune", initial: "F", content: "I used to forget to post for weeks. Now the system does it automatically every day. Our Instagram engagement tripled and walk-in customers mention our posts regularly. It runs completely on autopilot!", rating: 5, metric: "3x Engagement" },
            { name: "Gaurav Mehta", role: "Director, Mehta Jewellers", location: "Surat", initial: "G", content: "The Dhanteras and Akshaya Tritiya greeting posts brought customers into the store — people said they saw our post and remembered to buy gold. Festival marketing on autopilot is genius!", rating: 5, metric: "Festival Walk-ins" },
            { name: "Radha Krishnamurthy", role: "Owner, Radha's Boutique", location: "Mysore", initial: "R", content: "My WhatsApp Status now has a fresh, branded greeting every morning. Customers screenshot and share our posts! The regional language support means I send Kannada greetings that feel personal and local.", rating: 5, metric: "Shared by Customers" },
            { name: "Manish Soni", role: "Founder, Soni Electronics", location: "Ahmedabad", initial: "M", content: "During Navratri, the system posted 9 consecutive days of garba-themed greetings with our branding. One customer told us it felt like we were celebrating with them. That's exactly the connection we wanted.", rating: 5, metric: "9-Day Festival Series" },
            { name: "Nandini Rao", role: "Manager, GreenSprout Organic", location: "Bangalore", initial: "N", content: "As an organic food brand, environmental awareness days (Earth Day, World Environment Day) are perfect for us. The system catches every relevant occasion and posts accordingly. Our audience loves it.", rating: 5, metric: "Relevant Content" },
            { name: "Tariq Ansari", role: "Owner, Ansari Garments", location: "Lucknow", initial: "T", content: "We serve Hindu, Muslim, and Sikh customers equally. The diverse festival calendar ensures we wish everyone — Diwali, Eid, Gurupurab. Customers from all communities feel valued and appreciated.", rating: 5, metric: "Inclusive Greetings" },
            { name: "Jyoti Sharma", role: "Founder, Jyoti Dance Academy", location: "Jaipur", initial: "J", content: "The AI-generated captions include relevant hashtags that actually work. Our Navaratri garba post reached 15,000 people organically — the best reach we've ever had! All without spending a single rupee on ads.", rating: 5, metric: "15K Organic Reach" },
            { name: "Sunil Pillai", role: "Owner, Malabar Cafe", location: "Trivandrum", initial: "S", content: "Our Onam and Vishu greetings in Malayalam with our cafe branding go viral locally every year. Customers share them in family WhatsApp groups. It's free marketing that money can't buy.", rating: 5, metric: "Viral Local Posts" },
            { name: "Bhavna Desai", role: "Partner, Desai Sweet Home", location: "Vadodara", initial: "B", content: "We added a promotional overlay to festival posts — '15% off sweets this Diwali!' The combination of emotional greeting + promotional offer drove our highest-ever festive season sales. Simple but powerful.", rating: 5, metric: "Record Sales" }
        ],
        problemStatement: "Inconsistent social media presence kills brand recall. Small businesses forget to post, can't afford daily design work, and miss festival opportunities that could drive massive local engagement and foot traffic.",
        solutionStatement: "Vyora's Daily Greeting Poster auto-generates branded, festival-aware posts and publishes them across your social channels every single day — completely hands-free. Stay top-of-mind with zero daily effort.",
        howItWorks: [
            { step: 1, title: "Connect Social Accounts", description: "Link your Facebook, Instagram, LinkedIn, and WhatsApp Business accounts to the platform." },
            { step: 2, title: "Set Your Brand Kit", description: "Upload your logo, brand colors, and contact details — they'll appear on every generated poster." },
            { step: 3, title: "Auto-Generate Daily", description: "The system creates beautiful, festival-aware posts every morning based on the extensive event calendar." },
            { step: 4, title: "Auto-Publish Everywhere", description: "Posts go live across all connected platforms at the optimal time — no manual intervention needed." }
        ],
        stats: [
            { value: "365", label: "Posts Per Year" },
            { value: "100%", label: "Hands-Free" },
            { value: "500+", label: "Festivals Covered" },
            { value: "Multi", label: "Platform Publishing" }
        ],
        accentColor: { gradient: "from-yellow-500 to-amber-500", light: "bg-yellow-50", dark: "bg-yellow-600", ring: "ring-yellow-500" },
        metaTitle: "Daily Greeting Poster Generator | Automated Social Media Posts - Vyora",
        metaDescription: "Auto-generate branded festival greeting posters and publish them daily across Facebook, Instagram, and WhatsApp. 500+ festivals, zero manual effort.",
        relatedTools: ["free-marketing-sales-banner", "bulk-marketing-software", "free-business-website"]
    },
    {
        slug: "bulk-marketing-software",
        icon: Send,
        title: "Bulk Marketing Software",
        subtitle: "Mass Communication Apps",
        description: "Send bulk SMS, WhatsApp messages, and emails to your customers with advanced targeting",
        definitionX: "omnichannel broadcast and mass-communication module",
        definitionY: "outreach friction and limited geographic scaling",
        mainImage: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&q=80&w=2076&ixlib=rb-4.0.3",
        features: ["Bulk messaging", "Advanced targeting", "Campaign analytics", "WhatsApp integration", "Automated drip sequences"],
        showcase: [
            {
                title: "Official WhatsApp API Integration",
                description: "Launch enormous multimedia promotional campaigns directly to your customers' most frequently checked inbox via verified WhatsApp Business transmission rails.",
                image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2426&ixlib=rb-4.0.3"
            },
            {
                title: "Granular Delivery Analytics",
                description: "Watch your campaign succeed in real-time. Monitor definitive open rates, read receipts, and direct link click-through metrics live as the broadcast unfolds.",
                image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2070&ixlib=rb-4.0.3"
            }
        ],
        detailedFeatures: [
            { title: "WhatsApp Business API", description: "Send verified, official multimedia WhatsApp messages to thousands of customers simultaneously." },
            { title: "Advanced Segmentation", description: "Filter your database and target broadcasts precisely based on previous purchase history or location." },
            { title: "Automated Drip Campaigns", description: "Design multi-stage communication sequences that nurture cold leads into paying customers over time." },
            { title: "Dynamic Personalization", description: "Automatically insert first names, recent product purchases, or personalized discount codes into bulk blasts." },
            { title: "A/B Testing", description: "Test different message formats or subject lines to statistically determine the highest converting approach." },
            { title: "Real-time Delivery Reports", description: "Monitor exact delivery status, open rates, and link click-through metrics live as the campaign runs." }
        ],
        benefits: [
            { title: "Instant Revenue Generation", description: "A single targeted blast highlighting a flash sale can drive hundreds of immediate transactions." },
            { title: "Unmatched Delivery Rates", description: "WhatsApp and direct SMS boast 98% open rates compared to the fraction achieved by traditional marketing." },
            { title: "Re-engage Dormant Customers", description: "Automatically target customers who haven't purchased in 90 days with special 'we miss you' offers." }
        ],
        faqs: [
            { q: "Can I send bulk WhatsApp messages?", a: "Yes! Through the official WhatsApp Business API — not shady third-party hacks. Send text, images, videos, PDFs, and interactive buttons to thousands of customers. Fully compliant, fully verified, zero ban risk." },
            { q: "Will my messages get blocked as spam?", a: "No. We use official, verified API gateways with strict compliance protocols. Your messages come from your verified business number, not random numbers. High deliverability is built into the system — 98%+ open rates are standard." },
            { q: "Can I schedule campaigns in advance?", a: "Absolutely. Plan your campaigns weeks ahead — schedule date, time, audience segment, and message content. Perfect for planning festival campaigns, flash sales, or new product launches without last-minute panic." },
            { q: "How do I measure campaign success?", a: "Real-time dashboard shows delivery rates, open rates, click-through rates, and conversions — as the campaign runs. You'll know within minutes which message variant is performing best, and you can adjust instantly." },
            { q: "Can I personalize bulk messages?", a: "Yes! Dynamic fields insert each customer's name, last purchase, custom discount code, or any data point into the message. 'Hi Priya, your favorite face cream is back in stock — here's 15% off just for you!' feels personal, not spammy." },
            { q: "What's the difference between broadcast and drip campaigns?", a: "A broadcast sends one message to everyone at once (flash sale). A drip campaign sends a sequence over time (Day 1: welcome, Day 3: product guide, Day 7: discount offer). Both are powerful — and both are built in." },
            { q: "Can I A/B test my messages?", a: "Yes! Send two message variants to small test groups. The system automatically identifies the winner based on open rates or click-through, then sends the winning version to the rest of your audience. Data-driven marketing made easy." },
            { q: "Is there a limit on how many messages I can send?", a: "No arbitrary limits. Send 100 or 100,000 messages — pricing is based on channel (WhatsApp, SMS, email) and volume. The platform is built to scale with your growth without hitting walls." },
            { q: "Can I target only specific customer segments?", a: "Precisely. Filter by purchase history, location, gender, age, last visit date, product interest, or any custom tag. Send Diwali offers only to Delhi customers who bought ethnic wear last year? Easy." },
            { q: "Does it support email marketing too?", a: "Yes! Send beautiful HTML emails with templates, personalization, and tracking — alongside WhatsApp and SMS campaigns. True omnichannel marketing from one dashboard." }
        ],
        testimonials: [
            { name: "Nitin Choudhary", role: "Founder, StyleHub Fashion", location: "Indore", initial: "N", content: "A single Diwali sale WhatsApp blast generated ₹8 lakhs in revenue overnight. The segmentation feature lets us target only customers who've purchased ethnic wear. ROI is insane compared to Facebook ads.", rating: 5, metric: "₹8L from 1 Campaign" },
            { name: "Roshni Kapoor", role: "Owner, PureGlow Skincare", location: "Delhi", initial: "R", content: "We re-engaged 2,000 dormant customers with an automated 'We miss you' drip sequence. 18% came back and placed orders within a week. The A/B testing helped us find the perfect message.", rating: 5, metric: "18% Win-Back" },
            { name: "Aditya Sharma", role: "Director, Sharma Auto Accessories", location: "Jaipur", initial: "A", content: "We segmented customers by car brand — Honda owners get Honda accessories offers, Maruti owners get Maruti deals. Conversion rate went from 2% on generic blasts to 12% on segmented ones. Incredible difference!", rating: 5, metric: "6x Conversion" },
            { name: "Preethi Nambiar", role: "Owner, Kerala Spice House", location: "Kochi", initial: "P", content: "Our Onam special combo offer via WhatsApp blast reached 5,000 customers. 800 placed orders within 48 hours. The delivery tracking showed 98% message delivery. No other channel gives this ROI.", rating: 5, metric: "16% Response Rate" },
            { name: "Sameer Khan", role: "Marketing Head, FitnessFirst Gyms", location: "Mumbai", initial: "S", content: "We send personalized membership renewal reminders 30 days before expiry. Follow-up drip at 15 days and 5 days. Renewal rate jumped from 55% to 82%. The drip sequences practically run our retention strategy.", rating: 5, metric: "82% Renewals" },
            { name: "Kavitha Sundaram", role: "Founder, Kavitha's Kitchen", location: "Chennai", initial: "K", content: "Every Friday, we blast our weekend special menu to 3,000 subscribers. Orders pour in by Saturday morning. The best part? I schedule the entire month's campaigns in one sitting. Set it and forget it.", rating: 5, metric: "Weekly Revenue Boost" },
            { name: "Bhupesh Agarwal", role: "CEO, Agarwal Construction", location: "Lucknow", initial: "B", content: "For our real estate projects, we send targeted WhatsApp brochures to potential buyers segmented by budget range and location preference. 5 flat bookings came from a single campaign. Each worth ₹30L+.", rating: 5, metric: "₹1.5Cr from Blasts" },
            { name: "Sonal Mehta", role: "Manager, Trend Boutique", location: "Ahmedabad", initial: "S", content: "The A/B testing showed that messages with product images got 3x more clicks than text-only. Small insight, huge impact. We now always include visuals, and our click-through rate stays above 15%.", rating: 5, metric: "15%+ CTR" },
            { name: "Irfan Patel", role: "Owner, MediCare Pharmacy", location: "Surat", initial: "I", content: "We send prescription refill reminders to patients 3 days before their medicines run out. Patients love the convenience, and our repeat orders are up 40%. It's healthcare + marketing in perfect harmony.", rating: 5, metric: "40% ↑ Repeats" },
            { name: "Geeta Tiwari", role: "Founder, LittleSteps Preschool", location: "Bhopal", initial: "G", content: "We used bulk SMS for admission season — targeted parents with kids aged 2-5 in our locality. Got 120 admission inquiries from one campaign. Cost per inquiry was ₹8 compared to ₹200 on Google Ads.", rating: 5, metric: "₹8/Inquiry" }
        ],
        problemStatement: "Generic marketing blasts get ignored. Without audience segmentation, personalization, and delivery analytics, your campaigns are shouting into the void — wasting money and annoying customers who unsubscribe or block you.",
        solutionStatement: "Vyora's Bulk Marketing Software sends targeted, personalized campaigns via WhatsApp API, SMS, and email with advanced segmentation, A/B testing, drip sequences, and real-time delivery analytics — ensuring every message converts.",
        howItWorks: [
            { step: 1, title: "Segment Your Audience", description: "Filter customers by purchase history, location, engagement level, or any custom attribute." },
            { step: 2, title: "Create Your Campaign", description: "Design personalized messages with dynamic fields (name, last purchase, offers) and multimedia." },
            { step: 3, title: "Schedule & Send", description: "Broadcast instantly or schedule for the perfect time. A/B test different versions for best results." },
            { step: 4, title: "Track Results Live", description: "Monitor delivery rates, opens, clicks, and conversions in real-time to measure exact ROI." }
        ],
        stats: [
            { value: "98%", label: "WhatsApp Open Rate" },
            { value: "10x", label: "ROI vs Traditional" },
            { value: "A/B", label: "Split Testing" },
            { value: "Drip", label: "Auto Sequences" }
        ],
        accentColor: { gradient: "from-violet-600 to-purple-500", light: "bg-violet-50", dark: "bg-violet-600", ring: "ring-violet-500" },
        metaTitle: "Bulk WhatsApp & SMS Marketing Software | Targeted Campaigns - Vyora",
        metaDescription: "Send bulk WhatsApp, SMS, and email campaigns with smart segmentation, A/B testing, drip sequences, and real-time analytics. 98% open rates guaranteed.",
        relatedTools: ["unlimited-lead-management", "customer-management", "daily-greeting-poster"]
    },
    {
        slug: "payment-gateway",
        icon: CreditCard,
        title: "Payment Gateway",
        subtitle: "Secure Payment Processing",
        description: "Accept payments online with multiple payment options, instant settlements, and fraud protection",
        definitionX: "financial transaction routing and settlement layer",
        definitionY: "friction in digital collections and reconciliation",
        mainImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2070&ixlib=rb-4.0.3",
        features: ["Multiple payment options", "Instant settlements", "Fraud protection", "UPI integration", "Automated receipts"],
        showcase: [
            {
                title: "Omnichannel UPI & Cards",
                description: "Never lose a sale to friction. Accept payments natively via Google Pay, Paytm, PhonePe, or traditional Credit/Debit cards through an ultra-secure, PCI-compliant portal.",
                image: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&q=80&w=2076&ixlib=rb-4.0.3"
            },
            {
                title: "Intelligent Payment Links",
                description: "Generate highly converting digital payment links linked directly to invoices. Send them instantly via WhatsApp and watch auto-reconciliation happen the moment the client pays.",
                image: "https://images.unsplash.com/photo-1555421689-491a97ff2040?auto=format&fit=crop&q=80&w=2070&ixlib=rb-4.0.3"
            }
        ],
        detailedFeatures: [
            { title: "Native UPI Integration", description: "Seamless, zero-friction intent flows for Google Pay, PhonePe, Paytm, and all major UPI applications." },
            { title: "Universal Acceptance", description: "Process domestic and international credit cards, debit cards, and 50+ net banking institutions." },
            { title: "Payment Links", description: "Generate custom, secure payment links directly from the dashboard and dispatch via WhatsApp or SMS." },
            { title: "Smart Routing", description: "Automatically route transactions through the most reliable bank gateways to maximize success rates." },
            { title: "Zero-Setup Subscriptions", description: "Establish recurring e-mandates for continuous billing or subscription-based business models easily." },
            { title: "Automated Reconciliation", description: "Every digital payment is instantly mirrored and reconciled against its corresponding invoice in your ledger." }
        ],
        benefits: [
            { title: "Reduce Cart Abandonment", description: "A flawless, integrated payment experience ensures customers don't drop off at the final step." },
            { title: "Improve Cash Flow", description: "Take advantage of rapid rolling settlements to get funds deposited into your bank account faster." },
            { title: "Eradicate Human Error", description: "No more manually matching bank statements to customer invoices—everything matches automatically." }
        ],
        faqs: [
            { q: "Which payment methods are supported?", a: "Everything your customers use — UPI (Google Pay, PhonePe, Paytm), credit cards, debit cards, net banking from 50+ banks, digital wallets, and even international cards. One integration, all payment methods covered." },
            { q: "How fast are the digital settlements?", a: "T+1 for most transactions — meaning money hits your bank account the next business day. Some plans offer same-day settlement. No more waiting a week to access your own revenue." },
            { q: "Is the payment processing secure?", a: "Bank-grade security with PCI-DSS Level 1 compliance, 256-bit encryption, 3D Secure authentication, and real-time fraud detection. Your customers' financial data is protected to the highest global standards." },
            { q: "Can I send payment links to customers?", a: "Yes! Generate a payment link in 10 seconds, share via WhatsApp or SMS, and the customer pays instantly from their phone. Perfect for collecting advance payments, deposits, or outstanding dues without any awkward conversations." },
            { q: "Does it integrate with my invoicing system?", a: "Seamlessly. When paired with Vyora's Hisab-Kitab, every payment auto-reconciles against the corresponding invoice. No manual matching, no missing entries, no end-of-day discrepancies." },
            { q: "Can I set up recurring payments or subscriptions?", a: "Yes! Create e-mandates for monthly subscriptions, memberships, or EMI plans. Customers authorize once, and payments happen automatically every cycle. Perfect for gyms, SaaS, rent collection, and service retainers." },
            { q: "What about refunds?", a: "Process full or partial refunds directly from the dashboard in 2 clicks. The refund is automatically reflected in your accounting system, and the customer receives notification. Clean, traceable, and hassle-free." },
            { q: "Is there a setup fee or minimum transaction requirement?", a: "Zero setup fee, zero maintenance fee. You only pay a small percentage per transaction — and that rate decreases as your volume grows. No hidden charges, no surprises on your statement." },
            { q: "Can I accept payments on my website?", a: "Yes! Embed our payment widget on your website or use our hosted checkout page. Completely white-labeled with your branding. Customers never leave your site to make a payment." },
            { q: "What happens if a payment fails?", a: "Smart retry logic automatically retries failed transactions through alternative bank routes. Our smart routing achieves 99%+ success rates. Failed payment? The system finds another route before the customer even notices." }
        ],
        testimonials: [
            { name: "Sanjay Dubey", role: "Owner, Dubey Electronics", location: "Bhopal", initial: "S", content: "Payment links via WhatsApp changed our collection game completely. Outstanding dues dropped by 70% because customers can pay instantly from their phone. Settlement is fast and reconciliation is automatic.", rating: 5, metric: "70% ↓ Dues" },
            { name: "Preethi Reddy", role: "Director, CloudTech Services", location: "Hyderabad", initial: "P", content: "We set up recurring subscriptions for our SaaS clients using Vyora's payment gateway. Churn reduced because auto-debits happen seamlessly. The smart routing ensures 99% payment success.", rating: 5, metric: "99% Success Rate" },
            { name: "Mahesh Choudhary", role: "Owner, Choudhary Furniture", location: "Jodhpur", initial: "M", content: "Customers used to say 'I'll pay later' and then forget. Now I send a payment link via WhatsApp right after delivery. 95% pay within the hour. Cash flow has never been this predictable.", rating: 5, metric: "95% Same-Day Pay" },
            { name: "Anita Krishnan", role: "Director, Dance Dhamaka Academy", location: "Chennai", initial: "A", content: "Monthly fee collection from 200 students used to be a nightmare. Now automated e-mandates collect fees on the 1st of every month. Late payments dropped from 40% to 3%. Parents love the convenience too.", rating: 5, metric: "3% Late Payments" },
            { name: "Rajiv Malhotra", role: "Founder, Urban Eats Cloud Kitchen", location: "Delhi", initial: "R", content: "Processing 500+ daily orders, we needed rock-solid payment infrastructure. Next-day settlement means our working capital is always healthy. The dashboard shows real-time transaction status — no guesswork.", rating: 5, metric: "500+ Daily Txns" },
            { name: "Sneha Agarwal", role: "Owner, Sneha Boutique", location: "Kolkata", initial: "S", content: "International customers can now pay in USD or GBP. We started getting orders from NRIs in the US and UK because payment is so seamless. International sales are now 20% of our revenue!", rating: 5, metric: "20% Intl Revenue" },
            { name: "Vikash Gupta", role: "Manager, Gupta Diagnostics", location: "Lucknow", initial: "V", content: "Patients scan UPI QR codes right at the reception desk. No cash counting, no change issues, no end-of-day cash discrepancies. Every transaction is digitally recorded and auto-reconciled.", rating: 5, metric: "100% Digital" },
            { name: "Pallavi Shetty", role: "Founder, Coastal Stays Homestay", location: "Goa", initial: "P", content: "Advance booking payments via payment links are a game-changer. Guests pay 50% booking amount instantly. No-shows dropped dramatically because people who pay upfront always show up.", rating: 5, metric: "↓ No-Shows" },
            { name: "Karthik Nair", role: "CEO, LearnPro Online Courses", location: "Bangalore", initial: "K", content: "EMI payment options increased our course enrollment by 35%. Students who couldn't afford ₹15,000 upfront happily pay ₹2,500/month. The recurring mandate handles everything automatically.", rating: 5, metric: "35% ↑ Enrollment" },
            { name: "Deepa Sharma", role: "Partner, Sharma & Associates Law", location: "Jaipur", initial: "D", content: "Sending professional payment links attached to invoices has transformed our billing. Clients pay within hours instead of weeks. The automatic receipt generation adds a layer of professionalism our firm needed.", rating: 5, metric: "Hours Not Weeks" }
        ],
        problemStatement: "Chasing payments via cash, bank transfers, or manual reminders leads to delayed collections, accounting mismatches, and cash flow crises. Customers drop off when payment is difficult, and manual reconciliation wastes hours every week.",
        solutionStatement: "Vyora's Payment Gateway accepts UPI, cards, net banking, and wallets with instant payment links sent via WhatsApp. Smart routing maximizes success rates, auto-reconciliation eliminates manual matching, and fast settlements improve cash flow.",
        howItWorks: [
            { step: 1, title: "Set Up Your Gateway", description: "Configure your bank account and payment preferences — go live in minutes, not days." },
            { step: 2, title: "Generate Payment Links", description: "Create custom payment links tied to invoices and send them via WhatsApp, SMS, or email." },
            { step: 3, title: "Customers Pay Instantly", description: "Customers pay via UPI, cards, or wallets — frictionless, secure, and mobile-first." },
            { step: 4, title: "Auto-Reconcile & Settle", description: "Payments auto-match to invoices. Funds settle to your bank within T+1 to T+2 days." }
        ],
        stats: [
            { value: "50+", label: "Payment Methods" },
            { value: "T+1", label: "Fast Settlement" },
            { value: "PCI-DSS", label: "Bank-Grade Security" },
            { value: "Auto", label: "Reconciliation" }
        ],
        accentColor: { gradient: "from-green-600 to-emerald-500", light: "bg-green-50", dark: "bg-green-600", ring: "ring-green-500" },
        metaTitle: "Payment Gateway for Business | UPI, Cards & Instant Settlements - Vyora",
        metaDescription: "Accept payments via UPI, cards, and wallets with instant payment links, smart routing, PCI-DSS security, and T+1 settlements. Built for Indian businesses.",
        relatedTools: ["hisab-kitab-management", "customer-management", "smart-stock-management"]
    },
    {
        slug: "customer-support",
        icon: Headphones,
        title: "24/7 Customer Support",
        subtitle: "Round-the-Clock Support",
        description: "Get dedicated customer support with live chat, phone support, and priority assistance",
        definitionX: "omnichannel technical assistance and onboarding system",
        definitionY: "operational downtime and steep software learning curves",
        mainImage: "https://images.unsplash.com/photo-1555421689-491a97ff2040?auto=format&fit=crop&q=80&w=2070&ixlib=rb-4.0.3",
        features: ["24/7 availability", "Live chat support", "Priority assistance", "Dedicated account manager", "Video tutorials"],
        showcase: [
            {
                title: "Instant Live Interventions",
                description: "Hit a roadblock? Launch the integrated chat console right inside your dashboard and securely connect with a technical operator within 120 seconds.",
                image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2426&ixlib=rb-4.0.3"
            },
            {
                title: "Dedicated Account Specialists",
                description: "Pro-tier organizations are matched with specialized account managers who understand the exact workflow nuances and structural requirements of your specific enterprise.",
                image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2070&ixlib=rb-4.0.3"
            }
        ],
        detailedFeatures: [
            { title: "Live Chat Assistance", description: "Connect instantly with a technical expert directly through the embedded dashboard widget constraint." },
            { title: "Telephonic Support", description: "Direct toll-free lines connecting you to operational specialists for complex query resolution." },
            { title: "Dedicated Account Management", description: "Pro-tier accounts receive a personal liaison who understands the intricate nuances of your specific business." },
            { title: "Extensive Knowledge Base", description: "Access hundreds of step-by-step articles, screenshots, and troubleshooting guides instantly." },
            { title: "Onboarding Training", description: "Schedule personalized 1-on-1 video conferencing sessions to train yourself and your staff." },
            { title: "Priority Queueing", description: "Urgent matters involving billing or severe operational blockers bypass standard queue lines." }
        ],
        benefits: [
            { title: "Zero Operational Downtime", description: "Resolve technical roadblocks in minutes rather than waiting days for an email response." },
            { title: "Maximize Platform ROI", description: "Learn advanced features and best practices directly from the experts who built the platform." },
            { title: "Absolute Peace of Mind", description: "Run your business confidently knowing a team of elite engineers is standing by 24/7 to support you." }
        ],
        faqs: [
            { q: "Is support really available 24/7?", a: "Yes, genuinely 24/7 — not a chatbot pretending to help. Our support team is distributed across time zones so there's always a real, trained human ready to help you at 2 AM on a Sunday or 10 AM on a Monday." },
            { q: "How fast will my queries be answered?", a: "Live chat: under 2 minutes. Phone: immediate connection. Email: within 4 hours. Critical issues (billing, service outage): instant priority escalation. We take our response SLAs very seriously." },
            { q: "Do Pro users get faster support?", a: "Yes! Pro accounts get a dedicated account manager who knows your business inside-out, priority queue access, and direct phone lines. Think of it as having a personal tech consultant on speed dial." },
            { q: "Can I get training for my staff?", a: "Absolutely! We offer 1-on-1 video training sessions, group onboarding webinars, and an extensive library of step-by-step video tutorials. Most teams become confident users within 2-3 days." },
            { q: "What if I need help setting up the platform?", a: "Our onboarding specialists provide guided setup assistance — from importing data to configuring features for your specific business type. We don't leave you alone with a help article; we walk you through it." },
            { q: "Can support access my account to fix issues?", a: "Yes, with your explicit permission. Our team can securely access your dashboard via screen-sharing or remote access to diagnose and fix issues in real-time. Most problems are resolved in the first interaction." },
            { q: "Is there a knowledge base for self-help?", a: "Extensive! 500+ articles with screenshots, step-by-step guides, FAQs, and video walkthroughs organized by feature. 60% of questions are answered without needing to contact support — but we're always here when you need us." },
            { q: "What languages does support operate in?", a: "We provide support in English and Hindi natively. Regional language support (Tamil, Telugu, Marathi, Bengali, Gujarati) is available on request. We want to help you in the language you're most comfortable with." },
            { q: "Can I request new features?", a: "Yes! We actively collect feature requests and our product team reviews them monthly. Many of our most popular features started as customer suggestions. Your feedback literally shapes the product roadmap." },
            { q: "What's the first-call resolution rate?", a: "95%. That means 19 out of 20 issues are completely resolved in the first interaction. No 'we'll get back to you' runaround. We aim to solve your problem before you hang up the chat or call." }
        ],
        testimonials: [
            { name: "Anil Sharma", role: "Owner, Sharma Auto Works", location: "Jodhpur", initial: "A", content: "When our billing module had an issue during peak hours, Vyora's support team fixed it via remote access in 3 minutes. Three minutes! That's faster than any software company I've worked with in 20 years.", rating: 5, metric: "3min Resolution" },
            { name: "Sunita Verma", role: "Manager, WellnessFirst Spa", location: "Goa", initial: "S", content: "The onboarding training for our staff was phenomenal. Our receptionist went from scared-of-technology to confidently managing the entire system in just 2 days. The 24/7 chat support is a real safety net.", rating: 5, metric: "2-Day Onboarding" },
            { name: "Rahul Bhatnagar", role: "Director, Bhatnagar Imports", location: "Delhi", initial: "R", content: "Called support at 11 PM when our payment gateway showed an error during a bulk order. Got connected in 45 seconds, issue resolved in 5 minutes. That order was worth ₹3 lakhs — they literally saved us from losing it.", rating: 5, metric: "₹3L Order Saved" },
            { name: "Meghna Iyer", role: "Founder, CookieJar Bakery", location: "Bangalore", initial: "M", content: "I'm not tech-savvy at all. The support team patiently walked me through everything via video call — inventory setup, invoicing, even connecting my WhatsApp. They treated me like family, not a ticket number.", rating: 5, metric: "Patient & Personal" },
            { name: "Jaspreet Kaur", role: "Owner, Kaur Beauty Studio", location: "Chandigarh", initial: "J", content: "I suggested a feature for appointment booking reminders. Two months later, it was live in the platform! They actually listen to customers and build what we need. I've never experienced that with any software.", rating: 5, metric: "Feature Implemented" },
            { name: "Mohammed Rafi", role: "Manager, Rafi Electronics Chain", location: "Hyderabad", initial: "M", content: "With 6 stores on the platform, issues need immediate attention. Our dedicated account manager, Priya, knows our setup inside-out. She proactively calls us before we even notice problems. Exceptional service.", rating: 5, metric: "Proactive Support" },
            { name: "Neeta Agarwal", role: "CEO, CraftBazaar Online", location: "Jaipur", initial: "N", content: "The video tutorial library is surprisingly comprehensive. My team learned advanced reporting features without scheduling any training session. When they did need help, live chat solved it in under 2 minutes.", rating: 5, metric: "<2min Chat" },
            { name: "Sudarshan Patil", role: "Owner, Green Valley Nursery", location: "Pune", initial: "S", content: "I called support in Marathi and they connected me with a Marathi-speaking representative! As a 58-year-old nursery owner, speaking in my own language made the whole experience comfortable and easy.", rating: 5, metric: "Marathi Support" },
            { name: "Rita Banerjee", role: "Founder, Kolkata Sweets Express", location: "Kolkata", initial: "R", content: "During Durga Puja — our busiest week — we had a stock sync issue. Support resolved it within 10 minutes at 6 AM. They understood the urgency and prioritized us immediately. Saved our entire festive season.", rating: 5, metric: "Festive Season Saved" },
            { name: "Deepak Rawat", role: "Partner, Himalayan Adventures", location: "Dehradun", initial: "D", content: "We operate in remote mountain areas with patchy internet. Support guided us through offline mode setup via phone and tested it with us. They went above and beyond. This level of care is rare.", rating: 5, metric: "Above & Beyond" }
        ],
        problemStatement: "Software without support is just frustration. When things break at 10 PM on a Saturday or your team can't figure out a feature, you're stuck waiting for Monday's email response while your business loses money.",
        solutionStatement: "Vyora's 24/7 Customer Support means a real human is always available — via chat in under 2 minutes, phone, or video. Pro accounts get a dedicated manager who knows your business inside-out. Zero downtime, ever.",
        howItWorks: [
            { step: 1, title: "Open a Support Channel", description: "Launch live chat directly from your dashboard, call the toll-free line, or email our team anytime." },
            { step: 2, title: "Connect in Under 2 Minutes", description: "Our SLA guarantees initial response within 120 seconds — no bots, just real technical experts." },
            { step: 3, title: "Get Resolved Instantly", description: "Most issues are resolved in the first interaction via guided steps or secure remote access." },
            { step: 4, title: "Learn & Grow", description: "Access on-demand video tutorials, knowledge base articles, and schedule 1-on-1 training sessions." }
        ],
        stats: [
            { value: "24/7", label: "Always Available" },
            { value: "<2min", label: "Response Time" },
            { value: "1-on-1", label: "Training Sessions" },
            { value: "95%", label: "First-Call Resolution" }
        ],
        accentColor: { gradient: "from-sky-600 to-blue-500", light: "bg-sky-50", dark: "bg-sky-600", ring: "ring-sky-500" },
        metaTitle: "24/7 Customer Support | Live Chat, Phone & Dedicated Manager - Vyora",
        metaDescription: "Get round-the-clock support with <2 minute response via live chat, phone, and dedicated account managers. Video training, knowledge base, and priority queueing.",
        relatedTools: ["employee-management", "free-business-website", "payment-gateway"]
    }
]; 
