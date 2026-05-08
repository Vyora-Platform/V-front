import { Link } from "wouter";
import { useMemo } from "react";

// ─── MASTER DATA ─────────────────────────────────────────────────────────

const TOOLS = [
    { slug: "free-business-website", s: "Website Builder", l: "Free Business Website" },
    { slug: "unlimited-lead-management", s: "Lead Management", l: "Lead Management Software" },
    { slug: "automagic-catalogue-creation", s: "Catalogue Creator", l: "Digital Catalogue Creator" },
    { slug: "hisab-kitab-management", s: "GST Billing", l: "GST Billing & Accounting" },
    { slug: "smart-stock-management", s: "Inventory Manager", l: "Inventory Management Software" },
    { slug: "customer-management", s: "CRM Software", l: "Customer Management CRM" },
    { slug: "free-marketing-sales-banner", s: "Banner Maker", l: "Marketing Banner Creator" },
    { slug: "employee-management", s: "HR & Payroll", l: "Employee Management System" },
    { slug: "daily-greeting-poster", s: "Greeting Posters", l: "Daily Greeting & Festival Poster" },
    { slug: "bulk-marketing-software", s: "Bulk Marketing", l: "WhatsApp Bulk Marketing Tool" },
    { slug: "payment-gateway", s: "Payment Gateway", l: "Online Payment Gateway" },
    { slug: "customer-support", s: "Help Desk", l: "Customer Support Ticketing" },
];

const INDUSTRIES = [
    { slug: "restaurants", s: "Restaurants", l: "Restaurant & Bar" },
    { slug: "retail", s: "Retail", l: "Retail Shop" },
    { slug: "salons-spas", s: "Salons", l: "Salon & Spa" },
    { slug: "fitness-wellness", s: "Gyms", l: "Gym & Fitness Center" },
    { slug: "healthcare", s: "Clinics", l: "Healthcare Clinic" },
    { slug: "real-estate", s: "Real Estate", l: "Real Estate Agency" },
    { slug: "education", s: "Education", l: "Coaching Institute" },
    { slug: "home-services", s: "Home Services", l: "Home Service Provider" },
    { slug: "fashion", s: "Fashion", l: "Fashion & Boutique" },
    { slug: "automotive", s: "Automotive", l: "Car Service Center" },
    { slug: "photography-videography", s: "Photography", l: "Photography Studio" },
    { slug: "events-entertainment", s: "Events", l: "Event Planner" },
    { slug: "it-software-agencies", s: "IT Services", l: "IT & Software Agency" },
    { slug: "travel-tourism", s: "Travel", l: "Travel & Tourism Agency" },
    { slug: "logistics-transport", s: "Logistics", l: "Logistics & Transport" },
    { slug: "electronics", s: "Electronics", l: "Electronics Store" },
    { slug: "cleaning-services", s: "Cleaning", l: "Cleaning Service Company" },
    { slug: "legal-services", s: "Legal", l: "Law Firm & Legal Service" },
    { slug: "nonprofits-charities", s: "NGOs", l: "Nonprofit & Charity" },
    { slug: "professional-services", s: "Consulting", l: "Consulting & Professional Service" },
];

const CITIES = [
    "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Pune",
    "Ahmedabad", "Jaipur", "Lucknow", "Noida", "Gurgaon", "Indore", "Chandigarh",
    "Nagpur", "Surat", "Kochi", "Bhopal", "Patna", "Coimbatore",
];

// ─── PER-CATEGORY KEYWORD SEEDS ─────────────────────────────────────────
// Each category has unique short-tail and long-tail keyword seeds

