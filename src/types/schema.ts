import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, decimal, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table with role-based access
// Note: Passwords are managed by Supabase Auth, not stored here
export const users = pgTable("users", {
  id: varchar("id").primaryKey(), // UUID from Supabase Auth or generated
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"), // For JWT auth (nullable for backward compatibility)
  role: text("role").notNull().default("vendor"), // 'vendor', 'admin', 'employee', 'customer'
  modulePermissions: json("module_permissions").$type<string[]>().default([]), // Module permissions for employees
  // Employee details (nullable, used for admin-created employees)
  name: text("name"), // Full name
  phone: text("phone"), // Phone number
  department: text("department"), // Department/team
  jobRole: text("job_role"), // Job title/role
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Industry categories and subcategories for vendor onboarding
export const INDUSTRY_CATEGORIES = {
  "Healthcare": ["Hospitals", "Clinics", "Diagnostic Centers", "Pharmacies", "Dental Clinics", "Eye Clinics", "Physiotherapy Centers", "Mental Health Centers"],
  "Fitness Centers": ["Gyms", "Yoga Studios", "CrossFit Boxes", "Dance Studios", "Martial Arts Centers", "Personal Training Studios", "Sports Academies"],
  "Education": ["Schools", "Coaching Centers", "Tuition Centers", "Computer Training", "Language Learning", "Music Classes", "Art Classes", "Skill Development"],
  "Real Estate": ["Property Dealers", "Real Estate Consultants", "Property Management", "Interior Designers", "Architects"],
  "Beauty Salons": ["Unisex Salons", "Ladies Salons", "Men's Salons", "Spas", "Nail Studios", "Makeup Studios", "Hair Treatment Centers"],
  "Hostel & PG": ["Student Hostels", "Working Professional PG", "Paying Guest", "Co-living Spaces", "Dormitories"],
  "Restaurants": ["Fine Dining", "Casual Dining", "Fast Food", "Cafes", "Food Courts", "Cloud Kitchens", "Bakeries", "Sweet Shops"],
  "Professional Services": ["Chartered Accountants", "Legal Services", "Consulting", "Marketing Agencies", "IT Services", "Event Management", "Photography Studios"],
  "Food & Beverage": ["Grocery Stores", "Supermarkets", "Bakeries", "Juice Centers", "Ice Cream Parlors", "Sweet Shops", "Catering Services"],
  "Fashion": ["Boutiques", "Clothing Stores", "Footwear Shops", "Jewelry Stores", "Accessories", "Tailoring Services"],
  "Renting Services": ["Vehicle Rental", "Equipment Rental", "Party Equipment", "Furniture Rental", "Electronics Rental", "Sports Equipment Rental"],
  "Repairing Services": ["Mobile Repair", "Computer Repair", "Appliance Repair", "Vehicle Repair", "Watch Repair", "Shoe Repair"],
  "Home Services": ["Plumbing", "Electrical", "Carpentry", "Painting", "Cleaning Services", "Pest Control", "Home Maintenance", "AC Repair"],
  "Others": ["Custom Category"]
} as const;

// Vendors table - business information
export const vendors = pgTable("vendors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  businessName: text("business_name").notNull(),
  ownerName: text("owner_name").notNull(), // Primary Contact / Owner Name
  category: text("category").notNull(), // Industry category
  subcategory: text("subcategory").notNull(), // Subcategory within industry
  customCategory: text("custom_category"), // For "Others" category
  customSubcategory: text("custom_subcategory"), // For "Others" subcategory
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  whatsappNumber: text("whatsapp_number").notNull(),
  street: text("street").notNull(), // Street address
  city: text("city").notNull(),
  state: text("state").notNull(),
  pincode: text("pincode").notNull(),
  address: text("address").notNull(), // Full combined address
  logo: text("logo"),
  banner: text("banner"),
  description: text("description").notNull(), // Short description (50-200 chars)
  licenseNumber: text("license_number"),
  gstNumber: text("gst_number"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  status: text("status").notNull().default("approved"), // 'pending', 'approved', 'suspended' - Auto-approve new vendors
  onboardingComplete: boolean("onboarding_complete").notNull().default(false),
  bankAccountName: text("bank_account_name"),
  bankAccountNumber: text("bank_account_number"),
  bankIfscCode: text("bank_ifsc_code"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertVendorSchema = createInsertSchema(vendors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertVendor = z.infer<typeof insertVendorSchema>;
export type Vendor = typeof vendors.$inferSelect;

// ========== SUBSCRIPTION & BILLING MODULE ==========

// Subscription Plans table - defines available pricing tiers
export const subscriptionPlans = pgTable("subscription_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // e.g., "Free", "Starter", "Pro", "Enterprise"
  displayName: text("display_name").notNull(), // e.g., "Starter Plan"
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(), // Monthly price
  currency: text("currency").notNull().default("INR"),
  billingInterval: text("billing_interval").notNull().default("month"), // 'month', 'year'
  
  // Feature Limits
  maxServices: integer("max_services").default(-1), // -1 = unlimited
  maxProducts: integer("max_products").default(-1),
  maxEmployees: integer("max_employees").default(-1),
  maxCustomers: integer("max_customers").default(-1),
  maxOrders: integer("max_orders").default(-1), // Per month
  maxBookings: integer("max_bookings").default(-1), // Per month
  maxAppointments: integer("max_appointments").default(-1), // Per month
  maxStorageGB: integer("max_storage_gb").default(1),
  
  // Premium Features
  hasAdvancedAnalytics: boolean("has_advanced_analytics").default(false),
  hasPrioritySupport: boolean("has_priority_support").default(false),
  hasCustomDomain: boolean("has_custom_domain").default(false),
  hasMiniWebsite: boolean("has_mini_website").default(false),
  hasWhiteLabel: boolean("has_white_label").default(false),
  hasAPI: boolean("has_api").default(false),
  hasMultiLocation: boolean("has_multi_location").default(false),
  
  // Plan Settings
  isActive: boolean("is_active").notNull().default(true),
  isPopular: boolean("is_popular").default(false), // Highlight popular plans
  displayOrder: integer("display_order").default(0),
  trialDays: integer("trial_days").default(0), // Free trial period
  
  // Stripe Integration
  stripeProductId: text("stripe_product_id"), // Stripe product ID
  stripePriceId: text("stripe_price_id"), // Stripe price ID
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;

// Vendor Subscriptions table - tracks current subscription for each vendor
export const vendorSubscriptions = pgTable("vendor_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id),
  planId: varchar("plan_id").notNull().references(() => subscriptionPlans.id),
  
  // Subscription Status
  status: text("status").notNull().default("active"), // 'trial', 'active', 'past_due', 'canceled', 'expired'
  
  // Billing Dates
  startDate: timestamp("start_date").notNull().defaultNow(),
  currentPeriodStart: timestamp("current_period_start").notNull().defaultNow(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  trialEndDate: timestamp("trial_end_date"),
  canceledAt: timestamp("canceled_at"),
  endedAt: timestamp("ended_at"),
  
  // Stripe Integration
  stripeSubscriptionId: text("stripe_subscription_id"), // Stripe subscription ID
  stripeCustomerId: text("stripe_customer_id"), // Stripe customer ID

  // Razorpay Integration
  razorpayOrderId: text("razorpay_order_id"), // Razorpay order ID
  razorpayPaymentId: text("razorpay_payment_id"), // Razorpay payment ID
  paymentStatus: text("payment_status").default("pending"), // 'pending', 'completed', 'failed'

  // Usage Tracking (reset monthly)
  currentMonthOrders: integer("current_month_orders").default(0),
  currentMonthBookings: integer("current_month_bookings").default(0),
  currentMonthAppointments: integer("current_month_appointments").default(0),
  lastUsageReset: timestamp("last_usage_reset").defaultNow(),
  
  // Auto-renewal
  autoRenew: boolean("auto_renew").default(true),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Custom schema that accepts string dates for date fields
export const insertVendorSubscriptionSchema = createInsertSchema(vendorSubscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  startDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  currentPeriodStart: z.string().optional().transform(val => val ? new Date(val) : undefined),
  currentPeriodEnd: z.string().transform(val => new Date(val)),
  trialEndDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  canceledAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
  endedAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
  lastUsageReset: z.string().optional().transform(val => val ? new Date(val) : undefined),
});

export type InsertVendorSubscription = z.infer<typeof insertVendorSubscriptionSchema>;
export type VendorSubscription = typeof vendorSubscriptions.$inferSelect;

// Billing History table - records all payment transactions
export const billingHistory = pgTable("billing_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id),
  subscriptionId: varchar("subscription_id").references(() => vendorSubscriptions.id),
  planId: varchar("plan_id").notNull().references(() => subscriptionPlans.id),
  
  // Transaction Details
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("INR"),
  status: text("status").notNull(), // 'pending', 'succeeded', 'failed', 'refunded'
  paymentMethod: text("payment_method"), // 'card', 'upi', 'netbanking', 'wallet'
  
  // Invoice Details
  invoiceNumber: text("invoice_number"),
  invoiceUrl: text("invoice_url"),
  description: text("description"),
  
  // Billing Period
  periodStart: timestamp("period_start"),
  periodEnd: timestamp("period_end"),
  
  // Stripe Integration
  stripeInvoiceId: text("stripe_invoice_id"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripeChargeId: text("stripe_charge_id"),
  
  // Payment Details
  paidAt: timestamp("paid_at"),
  failureReason: text("failure_reason"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBillingHistorySchema = createInsertSchema(billingHistory).omit({
  id: true,
  createdAt: true,
});

export type InsertBillingHistory = z.infer<typeof insertBillingHistorySchema>;
export type BillingHistory = typeof billingHistory.$inferSelect;

// Usage Logs table - detailed tracking of feature usage
export const usageLogs = pgTable("usage_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id),
  
  // Usage Metrics
  feature: text("feature").notNull(), // 'order', 'booking', 'appointment', 'service', 'product', 'employee', 'customer'
  action: text("action").notNull(), // 'create', 'update', 'delete'
  resourceId: text("resource_id"), // ID of the created/modified resource
  
  // Metadata
  metadata: json("metadata"), // Additional context
  
  logDate: timestamp("log_date").notNull().defaultNow(),
});

export const insertUsageLogSchema = createInsertSchema(usageLogs).omit({
  id: true,
});

export type InsertUsageLog = z.infer<typeof insertUsageLogSchema>;
export type UsageLog = typeof usageLogs.$inferSelect;

// ========== MASTER DATA MANAGEMENT MODULE ==========

// Categories table - global and vendor-specific categories
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  logo: text("logo"), // Logo URL or image path
  createdBy: text("created_by").notNull(), // "admin" or vendor_id
  isGlobal: boolean("is_global").notNull().default(false), // True if admin-defined
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

// Subcategories table - linked to categories
export const subcategories = pgTable("subcategories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  categoryId: varchar("category_id").notNull().references(() => categories.id),
  name: text("name").notNull(),
  logo: text("logo"), // Logo URL or image path
  createdBy: text("created_by").notNull(), // "admin" or vendor_id
  isGlobal: boolean("is_global").notNull().default(false), // True if admin-defined
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSubcategorySchema = createInsertSchema(subcategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSubcategory = z.infer<typeof insertSubcategorySchema>;
export type Subcategory = typeof subcategories.$inferSelect;

// Brands table - mapped under categories
export const brands = pgTable("brands", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  categoryId: varchar("category_id").notNull().references(() => categories.id),
  name: text("name").notNull(),
  logo: text("logo"), // Logo URL or image path
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertBrandSchema = createInsertSchema(brands).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBrand = z.infer<typeof insertBrandSchema>;
export type Brand = typeof brands.$inferSelect;

// Units table - measurement units linked to subcategories
export const units = pgTable("units", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subcategoryId: varchar("subcategory_id").notNull().references(() => subcategories.id),
  name: text("name").notNull(), // e.g., "Pieces", "Kilograms", "Hours"
  code: text("code").notNull(), // Short code: "pcs", "kg", "hr"
  createdBy: text("created_by").notNull(), // "admin" or vendor_id
  isGlobal: boolean("is_global").notNull().default(false), // True if admin-defined
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUnitSchema = createInsertSchema(units).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUnit = z.infer<typeof insertUnitSchema>;
export type Unit = typeof units.$inferSelect;

// Master Services table - created by admin
export const masterServices = pgTable("master_services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Basic Service Information
  name: text("name").notNull(),
  categoryId: varchar("category_id").references(() => categories.id),
  category: text("category").notNull(), // Fallback text for custom categories
  subcategoryId: varchar("subcategory_id").references(() => subcategories.id),
  subcategory: text("subcategory"), // Fallback text for custom subcategories
  customUnit: text("custom_unit"), // per session, per month, per visit, per package
  serviceType: text("service_type").notNull().default("one-time"), // one-time, subscription, package
  icon: text("icon").notNull(), // emoji or icon identifier
  
  // Description & Details
  shortDescription: text("short_description"),
  detailedDescription: text("detailed_description"),
  description: text("description").notNull(), // Kept for backward compatibility
  benefits: text("benefits").array().notNull().default(sql`ARRAY[]::text[]`),
  features: text("features").array().notNull().default(sql`ARRAY[]::text[]`),
  highlights: text("highlights").array().notNull().default(sql`ARRAY[]::text[]`),
  inclusions: text("inclusions").array().notNull().default(sql`ARRAY[]::text[]`),
  exclusions: text("exclusions").array().notNull().default(sql`ARRAY[]::text[]`),
  tags: text("tags").array().notNull().default(sql`ARRAY[]::text[]`),
  
  // Pricing & Availability
  basePrice: integer("base_price"), // Base price in rupees
  offerPrice: integer("offer_price"), // Discounted price
  taxPercentage: integer("tax_percentage").default(0), // GST percentage
  gstIncluded: boolean("gst_included").default(false),
  availableDays: text("available_days").array().default(sql`ARRAY[]::text[]`), // ["Monday", "Tuesday", etc.]
  availableTimeSlots: text("available_time_slots").array().default(sql`ARRAY[]::text[]`), // ["9:00-10:00", "14:00-15:00"]
  bookingRequired: boolean("booking_required").default(false),
  freeTrialAvailable: boolean("free_trial_available").default(false),
  
  // Package Details (for package type services)
  packageName: text("package_name"),
  packageType: text("package_type"), // fixed-duration, session-based
  packageDuration: text("package_duration"), // 1-month, 3-months, yearly
  packageSessions: integer("package_sessions"), // 10, 25, etc.
  
  // Media & Branding
  images: text("images").array().default(sql`ARRAY[]::text[]`),
  thumbnailImage: text("thumbnail_image"),
  bannerImage: text("banner_image"),
  tagline: text("tagline"),
  promotionalCaption: text("promotional_caption"),
  
  // Linked Modules
  linkedOffers: text("linked_offers").array().default(sql`ARRAY[]::text[]`),
  linkedProducts: text("linked_products").array().default(sql`ARRAY[]::text[]`),
  linkedPackages: text("linked_packages").array().default(sql`ARRAY[]::text[]`),
  
  // Legacy fields (kept for backward compatibility)
  sampleType: text("sample_type"),
  tat: text("tat"),
  
  // Meta
  isUniversal: boolean("is_universal").notNull().default(true),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertMasterServiceSchema = createInsertSchema(masterServices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertMasterService = z.infer<typeof insertMasterServiceSchema>;
export type MasterService = typeof masterServices.$inferSelect;

// Vendor Catalogues table - vendor's customized services
export const vendorCatalogues = pgTable("vendor_catalogues", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id),
  masterServiceId: varchar("master_service_id").references(() => masterServices.id),
  customServiceRequestId: varchar("custom_service_request_id"),
  
  // Basic Service Information
  name: text("name").notNull(),
  categoryId: varchar("category_id").references(() => categories.id),
  category: text("category").notNull(),
  subcategoryId: varchar("subcategory_id").references(() => subcategories.id),
  subcategory: text("subcategory"),
  customUnit: text("custom_unit"),
  serviceType: text("service_type").notNull().default("one-time"),
  icon: text("icon").notNull(),
  
  // Description & Details
  shortDescription: text("short_description"),
  detailedDescription: text("detailed_description"),
  description: text("description").notNull(),
  benefits: text("benefits").array().notNull().default(sql`ARRAY[]::text[]`),
  features: text("features").array().notNull().default(sql`ARRAY[]::text[]`),
  highlights: text("highlights").array().notNull().default(sql`ARRAY[]::text[]`),
  inclusions: text("inclusions").array().notNull().default(sql`ARRAY[]::text[]`),
  exclusions: text("exclusions").array().notNull().default(sql`ARRAY[]::text[]`),
  tags: text("tags").array().notNull().default(sql`ARRAY[]::text[]`),
  
  // Pricing & Availability
  price: integer("price").notNull(), // Vendor's base price
  offerPrice: integer("offer_price"), // Vendor's offer price
  taxPercentage: integer("tax_percentage").default(0),
  gstIncluded: boolean("gst_included").default(false),
  availableDays: text("available_days").array().default(sql`ARRAY[]::text[]`),
  availableTimeSlots: text("available_time_slots").array().default(sql`ARRAY[]::text[]`),
  bookingRequired: boolean("booking_required").default(false),
  freeTrialAvailable: boolean("free_trial_available").default(false),
  
  // Package Details
  packageName: text("package_name"),
  packageType: text("package_type"),
  packageDuration: text("package_duration"),
  packageSessions: integer("package_sessions"),
  
  // Media & Branding
  images: text("images").array().default(sql`ARRAY[]::text[]`),
  thumbnailImage: text("thumbnail_image"),
  bannerImage: text("banner_image"),
  tagline: text("tagline"),
  promotionalCaption: text("promotional_caption"),
  
  // Linked Modules
  linkedOffers: text("linked_offers").array().default(sql`ARRAY[]::text[]`),
  linkedProducts: text("linked_products").array().default(sql`ARRAY[]::text[]`),
  linkedPackages: text("linked_packages").array().default(sql`ARRAY[]::text[]`),
  
  // Legacy fields
  sampleType: text("sample_type"),
  tat: text("tat"),
  homeCollectionAvailable: boolean("home_collection_available").notNull().default(false),
  homeCollectionCharges: integer("home_collection_charges").default(0),
  discountPercentage: integer("discount_percentage").default(0),
  
  // Meta
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertVendorCatalogueSchema = createInsertSchema(vendorCatalogues).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertVendorCatalogue = z.infer<typeof insertVendorCatalogueSchema>;
export type VendorCatalogue = typeof vendorCatalogues.$inferSelect;

// Custom Service Requests table - vendor requests for new services
export const customServiceRequests = pgTable("custom_service_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id),
  name: text("name").notNull(),
  category: text("category").notNull(),
  icon: text("icon").notNull(),
  description: text("description").notNull(),
  inclusions: text("inclusions").array().notNull().default(sql`ARRAY[]::text[]`),
  exclusions: text("exclusions").array().notNull().default(sql`ARRAY[]::text[]`),
  tags: text("tags").array().notNull().default(sql`ARRAY[]::text[]`),
  sampleType: text("sample_type"),
  tat: text("tat"),
  basePrice: integer("base_price"),
  status: text("status").notNull().default("pending"), // 'pending', 'approved', 'rejected'
  adminNotes: text("admin_notes"),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  madeUniversal: boolean("made_universal").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCustomServiceRequestSchema = createInsertSchema(customServiceRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  reviewedAt: true,
});

export type InsertCustomServiceRequest = z.infer<typeof insertCustomServiceRequestSchema>;
export type CustomServiceRequest = typeof customServiceRequests.$inferSelect;

// Additional Services table - premium services created by admin for vendors to purchase
export const additionalServices = pgTable("additional_services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  shortDescription: text("short_description"),
  icon: text("icon").notNull().default("💼"),
  category: text("category"),
  price: integer("price"), // Optional pricing info
  features: text("features").array().default(sql`ARRAY[]::text[]`),
  benefits: text("benefits").array().default(sql`ARRAY[]::text[]`),
  images: text("images").array().default(sql`ARRAY[]::text[]`),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAdditionalServiceSchema = createInsertSchema(additionalServices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAdditionalService = z.infer<typeof insertAdditionalServiceSchema>;
export type AdditionalService = typeof additionalServices.$inferSelect;

// Additional Service Inquiries table - vendor inquiries for additional services
export const additionalServiceInquiries = pgTable("additional_service_inquiries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceId: varchar("service_id").notNull().references(() => additionalServices.id),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id),
  vendorName: text("vendor_name").notNull(),
  vendorEmail: text("vendor_email").notNull(),
  vendorPhone: text("vendor_phone").notNull(),
  vendorWhatsapp: text("vendor_whatsapp"),
  businessName: text("business_name"),
  requirement: text("requirement").notNull(), // Vendor's requirement description
  status: text("status").notNull().default("pending"), // 'pending', 'contacted', 'completed', 'cancelled'
  adminNotes: text("admin_notes"),
  contactedAt: timestamp("contacted_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAdditionalServiceInquirySchema = createInsertSchema(additionalServiceInquiries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAdditionalServiceInquiry = z.infer<typeof insertAdditionalServiceInquirySchema>;
export type AdditionalServiceInquiry = typeof additionalServiceInquiries.$inferSelect;

// Bookings table - service bookings (lab tests, diagnostics, etc.)
export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id),
  vendorCatalogueId: varchar("vendor_catalogue_id").notNull().references(() => vendorCatalogues.id),
  patientName: text("patient_name").notNull(),
  patientPhone: text("patient_phone").notNull(),
  patientEmail: text("patient_email"),
  patientAge: integer("patient_age"),
  patientGender: text("patient_gender"),
  bookingDate: timestamp("booking_date").notNull(),
  status: text("status").notNull().default("pending"), // 'pending', 'confirmed', 'completed', 'cancelled'
  isHomeCollection: boolean("is_home_collection").default(false),
  collectionAddress: text("collection_address"),
  assignedTo: varchar("assigned_to").references(() => users.id),
  price: integer("price").notNull(),
  homeCollectionCharges: integer("home_collection_charges").default(0),
  totalAmount: integer("total_amount").notNull(),
  paymentStatus: text("payment_status").default("pending"), // 'pending', 'paid', 'refunded'
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

// Appointments table - physical visit appointments (doctor consultations, clinic visits, etc.)
export const appointments = pgTable("appointments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id),
  patientName: text("patient_name").notNull(),
  patientPhone: text("patient_phone").notNull(),
  patientEmail: text("patient_email"),
  patientAge: integer("patient_age"),
  patientGender: text("patient_gender"),
  appointmentDate: timestamp("appointment_date").notNull(),
  appointmentTime: text("appointment_time").notNull(), // '10:00 AM', '2:30 PM', etc.
  purpose: text("purpose").notNull(), // Reason for visit
  doctorName: text("doctor_name"), // For doctor consultations
  department: text("department"), // For hospital/clinic visits
  status: text("status").notNull().default("pending"), // 'pending', 'confirmed', 'completed', 'cancelled'
  visitType: text("visit_type").notNull(), // 'consultation', 'follow-up', 'emergency', 'routine-checkup'
  assignedTo: varchar("assigned_to").references(() => users.id),
  notes: text("notes"),
  paymentStatus: text("payment_status").default("pending"), // 'pending', 'paid', 'refunded'
  consultationFee: integer("consultation_fee"), // Consultation charges
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointments.$inferSelect;

// Employees table - Enhanced for all business types
export const employees = pgTable("employees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id),
  userId: varchar("user_id").references(() => users.id),
  
  // Basic Personal Info
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  pincode: text("pincode"),
  dateOfBirth: timestamp("date_of_birth"),
  gender: text("gender"), // 'male', 'female', 'other'
  
  // Job Info
  role: text("role").notNull(), // Vendor-defined: 'trainer', 'coach', 'manager', 'technician', 'sales', etc.
  department: text("department"), // Optional department/team
  joiningDate: timestamp("joining_date").notNull().defaultNow(),
  employmentType: text("employment_type").notNull().default("full-time"), // 'full-time', 'part-time', 'contract'
  
  // Work Schedule
  shiftStartTime: text("shift_start_time"), // '09:00 AM'
  shiftEndTime: text("shift_end_time"), // '06:00 PM'
  workingDays: text("working_days").array().default(sql`ARRAY['Monday','Tuesday','Wednesday','Thursday','Friday']::text[]`),
  
  // Documents
  idProofType: text("id_proof_type"), // 'aadhar', 'pan', 'passport', 'driving_license'
  idProofNumber: text("id_proof_number"),
  idProofDocument: text("id_proof_document"), // URL to uploaded document
  certifications: text("certifications").array().default(sql`ARRAY[]::text[]`), // URLs to certificates
  
  // Payroll Info
  basicSalary: integer("basic_salary").default(0), // Monthly salary in rupees
  bankAccountNumber: text("bank_account_number"),
  bankIfscCode: text("bank_ifsc_code"),
  bankName: text("bank_name"),
  
  // System Fields
  permissions: text("permissions").array().notNull().default(sql`ARRAY[]::text[]`),
  avatar: text("avatar"),
  status: text("status").notNull().default("active"), // 'active', 'inactive', 'terminated'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Employee = typeof employees.$inferSelect;

// Tasks table - Enhanced with recurring tasks, reminders, checkboxes and categories
export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  
  // Categorization
  category: text("category").default("general"), // 'general', 'follow-up', 'inventory', 'billing', 'customer-service'
  tags: text("tags").array().notNull().default(sql`ARRAY[]::text[]`),
  
  // Priority and Status
  priority: text("priority").notNull().default("medium"), // 'low', 'medium', 'high', 'urgent'
  status: text("status").notNull().default("pending"), // 'pending', 'in_progress', 'completed', 'cancelled'
  
  // Dates and Reminders
  dueDate: timestamp("due_date"),
  reminderDate: timestamp("reminder_date"), // When to show reminder
  
  // Assignment (optional - for employee tasks)
  assignedTo: varchar("assigned_to").references(() => employees.id),
  
  // Recurring tasks support
  isRecurring: boolean("is_recurring").default(false),
  recurringFrequency: text("recurring_frequency"), // 'daily', 'weekly', 'monthly'
  recurringEndDate: timestamp("recurring_end_date"),
  
  // Attachments and verification
  attachments: text("attachments").array().default(sql`ARRAY[]::text[]`), // URLs to photos/files
  verificationRequired: boolean("verification_required").default(false),
  verifiedAt: timestamp("verified_at"),
  
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
  verifiedAt: true,
}).extend({
  dueDate: z.union([z.string(), z.date()]).transform(val => val ? new Date(val) : null).nullable().optional(),
  reminderDate: z.union([z.string(), z.date()]).transform(val => val ? new Date(val) : null).nullable().optional(),
});

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

// Attendance table - Clock-in/out and shift tracking
export const attendance = pgTable("attendance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id),
  employeeId: varchar("employee_id").notNull().references(() => employees.id),
  date: timestamp("date").notNull().defaultNow(),
  checkInTime: text("check_in_time").notNull(), // Time string like "09:30"
  checkOutTime: text("check_out_time"), // Time string like "17:30"
  shiftDuration: integer("shift_duration"), // Minutes worked
  status: text("status").notNull().default("present"), // 'present', 'absent', 'late', 'half-day'
  lateBy: integer("late_by").default(0), // Minutes late
  earlyLeaveBy: integer("early_leave_by").default(0), // Minutes left early
  notes: text("notes"), // Additional notes
  location: text("location"), // Clock-in location if tracked
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAttendanceSchema = createInsertSchema(attendance).omit({
  id: true,
  createdAt: true,
}).extend({
  date: z.union([z.string(), z.date()]).transform(val => val ? new Date(val) : new Date()),
});

export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type Attendance = typeof attendance.$inferSelect;

// Leaves table - Leave applications and balance
export const leaves = pgTable("leaves", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id),
  employeeId: varchar("employee_id").notNull().references(() => employees.id),
  leaveType: text("leave_type").notNull(), // 'casual', 'sick', 'emergency', 'annual'
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  numberOfDays: decimal("number_of_days", { precision: 4, scale: 2 }).notNull(), // Supports 0.25 (quarter), 0.5 (half), 1.0 (full)
  durationType: text("duration_type").notNull().default("full"), // 'full', 'half', 'quarter' - per day duration
  reason: text("reason").notNull(),
  status: text("status").notNull().default("pending"), // 'pending', 'approved', 'rejected'
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  documents: text("documents").array().default(sql`ARRAY[]::text[]`), // Medical certificates, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertLeaveSchema = createInsertSchema(leaves).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  startDate: z.union([z.string(), z.date()]).transform(val => val ? new Date(val) : new Date()),
  endDate: z.union([z.string(), z.date()]).transform(val => val ? new Date(val) : new Date()),
  numberOfDays: z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? parseFloat(val) : val),
  approvedBy: z.string().optional(),
  approvedAt: z.union([z.string(), z.date()]).transform(val => val ? new Date(val) : new Date()).optional(),
  documents: z.array(z.string()).optional(),
  rejectionReason: z.string().optional(),
});

export type InsertLeave = z.infer<typeof insertLeaveSchema>;
export type Leave = typeof leaves.$inferSelect;

// Leave Balance table - Track available leave days
export const leaveBalances = pgTable("leave_balances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id),
  employeeId: varchar("employee_id").notNull().references(() => employees.id),
  leaveType: text("leave_type").notNull(), // 'casual', 'sick', 'annual'
  totalDays: decimal("total_days", { precision: 4, scale: 2 }).notNull(), // Annual allocation (supports decimals)
  usedDays: decimal("used_days", { precision: 4, scale: 2 }).notNull().default(sql`0.00`),
  remainingDays: decimal("remaining_days", { precision: 4, scale: 2 }).notNull(),
  year: integer("year").notNull(), // Fiscal year
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertLeaveBalanceSchema = createInsertSchema(leaveBalances).omit({
  id: true,
  updatedAt: true,
});

export type InsertLeaveBalance = z.infer<typeof insertLeaveBalanceSchema>;
export type LeaveBalance = typeof leaveBalances.$inferSelect;

// Payroll table - Salary, overtime, bonuses
export const payroll = pgTable("payroll", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id),
  employeeId: varchar("employee_id").notNull().references(() => employees.id),
  month: integer("month").notNull(), // 1-12
  year: integer("year").notNull(),
  basicSalary: integer("basic_salary").notNull(),
  overtimeHours: integer("overtime_hours").default(0),
  overtimePay: integer("overtime_pay").default(0),
  bonuses: integer("bonuses").default(0),
  deductions: integer("deductions").default(0),
  netSalary: integer("net_salary").notNull(), // Total after all calculations
  paymentStatus: text("payment_status").notNull().default("pending"), // 'pending', 'paid'
  paymentDate: timestamp("payment_date"),
  paymentMethod: text("payment_method"), // 'bank_transfer', 'cash', 'cheque'
  notes: text("notes"),
  paySlipUrl: text("pay_slip_url"), // URL to generated pay slip PDF
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPayrollSchema = createInsertSchema(payroll).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  paymentDate: true,
});

export type InsertPayroll = z.infer<typeof insertPayrollSchema>;
export type Payroll = typeof payroll.$inferSelect;

// Holidays table - Track company holidays
export const holidays = pgTable("holidays", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id),
  name: text("name").notNull(), // Holiday name
  date: timestamp("date").notNull(),
  type: text("type").notNull().default("public"), // 'public', 'company', 'optional'
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertHolidaySchema = createInsertSchema(holidays).omit({
  id: true,
  createdAt: true,
});

export type InsertHoliday = z.infer<typeof insertHolidaySchema>;
export type Holiday = typeof holidays.$inferSelect;

// Customer Attendance table - Track customer check-ins (gym members, library visits, etc.)
export const customerAttendance = pgTable("customer_attendance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id),
  customerId: varchar("customer_id").notNull().references(() => customers.id),
  date: timestamp("date").notNull().defaultNow(),
  checkInTime: text("check_in_time").notNull(), // Time string like "09:30"
  checkOutTime: text("check_out_time"), // Time string like "17:30"
  duration: integer("duration"), // Minutes spent
  status: text("status").notNull().default("present"), // 'present', 'absent', 'no_show'
  activityType: text("activity_type"), // e.g., 'gym_session', 'library_visit', 'class_attended'
  notes: text("notes"), // Additional notes
  location: text("location"), // Location/branch if tracked
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCustomerAttendanceSchema = createInsertSchema(customerAttendance).omit({
  id: true,
  createdAt: true,
}).extend({
  date: z.union([z.string(), z.date()]).transform(val => val ? new Date(val) : new Date()),
});

export type InsertCustomerAttendance = z.infer<typeof insertCustomerAttendanceSchema>;
export type CustomerAttendance = typeof customerAttendance.$inferSelect;

// Coupons table
export const coupons = pgTable("coupons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id),
  code: text("code").notNull().unique(),
  description: text("description").notNull(),
  image: text("image"), // Coupon image URL
  discountType: text("discount_type").notNull(), // 'percentage', 'fixed'
  discountValue: integer("discount_value").notNull(),
  maxDiscount: integer("max_discount"), // Maximum discount amount for percentage discounts
  minOrderAmount: integer("min_order_amount").default(0),
  expiryDate: timestamp("expiry_date").notNull(),
  maxUsage: integer("max_usage").notNull(),
  maxUsagePerCustomer: integer("max_usage_per_customer"), // Limit uses per customer
  usedCount: integer("used_count").notNull().default(0),
  status: text("status").notNull().default("active"), // 'active', 'inactive', 'expired'
  
  // Order Source Segregation
  applicableOn: text("applicable_on").notNull().default("all"), // 'all', 'pos_only', 'online_only', 'miniwebsite_only'
  
  // Product/Service Application
  applicationType: text("application_type").notNull().default("all"), // 'all', 'specific_services', 'specific_products', 'specific_category'
  applicableServices: text("applicable_services").array().default(sql`ARRAY[]::text[]`), // Array of vendorCatalogueIds
  applicableProducts: text("applicable_products").array().default(sql`ARRAY[]::text[]`), // Array of vendorProductIds
  applicableCategories: text("applicable_categories").array().default(sql`ARRAY[]::text[]`), // Array of category names
  
  // Additional Criteria
  minimumQuantity: integer("minimum_quantity"), // Minimum items in order
  applicablePaymentMethods: text("applicable_payment_methods").array().default(sql`ARRAY[]::text[]`), // 'cash', 'upi', 'card', 'wallet'
  firstOrderOnly: boolean("first_order_only").default(false), // Only for first-time customers
  applicableDaysOfWeek: text("applicable_days_of_week").array().default(sql`ARRAY[]::text[]`), // 'monday', 'tuesday', etc.
  applicableTimeSlots: json("applicable_time_slots"), // { start: "09:00", end: "18:00" }
  
  // Terms and Conditions
  termsAndConditions: text("terms_and_conditions"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCouponSchema = createInsertSchema(coupons).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  expiryDate: z.union([z.date(), z.string().transform((val) => new Date(val))]),
});

export type InsertCoupon = z.infer<typeof insertCouponSchema>;
export type Coupon = typeof coupons.$inferSelect;

// Transactions table
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id),
  bookingId: varchar("booking_id").references(() => bookings.id),
  appointmentId: varchar("appointment_id").references(() => appointments.id),
  amount: integer("amount").notNull(),
  type: text("type").notNull(), // 'credit', 'debit'
  status: text("status").notNull().default("pending"), // 'pending', 'completed', 'failed'
  paymentMethod: text("payment_method"), // 'razorpay', 'cash', 'card'
  paymentId: text("payment_id"), // External payment gateway ID
  description: text("description"),
  metadata: json("metadata"), // Additional payment details
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

// Notifications table
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id), // Nullable for public notifications (e.g., mini-website orders)
  vendorId: varchar("vendor_id").references(() => vendors.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // 'appointment', 'payment', 'approval', 'task', 'general', 'info'
  read: boolean("read").notNull().default(false),
  link: text("link"),
  referenceType: text("reference_type"), // Type of referenced entity (e.g., 'leads', 'customers', 'orders')
  referenceId: varchar("reference_id"), // ID of the referenced entity
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// Master Products table - created by admin
export const masterProducts = pgTable("master_products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  
  // Master data integration - link to categories/subcategories
  categoryId: varchar("category_id").references(() => categories.id),
  category: text("category").notNull(), // Fallback text for custom categories
  subcategoryId: varchar("subcategory_id").references(() => subcategories.id),
  subcategory: text("subcategory"), // Fallback text for custom subcategories
  
  brand: text("brand"),
  icon: text("icon").notNull(), // emoji or icon identifier
  description: text("description").notNull(),
  specifications: text("specifications").array().notNull().default(sql`ARRAY[]::text[]`),
  tags: text("tags").array().notNull().default(sql`ARRAY[]::text[]`),
  
  basePrice: integer("base_price"), // Reference price in rupees
  unit: text("unit").notNull(), // 'piece', 'box', 'bottle', 'strip', 'kg', etc.
  
  // Object storage image keys (not URLs)
  imageKeys: text("image_keys").array().default(sql`ARRAY[]::text[]`), // Object storage keys
  images: text("images").array().default(sql`ARRAY[]::text[]`), // Legacy URL support
  
  requiresPrescription: boolean("requires_prescription").default(false),
  isUniversal: boolean("is_universal").notNull().default(true),
  
  // Version tracking for updates
  version: integer("version").notNull().default(1),
  
  // Status for draft/published workflow
  status: text("status").notNull().default("published"), // 'draft', 'published', 'archived'
  
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertMasterProductSchema = createInsertSchema(masterProducts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertMasterProduct = z.infer<typeof insertMasterProductSchema>;
export type MasterProduct = typeof masterProducts.$inferSelect;

// Vendor Products table - vendor's product inventory
export const vendorProducts = pgTable("vendor_products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id),
  
  // Master product reference and adoption tracking
  masterProductId: varchar("master_product_id").references(() => masterProducts.id),
  masterVersionAtAdoption: integer("master_version_at_adoption"), // Track which version was adopted
  adoptedAt: timestamp("adopted_at"), // When the vendor adopted this master product
  
  // Master data integration - link to categories/subcategories
  categoryId: varchar("category_id").references(() => categories.id),
  category: text("category").notNull(),
  subcategoryId: varchar("subcategory_id").references(() => subcategories.id),
  subcategory: text("subcategory"),
  
  name: text("name").notNull(),
  brand: text("brand"),
  icon: text("icon").notNull(),
  description: text("description").notNull(),
  specifications: text("specifications").array().notNull().default(sql`ARRAY[]::text[]`),
  tags: text("tags").array().notNull().default(sql`ARRAY[]::text[]`),
  price: integer("price").notNull(), // Vendor's selling price in rupees
  unit: text("unit").notNull(),
  
  // Object storage image keys (not URLs)
  imageKeys: text("image_keys").array().default(sql`ARRAY[]::text[]`), // Object storage keys
  images: text("images").array().default(sql`ARRAY[]::text[]`), // Legacy URL support
  
  stock: integer("stock").notNull().default(0), // Available quantity
  requiresPrescription: boolean("requires_prescription").default(false),
  isActive: boolean("is_active").notNull().default(true),
  discountPercentage: integer("discount_percentage").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertVendorProductSchema = createInsertSchema(vendorProducts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertVendorProduct = z.infer<typeof insertVendorProductSchema>;
export type VendorProduct = typeof vendorProducts.$inferSelect;

// Orders table - customer product orders
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id),
  customerId: varchar("customer_id").references(() => customers.id), // Link to customer - simple customer-vendor-order relation
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerEmail: text("customer_email"),
  deliveryAddress: text("delivery_address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  pincode: text("pincode").notNull(),
  status: text("status").notNull().default("pending"), // 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'
  paymentStatus: text("payment_status").default("pending"), // 'pending', 'paid', 'refunded'
  paymentMethod: text("payment_method"), // 'cod', 'online', 'wallet'
  subtotal: integer("subtotal").notNull(), // Sum of all items before delivery
  deliveryCharges: integer("delivery_charges").notNull().default(0),
  totalAmount: integer("total_amount").notNull(), // Subtotal + delivery charges
  prescriptionRequired: boolean("prescription_required").default(false),
  prescriptionImage: text("prescription_image"), // URL to uploaded prescription
  notes: text("notes"),
  assignedTo: varchar("assigned_to").references(() => users.id), // Assigned employee
  trackingNumber: text("tracking_number"),
  estimatedDelivery: timestamp("estimated_delivery"),
  deliveredAt: timestamp("delivered_at"),
  
  // Mini-website source tracking
  source: text("source").default("manual"), // 'manual', 'miniwebsite', 'pos', 'app'
  miniWebsiteSubdomain: text("mini_website_subdomain"), // Track which mini-website generated this order
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

// Order Items table - individual items in an order
export const orderItems = pgTable("order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  vendorProductId: varchar("vendor_product_id").notNull().references(() => vendorProducts.id),
  productName: text("product_name").notNull(), // Denormalized for history
  productBrand: text("product_brand"),
  productUnit: text("product_unit").notNull(),
  quantity: integer("quantity").notNull(),
  pricePerUnit: integer("price_per_unit").notNull(), // Price at time of order
  totalPrice: integer("total_price").notNull(), // quantity * pricePerUnit
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
  createdAt: true,
});

export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;

// Customers table - manage customer information across all business types
export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id),
  // No userId - relationship tracked via vendor_id, linked by email when needed
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone").notNull(),
  alternatePhone: text("alternate_phone"),
  dateOfBirth: timestamp("date_of_birth"),
  gender: text("gender"), // 'male', 'female', 'other'
  address: text("address"),
  city: text("city"),
  state: text("state"),
  pincode: text("pincode"),
  
  // Membership/Subscription info (gym, library, coaching, etc.)
  membershipType: text("membership_type"), // 'premium', 'basic', 'gold', 'student', etc.
  membershipStartDate: timestamp("membership_start_date"),
  membershipEndDate: timestamp("membership_end_date"),
  subscriptionStatus: text("subscription_status"), // 'active', 'expired', 'suspended'
  
  // Service/Package info (varies by business)
  activePackages: text("active_packages").array().default(sql`ARRAY[]::text[]`), // List of active packages/plans
  servicesEnrolled: text("services_enrolled").array().default(sql`ARRAY[]::text[]`), // Services customer is enrolled in
  
  // Customer type and acquisition
  customerType: text("customer_type").notNull().default("walk-in"), // 'walk-in', 'online', 'referral', 'corporate'
  source: text("source"), // How they found the business
  referredBy: varchar("referred_by"), // ID of referring customer (self-reference)
  
  // Status and engagement
  status: text("status").notNull().default("active"), // 'active', 'inactive', 'pending_followup', 'blocked'
  lastVisitDate: timestamp("last_visit_date"),
  totalVisits: integer("total_visits").default(0),
  totalSpent: integer("total_spent").default(0), // Lifetime value in rupees
  
  // Notes and preferences
  notes: text("notes"), // Internal notes about customer
  preferences: text("preferences").array().default(sql`ARRAY[]::text[]`), // Customer preferences
  allergies: text("allergies").array().default(sql`ARRAY[]::text[]`), // For healthcare, food businesses
  
  // Emergency contact (useful for gyms, healthcare, etc.)
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactPhone: text("emergency_contact_phone"),
  
  // Document tracking (ID proof, photos, etc.)
  documents: text("documents").array().default(sql`ARRAY[]::text[]`), // URLs to uploaded documents
  avatar: text("avatar"), // Profile picture URL
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

// ========== SUPPLIER MANAGEMENT MODULE ==========

// Suppliers table
export const suppliers = pgTable("suppliers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id),
  
  // Basic Details
  name: text("name").notNull(),
  businessName: text("business_name"),
  contactPerson: text("contact_person"),
  phone: text("phone").notNull(),
  alternatePhone: text("alternate_phone"),
  email: text("email"),
  
  // Tax Information
  gstin: text("gstin"),
  pan: text("pan"),
  
  // Address Details
  addressLine1: text("address_line_1"),
  addressLine2: text("address_line_2"),
  city: text("city"),
  state: text("state"),
  pincode: text("pincode"),
  country: text("country").default("India"),
  
  // Category / Type
  category: text("category").notNull(), // 'product', 'service', 'maintenance', 'other'
  customCategory: text("custom_category"), // For 'other' category
  
  // Payment Preferences
  preferredPaymentMode: text("preferred_payment_mode"), // 'cash', 'upi', 'bank', 'card', 'cheque'
  
  // Bank Account Details (optional)
  accountHolderName: text("account_holder_name"),
  bankName: text("bank_name"),
  accountNumber: text("account_number"),
  ifscCode: text("ifsc_code"),
  
  // Financial tracking
  totalPurchases: integer("total_purchases").default(0), // Total amount purchased
  outstandingBalance: integer("outstanding_balance").default(0), // Amount pending to pay
  lastTransactionDate: timestamp("last_transaction_date"),
  
  // Other Info
  notes: text("notes"),
  documents: text("documents").array().default(sql`ARRAY[]::text[]`), // URLs to uploaded documents
  
  // Status
  status: text("status").notNull().default("active"), // 'active', 'inactive'
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type Supplier = typeof suppliers.$inferSelect;

// Supplier Payments table - track payments made to suppliers
export const supplierPayments = pgTable("supplier_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  supplierId: varchar("supplier_id").notNull().references(() => suppliers.id),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id),
  
  amount: integer("amount").notNull(),
  paymentDate: timestamp("payment_date").notNull().defaultNow(),
  paymentMode: text("payment_mode").notNull(), // 'cash', 'upi', 'bank', 'card', 'cheque'
  
  description: text("description"),
  notes: text("notes"),
  
  // Document attachment (payment proof)
  attachments: text("attachments").array().default(sql`ARRAY[]::text[]`),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSupplierPaymentSchema = createInsertSchema(supplierPayments).omit({
  id: true,
  createdAt: true,
});

export type InsertSupplierPayment = z.infer<typeof insertSupplierPaymentSchema>;
export type SupplierPayment = typeof supplierPayments.$inferSelect;

// Expenses - comprehensive expense tracking with supplier integration
export const expenses = pgTable("expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id),
  
  // Basic Details
  title: text("title").notNull(), // e.g., "Office Rent", "Raw Material Purchase"
  category: text("category").notNull(), // 'rent', 'utilities', 'inventory', 'marketing', 'maintenance', 'salary', 'software', 'miscellaneous', 'custom'
  customCategory: text("custom_category"), // For category = 'custom'
  amount: integer("amount").notNull(),
  expenseDate: timestamp("expense_date").notNull().defaultNow(),
  
  // Payment Details
  paymentType: text("payment_type").notNull(), // 'cash', 'upi', 'bank_transfer', 'card', 'cheque', 'other'
  paidTo: text("paid_to"), // Person or business name
  status: text("status").notNull().default("paid"), // 'paid', 'pending'
  
  // Supplier Link
  supplierId: varchar("supplier_id").references(() => suppliers.id), // Optional link to supplier
  
  // Description & Attachments
  description: text("description"),
  notes: text("notes"),
  receiptUrl: text("receipt_url"), // Single receipt/bill attachment URL
  attachments: text("attachments").array().default(sql`ARRAY[]::text[]`), // Additional attachments
  
  // Recurring Expense Settings
  isRecurring: boolean("is_recurring").notNull().default(false),
  recurringFrequency: text("recurring_frequency"), // 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'
  recurringStartDate: timestamp("recurring_start_date"),
  recurringEndDate: timestamp("recurring_end_date"), // null = never-ending
  nextDueDate: timestamp("next_due_date"), // For tracking next occurrence
  parentExpenseId: varchar("parent_expense_id"), // Link to original recurring expense template
  
  // Tags & Organization
  department: text("department"), // Branch, department, or location tag
  projectId: varchar("project_id"), // Link to project or customer for project-based expenses
  tags: text("tags").array().default(sql`ARRAY[]::text[]`), // Additional tags for organization
  
  // Linked Transaction (Hisab-Kitab integration)
  ledgerTransactionId: varchar("ledger_transaction_id"), // Auto-created ledger transaction ID
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;

// Customer Visits/Engagements - track each visit/interaction
export const customerVisits = pgTable("customer_visits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull().references(() => customers.id),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id),
  visitDate: timestamp("visit_date").defaultNow().notNull(),
  visitType: text("visit_type").notNull(), // 'service', 'product_purchase', 'consultation', 'class', 'workout', etc.
  serviceId: varchar("service_id"), // Reference to booking/appointment
  purpose: text("purpose"), // What did they come for
  attendedBy: varchar("attended_by").references(() => employees.id), // Which employee served them
  duration: integer("duration"), // Duration in minutes
  amountSpent: integer("amount_spent").default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCustomerVisitSchema = createInsertSchema(customerVisits).omit({
  id: true,
  createdAt: true,
});

export type InsertCustomerVisit = z.infer<typeof insertCustomerVisitSchema>;
export type CustomerVisit = typeof customerVisits.$inferSelect;

// Coupon Usage Tracking - extends existing coupons table
export const couponUsages = pgTable("coupon_usages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  couponId: varchar("coupon_id").notNull().references(() => coupons.id),
  customerId: varchar("customer_id").notNull().references(() => customers.id),
  orderId: varchar("order_id").references(() => orders.id), // If used for product order
  bookingId: varchar("booking_id").references(() => bookings.id), // If used for service booking
  discountAmount: integer("discount_amount").notNull(), // Actual discount applied
  usedAt: timestamp("used_at").defaultNow().notNull(),
});

export const insertCouponUsageSchema = createInsertSchema(couponUsages).omit({
  id: true,
  usedAt: true,
});

export type InsertCouponUsage = z.infer<typeof insertCouponUsageSchema>;
export type CouponUsage = typeof couponUsages.$inferSelect;

// Customer Tasks/Reminders - for follow-ups
export const customerTasks = pgTable("customer_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull().references(() => customers.id),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id),
  assignedTo: varchar("assigned_to").references(() => employees.id),
  taskType: text("task_type").notNull(), // 'followup', 'renewal_reminder', 'feedback', 'delivery_check', 'payment_reminder'
  title: text("title").notNull(),
  description: text("description"),
  priority: text("priority").notNull().default("medium"), // 'low', 'medium', 'high', 'urgent'
  dueDate: timestamp("due_date"),
  status: text("status").notNull().default("pending"), // 'pending', 'in_progress', 'completed', 'cancelled'
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCustomerTaskSchema = createInsertSchema(customerTasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCustomerTask = z.infer<typeof insertCustomerTaskSchema>;
export type CustomerTask = typeof customerTasks.$inferSelect;

// ========== HISAB KITAB (LEDGER/ACCOUNT BOOK) MODULE ==========

// Ledger Transactions table - Track all money in/out with customer linkage
export const ledgerTransactions = pgTable("ledger_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id),
  customerId: varchar("customer_id").references(() => customers.id), // Optional - some transactions may not be customer-specific
  
  // Transaction basics
  type: text("type").notNull(), // 'in' (received/credit) or 'out' (paid/debit)
  amount: integer("amount").notNull(), // Amount in rupees (paisa as integer)
  transactionDate: timestamp("transaction_date").notNull().defaultNow(),
  
  // Categorization
  category: text("category").notNull().default("other"), // 'product_sale', 'service', 'expense', 'advance', 'refund', 'subscription', 'other'
  paymentMethod: text("payment_method").notNull().default("cash"), // 'cash', 'bank', 'upi', 'card', 'other'
  
  // Description and notes
  description: text("description"), // Note about the transaction
  note: text("note"), // Additional internal note
  
  // References to other modules (optional linking)
  referenceType: text("reference_type"), // 'booking', 'order', 'appointment', 'quotation', etc.
  referenceId: varchar("reference_id"), // ID of the linked entity
  
  // Recurring transaction support
  isRecurring: boolean("is_recurring").default(false),
  recurringPattern: text("recurring_pattern"), // 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'
  recurringStartDate: timestamp("recurring_start_date"),
  recurringEndDate: timestamp("recurring_end_date"),
  recurringParentId: varchar("recurring_parent_id"), // Links to the original recurring transaction
  nextOccurrenceDate: timestamp("next_occurrence_date"), // When to generate next transaction
  
  // Attachments and verification
  attachments: text("attachments").array().default(sql`ARRAY[]::text[]`), // Receipt images, bills, etc.
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertLedgerTransactionSchema = createInsertSchema(ledgerTransactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  transactionDate: z.union([z.string(), z.date()]).transform(val => val ? new Date(val) : new Date()).optional(),
  recurringStartDate: z.union([z.string(), z.date()]).transform(val => val ? new Date(val) : null).nullable().optional(),
  recurringEndDate: z.union([z.string(), z.date()]).transform(val => val ? new Date(val) : null).nullable().optional(),
  nextOccurrenceDate: z.union([z.string(), z.date()]).transform(val => val ? new Date(val) : null).nullable().optional(),
});

export type InsertLedgerTransaction = z.infer<typeof insertLedgerTransactionSchema>;
export type LedgerTransaction = typeof ledgerTransactions.$inferSelect;

// ========== LEAD MANAGEMENT MODULE ==========

// Leads table - capture leads from multiple sources
export const leads = pgTable("leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id),
  
  // Basic lead information
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  alternatePhone: text("alternate_phone"),
  
  // Lead source tracking
  source: text("source").notNull().default("offline"), // 'offline', 'website', 'mini_website', 'social_media', 'phone', 'referral', 'whatsapp', 'facebook', 'instagram'
  sourceDetails: text("source_details"), // Additional details about source
  
  // Lead status workflow
  status: text("status").notNull().default("new"), // 'new', 'contacted', 'interested', 'converted', 'lost'
  lostReason: text("lost_reason"), // Reason if status is 'lost'
  
  // Interest tracking - what product/service are they interested in
  interestType: text("interest_type"), // 'product', 'service', 'both', 'unknown'
  interestProductId: varchar("interest_product_id").references(() => vendorProducts.id),
  interestServiceId: varchar("interest_service_id").references(() => vendorCatalogues.id),
  interestDescription: text("interest_description"), // Free-text description of interest
  
  // Assignment and follow-up
  assignedEmployeeId: varchar("assigned_employee_id").references(() => employees.id),
  priority: text("priority").notNull().default("medium"), // 'low', 'medium', 'high', 'urgent'
  nextFollowUpDate: timestamp("next_follow_up_date"),
  
  // Conversion tracking
  convertedToCustomerId: varchar("converted_to_customer_id").references(() => customers.id),
  convertedAt: timestamp("converted_at"),
  
  // Budget and preferences
  estimatedBudget: integer("estimated_budget"), // Budget in rupees
  preferredContactMethod: text("preferred_contact_method"), // 'phone', 'email', 'whatsapp', 'sms'
  preferredContactTime: text("preferred_contact_time"), // 'morning', 'afternoon', 'evening'
  
  // Additional information
  notes: text("notes"), // Internal notes about the lead
  tags: text("tags").array().default(sql`ARRAY[]::text[]`), // Tags for segmentation
  
  // Lead scoring (for future analytics)
  leadScore: integer("lead_score").default(0), // Score based on engagement
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;

// Lead Communications table - track all interactions with leads
export const leadCommunications = pgTable("lead_communications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").notNull().references(() => leads.id),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id),
  
  // Communication details
  type: text("type").notNull(), // 'call', 'email', 'sms', 'whatsapp', 'message', 'meeting', 'visit'
  direction: text("direction").notNull().default("outbound"), // 'inbound', 'outbound'
  subject: text("subject"), // For emails or meeting titles
  notes: text("notes").notNull(), // Details of the communication
  outcome: text("outcome"), // Result of the communication
  
  // Duration and attachments
  duration: integer("duration"), // Duration in minutes (for calls/meetings)
  attachments: text("attachments").array().default(sql`ARRAY[]::text[]`), // URLs to attachments
  
  // Tracking
  createdBy: varchar("created_by").references(() => employees.id), // Employee who logged this
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertLeadCommunicationSchema = createInsertSchema(leadCommunications).omit({
  id: true,
  createdAt: true,
});

export type InsertLeadCommunication = z.infer<typeof insertLeadCommunicationSchema>;
export type LeadCommunication = typeof leadCommunications.$inferSelect;

// Lead Tasks table - follow-up tasks and reminders
export const leadTasks = pgTable("lead_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").notNull().references(() => leads.id),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id),
  
  // Task details
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull().default("follow_up"), // 'follow_up', 'demo', 'visit', 'call', 'email', 'meeting', 'send_quote'
  priority: text("priority").notNull().default("medium"), // 'low', 'medium', 'high', 'urgent'
  
  // Status and assignment
  status: text("status").notNull().default("pending"), // 'pending', 'in_progress', 'completed', 'cancelled'
  assignedTo: varchar("assigned_to").references(() => employees.id),
  assignedBy: varchar("assigned_by").references(() => employees.id),
  
  // Dates
  dueDate: timestamp("due_date").notNull(),
  completedAt: timestamp("completed_at"),
  
  // Reminder
  reminderEnabled: boolean("reminder_enabled").default(false),
  reminderTime: timestamp("reminder_time"),
  
  // Completion notes
  completionNotes: text("completion_notes"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertLeadTaskSchema = createInsertSchema(leadTasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertLeadTask = z.infer<typeof insertLeadTaskSchema>;
export type LeadTask = typeof leadTasks.$inferSelect;

// Quotations table - vendor quotations for customers
export const quotations = pgTable("quotations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id),
  customerId: varchar("customer_id").notNull().references(() => customers.id),
  
  // Quotation identification
  quotationNumber: text("quotation_number").notNull().unique(),
  quotationDate: timestamp("quotation_date").notNull().defaultNow(),
  validUntil: timestamp("valid_until").notNull(),
  
  // Status tracking
  status: text("status").notNull().default("draft"), // 'draft', 'sent', 'accepted', 'rejected', 'expired'
  
  // Pricing details
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull().default("0"),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  additionalCharges: decimal("additional_charges", { precision: 10, scale: 2 }).notNull().default("0"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  
  // Additional details
  notes: text("notes"),
  termsAndConditions: text("terms_and_conditions"),
  
  // Tracking
  createdBy: varchar("created_by").references(() => employees.id),
  sentAt: timestamp("sent_at"),
  acceptedAt: timestamp("accepted_at"),
  rejectedAt: timestamp("rejected_at"),
  
  // Mini-website source tracking
  source: text("source").default("manual"), // 'manual', 'miniwebsite', 'pos', 'app'
  miniWebsiteSubdomain: text("mini_website_subdomain"), // Track which mini-website generated this quotation
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertQuotationSchema = createInsertSchema(quotations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertQuotation = z.infer<typeof insertQuotationSchema>;
export type Quotation = typeof quotations.$inferSelect;

// Quotation Items table - line items in quotations
export const quotationItems = pgTable("quotation_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quotationId: varchar("quotation_id").notNull().references(() => quotations.id, { onDelete: "cascade" }),
  
  // Item identification
  itemType: text("item_type").notNull(), // 'service', 'product', 'custom'
  itemId: varchar("item_id"), // Reference to vendorCatalogues.id or vendorProducts.id
  itemName: text("item_name").notNull(),
  description: text("description"),
  
  // Pricing details
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull().default("1"),
  rate: decimal("rate", { precision: 10, scale: 2 }).notNull(),
  
  // Tax and discount
  taxPercent: decimal("tax_percent", { precision: 5, scale: 2 }).notNull().default("0"),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  discountPercent: decimal("discount_percent", { precision: 5, scale: 2 }).notNull().default("0"),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  
  // Line total
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  
  // Display order
  sortOrder: integer("sort_order").notNull().default(0),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertQuotationItemSchema = createInsertSchema(quotationItems).omit({
  id: true,
  createdAt: true,
});

export type InsertQuotationItem = z.infer<typeof insertQuotationItemSchema>;
export type QuotationItem = typeof quotationItems.$inferSelect;

// ========== MINI-WEBSITE BUILDER MODULE ==========

// Mini-Websites table - vendor's public-facing website
export const miniWebsites = pgTable("mini_websites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id).unique(),
  
  // Subdomain and Publishing
  subdomain: text("subdomain").notNull().unique(), // e.g., "mybusiness" for mybusiness.myapp.in
  status: text("status").notNull().default("draft"), // 'draft', 'published', 'archived'
  publishedAt: timestamp("published_at"),
  
  // Progress tracking
  completionPercentage: integer("completion_percentage").notNull().default(0),
  
  // Business Information (JSON for flexibility)
  businessInfo: json("business_info").$type<{
    businessName: string;
    tagline?: string;
    category: string;
    subcategory?: string;
    about?: string;
    yearFounded?: number;
    owners?: Array<{
      name: string;
      designation?: string;
      photo?: string;
    }>;
    logo?: string;
    coverImages?: string[]; // Multiple cover images for carousel
  }>(),
  
  // Contact Information (JSON)
  contactInfo: json("contact_info").$type<{
    address: string;
    city: string;
    state: string;
    pincode: string;
    mapLatitude?: number;
    mapLongitude?: number;
    googleMapsUrl?: string; // Google Maps link for navigation
    phone: string;
    whatsapp?: string;
    email: string;
    workingHours?: Array<{
      day: string;
      isOpen: boolean;
      slots?: Array<{
        open: string;
        close: string;
      }>; // Support multiple slots per day (e.g., gym with break hours)
    }>;
    holidays?: string[];
    emergencyAvailable?: boolean;
  }>(),
  
  // Branding & Design (JSON)
  branding: json("branding").$type<{
    themeTemplate: string; // 'modern', 'minimal', 'classic', 'bold'
    primaryColor: string; // Hex color
    secondaryColor: string; // Hex color
    accentColor?: string;
    fontFamily: string; // 'Inter', 'Poppins', 'Roboto', etc.
    heroLayout: string; // 'centered', 'split', 'fullwidth'
    heroMedia?: string[]; // Hero section images/videos
    gallery?: string[]; // Array of image URLs
    ctaButtons?: Array<{
      label: string;
      action: string; // 'call', 'whatsapp', 'enquiry', 'quotation'
      style: string; // 'primary', 'secondary', 'outline'
    }>;
    socialLinks?: {
      facebook?: string;
      instagram?: string;
      twitter?: string;
      linkedin?: string;
      youtube?: string;
    };
  }>(),
  
  // Selected Catalog Items
  selectedCatalog: json("selected_catalog").$type<{
    services?: string[]; // Array of vendorCatalogues.id
    products?: string[]; // Array of vendorProducts.id
    customItems?: Array<{
      name: string;
      description: string;
      price: number;
      image?: string;
      approved: boolean;
    }>;
  }>(),
  
  // Team Members
  team: json("team").$type<Array<{
    name: string;
    role: string;
    bio?: string;
    photo?: string;
    phone?: string;
    email?: string;
  }>>(),
  
  // FAQs
  faqs: json("faqs").$type<Array<{
    question: string;
    answer: string;
    order: number;
  }>>(),
  
  // Testimonials (vendor-created showcase reviews)
  testimonials: json("testimonials").$type<Array<{
    customerName: string;
    customerLocation?: string;
    customerPhoto?: string;
    rating: number; // 1-5
    reviewText: string;
    order: number;
  }>>(),
  
  // Coupons/Offers
  coupons: json("coupons").$type<Array<{
    code: string;
    title: string;
    description?: string;
    image?: string; // Offer image
    discountType: string; // 'percentage', 'fixed'
    discountValue: number;
    minOrderValue?: number;
    maxDiscount?: number;
    validFrom?: string; // Date
    validUntil?: string; // Date
    validFromTime?: string; // Time (HH:MM format)
    validUntilTime?: string; // Time (HH:MM format)
    applicability: string; // 'all', 'selected_products', 'selected_services'
    applicableProducts?: string[]; // Product IDs if applicable
    applicableServices?: string[]; // Service IDs if applicable
    isActive: boolean;
    usageLimit?: number;
    termsAndConditions?: string;
  }>>(),
  
  // SEO Settings
  seo: json("seo").$type<{
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string[];
    ogImage?: string;
  }>(),
  
  // Lead Form Configuration
  leadForm: json("lead_form").$type<{
    enabled: boolean;
    fields?: Array<{
      name: string;
      type: string; // 'text', 'email', 'phone', 'textarea', 'select'
      label: string;
      required: boolean;
      options?: string[]; // For select fields
    }>;
    submitButtonText?: string;
    successMessage?: string;
  }>(),
  
  // Features Toggle
  features: json("features").$type<{
    showReviews: boolean;
    showGallery: boolean;
    showTeam: boolean;
    showWorkingHours: boolean;
    showCatalog: boolean;
    enableWhatsAppChat: boolean;
    enableCallButton: boolean;
    showOffers: boolean;
  }>(),
  
  // E-commerce Settings
  ecommerce: json("ecommerce").$type<{
    enabled: boolean; // Enable e-commerce features
    mode: 'cart' | 'quotation' | 'both'; // 'cart' = full checkout, 'quotation' = request quote, 'both' = show both options
    allowGuestCheckout: boolean;
    requirePhone: boolean;
    requireAddress: boolean;
    showPrices: boolean; // Show prices on products/services
    currency: string; // 'INR', 'USD', etc.
    paymentMethods?: Array<{
      type: 'cod' | 'online' | 'bank_transfer'; // Payment method types
      enabled: boolean;
      instructions?: string; // For bank transfer
    }>;
    shippingOptions?: Array<{
      name: string; // 'Standard', 'Express', 'Free'
      cost: number;
      description?: string;
    }>;
    minOrderValue?: number; // Minimum order value
    taxRate?: number; // Tax percentage
    notificationEmails?: string[]; // Emails to notify on new orders
  }>(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertMiniWebsiteSchema = createInsertSchema(miniWebsites).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertMiniWebsite = z.infer<typeof insertMiniWebsiteSchema>;
export type MiniWebsite = typeof miniWebsites.$inferSelect;

// Mini-Website Reviews table - customer reviews on mini-website
export const miniWebsiteReviews = pgTable("mini_website_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  miniWebsiteId: varchar("mini_website_id").notNull().references(() => miniWebsites.id, { onDelete: "cascade" }),
  
  // Reviewer information
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone"),
  
  // Review content
  rating: integer("rating").notNull(), // 1-5
  reviewText: text("review_text"),
  
  // Status
  status: text("status").notNull().default("pending"), // 'pending', 'approved', 'rejected'
  approvedAt: timestamp("approved_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMiniWebsiteReviewSchema = createInsertSchema(miniWebsiteReviews).omit({
  id: true,
  createdAt: true,
});

export type InsertMiniWebsiteReview = z.infer<typeof insertMiniWebsiteReviewSchema>;
export type MiniWebsiteReview = typeof miniWebsiteReviews.$inferSelect;

// Mini-Website Leads table - leads generated from mini-website
export const miniWebsiteLeads = pgTable("mini_website_leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  miniWebsiteId: varchar("mini_website_id").notNull().references(() => miniWebsites.id, { onDelete: "cascade" }),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id),
  
  // Lead information
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone").notNull(),
  message: text("message"),
  
  // Form data (flexible for custom fields)
  formData: json("form_data").$type<Record<string, any>>(),
  
  // Tracking
  source: text("source").default("mini_website"), // Always from mini-website
  status: text("status").notNull().default("new"), // 'new', 'contacted', 'converted'
  convertedToLeadId: varchar("converted_to_lead_id").references(() => leads.id),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMiniWebsiteLeadSchema = createInsertSchema(miniWebsiteLeads).omit({
  id: true,
  createdAt: true,
});

export type InsertMiniWebsiteLead = z.infer<typeof insertMiniWebsiteLeadSchema>;
export type MiniWebsiteLead = typeof miniWebsiteLeads.$inferSelect;

// ==================== STOCK TURNOVER MODULE ====================

// Inventory Locations table - for multi-location stock management
export const inventoryLocations = pgTable("inventory_locations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id),
  name: text("name").notNull(), // e.g., 'Main Store', 'Warehouse', 'Branch 1'
  address: text("address"),
  city: text("city"),
  state: text("state"),
  pincode: text("pincode"),
  isDefault: boolean("is_default").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertInventoryLocationSchema = createInsertSchema(inventoryLocations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertInventoryLocation = z.infer<typeof insertInventoryLocationSchema>;
export type InventoryLocation = typeof inventoryLocations.$inferSelect;

// Stock Batches table - for tracking expiry, warranty, and lot numbers
export const stockBatches = pgTable("stock_batches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorProductId: varchar("vendor_product_id").notNull().references(() => vendorProducts.id),
  locationId: varchar("location_id").references(() => inventoryLocations.id),
  batchNumber: text("batch_number"), // Lot/Batch number from supplier
  purchasePrice: integer("purchase_price"), // Cost per unit in rupees
  sellingPrice: integer("selling_price"), // Selling price per unit
  quantity: integer("quantity").notNull().default(0), // Current quantity in this batch
  expiryDate: timestamp("expiry_date"), // For perishable goods
  warrantyEndDate: timestamp("warranty_end_date"), // For electronics/durables
  supplierName: text("supplier_name"),
  supplierInvoice: text("supplier_invoice"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertStockBatchSchema = createInsertSchema(stockBatches).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertStockBatch = z.infer<typeof insertStockBatchSchema>;
export type StockBatch = typeof stockBatches.$inferSelect;

// Stock Movements table - immutable log of all stock changes
export const stockMovements = pgTable("stock_movements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id),
  vendorProductId: varchar("vendor_product_id").notNull().references(() => vendorProducts.id),
  locationId: varchar("location_id").references(() => inventoryLocations.id),
  batchId: varchar("batch_id").references(() => stockBatches.id),
  
  // Movement details
  movementType: text("movement_type").notNull(), // 'in', 'out', 'transfer', 'adjustment', 'sale', 'return', 'damage', 'expired'
  quantity: integer("quantity").notNull(), // Positive for in, negative for out
  previousStock: integer("previous_stock").notNull(), // Stock before movement
  newStock: integer("new_stock").notNull(), // Stock after movement
  
  // Financial tracking
  unitCost: integer("unit_cost"), // Cost per unit
  totalValue: integer("total_value"), // quantity * unitCost
  
  // Reference and reason
  referenceType: text("reference_type"), // 'order', 'manual', 'transfer', 'adjustment'
  referenceId: varchar("reference_id"), // ID of related order, transfer, etc.
  reason: text("reason"), // Damaged, Expired, Sold, Purchase, etc.
  notes: text("notes"),
  
  // Tracking
  performedBy: varchar("performed_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertStockMovementSchema = createInsertSchema(stockMovements).omit({
  id: true,
  createdAt: true,
});

export type InsertStockMovement = z.infer<typeof insertStockMovementSchema>;
export type StockMovement = typeof stockMovements.$inferSelect;

// Stock Configs table - per-product alert settings
export const stockConfigs = pgTable("stock_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorProductId: varchar("vendor_product_id").notNull().references(() => vendorProducts.id).unique(),
  
  // Alert thresholds
  minimumStock: integer("minimum_stock").notNull().default(10), // Low stock alert threshold
  reorderPoint: integer("reorder_point").notNull().default(20), // Suggested reorder point
  reorderQuantity: integer("reorder_quantity").notNull().default(50), // Suggested reorder qty
  
  // Expiry alerts
  expiryAlertDays: integer("expiry_alert_days").notNull().default(30), // Days before expiry to alert
  
  // Tracking settings
  trackExpiry: boolean("track_expiry").notNull().default(false),
  trackBatches: boolean("track_batches").notNull().default(false),
  trackWarranty: boolean("track_warranty").notNull().default(false),
  
  // Notification preferences
  enableLowStockAlerts: boolean("enable_low_stock_alerts").notNull().default(true),
  enableExpiryAlerts: boolean("enable_expiry_alerts").notNull().default(true),
  notificationChannels: text("notification_channels").array().default(sql`ARRAY['dashboard']::text[]`), // 'dashboard', 'email', 'sms', 'whatsapp'
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertStockConfigSchema = createInsertSchema(stockConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertStockConfig = z.infer<typeof insertStockConfigSchema>;
export type StockConfig = typeof stockConfigs.$inferSelect;

// Stock Alerts table - generated low stock and expiry alerts
export const stockAlerts = pgTable("stock_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id),
  vendorProductId: varchar("vendor_product_id").notNull().references(() => vendorProducts.id),
  batchId: varchar("batch_id").references(() => stockBatches.id),
  
  // Alert details
  alertType: text("alert_type").notNull(), // 'low_stock', 'out_of_stock', 'expiring_soon', 'expired', 'reorder_suggested'
  severity: text("severity").notNull().default("medium"), // 'low', 'medium', 'high', 'critical'
  message: text("message").notNull(),
  
  // Context
  currentStock: integer("current_stock"),
  minimumStock: integer("minimum_stock"),
  expiryDate: timestamp("expiry_date"),
  
  // Status
  status: text("status").notNull().default("active"), // 'active', 'acknowledged', 'resolved', 'dismissed'
  acknowledgedBy: varchar("acknowledged_by").references(() => users.id),
  acknowledgedAt: timestamp("acknowledged_at"),
  resolvedAt: timestamp("resolved_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertStockAlertSchema = createInsertSchema(stockAlerts).omit({
  id: true,
  createdAt: true,
});

export type InsertStockAlert = z.infer<typeof insertStockAlertSchema>;
export type StockAlert = typeof stockAlerts.$inferSelect;

// Greeting Templates table - uploaded by admin for marketing
export const greetingTemplates = pgTable("greeting_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Basic info
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url").notNull(), // Uploaded design image
  thumbnailUrl: text("thumbnail_url"), // Smaller preview image
  
  // Filter Categories
  // 1. Occasion-Based
  occasions: text("occasions").array().notNull().default(sql`ARRAY[]::text[]`), // ['diwali', 'christmas', 'independence_day', etc.]
  
  // 2. Offer & Campaign Type
  offerTypes: text("offer_types").array().notNull().default(sql`ARRAY[]::text[]`), // ['flat_discount', 'bogo', 'flash_sale', etc.]
  
  // 3. Industry / Business Type
  industries: text("industries").array().notNull().default(sql`ARRAY[]::text[]`), // ['fitness', 'salon', 'clinic', etc.]
  
  // Customization fields
  hasEditableText: boolean("has_editable_text").notNull().default(true),
  editableTextAreas: json("editable_text_areas").default([]), // [{x, y, width, height, defaultText}]
  supportsLogo: boolean("supports_logo").notNull().default(true),
  logoPosition: json("logo_position").default({}), // {x, y, width, height}
  supportsProducts: boolean("supports_products").notNull().default(false),
  supportsServices: boolean("supports_services").notNull().default(false),
  supportsOffers: boolean("supports_offers").notNull().default(false),
  
  // Platform branding
  includesPlatformBranding: boolean("includes_platform_branding").notNull().default(true),
  
  // Time & Relevance
  eventDate: timestamp("event_date"), // For time-bound templates
  expiryDate: timestamp("expiry_date"), // When template becomes irrelevant
  isTrending: boolean("is_trending").notNull().default(false),
  
  // Analytics
  downloadCount: integer("download_count").notNull().default(0),
  shareCount: integer("share_count").notNull().default(0),
  
  // Status
  status: text("status").notNull().default("draft"), // 'draft', 'published', 'archived'
  
  // Admin details
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertGreetingTemplateSchema = createInsertSchema(greetingTemplates).omit({
  id: true,
  downloadCount: true,
  shareCount: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertGreetingTemplate = z.infer<typeof insertGreetingTemplateSchema>;
export type GreetingTemplate = typeof greetingTemplates.$inferSelect;

// Greeting Template Usage - track vendor customizations and shares
export const greetingTemplateUsage = pgTable("greeting_template_usage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: varchar("template_id").notNull().references(() => greetingTemplates.id),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id),
  
  // Customization details
  customizedImageUrl: text("customized_image_url"), // Final customized image
  customText: json("custom_text").default({}), // Custom text added by vendor
  includedProducts: text("included_products").array().default(sql`ARRAY[]::text[]`), // Product IDs
  includedServices: text("included_services").array().default(sql`ARRAY[]::text[]`), // Service IDs
  includedOffers: text("included_offers").array().default(sql`ARRAY[]::text[]`), // Offer IDs
  
  // Sharing details
  sharedOn: text("shared_on").array().default(sql`ARRAY[]::text[]`), // ['whatsapp', 'facebook', 'instagram', etc.]
  shareCount: integer("share_count").notNull().default(0),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertGreetingTemplateUsageSchema = createInsertSchema(greetingTemplateUsage).omit({
  id: true,
  shareCount: true,
  createdAt: true,
});

export type InsertGreetingTemplateUsage = z.infer<typeof insertGreetingTemplateUsageSchema>;
export type GreetingTemplateUsage = typeof greetingTemplateUsage.$inferSelect;

// POS Bills table - main invoice/bill table
export const bills = pgTable("bills", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id),
  customerId: varchar("customer_id").references(() => customers.id), // Nullable for walk-in
  billNumber: text("bill_number").notNull(),
  billDate: timestamp("bill_date").defaultNow().notNull(),
  
  // Amounts
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull().default('0'),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).notNull().default('0'),
  discountPercentage: integer("discount_percentage").default(0),
  discountType: text("discount_type"), // 'percentage', 'fixed', 'coupon'
  couponId: varchar("coupon_id").references(() => coupons.id),
  couponCode: text("coupon_code"), // Cached coupon code for display
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).notNull().default('0'),
  serviceCharges: decimal("service_charges", { precision: 10, scale: 2 }).notNull().default('0'),
  additionalCharges: json("additional_charges").default([]), // [{id, type, label, baseAmount, gstRate, gstAmount, totalAmount}]
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }).notNull().default('0'),
  dueAmount: decimal("due_amount", { precision: 10, scale: 2 }).notNull().default('0'),
  
  // Status
  status: text("status").notNull().default("draft"), // 'draft', 'completed', 'cancelled'
  paymentStatus: text("payment_status").notNull().default("unpaid"), // 'unpaid', 'partial', 'paid', 'credit'
  paymentMethod: text("payment_method"), // 'cash', 'upi', 'card', 'wallet'
  
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertBillSchema = createInsertSchema(bills).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBill = z.infer<typeof insertBillSchema>;
export type Bill = typeof bills.$inferSelect;

// Bill Items table - line items in each bill
export const billItems = pgTable("bill_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  billId: varchar("bill_id").notNull().references(() => bills.id),
  
  // Item reference
  itemType: text("item_type").notNull(), // 'product', 'service'
  productId: varchar("product_id").references(() => vendorProducts.id),
  serviceId: varchar("service_id").references(() => vendorCatalogues.id),
  itemName: text("item_name").notNull(), // Cached for display
  
  // Pricing
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull().default('1'),
  unit: text("unit").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).notNull().default('0'),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).notNull().default('0'),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  
  // Service-specific
  assignedEmployeeId: varchar("assigned_employee_id").references(() => employees.id),
  
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBillItemSchema = createInsertSchema(billItems).omit({
  id: true,
  createdAt: true,
});

export type InsertBillItem = z.infer<typeof insertBillItemSchema>;
export type BillItem = typeof billItems.$inferSelect;

// Bill Payments table - payment records
export const billPayments = pgTable("bill_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  billId: varchar("bill_id").notNull().references(() => bills.id),
  
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(), // 'cash', 'upi', 'card', 'wallet', 'cheque'
  paymentDate: timestamp("payment_date").defaultNow().notNull(),
  
  transactionId: text("transaction_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBillPaymentSchema = createInsertSchema(billPayments).omit({
  id: true,
  createdAt: true,
});

export type InsertBillPayment = z.infer<typeof insertBillPaymentSchema>;
export type BillPayment = typeof billPayments.$inferSelect;

// ========== ADMIN AGGREGATION FILTERS ==========

// Admin Leads Filter Schema
export const adminLeadsFilterSchema = z.object({
  vendorIds: z.array(z.string()).optional(), // Filter by specific vendors
  categories: z.array(z.string()).optional(), // Filter by vendor category
  status: z.array(z.string()).optional(), // Filter by lead status
  source: z.array(z.string()).optional(), // Filter by lead source
  assignedEmployeeIds: z.array(z.string()).optional(), // Filter by assigned employees (multi-select)
  priority: z.array(z.string()).optional(), // Filter by priority
  leadScoreMin: z.number().min(0).max(100).optional(), // Lead score minimum
  leadScoreMax: z.number().min(0).max(100).optional(), // Lead score maximum
  dateRange: z.object({
    start: z.string().optional(), // ISO date string
    end: z.string().optional(), // ISO date string
  }).optional(),
  search: z.string().optional(), // Search by name, phone, email
  sortBy: z.enum(['createdAt', 'name', 'leadScore', 'nextFollowUpDate']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  limit: z.number().min(1).max(100).optional().default(50),
  offset: z.number().min(0).optional().default(0),
});

export type AdminLeadsFilter = z.infer<typeof adminLeadsFilterSchema>;

// Admin Customers Filter Schema
export const adminCustomersFilterSchema = z.object({
  vendorIds: z.array(z.string()).optional(), // Filter by specific vendors
  customerType: z.array(z.string()).optional(), // Filter by customer type
  status: z.array(z.string()).optional(), // Filter by status
  membershipType: z.array(z.string()).optional(), // Filter by membership type
  subscriptionStatus: z.array(z.string()).optional(), // Filter by subscription status
  dateRange: z.object({
    start: z.string().optional(), // ISO date string
    end: z.string().optional(), // ISO date string
  }).optional(),
  search: z.string().optional(), // Search by name, phone, email
  sortBy: z.enum(['createdAt', 'name', 'totalSpent', 'lastVisit']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  limit: z.number().min(1).max(100).optional().default(50),
  offset: z.number().min(0).optional().default(0),
});

export type AdminCustomersFilter = z.infer<typeof adminCustomersFilterSchema>;

// Admin Orders Filter Schema
export const adminOrdersFilterSchema = z.object({
  vendorIds: z.array(z.string()).optional(), // Filter by specific vendors
  statuses: z.array(z.string()).optional(), // Filter by order status
  paymentStatuses: z.array(z.string()).optional(), // Filter by payment status
  paymentMethods: z.array(z.string()).optional(), // Filter by payment method
  sources: z.array(z.string()).optional(), // Filter by source (manual, miniwebsite, pos, app)
  prescriptionRequired: z.boolean().optional(), // Filter by prescription requirement
  dateRange: z.object({
    start: z.string().optional(), // ISO date string
    end: z.string().optional(), // ISO date string
  }).optional(),
  search: z.string().optional(), // Search by customer name, phone, email, tracking number
  sortBy: z.enum(['createdAt', 'totalAmount', 'customerName', 'status']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  limit: z.number().min(1).max(100).optional().default(50),
  offset: z.number().min(0).optional().default(0),
});

export type AdminOrdersFilter = z.infer<typeof adminOrdersFilterSchema>;
