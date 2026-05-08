import {
    Utensils,
    ShoppingBag,
    Stethoscope,
    Home,
    Briefcase,
    GraduationCap,
    Wrench,
    Monitor,
    Shirt,
    Car,
    Dumbbell,
    Scissors,
    Plane,
    Music,
    Tractor,
    Dog,
    Camera,
    Gem,
    Sofa,
    Palette,
    Globe,
    Activity,
    Ticket,
    Terminal,
    Scale,
    Heart,
    Truck,
    Sparkles,
    LucideIcon
} from "lucide-react";

export interface CategoryData {
    slug: string;
    name: string;
    icon: LucideIcon;
    image: string;
    subtitle: string;
    description: string;
    definitionBlock: string;
    products: { name: string; description: string; subcategories: string[] }[];
    services: { name: string; description: string; subcategories: string[] }[];
    comparisonTable: { feature: string; vyora: string; traditional: string; manual: string }[];
    bulletFacts: string[];
    faqs: { q: string; a: string }[];
    testimonials: { name: string; role: string; location: string; initial: string; content: string; rating: number; metric: string }[];
    stats: { value: string; label: string }[];
    metaTitle: string;
    metaDescription: string;
    accentColor: { from: string; to: string; text: string; bg: string; border: string; highlight: string };
    relatedCategories: string[];
}