const CATEGORY_KEYWORDS: Record<string, { shortTail: string[]; longTail: string[] }> = {
    "restaurants": {
        shortTail: ["Restaurant POS", "Menu Management", "Table Booking", "Kitchen Display", "Food Delivery Software", "QR Menu", "Restaurant CRM", "Waiter App", "Restaurant Billing", "Order Management"],
        longTail: ["Best Restaurant Management Software India", "Free POS Software for Restaurants", "QR Code Menu for Restaurant", "Online Food Ordering System for Restaurants", "Restaurant Table Booking App", "Kitchen Display System for Cloud Kitchen", "Restaurant Inventory Management Software", "GST Billing Software for Restaurant", "WhatsApp Ordering for Restaurant", "Restaurant Loyalty Program Software"],
    },
    "retail": {
        shortTail: ["Retail POS", "Barcode Billing", "Shop Management", "Stock Management", "E-Commerce", "Loyalty Software", "Retail CRM", "Multi-Store Software", "Price Label Printer", "Retail Analytics"],
        longTail: ["Best Retail POS Software India", "Free Billing Software for Retail Shop", "Barcode Scanner Billing System", "Multi-Store Inventory Management", "Retail Customer Loyalty Program", "GST Billing for Retail Store", "Online Store Builder for Retail", "Retail Shop Employee Management", "WhatsApp Catalogue for Shop", "Retail Sales Analytics Dashboard"],
    },
    "salons-spas": {
        shortTail: ["Salon Booking", "Spa Management", "Appointment Software", "Salon POS", "Beauty CRM", "Staff Scheduler", "Salon Marketing", "Spa Billing", "Membership Software", "Walk-in Manager"],
        longTail: ["Best Salon Management Software India", "Online Appointment Booking for Salon", "Salon POS & Billing System", "Spa Membership Management Software", "Salon Staff Scheduling App", "Beauty Salon Customer CRM", "Salon WhatsApp Marketing Tool", "Salon Social Media Poster Maker", "Salon Inventory Management", "Salon Franchise Management Software"],
    },
    "fitness-wellness": {
        shortTail: ["Gym Management", "Membership Software", "Fitness CRM", "Class Scheduling", "Trainer App", "Gym Billing", "Body Tracking", "Diet Planning", "Gym Marketing", "Studio Software"],
        longTail: ["Best Gym Management Software India", "Free Membership Management for Gym", "Fitness Class Scheduling Software", "Personal Trainer Client Management App", "Gym Billing & Payment Collection", "Body Composition Tracking Software", "Gym Lead Management System", "Yoga Studio Management Software", "CrossFit Box Management Software", "Gym WhatsApp Marketing Tool"],
    },
    "healthcare": {
        shortTail: ["Clinic Software", "Patient Management", "EMR System", "Appointment Booking", "Medical Billing", "Telemedicine", "Lab Management", "Prescription Software", "Doctor CRM", "Hospital ERP"],
        longTail: ["Best Clinic Management Software India", "Online Appointment System for Doctors", "Electronic Medical Records Software", "Patient Management System for Clinic", "Medical Billing & Insurance Software", "Telemedicine Platform for Doctors", "Pharmacy Management Software", "Lab Report Management System", "Doctor Patient CRM India", "NABH Compliant Hospital Software"],
    },
    "real-estate": {
        shortTail: ["Property CRM", "Lead Tracker", "Listing Software", "Broker Management", "Rental Software", "Site Visit App", "RERA Software", "Property Portal", "Agent CRM", "Builder ERP"],
        longTail: ["Best Real Estate CRM India", "Property Listing Management Software", "Real Estate Lead Tracking System", "Rental Property Management Software", "Real Estate Broker Commission Tracker", "Site Visit Scheduling App", "RERA Compliant Builder Software", "Real Estate WhatsApp Marketing", "Property Dealer Management App", "Real Estate Virtual Tour Software"],
    },
    "education": {
        shortTail: ["Student Management", "Fee Collection", "LMS Software", "Attendance App", "Exam Software", "Parent Portal", "Batch Management", "Coaching CRM", "Report Cards", "Online Classes"],
        longTail: ["Best Student Management Software India", "Online Fee Collection for Coaching", "Learning Management System for Institute", "Student Attendance Tracking App", "Online Exam & Test Software", "Parent Teacher Communication App", "Coaching Center Lead Management", "Batch & Timetable Management", "Student Report Card Generator", "Online Live Class Platform"],
    },
    "home-services": {
        shortTail: ["Service Booking", "Technician App", "Job Scheduling", "Field Service", "Plumber Software", "AC Service App", "Pest Control CRM", "Cleaning App", "Service Invoice", "Customer Tracker"],
        longTail: ["Best Home Service Management Software", "Technician Dispatch & Tracking App", "Field Service Job Scheduling Software", "Plumbing Service Business Software", "AC Service Booking Management", "Pest Control Business CRM", "On-Demand Cleaning Service App", "Home Service Invoice & Billing", "Electrician Service Booking Platform", "Home Service Lead Management"],
    },
    "fashion": {
        shortTail: ["Fashion POS", "Boutique Software", "Size Tracking", "Fashion E-Commerce", "Apparel ERP", "Clothing Inventory", "Style CRM", "Tailor Software", "Fabric Management", "Fashion Marketing"],
        longTail: ["Best Fashion Store POS India", "Boutique Management Software", "Clothing Size & Color Inventory Tracking", "Fashion E-Commerce Store Builder", "Apparel Manufacturing ERP", "Clothing Shop Billing Software", "Fashion Brand Marketing Platform", "Custom Tailoring Order Management", "Fabric & Material Stock Management", "Fashion Store WhatsApp Catalogue"],
    },
    "automotive": {
        shortTail: ["Garage Software", "Job Card System", "Parts Inventory", "Vehicle Tracking", "Service Booking", "Mechanic App", "Car Wash CRM", "Workshop Billing", "Fleet Management", "Auto Dealer CRM"],
        longTail: ["Best Garage Management Software India", "Digital Job Card System for Workshop", "Auto Parts Inventory Management", "Vehicle Service History Tracker", "Car Service Center Booking App", "Mechanic Task Assignment Software", "Car Wash Business Management", "Workshop GST Billing Software", "Fleet Tracking & Maintenance Software", "Automobile Dealer CRM System"],
    },
    "photography-videography": {
        shortTail: ["Studio Booking", "Client Gallery", "Photo Delivery", "Event Calendar", "Invoice Maker", "Portfolio Builder", "Contract Manager", "Booking CRM", "Album Designer", "Lead Tracker"],
        longTail: ["Best Photography Studio Management Software", "Online Client Gallery & Photo Delivery", "Wedding Photography Booking System", "Photography Portfolio Website Builder", "Photographer Invoice & Contract Manager", "Photography Business Lead CRM", "Photo Studio Appointment Booking", "Event Photography Calendar Manager", "Photography Business WhatsApp Marketing", "Freelance Photographer Management App"],
    },
    "events-entertainment": {
        shortTail: ["Event Planner", "Venue Booking", "Ticket System", "Vendor Manager", "Guest List", "Event CRM", "Budget Tracker", "Seating Plan", "Event Marketing", "Registration App"],
        longTail: ["Best Event Management Software India", "Venue Booking & Availability System", "Online Event Ticketing Platform", "Wedding Vendor Management Software", "Guest List & RSVP Management", "Event Planner CRM & Lead Tracking", "Event Budget & Expense Tracker", "Custom Seating Plan Generator", "Event Social Media Marketing Tool", "Conference Registration Platform"],
    },
    "it-software-agencies": {
        shortTail: ["Project Manager", "Time Tracker", "Client Portal", "Bug Tracker", "Agile Board", "Invoice Software", "Resource Planner", "Code Review", "Sprint Manager", "Agency CRM"],
        longTail: ["Best Project Management for IT Agency", "Developer Time Tracking Software", "Client Portal for Software Company", "Bug & Issue Tracking System", "Agile Sprint Board for Dev Teams", "IT Agency Invoicing & Billing", "Resource Allocation & Planning Tool", "IT Company Lead & Sales CRM", "Software Agency Proposal Builder", "Freelancer Project Management App"],
    },
    "travel-tourism": {
        shortTail: ["Tour Planner", "Booking Engine", "Travel CRM", "Itinerary Builder", "Hotel Booking", "Flight API", "Forex Manager", "B2B Portal", "Visa Tracker", "Tour Package"],
        longTail: ["Best Travel Agency Software India", "Online Tour Booking Engine", "Travel Agent CRM & Lead Management", "Custom Itinerary Builder Software", "Hotel Booking API Integration", "B2B Travel Agent Portal", "Travel Agency Invoice & Billing", "Tour Package Management System", "Travel Agency WhatsApp Marketing", "Visa Application Tracking Software"],
    },
    "logistics-transport": {
        shortTail: ["Fleet Tracker", "Route Planner", "Driver App", "Freight Manager", "Warehouse Software", "Delivery Tracker", "Load Board", "Transport Billing", "Vehicle Maintenance", "Supply Chain"],
        longTail: ["Best Fleet Management Software India", "GPS Vehicle Tracking System", "Delivery Route Optimization Software", "Driver Mobile App for Logistics", "Freight & Load Management System", "Warehouse Inventory Management", "Last-Mile Delivery Tracking", "Transport Company Billing Software", "Vehicle Maintenance Scheduler", "Supply Chain Management Platform"],
    },
    "electronics": {
        shortTail: ["Electronics POS", "Repair Tracker", "IMEI Tracking", "Product Catalogue", "Warranty Manager", "AMC Software", "Service Center", "Trade-In Manager", "Electronics CRM", "Shop Billing"],
        longTail: ["Best Electronics Store POS India", "Mobile Repair Job Tracking Software", "IMEI & Serial Number Tracking System", "Electronics Product Catalogue Builder", "Warranty Management & Tracking", "Annual Maintenance Contract Software", "Service Center Management System", "Electronics Trade-In & Buyback Manager", "Electronics Store Customer CRM", "Computer Shop Billing Software"],
    },
    "cleaning-services": {
        shortTail: ["Job Scheduling", "Crew Manager", "Service Booking", "Cleaning CRM", "Invoice App", "Supply Tracker", "Quality Check", "Route Planner", "Estimate Builder", "Staff GPS"],
        longTail: ["Best Cleaning Business Management Software", "Cleaning Job Scheduling & Dispatch", "Cleaning Crew & Staff Management App", "Online Cleaning Service Booking Platform", "Cleaning Business CRM & Lead Tracker", "Cleaning Service Invoice Generator", "Cleaning Supply Inventory Tracker", "Cleaning Quality Inspection App", "Cleaning Service Route Optimizer", "Deep Cleaning Estimate Calculator"],
    },
    "legal-services": {
        shortTail: ["Case Manager", "Court Calendar", "Client Portal", "Document Manager", "Time & Billing", "E-Signature", "Legal CRM", "Compliance Tool", "Contract Builder", "Matter Tracker"],
        longTail: ["Best Legal Case Management Software", "Court Date Calendar & Reminder App", "Law Firm Client Portal Software", "Legal Document Management System", "Lawyer Time Tracking & Billing", "Electronic Signature for Legal Docs", "Law Firm CRM & Client Intake", "Regulatory Compliance Tracking Tool", "Legal Contract Draft Builder", "Law Firm Practice Management Software"],
    },
    "nonprofits-charities": {
        shortTail: ["Donor Management", "Fundraising App", "Volunteer CRM", "Grant Tracker", "Impact Dashboard", "Event Manager", "NGO Accounting", "Campaign Builder", "Pledge Tracker", "NGO Website"],
        longTail: ["Best Donor Management Software India", "Online Fundraising Platform for NGO", "Volunteer Management CRM System", "Grant Application Tracking Software", "NGO Impact Reporting Dashboard", "Charity Event Management Platform", "NGO Accounting & Finance Software", "Fundraising Campaign Builder Tool", "Donation Pledge Tracking System", "Free NGO Website Builder India"],
    },
    "professional-services": {
        shortTail: ["Client CRM", "Project Tracker", "Proposal Builder", "Time Logger", "Resource Planner", "Invoice Manager", "Contract Workflow", "Retainer Tracker", "Pipeline Manager", "Report Builder"],
        longTail: ["Best Consulting Firm CRM India", "Project Tracking for Consulting Firm", "Professional Services Proposal Builder", "Consultant Time Logging Software", "Resource Allocation for Service Firms", "Consulting Invoice & Billing Tool", "Contract Lifecycle Management", "Client Retainer Management Software", "Sales Pipeline for Professional Services", "Custom Report Builder for Agencies"],
    },
};

