// ─── CATEGORY TAXONOMY DATA ──────────────────────────────────────────────
// Master product & service category structure for each business category.
// Used for SEO internal linking and keyword optimization on category pages.

export interface TaxonomyItem {
    name: string;
    items: string[];
}

export interface CategoryTaxonomy {
    products: TaxonomyItem[];
    services: TaxonomyItem[];
}

export const categoryTaxonomyMap: Record<string, CategoryTaxonomy> = {

    // ═══════════════════════════════════════════════════════════════════
    // 1. RESTAURANTS & BARS
    // ═══════════════════════════════════════════════════════════════════
    "restaurants": {
        products: [
            { name: "Kitchen Equipment", items: ["Commercial Ovens", "Tandoor Ovens", "Deep Fryers", "Grills & Griddles", "Food Processors", "Commercial Refrigerators", "Walk-in Coolers", "Ice Machines", "Dishwashers", "Exhaust Hoods"] },
            { name: "POS & Billing Systems", items: ["Restaurant POS Software", "Tablet POS System", "Self-Ordering Kiosk", "QR Code Menu System", "Kitchen Display System", "Bill Printer", "Cash Register", "Card Payment Terminal", "UPI Payment Device", "Receipt Printer"] },
            { name: "Tableware & Dining Supplies", items: ["Crockery Sets", "Glassware", "Cutlery Sets", "Serving Trays", "Buffet Equipment", "Chafing Dishes", "Table Linen", "Menu Card Holders", "Salt & Pepper Shakers", "Napkin Dispensers"] },
            { name: "Packaging & Takeaway", items: ["Food Containers", "Paper Bags", "Delivery Boxes", "Cling Wrap", "Aluminium Foil", "Disposable Cutlery", "Branded Packaging", "Sauce Cups", "Tamper-Proof Seals", "Thermal Bags"] },
            { name: "Bar Equipment & Supplies", items: ["Cocktail Shakers", "Bar Blenders", "Ice Crushers", "Beer Taps", "Wine Coolers", "Bar Counter Setup", "Bottle Display Racks", "Jiggers & Strainers", "Glassware Racks", "Bar Mats"] },
            { name: "Digital Products", items: ["Digital Menu Templates", "Restaurant Website Builder", "Online Ordering Platform", "Food Photography Presets", "Marketing Banner Templates", "Social Media Content Kit", "Loyalty Card Design", "Table Reservation System", "Kitchen SOP Templates", "Staff Training Modules"] },
        ],
        services: [
            { name: "Restaurant Management Services", items: ["Table Reservation Management", "Queue Management System", "Multi-Branch Management", "Franchise Operations", "Menu Engineering", "Cost Control Consulting", "Restaurant Analytics", "Inventory Tracking", "Vendor Management", "Waste Management"] },
            { name: "Food Delivery & Ordering", items: ["Online Order Management", "Delivery Fleet Management", "Zomato Integration", "Swiggy Integration", "WhatsApp Ordering", "Dine-In QR Ordering", "Takeaway Management", "Catering Order Management", "Corporate Meal Planning", "Subscription Meal Service"] },
            { name: "Marketing & Branding", items: ["Restaurant Branding", "Social Media Marketing", "Influencer Marketing", "Google My Business Setup", "Food Photography Service", "Menu Design Service", "Review Management", "Email Marketing", "SMS Campaign Management", "Festival Promotion Campaigns"] },
            { name: "Staff & HR Services", items: ["Chef Recruitment", "Staff Training Programs", "Attendance Management", "Payroll Processing", "Performance Tracking", "Shift Scheduling", "Tip Management", "Compliance Training", "Food Safety Certification", "FSSAI License Assistance"] },
            { name: "Finance & Compliance", items: ["GST Billing & Filing", "Accounting & Bookkeeping", "Profit & Loss Analysis", "Food Cost Analytics", "Tax Planning", "FSSAI Compliance", "Fire Safety Compliance", "Liquor License Assistance", "Insurance Advisory", "Audit Services"] },
            { name: "Technology Solutions", items: ["Restaurant CRM Software", "Kitchen Automation", "AI-Based Demand Forecasting", "Customer Feedback System", "Loyalty Program Software", "Table Management Software", "Waitlist Management", "Digital Menu Board", "Smart Kitchen Integration", "Cloud-Based Restaurant ERP"] },
        ]
    },

    // ═══════════════════════════════════════════════════════════════════
    // 2. RETAIL STORES
    // ═══════════════════════════════════════════════════════════════════
    "retail": {
        products: [
            { name: "POS & Billing Hardware", items: ["Retail POS Terminal", "Barcode Scanner", "Label Printer", "Cash Drawer", "Receipt Printer", "Customer Display", "Weighing Scale Integration", "Card Swipe Machine", "UPI QR Stand", "Self-Checkout Kiosk"] },
            { name: "Store Fixtures & Display", items: ["Gondola Shelving", "Wall Display Units", "Glass Showcases", "Mannequins", "Pegboard Displays", "Counter Displays", "Signage Boards", "Price Tag Holders", "Shopping Baskets", "Shopping Carts"] },
            { name: "Packaging Materials", items: ["Branded Shopping Bags", "Gift Wrapping Supplies", "Packing Tape", "Bubble Wrap", "Corrugated Boxes", "Tissue Paper", "Stickers & Labels", "Thank You Cards", "Carry Bags", "Eco-Friendly Packaging"] },
            { name: "Security Systems", items: ["CCTV Cameras", "Anti-Theft Tags", "EAS Systems", "Access Control", "Alarm Systems", "Cash Safe", "Security Mirrors", "People Counter", "Metal Detectors", "Guard Patrol System"] },
            { name: "Digital Products", items: ["E-Commerce Website Template", "Product Catalogue Software", "Inventory Management App", "Loyalty Program Platform", "Digital Price Tags", "Store Layout Planner", "Sales Analytics Dashboard", "Customer Feedback App", "Social Commerce Integration", "WhatsApp Store Builder"] },
        ],
        services: [
            { name: "Store Management", items: ["Inventory Management", "Stock Replenishment", "Multi-Store Management", "Franchise Operations", "Warehouse Management", "Vendor Management", "Purchase Order System", "Dead Stock Analysis", "Demand Forecasting", "Category Management"] },
            { name: "Sales & CRM", items: ["Customer Loyalty Programs", "CRM & Customer Database", "Membership Management", "Gift Card System", "Discount & Coupon Engine", "Cross-Selling Automation", "Customer Segmentation", "Purchase History Tracking", "Birthday & Anniversary Offers", "Referral Programs"] },
            { name: "E-Commerce & Online Sales", items: ["Online Store Setup", "Product Listing Services", "Order Fulfillment", "Last-Mile Delivery", "Return & Exchange Management", "Omnichannel Integration", "Social Commerce Setup", "Marketplace Listing", "WhatsApp Commerce", "Cash on Delivery Management"] },
            { name: "Marketing Services", items: ["Local SEO Optimization", "Google Ads Management", "Social Media Marketing", "WhatsApp Marketing", "In-Store Promotions", "Festive Campaign Management", "Influencer Collaboration", "Print Media Advertising", "Loyalty Marketing", "Email Newsletter Campaigns"] },
            { name: "Finance & Accounting", items: ["GST Billing & Returns", "Accounts Receivable", "Accounts Payable", "Profit Margin Analysis", "Expense Tracking", "Bank Reconciliation", "Tax Filing Services", "Financial Reporting", "Cash Flow Management", "Audit Preparation"] },
            { name: "Staff Management", items: ["Employee Scheduling", "Attendance Tracking", "Sales Incentive Management", "Training Programs", "Performance Reviews", "Payroll Processing", "Commission Tracking", "Recruitment Services", "Compliance Training", "HR Documentation"] },
        ]
    },

    // ═══════════════════════════════════════════════════════════════════
    // 3. HEALTHCARE & CLINICS
    // ═══════════════════════════════════════════════════════════════════
    "healthcare": {
        products: [
            { name: "Medical Equipment", items: ["Diagnostic Machines", "Blood Pressure Monitors", "ECG Machines", "Pulse Oximeters", "Stethoscopes", "Examination Tables", "Weighing Scales", "Thermometers", "Glucometers", "Nebulizers"] },
            { name: "Pharmacy Products", items: ["OTC Medicines", "Prescription Drugs", "Ayurvedic Products", "Homeopathy Products", "Surgical Supplies", "First Aid Kits", "Medical Disposables", "Syringes & Needles", "Vitamins & Supplements", "Health Monitors"] },
            { name: "Clinic Furniture", items: ["Patient Chairs", "Waiting Room Seating", "Medical Cabinets", "Instrument Trolleys", "IV Stands", "Privacy Screens", "Storage Units", "Desk Systems", "Examination Lights", "Sterilization Equipment"] },
            { name: "Digital Health Products", items: ["Clinic Management Software", "EMR/EHR System", "Telemedicine Platform", "Online Prescription App", "Patient Portal", "Health Tracking Wearables", "Digital X-Ray System", "Lab Report Software", "Appointment Booking App", "Medical Billing Software"] },
        ],
        services: [
            { name: "Patient Management", items: ["Appointment Scheduling", "Patient Registration", "Electronic Health Records", "Prescription Management", "Follow-Up Reminders", "Waiting Queue Management", "Multi-Doctor Scheduling", "Patient History Tracking", "Insurance Claim Processing", "Referral Management"] },
            { name: "Clinical Services", items: ["Telemedicine Consultations", "Lab Test Management", "Diagnostic Imaging", "Pharmacy Integration", "Home Visit Management", "Emergency Services", "Specialist Referrals", "Second Opinion Platform", "Health Screening Programs", "Vaccination Management"] },
            { name: "Revenue & Billing", items: ["Medical Billing Software", "Insurance Claims Processing", "GST Compliance", "Revenue Cycle Management", "Payment Gateway Integration", "EMI & Installment Plans", "Corporate Health Billing", "Multi-Branch Billing", "Financial Reporting", "Expense Management"] },
            { name: "Marketing & Growth", items: ["Doctor Listing SEO", "Google My Business Setup", "Patient Review Management", "Social Media Marketing", "Health Blog Content", "WhatsApp Communication", "Email Health Newsletters", "Referral Bonus Program", "Community Health Camps", "Video Marketing"] },
            { name: "Compliance & Quality", items: ["HIPAA Compliance", "NABH Accreditation Support", "Clinical Audit Services", "Quality Assurance", "Staff Credential Management", "Medical Waste Management", "Infection Control", "Patient Safety Protocols", "Regulatory Filing", "Legal Documentation"] },
            { name: "Staff & Operations", items: ["Doctor Recruitment", "Nurse Staffing", "Training & Certification", "Attendance & Shift Management", "Payroll Processing", "Performance Analytics", "Duty Roster Management", "Locum Doctor Services", "Administrative Support", "Facility Maintenance"] },
        ]
    },

    // ═══════════════════════════════════════════════════════════════════
    // 4. REAL ESTATE
    // ═══════════════════════════════════════════════════════════════════
    "real-estate": {
        products: [
            { name: "Property Technology", items: ["CRM for Real Estate", "Property Listing Software", "Virtual Tour Software", "3D Floor Plan Tools", "Lead Management System", "Broker Management App", "Rental Management Software", "Property Valuation Tools", "MLS Integration", "Document Management System"] },
            { name: "Marketing Materials", items: ["Property Brochure Templates", "Site Signage", "Business Cards", "Flyer Templates", "Social Media Templates", "Email Campaign Templates", "Video Tour Equipment", "Drone Photography Kit", "LED Display Boards", "Branded Merchandise"] },
            { name: "Office Equipment", items: ["Office Furniture", "Presentation Screens", "Visitor Management System", "Conference Equipment", "Projectors", "Whiteboards", "Filing Systems", "Customer Seating", "Scale Models", "Plot Marking Equipment"] },
        ],
        services: [
            { name: "Property Management", items: ["Rental Property Management", "Tenant Screening", "Lease Management", "Rent Collection Automation", "Maintenance Coordination", "Property Inspection", "Vacancy Management", "Eviction Processing", "Security Deposit Management", "HOA Management"] },
            { name: "Sales & Brokerage", items: ["Property Listing Services", "Buyer Matching", "Site Visit Scheduling", "Negotiation Support", "Registration Assistance", "Home Loan Facilitation", "Legal Due Diligence", "Title Verification", "RERA Compliance", "Stamp Duty Calculation"] },
            { name: "Marketing & Lead Generation", items: ["Property Portal Listing", "Google Ads for Real Estate", "Social Media Campaigns", "WhatsApp Marketing", "Virtual Property Tours", "Drone Photography", "SEO for Real Estate", "Content Marketing", "Email Drip Campaigns", "Referral Programs"] },
            { name: "Valuation & Advisory", items: ["Property Valuation", "Market Analysis Reports", "Investment Advisory", "Portfolio Management", "Commercial Lease Advisory", "Land Acquisition Consulting", "Feasibility Studies", "Project Planning", "Risk Assessment", "Tax Planning"] },
            { name: "Legal & Compliance", items: ["RERA Registration", "Agreement Drafting", "Title Search", "Encumbrance Certificate", "Property Tax Filing", "Mutation Processing", "NOC Procurement", "Khata Transfer", "Building Plan Approval", "Environmental Clearance"] },
        ]
    },

    // ═══════════════════════════════════════════════════════════════════
    // 5. PROFESSIONAL SERVICES
    // ═══════════════════════════════════════════════════════════════════
    "professional-services": {
        products: [
            { name: "Business Software", items: ["Project Management Tool", "Time Tracking Software", "Invoice Generator", "Proposal Builder", "Contract Management", "Document Collaboration", "Client Portal Software", "Resource Planning Tool", "Budget Tracker", "Expense Manager"] },
            { name: "Office Supplies", items: ["Stationery Supplies", "Presentation Equipment", "Office Furniture", "Conference Tools", "Printers & Scanners", "Networking Equipment", "Storage Solutions", "Whiteboards & Markers", "Filing Cabinets", "Business Card Printing"] },
        ],
        services: [
            { name: "Client Management", items: ["Client Onboarding", "CRM & Pipeline Management", "Client Communication Portal", "Feedback Collection", "Contract Lifecycle Management", "Retainer Management", "SLA Tracking", "Client Reporting Dashboard", "Relationship Analytics", "Referral Tracking"] },
            { name: "Project Delivery", items: ["Project Planning & Scoping", "Task Assignment & Tracking", "Milestone Management", "Agile Workflow Management", "Resource Allocation", "Quality Assurance", "Deliverable Management", "Time & Material Billing", "Project Retrospectives", "Risk Management"] },
            { name: "Financial Services", items: ["Invoicing & Billing", "Accounts Receivable", "Expense Management", "Tax Filing & Compliance", "Financial Reporting", "Cash Flow Forecasting", "Payroll Processing", "Revenue Recognition", "Budget Planning", "Audit Preparation"] },
            { name: "HR & Team Management", items: ["Recruitment & Hiring", "Employee Onboarding", "Performance Reviews", "Training & Development", "Attendance Management", "Leave Management", "Team Scheduling", "Compensation Planning", "Employee Engagement", "Exit Management"] },
            { name: "Marketing & Business Development", items: ["Website Development", "SEO & Content Marketing", "LinkedIn Marketing", "Thought Leadership Content", "Webinar Hosting", "Case Study Creation", "Email Campaigns", "Networking Events", "Proposal Automation", "Brand Strategy"] },
        ]
    },

    // ═══════════════════════════════════════════════════════════════════
    // 6. EDUCATION & COACHING
    // ═══════════════════════════════════════════════════════════════════
    "education": {
        products: [
            { name: "EdTech Products", items: ["Learning Management System", "Online Exam Platform", "Student Information System", "Attendance App", "Fee Management Software", "Virtual Classroom Tool", "AI Tutoring Platform", "Quiz & Assessment Builder", "Certificate Generator", "Parent Communication App"] },
            { name: "Classroom Equipment", items: ["Interactive Whiteboards", "Projectors", "Tablets for Students", "Lab Equipment", "STEM Kits", "Art & Craft Supplies", "Library Management System", "Language Lab Setup", "Science Lab Instruments", "Sports Equipment"] },
            { name: "Study Materials", items: ["Printed Study Notes", "Practice Workbooks", "Previous Year Papers", "Model Test Papers", "Reference Books", "Digital Flashcards", "Video Course Packages", "Audio Lectures", "E-Books & PDFs", "Mind Map Templates"] },
        ],
        services: [
            { name: "Student Management", items: ["Admission Management", "Batch & Division Management", "Student Attendance Tracking", "Performance Analytics", "Report Card Generation", "Student ID Card System", "Alumni Management", "Scholarship Management", "Disciplinary Records", "Transfer Certificate Processing"] },
            { name: "Academic Services", items: ["Curriculum Planning", "Lesson Plan Management", "Assignment Submission System", "Online Test Conducting", "Doubt Resolution Platform", "Parent-Teacher Meeting Scheduling", "Progress Report Sharing", "Homework Tracker", "Plagiarism Check", "Grading & Assessment"] },
            { name: "Fee & Finance", items: ["Fee Collection & Tracking", "Online Fee Payment Gateway", "Installment Plan Management", "Late Fee Calculation", "Scholarship Disbursement", "Expense Tracking", "Revenue Reporting", "Tax Compliance", "Refund Processing", "Financial Aid Management"] },
            { name: "Communication & Engagement", items: ["Parent Notification System", "SMS & WhatsApp Alerts", "Circular Distribution", "Event Announcements", "Newsletter Publishing", "Feedback Collection", "Complaint Management", "Community Forum", "Push Notifications", "Email Campaigns"] },
            { name: "Marketing & Growth", items: ["Institute Website Development", "Google Ads for Education", "Social Media Marketing", "Lead Generation Campaigns", "Open House Event Management", "Referral Programs", "YouTube Channel Setup", "Content Marketing", "Testimonial Collection", "Brand Building Services"] },
        ]
    },

    // ═══════════════════════════════════════════════════════════════════
    // 7. HOME SERVICES
    // ═══════════════════════════════════════════════════════════════════
    "home-services": {
        products: [
            { name: "Cleaning Products", items: ["Cleaning Chemicals", "Floor Cleaners", "Glass Cleaners", "Disinfectants", "Vacuum Cleaners", "Steam Cleaners", "Mops & Brushes", "Microfiber Cloths", "Pressure Washers", "Air Purifiers"] },
            { name: "Tools & Equipment", items: ["Power Drills", "Plumbing Tools", "Electrical Tools", "Painting Equipment", "Carpentry Tools", "Safety Gear", "Ladders & Scaffolding", "Measuring Instruments", "Welding Equipment", "Generator Sets"] },
            { name: "Smart Home Products", items: ["Smart Locks", "Security Cameras", "Motion Sensors", "Smart Lighting", "Video Doorbells", "Home Automation Hub", "Smart Thermostat", "Water Leak Detectors", "Smoke Detectors", "Smart Plugs"] },
        ],
        services: [
            { name: "Cleaning Services", items: ["Deep Home Cleaning", "Regular House Cleaning", "Kitchen Deep Cleaning", "Bathroom Sanitization", "Sofa & Carpet Cleaning", "Mattress Cleaning", "Water Tank Cleaning", "Move-In/Move-Out Cleaning", "Post-Construction Cleaning", "Office Cleaning"] },
            { name: "Plumbing Services", items: ["Pipe Repair & Installation", "Drain Cleaning & Unclogging", "Water Heater Installation", "Tap & Faucet Repair", "Toilet Repair", "Water Purifier Installation", "Water Tank Installation", "Leak Detection", "Sewer Line Repair", "Bathroom Renovation"] },
            { name: "Electrical Services", items: ["Wiring & Rewiring", "Switch & Socket Installation", "Fan Installation", "Light Fitting", "Inverter Installation", "MCB & Circuit Repair", "Generator Installation", "CCTV Installation", "Doorbell Installation", "Earthing Services"] },
            { name: "Painting & Renovation", items: ["Interior Painting", "Exterior Painting", "Waterproofing", "Wall Texture & Design", "False Ceiling Installation", "Wallpaper Installation", "Wood Polishing", "Tile & Flooring", "Kitchen Remodeling", "Bathroom Renovation"] },
            { name: "Pest Control", items: ["Cockroach Control", "Termite Treatment", "Bed Bug Treatment", "Mosquito Control", "Rodent Control", "Ant Treatment", "Wood Borer Treatment", "Pre-Construction Treatment", "Fumigation Services", "Herbal Pest Control"] },
            { name: "Appliance Services", items: ["AC Service & Repair", "Washing Machine Repair", "Refrigerator Repair", "Microwave Repair", "TV Installation & Repair", "Chimney Service", "RO Service", "Geyser Repair", "Dishwasher Service", "AC Installation"] },
        ]
    },

    // ═══════════════════════════════════════════════════════════════════
    // 8. ELECTRONICS
    // ═══════════════════════════════════════════════════════════════════
    "electronics": {
        products: [
            { name: "Computers & Laptops", items: ["Desktop Computers", "Laptops", "All-in-One PCs", "Gaming Laptops", "Chromebooks", "Mini PCs", "Workstations", "Refurbished Laptops", "Laptop Accessories", "Docking Stations"] },
            { name: "Mobile & Tablets", items: ["Smartphones", "Tablets", "Feature Phones", "Smartwatches", "Phone Cases & Covers", "Screen Protectors", "Chargers & Cables", "Power Banks", "Bluetooth Earbuds", "Phone Stands"] },
            { name: "Networking Equipment", items: ["WiFi Routers", "Network Switches", "Access Points", "Modems", "Ethernet Cables", "Network Storage (NAS)", "Range Extenders", "Firewalls", "VPN Routers", "PoE Switches"] },
            { name: "Components & Parts", items: ["Hard Drives & SSDs", "RAM Modules", "Processors", "Graphics Cards", "Power Supplies", "Motherboards", "Cooling Fans", "Computer Cases", "Keyboards & Mice", "Monitors"] },
        ],
        services: [
            { name: "Repair & Maintenance", items: ["Laptop Repair", "Desktop Repair", "Mobile Screen Repair", "Data Recovery", "Virus Removal", "Software Installation", "Hardware Upgrade", "Battery Replacement", "Printer Repair", "Projector Repair"] },
            { name: "IT Solutions", items: ["Network Setup", "Server Installation", "Cloud Migration", "Cybersecurity Solutions", "Email Setup & Migration", "Backup Solutions", "CCTV Installation", "Biometric Setup", "Intercom Systems", "IT Infrastructure Planning"] },
            { name: "Sales & Support", items: ["Product Consultation", "Custom PC Building", "Bulk Procurement", "Corporate IT Supply", "Extended Warranty Plans", "AMC Contracts", "Trade-In Programs", "Product Demonstrations", "Installation Services", "Post-Sales Support"] },
            { name: "Marketing & Growth", items: ["E-Commerce Store Setup", "Product Photography", "SEO for Electronics Stores", "Google Shopping Ads", "Social Media Campaigns", "WhatsApp Catalogue", "YouTube Product Reviews", "Influencer Marketing", "Festive Sale Campaigns", "Customer Loyalty Programs"] },
        ]
    },

    // ═══════════════════════════════════════════════════════════════════
    // 9. FASHION & APPAREL
    // ═══════════════════════════════════════════════════════════════════
    "fashion": {
        products: [
            { name: "Men's Fashion", items: ["Formal Shirts", "Casual Shirts", "T-Shirts", "Trousers", "Jeans", "Blazers & Suits", "Ethnic Wear: Kurtas", "Ethnic Wear: Sherwanis", "Jackets & Sweaters", "Accessories: Ties & Belts"] },
            { name: "Women's Fashion", items: ["Sarees", "Salwar Suits", "Kurtis", "Lehengas", "Western Dresses", "Tops & Tunics", "Jeans & Palazzos", "Ethnic Dupattas", "Lingerie & Innerwear", "Bags & Clutches"] },
            { name: "Kids' Fashion", items: ["Boys' Clothing", "Girls' Clothing", "School Uniforms", "Party Wear", "Infant Clothing", "Kids' Footwear", "Kids' Accessories", "Rainwear", "Sleepwear", "Sportswear"] },
            { name: "Footwear", items: ["Formal Shoes", "Casual Shoes", "Sports Shoes", "Sandals & Slippers", "Heels & Wedges", "Boots", "Loafers", "Sneakers", "Ethnic Footwear", "Shoe Care Products"] },
            { name: "Accessories & Jewellery", items: ["Watches", "Sunglasses", "Handbags", "Wallets", "Fashion Jewellery", "Hair Accessories", "Scarves & Stoles", "Hats & Caps", "Brooches & Pins", "Cufflinks"] },
        ],
        services: [
            { name: "Retail & Store Management", items: ["Inventory Management", "Visual Merchandising", "Store Layout Planning", "POS Billing System", "Size & Color Tracking", "Season Planning", "Markdown Management", "Barcode & RFID Tagging", "Vendor Management", "Multi-Store Sync"] },
            { name: "E-Commerce & Online Sales", items: ["Online Store Setup", "Product Photography", "Catalogue Management", "Marketplace Integration", "Order Fulfillment", "Return & Exchange Handling", "Size Guide Creation", "Virtual Try-On", "Social Commerce", "Dropshipping Setup"] },
            { name: "Design & Manufacturing", items: ["Fashion Design Services", "Pattern Making", "Custom Tailoring", "Bulk Manufacturing", "Fabric Sourcing", "Quality Inspection", "Sample Development", "Private Label Production", "Embroidery & Printing", "Packaging Design"] },
            { name: "Marketing & Branding", items: ["Fashion Brand Building", "Influencer Marketing", "Social Media Strategy", "Lookbook Creation", "Fashion Show Management", "PR & Media Coverage", "Seasonal Campaign Planning", "Email Marketing", "WhatsApp Marketing", "Celebrity Endorsement"] },
        ]
    },

    // ═══════════════════════════════════════════════════════════════════
    // 10. AUTOMOTIVE
    // ═══════════════════════════════════════════════════════════════════
    "automotive": {
        products: [
            { name: "Auto Parts & Spares", items: ["Engine Parts", "Brake Pads & Discs", "Filters: Oil, Air, Fuel", "Spark Plugs", "Batteries", "Clutch Plates", "Suspension Parts", "Timing Belts", "Radiators", "Exhaust Systems"] },
            { name: "Accessories & Add-ons", items: ["Car Seat Covers", "Floor Mats", "Dash Cameras", "GPS Trackers", "Car Perfumes", "Sun Shades", "Steering Covers", "Phone Holders", "LED Lights", "Alloy Wheels"] },
            { name: "Lubricants & Fluids", items: ["Engine Oil", "Brake Fluid", "Coolant", "Transmission Fluid", "Power Steering Fluid", "Windshield Washer Fluid", "Grease", "Chain Lube", "Car Polish", "Car Shampoo"] },
            { name: "Garage Equipment", items: ["Car Lifts & Hoists", "Wheel Alignment Machine", "Tyre Changer", "Diagnostic Scanner", "Air Compressor", "Jack & Jack Stands", "Tool Chests", "Welding Machine", "Paint Booth", "Workbench"] },
        ],
        services: [
            { name: "Vehicle Servicing", items: ["Regular Servicing", "Engine Tuning", "Oil Change", "Brake Service", "AC Service & Gas Fill", "Wheel Alignment", "Wheel Balancing", "Tyre Rotation", "Battery Check & Replacement", "Clutch Repair"] },
            { name: "Repair & Restoration", items: ["Engine Overhaul", "Transmission Repair", "Electrical Repair", "Body Denting & Painting", "Bumper Repair", "Windshield Replacement", "Suspension Repair", "Exhaust System Repair", "Interior Restoration", "Classic Car Restoration"] },
            { name: "Detailing & Care", items: ["Car Washing", "Interior Detailing", "Exterior Polish", "Ceramic Coating", "PPF Application", "Underbody Coating", "Engine Bay Cleaning", "Headlight Restoration", "Leather Conditioning", "Odor Removal Treatment"] },
            { name: "Garage Management", items: ["Garage Billing Software", "Job Card Management", "Customer Database", "Service History Tracking", "Parts Inventory Management", "Mechanic Assignment", "Estimate & Quotation", "Vehicle Pickup & Drop", "Insurance Claim Handling", "Annual Maintenance Contracts"] },
        ]
    },

    // ═══════════════════════════════════════════════════════════════════
    // 11. TRAVEL & TOURISM
    // ═══════════════════════════════════════════════════════════════════
    "travel-tourism": {
        products: [
            { name: "Travel Technology", items: ["Booking Engine Software", "Tour Package Builder", "Travel CRM", "Itinerary Planner", "Hotel Booking System", "Flight Booking API", "Travel Agency Website", "Customer Portal", "Mobile Travel App", "Payment Gateway"] },
            { name: "Travel Merchandise", items: ["Travel Bags & Luggage", "Travel Accessories", "Neck Pillows", "Travel Adapters", "Portable Chargers", "Packing Cubes", "Travel Wallets", "Waterproof Bags", "First Aid Kits", "Branded Merchandise"] },
        ],
        services: [
            { name: "Tour Packages", items: ["Domestic Tour Packages", "International Tour Packages", "Honeymoon Packages", "Family Vacation Packages", "Adventure Tour Packages", "Pilgrimage Tours", "Weekend Getaways", "Corporate Retreat Planning", "Customized Itineraries", "Group Tour Management"] },
            { name: "Booking Services", items: ["Hotel Booking", "Flight Booking", "Train Booking", "Bus Booking", "Car Rental", "Airport Transfers", "Cruise Booking", "Travel Insurance", "Visa Assistance", "Forex Services"] },
            { name: "Business Operations", items: ["Travel Agency CRM", "Lead Management", "Quotation Management", "Vendor Partner Management", "Commission Tracking", "B2B Agent Portal", "White Label Solutions", "Accounting & Billing", "Staff Management", "Multi-Branch Operations"] },
            { name: "Marketing & Growth", items: ["Travel Website SEO", "Google Ads Campaigns", "Social Media Marketing", "Travel Blog Content", "YouTube Travel Vlogs", "Influencer Collaboration", "WhatsApp Marketing", "Email Nurture Campaigns", "Review Management", "Referral Programs"] },
        ]
    },

    // ═══════════════════════════════════════════════════════════════════
    // 12. FITNESS & WELLNESS (User's detailed example)
    // ═══════════════════════════════════════════════════════════════════
    "fitness-wellness": {
        products: [
            { name: "Supplements & Nutrition", items: ["Whey Protein", "Whey Isolate", "Casein Protein", "Plant-Based Protein", "Mass Gainer", "Creatine", "Pre-Workout", "BCAA", "EAA", "Glutamine", "L-Carnitine", "Multivitamins", "Fish Oil & Omega-3", "Vitamin D", "Collagen", "Ashwagandha", "Protein Bars", "Energy Bars", "Peanut Butter", "Electrolyte Drinks"] },
            { name: "Commercial Gym Equipment", items: ["Treadmills", "Cross Trainers", "Ellipticals", "Spin Bikes", "Recumbent Bikes", "Rowing Machines", "Stair Climbers", "Chest Press Machine", "Leg Press Machine", "Smith Machine", "Lat Pulldown", "Hack Squat", "Cable Crossover", "Functional Trainer"] },
            { name: "Free Weights & Functional", items: ["Dumbbells", "Barbells", "Weight Plates", "Kettlebells", "Medicine Balls", "Slam Balls", "Battle Ropes", "TRX Straps", "Resistance Bands", "Plyo Boxes", "Agility Ladder", "Sandbags", "Sled Push"] },
            { name: "Home Fitness Equipment", items: ["Adjustable Dumbbells", "Home Gym Station", "Compact Treadmill", "Foldable Exercise Bike", "Pull-Up Bar", "Ab Roller", "Skipping Rope", "Foam Roller", "Yoga Mat", "Mini Stepper"] },
            { name: "Apparel & Accessories", items: ["Gym T-Shirts", "Compression Wear", "Sports Bras", "Leggings", "Gym Shorts", "Training Shoes", "Gym Gloves", "Lifting Belts", "Wrist Wraps", "Knee Sleeves", "Shaker Bottles", "Gym Bags", "Sweat Towels"] },
            { name: "Smart Fitness Tech", items: ["Smart Watches", "Fitness Trackers", "Heart Rate Monitors", "Smart Scales", "Posture Correctors", "Massage Guns", "AI Coaching Platforms", "Workout Tracking Apps"] },
        ],
        services: [
            { name: "Membership Services", items: ["Monthly Membership", "Quarterly Membership", "Half-Yearly Membership", "Annual Membership", "Pay-Per-Session", "Day Pass", "Corporate Membership", "Couple Membership", "Student Membership", "Premium VIP Membership"] },
            { name: "Personal Training", items: ["1-on-1 Personal Training", "Partner Training", "Small Group Training", "Online Personal Training", "Hybrid Coaching", "Strength & Conditioning", "Fat Loss Coaching", "Muscle Gain Coaching", "Functional Training", "Transformation Coaching"] },
            { name: "Group Classes", items: ["HIIT", "Circuit Training", "Bootcamp", "CrossFit Style", "Zumba", "Aerobics", "Dance Fitness", "Power Yoga", "Pilates", "Barre", "Spin Class", "Kickboxing Fitness", "Boxing Fitness", "Core Training", "Mobility & Stretching"] },
            { name: "Specialized Programs", items: ["Weight Loss Programs", "Weight Gain Programs", "Body Transformation", "Athlete Training", "Kids Fitness", "Senior Fitness", "Pre & Post Natal Fitness", "Rehab Fitness", "Posture Correction", "Injury Recovery"] },
            { name: "Nutrition & Diet Services", items: ["Diet Consultation", "Custom Diet Plans", "Sports Nutrition Planning", "Supplement Consultation", "Calorie Tracking Coaching", "Meal Planning", "Keto Coaching", "Vegan Diet Coaching", "PCOS Diet Planning", "Diabetic Diet Planning"] },
            { name: "Assessments & Diagnostics", items: ["Body Composition Analysis", "InBody Scan", "BMI Check", "Fat Percentage Test", "BMR Testing", "VO2 Max Testing", "Flexibility Assessment", "Strength Assessment", "Posture Analysis", "Metabolic Testing"] },
            { name: "Recovery & Therapy", items: ["Sports Massage", "Deep Tissue Massage", "Stretch Therapy", "Cryotherapy", "Ice Bath Sessions", "Sauna", "Steam Bath", "Physiotherapy", "Chiropractic Care", "Cupping Therapy"] },
            { name: "B2B Gym Services", items: ["Gym Management Software", "Billing & Membership Software", "CRM for Gyms", "Lead Generation", "Influencer Marketing", "Social Media Management", "Gym Branding", "Website Development", "Equipment Financing", "Franchise Consulting"] },
        ]
    },

    // ═══════════════════════════════════════════════════════════════════
    // 13. EVENTS & ENTERTAINMENT
    // ═══════════════════════════════════════════════════════════════════
    "events-entertainment": {
        products: [
            { name: "Event Equipment", items: ["Sound Systems", "LED Screens", "Projectors", "Stage Lighting", "DJ Equipment", "Stage Setup Materials", "Gensets & Power Backup", "Tents & Canopies", "Red Carpet & Runners", "Barricades & Stanchions"] },
            { name: "Decoration & Props", items: ["Flower Arrangements", "Balloon Decorations", "Theme Props", "Photo Booth Equipment", "Backdrops & Banners", "Table Centerpieces", "Chair Covers", "Fairy Lights", "Confetti Machines", "Fog Machines"] },
            { name: "Event Tech Products", items: ["Event Management Software", "Ticketing Platform", "Registration Kiosk", "Attendee Badge Printer", "Event App Builder", "Live Streaming Equipment", "Feedback Collection App", "Seating Plan Software", "Event CRM", "RSVP Tracker"] },
        ],
        services: [
            { name: "Event Planning", items: ["Wedding Planning", "Corporate Event Planning", "Birthday Party Planning", "Conference Organizing", "Exhibition Management", "Product Launch Events", "Gala Dinners", "Charity Events", "Cultural Festivals", "Award Ceremonies"] },
            { name: "Vendor Management", items: ["Caterer Coordination", "Venue Booking", "Photographer Booking", "Entertainment Booking", "Transport Arrangement", "Florist Coordination", "Makeup & Styling", "Security Arrangement", "Valet Parking", "Accommodation Booking"] },
            { name: "Technical Services", items: ["Sound Engineering", "Lighting Design", "Stage Design & Setup", "AV Equipment Rental", "Live Streaming Services", "Video Production", "Event Photography", "Drone Coverage", "LED Wall Setup", "Projection Mapping"] },
            { name: "Marketing & Ticketing", items: ["Event Marketing Campaigns", "Social Media Promotion", "Ticket Sales Management", "Email Blast Campaigns", "Influencer Event Marketing", "Press Release Distribution", "Event Website Creation", "Online Registration Setup", "Sponsorship Management", "Post-Event Analytics"] },
        ]
    },

    // ═══════════════════════════════════════════════════════════════════
    // 14. IT & SOFTWARE AGENCIES
    // ═══════════════════════════════════════════════════════════════════
    "it-software-agencies": {
        products: [
            { name: "Software Products", items: ["Custom CRM Solutions", "ERP Systems", "Mobile Applications", "Web Applications", "SaaS Platforms", "E-Commerce Solutions", "AI & ML Products", "Chatbot Solutions", "API Integration Tools", "Business Intelligence Dashboards"] },
            { name: "Infrastructure Products", items: ["Cloud Hosting Solutions", "Server Hardware", "Networking Equipment", "Cybersecurity Tools", "Backup & Recovery Solutions", "VPN Solutions", "Firewall Appliances", "Load Balancers", "CDN Services", "DevOps Tools"] },
        ],
        services: [
            { name: "Development Services", items: ["Web Development", "Mobile App Development", "Custom Software Development", "API Development", "E-Commerce Development", "WordPress Development", "React & Next.js Development", "Backend Development", "Database Design", "UI/UX Design"] },
            { name: "Cloud & Infrastructure", items: ["Cloud Migration", "AWS Management", "Azure Services", "Google Cloud Solutions", "Server Management", "DevOps & CI/CD", "Container Orchestration", "Microservices Architecture", "Infrastructure Monitoring", "Disaster Recovery"] },
            { name: "Digital Marketing", items: ["SEO Services", "Google Ads Management", "Social Media Marketing", "Content Marketing", "Email Marketing Automation", "Conversion Rate Optimization", "Analytics & Reporting", "Brand Strategy", "Video Marketing", "Influencer Outreach"] },
            { name: "Support & Maintenance", items: ["24/7 Technical Support", "Application Maintenance", "Bug Fixing & Patching", "Performance Optimization", "Security Audits", "Code Reviews", "Database Optimization", "Server Monitoring", "Compliance Management", "SLA-Based Support"] },
        ]
    },

    // ═══════════════════════════════════════════════════════════════════
    // 15. LEGAL SERVICES
    // ═══════════════════════════════════════════════════════════════════
    "legal-services": {
        products: [
            { name: "Legal Tech Products", items: ["Case Management Software", "Contract Management Tool", "Legal Document Templates", "E-Signature Platform", "Legal Research Database", "Billing & Time Tracking", "Client Portal Software", "Court Calendar System", "Compliance Tracker", "Document Automation Tool"] },
        ],
        services: [
            { name: "Corporate Legal", items: ["Company Registration", "GST Registration", "Trademark Registration", "Copyright Filing", "Patent Filing", "FSSAI License", "Import Export License", "MSME Registration", "Shop & Establishment License", "ISO Certification"] },
            { name: "Litigation Services", items: ["Civil Litigation", "Criminal Defense", "Consumer Court Cases", "Arbitration & Mediation", "Property Disputes", "Family Law Cases", "Employment Disputes", "Intellectual Property Disputes", "Tax Litigation", "Cyber Crime Cases"] },
            { name: "Documentation Services", items: ["Agreement Drafting", "Will & Estate Planning", "Power of Attorney", "Affidavit Preparation", "Legal Notice Drafting", "MOU Preparation", "NDA Drafting", "Partnership Deeds", "Lease Agreements", "Sale Deed Preparation"] },
            { name: "Compliance & Advisory", items: ["Regulatory Compliance", "Tax Advisory", "Corporate Governance", "HR Legal Compliance", "Data Privacy (DPDP Act)", "Anti-Money Laundering", "Environmental Compliance", "Labour Law Advisory", "Real Estate Legal Advisory", "Startup Legal Advisory"] },
        ]
    },

    // ═══════════════════════════════════════════════════════════════════
    // 16. NONPROFITS & CHARITIES
    // ═══════════════════════════════════════════════════════════════════
    "nonprofits-charities": {
        products: [
            { name: "NGO Management Tools", items: ["Donor Management Software", "Volunteer Management App", "Fundraising Platform", "Grant Management Tool", "Event Management System", "Impact Reporting Dashboard", "Communication Platform", "Accounting Software for NGOs", "CRM for Nonprofits", "Project Tracking Tool"] },
        ],
        services: [
            { name: "Fundraising Services", items: ["Online Donation Platform", "Crowdfunding Campaign", "Corporate CSR Partnerships", "Grant Writing Services", "Charity Event Organizing", "Recurring Donation Setup", "Donor Communication", "Fundraising Analytics", "Peer-to-Peer Fundraising", "Legacy Giving Programs"] },
            { name: "Operations & Compliance", items: ["NGO Registration (12A, 80G)", "FCRA Compliance", "Annual Audit Services", "Tax Exemption Filing", "Board Governance Support", "Financial Reporting", "Program Impact Assessment", "Volunteer Coordination", "Beneficiary Tracking", "Regulatory Filing"] },
            { name: "Marketing & Awareness", items: ["Social Media Campaigns", "Website Development", "Content & Storytelling", "Video Documentary Production", "Email Newsletter", "Press & Media Relations", "Community Outreach Programs", "Brand Identity Creation", "Annual Report Design", "Digital Advertising"] },
        ]
    },

    // ═══════════════════════════════════════════════════════════════════
    // 17. PHOTOGRAPHY & VIDEOGRAPHY
    // ═══════════════════════════════════════════════════════════════════
    "photography-videography": {
        products: [
            { name: "Camera Equipment", items: ["DSLR Cameras", "Mirrorless Cameras", "Camera Lenses", "Tripods & Monopods", "Camera Bags", "Memory Cards", "Batteries & Chargers", "Camera Straps", "Lens Filters", "Camera Cleaning Kits"] },
            { name: "Lighting Equipment", items: ["Studio Flash Lights", "Softboxes", "Ring Lights", "LED Panels", "Light Stands", "Reflectors", "Diffusers", "Background Lights", "Continuous Lighting", "Portable Flash Units"] },
            { name: "Video Equipment", items: ["Video Cameras", "Gimbals & Stabilizers", "Microphones", "Teleprompters", "Green Screens", "Sliders & Dollies", "Drone Cameras", "Action Cameras", "Monitor & Recorders", "Video Editing Workstations"] },
            { name: "Software & Digital", items: ["Photo Editing Software", "Video Editing Software", "Preset & LUT Packs", "Portfolio Website Builder", "Client Gallery Platform", "Invoice & Contract Templates", "Booking Management App", "Cloud Storage Solutions", "Watermark Tools", "Social Media Templates"] },
        ],
        services: [
            { name: "Photography Services", items: ["Wedding Photography", "Pre-Wedding Shoots", "Portrait Photography", "Product Photography", "Food Photography", "Real Estate Photography", "Event Photography", "Corporate Headshots", "Fashion Photography", "Maternity & Newborn Shoots"] },
            { name: "Videography Services", items: ["Wedding Videography", "Corporate Videos", "Product Demo Videos", "Social Media Reels", "Documentary Production", "Music Video Production", "Testimonial Videos", "Drone Videography", "Live Event Streaming", "YouTube Content Creation"] },
            { name: "Post-Production", items: ["Photo Retouching", "Color Grading", "Video Editing", "Album Design", "Cinematic Trailer Editing", "Motion Graphics", "Special Effects (VFX)", "Audio Mixing", "Subtitle & Caption Addition", "Highlight Reel Creation"] },
            { name: "Business Services", items: ["Studio Rental", "Equipment Rental", "Photography Workshops", "Mentorship Programs", "Client CRM Management", "Booking & Scheduling", "Payment & Invoicing", "Portfolio Review", "Brand Photography Consulting", "Social Media Marketing"] },
        ]
    },

    // ═══════════════════════════════════════════════════════════════════
    // 18. LOGISTICS & TRANSPORT
    // ═══════════════════════════════════════════════════════════════════
    "logistics-transport": {
        products: [
            { name: "Fleet Management Tech", items: ["GPS Tracking Devices", "Dash Cameras", "Fleet Management Software", "Fuel Cards", "Load Planning Software", "Route Optimization Tool", "Driver Mobile App", "Vehicle Inspection App", "Telematics Devices", "ELD Compliance Tools"] },
            { name: "Warehouse Products", items: ["Pallet Racking", "Forklifts", "Packing Machines", "Weighing Scales", "Barcode Scanners", "Conveyor Belts", "Storage Bins", "Hand Trolleys", "Shrink Wrap Machines", "Loading Dock Equipment"] },
        ],
        services: [
            { name: "Transport Services", items: ["Full Truck Load (FTL)", "Part Load (PTL/LTL)", "Express Delivery", "Last-Mile Delivery", "Cold Chain Logistics", "Container Transport", "Oversized Cargo", "Hazardous Goods Transport", "Inter-City Freight", "Local Delivery Services"] },
            { name: "Warehouse & Storage", items: ["Warehousing Solutions", "Inventory Management", "Order Fulfillment", "Pick & Pack Services", "Cross-Docking", "Cold Storage", "Bonded Warehousing", "Returns Processing", "Quality Inspection", "Kitting & Assembly"] },
            { name: "Fleet Operations", items: ["Fleet Tracking & Monitoring", "Driver Management", "Fuel Management", "Maintenance Scheduling", "Compliance & Documentation", "Insurance Management", "Route Planning", "Vehicle Procurement", "Tyre Management", "Accident Reporting"] },
            { name: "Business Solutions", items: ["Supply Chain Consulting", "Logistics Software Implementation", "Transport Management System", "Warehouse Management System", "Freight Audit & Payment", "Customs Brokerage", "Import/Export Documentation", "E-Commerce Logistics", "Reverse Logistics", "Analytics & Reporting"] },
        ]
    },

    // ═══════════════════════════════════════════════════════════════════
    // 19. SALONS & SPAS
    // ═══════════════════════════════════════════════════════════════════
    "salons-spas": {
        products: [
            { name: "Hair Care Products", items: ["Shampoos & Conditioners", "Hair Color & Dye", "Hair Styling Products", "Hair Oils & Serums", "Hair Treatment Kits", "Keratin Products", "Hair Extension", "Hair Spray & Gel", "Heat Protectants", "Hair Masks"] },
            { name: "Skin Care Products", items: ["Facial Kits", "Moisturizers", "Sunscreen", "Face Wash & Cleansers", "Face Masks & Packs", "Anti-Aging Products", "Acne Treatment", "Toners & Serums", "Exfoliators", "Eye Creams"] },
            { name: "Salon Equipment", items: ["Styling Chairs", "Hair Dryers", "Straighteners & Curlers", "Salon Mirrors", "Wash Basins", "Trolleys & Carts", "Sterilizers", "Towel Warmers", "Pedicure Stations", "Manicure Tables"] },
            { name: "Spa Products", items: ["Massage Oils", "Aromatherapy Oils", "Body Scrubs", "Body Wraps", "Hot Stones", "Paraffin Wax", "Spa Robes & Towels", "Diffusers", "Candles", "Bath Salts"] },
            { name: "Nail Care Products", items: ["Nail Polish", "Gel Polish", "Acrylic Nail Kits", "Nail Art Supplies", "Nail Lamps", "Cuticle Tools", "Nail Files & Buffers", "Nail Extensions", "Nail Stickers", "Removal Solutions"] },
        ],
        services: [
            { name: "Hair Services", items: ["Haircut & Styling", "Hair Coloring", "Hair Highlights", "Keratin Treatment", "Hair Spa", "Hair Rebonding", "Hair Smoothening", "Scalp Treatment", "Hair Extensions", "Bridal Hair Styling"] },
            { name: "Skin & Beauty Services", items: ["Facials", "Cleanup", "Bleach & De-Tan", "Threading & Waxing", "Body Polishing", "Chemical Peels", "Microdermabrasion", "Laser Treatment", "Acne Treatment", "Anti-Aging Therapy"] },
            { name: "Spa & Wellness", items: ["Swedish Massage", "Deep Tissue Massage", "Aromatherapy Massage", "Thai Massage", "Hot Stone Massage", "Body Wrap", "Hydrotherapy", "Reflexology", "Head Massage", "Couple Spa Package"] },
            { name: "Nail Services", items: ["Manicure", "Pedicure", "Gel Nails", "Acrylic Nails", "Nail Art", "French Manicure", "Paraffin Wax Treatment", "Nail Repair", "Dip Powder Nails", "Nail Extensions"] },
            { name: "Bridal & Makeup", items: ["Bridal Makeup", "Party Makeup", "Engagement Makeup", "Pre-Bridal Package", "Mehendi Service", "Makeup Consultation", "Airbrush Makeup", "HD Makeup", "Editorial Makeup", "Grooming Packages"] },
            { name: "B2B Salon Services", items: ["Salon Management Software", "Appointment Booking System", "Staff Scheduling", "Inventory Management", "Customer CRM", "Loyalty Program Setup", "Social Media Marketing", "Google My Business Setup", "Website Development", "Franchise Consulting"] },
        ]
    },

    // ═══════════════════════════════════════════════════════════════════
    // 20. CLEANING SERVICES
    // ═══════════════════════════════════════════════════════════════════
    "cleaning-services": {
        products: [
            { name: "Cleaning Equipment", items: ["Commercial Vacuum Cleaners", "Floor Scrubbers", "Pressure Washers", "Steam Cleaners", "Carpet Cleaning Machines", "Window Cleaning Kits", "Mops & Buckets", "Squeegees", "Polishing Machines", "Wet/Dry Vacuums"] },
            { name: "Cleaning Chemicals", items: ["All-Purpose Cleaners", "Floor Cleaners", "Glass Cleaners", "Disinfectants", "Toilet Cleaners", "Degreasers", "Stain Removers", "Air Fresheners", "Hand Sanitizers", "Eco-Friendly Cleaners"] },
            { name: "Safety & PPE", items: ["Rubber Gloves", "Safety Goggles", "Face Masks", "Safety Shoes", "Overalls & Aprons", "First Aid Kits", "Wet Floor Signs", "Chemical Labels", "Waste Disposal Bags", "Spill Kits"] },
        ],
        services: [
            { name: "Residential Cleaning", items: ["Regular House Cleaning", "Deep Cleaning", "Kitchen Cleaning", "Bathroom Cleaning", "Sofa & Carpet Cleaning", "Mattress Cleaning", "Balcony & Terrace Cleaning", "Move-In Cleaning", "Move-Out Cleaning", "Post-Renovation Cleaning"] },
            { name: "Commercial Cleaning", items: ["Office Cleaning", "Retail Store Cleaning", "Warehouse Cleaning", "Hospital Cleaning", "Hotel Housekeeping", "Restaurant Kitchen Cleaning", "Gym Cleaning", "School & College Cleaning", "Industrial Cleaning", "IT Park Cleaning"] },
            { name: "Specialized Cleaning", items: ["Window Cleaning (High-Rise)", "Tank & Sump Cleaning", "Facade Cleaning", "Solar Panel Cleaning", "HVAC Duct Cleaning", "Grease Trap Cleaning", "Marble Polishing", "Floor Stripping & Waxing", "Upholstery Cleaning", "Anti-Bacterial Sanitization"] },
            { name: "Pest Control Services", items: ["General Pest Control", "Cockroach Control", "Termite Treatment", "Bed Bug Treatment", "Mosquito Control", "Rodent Control", "Ant Control", "Wood Borer Treatment", "Fumigation", "Herbal Pest Control"] },
            { name: "Business Management", items: ["Cleaning Business Software", "Job Scheduling & Dispatch", "Staff Management", "Client CRM", "Invoicing & Billing", "Quality Inspection Reports", "Inventory Tracking", "Customer Feedback System", "Route Planning", "Marketing & Lead Generation"] },
        ]
    },

    // ═══════════════════════════════════════════════════════════════════
    // REMAINING: jewellery, food-delivery, pet-care (not in categories-data.ts but referenced in SEO links)
    // These are not needed since they don't have category detail pages
    // ═══════════════════════════════════════════════════════════════════

};