export const categoriesData: CategoryData[] = [
    {
        slug: "restaurants",
        name: "Restaurants & Bars",
        icon: Utensils,
        image: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=1200&h=800&fit=crop&q=80",
        subtitle: "Complete Digital Mastery for Modern Dining Establishments",
        description: "Transform your restaurant's operations with our all-in-one platform. From intelligent table management and QR menus to automated inventory and loyalty programs, Vyora delivers a seamless dining experience that keeps guests coming back.",
        definitionBlock: "Restaurant Management Software by Vyora is a cloud-based, AI-driven platform designed to centralize and automate the operational elements of food and beverage establishments. It integrates point-of-sale (POS) systems, reservation management, digital menu distribution, kitchen display systems (KDS), and customer relationship management (CRM) into a single, cohesive dashboard, enabling restaurateurs to reduce overhead and enhance dining experiences.",
        products: [
            {
                name: "Intelligent POS Systems",
                description: "Cloud-based point of sale that syncs orders instantly from table to kitchen.",
                subcategories: ["Mobile POS", "Self-Service Kiosks", "QR Code Ordering"]
            },
            {
                name: "Kitchen Display Systems (KDS)",
                description: "Streamline back-of-house operations with real-time ticket management.",
                subcategories: ["Station Routing", "Prep Time Tracking", "Recipe Viewer"]
            },
            {
                name: "Digital Menu Boards",
                description: "Dynamic menu displays that update in real-time based on availability.",
                subcategories: ["Nutritional Info Display", "Automated Upselling", "Daypart Menu Switching"]
            }
        ],
        services: [
            {
                name: "Reservation & Waitlist Management",
                description: "Advanced booking engine with automated SMS confirmations.",
                subcategories: ["Table Turn Optimization", "VIP Guest Tracking", "Deposit Management"]
            },
            {
                name: "Inventory & Recipe Costing",
                description: "Automated stock tracking down to the ingredient level.",
                subcategories: ["Vendor Management", "Waste Tracking", "Automated Reordering"]
            },
            {
                name: "Loyalty & Marketing",
                description: "Data-driven campaigns to increase repeat visits and customer lifetime value.",
                subcategories: ["Points Programs", "Birthday Campaigns", "Feedback Automation"]
            }
        ],
        comparisonTable: [
            { feature: "Order Processing Time", vyora: "Instant sync to KDS", traditional: "Manual ticket running", manual: "Paper tickets, high error rate" },
            { feature: "Inventory Tracking", vyora: "Real-time ingredient depletion", traditional: "End-of-day batch processing", manual: "Weekly physical counts" },
            { feature: "Customer Insights", vyora: "AI-driven dining preferences", traditional: "Basic contact info", manual: "No data tracking" },
            { feature: "Menu Updates", vyora: "1-click sync across all platforms", traditional: "Manual update per device", manual: "Reprinting physical menus" }
        ],
        bulletFacts: [
            "Process up to 3x more orders during peak hours with integrated mobile POS.",
            "Reduce food waste by 22% using AI-powered inventory forecasting.",
            "Increase table turnover rate by 15% with optimized kitchen routing.",
            "Capture 40% more customer feedback through automated post-dining SMS.",
            "Deploy digital QR menus that update instantly across all locations."
        ],
        faqs: [
            { q: "Can Vyora integrate with my existing food delivery partners?", a: "Yes, Vyora seamlessly integrates with major food delivery aggregators like Zomato, Swiggy, and UberEats. All third-party orders are routed directly into your single unified POS and Kitchen Display System, eliminating the need for multiple tablets and manual ticket entry." },
            { q: "How does the recipe costing feature work?", a: "Our system allows you to build digital recipes down to the micro-ingredient level. Because it is tied directly to your inventory and invoicing, the software automatically calculates real-time plate costs, gross margins, and alerts you when supplier price increases affect your profitability." },
            { q: "Is the QR code ordering system customizable?", a: "Absolutely. You can fully white-label the QR menu with your brand colors, logos, and custom high-resolution imagery. It supports dynamic pricing, out-of-stock hiding, and AI-driven upselling prompts for sides and beverages." },
            { q: "What happens if our restaurant loses internet connection?", a: "Vyora's POS operates with a robust Offline Mode. You can continue to take orders, print to the kitchen, and process cash payments. Once the connection is restored, all data automatically syncs back to the secure cloud servers without data loss." },
            { q: "Can we manage multiple restaurant locations from one account?", a: "Yes, Vyora provides a centralized multi-location dashboard. You can standardize menus across franchises, compare location performance, manage cross-location inventory, and view consolidated financial reports in real-time." },
            { q: "How does the system handle split checks and complex payments?", a: "Our POS handles complex payment scenarios effortlessly. Staff can split bills evenly, by specific item, or by custom amounts. It also supports multi-tender payments combining cash, cards, and digital wallets on a single check." },
            { q: "Does Vyora assist with staff management and scheduling?", a: "Yes, the platform includes a comprehensive staff management module. It handles shift scheduling, role-based access controls, clock-in/out tracking via PIN or biometrics, and automated payroll report generation." },
            { q: "How secure is the customer data collected by the loyalty program?", a: "Security is our top priority. All customer data is encrypted using bank-grade AES-256 protocols. The system is fully compliant with modern data protection regulations, ensuring your patrons' information is safe and accessed only by authorized personnel." },
            { q: "Can the Kitchen Display System (KDS) be customized by station?", a: "Yes, orders can be intelligently routed to specific prep stations (e.g., grill, fry, salad) based on the specific items ordered. Each screen shows only relevant items, color-coded by wait time to ensure synchronized coursing." },
            { q: "What kind of analytics and reporting are available?", a: "Vyora offers over 50 real-time reports covering sales trends, labor costs, inventory variance, and staff performance. The AI engine also provides predictive analytics, forecasting busy periods to help you optimize staffing and prep work." }
        ],
        testimonials: [
            { name: "Rahul Sharma", role: "Owner, The Spice Route", location: "New Delhi, IN", initial: "R", content: "Switching to Vyora was the best decision for our three locations. The Kitchen Display System reduced our ticket times by 8 minutes during Friday dinner rushes. The inventory forecasting is incredibly accurate.", rating: 5, metric: "8 Min Faster Service" },
            { name: "Priya Desai", role: "Manager, Coastal Bites", location: "Mumbai, IN", initial: "P", content: "The QR ordering system is flawless. We've seen a 25% increase in appetizer orders simply because of the automated upselling prompts. It's completely changed our revenue model.", rating: 5, metric: "25% Higher Order Value" },
            { name: "Amit Patel", role: "Founder, Brew & Co.", location: "Pune, IN", initial: "A", content: "Managing our cafe's inventory used to take hours. Vyora's recipe costing feature alerts me the moment ingredient prices spike, protecting our margins beautifully.", rating: 5, metric: "12% Margin Improvement" },
            { name: "Sneha Reddy", role: "Operations Head, Urban Grill", location: "Hyderabad, IN", initial: "S", content: "The multi-location reporting allows me to compare server performance and dish popularity across our six outlets in real-time. The insights are game-changing.", rating: 5, metric: "Real-time Visibility" },
            { name: "Vikram Singh", role: "Owner, Royal Durbar", location: "Jaipur, IN", initial: "V", content: "Offline mode saved us during a major internet outage last month. We didn't miss a single order or drop a single ticket. Rock solid reliability.", rating: 5, metric: "100% Uptime Reality" },
            { name: "Kavita Iyer", role: "Director, Green Leaf Cafe", location: "Chennai, IN", initial: "K", content: "Vyora's loyalty program integrated automatically. We recovered over 200 lapsed customers in the first quarter alone using their automated SMS campaigns.", rating: 5, metric: "200+ Recovered Customers" },
            { name: "Arjun Verma", role: "General Manager, Sky Bar", location: "Bengaluru, IN", initial: "A", content: "The table management system is incredibly visual and intuitive. Training new hostesses takes 10 minutes instead of three days. Excellent UX.", rating: 5, metric: "90% Less Training Time" },
            { name: "Neha Gupta", role: "Owner, Sweet Tooth Delights", location: "Kolkata, IN", initial: "N", content: "Handling custom cake pre-orders and deposits used to be a nightmare of spreadsheets. Vyora handles it seamlessly, sending automated payment links to clients.", rating: 5, metric: "Zero Payment Errors" },
            { name: "Rajesh Kumar", role: "Franchise Owner, Quick Bites", location: "Chandigarh, IN", initial: "R", content: "Having Swiggy and Zomato orders push straight to the kitchen without manual entry has eliminated human errors and saved us thousands in refunds.", rating: 5, metric: "100% Order Accuracy" },
            { name: "Pooja Mehta", role: "Finance Head, Elite Dining Group", location: "Ahmedabad, IN", initial: "P", content: "The automated payroll reports and integrations with our accounting software save our finance team around 15 hours every single week.", rating: 5, metric: "15 Hours Saved/Week" }
        ],
        stats: [
            { value: "3x", label: "Faster Order Processing" },
            { value: "22%", label: "Reduction in Food Waste" },
            { value: "15%", label: "Higher Table Turnover" },
            { value: "100%", label: "Cloud Uptime" }
        ],
        metaTitle: "Restaurant Management System | Point of Sale & Kitchen Display",
        metaDescription: "Elevate your restaurant with Vyora's all-in-one management system. Integrated POS, KDS, inventory tracking, and QR menus for modern dining operations.",
        accentColor: {
            from: "from-orange-500",
            to: "to-red-600",
            text: "text-orange-600",
            bg: "bg-orange-50",
            border: "border-orange-200",
            highlight: "bg-orange-100"
        },
        relatedCategories: ["retail", "events", "automotive"]
    },
    {
        slug: "retail",
        name: "Retail & E-commerce",
        icon: ShoppingBag,
        image: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1200&h=800&fit=crop&q=80",
        subtitle: "Omnichannel Command Center for Modern Retailers",
        description: "Unify your in-store point of sale and online operations with Vyora. Sync inventory in real-time, launch an integrated e-commerce storefront instantly, and manage customer loyalty programs from a singular, powerful dashboard.",
        definitionBlock: "Vyora's Retail Automation Software is an enterprise-grade, omnichannel retail management solution that synchronizes offline point-of-sale operations with digital e-commerce storefronts. It provides real-time inventory synchronization, automated procurement algorithms, customer purchase history tracking, and mobile POS capabilities. Designed for modern retailers, the system eliminates data silos, preventing stockouts and overselling while delivering a frictionless purchasing experience across all customer touchpoints.",
        products: [
            {
                name: "Omnichannel POS Platform",
                description: "Lightning-fast checkout system that syncs both physical and digital sales.",
                subcategories: ["Barcode Scanning", "Multi-tender Checkout", "Hardware Agnostic"]
            },
            {
                name: "Integrated E-commerce",
                description: "Instantly deployable online stores pulling from centralized inventory.",
                subcategories: ["Payment Gateway Integration", "Shipping Rule Engine", "Mobile-Optimized UX"]
            },
            {
                name: "Inventory Control Hierarchy",
                description: "Advanced matrix inventory for variants, sizes, and colors.",
                subcategories: ["SKU Generation", "Batch Management", "Low Stock Alerts"]
            }
        ],
        services: [
            {
                name: "Purchasing & Procurement",
                description: "Automated purchase order generation based on sales velocity.",
                subcategories: ["Vendor Catalogs", "Receiving Workflows", "Cost Tracking"]
            },
            {
                name: "Customer Loyalty & Rewards",
                description: "Built-in tiered rewards programs without third-party apps.",
                subcategories: ["Store Credit Management", "Digital Gift Cards", "VIP Tiers"]
            },
            {
                name: "Advanced Retail Analytics",
                description: "Deep insights into sell-through rates and peak shopping hours.",
                subcategories: ["Profitability by Item", "Staff Performance", "Footfall Analytics"]
            }
        ],
        comparisonTable: [
            { feature: "Online/Offline Sync", vyora: "Instant, real-time sync", traditional: "Nightly batch updates", manual: "Separate spreadsheets" },
            { feature: "E-commerce Launch", vyora: "1-click generation", traditional: "Complex API integrations", manual: "No online presence" },
            { feature: "Inventory Updates", vyora: "Automated on sale/return", traditional: "Manual entry per channel", manual: "Physical counts only" },
            { feature: "Loyalty Integration", vyora: "Built-in, cross-channel", traditional: "Requires 3rd party plugin", manual: "Punch cards" }
        ],
        bulletFacts: [
            "Prevent 99% of overselling errors with instant cross-channel inventory synchronization.",
            "Launch a fully functional, mobile-optimized online store in under 24 hours.",
            "Increase average basket sizes by 18% using AI-suggested product bundling at POS.",
            "Reduce stockouts via predictive automated purchase order generation.",
            "Track customer purchase history across physical and digital storefronts seamlessly."
        ],
        faqs: [
            { q: "How fast does inventory sync between my physical shop and the online store?", a: "Inventory synchronization is instantaneous. The moment an item is scanned and sold at your physical point of sale, or purchased online, the centralized inventory count is updated across all platforms, effectively preventing overselling." },
            { q: "Can I manage product variants like different sizes and colors easily?", a: "Yes, our matrix inventory system is built exactly for this. You can create a parent product and easily generate hundreds of child variants for size, color, or material combinations, tracking stock and pricing for each individual SKU." },
            { q: "Does the system support barcode scanning and receipt printing?", a: "Absolutely. Vyora is hardware-agnostic, meaning it pairs seamlessly with standard USB or Bluetooth barcode scanners, receipt printers, cash drawers, and thermal label printers from major manufacturers." },
            { q: "How do customer loyalty points work across different sales channels?", a: "Our loyalty program is completely omnichannel. Customers earn points whether they buy online or in-store, and can redeem those points or use store credit through either channel using their phone number or email." },
            { q: "Can we set dynamic pricing for wholesale or VIP customers?", a: "Yes, Vyora supports advanced pricebook rules. You can assign customers to specific tiers (e.g., Wholesale, VIP, Employee) and the POS or online store will automatically apply their specific discounts when they log in or are added to the transaction." },
            { q: "How does the automated purchase ordering feature function?", a: "The system analyzes your historical sales velocity and lead times. When an item hits its dynamic reorder point, Vyora automatically drafts a Purchase Order for your specific vendor, requiring only a single click from you to approve and send." },
            { q: "Is it possible to process returns or exchanges easily?", a: "The returns workflow is highly streamlined. You can scan a receipt barcode or pull up a customer profile to instantly process a refund to the original payment method, issue store credit, or execute an even exchange, instantly updating inventory." },
            { q: "Can multiple sales staff use the POS at the same time on different devices?", a: "Yes. Vyora is cloud-based, so you can run the POS on multiple registers, tablets, or even staff smartphones simultaneously. All transactions are tracked to the specific employee for commission and performance reporting." },
            { q: "Do you provide tools for managing seasonal sales and promotions?", a: "We have a robust promotions engine. You can schedule BOGO deals, percentage discounts, or category-wide sales well in advance. The system automatically toggles the pricing across all channels at the exact specified time." },
            { q: "How secure is the e-commerce checkout process?", a: "Our e-commerce module utilizes industry-standard PCI-DSS compliant payment gateways. All transactions are encrypted, and we employ advanced fraud-detection algorithms to protect your business from chargebacks and fraudulent orders." }
        ],
        testimonials: [
            { name: "Suresh Menon", role: "Owner, Urban Threads", location: "Kochi, IN", initial: "S", content: "We used to suffer from constant overselling because our store and website inventory didn't talk to each other. Vyora solved this completely. Real-time sync is a lifesaver.", rating: 5, metric: "Zero Overselling" },
            { name: "Anjali Bose", role: "Director, Luxe Boutique", location: "Mumbai, IN", initial: "A", content: "Setting up our online store took less than a day. The fact that it pulls images and pricing directly from our POS system meant no double data entry. Incredible efficiency.", rating: 5, metric: "24Hr Online Launch" },
            { name: "Kiran Patel", role: "Manager, Tech Haven Electronics", location: "Surat, IN", initial: "K", content: "The automated purchase orders base restocking on actual sales data, not guesswork. We've reduced our dead stock by 30% in just six months.", rating: 5, metric: "30% Less Dead Stock" },
            { name: "Meera Reddy", role: "Founder, Organic Roots Grocery", location: "Hyderabad, IN", initial: "M", content: "Our customers love the unified loyalty program. Because they can redeem points online or in our physical shop, our repeat purchase rate has spiked dramatically.", rating: 5, metric: "40% Repeat Customers" },
            { name: "David Fernandez", role: "Operations Lead, Gear Up Sports", location: "Goa, IN", initial: "D", content: "Handling returns used to be a headache. Now we scan the receipt, hit refund, and the inventory is instantly placed back in stock. It takes seconds.", rating: 5, metric: "Instant Returns" },
            { name: "Priya Sharma", role: "Owner, Glamour Cosmetics", location: "Delhi, IN", initial: "P", content: "The staff performance reports showed us exactly who our top sellers are. We implemented a commission structure through Vyora that boosted overall sales by 15%.", rating: 5, metric: "15% Sales Boost" },
            { name: "Ravi Teja", role: "CEO, Home Essentials Plus", location: "Vijayawada, IN", initial: "R", content: "Managing over 5,000 SKUs is effortless with the matrix variant system. Updating prices across sizes and colors is done in three clicks.", rating: 5, metric: "5000+ SKUs Managed" },
            { name: "Deepa Nair", role: "Manager, The Book Haven", location: "Thiruvananthapuram, IN", initial: "D", content: "The barcode scanning is lightning fast. During the back-to-school rush, we processed queues 3x faster than our previous legacy system.", rating: 5, metric: "3x Faster Checkout" },
            { name: "Tariq Khan", role: "Owner, Auto Parts Hub", location: "Lucknow, IN", initial: "T", content: "The wholesale tier pricing automatically applies discounts for our B2B garage clients. It eliminates manual math and makes our billing 100% accurate.", rating: 5, metric: "100% Billing Accuracy" },
            { name: "Simran Kaur", role: "Founder, Little Steps Baby Shop", location: "Chandigarh, IN", initial: "S", content: "I can check my store's live sales from my phone while I'm traveling. The dashboard gives me a perfect snapshot of revenue and top-selling items instantly.", rating: 5, metric: "Live Mobile Analytics" }
        ],
        stats: [
            { value: "0%", label: "Overselling Rate" },
            { value: "18%", label: "Increase in Basket Size" },
            { value: "24h", label: "To Launch Online Store" },
            { value: "30%", label: "Reduction in Dead Stock" }
        ],
        metaTitle: "Retail POS & E-commerce Software | Omnichannel Management",
        metaDescription: "Unify your retail business with Vyora. Real-time inventory sync, omnichannel POS, instantly deployable e-commerce, and advanced loyalty programs.",
        accentColor: {
            from: "from-purple-500",
            to: "to-indigo-600",
            text: "text-purple-600",
            bg: "bg-purple-50",
            border: "border-purple-200",
            highlight: "bg-purple-100"
        },
        relatedCategories: ["fashion", "electronics", "jewelry"]
    },
    {
        slug: "healthcare",
        name: "Doctors & Health Clinics",
        icon: Stethoscope,
        image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=1200&h=800&fit=crop&q=80",
        subtitle: "Secure, Compliant Clinic Management & Patient Care",
        description: "Streamline your medical practice with our comprehensive clinic management system. Vyora provides secure digital health records, intelligent appointment scheduling, automated billing, and tele-consultation capabilities.",
        definitionBlock: "Vyora's Healthcare Clinic Management System is a secure, cloud-architected platform that digitizes end-to-end medical practice workflows. It centralizes Electronic Health Records (EHR), intelligent appointment scheduling with automated reminders, diagnostic lab integrations, and complex medical billing. Designed with strict data privacy compliance, the system reduces administrative friction, allowing healthcare professionals to prioritize patient care pathways and clinical outcomes.",
        products: [
            {
                name: "Electronic Health Records (EHR)",
                description: "Secure, compliant digital patient charts accessible instantly.",
                subcategories: ["Clinical Notes & Templates", "Prescription Generation", "Document Uploads"]
            },
            {
                name: "Smart Scheduling Engine",
                description: "Advanced calendar for managing multiple doctors and rooms.",
                subcategories: ["Online Patient Booking", "Automated SMS Reminders", "Waitlist Management"]
            },
            {
                name: "Telemedicine Platform",
                description: "Integrated secure video consultations with instant billing.",
                subcategories: ["HD Video Calls", "Screen Sharing", "Post-call Reporting"]
            }
        ],
        services: [
            {
                name: "Medical Billing & Invoicing",
                description: "Streamlined billing for consultations, procedures, and tests.",
                subcategories: ["Insurance Workflows", "Tax Calculations", "Payment Gateway"]
            },
            {
                name: "Pharmacy & Inventory",
                description: "Track clinical supplies and manage in-house pharmacy stock.",
                subcategories: ["Batch & Expiry Tracking", "Low Stock Alerts", "Supplier POs"]
            },
            {
                name: "Patient Portal",
                description: "Secure app for patients to view history and book visits.",
                subcategories: ["Lab Report Access", "Follow-up Reminders", "Secure Two-way Chat"]
            }
        ],
        comparisonTable: [
            { feature: "Patient Records", vyora: "Secure, cloud-based EHR", traditional: "Local server software", manual: "Paper files" },
            { feature: "Appointment Booking", vyora: "24/7 online patient portal", traditional: "Phone calls only", manual: "Paper diary" },
            { feature: "Prescriptions", vyora: "Digital with drug interactions", traditional: "Basic typed notes", manual: "Handwritten pads" },
            { feature: "No-Show Rate", vyora: "Reduced via automated SMS", traditional: "Manual phone reminders", manual: "High no-show rates" }
        ],
        bulletFacts: [
            "Reduce patient no-show rates by up to 60% through automated WhatsApp and SMS reminders.",
            "Access full patient medical history securely within 3 seconds during consultations.",
            "Generate compliant, legible digital prescriptions in under 30 seconds via templates.",
            "Manage multiple practitioners and consultation rooms seamlessly from a single dashboard.",
            "Ensure 100% data security with bank-grade encryption and automated daily cloud backups."
        ],
        faqs: [
            { q: "Is the patient data securely stored and compliant with health regulations?", a: "Absolutely. Security is paramout in healthcare. Vyora uses end-to-end AES-256 encryption for all data at rest and in transit. Our infrastructure is designed to comply with stringent health data privacy regulations, ensuring patient confidentiality is strictly maintained." },
            { q: "Can patients book their own appointments online?", a: "Yes, you receive a custom, white-labeled booking portal. Patients can view available slots for specific doctors, book their preferred time, and even pay consultation fees upfront, completely automating the intake process." },
            { q: "How does the digital prescription module work?", a: "Doctors can create prescriptions rapidly using customizable templates and a built-in drug database. The system highlights potential drug interactions, and the final typed prescription can be printed or sent directly to the patient's WhatsApp or email." },
            { q: "Does the system handle clinic inventory and pharmacy stock?", a: "Yes, there is a dedicated module for managing clinical supplies, vaccines, and an in-house pharmacy. It tracks batch numbers and expiration dates, automatically alerting you to expiring stock or low inventory levels." },
            { q: "Can we manage schedules for multiple doctors and specialized rooms?", a: "The calendar interface is highly advanced. You can view schedules side-by-side for different practitioners, assign specific consultation rooms or equipment to an appointment, and block out personal time effortlessly." },
            { q: "How do automated appointment reminders work?", a: "The system automatically sends customizable SMS, WhatsApp, or email reminders to patients 24 hours and 2 hours prior to their visit. This simple feature has proven to reduce clinic no-show rates by up to 60%." },
            { q: "Is telemedicine natively supported?", a: "Yes, Vyora includes high-definition, secure video conferencing capabilities. You can transition an in-person appointment to a tele-consultation with one click, securely sharing screens and generating bills immediately after the call." },
            { q: "Can we upload external diagnostic reports to a patient's file?", a: "Yes, the Electronic Health Record (EHR) module allows unlimited document uploads. You can scan and attach X-rays, lab reports, and historic medical files directly to the patient's digital chart for centralized access." },
            { q: "How does the billing and invoicing system operate?", a: "The billing module is specifically designed for clinics. It handles complex billing scenarios including procedure costs, consultation fees, lab tests, and taxes. It generates professional, compliant invoices instantly." },
            { q: "If a doctor leaves the clinic, what happens to the data?", a: "The clinic owner retains absolute administrative control. You can instantly revoke a departing practitioner's access. The patient records and consultation histories remain securely stored within the clinic's centralized database." }
        ],
        testimonials: [
            { name: "Dr. Ananya Rao", role: "Chief Medical Officer, City Care Clinic", location: "Bengaluru, IN", initial: "A", content: "The transition from paper files to Vyora's EHR was seamless. Being able to pull up a patient's entire history in 2 seconds has completely transformed my consultation workflow.", rating: 5, metric: "2-Second Record Access" },
            { name: "Mohit Sinha", role: "Clinic Admin, Apex Dental", location: "Noida, IN", initial: "M", content: "Our no-show rate plummeted from 15% to under 4% after we enabled Vyora's automated WhatsApp reminders. The system practically pays for itself in recovered revenue.", rating: 5, metric: "70% Drop in No-Shows" },
            { name: "Dr. Vikram Sethi", role: "Pediatrician, Little Smiles Clinic", location: "Pune, IN", initial: "V", content: "The digital prescription templates save me hours every week. It's clean, professional, and the automated alerts for drug interactions provide incredible peace of mind.", rating: 5, metric: "Hours Saved Weekly" },
            { name: "Sunita Menon", role: "Manager, Harmony Wellness Center", location: "Kochi, IN", initial: "S", content: "Managing schedules for 8 therapists across 5 rooms used to be a logistical nightmare. Vyora's smart calendar handles the room mapping automatically. Pure genius.", rating: 5, metric: "Zero Booking Conflicts" },
            { name: "Dr. Rajat Kapoor", role: "Dermatologist, Skin First", location: "Delhi, IN", initial: "R", content: "The integrated telemedicine feature is phenomenal. The video quality is excellent, and the ability to bill the patient immediately after the call ends makes virtual care highly profitable.", rating: 5, metric: "Profitable Telemedicine" },
            { name: "Kajal Patel", role: "Pharmacist, LifeLine Care", location: "Ahmedabad, IN", initial: "K", content: "Tracking batch numbers and expiring medicines is now completely automated. The alert system ensures we never dispense expired stock and minimizes our pharmaceutical waste.", rating: 5, metric: "Zero Expired Stock" },
            { name: "Dr. Neha Sharma", role: "Gynecologist, Women's Health Clinic", location: "Jaipur, IN", initial: "N", content: "Patients love the booking portal. Over 40% of our new appointments are now booked online outside of clinic hours, taking massive pressure off our front desk staff.", rating: 5, metric: "40% Online Bookings" },
            { name: "Tariq Ali", role: "Director, Vision Eye Care", location: "Lucknow, IN", initial: "T", content: "The billing module handles our complex procedure coding effortlessly. It generates GST-compliant invoices in seconds, making our accounting process entirely frictionless.", rating: 5, metric: "Instant Invoicing" },
            { name: "Dr. Meenakshi Iyer", role: "Cardiologist, Heart Matters", location: "Chennai, IN", initial: "M", content: "I can securely access patient ECGs and lab reports from my phone during emergencies via Vyora. The cloud accessibility without compromising security is industry-leading.", rating: 5, metric: "Secure Remote Access" },
            { name: "Sanjay Gupta", role: "Owner, Gupta Polyclinic", location: "Kolkata, IN", initial: "S", content: "Bringing all 5 of our visiting specialists onto one unified platform has standardized our patient care. The analytics give me total visibility over clinic performance.", rating: 5, metric: "Unified Clinic Operations" }
        ],
        stats: [
            { value: "60%", label: "Reduction in No-Shows" },
            { value: "3s", label: "Patient Record Access" },
            { value: "40%", label: "Bookings via Portal" },
            { value: "100%", label: "Data Compliance" }
        ],
        metaTitle: "Clinic Management Software | EHR & Appointment Scheduling",
        metaDescription: "Modernize your medical practice. Vyora offers secure electronic health records, automated appointment booking, telemedicine, and intelligent clinic billing.",
        accentColor: {
            from: "from-blue-500",
            to: "to-cyan-600",
            text: "text-blue-600",
            bg: "bg-blue-50",
            border: "border-blue-200",
            highlight: "bg-blue-100"
        },
        relatedCategories: ["fitness", "beauty-&-wellness", "professional-services"]
    },
    {
        slug: "real-estate",
        name: "Real Estate Agents",
        icon: Home,
        image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&h=800&fit=crop&q=80",
        subtitle: "Accelerate Property Sales with Intelligent Lead Management",
        description: "Empower your real estate agency with a dedicated CRM and property management platform. Track leads, showcase high-res property portfolios, automate follow-ups, and manage all your agents from a single, high-performance interface.",
        definitionBlock: "Vyora's Real Estate CRM & Property Management Platform is an advanced software solution engineered for realtors and property brokers. It centralizes property listings with multimedia showcases, automates the lead lifecycle from capture to closing, and tracks agent performance metrics. By deploying automated property matching algorithms and drip marketing campaigns, the system minimizes lead leakage and significantly accelerates the property sales cycle and commission tracking.",
        products: [
            {
                name: "Property Portfolio Manager",
                description: "Centralized database for all active, luxury, and commercial listings.",
                subcategories: ["HD Image Galleries", "Map Integrations", "Amenity Tagging"]
            },
            {
                name: "Intelligent Real Estate CRM",
                description: "Track buyers and sellers through distinct visual pipelines.",
                subcategories: ["Lead Scoring", "Interaction History", "Follow-up Tasks"]
            },
            {
                name: "Digital Listing Website",
                description: "Instantly generated, SEO-optimized website showcasing your properties.",
                subcategories: ["Property Search Filters", "Inquiry Forms", "Mobile Responsive"]
            }
        ],
        services: [
            {
                name: "Lead Automation & Matching",
                description: "Automatically match new properties to existing buyer requirements.",
                subcategories: ["Automated Email Alerts", "WhatsApp Integration", "Drip Campaigns"]
            },
            {
                name: "Agent Performance Tracking",
                description: "Monitor team productivity, site visits, and closure rates.",
                subcategories: ["Commission Calculations", "Activity Logs", "Leaderboards"]
            },
            {
                name: "Document & Contract Vault",
                description: "Secure cloud storage for leases, deeds, and identification.",
                subcategories: ["E-signature Ready", "Access Controls", "Expiry Alerts"]
            }
        ],
        comparisonTable: [
            { feature: "Lead Management", vyora: "Automated visual pipeline", traditional: "Basic contact list", manual: "Excel spreadsheets" },
            { feature: "Property Matching", vyora: "AI-driven instant matching", traditional: "Manual database search", manual: "Memory and notebooks" },
            { feature: "Property Showcasing", vyora: "Instant SEO-optimized website", traditional: "Expensive custom web dev", manual: "Sharing photos via chat" },
            { feature: "Team Tracking", vyora: "Live agent dashboard", traditional: "Weekly report generation", manual: "Verbal updates" }
        ],
        bulletFacts: [
            "Increase lead conversion rates by 25% with automated, visual sales pipelines.",
            "Generate stunning, SEO-optimized property listing websites without writing code.",
            "Instantly match new property inventory with existing buyer requirements using AI.",
            "Track complex commission structures accurately across large teams of agents.",
            "Maintain a secure, centralized vault for all sensitive client and property documents."
        ],
        faqs: [
            { q: "Can Vyora automatically capture leads from property portals like MagicBricks or 99acres?", a: "Yes, through integrations and email parsing, Vyora can automatically capture leads generated from major property portals, instantly adding them to your CRM pipeline and assigning them to an available agent." },
            { q: "How does the automated property matching feature work?", a: "When you enter a new lead, you define their requirements (budget, location, bhk). As soon as a matching property is added to your portfolio, the system instantly flags the match, allowing you to notify the client in one click." },
            { q: "Do I need technical skills to set up the property listing website?", a: "Not at all. Your property website is generated automatically from the data you enter into the portfolio manager. It is professionally designed, mobile-responsive, and optimized for search engines right out of the box." },
            { q: "Can we track site visits and meeting outcomes?", a: "Yes, the CRM includes detailed activity tracking. Agents can log site visits, attach notes from client meetings, and schedule future follow-up tasks. Managers can view these activities in real-time." },
            { q: "How does the system handle team commissions?", a: "Vyora features a robust financial tracking module. You can set up complex commission structures, track total sales value per agent, and automatically calculate payouts upon successful deal closures." },
            { q: "Is it possible to send property brochures directly from the software?", a: "Absolutely. You can generate professional PDF brochures with a single click from the property listing and directly email or WhatsApp them to leads without leaving the Vyora dashboard." },
            { q: "Can I manage rental properties differently from sales?", a: "Yes, the platform distinguishes between sales and rentals. Rental listings have specific data fields (like deposit amount and lease terms) and distinct pipeline stages compared to outright property sales." },
            { q: "How secure is the document vault for sensitive contracts?", a: "The document vault utilizes enterprise-grade AES-256 encryption. You have granular access control, ensuring that only authorized agents or administrative staff can view or download sensitive client identification or contracts." },
            { q: "Does the system provide analytics on which lead sources perform best?", a: "Yes, the analytics dashboard provides deep insights into your marketing ROI. It clearly visualizes which lead sources (e.g., website, portals, referrals) result in the highest volume of closed deals." },
            { q: "Can the software handle large teams operating in different cities?", a: "Vyora is highly scalable. You can create multiple branches or territories, assign regional managers, and filter properties and leads by specific geographic locations, making it ideal for expanding agencies." }
        ],
        testimonials: [
            { name: "Rahul Deshmukh", role: "Managing Director, Prime Properties", location: "Pune, IN", initial: "R", content: "The automated property matching is a game-changer. We closed three deals last month simply because the system alerted us to perfectly matching buyers the moment a new listing arrived.", rating: 5, metric: "3 Deals from Auto-Match" },
            { name: "Sneha Kapoor", role: "Lead Broker, Elite Homes", location: "Mumbai, IN", initial: "S", content: "Before Vyora, leads from portals were falling through the cracks. Now, they drop directly into our visual pipeline, and nothing gets ignored. Our conversion rate is up 25%.", rating: 5, metric: "25% Higher Conversions" },
            { name: "Amit Bhasin", role: "Owner, Bhasin Realtors", location: "Delhi, IN", initial: "A", content: "The digital website feature is incredible. We went from having no online presence to a fully professional, searchable property portal in less than an hour. Clients love the interface.", rating: 5, metric: "Instant Professional Website" },
            { name: "Pooja Reddy", role: "Sales Head, Urban Spaces", location: "Hyderabad, IN", initial: "P", content: "Tracking my team of 15 agents used to require endless meetings. Now, I open the dashboard and instantly see site visits, active leads, and expected closures for the month.", rating: 5, metric: "Complete Team Visibility" },
            { name: "Vikram Singh", role: "Commercial Director, Apex Realty", location: "Gurgaon, IN", initial: "V", content: "Managing complex commercial leases requires heavy documentation. The secure document vault within Vyora keeps everything organized and instantly accessible during negotiations.", rating: 5, metric: "Seamless Document Mgmt" },
            { name: "Neha Sharma", role: "Independent Agent", location: "Bengaluru, IN", initial: "N", content: "Generating beautiful PDF brochures with one click and sending them via WhatsApp directly from the CRM saves me hours every day. It makes me look highly professional.", rating: 5, metric: "Instant Brochure Delivery" },
            { name: "Rajiv Iyer", role: "Partner, Coastal Properties", location: "Chennai, IN", initial: "R", content: "The commission tracking module removed all disputes. Every agent knows exactly what they have earned based on closed deals. It's transparent and exceptionally accurate.", rating: 5, metric: "100% Commission Accuracy" },
            { name: "Kajal Patel", role: "Marketing Lead, Skyline Developers", location: "Ahmedabad, IN", initial: "K", content: "The ROI analytics finally proved which portals are worth our advertising budget. We reallocated our spending based on Vyora's insights and reduced lead acquisition costs by 30%.", rating: 5, metric: "30% Lower Lead Cost" },
            { name: "Karan Johar", role: "Manager, Luxury Estates", location: "Goa, IN", initial: "K", content: "Managing our luxury villa rentals is effortless. The system separates sales from rentals perfectly, tracking lease expiries and reminding us to initiate renewals automatically.", rating: 5, metric: "Automated Renewals" },
            { name: "Anil Kumar", role: "Founder, City Links", location: "Lucknow, IN", initial: "A", content: "Scaling to three new cities was daunting until we implemented Vyora. The territory management features allow me to oversee all branches while giving local agents their own focused views.", rating: 5, metric: "Frictionless Scaling" }
        ],
        stats: [
            { value: "25%", label: "Higher Lead Conversion" },
            { value: "1hr", label: "Website Deployment" },
            { value: "100%", label: "Lead Capture Rate" },
            { value: "30%", label: "Lower Acquisition Cost" }
        ],
        metaTitle: "Real Estate CRM & Property Management Software",
        metaDescription: "Supercharge your real estate agency. Automated lead matching, beautiful property websites, visual sales pipelines, and comprehensive agent tracking.",
        accentColor: {
            from: "from-teal-500",
            to: "to-emerald-600",
            text: "text-teal-600",
            bg: "bg-teal-50",
            border: "border-teal-200",
            highlight: "bg-teal-100"
        },
        relatedCategories: ["home-services", "professional-services", "photography"]
    },
    {
        slug: "professional-services",
        name: "Consulting & Professional Services",
        icon: Briefcase,
        image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=1200&h=800&fit=crop&q=80",
        subtitle: "Streamline Client Management and Project Delivery",
        description: "Designed for consultants, agencies, and law firms. Vyora harmonizes your client onboarding, project milestones, time tracking, and invoicing into a unified, professional ecosystem that builds trust and accelerates cash flow.",
        definitionBlock: "Vyora's Professional Services Automation (PSA) platform is a unified operational system engineered for B2B service providers, consultants, and agencies. It converges Client Relationship Management (CRM), project milestone orchestration, granular time tracking, and automated financial invoicing. By eliminating fragmented tech stacks, the platform ensures precise billable hour capture, accelerates revenue realization, and delivers a transparent, white-labeled portal for elite client engagement.",
        products: [
            {
                name: "Client CRM & Onboarding",
                description: "Professional digital intake processes and centralized client data.",
                subcategories: ["Digital Contracts", "File Vaults", "Communication Logs"]
            },
            {
                name: "Project & Task Orchestration",
                description: "Kanban and list-based project management tied directly to clients.",
                subcategories: ["Milestone Tracking", "Resource Allocation", "Deadlines"]
            },
            {
                name: "White-labeled Client Portal",
                description: "Secure area for clients to view progress, pay invoices, and approve work.",
                subcategories: ["Custom Branding", "Approval Workflows", "Status Updates"]
            }
        ],
        services: [
            {
                name: "Time & Billable Hours Tracking",
                description: "Accurate timers and logs seamlessly convertible to invoices.",
                subcategories: ["Hourly Rates Logic", "Employee Timesheets", "Non-billable Tags"]
            },
            {
                name: "Automated Invoicing & Payments",
                description: "Generate beautiful invoices based on milestones or tracked time.",
                subcategories: ["Recurring Retainers", "Online Payments", "Late Reminders"]
            },
            {
                name: "Business Intelligence Reporting",
                description: "Deep analytics on project profitability and team utilization.",
                subcategories: ["Margin Analysis", "Capacity Forecasting", "Revenue Recognition"]
            }
        ],
        comparisonTable: [
            { feature: "Time-to-Invoice", vyora: "1-click generation from tracked time", traditional: "Manual spreadsheet compilation", manual: "Word document invoices" },
            { feature: "Client Visibility", vyora: "Secure 24/7 client portal", traditional: "Weekly email updates", manual: "Phone calls only" },
            { feature: "Project Tracking", vyora: "Integrated deeply with billing", traditional: "Standalone project software", manual: "Whiteboards and emails" },
            { feature: "Contract Signing", vyora: "Integrated digital signatures", traditional: "Third-party signing tools", manual: "Printing & scanning" }
        ],
        bulletFacts: [
            "Capture up to 20% more billable hours with frictionless, integrated time tracking.",
            "Reduce 'Invoice to Cash' time by 12 days using automated reminders and online portals.",
            "Consolidate 4+ separate software subscriptions into one unified professional platform.",
            "Elevate brand trust with a fully white-labeled, secure client collaboration portal.",
            "Analyze project profitability in real-time, preventing scope creep and budget overruns."
        ],
        faqs: [
            { q: "How Does the time tracking feature integrate with invoicing?", a: "The integration is seamless. You and your team track time against specific projects or tasks. When it's time to bill, you simply select the client, and Vyora automatically pulls in all unbilled hours, applies the correct hourly rates, and generates a professional invoice in one click." },
            { q: "Can we manage fixed-price or milestone-based projects?", a: "Absolutely. While perfect for hourly billing, the platform handles fixed-fee projects brilliantly. You can set up billing milestones (e.g., 25% upfront, 50% beta, 25% launch) and coordinate invoices to trigger when those project stages are marked complete." },
            { q: "What is the White-labeled Client Portal?", a: "It is a secure, branded environment where your clients can log in. They can view project status, approve deliverables, download files securely, and pay invoices directly. It features your logo and brand colors, presenting a highly professional MNC-level image." },
            { q: "Does the CRM handle the initial client onboarding phase?", a: "Yes. You can create digital intake forms, send automated welcome emails, and utilize integrated e-signatures for NDAs and service agreements, completely digitizing and standardizing your onboarding workflow." },
            { q: "Can we track team utilization and capacity?", a: "Yes, the reporting dashboard provides clear visibility into team utilization. You can see who is overbooked, who has capacity, and analyze the ratio of billable vs. non-billable hours across your entire firm." },
            { q: "Does the system support recurring retainer invoices?", a: "Yes, for ongoing service contracts, you can set up recurring invoices. Vyora will automatically generate and email the invoice (and even attempt auto-charge if authorized) on the specified schedule, ensuring consistent cash flow." },
            { q: "Can we manage tasks and collaborate internally?", a: "Vyora includes a robust project management suite. You can use Kanban boards or lists, assign tasks, set deadlines, and discuss details internally within the task cards, keeping all operational data centralized." },
            { q: "How secure is the file sharing within the platform?", a: "We utilize enterprise-grade cloud storage with AES-256 encryption. Access controls allow you to specify exactly which team members or clients can view or download specific documents, ensuring absolute data confidentiality." },
            { q: "Do you offer integrations with formal accounting software?", a: "Yes, we integrate seamlessly with major accounting platforms like QuickBooks and Xero. Invoices, payments, and client data sync automatically, keeping your formal ledgers perfectly accurate without double entry." },
            { q: "Can we track expenses against specific projects?", a: "Yes. Team members can log project-specific expenses, attach receipt photos, and tag them as billable or non-billable. Billable expenses can automatically be added to the client's next invoice as line items." }
        ],
        testimonials: [
            { name: "Aditi Rao", role: "Managing Partner, Paradigm Consulting", location: "Bengaluru, IN", initial: "A", content: "Before Vyora, we leaked thousands in untracked billable hours. The integrated timers have captured at least 20% more revenue simply because tracking is now effortless for the team.", rating: 5, metric: "20% More Revenue Captured" },
            { name: "Kunal Desai", role: "Founder, Kinetic Design Agency", location: "Mumbai, IN", initial: "K", content: "The white-labeled client portal completely elevated our brand perception. Clients love logging in to see their project progress and paying invoices directly through the secure gateway.", rating: 5, metric: "Premium Client Experience" },
            { name: "Priya Sharma", role: "Director, Apex Legal Associates", location: "Delhi, IN", initial: "P", content: "Security is non-negotiable for our law firm. Vyora's encrypted document vault and secure e-signatures allow us to handle sensitive client onboarding with absolute confidence.", rating: 5, metric: "100% Secure Workflows" },
            { name: "Rishabh Jain", role: "CEO, TechOptimize IT Services", location: "Pune, IN", initial: "R", content: "Consolidating our CRM, project management, and invoicing into one platform saved us roughly ₹20,000 a month in software subscriptions, while making us infinitely more organized.", rating: 5, metric: "₹20K Monthly Savings" },
            { name: "Sneha Menon", role: "Operations Head, Vista Marketing", location: "Chennai, IN", initial: "S", content: "The automated milestone billing is fantastic. When my team marks a project phase complete, the invoice goes out automatically. Our cash flow has never been more consistent.", rating: 5, metric: "Consistent Cash Flow" },
            { name: "Arjun Verma", role: "Principal Architect, Studio Canvas", location: "Hyderabad, IN", initial: "A", content: "Tracking project profitability used to be a guessing game. Vyora's analytics instantly show me our margins by project, helping me realize we were underpricing our rendering services.", rating: 5, metric: "Clear Margin Visibility" },
            { name: "Neha Gupta", role: "Manager, Financial Advisory Pro", location: "Ahmedabad, IN", initial: "N", content: "The recurring retainers feature runs on auto-pilot. It sends the invoice, follows up if late, and logs the payment. My accounts receivable time has dropped to near zero.", rating: 5, metric: "Zero AR Headache" },
            { name: "Vikram Chauhan", role: "Partner, Chauhan & Co. Auditors", location: "Kolkata, IN", initial: "V", content: "The integration with our accounting software is flawless. It prevents dual entry and keeps our formal ledgers perfectly aligned with operational activity.", rating: 5, metric: "Flawless Accounting Sync" },
            { name: "Anil Patel", role: "Founder, Ignite PR", location: "Jaipur, IN", initial: "A", content: "The team utilization reports are illuminating. I finally have databased evidence of who is nearing burnout and when we precisely need to hire our next consultant.", rating: 5, metric: "Data-Driven Hiring" },
            { name: "Kavita Iyer", role: "Director, Global HR Solutions", location: "Chandigarh, IN", initial: "K", content: "Reimbursable expenses were always a mess. Now staff snap a photo of the receipt, tag the client, and it automatically appears on the next invoice. Exceptionally smooth.", rating: 5, metric: "Effortless Expense Mgmt" }
        ],
        stats: [
            { value: "20%", label: "Increase in Tracked Hours" },
            { value: "12 Days", label: "Faster Payment Cycles" },
            { value: "4-to-1", label: "Software Consolidation" },
            { value: "100%", label: "Professional Branding" }
        ],
        metaTitle: "Professional Services Automation | CRM, Projects & Billing",
        metaDescription: "The ultimate platform for consultants and agencies. Unify your tech stack with integrated time tracking, project management, client portals, and automated invoicing.",
        accentColor: {
            from: "from-slate-600",
            to: "to-gray-800",
            text: "text-slate-700",
            bg: "bg-slate-50",
            border: "border-slate-200",
            highlight: "bg-slate-100"
        },
        relatedCategories: ["real-estate", "marketing-agencies", "education"]
    },
    {
        slug: "education",
        name: "Education & Coaching",
        icon: GraduationCap,
        image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&h=800&fit=crop&q=80",
        subtitle: "Modernize Learning Centers and Coaching Institutes",
        description: "Elevate your educational institute with Vyora. From smart batch scheduling and automated fee collection to custom student portals and online assessment tools, we help you focus entirely on teaching while the software handles administration.",
        definitionBlock: "Vyora's Education Management System is a comprehensive administrative and academic software tailored for coaching institutes, tuition centers, and professional academies. It centralizes student enrollment, dynamic batch scheduling, multi-tier fee management, and performance tracking. By incorporating a branded student portal arrayed with online testing and secure resource distribution, the platform minimizes administrative overhead and significantly enhances the digital learning experience.",
        products: [
            {
                name: "Student Information System",
                description: "Centralized database for student records, academics, and parents.",
                subcategories: ["Digital Enrollment", "Performance History", "Document Vault"]
            },
            {
                name: "Fee Management Engine",
                description: "Automated billing, online payments, and late fee tracking.",
                subcategories: ["Installment Tracking", "Instant Receipts", "Discount Rules"]
            },
            {
                name: "Digital Learning Portal",
                description: "Secure space for students to access materials and take tests.",
                subcategories: ["Video Hosting", "Online Assessments", "Doubt Clearing Hub"]
            }
        ],
        services: [
            {
                name: "Batch & Timetable Scheduling",
                description: "Conflict-free class scheduling and resource allocation.",
                subcategories: ["Teacher Assignment", "Room Utilization", "Rescheduling Alerts"]
            },
            {
                name: "Attendance & Communication",
                description: "Biometric or app-based attendance with automatic parent SMS.",
                subcategories: ["Absentee Follow-up", "Broadcast Announcements", "Performance Reports"]
            },
            {
                name: "Lead & Inquiry CRM",
                description: "Track prospective students and manage the admission pipeline.",
                subcategories: ["Counselor Tracking", "Conversion Analytics", "Demo Scheduling"]
            }
        ],
        comparisonTable: [
            { feature: "Fee Collection", vyora: "Automated reminders & payment links", traditional: "Manual generation", manual: "Cash/Cheque only" },
            { feature: "Attendance", vyora: "Instant SMS to parents", traditional: "End of day batch SMS", manual: "Calling individual parents" },
            { feature: "Assessments", vyora: "Online tests, auto-graded", traditional: "Scanned paper tests", manual: "Manual grading" },
            { feature: "Scheduling", vyora: "Conflict-free drag-and-drop", traditional: "Basic calendar", manual: "Whiteboard & Excel" }
        ],
        bulletFacts: [
            "Increase timely fee collections by 35% using automated WhatsApp and SMS payment links.",
            "Reduce daily administrative tasks by 4 hours with biometric attendance and auto-SMS.",
            "Launch a custom-branded student application for notes, videos, and online tests instantly.",
            "Prevent scheduling conflicts across multiple teachers and batches with intelligent timetabling.",
            "Track counselor performance and admission conversion rates from inquiry to enrollment."
        ],
        faqs: [
            { q: "Can we set up installment plans for student fees?", a: "Yes, the Fee Management Engine allows for highly flexible payment structures. You can set up custom installment plans, specify due dates, and the system will automatically send reminders and generate links when payments are due." },
            { q: "Does the system support online tests and auto-grading?", a: "Absolutely. You can create multiple-choice, subjective, or mixed-format assessments. Objective questions are auto-graded instantly, providing immediate performance analytics and ranking reports to both students and parents." },
            { q: "How are parents informed about their child's attendance?", a: "With Vyora, the moment a student's attendance is marked—whether manually via the app, or through biometric integration—an automated SMS or WhatsApp message is dispatched to the parents confirming their presence or absence." },
            { q: "Is the student learning portal secure against piracy?", a: "We employ advanced DRM (Digital Rights Management) and secure video streaming protocols within the portal to prevent unauthorized downloading or screen-recording of your proprietary lectures and study materials." },
            { q: "Can the system generate customized ID cards and report cards?", a: "Yes, you can upload your institute's branding templates. The system pulls student data to bulk-generate printable ID cards with barcodes or QR codes, as well as highly detailed, graphical report cards at the end of every term." },
            { q: "How does the admission CRM help increase enrollments?", a: "The CRM captures leads from your website or social media instantly. It allows counselors to log call details, schedule demo classes, and set follow-up tasks. The visual pipeline ensures no prospective student inquiry falls through the cracks." },
            { q: "Can we manage salary and payroll for our teaching staff?", a: "Yes, the HR module tracks staff attendance, calculates leave balances, and processes payroll. It can factor in hourly rates for guest lecturers or fixed salaries for permanent staff, generating professional payslips automatically." },
            { q: "What if there is a sudden change in the timetable?", a: "If a teacher is absent or a class needs rescheduling, the drag-and-drop timetable interface flags any conflicts (like room unavailability). Once updated, the system instantly broadcasts the change via app notification and SMS to the affected batch." },
            { q: "Does the software support multiple branches or franchises?", a: "Vyora is built for scale. You can manage multiple coaching branches from a single 'Super Admin' dashboard. You can standardize study material across branches while allowing independent fee and batch management locally." },
            { q: "Can students submit assignments online?", a: "Yes, the student portal includes a dedicated assignment module. Teachers can upload assignments with deadlines; students upload their completed work (documents or photos), and teachers can review and provide digital feedback in one place." }
        ],
        testimonials: [
            { name: "Prof. Arvind Mehta", role: "Director, Mehta Academy", location: "Kota, IN", initial: "A", content: "Chasing fee payments used to consume our administrative staff. With Vyora's automated payment links via WhatsApp, our on-time collections jumped by 35% in the first term.", rating: 5, metric: "35% Increase in Timely Fees" },
            { name: "Sunita Reddy", role: "Principal, Pinnacle International", location: "Hyderabad, IN", initial: "S", content: "The automated attendance SMS feature gives parents incredible peace of mind and saves our reception desk hours of phone calls every single morning.", rating: 5, metric: "Hours Saved Daily" },
            { name: "Rahul Sharma", role: "Founder, Target Entrance Prep", location: "Delhi, IN", initial: "R", content: "Moving our mock tests online with Vyora was a game-changer. The instant auto-grading and deep performance analytics help our students pinpoint their weak areas immediately.", rating: 5, metric: "Instant AI Performance Analytics" },
            { name: "Priya Desai", role: "Lead Counselor, Career Quest", location: "Pune, IN", initial: "P", content: "The CRM visual pipeline ensures we never miss following up on a lead. Our conversion rate from inquiry to enrolled student has noticeably improved since implementation.", rating: 5, metric: "Trackable Admission Pipeline" },
            { name: "Vikram Chauhan", role: "Admin Head, Global Languages Institute", location: "Mumbai, IN", initial: "V", content: "Managing timetables for 40 teachers across 3 branches was a nightmare. The conflict-free scheduling tool in Vyora turned a 3-day headache into a 30-minute task.", rating: 5, metric: "Zero Scheduling Conflicts" },
            { name: "Kavita Iyer", role: "Owner, Little Scholars Tuition", location: "Chennai, IN", initial: "K", content: "The branded student portal looks so professional. Parents are highly impressed that a mid-sized center like ours has a mobile app on par with massive EdTech companies.", rating: 5, metric: "MNC-Level Brand Perception" },
            { name: "Rajiv Singh", role: "Director, Excellence Classes", location: "Chandigarh, IN", initial: "R", content: "Handling staff payroll and calculating hourly wages for visiting faculty is now fully automated based on their actual logged teaching hours. 100% accurate every month.", rating: 5, metric: "Automated Accurate Payroll" },
            { name: "Sneha Patel", role: "Coordinator, Success Coaching", location: "Ahmedabad, IN", initial: "S", content: "When rain forced sudden cancellations last month, one click sent an SMS and push notification to 500 students instantly. The communication tools are incredibly reliable.", rating: 5, metric: "Instant Broadcast Reliability" },
            { name: "Kunal Bose", role: "Manager, Tech Skills Hub", location: "Kolkata, IN", initial: "K", content: "The document vault keeps all our proprietary coding challenges and study materials perfectly secure against unauthorized sharing, protecting our intellectual property.", rating: 5, metric: "Secure Intellectual Property" },
            { name: "Deepa Nair", role: "Founder, Harmony Arts Academy", location: "Thiruvananthapuram, IN", initial: "D", content: "We love how flexible the fee structures are. Generating custom instalment plans or applying sibling discounts takes seconds, and the accounting matches perfectly.", rating: 5, metric: "Flexible Billing Logic" }
        ],
        stats: [
            { value: "35%", label: "Faster Fee Collection" },
            { value: "0", label: "Scheduling Conflicts" },
            { value: "100%", label: "Parent Transparency" },
            { value: "24/7", label: "Student Portal Access" }
        ],
        metaTitle: "Education & Coaching Management Software | Institute ERP",
        metaDescription: "Transform your coaching center or academy. Automate fee collection, schedule batches, track attendance, and launch your own digital learning portal instantly.",
        accentColor: {
            from: "from-indigo-500",
            to: "to-blue-700",
            text: "text-indigo-600",
            bg: "bg-indigo-50",
            border: "border-indigo-200",
            highlight: "bg-indigo-100"
        },
        relatedCategories: ["professional-services", "fitness", "home-services"]
    },
    {
        slug: "home-services",
        name: "Home Services & Repair",
        icon: Wrench,
        image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200&h=800&fit=crop&q=80",
        subtitle: "Command Center for Field Service Professionals",
        description: "Empower your plumbing, HVAC, electrical, or cleaning teams. Vyora offers intelligent job dispatching, live GPS tracking, dynamic online booking, and on-site invoicing to ensure your technicians arrive on time and get paid faster.",
        definitionBlock: "Vyora's Field Service Management (FSM) platform is a robust orchestration engine for home service providers. It synchronizes intelligent multi-technician dispatching, live GPS personnel tracking, and real-time inventory management. Featuring a dedicated technician mobile application and integrated on-site invoicing, the software dramatically reduces travel inefficiencies, enhances first-time fix rates, and elevates the customer experience through automated ETA notifications.",
        products: [
            {
                name: "Intelligent Dispatch Board",
                description: "Visual calendar to assign and track jobs across your entire fleet.",
                subcategories: ["Skill-based Routing", "Live GPS Map", "Emergency Reassignment"]
            },
            {
                name: "Technician Mobile App",
                description: "Everything your field workers need to complete the job on-site.",
                subcategories: ["Digital Estimates", "Photo Attachments", "E-Signatures"]
            },
            {
                name: "Customer Booking Portal",
                description: "Allow clients to book services online 24/7 based on your live availability.",
                subcategories: ["Custom Intake Forms", "Upfront Deposits", "Automated Confirmations"]
            }
        ],
        services: [
            {
                name: "Quoting & On-site Invoicing",
                description: "Build tiered estimates and collect payment before leaving the driveway.",
                subcategories: ["Digital Payment Links", "Pre-built Price Books", "Tax Automation"]
            },
            {
                name: "Inventory & Fleet Management",
                description: "Track parts usage per job and manage vehicle maintenance schedules.",
                subcategories: ["Truck Stocking", "Purchase Orders", "Equipment Tracking"]
            },
            {
                name: "Service Agreements & Maintenance",
                description: "Manage recurring revenue through automated service contracts.",
                subcategories: ["Contract Billing", "Auto-schedule Visits", "Renewal Reminders"]
            }
        ],
        comparisonTable: [
            { feature: "Job Dispatching", vyora: "Drag-and-drop to live GPS map", traditional: "Whiteboard calendar", manual: "Phone calls to techs" },
            { feature: "Customer Updates", vyora: "Automated 'On the Way' SMS with ETA", traditional: "Manual text messages", manual: "Customers calling office" },
            { feature: "Invoicing", vyora: "Instant digital payment on-site", traditional: "Mailing paper invoices later", manual: "Carbon copy booklets" },
            { feature: "Service Contracts", vyora: "Automated recurring scheduling", traditional: "Spreadsheet tracking", manual: "Memory or sticky notes" }
        ],
        bulletFacts: [
            "Improve first-time fix rates by 22% using accurate digital intake forms and photo uploads.",
            "Reduce technician travel time by dynamically dispatching based on live GPS tracking.",
            "Accelerate cash flow collecting secure digital payments instantly on the job site.",
            "Elevate customer trust with Uber-style 'Technician is on the way' SMS tracking links.",
            "Build a predictable recurring revenue stream with automated maintenance contracts."
        ],
        faqs: [
            { q: "How does the intelligent dispatch system assign jobs?", a: "The dispatch board integrates with the technicians' mobile app GPS. It allows dispatchers to see live locations, current job status, and individual skill sets, enabling them to assign the closest qualified technician to an emergency call with a single drag-and-drop action." },
            { q: "Can technicians create estimates while on the job site?", a: "Yes, the mobile app includes a digital price book. Technicians can build 'Good, Better, Best' tiered estimates on their tablet, present them to the homeowner, capture a digital signature for approval, and immediately convert the approved estimate into an active job." },
            { q: "Do customers receive updates on when the technician will arrive?", a: "Absolutely. When a technician taps 'En Route' on their app, the system automatically sends an SMS to the customer. This message includes an estimated time of arrival (ETA) and a tracking link so they can see the technician's approach on a map." },
            { q: "How does the system handle recurring maintenance contracts?", a: "The Service Agreements module manages recurring jobs (like bi-annual HVAC tune-ups). It tracks the contract value, automatically bills the customer on the agreed frequency, and automatically populates the job on the dispatch board when it's time for the visit." },
            { q: "Can technicians take before-and-after photos of their work?", a: "Yes, the mobile app allows technicians to capture high-resolution photos and detailed notes, attaching them directly to the customer's permanent digital file. These can also be appended to the final invoice as proof of service." },
            { q: "Does Vyora manage parts inventory carried on the trucks?", a: "The inventory module can track stock across multiple physical warehouses as well as individual 'virtual locations' (like Truck A or Truck B). When a technician adds a part to a job invoice, it automatically depletes from their specific truck inventory." },
            { q: "Can customers book services directly from our website?", a: "Yes, we provide a customizable booking widget. Customers can select their service issue, view your calendar matching real-time availability, and book an appointment online, which then funnels straight into your dispatch board." },
            { q: "How do field workers collect payment?", a: "Once the job is marked complete, the technician can generate the invoice. They can accept credit card payments on the spot via a card reader, or send a secure payment link via SMS/Email to the customer, drastically reducing accounts receivable." },
            { q: "Can we track the profitability of specific jobs or technicians?", a: "The analytics dashboard tracks labor costs, parts margins, and travel time. It provides deep insights into which types of jobs, or which specific technicians, are generating the highest profit margins for your business." },
            { q: "Is the technician app functional if they lose cell service?", a: "Yes, the mobile app features a robust offline mode. Technicians can view job details, add notes, capture photos, and finalize invoices without an internet connection. The data automatically synchronizes with the cloud once they reconnect." }
        ],
        testimonials: [
            { name: "Suresh Patil", role: "Owner, SureFlow Plumbing", location: "Pune, IN", initial: "S", content: "The GPS dispatching completely changed how we handle emergency calls. I can see exactly which truck is closest to a burst pipe and redirect them instantly. It saves hours of drive time weekly.", rating: 5, metric: "Hours of Drive Time Saved" },
            { name: "Amit Sharma", role: "Director, CoolBreeze HVAC", location: "Delhi, IN", initial: "A", content: "Before Vyora, our guys would write carbon copy invoices and we'd chase payments for weeks. Now they collect credit card payments on their tablet before leaving the driveway. Our cash flow is incredible.", rating: 5, metric: "Zero Accounts Receivable" },
            { name: "Pooja Desai", role: "Manager, Spark Electricals", location: "Mumbai, IN", initial: "P", content: "The 'On the way' text messages with the tracking link give our company such a premium, MNC-level feel. Customers constantly rave about how professional our communication is.", rating: 5, metric: "5-Star Customer Feedback" },
            { name: "Vikram Reddy", role: "Founder, GreenClean Services", location: "Hyderabad, IN", initial: "V", content: "We manage 30 residential cleaners. The mobile app ensures they have the exact checklist for every house, and the before-and-after photos protect us from unwarranted complaints.", rating: 5, metric: "100% Quality Assurance" },
            { name: "Kiran Menon", role: "Operations Lead, Apex Pest Control", location: "Kochi, IN", initial: "K", content: "The recurring service agreements module is fantastic. It automatically schedules our quarterly exterior sprays and bills the clients. We don't have to remember a thing.", rating: 5, metric: "Automated Recurring Revenue" },
            { name: "Rahul Singh", role: "Owner, Singh Garage Doors", location: "Chandigarh, IN", initial: "R", content: "Allowing customers to book an appointment directly from our website at 10 PM has increased our lead capture by at least 20%. The calendar syncs flawlessly with our dispatch board.", rating: 5, metric: "20% More Online Leads" },
            { name: "Neha Gupta", role: "Admin, Swift Appliance Repair", location: "Bengaluru, IN", initial: "N", content: "Tracking truck inventory has always been a nightmare. Now, when a compressor is added to an invoice, I know immediately that Truck 4 is out of stock and requires a replenishment order.", rating: 5, metric: "Accurate Truck Inventory" },
            { name: "Rajesh Iyer", role: "Partner, Urban Handymen", location: "Chennai, IN", initial: "R", content: "The 'Good, Better, Best' quoting feature on the tablet has naturally increased our average ticket size. When customers see the options clearly presented, they often choose the premium repair.", rating: 5, metric: "Increased Ticket Size" },
            { name: "Arjun Chauhan", role: "CEO, Masterpiece Painters", location: "Jaipur, IN", initial: "A", content: "Taking digital signatures on the tablet for paint color approvals before starting the job has completely eliminated miscommunications and expensive repaints.", rating: 5, metric: "Zero Miscommunications" },
            { name: "Simran Kaur", role: "Dispatch Head, Aqua Pure RO", location: "Lucknow, IN", initial: "S", content: "The offline capability of the app is a lifesaver. Our technicians frequently work in basements with zero cell service. They can still finish the digital paperwork uninterrupted.", rating: 5, metric: "Flawless Offline Mode" }
        ],
        stats: [
            { value: "22%", label: "Higher First-Time Fix" },
            { value: "Instant", label: "On-Site Payments" },
            { value: "100%", label: "Live Fleet Tracking" },
            { value: "24/7", label: "Customer Portal" }
        ],
        metaTitle: "Field Service Management Software | Dispatch & Invoicing",
        metaDescription: "The ultimate software for home service professionals. Upgrade your plumbing, HVAC, or electrical business with live dispatching, mobile tech apps, and instant invoicing.",
        accentColor: {
            from: "from-stone-500",
            to: "to-stone-700",
            text: "text-stone-700",
            bg: "bg-stone-50",
            border: "border-stone-200",
            highlight: "bg-stone-100"
        },
        relatedCategories: ["real-estate", "automotive", "consulting"]
    },
    {
        slug: "electronics",
        name: "Electronics & Appliance Stores",
        icon: Monitor,
        image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1200&h=800&fit=crop&q=80",
        subtitle: "Precision Inventory and Integrated Repair Management",
        description: "Manage complex high-value inventory seamlessly. Vyora combines a robust retail POS with serialized product tracking, warranty management, and a dedicated repair ticketing system, creating a unified solution for modern electronics retailers.",
        definitionBlock: "Vyora's Electronics Retail and Repair Management System is an integrated commerce platform specifically engineered for technology retailers and repair centers. It fuses omnichannel retail point-of-sale capabilities with stringent serialized inventory tracking and warranty lifecycle management. The system features a specialized repair ticketing module module that tracks device state, coordinates technician workflows, and automates customer updates, effectively mitigating liability and elevating service transparency.",
        products: [
            {
                name: "Serialized Inventory POS",
                description: "Lightning-fast checkout that tracks individual product serial numbers.",
                subcategories: ["IMEI Tracking", "Bundle Processing", "Multi-tender Checkout"]
            },
            {
                name: "Omnichannel E-commerce",
                description: "Instantly deployable online tech store syncing with physical inventory.",
                subcategories: ["Tech Specs Display", "Accessory Upsell", "Secure Checkout"]
            },
            {
                name: "Warranty Management Hub",
                description: "Automated tracking for manufacturer and extended store warranties.",
                subcategories: ["Digital Claim Forms", "Expiry Alerts", "RMA Processing"]
            }
        ],
        services: [
            {
                name: "Integrated Repair Ticketing",
                description: "Track devices from intake diagnostics to final returned repair.",
                subcategories: ["Device Condition Photos", "Labor & Parts Invoicing", "Status Tracking"]
            },
            {
                name: "Customer Notifications",
                description: "Automated updates alerting customers of repair status or specific stock.",
                subcategories: ["SMS 'Ready for Pickup'", "Email Invoices", "Special Order Alerts"]
            },
            {
                name: "Purchasing & Supplier Returns",
                description: "Manage complex supplier relationships, POs, and defective returns.",
                subcategories: ["Automated Restocking", "Vendor Credit Tracking", "Cost Averaging"]
            }
        ],
        comparisonTable: [
            { feature: "Repair Tracking", vyora: "Digital tickets with photo proof", traditional: "Paper tags on devices", manual: "Verbal agreements" },
            { feature: "Serial Tracking", vyora: "Mandatory scan at checkout", traditional: "Optional textbook entry", manual: "No tracking" },
            { feature: "Customer Updates", vyora: "Automated SMS at every stage", traditional: "Manual phone calls", manual: "Customer keeps calling" },
            { feature: "Warranty Claims", vyora: "1-click digital RMA generation", traditional: "Filing paper receipts", manual: "Relying on physical boxes" }
        ],
        bulletFacts: [
            "Mitigate liability claims by capturing high-res photos of device conditions during intake.",
            "Track thousands of unique products flawlessly using mandatory IMEI/Serial scanning at POS.",
            "Reduce customer inquiry calls by 45% using automated 'Repair Status' SMS updates.",
            "Increase accessory add-on sales by 15% through AI-driven checkout prompts.",
            "Process manufacturer RMAs (Return Merchandise Authorizations) rapidly with digital ledgers."
        ],
        faqs: [
            { q: "How does the system handle tracking identical items with different serial numbers?", a: "Vyora's inventory system is built for electronics. It enforces serialized tracking (like IMEI for phones or serial numbers for laptops). When receiving stock or processing a sale, the system demands the specific unique identifier, ensuring absolute traceability for warranties and theft prevention." },
            { q: "Can we manage a dedicated repair center within the retail store?", a: "Yes, the Repair Ticketing module is completely integrated. You can transition a customer from purchasing a retail accessory directly into checking in a broken device. The system creates a specialized visual ticket tracking parts, labor, and device status." },
            { q: "What liability protections exist for intake of damaged devices?", a: "During the repair intake workflow, the system prompts the staff to log pre-existing damage, battery status, and missing components. Importantly, it allows instant photo uploads via a tablet. The customer digitally signs this intake report, significantly reducing liability disputes." },
            { q: "How are customers informed when their repair is finished?", a: "You can configure automated workflows. The moment a technician changes a repair ticket status from 'In Progress' to 'Ready for Pickup', Vyora automatically triggers a customizable SMS and email to the customer, drastically reducing inbound 'Is it ready?' phone calls." },
            { q: "Does the system support selling refurbished or trade-in devices?", a: "Calculated trade-ins are fully supported. You can purchase a used device from a customer (issuing store credit or cash), process it through a refurbishment repair ticket, and seamlessly transition it back into your retail inventory as a graded refurbished SKU." },
            { q: "Can the POS prompt cashiers to sell extended warranties or accessories?", a: "Yes. Using the intelligent bundling engine, you can map specific cases, cables, or extended warranty plans to parent items (like a specific laptop model). When the laptop is scanned, the POS automatically prompts the cashier to offer the relevant high-margin add-ons." },
            { q: "How does the e-commerce store handle complex technical specifications?", a: "The integrated e-commerce platform allows for dense metadata tagging. You can display detailed, tabular technical specifications (RAM, processor, storage) that allow customers to effectively filter, compare, and search for exactly what they need online." },
            { q: "Is it possible to track parts used in a repair against our inventory?", a: "Absolutely. When a technician requires a screen replacement or battery for a repair ticket, they 'pull' it from the system. It is immediately deducted from your inventory pipeline and automatically added to the final labor and parts invoice for the customer." },
            { q: "How do we handle defective stock returns to our suppliers?", a: "Vyora includes a robust Return Merchandise Authorization (RMA) workflow. You can flag an item in inventory as defective, automatically generating the return documentation for your vendor, and the system tracks the pending vendor credit or replacement." },
            { q: "Can multiple store locations share a single customer database?", a: "Yes. Vyora operates on a centralized cloud architecture. If a customer buys a laptop at your North branch, they can walk into your South branch a year later for a repair, and the staff instantly has access to their full purchase history, warranty status, and contact info." }
        ],
        testimonials: [
            { name: "Rahul Sharma", role: "Owner, Prime Electronics", location: "Delhi, IN", initial: "R", content: "The mandatory serial number scanning at checkout has saved us from massive headaches. We know exactly which unit a customer bought, making warranty validations instant and indisputable.", rating: 5, metric: "100% Accurate Tracking" },
            { name: "Amit Desai", role: "Manager, TechFix Hub", location: "Mumbai, IN", initial: "A", content: "Our previous repair system was paper tags and sticky notes. Vyora's digital repair tickets and automated SMS updates reduced our inbound customer calls by almost 50%.", rating: 5, metric: "50% Fewer Support Calls" },
            { name: "Sneha Reddy", role: "Director, Gadget World", location: "Hyderabad, IN", initial: "S", content: "Taking photos of a cracked screen during intake and getting the customer's e-signature has completely eliminated claims that 'we caused the damage'. It protects our business daily.", rating: 5, metric: "Zero Liability Disputes" },
            { name: "Vikram Patel", role: "Founder, ElectroMart", location: "Ahmedabad, IN", initial: "V", content: "The POS prompts for accessory cross-sells are brilliant. When a cashier scans a new phone, it immediately suggests the correct screen protector, boosting our margin per transaction significantly.", rating: 5, metric: "15% Higher Margins" },
            { name: "Pooja Iyer", role: "Operations Lead, Smart Solutions", location: "Chennai, IN", initial: "P", content: "Managing our trade-in program used to be an accounting nightmare. Vyora handles the buyback, the refurbishment cost tracking, and the resale pricing under one unified workflow.", rating: 5, metric: "Flawless Trade-In Flow" },
            { name: "Karan Singh", role: "Owner, PC Builders", location: "Pune, IN", initial: "K", content: "Building custom PCs means tracking dozens of components per build. The system deducts the motherboard, RAM, and CPU from inventory the moment the build ticket is finalized. Extremely precise.", rating: 5, metric: "Precise Component Tracking" },
            { name: "Neha Gupta", role: "Supply Chain Manager, Vision Tech", location: "Kolkata, IN", initial: "N", content: "The vendor RMA (Return to Vendor) process is perfectly integrated. We no longer lose track of defective items waiting to be shipped back for credit. It's fully accountable.", rating: 5, metric: "Accountable RMAs" },
            { name: "Rajiv Menon", role: "CEO, Connect Retail Group", location: "Bengaluru, IN", initial: "R", content: "Having our online store perfectly synchronized with our three physical locations means a customer can see live stock availability before driving in. It drives massive foot traffic.", rating: 5, metric: "Increased Store Footfall" },
            { name: "Anjali Chauhan", role: "Store Manager, Mobile Pros", location: "Chandigarh, IN", initial: "A", content: "The multi-location database is excellent. I had a customer bring in a tablet for repair that they bought at our sister store; I pulled up their receipt instantly by just entering their phone number.", rating: 5, metric: "Unified Customer Data" },
            { name: "David Fernandez", role: "Head Technician, iRepair", location: "Goa, IN", initial: "D", content: "Vyora keeps my technicians focused. The repair board shows exactly what needs prioritizing, and when they mark it done, the front desk is instantly notified to invoice. Seamless workflow.", rating: 5, metric: "Seamless Team Handoffs" }
        ],
        stats: [
            { value: "100%", label: "Serialized Traceability" },
            { value: "45%", label: "Fewer Inquiry Calls" },
            { value: "15%", label: "Higher Add-on Margins" },
            { value: "0", label: "Lost Repair Tickets" }
        ],
        metaTitle: "Electronics POS & Repair Tracking Software",
        metaDescription: "Elevate your tech retail. Manage serialized inventory, automate repair tickets, launch e-commerce, and process warranties effortlessly with Vyora.",
        accentColor: {
            from: "from-cyan-600",
            to: "to-blue-700",
            text: "text-cyan-700",
            bg: "bg-cyan-50",
            border: "border-cyan-200",
            highlight: "bg-cyan-100"
        },
        relatedCategories: ["retail", "automotive", "home-services"]
    },
    {
        slug: "fashion",
        name: "Fashion & Apparel",
        icon: Shirt,
        image: "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=1200&h=800&fit=crop&q=80",
        subtitle: "Omnichannel Command for Boutiques and Brands",
        description: "Unleash the full potential of your fashion brand. Vyora effortlessly handles complex product matrixes (sizes/colors), synchronizes your physical boutique with a stunning e-commerce presence, and cultivates deep brand loyalty.",
        definitionBlock: "Vyora's Fashion Retail Platform is a specialized omnichannel management framework built for apparel boutiques and modern lifestyle brands. It resolves complex inventory topologies through a multi-dimensional matrix architecture, effortlessly governing thousands of size, color, and fabric permutations. Integrated seamlessly with high-velocity point-of-sale systems and immersive e-commerce engines, it provides real-time global inventory synchronization and robust customer loyalty engagement.",
        products: [
            {
                name: "Matrix Inventory Master",
                description: "Effortlessly manage parent products and hundreds of child variants.",
                subcategories: ["Size/Color Topologies", "Bulk SKU Generation", "Barcode Printing"]
            },
            {
                name: "Visual E-Commerce Store",
                description: "Stunning, image-rich online storefronts that sync live with the register.",
                subcategories: ["Lookbook Integration", "Mobile-First UX", "Abandoned Cart Recovery"]
            },
            {
                name: "High-Speed Fashion POS",
                description: "Sleek, iPad-ready point of sale that looks brilliant on your counter.",
                subcategories: ["Quick Returns/Exchanges", "Customer Profiling", "Digital Receipts"]
            }
        ],
        services: [
            {
                name: "Stylist & Customer Relaying",
                description: "Track customer sizing, past purchases, and style preferences.",
                subcategories: ["VIP Clienteling", "Size Profiles", "Automated Birthday Offers"]
            },
            {
                name: "Seasonal Promotions Engine",
                description: "Deploy complex BOGO and clearance rules across all channels instantly.",
                subcategories: ["Flash Sales", "Discount Stacking", "Promo Code Generation"]
            },
            {
                name: "Supplier & Purchase Orders",
                description: "Forecast seasonal trends and re-order top performing lines quickly.",
                subcategories: ["Vendor Catalogs", "Margin Calculators", "Partial Receiving"]
            }
        ],
        comparisonTable: [
            { feature: "Variant Management", vyora: "Matrix grid (1-click updates)", traditional: "Individual separate items", manual: "Endless spreadsheets" },
            { feature: "Inventory Sync", vyora: "Real-time online & in-store", traditional: "Nightly batch processing", manual: "Physical inventory only" },
            { feature: "Clienteling", vyora: "Rich profiles (sizes, history)", traditional: "Basic email list", manual: "Memory based" },
            { feature: "Promotions", vyora: "Omnichannel instant sync", traditional: "Separate POS & Web setup", manual: "Calculated at register" }
        ],
        bulletFacts: [
            "Manage 10,000+ fashion variants effortlessly using our dedicated Size/Color matrix topology.",
            "Reduce stockouts and over-ordering by tracking precise sell-through rates on individual sizes.",
            "Increase repeat purchases by 30% utilizing integrated VIP clienteling and loyalty points.",
            "Launch a stunning, image-heavy, mobile-optimized online fashion brand in under 48 hours.",
            "Process complex seasonal markdowns and clearance events across all channels with one click."
        ],
        faqs: [
            { q: "How does Vyora handle products with multiple sizes and colors?", a: "Vyora utilizes a robust matrix inventory system specifically designed for apparel. You create a parent product (e.g., 'V-Neck Tee') and select your defining attributes (e.g., Colors: Red, Blue; Sizes: S, M, L). The system automatically generates all the unique SKU variations, allowing you to manage pricing and track stock for each specific combination." },
            { q: "Can I print barcode labels for my clothing tags?", a: "Yes. The system seamlessly integrates with standard thermal barcode and label printers. You can design custom tags featuring your logo, the product name, variant details (Size/Color), price, and the scannable barcode directly from the inventory dashboard." },
            { q: "How does the e-commerce synchronization work?", a: "It is completely real-time. If a customer buys the last 'Large Red Tee' in your physical boutique, it is instantly marked as 'Out of Stock' on your e-commerce storefront. This prevents the nightmare scenario of overselling and issuing apologies/refunds." },
            { q: "Is it easy to process an exchange if a customer bought the wrong size?", a: "Exchanges are incredibly fast. A cashier scans the receipt, selects the item to return, and scans the new item the customer wants. Vyora automatically updates the inventory for both the returned and newly purchased size, calculating any price difference instantly." },
            { q: "Can we track individual customer sizes and preferences?", a: "Absolutely. The Clienteling CRM allows your staff to build rich profiles. You can store a customer's specific sizes, favored brands, past purchase history, and even style notes. This data empowers your staff to provide highly personalized, MNC-level 'personal shopper' experiences." },
            { q: "Does the system support gift cards and store credit?", a: "Yes. Customers can purchase physical or digital gift cards. Most importantly, if a customer returns an item, you can issue the refund instantly as digital Store Credit attached to their profile, keeping the revenue securely within your business." },
            { q: "How do seasonal sales and BOGO (Buy One Get One) promotions work?", a: "The Promotions Engine is highly advanced. You can define rules like 'Buy 2 Shirts, Get 1 Accessory 50% Off' or schedule a 30% storewide clearance to activate at midnight. These rules automatically sync across both your physical POS and online store simultaneously." },
            { q: "Can we manage inventory across multiple boutique locations?", a: "Yes. If a customer wants a medium dress that your current store is out of, the POS can instantly check live inventory at your other locations or warehouse. You can then reserve the item for them or arrange a direct store-to-customer shipment." },
            { q: "What analytics are available to understand fashion trends?", a: "The dashboard provides deep merchandising metrics. You can analyze sell-through rates, identify which colors or sizes are 'dead stock', and clearly see your most profitable vendor lines, allowing you to make significantly smarter purchasing decisions next season." },
            { q: "Is the online store mobile-friendly (responsive)?", a: "Yes, 100%. Over 70% of apparel shopping occurs on mobile devices. Your Vyora e-commerce storefront is meticulously designed with a mobile-first approach, ensuring stunning imagery, easy filtering, and frictionless checkout on smartphones." }
        ],
        testimonials: [
            { name: "Priya Menon", role: "Owner, Chic Threads Boutique", location: "Bengaluru, IN", initial: "P", content: "The matrix inventory system saved my sanity. Updating prices or checking stock for a dress that comes in 4 colors and 5 sizes is now done on one single screen instead of 20.", rating: 5, metric: "Effortless Variant Control" },
            { name: "Rahul Kapoor", role: "Founder, Urban Denim Co.", location: "Delhi, IN", initial: "R", content: "We run flash sales constantly. Deploying a 'Buy 2 Get 1 Free' promotion across our physical store and website now exactly one click. It's incredibly powerful.", rating: 5, metric: "1-Click Omnichannel Promos" },
            { name: "Sneha Desai", role: "Director, Luxe Wardrobe", location: "Mumbai, IN", initial: "S", content: "The clienteling features allow our staff to act like personal stylists. Knowing a VIP customer's exact sizes and past purchases the moment they walk in elevates our entire brand experience.", rating: 5, metric: "VIP Client Experience" },
            { name: "Vikram Reddy", role: "Operations Head, Style Station", location: "Hyderabad, IN", initial: "V", content: "Overselling was destroying our brand reputation online. Since switching to Vyora's real-time sync, we haven't had a single out-of-stock cancellation. Flawless.", rating: 5, metric: "Zero Online Overselling" },
            { name: "Kajal Patel", role: "Manager, Ethnic Elegance", location: "Ahmedabad, IN", initial: "K", content: "Processing exchanges used to hold up the checkout line. Now, scanning the receipt, swapping the size, and auto-updating inventory takes literally 15 seconds.", rating: 5, metric: "15-Second Exchanges" },
            { name: "Arjun Verma", role: "CEO, ActiveWear Plus", location: "Pune, IN", initial: "A", content: "The merchandising analytics clearly showed us that our 'Extra Small' sizes were sitting as dead stock for months. We halted ordering them and improved our profit margins by 12%.", rating: 5, metric: "12% Margin Improvement" },
            { name: "Neha Sharma", role: "Founder, Little Footsteps Kids", location: "Chandigarh, IN", initial: "N", content: "Issuing store credit for returns instead of cash refunds has kept thousands of rupees inside our business. The digital credit attached to their profile means they never lose a receipt.", rating: 5, metric: "Retained Revenue via Credit" },
            { name: "Ravi Iyer", role: "Partner, The Shoe Vault", location: "Chennai, IN", initial: "R", content: "Checking inventory across our four outlets from the register is seamless. We save sales daily by locating the right shoe size across town and having it shipped.", rating: 5, metric: "Saved Sales Daily" },
            { name: "Anjali Bose", role: "Creative Director, Aura Designs", location: "Kolkata, IN", initial: "A", content: "The e-commerce storefront we built through Vyora looks like we paid a premium agency a million rupees. The image zoom and mobile lookbook features are stunning.", rating: 5, metric: "Stunning Digital Storefront" },
            { name: "Tariq Ali", role: "Owner, Men's Classic Wear", location: "Lucknow, IN", initial: "T", content: "Printing custom barcode tags directly from the purchase order receiving screen turned a two-day inventory check-in process into a two-hour job. Immense time savings.", rating: 5, metric: "Rapid Inventory Receiving" }
        ],
        stats: [
            { value: "0", label: "Overselling Incidents" },
            { value: "30%", label: "Higher VIP Retention" },
            { value: "10k+", label: "Variants Supported" },
            { value: "70%", label: "Faster Inventory Counts" }
        ],
        metaTitle: "Fashion & Apparel POS | Omnichannel Retail Software",
        metaDescription: "The ultimate platform for fashion brands. Master complex matrix inventory (sizes/colors), sync your boutique with e-commerce, and elevate your VIP clienteling.",
        accentColor: {
            from: "from-pink-600",
            to: "to-rose-600",
            text: "text-pink-600",
            bg: "bg-pink-50",
            border: "border-pink-200",
            highlight: "bg-pink-100"
        },
        relatedCategories: ["retail", "jewelry", "beauty-&-wellness"]
    },
    {
        slug: "automotive",
        name: "Automotive & Garages",
        icon: Car,
        image: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=1200&h=800&fit=crop&q=80",
        subtitle: "Accelerate Operations for Modern Auto Repair Shops",
        description: "Shift your auto workshop into high gear. Vyora comprehensively manages service bay appointments, complex parts inventory matrices, detailed digital vehicle inspections, and streamlined invoicing, fueling profitability and customer trust.",
        definitionBlock: "Vyora's Automotive Repair and Garage Management Platform is an end-to-end operative ecosystem designed specifically for auto repair facilities, detailing centers, and tire shops. It integrates chronological digital vehicle inspections (DVI) with comprehensive parts cataloging and labor time estimations. By providing a centralized bay-scheduling architecture and transparent digital customer authorization workflows, the system mitigates service disputes and significantly boosts average repair order velocities.",
        products: [
            {
                name: "Workshop Management Controller",
                description: "Visual bay scheduling to track every vehicle in your shop.",
                subcategories: ["Technician Allocation", "Status Kanban", "Drop-off Management"]
            },
            {
                name: "Digital Vehicle Inspections (DVI)",
                description: "Tablet-based inspection forms capturing photos and technician notes.",
                subcategories: ["Color-coded Health Reports", "Video Attachments", "Automated Sharing"]
            },
            {
                name: "Parts & Labor Estimator",
                description: "Build incredibly accurate repair quotes combining parts margins and hourly labor.",
                subcategories: ["Supplier Integrations", "Canned Jobs", "Margin Calculators"]
            }
        ],
        services: [
            {
                name: "Customer Authorization Portal",
                description: "Send digital estimates via SMS for instant customer e-signatures.",
                subcategories: ["Line-item Approvals", "Decline Tracking", "Digital Receipts"]
            },
            {
                name: "Service Reminders & Marketing",
                description: "Automated follow-ups to bring customers back for regular maintenance.",
                subcategories: ["Oil Change Alerts", "MOT/Inspection Reminders", "Promotional SMS"]
            },
            {
                name: "Inventory & Core Tracking",
                description: "Track massive part numbers, oils, and process core returns.",
                subcategories: ["Low Stock Alerts", "Purchase Order Generation", "Barcode Scanning"]
            }
        ],
        comparisonTable: [
            { feature: "Vehicle Inspections", vyora: "Digital with photos & video", traditional: "Greasy paper clipboards", manual: "Verbal explanation" },
            { feature: "Estimate Approvals", vyora: "Digital SMS e-signature", traditional: "Calling and waiting", manual: "Verbal okay" },
            { feature: "Customer Reminders", vyora: "Automated mileage algorithms", traditional: "Window stickers only", manual: "Hoping they return" },
            { feature: "Bay Scheduling", vyora: "Live drag-and-drop dashboard", traditional: "Whiteboard assignments", manual: "Memory" }
        ],
        bulletFacts: [
            "Increase Average Repair Order (ARO) by 25% using visual, photo-based Digital Vehicle Inspections.",
            "Accelerate repair approvals from hours to minutes using instant SMS estimate links with e-signatures.",
            "Eliminate lost revenue by accurately tracking every drop of oil, filter, and labor hour on an invoice.",
            "Reduce no-shows and empty bays with automated appointment booking and SMS reminder systems.",
            "Build a loyal customer base with automated predictive service reminders based on driving habits."
        ],
        faqs: [
            { q: "How do Digital Vehicle Inspections (DVI) help increase sales?", a: "DVIs are game-changers for customer trust. Instead of calling a customer to say they need new brake pads, the technician uses a tablet to take a photo or video of the worn pad. When the customer sees the visual proof delivered via secure web link, authorization rates for recommended work jump significantly." },
            { q: "Can customers approve repair estimates straight from their phones?", a: "Yes. Once you build an estimate, you can send it via SMS or email. The customer opens a beautifully formatted, line-item breakout on their phone. They can digitally sign and 'approve' the work instantly, allowing your technicians to start wrenching without waiting on phone calls." },
            { q: "How does the software handle 'Canned Jobs' or common repairs?", a: "You can pre-build 'Canned Jobs' (e.g., standard oil change, brake replacement) that bundle the specific parts, fluids, and expected labor hours. When building an estimate, adding a canned job populates all necessary items and pricing instantly." },
            { q: "Does the system track inventory like engine oil and bulk fluids?", a: "Absolutely. You can track inventory in discrete units (like tires or filters) or in bulk fractions (like liters of synthetic oil). As these are added to a repair order, they are automatically deducted from your shop's inventory." },
            { q: "Can we track technician productivity and labor hours?", a: "Yes, the system features built-in time clocks on every repair order. Technicians clock into specific jobs. Management can then compare 'actual logged time' against 'billed flat-rate time' to track individual technician efficiency and shop profitability." },
            { q: "Is it possible to manage appointments across multiple service bays?", a: "The visual calendar allows you to map appointments directly to specific physical bays or specific specialized technicians. A drag-and-drop interface makes rescheduling effortless if a job runs over time." },
            { q: "How do automated marketing and service reminders work?", a: "Vyora calculates estimated return dates based on typical driving habits and previous service history. It can automatically send an SMS to a customer saying, 'Hi John, based on your last visit, you're due for an oil change. Click here to book!' completely automating retention." },
            { q: "Can the system look up vehicle details via license plate (VIN)?", a: "Yes, through integrated databases, entering the VIN or scanning it with a tablet camera will automatically decode and populate the year, make, model, and engine specifications into the customer's permanent digital file." },
            { q: "How do we manage 'Core Returns' for parts like alternators or batteries?", a: "The inventory and purchasing module tracks core charges natively. When you order a part with a core, the system flags it. It then tracks when the defective core is returned to the supplier to ensure you receive your financial credit." },
            { q: "Can customers view their vehicle's complete service history?", a: "Yes, customers have access to a secure digital portal. They can view every past invoice, review previous inspection reports, and track exactly how their vehicle has been maintained since they started visiting your shop." }
        ],
        testimonials: [
            { name: "Rahul Singh", role: "Owner, Modern Mechanics", location: "Delhi, IN", initial: "R", content: "Digital Vehicle Inspections changed everything for us. When customers see the red circles on the photos of their cracked belts, they approve the work immediately. Our average repair order increased by 25%.", rating: 5, metric: "25% Higher ARO" },
            { name: "Amit Bhasin", role: "Manager, AutoCare Hub", location: "Mumbai, IN", initial: "A", content: "Sending estimates via SMS for digital signature is brilliant. We used to waste hours playing phone tag to get approval. Now cars aren't tying up our lifts waiting for a 'yes'.", rating: 5, metric: "Rapid Repair Approvals" },
            { name: "Pooja Sharma", role: "Admin Lead, Speedy Lubes", location: "Pune, IN", initial: "P", content: "The automated service reminders are a silent revenue engine. Sending texts reminding people of upcoming oil changes based on their mileage history keeps our bays full consistently.", rating: 5, metric: "Consistent Bay Occupancy" },
            { name: "Vikram Desai", role: "Director, Apex Tires & Wheels", location: "Ahmedabad, IN", initial: "V", content: "Tracking thousands of tire SKUs across different brands and sizes was impossible before Vyora. The matrix inventory keeps our stock dead accurate and speeds up quoting massively.", rating: 5, metric: "Dead Accurate Inventory" },
            { name: "Kunal Reddy", role: "Owner, Reddy's Elite Garage", location: "Hyderabad, IN", initial: "K", content: "Canned jobs save my service advisors so much time. Pulling up a 'Front Brake Pad Replacement' instantly populates the labor hours and parts needed. Quoting takes seconds.", rating: 5, metric: "Seconds to Quote" },
            { name: "Sneha Menon", role: "Operations Manager, City AutoWorks", location: "Bengaluru, IN", initial: "S", content: "Vyora's technician time tracking finally gave me visibility. I can see exactly who is beating flat-rate times and who needs more training. Our overall shop efficiency improved by 18%.", rating: 5, metric: "18% Shop Efficiency Boost" },
            { name: "Rajiv Chauhan", role: "Partner, Classic Restorations", location: "Jaipur, IN", initial: "R", content: "VIN decoding via the tablet camera prevents so many parts-ordering mistakes. We know exactly what engine variation we are working on the moment the car rolls in.", rating: 5, metric: "Zero Parts Mismatches" },
            { name: "Neha Patel", role: "Finance Head, Highway Service Center", location: "Chennai, IN", initial: "N", content: "Tracking core returns used to mean losing money because we'd forget to send old parts back. Vyora's core tracking ensures we collect every rupee owed from our suppliers.", rating: 5, metric: "100% Core Return Recovery" },
            { name: "Arjun Iyer", role: "Service Advisor, Performance Tuning", location: "Kochi, IN", initial: "A", content: "The digital workflow is seamless. The mechanic updates the tablet, it pings my dashboard, I hit 'send invoice', and the customer receives a payment link. Completely paperless.", rating: 5, metric: "Seamless Paperless Shop" },
            { name: "Kavita Singh", role: "Owner, Secure Motors", location: "Chandigarh, IN", initial: "K", content: "In the rare event a customer disputes a repair, the archived DVI photos showing the condition before we started work provide undeniable proof. It protects our reputation and liability flawlessly.", rating: 5, metric: "Ironclad Liability Protection" }
        ],
        stats: [
            { value: "25%", label: "Increase in Average Repair Order" },
            { value: "8 Hrs", label: "Time Saved per Week on Quoting" },
            { value: "100%", label: "Digital Approvals" },
            { value: "40%", label: "More Return Visits via SMS" }
        ],
        metaTitle: "Auto Repair Shop Management & Garage Software",
        metaDescription: "Accelerate your auto repair business with Vyora. Digital vehicle inspections (DVI), SMS estimate approvals, automated reminders, and seamless bay scheduling.",
        accentColor: {
            from: "from-gray-600",
            to: "to-slate-800",
            text: "text-gray-700",
            bg: "bg-gray-100",
            border: "border-gray-300",
            highlight: "bg-gray-200"
        },
        relatedCategories: ["home-services", "electronics", "retail"]
    },
    {
        slug: "travel-tourism",
        name: "Travel & Tourism",
        icon: Globe,
        image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80",
        subtitle: "Manage bookings, itineraries, and clients seamlessly.",
        description: "A complete management suite for travel agencies, tour operators, and hospitality businesses to handle bookings, invoicing, and customer experiences.",
        definitionBlock: "Vyora for Travel & Tourism is a dedicated ERP and CRM solution tailored for the dynamic travel industry. It simplifies the complex web of managing customer inquiries, custom itinerary building, flight and hotel vendor payments, and visa tracking. Whether you run a boutique travel agency or a massive tour operation, Vyora centralizes your operations.",
        products: [
            {
                name: "Itinerary Builder",
                description: "Create visually stunning, day-by-day travel itineraries and share them instantly.",
                subcategories: ["Custom PDF Itineraries", "Web-Link Itineraries", "Cost Breakdowns"]
            },
            {
                name: "Booking Management",
                description: "Track all flights, hotels, and activities against specific customer files.",
                subcategories: ["PNR Tracking", "Hotel Confirmations", "Activity Vouchers"]
            },
            {
                name: "Client CRM",
                description: "Store passport details, frequent flyer numbers, and dietary preferences securely.",
                subcategories: ["Document Vault", "Preference Tracking", "Anniversary Reminders"]
            }
        ],
        services: [
            {
                name: "Vendor Payables",
                description: "Manage complex payment schedules to multiple airline and hotel affiliates.",
                subcategories: ["Multi-Currency Payments", "Commission Tracking", "Payment Deadlines"]
            },
            {
                name: "Visa Processing Tracker",
                description: "Keep customers updated automatically as their visa applications progress.",
                subcategories: ["Status Tracking", "Document Checklists", "Embassies DB"]
            },
            {
                name: "B2B Agent Portal",
                description: "Allow sub-agents to log in, view live inventory, and book packages.",
                subcategories: ["Agent Commissions", "White-label Portal", "Wallet System"]
            }
        ],
        comparisonTable: [
            { feature: "Itinerary Building", vyora: "Drag-and-drop digital builder", traditional: "Manual Word documents", manual: "Lengthy emails" },
            { feature: "Client Documents", vyora: "Secure encrypted cloud vault", traditional: "Unsecured email threads", manual: "Photocopies in folders" },
            { feature: "Payment Collections", vyora: "Automated installment links", traditional: "Chasing bank transfers", manual: "Cash/cheque collection" },
            { feature: "Margin Tracking", vyora: "Real-time per-dossier margins", traditional: "End-of-month spreadsheets", manual: "Guesstimations" }
        ],
        bulletFacts: [
            "Cut itinerary creation time by 80% with reusable templates and rich image libraries.",
            "Never miss a vendor payment deadline with automated accounts payable alerts.",
            "Instantly calculate complex multi-currency tour margins accurately.",
            "Deliver a premium customer experience with a secure digital client portal.",
            "Protect sensitive client data like passports with enterprise-grade encryption."
        ],
        faqs: [
            { q: "Can we create custom, branded itineraries for out-bound tours?", a: "Yes, the Itinerary Builder allows you to easily pull in High-Res photos, destination descriptions, and day-by-day mapping. You can export these as beautiful, branded PDFs or send a live, mobile-friendly web link." },
            { q: "How does the system handle multi-currency payments to international hotels?", a: "The system supports multi-currency accounting natively. You can quote a client in INR, pay the hotel in USD, and pay the local transport in AED, and the system instantly calculates your exact net profit margin factoring in live exchange rates." },
            { q: "Can we track visa application statuses for groups?", a: "Absolutely. The Visa Tracker module allows you to bulk-update statuses for group tours, track missing documents, and automatically trigger SMS updates to travelers as their passports move through the embassy process." },
            { q: "Does it help collect split payments or installments from travelers?", a: "Yes, you can set up installment plans for expensive tours. Vyora will automatically send payment links via email and WhatsApp on specific dates (e.g., '25% Advance', '50% Before Departure')." },
            { q: "Can B2B travel agents use this to manage their sub-agent network?", a: "Yes, our B2B portal allows main agencies to give specific logins to sub-agents. These agents can check live inventory, block seats, and use a digital wallet system, all while the system automatically tracks and calculates their commissions." },
            { q: "How secure is the client document vault?", a: "Extremely secure. We use enterprise-level encryption to store sensitive documents like passport scans, Aadhaar cards, and visas, ensuring you comply with privacy standards protecting client data." },
            { q: "Can we track flight PNRs and issue tickets from the system?", a: "While we don't directly issue tickets like an Amadeus GDS, you can seamlessly import PNRs and booking confirmations into the specific client dossier to keep all trip information centralized and accessible." },
            { q: "Does the CRM store traveler preferences like meal or seat choices?", a: "Yes, the comprehensive Client CRM tracks dietary restrictions, preferred seat types, frequent flyer numbers, and even anniversaries, helping your agents provide white-glove, personalized service every time." },
            { q: "How do we handle refunds for cancelled tours?", a: "The cancellation module manages the complex workflow of reversing client invoices, managing cancellation fees, tracking vendor refunds, and issuing credit notes smoothly." },
            { q: "Can customers view their trip details on their phone?", a: "When you send a digital itinerary link, it opens a mobile-optimized view. The customer can see their flight times, hotel addresses, and daily activities securely right from their smartphone browser." }
        ],
        testimonials: [
            { name: "Priya Nair", role: "Founder, Wanderlust Holidays", location: "Kochi, IN", initial: "P", content: "Building custom itineraries used to take us days. With Vyora's drag-and-drop builder and template library, we send stunning, interactive quotes in 15 minutes. Conversions are up 40%.", rating: 5, metric: "40% Higher Conversion" },
            { name: "Rajat Khanna", role: "Director, Global Travels B2B", location: "Delhi, IN", initial: "R", content: "Managing our network of 200 sub-agents was a spreadsheet nightmare. The B2B portal and automated commission tracking eliminated errors and disputes entirely.", rating: 5, metric: "Zero Commission Errors" },
            { name: "Ananya Desai", role: "Ops Manager, Luxe Escapes", location: "Mumbai, IN", initial: "A", content: "Tracking margins on multi-country European tours with three different currencies was so hard. Vyora calculates our live profit margin accurately on every single file instantly.", rating: 5, metric: "Instant Margin Clarity" },
            { name: "Karthik Verma", role: "Owner, Visa Experts & Tours", location: "Hyderabad, IN", initial: "K", content: "The Visa Tracker has saved our support lines. Instead of customers calling 10 times a day, the software auto-texts them when documents are received, submitted, and approved.", rating: 5, metric: "80% Less Support Calls" },
            { name: "Sunil Shetty", role: "Partner, Corporate Travels", location: "Bengaluru, IN", initial: "S", content: "Storing passports securely on local hard drives was a risk. Vyora's secure cloud document vault gives us peace of mind and allows our agents to access them anywhere securely.", rating: 5, metric: "Enterprise Security" },
            { name: "Meena Gupta", role: "Finance Head, Explore India", location: "Jaipur, IN", initial: "M", content: "The automated payment collection links have revolutionized our cash flow. We set the installment dates, and the software aggressively chases the client for money, not us.", rating: 5, metric: "Improved Cash Flow" },
            { name: "Vikram Bose", role: "Manager, Himalayan Treks", location: "Kolkata, IN", initial: "V", content: "We manage huge groups. Being able to bulk-upload passenger manifests and instantly generate rooming lists for hotels saves us hours of data entry every week.", rating: 5, metric: "Hours of Data Entry Saved" },
            { name: "Preeti Mahajan", role: "CEO, Destination Weddings", location: "Goa, IN", initial: "P", content: "Managing vendors for events involves tracking dozens of small payments. The Accounts Payable dashboard ensures we never accidentally miss paying a decorator or caterer.", rating: 5, metric: "Flawless Vendor Payment" },
            { name: "Arif Khan", role: "Owner, Mecca Tours", location: "Lucknow, IN", initial: "A", content: "Tracking the complex lifecycle of Hajj and Umrah bookings – from initial deposit to passport collection and ticketing – is handled beautifully by custom stages in Vyora.", rating: 5, metric: "Perfect Lifecycle Tracking" },
            { name: "Sneha Reddy", role: "Sales Lead, Exotic Getaways", location: "Chennai, IN", initial: "S", content: "The CRM remembers that Mr. Sharma prefers aisle seats and vegetarian meals. When he calls to book, we already know. The personalized service makes clients loyal for life.", rating: 5, metric: "Incredible Client Loyalty" }
        ],
        stats: [
            { value: "80%", label: "Faster Itinerary Building" },
            { value: "0", label: "Missed Vendor Payments" },
            { value: "40%", label: "Boost in Tour Conversions" },
            { value: "100%", label: "Clear Multi-currency Margins" }
        ],
        metaTitle: "Travel Agency Booking & Itinerary Software",
        metaDescription: "Elevate your travel agency with Vyora. Create stunning digital itineraries, manage multi-currency vendor payments, and track commissions globally.",
        accentColor: {
            from: "from-sky-600",
            to: "to-blue-800",
            text: "text-sky-700",
            bg: "bg-sky-50",
            border: "border-sky-200",
            highlight: "bg-sky-100"
        },
        relatedCategories: ["professional-services", "events", "transport"]
    },
    {
        slug: "fitness-wellness",
        name: "Fitness & Wellness",
        icon: Activity,
        image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80",
        subtitle: "Power up your gym, studio, or wellness center.",
        description: "Comprehensive software to manage memberships, schedule classes, process recurring billing, and engage your fitness community.",
        definitionBlock: "Vyora for Fitness & Wellness is a unified platform designed for gyms, yoga studios, spas, and personal trainers. It handles the heavy lifting of facility management—from auto-charging monthly memberships via credit cards to letting members book spin classes on their phones. It turns manual front-desk chaos into a streamlined, digital-first fitness business.",
        products: [
            {
                name: "Membership Management",
                description: "Easily set up standard, VIP, or punch-card plans and track active members.",
                subcategories: ["Tiered Plans", "Contract Management", "Access Control"]
            },
            {
                name: "Class Scheduling",
                description: "Offer a digital class calendar where members can book and manage spots.",
                subcategories: ["Waitlist Management", "Instructor Rosters", "Capacity Limits"]
            },
            {
                name: "Point of Sale (POS)",
                description: "Sell merchandise, protein shakes, and drop-in passes at the front desk.",
                subcategories: ["Inventory Tracking", "Quick Checkout", "Tab Management"]
            }
        ],
        services: [
            {
                name: "Recurring Billing",
                description: "Automate monthly membership fees, eliminating chasing physical payments.",
                subcategories: ["Auto-debit NACH/Cards", "Failed Payment Alerts", "Prorated Billing"]
            },
            {
                name: "Member Engagement Apps",
                description: "Send push notifications for gym challenges, closing times, or promotions.",
                subcategories: ["Automated SMS", "Workout Reminders", "Birthday Offers"]
            },
            {
                name: "Trainer Management",
                description: "Track personal trainer working hours, booked PT sessions, and commissions.",
                subcategories: ["PT Scheduling", "Commission Splits", "Performance Metrics"]
            }
        ],
        comparisonTable: [
            { feature: "Class Bookings", vyora: "Self-serve mobile app", traditional: "Calling the front desk", manual: "Paper sign-up sheets" },
            { feature: "Monthly Billing", vyora: "Automated auto-debit", traditional: "Swiping cards manually", manual: "Collecting cash/cheques" },
            { feature: "Access Control", vyora: "App-based or RFID integration", traditional: "Manual visual check", manual: "Honesty system" },
            { feature: "Membership Renewal", vyora: "Automated SMS/Email reminders", traditional: "Calling expired members", manual: "Waiting for them to return" }
        ],
        bulletFacts: [
            "Reduce delinquent payments by 90% with automated retry logic on failed credit cards.",
            "Eliminate empty class slots perfectly managing waitlists and late cancellations.",
            "Increase Personal Training sales by marketing directly to members via the app.",
            "Save front-desk staff 20 hours a week by moving sign-ups and waivers completely online.",
            "Foster community with automated birthday messages and workout milestone congratulation texts."
        ],
        faqs: [
            { q: "Can members book classes like Zumba or Yoga from their phones?", a: "Yes, members get access to a mobile-friendly portal where they can view the weekly schedule, see which instructor is teaching, and book their spot instantly. If a class is full, they can join a digital waitlist." },
            { q: "How does the automated recurring billing work?", a: "You set up the membership tier (e.g., ₹2000/month). The system securely stores their payment method. On their billing date, it automatically charges them. If a card declines, it automatically emails them a link to update their payment details." },
            { q: "Can we sell supplements and branded t-shirts along with memberships?", a: "Absolutely. The robust built-in Point of Sale (POS) system allows your front desk to sell physical inventory like protein bars, water, and apparel, tracking stock levels alongside membership revenue." },
            { q: "Does the software support digital liability waivers?", a: "Yes. When a new member signs up online or via a tablet at the front desk, they must digitally sign your customized liability waiver and terms of service before their membership activates. No more filing paper waivers." },
            { q: "Can we manage commissions for our Personal Trainers?", a: "Yes, the Trainer Management module allows you to track specific PT sessions. You can set commission splits (e.g., the trainer gets 60% of the session fee), and the system automatically calculates their payout at the end of the month." },
            { q: "What happens if a member wants to 'freeze' or pause their membership?", a: "You can easily place a membership on hold for medical or travel reasons. You set the un-freeze date, and the system temporarily stops billing and access, automatically resuming both on the specified date." },
            { q: "Can the system integrate with turnstiles or door access systems?", a: "Vyora can integrate with standard RFID/Barcode door access systems. If a member's account is past due or expired, the system will automatically communicate with the door controller to deny entry." },
            { q: "How does it handle punch-cards or class-pass models instead of monthly?", a: "You can sell 'Credit Packs' (e.g., 10 Yoga Sessions). Every time the member books a class and attends, the system automatically deducts one credit from their balance." },
            { q: "Can we track member attendance and usage trends?", a: "Yes, powerful analytics show you peak gym hours, most popular classes, and most requested instructors. This data helps you optimize your schedule and staffing costs." },
            { q: "Is it possible to flag 'at-risk' members who haven't visited recently?", a: "The retention dashboard highlights members who haven't checked in over the last 14 or 30 days, allowing you to trigger automated 'We Miss You' emails or phone calls to prevent cancellations." }
        ],
        testimonials: [
            { name: "Vikram Rathore", role: "Owner, Iron Core Fitness", location: "Delhi, IN", initial: "V", content: "Automating our recurring billing saved our business. We used to lose huge amounts to declined cards and forgotten cash payments. Now, cash flow is guaranteed and automatic on the 1st of every month.", rating: 5, metric: "Zero Revenue Leakage" },
            { name: "Aditi Rao", role: "Founder, Lotus Yoga Studio", location: "Mumbai, IN", initial: "A", content: "The waitlist management feature is brilliant. If someone cancels an evening class, the next person in line is automatically notified and booked. We operate at 100% capacity constantly.", rating: 5, metric: "100% Class Capacity" },
            { name: "Rishi Kapoor", role: "Manager, CrossFit Xtreme", location: "Pune, IN", initial: "R", content: "Selling merchandise and drop-ins used to require a separate clunky POS. Having retail and memberships combined in Vyora makes front-desk operations seamless for our staff.", rating: 5, metric: "Seamless Front Desk Operations" },
            { name: "Pooja Mehta", role: "Manager, Glow Spa & Wellness", location: "Bengaluru, IN", initial: "P", content: "Digital waivers have decluttered our reception area completely. New clients sign on an iPad, and the signed PDF is firmly attached to their digital profile forever.", rating: 5, metric: "100% Paperless Onboarding" },
            { name: "Karan Singh", role: "Head Trainer, Apex Athletics", location: "Chandigarh, IN", initial: "K", content: "Tracking PT sessions manually was a nightmare for trainer payouts. Vyora tracks every completed session exactly, and the commission reports take me 2 minutes to generate.", rating: 5, metric: "2-Minute Commission Runs" },
            { name: "Neha Sharma", role: "Owner, Rhythm Dance Studio", location: "Ahmedabad, IN", initial: "N", content: "The ability to easily freeze memberships during exams or summer vacations keeps our young members happy without us having to do complicated manual math on their accounts.", rating: 5, metric: "Effortless Account Freezes" },
            { name: "Arjun Nair", role: "Director, City Gym", location: "Kochi, IN", initial: "A", content: "Integrating Vyora with our front door turnstile ensures nobody slips in with an unpaid account. It enforces our billing policy without our staff having to be the bad guys.", rating: 5, metric: "Automated Access Control" },
            { name: "Sneha Patel", role: "Marketing Lead, FitZone", location: "Hyderabad, IN", initial: "S", content: "The automated 'We Miss You' SMS campaigns target members who haven't scanned in for two weeks. It has single-handedly improved our annual retention rate significantly.", rating: 5, metric: "Improved Member Retention" },
            { name: "Rajiv Menon", role: "Owner, Elite Pilates", location: "Chennai, IN", initial: "R", content: "Being able to run detailed reports on which class times are profitable and which are dead has helped us renegotiate instructor hours and save heavily on payroll.", rating: 5, metric: "Optimized Payroll Costs" },
            { name: "Kavita Reddy", role: "Manager, Aqua Fitness", location: "Jaipur, IN", initial: "K", content: "We transitioned from paper punch cards to digital credit packs on Vyora. Customers love checking their remaining balance on their phones, and we love the instant revenue.", rating: 5, metric: "Instant Credit Sales" }
        ],
        stats: [
            { value: "90%", label: "Drop in Delinquent Payments" },
            { value: "20 Hrs", label: "Front Desk Time Saved/Week" },
            { value: "100%", label: "Waitlist Automation" },
            { value: "0", label: "Paper Waivers Needed" }
        ],
        metaTitle: "Gym Management Software & Studio Billing",
        metaDescription: "Streamline your fitness business with Vyora. Automated membership billing, seamless class scheduling, digital waivers, and robust point of sale.",
        accentColor: {
            from: "from-orange-500",
            to: "to-red-600",
            text: "text-orange-600",
            bg: "bg-orange-50",
            border: "border-orange-200",
            highlight: "bg-orange-100"
        },
        relatedCategories: ["healthcare", "education", "retail"]
    },
    {
        slug: "events-entertainment",
        name: "Events & Entertainment",
        icon: Ticket,
        image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80",
        subtitle: "Organize flawless events and manage operations.",
        description: "The premier toolkit for event planners, banquet halls, and entertainers to handle ticketing, vendor contracts, and run-of-show logistics.",
        definitionBlock: "Vyora for Events & Entertainment brings order to the chaotic world of event management. Whether you manage a large-scale wedding venue, organize corporate tech conferences, or run an entertainment agency, this platform tracks event P&L, coordinates vendor schedules, manages guest lists, and ensures the catering numbers are exact. Execute flawless experiences.",
        products: [
            {
                name: "Event CRM",
                description: "Track leads, manage client proposals, and store event contracts securely.",
                subcategories: ["Lead Pipeline", "Digital Signatures", "Quoting Engine"]
            },
            {
                name: "Ticketing & Registration",
                description: "Sell tickets online, manage capacities, and track VIP access lists.",
                subcategories: ["QR Code Tickets", "Tiered Pricing", "Group Discounts"]
            },
            {
                name: "Venue Management",
                description: "Manage multiple halls, avoid double bookings, and schedule staff.",
                subcategories: ["Visual Calendar", "Resource Blocking", "Maintenance Tracking"]
            }
        ],
        services: [
            {
                name: "Vendor & Operations",
                description: "Organize external decorators, caterers, and AV teams with shared access.",
                subcategories: ["Run-of-Show Timelines", "Vendor Contracts", "Task Assignment"]
            },
            {
                name: "Budgeting & P&L",
                description: "Track every cent spent on an event versus revenue to ensure profitability.",
                subcategories: ["Real-time P&L", "Expense Tracking", "Invoice Management"]
            },
            {
                name: "Event Marketing",
                description: "Create landing pages and send mass email campaigns to drive attendance.",
                subcategories: ["Email Blasts", "Landing Pages", "Social Integrations"]
            }
        ],
        comparisonTable: [
            { feature: "Venue Booking", vyora: "Intelligent conflict-free calendar", traditional: "Whiteboard/Excel", manual: "Paper ledger" },
            { feature: "Guest Entry", vyora: "QR Code scanner app", traditional: "Printing out lists", manual: "Checking names manually" },
            { feature: "Run-of-Show Tracker", vyora: "Real-time digital timelines", traditional: "Printed clipboards", manual: "Memory and radios" },
            { feature: "Event Budgeting", vyora: "Automated live P&L dashboard", traditional: "Reconciling after the event", manual: "Guessing margins" }
        ],
        bulletFacts: [
            "Eliminate venue double-bookings with a centralized, intelligent visual calendar.",
            "Cut check-in queues by 70% using the high-speed Vyora QR Code check-in scanner.",
            "Know your exact profit margin instantly instead of waiting weeks for final vendor bills.",
            "Win more business with beautiful, digital interactive event proposals that clients can sign via mobile.",
            "Ensure flawless execution by giving all vendors access to a live digital run-of-show timeline."
        ],
        faqs: [
            { q: "How does the software prevent us from double-booking a banquet hall?", a: "Vyora uses a centralized, intelligent calendar. If a sales rep tries to book the 'Grand Ballroom' on Friday night, and it's already tentatively held or booked, the system actively blocks the action, ensuring double-bookings are impossible." },
            { q: "Can we sell tickets directly from the software?", a: "Yes, you can create a custom event landing page, set up tiered ticketing (Early Bird, VIP, General), process payments securely, and the system automatically generates and emails QR code tickets to attendees." },
            { q: "How do we manage check-in on the day of the event?", a: "Your staff can use smartphones or tablets running the Vyora scanner app to quickly scan attendees' QR codes. It works offline, syncs instantly, and provides real-time data on how many people are inside." },
            { q: "Can we track the detailed budget and multi-vendor expenses?", a: "The powerful budgeting module tracks projected costs against actual vendor invoices. You can monitor the exact profitability (P&L) of an event in real-time as expenses like decor, AV, and catering are added." },
            { q: "Does the system help with client proposals for corporate events?", a: "Yes. You can use templates to quickly build high-end aesthetic proposals detailing the menu, floor plan, and costs. Clients view it online and can 'Accept & Sign' digitally, moving the event to 'Confirmed' status." },
            { q: "How do we coordinate with third-party vendors like decorators or bands?", a: "You can create a detailed 'Run-of-Show' timeline. You can give vendors secure, restricted access to view the timeline, ensuring the DJ knows exactly when the CEO's keynote ends without needing paper schedules." },
            { q: "Can we manage multiple venues across different city locations?", a: "Absolutely. The enterprise edition supports multi-location businesses. You can toggle between different properties, track revenue per location, and manage staff schedules across your entire portfolio from a single dashboard." },
            { q: "How does it handle complex catering and dietary requirements?", a: "When guests register, you can capture custom fields (e.g., 'Vegan', 'Gluten-Free'). Vyora instantly aggregates this data into a unified report for your catering team, ensuring exact headcounts for specific meals." },
            { q: "Is there a way to collect post-event feedback from attendees?", a: "Yes, the system can automatically send an SMS or email survey to the attendee list the morning after the event, gathering Net Promoter Scores (NPS) and reviews." },
            { q: "Can we process partial payments or security deposits for weddings?", a: "Vyora's invoicing allows you to set up structured payment schedules. You can invoice a 20% securing deposit, a 50% mid-way payment, and a final balance due three days prior, tracking each successfully collected step." }
        ],
        testimonials: [
            { name: "Sneha Kapoor", role: "Owner, Grand Royale Banquets", location: "Delhi, IN", initial: "S", content: "Before Vyora, double-booking a venue was our biggest fear. The centralized calendar brings total peace of mind. We process 30 weddings a month smoothly and completely digitally.", rating: 5, metric: "Zero Double Bookings" },
            { name: "Rahul Verma", role: "Director, Xtreme Concerts", location: "Mumbai, IN", initial: "R", content: "The QR check-in app is blazing fast. We checked in 4,000 concert attendees in under two hours using just smartphones. The queues vanished completely.", rating: 5, metric: "Incredible Check-in Speed" },
            { name: "Priya Menon", role: "CEO, Elite Corporate Events", location: "Bengaluru, IN", initial: "P", content: "Tracking real-time P&L changes everything. Before, we waited weeks to know if a tech conference was profitable. Now, I watch the margin adjust live as AV bills come in.", rating: 5, metric: "Real-time P&L Clarity" },
            { name: "Amit Patel", role: "Partner, Stellar Weddings", location: "Ahmedabad, IN", initial: "A", content: "Sending interactive digital proposals that clients can sign on their phones has increased our closing rate by 30%. It looks incredibly professional and MNC-standard.", rating: 5, metric: "30% Increase in Closings" },
            { name: "Kiran Rao", role: "Ops Manager, The Social Hub", location: "Pune, IN", initial: "K", content: "Giving our caterers and decorators access to the live digital timeline ensured everyone was synced. We ran a complex 3-day corporate offsite flawlessly with zero radios.", rating: 5, metric: "Flawless Synchronization" },
            { name: "Neha Singh", role: "Manager, City Club Venues", location: "Chandigarh, IN", initial: "N", content: "Managing four different properties on physical ledgers was chaos. Accessing my entire venue portfolio from a single cloud dashboard gives me control from anywhere in the world.", rating: 5, metric: "Total Portfolio Control" },
            { name: "Vikram Desai", role: "Ticketing Head, TechSparks India", location: "Hyderabad, IN", initial: "V", content: "The customizable registration forms captured dietary needs effortlessly. Our caterer got exact numbers for Vegan vs Gluten-Free meals, saving us massive food wastage costs.", rating: 5, metric: "Dramatically Reduced Wastage" },
            { name: "Sonal Gupta", role: "Founder, Kids Carnivals", location: "Kochi, IN", initial: "S", content: "The automated payment collection handles deposits beautifully. The software automatically chases parents for the balance payment for birthday parties so I don't have to.", rating: 5, metric: "Automated Balance Collection" },
            { name: "Rajiv Chauhan", role: "Event Lead, Marathon Organizers", location: "Jaipur, IN", initial: "R", content: "Using the built-in email blaster to launch 'Early Bird' tickets resulted in an immediate surge in revenue. The marketing tools are deeply integrated and highly effective.", rating: 5, metric: "Surging Advance Sales" },
            { name: "Arjun Iyer", role: "MD, Cultural Fests", location: "Chennai, IN", initial: "A", content: "The automated post-event feedback surveys give us incredible data to attract sponsors for the next year. It proves our audience satisfaction with hard numbers instantly.", rating: 5, metric: "Actionable Post-Event Data" }
        ],
        stats: [
            { value: "0", label: "Venue Double Bookings" },
            { value: "70%", label: "Faster Attendee Check-in" },
            { value: "30%", label: "Higher Proposal Close Rate" },
            { value: "100%", label: "Real-Time Event Margins" }
        ],
        metaTitle: "Event Management Software & Venue Booking System",
        metaDescription: "Master event logistics with Vyora. Avoid double bookings, execute blazing fast QR check-ins, manage multi-vendor timelines, and track live P&L.",
        accentColor: {
            from: "from-fuchsia-600",
            to: "to-purple-800",
            text: "text-fuchsia-700",
            bg: "bg-fuchsia-50",
            border: "border-fuchsia-200",
            highlight: "bg-fuchsia-100"
        },
        relatedCategories: ["hospitality", "professional-services"]
    },
    {
        slug: "it-software-agencies",
        name: "IT & Software Agencies",
        icon: Terminal,
        image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80",
        subtitle: "Manage dev teams, sprints, and client retainers.",
        description: "Built for tech agencies and dev shops to seamlessly handle agile project management, precise time tracking, and complex billing.",
        definitionBlock: "Vyora provides the connective tissue between code and cash flow for IT agencies. It unites developer time tracking, agile kanban project boards, and client invoicing into one platform. Stop wondering if a project is profitable—Vyora correlates GitHub commits and tracked hours directly against client retainers and project fixed-bids.",
        products: [
            {
                name: "Agile Project Management",
                description: "Organize work into epics, sprints, and tickets with full kanban boards.",
                subcategories: ["Kanban & Scrum", "Issue Tracking", "Milestone Mapping"]
            },
            {
                name: "Time Tracking & Timesheets",
                description: "Log hours accurately against specific tasks for precise billing.",
                subcategories: ["Timer Apps", "Approval Workflows", "Billable Tracking"]
            },
            {
                name: "Retainer & Contract Billing",
                description: "Manage complex recurring contracts and fixed-bid milestones effortlessly.",
                subcategories: ["Retainer Balances", "Recurring Invoices", "Milestone Billing"]
            }
        ],
        services: [
            {
                name: "Client Portal",
                description: "Give stakeholders visibility into sprint progress, hours utilized, and invoices.",
                subcategories: ["Progress Dashboards", "Ticket Approval", "Secure Document Sharing"]
            },
            {
                name: "Resource Scheduling",
                description: "Allocate developer hours optimally to avoid burnout and under-utilization.",
                subcategories: ["Capacity Planning", "Leave Management", "Skill Matching"]
            },
            {
                name: "Agency Analytics",
                description: "Deep insights into team utilization rates, project margins, and profitability.",
                subcategories: ["Margin Reports", "Utilization Heatmaps", "Cost-to-Complete"]
            }
        ],
        comparisonTable: [
            { feature: "Project Profitability", vyora: "Live Cost vs. Budget tracking", traditional: "End of month manual audit", manual: "Guesswork" },
            { feature: "Time Logging", vyora: "1-click timer linked to tasks", traditional: "End-of-week spreadsheets", manual: "Memory" },
            { feature: "Client Updates", vyora: "Automated real-time client portal", traditional: "Weekly status meetings", manual: "Lengthy ad-hoc emails" },
            { feature: "Retainer Tracking", vyora: "Automatic drawdown of hours/budget", traditional: "Manual tracking in Excel", manual: "Calculating manually on request" }
        ],
        bulletFacts: [
            "Stop revenue leakage by accurately logging every billable minute using native task-integrated timers.",
            "Protect profit margins with live warnings when a fixed-price project approaches its estimated budget.",
            "Eliminate billing disputes by providing clients a transparent portal showing exactly where hours were spent.",
            "Manage resource allocation effectively ensuring senior devs are utilized on high-margin tasks.",
            "Automate recurring retainer invoices to ensure cash flow remains steady and predictable."
        ],
        faqs: [
            { q: "How does the software handle tracking against fixed-bid projects?", a: "When you set up a fixed-bid project, you assign an estimated cost based on developer hourly rates. As they log time, the system shows a live 'burn rate'. You instantly get alerts if the project is in danger of becoming unprofitable.", },
            { q: "Can we manage monthly retainer contracts with specific hour caps?", a: "Yes. The retainer module handles this perfectly. If a client pays for 40 hours/month, logged hours automatically draw down from that balance. It highlights overages, allowing you to easily bill for the excess time." },
            { q: "Does the project management tool support Agile and Kanban workflows?", a: "Absolutely. You can build comprehensive Kanban boards, manage product backlogs, plan sprints, and assign story points to tickets to keep your technical team iterating efficiently." },
            { q: "How easy is it for developers to log their time?", a: "Incredibly easy. Developers can start timers directly from the Jira-style tickets they are working on, use a desktop widget, or fill in a rapid weekly timesheet view, ensuring minimal friction in tracking billable time." },
            { q: "Can we generate invoices based exactly on logged timesheets?", a: "Yes, this is where Vyora shines. At the end of the month, the invoicing engine aggregates all approved, unbilled time logged to a client, and generates a detailed, line-item invoice in one click." },
            { q: "What visibility does the external client portal provide?", a: "You have granular control. You can allow clients to log in and see high-level project milestones, view burn-down charts, approve or reject specific tickets, and pay invoices directly via integrated payment gateways." },
            { q: "How does Resource Scheduling help with agency capacity?", a: "The capacity planner gives you a heat map of your team. You can easily spot if your lead backend dev is over-allocated next week while a frontend dev has spare hours, allowing you to load-balance your agency effectively." },
            { q: "Can we track internal non-billable time, like R&D or training?", a: "Yes. You can track all time to understand total team utilization. Robust reporting separates billable utilization from non-billable administration, helping you optimize agency efficiency." },
            { q: "Does the system support different billing rates for different roles?", a: "Yes. You can set up a rate card where a Senior Architect bills at ₹5000/hr, but a QA Tester bills at ₹1500/hr, ensuring invoices and profit calculations are completely accurate." },
            { q: "How secure is the platform for an IT agency's data?", a: "Security is our priority. With Role-Based Access Control (RBAC), multi-factor authentication, and enterprise-grade encryption, your agency and client data are rigorously protected." }
        ],
        testimonials: [
            { name: "Rahul Saini", role: "CEO, NexTech Solutions", location: "Pune, IN", initial: "R", content: "Vyora finally connected our devs' work to our bank account. Generating invoices from timesheets used to take our finance team 3 days. Now, it takes 3 clicks. Absolute game changer.", rating: 5, metric: "Invoicing Reduced to Minutes" },
            { name: "Aditi Sharma", role: "Project Manager, CodeCraft Agency", location: "Bengaluru, IN", initial: "A", content: "The live budget burn-down on fixed-price projects saved us so much money. We get alerts the moment a project hits 80% budget, allowing us to pivot before losing our margin.", rating: 5, metric: "Eliminated Profit Erosion" },
            { name: "Vikram Kapoor", role: "Founder, CloudSys Implementations", location: "Hyderabad, IN", initial: "V", content: "Tracking our monthly SEO and maintenance retainers was an absolute mess in Excel. The retainer module draws down hours automatically and flags overages for billing seamlessly.", rating: 5, metric: "Flawless Retainer Tracking" },
            { name: "Neha Verma", role: "Ops Lead, Digital Frontier", location: "Delhi, IN", initial: "N", content: "Our resource utilization was blind. Vyora's capacity planner visually maps who is busy and who is idle, allowing us to take on new projects confidently without burning out the team.", rating: 5, metric: "Exceptional Capacity Planning" },
            { name: "Siddharth Rao", role: "Owner, WebMinds Studio", location: "Mumbai, IN", initial: "S", content: "The external client portal reduced our 'status update' emails to zero. Clients log in, see exactly what tickets we closed this week, and happily pay the invoices from the same dashboard.", rating: 5, metric: "Zero 'Status Update' Emails" },
            { name: "Pooja Desai", role: "Finance Head, AppWorx", location: "Ahmedabad, IN", initial: "P", content: "Having different rate cards for different seniorities applied automatically to timesheets means we never underbill a client for architect-level consultancy ever again.", rating: 5, metric: "100% Billable Accuracy" },
            { name: "Rajiv Khan", role: "Scrum Master, AgileTech", location: "Chennai, IN", initial: "R", content: "The Kanban boards are fast and intuitive. My team actually prefers logging their time directly on the cards compared to our old, clunky enterprise software. Less friction means better data.", rating: 5, metric: "Higher Team Adoption" },
            { name: "Kiran Singh", role: "Director, Enterprise Integrations", location: "Chandigarh, IN", initial: "K", content: "We track internal R&D alongside client work. The 'Utilization Heatmap' gives me a CEO-level view of confirming we maintain our target 75% billable ratio agency-wide.", rating: 5, metric: "Crystal Clear Utilization Data" },
            { name: "Amit Yadav", role: "Partner, CyberSec Consultants", location: "Kochi, IN", initial: "A", content: "Security was vital for us. The role-based access control ensures our freelance contractors only see the specific project they are assigned to, keeping client architectures confidential.", rating: 5, metric: "Enterprise Security Confidence" },
            { name: "Sneha Nair", role: "Delivery Manager, DevHouse", location: "Jaipur, IN", initial: "S", content: "The milestone billing feature automates our payment collections. When we drag the 'UAT Approved' ticket to done, it automatically triggers the 30% milestone invoice to the client.", rating: 5, metric: "Automated Milestone Billing" }
        ],
        stats: [
            { value: "100%", label: "Live Fixed-Bid Tracking" },
            { value: "3 Days", label: "Saved Monthly on Invoicing" },
            { value: "0", label: "Lost Billable Hours" },
            { value: "25%", label: "Improvement in Utilization" }
        ],
        metaTitle: "Agency ERP | IT & Software Project Management",
        metaDescription: "The ultimate platform for IT agencies. Manage agile projects, log timesheets, track complex retainers, and monitor live fixed-bid margins.",
        accentColor: {
            from: "from-indigo-600",
            to: "to-blue-900",
            text: "text-indigo-700",
            bg: "bg-indigo-50",
            border: "border-indigo-200",
            highlight: "bg-indigo-100"
        },
        relatedCategories: ["professional-services", "b2b"]
    },
    {
        slug: "legal-services",
        name: "Legal Services",
        icon: Scale,
        image: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800&q=80",
        subtitle: "Enterprise-grade practice management for law firms.",
        description: "A secure, robust platform unifying case management, strict trust accounting, unshakeable document storage, and precise billable hour tracking.",
        definitionBlock: "Vyora for Legal Services modernizes law firms. We replace disparate systems and disjointed emails with a unified Practice Management platform. From secure document vaults and conflict-of-interest checks during intake to complex milestone billing and trust account compliance, Vyora handles the business of law so you can focus on practicing it.",
        products: [
            {
                name: "Case & Matter Management",
                description: "Centralize all case details, court dates, notes, and emails in one secure environment.",
                subcategories: ["Matter Dashboards", "Conflict Checking", "Court Calendaring"]
            },
            {
                name: "Time & Billing",
                description: "Capture the six-minute billable increment accurately and generate LEDES-compliant invoices.",
                subcategories: ["Stopwatch Timers", "Expense Logging", "Batch Invoicing"]
            },
            {
                name: "Document Management",
                description: "Store legal documents securely with version control and integrated e-signatures.",
                subcategories: ["Secure Vault", "Version Control", "Digital Signatures"]
            }
        ],
        services: [
            {
                name: "Trust & Escrow Accounting",
                description: "Maintain rigid compliance managing retainer balances and trust funds securely.",
                subcategories: ["Ledger Management", "Compliance Reporting", "Retainer Burn"]
            },
            {
                name: "Client Scheduling & Intake",
                description: "Streamline new client intakes with customizable digital questionnaires and forms.",
                subcategories: ["CRM Pipelines", "Digital Intake Forms", "Consultation Booking"]
            },
            {
                name: "Client Portal",
                description: "Provide clients a secure, encrypted portal to share sensitive documents and view bills.",
                subcategories: ["Encrypted Messaging", "Invoice Payments", "Status Updates"]
            }
        ],
        comparisonTable: [
            { feature: "Document Sharing", vyora: "Encrypted secure client portal", traditional: "Unsecured emails", manual: "Mailing hard copies" },
            { feature: "Time Tracking", vyora: "One-click integrated stopwatches", traditional: "Scribbling on legal pads", manual: "Guessing at end of month" },
            { feature: "Trust Accounting", vyora: "Automated, compliant ledgers", traditional: "Complex Excel maneuvering", manual: "Paper ledgers" },
            { feature: "Case Organization", vyora: "Centralized digital dossiers", traditional: "Scattered server folders", manual: "Huge physical filing cabinets" }
        ],
        bulletFacts: [
            "Increase billable hours by 20% simply by capturing emails and calls with native one-click timers.",
            "Eliminate compliance stress with built-in, rigidly structured trust and escrow accounting.",
            "Protect sensitive client confidentiality using enterprise-grade encryption and secure portals.",
            "Save administrative time by generating high-quality legal invoices for hundreds of matters in one click.",
            "Never miss a critical court date with intelligent calendaring and automated deadline reminders."
        ],
        faqs: [
            { q: "Does the system maintain compliance for Trust and Escrow accounting?", a: "Yes. The trust accounting module rigidly separates operating funds from client trust funds. It maintains meticulous ledgers, prevents overdrawing trust balances, and provides reports necessary for regulatory compliance audits." },
            { q: "How easy is it for lawyers to track their billable hours?", a: "Extremely easy. We understand tracking is a pain point. Lawyers can use desktop widgets, mobile stopwatches, or add time directly while reading emails or drafting documents, capturing every billable minute effortlessly." },
            { q: "Can we run 'Conflict of Interest' checks easily on new cases?", a: "Absolutely. The robust global search function allows you to instantly search across all past and present matters, clients, and related parties to clear conflicts before conducting intake." },
            { q: "How secure is the platform for storing highly sensitive legal documents?", a: "Vyora uses bank-grade, AES-256 encryption. Our secure document vault ensures that sensitive contracts and case files are protected with role-based access control and comprehensive audit trails." },
            { q: "Can we share documents with clients securely instead of using email?", a: "Yes, the secure Client Portal replaces risky email attachments. You upload files, and clients authenticate securely to view and digitally sign documents or forms directly within the platform." },
            { q: "Does it support complex billing arrangements like Flat Fee or Contingency?", a: "Vyora handles all billing workflows. You can bill hourly with complex rate tiers, set up flat-fee milestones, or manage contingency-based cases where expenses are tracked but billing is delayed until settlement." },
            { q: "Can we create custom intake forms for different practice areas?", a: "Yes. You can build digital intake forms tailored to Family Law, Corporate Law, or Real Estate. New leads fill them out online, and the data automatically populates into their new case matter file seamlessly." },
            { q: "How does the calendaring system handle court deadlines?", a: "The Matter Calendar syncs with Office 365 or Google. It allows you to build deadline chains (e.g., 'Draft due 5 days before filing date') ensuring critical court or filing deadlines are never missed." },
            { q: "Can the system generate complex legal invoices quickly?", a: "Yes. The batch invoicing engine allows your billing department to review thousands of hours of WIP (Work in Progress), apply narrative edits, and generate hundreds of professional PDFs in minutes." },
            { q: "Does the software track reimbursable case expenses?", a: "Yes, any hard costs like court filing fees, expert witness charges, or courier fees can be logged directly to the specific matter, ensuring they appear for reimbursement on the client's next invoice." }
        ],
        testimonials: [
            { name: "Arvind Gupta", role: "Managing Partner, Gupta & Associates", location: "Delhi, IN", initial: "A", content: "Tracking billable hours used to be an administrative nightmare. Using the integrated stopwatches on every matter increased our firm's captured billable hours by 20% overnight.", rating: 5, metric: "20% More Billable Hours" },
            { name: "Priya Sharma", role: "Senior Counsel, Horizon Law", location: "Mumbai, IN", initial: "P", content: "Trust accounting is the most stressful part of managing a firm. Vyora's rigidly compliant ledgers mean we pass our state audits seamlessly. Unbelievable peace of mind.", rating: 5, metric: "Flawless Trust Compliance" },
            { name: "Vikram Desai", role: "Partner, Desai Corporate Legal", location: "Bengaluru, IN", initial: "V", content: "The global conflict of interest check takes seconds instead of hours of digging through old server files and ledgers. We can onboard new enterprise clients much faster.", rating: 5, metric: "Instant Conflict Checking" },
            { name: "Neha Patel", role: "Admin Lead, Family Court Experts", location: "Ahmedabad, IN", initial: "N", content: "The digital intake forms revolutionized our process. Clients fill out their history on a secure web link from home, and the case file is instantly populated. It saves us hours of data entry.", rating: 5, metric: "Hours Saved on Intake" },
            { name: "Rajesh Iyer", role: "Founder, Iyer Legal Suites", location: "Chennai, IN", initial: "R", content: "Emailing sensitive IP documents was always a risk. The encrypted Client Portal ensures complete confidentiality, and our tech-savvy clients love the secure, modern experience.", rating: 5, metric: "Bank-Grade Confidentiality" },
            { name: "Amit Verma", role: "Billing Manager, Apex Litigators", location: "Pune, IN", initial: "A", content: "Batch invoicing at the end of the month used to take a week of reviewing spreadsheets. Now, I edit narratives and generate 200 perfect, professional invoices in one morning.", rating: 5, metric: "Invoicing Time Slashed" },
            { name: "Sneha Menon", role: "Paralegal, Property Law Specialists", location: "Hyderabad, IN", initial: "S", content: "Intelligent calendaring ensures we never miss a property settlement deadline. The automated workflows map out every task leading up to completion date flawlessly.", rating: 5, metric: "Zero Missed Deadlines" },
            { name: "Rajiv Khan", role: "Partner, Criminal Defense", location: "Jaipur, IN", initial: "R", content: "Tracking court expenses and reimbursing couriers used to leak profit. The expense tracker ties every rupee to the matter, ensuring it hits the final invoice accurately.", rating: 5, metric: "100% Expense Recovery" },
            { name: "Pooja Reddy", role: "Associate, StartUp Legal", location: "Chandigarh, IN", initial: "P", content: "We manage a lot of fixed-fee startup packages. Tracking the hours we actually spend against those fixed fees helps our partners understand which packages are truly profitable.", rating: 5, metric: "Clear Profit Margins" },
            { name: "Karan Baxi", role: "Owner, Baxi Law", location: "Kochi, IN", initial: "K", content: "Having all emails, documents, and notes linked to the specific matter means any attorney can pick up the case instantly if someone is out of the office. True centralized organization.", rating: 5, metric: "Centralized Case Org" }
        ],
        stats: [
            { value: "20%", label: "Increase in Captured Billable Hours" },
            { value: "100%", label: "Compliant Trust Accounting" },
            { value: "0", label: "Confidentiality Breaches" },
            { value: "SECONDS", label: "To Run Global Conflict Checks" }
        ],
        metaTitle: "Legal Practice Management & Time Tracking Software",
        metaDescription: "Modern practice management for law firms. Secure document vaults, compliant trust accounting, effortless time tracking, and batch legal invoicing.",
        accentColor: {
            from: "from-slate-700",
            to: "to-black",
            text: "text-slate-800",
            bg: "bg-slate-100",
            border: "border-slate-300",
            highlight: "bg-slate-200"
        },
        relatedCategories: ["professional-services", "finance"]
    },
    {
        slug: "nonprofits-charities",
        name: "Nonprofits & Charities",
        icon: Heart,
        image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&q=80",
        subtitle: "Manage donors, campaigns, and volunteer efforts.",
        description: "A comprehensive platform to track donations automatically, organize fundraising events, and manage volunteer hours effectively.",
        definitionBlock: "Vyora for Nonprofits is an all-in-one management suite designed for NGOs and charitable organizations. It streamlines the complex process of donor management, grant tracking, and volunteer coordination, allowing organizations to focus on their mission rather than administrative overhead.",
        products: [
            {
                name: "Donor Management (CRM)",
                description: "Track every interaction, donation history, and relationship with your supporters.",
                subcategories: ["Donation History", "Wealth Screening", "Communication Logs"]
            },
            {
                name: "Campaign Fundraising",
                description: "Create beautiful, high-converting digital fundraising campaigns easily.",
                subcategories: ["Peer-to-Peer Pages", "Goal Tracking", "Donation Widgets"]
            },
            {
                name: "Volunteer Coordination",
                description: "Schedule volunteers, track their hours, and manage event staffing.",
                subcategories: ["Shift Scheduling", "Hours Logging", "Role Assignment"]
            }
        ],
        services: [
            {
                name: "Automated Receipting",
                description: "Instantly send tax-deductible receipts to donors upon successful payment.",
                subcategories: ["Tax Automation", "Custom Templates", "Annual Summaries"]
            },
            {
                name: "Grant Management",
                description: "Track grant applications, deadlines, and specific fund allocations.",
                subcategories: ["Fund Tracking", "Impact Reporting", "Deadline Alerts"]
            },
            {
                name: "Event Ticketing",
                description: "Manage galas and charity runs with built-in ticketing and seating charts.",
                subcategories: ["Table Management", "Sponsorship Tiers", "Silent Auctions"]
            }
        ],
        comparisonTable: [
            { feature: "Donation Tracking", vyora: "Automated digital CRM", traditional: "Siloed spreadsheets", manual: "Paper records" },
            { feature: "Tax Receipts", vyora: "Instant automated emails", traditional: "Mail merge at year-end", manual: "Handwriting receipts" },
            { feature: "Volunteer Scheduling", vyora: "Self-serve mobile portal", traditional: "Mass email chains", manual: "Calling volunteers" },
            { feature: "Campaign Pages", vyora: "Built-in drag-and-drop builder", traditional: "Hiring a web developer", manual: "Collecting cash/cheques" }
        ],
        bulletFacts: [
            "Increase recurring donations by automatically prompting one-time donors to subscribe.",
            "Save hundreds of hours in January with automated, consolidated annual tax receipt generation.",
            "Improve volunteer retention by providing a seamless, mobile-friendly shift booking experience.",
            "Easily demonstrate impact to grant-makers with robust fund allocation and outcome tracking.",
            "Run hybrid events combining in-person galas with virtual peer-to-peer fundraising pages."
        ],
        faqs: [
            { q: "Can we set up recurring monthly donations easily?", a: "Yes, the donation widget allows supporters to select 'Monthly' instead of 'One-Time'. Vyora securely handles the recurring billing and automatically sends a receipt each month." },
            { q: "How does the system handle tax-deductible receipts?", a: "Vyora automatically generates PDF receipts customized with your organization's legal details and branding, emailing them instantly after a donation, and storing a copy in the donor's CRM file." },
            { q: "Can volunteers sign up for specific shifts online?", a: "Absolutely. You can publish a calendar of volunteer needs (e.g., 'Soup Kitchen - Friday 5 PM'). Volunteers log in, view available slots, and book themselves, automatically updating your schedule." },
            { q: "Does the CRM track relationships between different donors?", a: "Yes, you can link records to show familial or corporate relationships (e.g., 'Spouse of', 'Employed by'), helping you understand your donor network's influence." },
            { q: "Can we create separate fundraising pages for different campaigns?", a: "Yes, you can build unlimited, customizable landing pages for specific appeals (e.g., 'Disaster Relief Fund' vs. 'Annual Gala'), each with its own progress bar and distinct donation tracking." },
            { q: "Is it possible for our supporters to fundraise on our behalf?", a: "Yes, our Peer-to-Peer module allows your passionate supporters to create their own personalized fundraising pages linked to your main campaign, tracking who raised the most." },
            { q: "How do we track restricted funds versus unrestricted funds?", a: "The accounting module allows you to tag donations. If a grant is specifically for 'Clean Water', the system ensures those funds are tracked separately from general operating donations." },
            { q: "Can we use this to manage our annual charity gala?", a: "Yes, the Event Ticketing module handles everything from selling VIP tables and managing sponsor logos to checking guests in at the door with a QR scanner app." },
            { q: "Does the system send automated 'Thank You' emails?", a: "Yes, beyond the tax receipt, you can configure automated, personalized onboarding email journeys to welcome new donors and share the impact of their gift." },
            { q: "Are our donors' credit card details secure?", a: "Vyora uses PCI-compliant, enterprise-grade payment gateways (like Stripe or Razorpay integrations). We never store raw credit card numbers on our servers, ensuring maximum security." }
        ],
        testimonials: [
            { name: "Anita Sharma", role: "Director, Give India Hope", location: "Delhi, IN", initial: "A", content: "Automating our tax receipts saved us weeks of work. Previously, two staff members spent all of January doing mail merges. Now, it happens instantly while we sleep.", rating: 5, metric: "Weeks of Admin Saved" },
            { name: "Rahul Verma", role: "Fundraising Head, Green World", location: "Mumbai, IN", initial: "R", content: "The peer-to-peer campaigns are incredible. Our supporters became our fundraisers, and our last clean-water campaign exceeded its goal by 40% because of the social sharing features.", rating: 5, metric: "40% Target Exceeded" },
            { name: "Sneha Patel", role: "Volunteer Coordinator, City Shelter", location: "Pune, IN", initial: "S", content: "Managing 300 volunteers via WhatsApp was chaos. Now, they just log into the portal, book their shifts, and my dashboard shows exactly who is showing up tomorrow.", rating: 5, metric: "Flawless Scheduling" },
            { name: "Amit Menon", role: "CFO, Educate All Foundation", location: "Bengaluru, IN", initial: "A", content: "Tracking restricted grant funds manually in Excel was a compliance nightmare. Vyora tags every rupee, ensuring we can report exact impact to our major grant providers.", rating: 5, metric: "Perfect Compliance" },
            { name: "Kavita Rao", role: "Events Lead, Cancer Care Gala", location: "Hyderabad, IN", initial: "K", content: "Selling gala tables and managing the seating chart used to be so stressful. The visual table planner and integrated ticketing made check-in at the hotel completely smooth.", rating: 5, metric: "Stress-Free Events" },
            { name: "Vikram Singh", role: "Founder, Rescued Paws IT", location: "Chandigarh, IN", initial: "V", content: "The automated prompt asking one-time donors if they want to make it monthly has increased our recurring donor base by 25%. It's a game-changing feature for cash flow.", rating: 5, metric: "25% More Recurring Donors" },
            { name: "Pooja Desai", role: "Donor Relations, Arts Access", location: "Ahmedabad, IN", initial: "P", content: "The CRM gives me the complete picture before I call a major donor. I can see their last gift, the events they attended, and our last email, making every conversation highly personal and effective.", rating: 5, metric: "Enhanced Relationships" },
            { name: "Rajiv Khan", role: "Operations, Meals for All", location: "Jaipur, IN", initial: "R", content: "When a disaster strikes, we need a donation page up immediately. The drag-and-drop builder lets us launch an appeal in 10 minutes and start collecting funds instantly.", rating: 5, metric: "10-Minute Campaign Launch" },
            { name: "Neha Gupta", role: "Director, Youth Sports NGO", location: "Kochi, IN", initial: "N", content: "Being able to send targeted emails directly from the CRM based on donor interests (e.g., emailing only football supporters about a new field) results in much higher opening rates.", rating: 5, metric: "Higher Engagement Rates" },
            { name: "Arjun Iyer", role: "Treasurer, Heritage Trust", location: "Chennai, IN", initial: "A", content: "The integration with our primary accounting software means donations flow directly into our general ledger. The reconciliation process takes half the time it used to.", rating: 5, metric: "50% Faster Accounting" }
        ],
        stats: [
            { value: "40%", label: "Average Campaign Growth" },
            { value: "100%", label: "Automated Tax Receipting" },
            { value: "25%", label: "Increase in Recurring Donors" },
            { value: "Wait-Free", label: "Event Check-ins" }
        ],
        metaTitle: "Nonprofit CRM & Fundraising Management Software",
        metaDescription: "Empower your nonprofit with Vyora. Automate tax receipts, manage donor relationships, run peer-to-peer campaigns, and coordinate volunteers seamlessly.",
        accentColor: {
            from: "from-rose-500",
            to: "to-red-700",
            text: "text-rose-600",
            bg: "bg-rose-50",
            border: "border-rose-200",
            highlight: "bg-rose-100"
        },
        relatedCategories: ["events", "education"]
    },
    {
        slug: "photography-videography",
        name: "Photography & Videography",
        icon: Camera,
        image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80",
        subtitle: "Streamline shoots, client galleries, and contracts.",
        description: "The complete studio management tool for modern creatives to handle bookings, digital contracts, invoicing, and beautiful client image deliveries.",
        definitionBlock: "Vyora for Creative Professionals manages the business side of art. Designed specifically for photographers, videographers, and design studios, it handles the end-to-end workflow: from sending an initial proposal and digital contract, to scheduling the shoot, collecting the deposit, and finally delivering a stunning, passcode-protected digital gallery.",
        products: [
            {
                name: "Studio CRM & Leads",
                description: "Track inquiries from your website through to booked shoots seamlessly.",
                subcategories: ["Lead Pipeline", "Automated Follow-ups", "Client Forms"]
            },
            {
                name: "Digital Contracts",
                description: "Send legally binding release forms and shooting contracts for e-signature.",
                subcategories: ["Template Library", "E-Signatures", "Model Releases"]
            },
            {
                name: "Client Galleries",
                description: "Deliver high-resolution images in beautiful, branded, password-protected galleries.",
                subcategories: ["Watermarking", "Client Favorites", "Print Selling"]
            }
        ],
        services: [
            {
                name: "Automated Booking",
                description: "Allow clients to book mini-sessions or consults directly on your calendar.",
                subcategories: ["Calendar Sync", "Retainer Collection", "Session Buffers"]
            },
            {
                name: "Invoicing & Packages",
                description: "Create structured pricing packages and automate payment collection schedules.",
                subcategories: ["Payment Plans", "Upselling Tools", "Tax Calculation"]
            },
            {
                name: "Workflow Timelines",
                description: "Track exactly where a project is: from 'Shooting' to 'Editing' to 'Delivered'.",
                subcategories: ["Task Boards", "Delivery Deadlines", "Outsourcing Tracker"]
            }
        ],
        comparisonTable: [
            { feature: "Contract Signing", vyora: "Instant mobile e-signature", traditional: "Printing and scanning PDFs", manual: "Signing in person" },
            { feature: "Payment Collection", vyora: "Automated deposit upon booking", traditional: "Chasing bank transfers", manual: "Collecting cheques at shoot" },
            { feature: "Image Delivery", vyora: "Integrated branded galleries", traditional: "Third-party cloud links", manual: "USB drives/CDs" },
            { feature: "Client Questionnaires", vyora: "Automated digital forms", traditional: "Word documents in email", manual: "Phone interviews" }
        ],
        bulletFacts: [
            "Secure bookings 3x faster by combining the contract, questionnaire, and invoice into one seamless digital link.",
            "Eliminate 'no-shows' by requiring a non-refundable digital deposit to block out time on your calendar.",
            "Increase revenue post-shoot by allowing clients to directly purchase high-quality prints from their digital gallery.",
            "Save hours of editing anxiety by using automated workflows that remind you when a client's gallery is due.",
            "Look incredibly professional to high-end corporate clients or brides with a fully branded, cohesive booking experience."
        ],
        faqs: [
            { q: "Can I require a deposit before a client can legally book a date?", a: "Yes. The booking workflow requires the client to select a date, sign the digital contract, and pay your specified deposit (e.g., 30%) in one seamless flow before the date is officially reserved." },
            { q: "How do digital contracts work, and are they legally binding?", a: "Vyora uses secure, legally compliant e-signatures. You can build templates (like a Wedding Contract or Commercial License), and clients can sign them instantly on their phone or computer." },
            { q: "Can I send a questionnaire to a bride to get their shot list?", a: "Absolutely. You can create custom questionnaires (e.g., 'Wedding Day Details', 'Family Portrait Groupings') that automatically trigger and send to the client 30 days before their shoot." },
            { q: "How does the Client Gallery delivery work?", a: "Instead of using generic storage links, you upload high-res JPEG files to Vyora. It generates a beautiful, branded, masonry-style gallery. You can set a password, allow downloads, or restrict access as needed." },
            { q: "Can clients sell prints or canvases directly from the gallery?", a: "Yes, the gallery has built-in e-commerce. Clients can select their favorite photo, choose a canvas size, and buy it. The print request routes directly to your integrated professional print lab." },
            { q: "Does the system track different stages of editing?", a: "Yes, the Kanban-style workflow board allows you to move a client card from 'Shot' to 'Culling' to 'Retouching' to 'Delivered', ensuring you never lose track of a deliverable deadline." },
            { q: "Can we manage a team of multiple shooters or assistants?", a: "Yes, you can assign 'Second Shooters' to specific events, giving them access to the timeline and locations without exposing your financial contracts or invoices." },
            { q: "Will the calendar sync with my personal Google or Apple Calendar?", a: "Yes, Vyora ensures strict two-way syncing. If you block out a weekend for a personal vacation on your phone, Vyora will not let clients book you for a shoot on those days." },
            { q: "Can I create different pricing packages for different types of shoots?", a: "Definitely. You can pre-build a 'Silver Wedding Package' or a 'Corporate Headshot Package' with specific deliverables and prices attached, making quoting incredibly fast." },
            { q: "Is there a way for clients to 'favorite' photos for retouching?", a: "Yes, inside their gallery, clients can 'heart' or favorite specific images. You get a notification with the exact file names they selected, streamlining the selection and retouching process." }
        ],
        testimonials: [
            { name: "Rohan Kapoor", role: "Wedding Photographer", location: "Delhi, IN", initial: "R", content: "Combining the contract and deposit into one link changed my business. I send a proposal, they approve, sign, and pay in 5 minutes. No more chasing brides for cheques.", rating: 5, metric: "Instant Bookings" },
            { name: "Sneha Desai", role: "Founder, Frame & Focus Studios", location: "Mumbai, IN", initial: "S", content: "The automated questionnaires ensure I never miss a crucial family group shot at a wedding. The client fills it out two weeks prior, and I just print it for the day.", rating: 5, metric: "Zero Missed Shots" },
            { name: "Vikram Chauhan", role: "Commercial Videographer", location: "Pune, IN", initial: "V", content: "Corporate clients expect a certain level of professionalism. Sending a cohesive, branded Vyora proposal with a digital scope-of-work contract helps me win larger, high-end bids.", rating: 5, metric: "Winning Enterprise Bids" },
            { name: "Priya Sharma", role: "Newborn Photographer", location: "Bengaluru, IN", initial: "P", content: "The workflow board keeps me sane. Knowing exactly which session needs culling, which needs retouching, and what is due tomorrow has eliminated my editing anxiety completely.", rating: 5, metric: "Zero Editing Stress" },
            { name: "Amit Yadav", role: "Owner, Cityscapes Media", location: "Ahmedabad, IN", initial: "A", content: "Selling prints automatically from the gallery is brilliant passive income. A client loved a photo, ordered a huge canvas, and the lab handled it. I just collected the profit.", rating: 5, metric: "Passive Print Income" },
            { name: "Neha Menon", role: "Portrait Artist", location: "Hyderabad, IN", initial: "N", content: "The client selection feature is a massive time saver. Clients 'heart' their favorite 20 photos for a portfolio, and I get a neat list of filenames to retouch. No more confusing emails.", rating: 5, metric: "Streamlined Retouching" },
            { name: "Rajiv Khan", role: "Event Photographer", location: "Chennai, IN", initial: "R", content: "Watermarking thousand of images used to require extra software. Vyora applies a beautiful, subtle watermark as the gallery generates, protecting my work from unauthorized downloads instantly.", rating: 5, metric: "Instant Image Protection" },
            { name: "Kavita Reddy", role: "Manager, Dual Lens Team", location: "Kochi, IN", initial: "K", content: "Assigning my second shooters to a specific job timeline in Vyora ensures they know the exact address and schedule, without seeing what the client is paying me.", rating: 5, metric: "Secure Team Coordination" },
            { name: "Arjun Iyer", role: "Food & Product Photographer", location: "Jaipur, IN", initial: "A", content: "The online booking feature is perfect for mini-sessions. I establish 10 slots on a Saturday. Clients pick a time, pay the fee, and book themselves. It sold out effortlessly.", rating: 5, metric: "Effortless Mini-Sessions" },
            { name: "Sonal Baxi", role: "Director, Cinematic Weddings", location: "Chandigarh, IN", initial: "S", content: "Having all the client's details, signed contracts, and invoices in one single dashboard makes me look incredibly organized when a client calls with a question.", rating: 5, metric: "Total Client Organization" }
        ],
        stats: [
            { value: "3x", label: "Faster Booking Process" },
            { value: "100%", label: "Legally Binding E-Signatures" },
            { value: "0", label: "Double Bookings via Calendar Sync" },
            { value: "20%", label: "Average Increase in Print Sales" }
        ],
        metaTitle: "Studio Management Software for Photographers",
        metaDescription: "The ultimate tool for photographers and videographers. Manage digital contracts, automate booking deposits, and deliver stunning client galleries.",
        accentColor: {
            from: "from-teal-600",
            to: "to-emerald-800",
            text: "text-teal-700",
            bg: "bg-teal-50",
            border: "border-teal-200",
            highlight: "bg-teal-100"
        },
        relatedCategories: ["events", "professional-services"]
    },
    {
        slug: "logistics-transport",
        name: "Logistics & Transport",
        icon: Truck,
        image: "https://images.unsplash.com/photo-1586528116311-ad8ed7c80a22?w=800&q=80",
        subtitle: "Fleet management, dispatching, and supply chain control.",
        description: "An enterprise-grade platform connecting drivers, dispatchers, and clients with real-time routing, digital PODs, and automated billing.",
        definitionBlock: "Vyora for Logistics & Transport digitizes the entire supply chain workflow. Whether managing a fleet of local delivery vans or long-haul freight trucks, it eliminates paperwork. Dispatchers assign optimized routes instantly, drivers collect digital signatures on glass, and the back-office generates invoices the moment a delivery is completed.",
        products: [
            {
                name: "Fleet Management",
                description: "Track vehicle health, maintenance schedules, and fuel consumption.",
                subcategories: ["Maintenance Alerts", "Fuel Card Integration", "Driver Assignment"]
            },
            {
                name: "Intelligent Dispatching",
                description: "Assign jobs to the nearest available driver with optimized routing.",
                subcategories: ["Route Optimization", "Live GPS Tracking", "Load Planning"]
            },
            {
                name: "Digital Proof of Delivery (POD)",
                description: "Mobile app for drivers to collect signatures, photos, and notes on-site.",
                subcategories: ["E-Signatures", "Photo Capture", "Barcode Scanning"]
            }
        ],
        services: [
            {
                name: "Customer Tracking Portal",
                description: "Provide clients with white-labeled, real-time tracking links for their shipments.",
                subcategories: ["Branded Tracking", "SMS Updates", "ETA Calculations"]
            },
            {
                name: "Automated Invoicing",
                description: "Trigger invoices automatically the moment a driver submits a POD.",
                subcategories: ["Distance Billing", "Weight/Volume Calculation", "Toll Integration"]
            },
            {
                name: "Compliance & Safety",
                description: "Ensure drivers meet rest requirements and vehicles pass daily inspections.",
                subcategories: ["Electronic Logging (ELD)", "Pre-trip Checklists", "Licence Expiry Alerts"]
            }
        ],
        comparisonTable: [
            { feature: "Driver Dispatch", vyora: "Automated, route-optimized", traditional: "Whiteboards and phone calls", manual: "Radio dispatch" },
            { feature: "Proof of Delivery", vyora: "Instant digital capture", traditional: "Scanning paper dockets later", manual: "Carbon copy paper" },
            { feature: "Invoicing Speed", vyora: "Same-day (Automated)", traditional: "End of month", manual: "Whenever paperwork returns" },
            { feature: "Client Visibility", vyora: "Real-time tracking link", traditional: "Calling dispatch for ETA", manual: "No visibility" }
        ],
        bulletFacts: [
            "Reduce fuel costs by up to 15% using our AI-driven route optimization engine.",
            "Cut DSO (Days Sales Outstanding) by 50% by invoicing instantly upon digital signature capture.",
            "Eliminate 'Where is my truck?' calls with automated SMS tracking links sent to the end customer.",
            "Prevent costly breakdowns with automated preventative maintenance scheduling based on actual odometer readings.",
            "Ensure total compliance with built-in daily digital vehicle inspection checklists for drivers."
        ],
        faqs: [
            { q: "How do drivers access their routes and capture PODs?", a: "Vyora provides a dedicated Driver Mobile App (iOS/Android). Drivers see their daily manifest, get turn-by-turn navigation, and use their phone screen to capture customer signatures and photos." },
            { q: "Can the system optimize routes for multiple stops?", a: "Yes. The AI routing engine takes dozens of stops, considers traffic, vehicle capacity, and delivery time windows, and instantly calculates the most efficient sequence for the driver." },
            { q: "How quickly are invoices generated after a delivery?", a: "Instantly. The moment the driver hits 'Complete' and captures the e-signature, Vyora can automatically generate and email the invoice to the client, attaching the POD for reference." },
            { q: "Does the system track driver hours for compliance?", a: "Yes, the driver app includes a digital punch clock and Electronic Logging Device (ELD) features to ensure drivers are taking legally required rest breaks." },
            { q: "Can our clients track their own shipments?", a: "Absolutely. You can send an automated SMS or email to the recipient with a secure tracking link, showing the truck's live location on a map and an accurate ETA." },
            { q: "How do we manage vehicle maintenance?", a: "You set rules (e.g., 'Oil change every 10,000 km'). Drivers log mileage in the app, and Vyora alerts your mechanics exactly when a vehicle is due for service." },
            { q: "What happens if a delivery is damaged or refused?", a: "Drivers can use the mobile app to take photos of the damaged goods, select 'Refused' from a dropdown, and add notes. Dispatch is notified instantly of the exception." },
            { q: "Can we bill clients differently based on distance or weight?", a: "Yes, the pricing engine is highly customizable. You can set rate cards based on zones, mileage, pallet count, or total weight, and the system calculates it automatically." },
            { q: "Does the system handle toll tracking?", a: "Depending on your region, Vyora can integrate with toll databases to automatically add toll costs to the specific client's invoice based on the route taken." },
            { q: "Is the GPS tracking real-time?", a: "Yes, the dispatcher dashboard features a live map showing the exact location, speed, and status (driving, idling, at stop) of every vehicle in the fleet." }
        ],
        testimonials: [
            { name: "Vikram Singh", role: "Fleet Manager, Swift Logistics", location: "Delhi, IN", initial: "V", content: "The route optimization engine is saving us roughly ₹40,000 a month in diesel alone. The drivers spend less time in traffic and more time delivering.", rating: 5, metric: "₹40k Monthly Fuel Savings" },
            { name: "Anita Rao", role: "Owner, City Express Couriers", location: "Mumbai, IN", initial: "A", content: "We used to have mountains of crumpled paper PODs. Now, the driver gets a signature on their phone, and the invoice is emailed to the client before the truck even leaves the dock.", rating: 5, metric: "Instant Billing Cycle" },
            { name: "Rahul Patel", role: "Dispatch Head, Heavy Haul India", location: "Ahmedabad, IN", initial: "R", content: "The live map dashboard completely changed our office. We no longer have to call drivers interrupting them to ask their ETA. It's all right there on the screen.", rating: 5, metric: "Eliminated Status Calls" },
            { name: "Sneha Desai", role: "Customer Support, Prime Movers", location: "Pune, IN", initial: "S", content: "Providing an Uber-style tracking link to our clients has elevated our brand. They love watching the truck approach instead of waiting around blindly.", rating: 5, metric: "Enhanced Brand Image" },
            { name: "Amit Menon", role: "Operations Director, Cold Chain Logistics", location: "Bengaluru, IN", initial: "A", content: "The pre-trip inspection feature on the driver app ensures compliance. If a driver notes a faulty taillight, our mechanic gets a ticket instantly before the truck hits the highway.", rating: 5, metric: "100% Safety Compliance" },
            { name: "Rajiv Khan", role: "CFO, National Transports", location: "Chennai, IN", initial: "R", content: "Reducing our Days Sales Outstanding from 45 days to 15 days was entirely due to the instant POD and automated invoicing feature. It radically improved our cash flow.", rating: 5, metric: "DSO Cut by 66%" },
            { name: "Kavita Sharma", role: "HR Manager, Trucking Solutions", location: "Hyderabad, IN", initial: "K", content: "Tracking driver hours on paper was a compliance nightmare. The integrated digital punch clock ensures we are always legally compliant regarding rest periods.", rating: 5, metric: "Flawless HR Compliance" },
            { name: "Pooja Gupta", role: "Mechanic Lead, FleetPro", location: "Jaipur, IN", initial: "P", content: "I don't have to guess when a truck needs service. The system alerts me based on the actual driver-logged mileage. Preventative maintenance is finally actually preventative.", rating: 5, metric: "Zero Surprise Breakdowns" },
            { name: "Arjun Iyer", role: "Dispatcher, Metro Delivery", location: "Kochi, IN", initial: "A", content: "When a customer refuses a damaged package, the driver takes a photo, and I see it in the office 5 seconds later. We can resolve disputes immediately while the driver is still on site.", rating: 5, metric: "Instant Dispute Resolution" },
            { name: "Neha Chauhan", role: "CEO, NextGen Logistics", location: "Chandigarh, IN", initial: "N", content: "Vyora allowed us to scale from 10 trucks to 50 without hiring extra dispatchers. The automation does the heavy lifting.", rating: 5, metric: "5x Growth Scaled" }
        ],
        stats: [
            { value: "15%", label: "Reduction in Fuel Costs" },
            { value: "0", label: "Lost Paper Dockets" },
            { value: "50%", label: "Decrease in Client Calls" },
            { value: "Same-Day", label: "Invoicing Speed" }
        ],
        metaTitle: "Fleet Management & Dispatch Software",
        metaDescription: "Modernize your logistics business. Automate dispatching, optimize routes, capture digital PODs, and offer real-time client tracking with Vyora.",
        accentColor: {
            from: "from-blue-600",
            to: "to-indigo-800",
            text: "text-blue-700",
            bg: "bg-blue-50",
            border: "border-blue-200",
            highlight: "bg-blue-100"
        },
        relatedCategories: ["automotive-garages", "manufacturing"]
    },
    {
        slug: "salons-spas",
        name: "Salons & Spas",
        icon: Sparkles,
        image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80",
        subtitle: "Effortless booking, staff schedules, and client loyalty.",
        description: "Transform your salon with an elegant booking experience, automated appointment reminders, and powerful staff commission tracking.",
        definitionBlock: "Vyora for Salons & Spas acts as your digital front desk 24/7. It allows clients to book their favorite stylist via Instagram or your website, automatically sends SMS reminders to eliminate no-shows, manages complex staff commissions, and tracks retail inventory from shampoo to styling tools.",
        products: [
            {
                name: "Online Booking Engine",
                description: "Clean, mobile-friendly interface for clients to book services anytime.",
                subcategories: ["Instagram Integration", "Staff Selection", "Service Add-ons"]
            },
            {
                name: "Staff Management & Commissions",
                description: "Track hours, calculate complex tiered commissions, and manage schedules.",
                subcategories: ["Tiered Commissions", "Roster Management", "Performance Dashboard"]
            },
            {
                name: "Client CRM & History",
                description: "Keep detailed notes on client preferences, color formulas, and past purchases.",
                subcategories: ["Color Formula Notes", "Purchase History", "Before/After Photos"]
            }
        ],
        services: [
            {
                name: "Automated Marketing",
                description: "Engage clients with automated birthday offers and 'we miss you' campaigns.",
                subcategories: ["Email Campaigns", "SMS Reminders", "Loyalty Points"]
            },
            {
                name: "Retail Inventory POS",
                description: "Seamlessly ring up services and retail products in one transaction.",
                subcategories: ["Barcode Scanning", "Low Stock Alerts", "Supplier Ordering"]
            },
            {
                name: "No-Show Protection",
                description: "Require credit cards on file or partial deposits to secure high-value bookings.",
                subcategories: ["Cancellation Fees", "Deposit Collection", "Waitlist Automation"]
            }
        ],
        comparisonTable: [
            { feature: "Appointment Booking", vyora: "24/7 Online & Instagram", traditional: "Calling during open hours", manual: "Paper diary" },
            { feature: "No-Show Prevention", vyora: "Automated SMS & deposits", traditional: "Staff making reminder calls", manual: "Hoping they show up" },
            { feature: "Client Notes", vyora: "Digital profiles with photos", traditional: "Index cards", manual: "Stylist memory" },
            { feature: "Commission Math", vyora: "Instant, automated reports", traditional: "Calculators on Sunday night", manual: "Guesswork" }
        ],
        bulletFacts: [
            "Increase bookings by 30% by allowing clients to schedule appointments while you are closed, directly from Instagram.",
            "Virtually eliminate no-shows by sending automated SMS reminders 24 hours before the appointment.",
            "Boost retail sales by prompting front desk staff with the exact hair products the client bought last time.",
            "Save hours calculating payroll with automated, tiered commission tracking for every stylist.",
            "Protect your high-value balayage or keratin appointments by requiring a digital deposit upfront."
        ],
        faqs: [
            { q: "Can clients book appointments through our Instagram page?", a: "Yes. You can add a 'Book Now' button to your Instagram profile that links directly to your mobile-friendly Vyora booking page, capturing impulse bookings." },
            { q: "How do we stop people from booking and not showing up?", a: "Vyora employs multiple defenses: automated SMS/email reminders, the ability to require a credit card on file, and taking upfront deposits for expensive services." },
            { q: "Does the system handle different processing times for services?", a: "Yes. You can set up 'split times'. For example, if a color processes for 45 minutes, the system allows the stylist to squeeze in a men's haircut during that exact gap." },
            { q: "Can stylists see their own schedules on their phones?", a: "Yes, stylists get a staff login for the mobile app where they can view their daily appointments, check their commission earnings, and view client notes." },
            { q: "How does the system track color formulas?", a: "In the Client CRM, stylists can enter detailed notes and upload 'Before and After' photos. Next time the client arrives, their exact color mixture is instantly available." },
            { q: "Can we sell retail products and services on the same ticket?", a: "Absolutely. At checkout, the POS interface easily adds retail items (like shampoo) to the haircut service, updating inventory and calculating commission on both separately." },
            { q: "Do you support tiered commissions?", a: "Yes. The payroll system is highly flexible. You can set a stylist to earn 40% on services but 15% on retail, and even increase the percentage if they hit specific monthly targets." },
            { q: "What happens if a client cancels? Is there a waitlist?", a: "Yes. If an appointment is canceled, the system automatically notifies the next person on your digital waitlist via SMS, helping you fill the gap instantly." },
            { q: "Can we run loyalty programs?", a: "Yes, you can set up a points system. Clients earn points for every rupee spent, which they can redeem later for discounts on services or retail products." },
            { q: "Will the system automatically market to dormant clients?", a: "Yes, you can configure 'Win-Back' campaigns. If a regular client hasn't booked in 8 weeks, the system automatically emails them a 'We Miss You' 10% off voucher." }
        ],
        testimonials: [
            { name: "Priya Menon", role: "Owner, Glow Spa", location: "Mumbai, IN", initial: "P", content: "The Instagram booking integration is incredible. Over 40% of our bookings now happen when the salon is closed. We are literally making money in our sleep.", rating: 5, metric: "40% Out-of-Hours Bookings" },
            { name: "Rahul Verma", role: "Manager, The Barber's Chair", location: "Delhi, IN", initial: "R", content: "SMS reminders completely killed our no-show problem. Going from 5 no-shows a week to almost zero has massive implications for our bottom line.", rating: 5, metric: "Zero No-Shows" },
            { name: "Sneha Patel", role: "Stylist, Mane Attraction", location: "Pune, IN", initial: "S", content: "Having my clients' color formulas and photos on my phone before they walk in makes me look so professional. It builds incredible trust.", rating: 5, metric: "Enhanced Client Trust" },
            { name: "Amit Khanna", role: "Owner, Radiance Skin Clinic", location: "Bengaluru, IN", initial: "A", content: "Taking a 20% deposit online for our expensive laser treatments ensures clients are committed. Our schedule is now rock solid.", rating: 5, metric: "Guaranteed Revenue" },
            { name: "Kavita Desai", role: "Salon Owner", location: "Ahmedabad, IN", initial: "K", content: "Calculating commissions for 12 staff members with different tiers used to ruin my Sundays. Now, I just run a report and it's 100% accurate in seconds.", rating: 5, metric: "Sundays Reclaimed" },
            { name: "Vikram Chauhan", role: "Manager, Luxe Nails", location: "Hyderabad, IN", initial: "V", content: "The automated 'We Miss You' SMS brings back at least 10 dormant clients every month without me lifting a finger. It pays for the software itself.", rating: 5, metric: "Consistent Client Return" },
            { name: "Neha Sharma", role: "Front Desk, Bella Vida Spa", location: "Chandigarh, IN", initial: "N", content: "The Waitlist automation is pure magic. Someone cancels a massage at 9 AM, and by 9:02 AM, the slot is filled by someone on the waitlist via SMS.", rating: 5, metric: "100% Chair Utilization" },
            { name: "Arjun Iyer", role: "Owner, Gents Grooming", location: "Chennai, IN", initial: "A", content: "Ringing up retail and services together, while attributing different commission rates to the barber and the receptionist, works flawlessly.", rating: 5, metric: "Smooth Checkouts" },
            { name: "Sonal Baxi", role: "Massage Therapist", location: "Kochi, IN", initial: "S", content: "I check my schedule on the Vyora mobile app before I even leave bed. I know exactly how much I'm making today and who my clients are.", rating: 5, metric: "Total Staff Empowerment" },
            { name: "Rajiv Khan", role: "Director, Premium Salons", location: "Jaipur, IN", initial: "R", content: "The inventory alerts are great. When our bestselling serum drops below 5 bottles, I get a notification and an automatically generated PO for the supplier.", rating: 5, metric: "Never Out of Stock" }
        ],
        stats: [
            { value: "40%", label: "Bookings Out of Opening Hours" },
            { value: "95%", label: "Reduction in No-Shows" },
            { value: "0", label: "Time Wasted on Commission Math" },
            { value: "Wait-Free", label: "Checkouts" }
        ],
        metaTitle: "Salon & Spa Management Software",
        metaDescription: "Grow your salon business. Offer 24/7 online booking, reduce no-shows with SMS reminders, and automate staff commission tracking with Vyora.",
        accentColor: {
            from: "from-pink-500",
            to: "to-rose-700",
            text: "text-pink-600",
            bg: "bg-pink-50",
            border: "border-pink-200",
            highlight: "bg-pink-100"
        },
        relatedCategories: ["fitness-wellness", "retail-ecommerce"]
    },
    {
        slug: "cleaning-services",
        name: "Cleaning Services",
        icon: Sparkles,
        image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80",
        subtitle: "Schedule crews, manage recurring jobs, and invoice instantly.",
        description: "Built for residential and commercial cleaning companies to streamline dispatching, track crew locations, and automate monthly service billing.",
        definitionBlock: "Vyora for Cleaning Services replaces messy whiteboards and lost paper checklists. Whether you manage a team of 5 house cleaners or 50 commercial janitors, Vyora handles the scheduling puzzle. It routes crews efficiently, provides digital checklists via a mobile app to ensure quality, and automatically charges the client's credit card when the job is done.",
        products: [
            {
                name: "Smart Dispatching",
                description: "Drag-and-drop calendar to assign crews to specific jobs and routes.",
                subcategories: ["Recurring Schedules", "Route Optimization", "Live Map Tracking"]
            },
            {
                name: "Crew Mobile App",
                description: "Give cleaners their daily itinerary, access codes, and digital checklists.",
                subcategories: ["Job Check-In/Out", "Before & After Photos", "Job Notes"]
            },
            {
                name: "Automated Billing",
                description: "Auto-charge saved credit cards immediately after a service is completed.",
                subcategories: ["Recurring Invoices", "Online Payment Portal", "Quote Builder"]
            }
        ],
        services: [
            {
                name: "Client CRM",
                description: "Store entry codes, pet details, and specific cleaning preferences securely.",
                subcategories: ["Secure Key Tracking", "Client Notes", "Communication Logs"]
            },
            {
                name: "Quoting & Estimations",
                description: "Send professional, digital quotes that clients can approve online.",
                subcategories: ["Square Footage Pricing", "E-Signatures", "Automated Follow-ups"]
            },
            {
                name: "Quality Assurance",
                description: "Automated feedback requests sent to clients after every clean.",
                subcategories: ["Review Generation", "Issue Ticketing", "Staff Performance Ratings"]
            }
        ],
        comparisonTable: [
            { feature: "Crew Scheduling", vyora: "Drag & drop with route map", traditional: "Whiteboards", manual: "Texting staff" },
            { feature: "Time Tracking", vyora: "GPS-stamped app check-in", traditional: "Honor system", manual: "Paper timesheets" },
            { feature: "Quality Control", vyora: "Digital checklists & photos", traditional: "Client complaints", manual: "Spot checks" },
            { feature: "Payments", vyora: "Auto-charge saved cards", traditional: "Leaving an invoice on counter", manual: "Chasing cheques" }
        ],
        bulletFacts: [
            "Never miss a recurring clean again with automated 'set and forget' calendar scheduling.",
            "Protect your business from false damage claims with mandatory 'before and after' photo uploads by crews.",
            "Get paid the same day by securely storing client credit cards and auto-billing upon job completion.",
            "Win more commercial bids by presenting professional digital proposals with e-signatures.",
            "Improve cleaner accountability with GPS-stamped check-ins showing exactly when they arrived."
        ],
        faqs: [
            { q: "Can we schedule a job that repeats every second Tuesday?", a: "Yes. The recurring schedule feature is highly flexible. You set the pattern (weekly, bi-weekly, monthly) and it populates your calendar indefinitely." },
            { q: "How do cleaners know what to do at a new house?", a: "The Crew App displays specific client notes (e.g., 'Do not let the cat out', 'Alarm code is 1234') and a customized digital checklist they must tap through before completing the job." },
            { q: "Does the app track exactly how long a crew spent at a house?", a: "Yes. Crews hit 'Start Job' when they arrive and 'End Job' when they leave. The app records the exact time spent, which is crucial for payroll and profitability tracking." },
            { q: "Are the entry codes and client details secure?", a: "Absolutely. All client CRM data is encrypted. Cleaners only see the entry codes for the specific houses they are assigned to on that specific day." },
            { q: "Can we automatically email the client after the clean is done?", a: "Yes. When the crew hits 'Complete', Vyora can automatically email the invoice and a short survey asking 'How did we do?', helping you catch issues early." },
            { q: "How does the quoting system work?", a: "You can build a template based on square footage or room count. Email the quote link to the prospect; they can review it on their phone, accept it digitally, and enter their credit card to book." },
            { q: "Can we track equipment and supplies given to teams?", a: "Yes. You can assign specific assets (like high-end vacuums or carpet extractors) to specific teams and track their checkout/check-in status." },
            { q: "Is it possible to see where all my crews are right now?", a: "Yes. The dispatch dashboard features a live map view powered by the GPS in the cleaners' mobile app, so you know who is still at a job and who is driving." },
            { q: "What happens if a client cancels last minute?", a: "You can enforce cancellation policies. If they cancel within 24 hours, the system can automatically charge a set fee to their card on file." },
            { q: "Can we pay our cleaners based on a percentage of the job instead of hourly?", a: "Yes. The payroll reporting handles both hourly tracking and flat-rate/percentage 'piece-rate' pay structures, doing the complex math for you." }
        ],
        testimonials: [
            { name: "Rahul Sharma", role: "Owner, Prime Sparkle Home", location: "Delhi, IN", initial: "R", content: "Auto-charging cards the moment a clean is done completely eliminated our accounts receivable problem. We used to spend hours chasing ₹2,000 invoices.", rating: 5, metric: "Zero Unpaid Invoices" },
            { name: "Anita Kapoor", role: "Manager, City Janitorial", location: "Mumbai, IN", initial: "A", content: "The digital checklists on the mobile app ensure our new hires don't forget the baseboards. The quality of our cleans went up visibly in week one.", rating: 5, metric: "Immediate Quality Boost" },
            { name: "Vikram Desai", role: "Dispatcher, Swift Clean Co", location: "Pune, IN", initial: "V", content: "The drag-and-drop calendar is a lifesaver. When someone calls in sick, I can just drag their entire route to another team in two seconds.", rating: 5, metric: "Effortless Rescheduling" },
            { name: "Sneha Menon", role: "Owner, ClearView Windows", location: "Bengaluru, IN", initial: "S", content: "Commercial clients love the professional digital quotes. Once we started sending Vyora proposals instead of Word docs, our close rate increased by 20%.", rating: 5, metric: "20% Higher Close Rate" },
            { name: "Amit Khanna", role: "Director, Total Facility Care", location: "Ahmedabad, IN", initial: "A", content: "The GPS tracking protects us. A client claimed we only stayed 30 minutes, but I pulled up the log showing we were there for 2 hours. Dispute ended immediately.", rating: 5, metric: "Bulletproof Proof of Service" },
            { name: "Priya Chauhan", role: "Operations, Pure Spaces", location: "Hyderabad, IN", initial: "P", content: "The automated review requests are amazing. We generated 50 new 5-star Google reviews in just two months simply by automatically asking happy clients after a clean.", rating: 5, metric: "50+ Google Reviews" },
            { name: "Rajiv Khan", role: "Owner, Deep Clean Services", location: "Chennai, IN", initial: "R", content: "We pay our staff 40% of the job price. Vyora calculates everyone's pay automatically based on the jobs they completed that week. Payroll takes 10 minutes now.", rating: 5, metric: "Payroll in Minutes" },
            { name: "Kavita Reddy", role: "Manager, EcoMaids", location: "Kochi, IN", initial: "K", content: "Having all the gate codes and alarm instructions securely stored in the app saves so many panicked phone calls to the office at 8 AM.", rating: 5, metric: "Zero Morning Chaos" },
            { name: "Arjun Iyer", role: "Sales Lead, Commercial Cleaners", location: "Jaipur, IN", initial: "A", content: "The before and after photos uploaded directly to the job card are perfect for showing property managers exactly what we achieved on deep clean projects.", rating: 5, metric: "Visual Proof of Value" },
            { name: "Neha Gupta", role: "Founder, Fresh Home Solutions", location: "Chandigarh, IN", initial: "N", content: "Setting up a client on a bi-weekly schedule takes 3 clicks, and they are billed automatically forever. It's the ultimate 'set and forget' business tool.", rating: 5, metric: "Flawless Recurring Revenue" }
        ],
        stats: [
            { value: "0", label: "Lost or Unpaid Invoices" },
            { value: "50+", label: "Google Reviews Generated" },
            { value: "20%", label: "Increase in Proposal Win Rate" },
            { value: "Zero", label: "Paper Scheduling Conflicts" }
        ],
        metaTitle: "Cleaning Business Scheduling & Dispatch Software",
        metaDescription: "The best software for cleaning businesses. Manage crew schedules, automate invoicing, provide digital checklists, and track jobs via GPS with Vyora.",
        accentColor: {
            from: "from-cyan-500",
            to: "to-blue-700",
            text: "text-cyan-600",
            bg: "bg-cyan-50",
            border: "border-cyan-200",
            highlight: "bg-cyan-100"
        },
        relatedCategories: ["home-services", "professional-services"]
    }
];