// ─── COMPONENT ───────────────────────────────────────────────────────────

interface SeoFooterLinksProps {
    pageType: "landing" | "tool" | "category" | "seo";
    currentSlug?: string;
    currentTitle?: string;
}

export function SeoFooterLinks({ pageType, currentSlug, currentTitle }: SeoFooterLinksProps) {
    const sections = useMemo(() => {
        const result: { heading: string; links: { href: string; text: string }[] }[] = [];
        const ct = currentTitle || "";
        const cs = currentSlug || "";
        const ctShort = ct.split("&")[0].split("(")[0].trim();

        if (pageType === "landing") {
            // ── LANDING: JustDial-style dense footer ──

            // 1. Vyora Tools – All Products
            result.push({
                heading: "Vyora Business Tools",
                links: TOOLS.map(t => ({ href: `/app/${t.slug}`, text: t.l })),
            });

            // 2. Top Searches
            result.push({
                heading: "Top Searches on Vyora",
                links: [
                    "Free Business Website Maker", "Best CRM for Small Business", "GST Billing Software Free",
                    "WhatsApp Marketing Tool", "Free Inventory Management", "Employee Attendance App",
                    "Online Payment Gateway India", "Customer Support Software", "Digital Catalogue Maker",
                    "Lead Management for SME", "Festival Poster Generator", "Salon Booking Software",
                    "Gym Management App", "Restaurant POS System", "Retail Billing Software",
                ].map(t => ({ href: "/", text: t })),
            });

            // 3. Software by Industry
            result.push({
                heading: "Software by Industry",
                links: INDUSTRIES.map(ind => ({ href: `/category/${ind.slug}`, text: `${ind.l} Software` })),
            });

            // 4. Vyora in Popular Cities
            result.push({
                heading: "Vyora in Popular Cities",
                links: CITIES.map(c => ({ href: "/", text: `Business Software in ${c}` })),
            });

            // 5. Free Tools for Small Business
            result.push({
                heading: "Free Tools for Small Business",
                links: TOOLS.map(t => ({ href: `/app/${t.slug}`, text: `Free ${t.s} for Small Business` })),
            });

            // 6. Industry × City: Top combos
            const topInd = INDUSTRIES.slice(0, 8);
            const topCity = CITIES.slice(0, 5);
            result.push({
                heading: "Industry Software by City",
                links: topInd.flatMap(ind =>
                    topCity.map(c => ({ href: `/category/${ind.slug}`, text: `${ind.s} Software in ${c}` }))
                ),
            });

        } else if (pageType === "tool") {
            // ── TOOL PAGE: Tool-specific dense footer ──
            const otherTools = TOOLS.filter(t => t.slug !== cs);

            // 1. [Tool] for Every Industry
            result.push({
                heading: `${ct} for Every Industry`,
                links: INDUSTRIES.map(ind => ({ href: `/app/${cs}`, text: `${ct} for ${ind.l}` })),
            });

            // 2. [Tool] in Popular Cities
            result.push({
                heading: `${ct} in Popular Cities`,
                links: CITIES.map(c => ({ href: `/app/${cs}`, text: `${ct} in ${c}` })),
            });

            // 3. Related Vyora Tools
            result.push({
                heading: "Related Vyora Tools",
                links: otherTools.map(t => ({ href: `/app/${t.slug}`, text: t.l })),
            });

            // 4. Top Searches for [Tool]
            result.push({
                heading: `Top Searches for ${ct}`,
                links: [
                    `Best ${ct} India`, `Free ${ct} for Small Business`, `${ct} App Download`,
                    `${ct} vs Competitors`, `${ct} Pricing & Plans`, `${ct} Features & Benefits`,
                    `How to Use ${ct}`, `${ct} for Startups`, `${ct} Demo & Tutorial`,
                    `${ct} Customer Reviews`, `${ct} Integration Guide`, `${ct} for Franchise`,
                ].map(t => ({ href: `/app/${cs}`, text: t })),
            });

            // 5. [Tool] × Top Industries × Cities (long-tail)
            result.push({
                heading: `${ctShort} by Industry & City`,
                links: INDUSTRIES.slice(0, 6).flatMap(ind =>
                    CITIES.slice(0, 4).map(c => ({
                        href: `/app/${cs}`,
                        text: `${ctShort} for ${ind.s} in ${c}`,
                    }))
                ),
            });

            // 6. Software by Industry
            result.push({
                heading: "Explore Software by Industry",
                links: INDUSTRIES.slice(0, 12).map(ind => ({ href: `/category/${ind.slug}`, text: `${ind.l} Software` })),
            });

        } else if (pageType === "category") {
            // ── CATEGORY PAGE: JustDial-style hyper-contextual ──
            const kw = CATEGORY_KEYWORDS[cs];

            // 1. Short-tail keywords for this category
            if (kw) {
                result.push({
                    heading: `${ct} Software Features`,
                    links: kw.shortTail.map(k => ({ href: `/category/${cs}`, text: k })),
                });
            }

            // 2. Long-tail keywords for this category
            if (kw) {
                result.push({
                    heading: `Top Searches for ${ct}`,
                    links: kw.longTail.map(k => ({ href: `/category/${cs}`, text: k })),
                });
            }

            // 3. Vyora Tools for [Category]
            result.push({
                heading: `Vyora Tools for ${ct}`,
                links: TOOLS.map(t => ({ href: `/app/${t.slug}`, text: `${t.s} for ${ctShort}` })),
            });

            // 4. [Category] Software in Cities
            result.push({
                heading: `${ct} Software in Cities`,
                links: CITIES.map(c => ({ href: `/category/${cs}`, text: `${ctShort} Software in ${c}` })),
            });

            // 5. Tool × City for this category (dense long-tail)
            result.push({
                heading: `${ctShort} Tools by City`,
                links: TOOLS.slice(0, 6).flatMap(t =>
                    CITIES.slice(0, 4).map(c => ({
                        href: `/app/${t.slug}`,
                        text: `${t.s} for ${ctShort} in ${c}`,
                    }))
                ),
            });

            // 6. Explore Other Industries
            result.push({
                heading: "Explore Other Industries",
                links: INDUSTRIES.filter(ind => ind.slug !== cs).slice(0, 15).map(ind => ({
                    href: `/category/${ind.slug}`, text: `${ind.l} Software`,
                })),
            });

            // 7. Popular Searches
            result.push({
                heading: `Popular ${ctShort} Searches`,
                links: [
                    `Best ${ctShort} Software India 2025`, `Free ${ctShort} Management App`,
                    `${ctShort} POS System`, `${ctShort} CRM & Leads`, `${ctShort} Billing Solution`,
                    `${ctShort} Loyalty Program`, `${ctShort} Franchise Software`, `${ctShort} Online Booking`,
                    `${ctShort} Attendance System`, `${ctShort} WhatsApp Marketing`,
                    `${ctShort} Business Automation`, `${ctShort} Digital Transformation`,
                    `${ctShort} All-in-One Platform`, `Vyora for ${ctShort}`, `${ctShort} Software Free Download`,
                ].map(t => ({ href: `/category/${cs}`, text: t })),
            });
        } else if (pageType === "seo") {
             // ── SEO PAGE: Hyper-specific cross-linking ──
             
             // 1. Tool in top cities
             result.push({
                 heading: `${ct} in Popular Cities`,
                 links: CITIES.map(c => ({ href: `/${cs}/in/${c.toLowerCase()}`, text: `${ct} in ${c}` })),
             });
             
             // 2. Tool for top industries
             result.push({
                 heading: `${ct} for Industries`,
                 links: INDUSTRIES.map(ind => ({ href: `/${cs}/for/${ind.slug}`, text: `${ct} for ${ind.l}` })),
             });
             
             // 3. Other Vyora Tools
             result.push({
                 heading: "Other Business Tools",
                 links: TOOLS.filter(t => t.slug !== cs).map(t => ({ href: `/${t.slug}`, text: t.l })),
             });
        }

        return result;
    }, [pageType, currentSlug, currentTitle]);

    return (
        <nav className="py-8 bg-[#f7f8fa] border-t border-gray-200" aria-label="Site Navigation">
            <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
                {sections.map((section, si) => (
                    <div key={si} className={si > 0 ? "mt-5 pt-5 border-t border-gray-200" : ""}>
                        <h4 className="text-[11px] font-extrabold text-gray-900 uppercase tracking-[0.15em] mb-2.5">
                            {section.heading}
                        </h4>
                        <div className="flex flex-wrap">
                            {section.links.map((link, li) => (
                                <span key={li} className="inline-flex items-center">
                                    <Link href={link.href}
                                        className="text-[12.5px] text-[#666] hover:text-blue-700 hover:underline transition-colors leading-[22px]">
                                        {link.text}
                                    </Link>
                                    {li < section.links.length - 1 && (
                                        <span className="text-gray-300 mx-1.5 text-[10px] select-none">|</span>
                                    )}
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </nav>
    );
}
