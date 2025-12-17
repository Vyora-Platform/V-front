CREATE TABLE "appointments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" varchar NOT NULL,
	"patient_name" text NOT NULL,
	"patient_phone" text NOT NULL,
	"patient_email" text,
	"patient_age" integer,
	"patient_gender" text,
	"appointment_date" timestamp NOT NULL,
	"appointment_time" text NOT NULL,
	"purpose" text NOT NULL,
	"doctor_name" text,
	"department" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"visit_type" text NOT NULL,
	"assigned_to" varchar,
	"notes" text,
	"payment_status" text DEFAULT 'pending',
	"consultation_fee" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" varchar NOT NULL,
	"employee_id" varchar NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"check_in_time" text NOT NULL,
	"check_out_time" text,
	"shift_duration" integer,
	"status" text DEFAULT 'present' NOT NULL,
	"late_by" integer DEFAULT 0,
	"early_leave_by" integer DEFAULT 0,
	"notes" text,
	"location" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bill_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bill_id" varchar NOT NULL,
	"item_type" text NOT NULL,
	"product_id" varchar,
	"service_id" varchar,
	"item_name" text NOT NULL,
	"quantity" numeric(10, 2) DEFAULT '1' NOT NULL,
	"unit" text NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"discount_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"tax_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_price" numeric(10, 2) NOT NULL,
	"assigned_employee_id" varchar,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bill_payments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bill_id" varchar NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"payment_method" text NOT NULL,
	"payment_date" timestamp DEFAULT now() NOT NULL,
	"transaction_id" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "billing_history" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" varchar NOT NULL,
	"subscription_id" varchar,
	"plan_id" varchar NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"status" text NOT NULL,
	"payment_method" text,
	"invoice_number" text,
	"invoice_url" text,
	"description" text,
	"period_start" timestamp,
	"period_end" timestamp,
	"stripe_invoice_id" text,
	"stripe_payment_intent_id" text,
	"stripe_charge_id" text,
	"paid_at" timestamp,
	"failure_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bills" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" varchar NOT NULL,
	"customer_id" varchar,
	"bill_number" text NOT NULL,
	"bill_date" timestamp DEFAULT now() NOT NULL,
	"subtotal" numeric(10, 2) DEFAULT '0' NOT NULL,
	"discount_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"discount_percentage" integer DEFAULT 0,
	"discount_type" text,
	"coupon_id" varchar,
	"coupon_code" text,
	"tax_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"service_charges" numeric(10, 2) DEFAULT '0' NOT NULL,
	"additional_charges" json DEFAULT '[]'::json,
	"total_amount" numeric(10, 2) NOT NULL,
	"paid_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"due_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"payment_status" text DEFAULT 'unpaid' NOT NULL,
	"payment_method" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" varchar NOT NULL,
	"vendor_catalogue_id" varchar NOT NULL,
	"patient_name" text NOT NULL,
	"patient_phone" text NOT NULL,
	"patient_email" text,
	"patient_age" integer,
	"patient_gender" text,
	"booking_date" timestamp NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"is_home_collection" boolean DEFAULT false,
	"collection_address" text,
	"assigned_to" varchar,
	"price" integer NOT NULL,
	"home_collection_charges" integer DEFAULT 0,
	"total_amount" integer NOT NULL,
	"payment_status" text DEFAULT 'pending',
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"icon" text,
	"icon_url" text,
	"created_by" text NOT NULL,
	"is_global" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coupon_usages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coupon_id" varchar NOT NULL,
	"customer_id" varchar NOT NULL,
	"order_id" varchar,
	"booking_id" varchar,
	"discount_amount" integer NOT NULL,
	"used_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coupons" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" varchar NOT NULL,
	"code" text NOT NULL,
	"description" text NOT NULL,
	"image" text,
	"discount_type" text NOT NULL,
	"discount_value" integer NOT NULL,
	"min_order_amount" integer DEFAULT 0,
	"expiry_date" timestamp NOT NULL,
	"max_usage" integer NOT NULL,
	"used_count" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"application_type" text DEFAULT 'all' NOT NULL,
	"applicable_services" text[] DEFAULT ARRAY[]::text[],
	"applicable_products" text[] DEFAULT ARRAY[]::text[],
	"applicable_categories" text[] DEFAULT ARRAY[]::text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "coupons_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "custom_service_requests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" varchar NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"icon" text NOT NULL,
	"description" text NOT NULL,
	"inclusions" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"exclusions" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"tags" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"sample_type" text,
	"tat" text,
	"base_price" integer,
	"status" text DEFAULT 'pending' NOT NULL,
	"admin_notes" text,
	"reviewed_by" varchar,
	"reviewed_at" timestamp,
	"made_universal" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_attendance" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" varchar NOT NULL,
	"customer_id" varchar NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"check_in_time" text NOT NULL,
	"check_out_time" text,
	"duration" integer,
	"status" text DEFAULT 'present' NOT NULL,
	"activity_type" text,
	"notes" text,
	"location" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_tasks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" varchar NOT NULL,
	"vendor_id" varchar NOT NULL,
	"assigned_to" varchar,
	"task_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"priority" text DEFAULT 'medium' NOT NULL,
	"due_date" timestamp,
	"status" text DEFAULT 'pending' NOT NULL,
	"completed_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_visits" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" varchar NOT NULL,
	"vendor_id" varchar NOT NULL,
	"visit_date" timestamp DEFAULT now() NOT NULL,
	"visit_type" text NOT NULL,
	"service_id" varchar,
	"purpose" text,
	"attended_by" varchar,
	"duration" integer,
	"amount_spent" integer DEFAULT 0,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" varchar NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text NOT NULL,
	"alternate_phone" text,
	"date_of_birth" timestamp,
	"gender" text,
	"address" text,
	"city" text,
	"state" text,
	"pincode" text,
	"membership_type" text,
	"membership_start_date" timestamp,
	"membership_end_date" timestamp,
	"subscription_status" text,
	"active_packages" text[] DEFAULT ARRAY[]::text[],
	"services_enrolled" text[] DEFAULT ARRAY[]::text[],
	"customer_type" text DEFAULT 'walk-in' NOT NULL,
	"source" text,
	"referred_by" varchar,
	"status" text DEFAULT 'active' NOT NULL,
	"last_visit_date" timestamp,
	"total_visits" integer DEFAULT 0,
	"total_spent" integer DEFAULT 0,
	"notes" text,
	"preferences" text[] DEFAULT ARRAY[]::text[],
	"allergies" text[] DEFAULT ARRAY[]::text[],
	"emergency_contact_name" text,
	"emergency_contact_phone" text,
	"documents" text[] DEFAULT ARRAY[]::text[],
	"avatar" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" varchar NOT NULL,
	"user_id" varchar,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"address" text,
	"city" text,
	"state" text,
	"pincode" text,
	"date_of_birth" timestamp,
	"gender" text,
	"role" text NOT NULL,
	"department" text,
	"joining_date" timestamp DEFAULT now() NOT NULL,
	"employment_type" text DEFAULT 'full-time' NOT NULL,
	"shift_start_time" text,
	"shift_end_time" text,
	"working_days" text[] DEFAULT ARRAY['Monday','Tuesday','Wednesday','Thursday','Friday']::text[],
	"id_proof_type" text,
	"id_proof_number" text,
	"id_proof_document" text,
	"certifications" text[] DEFAULT ARRAY[]::text[],
	"basic_salary" integer DEFAULT 0,
	"bank_account_number" text,
	"bank_ifsc_code" text,
	"bank_name" text,
	"permissions" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"avatar" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" varchar NOT NULL,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"custom_category" text,
	"amount" integer NOT NULL,
	"expense_date" timestamp DEFAULT now() NOT NULL,
	"payment_type" text NOT NULL,
	"paid_to" text,
	"status" text DEFAULT 'paid' NOT NULL,
	"supplier_id" varchar,
	"description" text,
	"notes" text,
	"receipt_url" text,
	"attachments" text[] DEFAULT ARRAY[]::text[],
	"is_recurring" boolean DEFAULT false NOT NULL,
	"recurring_frequency" text,
	"recurring_start_date" timestamp,
	"recurring_end_date" timestamp,
	"next_due_date" timestamp,
	"parent_expense_id" varchar,
	"department" text,
	"project_id" varchar,
	"tags" text[] DEFAULT ARRAY[]::text[],
	"ledger_transaction_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "greeting_template_usage" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" varchar NOT NULL,
	"vendor_id" varchar NOT NULL,
	"customized_image_url" text,
	"custom_text" json DEFAULT '{}'::json,
	"included_products" text[] DEFAULT ARRAY[]::text[],
	"included_services" text[] DEFAULT ARRAY[]::text[],
	"included_offers" text[] DEFAULT ARRAY[]::text[],
	"shared_on" text[] DEFAULT ARRAY[]::text[],
	"share_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "greeting_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"image_url" text NOT NULL,
	"thumbnail_url" text,
	"occasions" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"offer_types" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"industries" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"has_editable_text" boolean DEFAULT true NOT NULL,
	"editable_text_areas" json DEFAULT '[]'::json,
	"supports_logo" boolean DEFAULT true NOT NULL,
	"logo_position" json DEFAULT '{}'::json,
	"supports_products" boolean DEFAULT false NOT NULL,
	"supports_services" boolean DEFAULT false NOT NULL,
	"supports_offers" boolean DEFAULT false NOT NULL,
	"includes_platform_branding" boolean DEFAULT true NOT NULL,
	"event_date" timestamp,
	"expiry_date" timestamp,
	"is_trending" boolean DEFAULT false NOT NULL,
	"download_count" integer DEFAULT 0 NOT NULL,
	"share_count" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"uploaded_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "holidays" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" varchar NOT NULL,
	"name" text NOT NULL,
	"date" timestamp NOT NULL,
	"type" text DEFAULT 'public' NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_locations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" varchar NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"city" text,
	"state" text,
	"pincode" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_communications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" varchar NOT NULL,
	"vendor_id" varchar NOT NULL,
	"type" text NOT NULL,
	"direction" text DEFAULT 'outbound' NOT NULL,
	"subject" text,
	"notes" text NOT NULL,
	"outcome" text,
	"duration" integer,
	"attachments" text[] DEFAULT ARRAY[]::text[],
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_tasks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" varchar NOT NULL,
	"vendor_id" varchar NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"type" text DEFAULT 'follow_up' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"assigned_to" varchar,
	"assigned_by" varchar,
	"due_date" timestamp NOT NULL,
	"completed_at" timestamp,
	"reminder_enabled" boolean DEFAULT false,
	"reminder_time" timestamp,
	"completion_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" varchar NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"alternate_phone" text,
	"source" text DEFAULT 'offline' NOT NULL,
	"source_details" text,
	"status" text DEFAULT 'new' NOT NULL,
	"lost_reason" text,
	"interest_type" text,
	"interest_product_id" varchar,
	"interest_service_id" varchar,
	"interest_description" text,
	"assigned_employee_id" varchar,
	"priority" text DEFAULT 'medium' NOT NULL,
	"next_follow_up_date" timestamp,
	"converted_to_customer_id" varchar,
	"converted_at" timestamp,
	"estimated_budget" integer,
	"preferred_contact_method" text,
	"preferred_contact_time" text,
	"notes" text,
	"tags" text[] DEFAULT ARRAY[]::text[],
	"lead_score" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leave_balances" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" varchar NOT NULL,
	"employee_id" varchar NOT NULL,
	"leave_type" text NOT NULL,
	"total_days" numeric(4, 2) NOT NULL,
	"used_days" numeric(4, 2) DEFAULT 0.00 NOT NULL,
	"remaining_days" numeric(4, 2) NOT NULL,
	"year" integer NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leaves" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" varchar NOT NULL,
	"employee_id" varchar NOT NULL,
	"leave_type" text NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"number_of_days" numeric(4, 2) NOT NULL,
	"duration_type" text DEFAULT 'full' NOT NULL,
	"reason" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"approved_by" varchar,
	"approved_at" timestamp,
	"rejection_reason" text,
	"documents" text[] DEFAULT ARRAY[]::text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ledger_transactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" varchar NOT NULL,
	"customer_id" varchar,
	"type" text NOT NULL,
	"amount" integer NOT NULL,
	"transaction_date" timestamp DEFAULT now() NOT NULL,
	"category" text DEFAULT 'other' NOT NULL,
	"payment_method" text DEFAULT 'cash' NOT NULL,
	"description" text,
	"note" text,
	"reference_type" text,
	"reference_id" varchar,
	"is_recurring" boolean DEFAULT false,
	"recurring_pattern" text,
	"recurring_start_date" timestamp,
	"recurring_end_date" timestamp,
	"recurring_parent_id" varchar,
	"next_occurrence_date" timestamp,
	"attachments" text[] DEFAULT ARRAY[]::text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "master_products" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"category_id" varchar,
	"category" text NOT NULL,
	"subcategory_id" varchar,
	"subcategory" text,
	"brand" text,
	"icon" text NOT NULL,
	"description" text NOT NULL,
	"specifications" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"tags" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"base_price" integer,
	"unit" text NOT NULL,
	"image_keys" text[] DEFAULT ARRAY[]::text[],
	"images" text[] DEFAULT ARRAY[]::text[],
	"requires_prescription" boolean DEFAULT false,
	"is_universal" boolean DEFAULT true NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'published' NOT NULL,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "master_services" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"category_id" varchar,
	"category" text NOT NULL,
	"subcategory_id" varchar,
	"subcategory" text,
	"custom_unit" text,
	"service_type" text DEFAULT 'one-time' NOT NULL,
	"icon" text NOT NULL,
	"short_description" text,
	"detailed_description" text,
	"description" text NOT NULL,
	"benefits" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"features" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"highlights" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"inclusions" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"exclusions" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"tags" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"base_price" integer,
	"offer_price" integer,
	"tax_percentage" integer DEFAULT 0,
	"gst_included" boolean DEFAULT false,
	"available_days" text[] DEFAULT ARRAY[]::text[],
	"available_time_slots" text[] DEFAULT ARRAY[]::text[],
	"booking_required" boolean DEFAULT false,
	"free_trial_available" boolean DEFAULT false,
	"package_name" text,
	"package_type" text,
	"package_duration" text,
	"package_sessions" integer,
	"images" text[] DEFAULT ARRAY[]::text[],
	"thumbnail_image" text,
	"banner_image" text,
	"tagline" text,
	"promotional_caption" text,
	"linked_offers" text[] DEFAULT ARRAY[]::text[],
	"linked_products" text[] DEFAULT ARRAY[]::text[],
	"linked_packages" text[] DEFAULT ARRAY[]::text[],
	"sample_type" text,
	"tat" text,
	"is_universal" boolean DEFAULT true NOT NULL,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mini_website_leads" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mini_website_id" varchar NOT NULL,
	"vendor_id" varchar NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text NOT NULL,
	"message" text,
	"form_data" json,
	"source" text DEFAULT 'mini_website',
	"status" text DEFAULT 'new' NOT NULL,
	"converted_to_lead_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mini_website_reviews" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mini_website_id" varchar NOT NULL,
	"customer_name" text NOT NULL,
	"customer_email" text,
	"customer_phone" text,
	"rating" integer NOT NULL,
	"review_text" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mini_websites" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" varchar NOT NULL,
	"subdomain" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"published_at" timestamp,
	"completion_percentage" integer DEFAULT 0 NOT NULL,
	"business_info" json,
	"contact_info" json,
	"branding" json,
	"selected_catalog" json,
	"team" json,
	"faqs" json,
	"testimonials" json,
	"coupons" json,
	"seo" json,
	"lead_form" json,
	"features" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "mini_websites_vendor_id_unique" UNIQUE("vendor_id"),
	CONSTRAINT "mini_websites_subdomain_unique" UNIQUE("subdomain")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"vendor_id" varchar,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"type" text NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"link" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"vendor_product_id" varchar NOT NULL,
	"product_name" text NOT NULL,
	"product_brand" text,
	"product_unit" text NOT NULL,
	"quantity" integer NOT NULL,
	"price_per_unit" integer NOT NULL,
	"total_price" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" varchar NOT NULL,
	"customer_name" text NOT NULL,
	"customer_phone" text NOT NULL,
	"customer_email" text,
	"delivery_address" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"pincode" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"payment_status" text DEFAULT 'pending',
	"payment_method" text,
	"subtotal" integer NOT NULL,
	"delivery_charges" integer DEFAULT 0 NOT NULL,
	"total_amount" integer NOT NULL,
	"prescription_required" boolean DEFAULT false,
	"prescription_image" text,
	"notes" text,
	"assigned_to" varchar,
	"tracking_number" text,
	"estimated_delivery" timestamp,
	"delivered_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payroll" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" varchar NOT NULL,
	"employee_id" varchar NOT NULL,
	"month" integer NOT NULL,
	"year" integer NOT NULL,
	"basic_salary" integer NOT NULL,
	"overtime_hours" integer DEFAULT 0,
	"overtime_pay" integer DEFAULT 0,
	"bonuses" integer DEFAULT 0,
	"deductions" integer DEFAULT 0,
	"net_salary" integer NOT NULL,
	"payment_status" text DEFAULT 'pending' NOT NULL,
	"payment_date" timestamp,
	"payment_method" text,
	"notes" text,
	"pay_slip_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotation_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quotation_id" varchar NOT NULL,
	"item_type" text NOT NULL,
	"item_id" varchar,
	"item_name" text NOT NULL,
	"description" text,
	"quantity" numeric(10, 2) DEFAULT '1' NOT NULL,
	"rate" numeric(10, 2) NOT NULL,
	"tax_percent" numeric(5, 2) DEFAULT '0' NOT NULL,
	"tax_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"discount_percent" numeric(5, 2) DEFAULT '0' NOT NULL,
	"discount_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" varchar NOT NULL,
	"customer_id" varchar NOT NULL,
	"quotation_number" text NOT NULL,
	"quotation_date" timestamp DEFAULT now() NOT NULL,
	"valid_until" timestamp NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"subtotal" numeric(10, 2) DEFAULT '0' NOT NULL,
	"tax_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"discount_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"additional_charges" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"notes" text,
	"terms_and_conditions" text,
	"created_by" varchar,
	"sent_at" timestamp,
	"accepted_at" timestamp,
	"rejected_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "quotations_quotation_number_unique" UNIQUE("quotation_number")
);
--> statement-breakpoint
CREATE TABLE "stock_alerts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" varchar NOT NULL,
	"vendor_product_id" varchar NOT NULL,
	"batch_id" varchar,
	"alert_type" text NOT NULL,
	"severity" text DEFAULT 'medium' NOT NULL,
	"message" text NOT NULL,
	"current_stock" integer,
	"minimum_stock" integer,
	"expiry_date" timestamp,
	"status" text DEFAULT 'active' NOT NULL,
	"acknowledged_by" varchar,
	"acknowledged_at" timestamp,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_batches" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_product_id" varchar NOT NULL,
	"location_id" varchar,
	"batch_number" text,
	"purchase_price" integer,
	"selling_price" integer,
	"quantity" integer DEFAULT 0 NOT NULL,
	"expiry_date" timestamp,
	"warranty_end_date" timestamp,
	"supplier_name" text,
	"supplier_invoice" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_configs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_product_id" varchar NOT NULL,
	"minimum_stock" integer DEFAULT 10 NOT NULL,
	"reorder_point" integer DEFAULT 20 NOT NULL,
	"reorder_quantity" integer DEFAULT 50 NOT NULL,
	"expiry_alert_days" integer DEFAULT 30 NOT NULL,
	"track_expiry" boolean DEFAULT false NOT NULL,
	"track_batches" boolean DEFAULT false NOT NULL,
	"track_warranty" boolean DEFAULT false NOT NULL,
	"enable_low_stock_alerts" boolean DEFAULT true NOT NULL,
	"enable_expiry_alerts" boolean DEFAULT true NOT NULL,
	"notification_channels" text[] DEFAULT ARRAY['dashboard']::text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "stock_configs_vendor_product_id_unique" UNIQUE("vendor_product_id")
);
--> statement-breakpoint
CREATE TABLE "stock_movements" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" varchar NOT NULL,
	"vendor_product_id" varchar NOT NULL,
	"location_id" varchar,
	"batch_id" varchar,
	"movement_type" text NOT NULL,
	"quantity" integer NOT NULL,
	"previous_stock" integer NOT NULL,
	"new_stock" integer NOT NULL,
	"unit_cost" integer,
	"total_value" integer,
	"reference_type" text,
	"reference_id" varchar,
	"reason" text,
	"notes" text,
	"performed_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subcategories" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" varchar NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"icon" text,
	"icon_url" text,
	"created_by" text NOT NULL,
	"is_global" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription_plans" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"price" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"billing_interval" text DEFAULT 'month' NOT NULL,
	"max_services" integer DEFAULT -1,
	"max_products" integer DEFAULT -1,
	"max_employees" integer DEFAULT -1,
	"max_customers" integer DEFAULT -1,
	"max_orders" integer DEFAULT -1,
	"max_bookings" integer DEFAULT -1,
	"max_appointments" integer DEFAULT -1,
	"max_storage_gb" integer DEFAULT 1,
	"has_advanced_analytics" boolean DEFAULT false,
	"has_priority_support" boolean DEFAULT false,
	"has_custom_domain" boolean DEFAULT false,
	"has_mini_website" boolean DEFAULT false,
	"has_white_label" boolean DEFAULT false,
	"has_api" boolean DEFAULT false,
	"has_multi_location" boolean DEFAULT false,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_popular" boolean DEFAULT false,
	"display_order" integer DEFAULT 0,
	"trial_days" integer DEFAULT 0,
	"stripe_product_id" text,
	"stripe_price_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "supplier_payments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supplier_id" varchar NOT NULL,
	"vendor_id" varchar NOT NULL,
	"amount" integer NOT NULL,
	"payment_date" timestamp DEFAULT now() NOT NULL,
	"payment_mode" text NOT NULL,
	"description" text,
	"notes" text,
	"attachments" text[] DEFAULT ARRAY[]::text[],
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" varchar NOT NULL,
	"name" text NOT NULL,
	"business_name" text,
	"contact_person" text,
	"phone" text NOT NULL,
	"alternate_phone" text,
	"email" text,
	"gstin" text,
	"pan" text,
	"address_line_1" text,
	"address_line_2" text,
	"city" text,
	"state" text,
	"pincode" text,
	"country" text DEFAULT 'India',
	"category" text NOT NULL,
	"custom_category" text,
	"preferred_payment_mode" text,
	"account_holder_name" text,
	"bank_name" text,
	"account_number" text,
	"ifsc_code" text,
	"total_purchases" integer DEFAULT 0,
	"outstanding_balance" integer DEFAULT 0,
	"last_transaction_date" timestamp,
	"notes" text,
	"documents" text[] DEFAULT ARRAY[]::text[],
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" varchar NOT NULL,
	"created_by" varchar NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category" text DEFAULT 'general',
	"tags" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"due_date" timestamp,
	"reminder_date" timestamp,
	"assigned_to" varchar,
	"is_recurring" boolean DEFAULT false,
	"recurring_frequency" text,
	"recurring_end_date" timestamp,
	"attachments" text[] DEFAULT ARRAY[]::text[],
	"verification_required" boolean DEFAULT false,
	"verified_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" varchar NOT NULL,
	"booking_id" varchar,
	"appointment_id" varchar,
	"amount" integer NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"payment_method" text,
	"payment_id" text,
	"description" text,
	"metadata" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "units" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subcategory_id" varchar NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"created_by" text NOT NULL,
	"is_global" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usage_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" varchar NOT NULL,
	"feature" text NOT NULL,
	"action" text NOT NULL,
	"resource_id" text,
	"metadata" json,
	"log_date" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"role" text DEFAULT 'vendor' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vendor_catalogues" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" varchar NOT NULL,
	"master_service_id" varchar,
	"custom_service_request_id" varchar,
	"name" text NOT NULL,
	"category_id" varchar,
	"category" text NOT NULL,
	"subcategory_id" varchar,
	"subcategory" text,
	"custom_unit" text,
	"service_type" text DEFAULT 'one-time' NOT NULL,
	"icon" text NOT NULL,
	"short_description" text,
	"detailed_description" text,
	"description" text NOT NULL,
	"benefits" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"features" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"highlights" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"inclusions" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"exclusions" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"tags" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"price" integer NOT NULL,
	"offer_price" integer,
	"tax_percentage" integer DEFAULT 0,
	"gst_included" boolean DEFAULT false,
	"available_days" text[] DEFAULT ARRAY[]::text[],
	"available_time_slots" text[] DEFAULT ARRAY[]::text[],
	"booking_required" boolean DEFAULT false,
	"free_trial_available" boolean DEFAULT false,
	"package_name" text,
	"package_type" text,
	"package_duration" text,
	"package_sessions" integer,
	"images" text[] DEFAULT ARRAY[]::text[],
	"thumbnail_image" text,
	"banner_image" text,
	"tagline" text,
	"promotional_caption" text,
	"linked_offers" text[] DEFAULT ARRAY[]::text[],
	"linked_products" text[] DEFAULT ARRAY[]::text[],
	"linked_packages" text[] DEFAULT ARRAY[]::text[],
	"sample_type" text,
	"tat" text,
	"home_collection_available" boolean DEFAULT false NOT NULL,
	"home_collection_charges" integer DEFAULT 0,
	"discount_percentage" integer DEFAULT 0,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendor_products" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" varchar NOT NULL,
	"master_product_id" varchar,
	"master_version_at_adoption" integer,
	"adopted_at" timestamp,
	"category_id" varchar,
	"category" text NOT NULL,
	"subcategory_id" varchar,
	"subcategory" text,
	"name" text NOT NULL,
	"brand" text,
	"icon" text NOT NULL,
	"description" text NOT NULL,
	"specifications" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"tags" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"price" integer NOT NULL,
	"unit" text NOT NULL,
	"image_keys" text[] DEFAULT ARRAY[]::text[],
	"images" text[] DEFAULT ARRAY[]::text[],
	"stock" integer DEFAULT 0 NOT NULL,
	"requires_prescription" boolean DEFAULT false,
	"is_active" boolean DEFAULT true NOT NULL,
	"discount_percentage" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendor_subscriptions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" varchar NOT NULL,
	"plan_id" varchar NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"start_date" timestamp DEFAULT now() NOT NULL,
	"current_period_start" timestamp DEFAULT now() NOT NULL,
	"current_period_end" timestamp NOT NULL,
	"trial_end_date" timestamp,
	"canceled_at" timestamp,
	"ended_at" timestamp,
	"stripe_subscription_id" text,
	"stripe_customer_id" text,
	"current_month_orders" integer DEFAULT 0,
	"current_month_bookings" integer DEFAULT 0,
	"current_month_appointments" integer DEFAULT 0,
	"last_usage_reset" timestamp DEFAULT now(),
	"auto_renew" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"business_name" text NOT NULL,
	"owner_name" text NOT NULL,
	"category" text NOT NULL,
	"subcategory" text NOT NULL,
	"custom_category" text,
	"custom_subcategory" text,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"whatsapp_number" text NOT NULL,
	"street" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"pincode" text NOT NULL,
	"address" text NOT NULL,
	"logo" text,
	"banner" text,
	"description" text NOT NULL,
	"license_number" text,
	"gst_number" text,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"status" text DEFAULT 'pending' NOT NULL,
	"onboarding_complete" boolean DEFAULT false NOT NULL,
	"bank_account_name" text,
	"bank_account_number" text,
	"bank_ifsc_code" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_items" ADD CONSTRAINT "bill_items_bill_id_bills_id_fk" FOREIGN KEY ("bill_id") REFERENCES "public"."bills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_items" ADD CONSTRAINT "bill_items_product_id_vendor_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."vendor_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_items" ADD CONSTRAINT "bill_items_service_id_vendor_catalogues_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."vendor_catalogues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_items" ADD CONSTRAINT "bill_items_assigned_employee_id_employees_id_fk" FOREIGN KEY ("assigned_employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_payments" ADD CONSTRAINT "bill_payments_bill_id_bills_id_fk" FOREIGN KEY ("bill_id") REFERENCES "public"."bills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_history" ADD CONSTRAINT "billing_history_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_history" ADD CONSTRAINT "billing_history_subscription_id_vendor_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."vendor_subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_history" ADD CONSTRAINT "billing_history_plan_id_subscription_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bills" ADD CONSTRAINT "bills_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bills" ADD CONSTRAINT "bills_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bills" ADD CONSTRAINT "bills_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_vendor_catalogue_id_vendor_catalogues_id_fk" FOREIGN KEY ("vendor_catalogue_id") REFERENCES "public"."vendor_catalogues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_service_requests" ADD CONSTRAINT "custom_service_requests_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_service_requests" ADD CONSTRAINT "custom_service_requests_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_attendance" ADD CONSTRAINT "customer_attendance_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_attendance" ADD CONSTRAINT "customer_attendance_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_tasks" ADD CONSTRAINT "customer_tasks_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_tasks" ADD CONSTRAINT "customer_tasks_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_tasks" ADD CONSTRAINT "customer_tasks_assigned_to_employees_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_visits" ADD CONSTRAINT "customer_visits_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_visits" ADD CONSTRAINT "customer_visits_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_visits" ADD CONSTRAINT "customer_visits_attended_by_employees_id_fk" FOREIGN KEY ("attended_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "greeting_template_usage" ADD CONSTRAINT "greeting_template_usage_template_id_greeting_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."greeting_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "greeting_template_usage" ADD CONSTRAINT "greeting_template_usage_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "greeting_templates" ADD CONSTRAINT "greeting_templates_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "holidays" ADD CONSTRAINT "holidays_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_locations" ADD CONSTRAINT "inventory_locations_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_communications" ADD CONSTRAINT "lead_communications_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_communications" ADD CONSTRAINT "lead_communications_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_communications" ADD CONSTRAINT "lead_communications_created_by_employees_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_tasks" ADD CONSTRAINT "lead_tasks_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_tasks" ADD CONSTRAINT "lead_tasks_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_tasks" ADD CONSTRAINT "lead_tasks_assigned_to_employees_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_tasks" ADD CONSTRAINT "lead_tasks_assigned_by_employees_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_interest_product_id_vendor_products_id_fk" FOREIGN KEY ("interest_product_id") REFERENCES "public"."vendor_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_interest_service_id_vendor_catalogues_id_fk" FOREIGN KEY ("interest_service_id") REFERENCES "public"."vendor_catalogues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_employee_id_employees_id_fk" FOREIGN KEY ("assigned_employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_converted_to_customer_id_customers_id_fk" FOREIGN KEY ("converted_to_customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_balances" ADD CONSTRAINT "leave_balances_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_balances" ADD CONSTRAINT "leave_balances_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leaves" ADD CONSTRAINT "leaves_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leaves" ADD CONSTRAINT "leaves_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leaves" ADD CONSTRAINT "leaves_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_transactions" ADD CONSTRAINT "ledger_transactions_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_transactions" ADD CONSTRAINT "ledger_transactions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "master_products" ADD CONSTRAINT "master_products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "master_products" ADD CONSTRAINT "master_products_subcategory_id_subcategories_id_fk" FOREIGN KEY ("subcategory_id") REFERENCES "public"."subcategories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "master_products" ADD CONSTRAINT "master_products_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "master_services" ADD CONSTRAINT "master_services_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "master_services" ADD CONSTRAINT "master_services_subcategory_id_subcategories_id_fk" FOREIGN KEY ("subcategory_id") REFERENCES "public"."subcategories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "master_services" ADD CONSTRAINT "master_services_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mini_website_leads" ADD CONSTRAINT "mini_website_leads_mini_website_id_mini_websites_id_fk" FOREIGN KEY ("mini_website_id") REFERENCES "public"."mini_websites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mini_website_leads" ADD CONSTRAINT "mini_website_leads_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mini_website_leads" ADD CONSTRAINT "mini_website_leads_converted_to_lead_id_leads_id_fk" FOREIGN KEY ("converted_to_lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mini_website_reviews" ADD CONSTRAINT "mini_website_reviews_mini_website_id_mini_websites_id_fk" FOREIGN KEY ("mini_website_id") REFERENCES "public"."mini_websites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mini_websites" ADD CONSTRAINT "mini_websites_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_vendor_product_id_vendor_products_id_fk" FOREIGN KEY ("vendor_product_id") REFERENCES "public"."vendor_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll" ADD CONSTRAINT "payroll_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll" ADD CONSTRAINT "payroll_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_items" ADD CONSTRAINT "quotation_items_quotation_id_quotations_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_created_by_employees_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_alerts" ADD CONSTRAINT "stock_alerts_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_alerts" ADD CONSTRAINT "stock_alerts_vendor_product_id_vendor_products_id_fk" FOREIGN KEY ("vendor_product_id") REFERENCES "public"."vendor_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_alerts" ADD CONSTRAINT "stock_alerts_batch_id_stock_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."stock_batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_alerts" ADD CONSTRAINT "stock_alerts_acknowledged_by_users_id_fk" FOREIGN KEY ("acknowledged_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_batches" ADD CONSTRAINT "stock_batches_vendor_product_id_vendor_products_id_fk" FOREIGN KEY ("vendor_product_id") REFERENCES "public"."vendor_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_batches" ADD CONSTRAINT "stock_batches_location_id_inventory_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."inventory_locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_configs" ADD CONSTRAINT "stock_configs_vendor_product_id_vendor_products_id_fk" FOREIGN KEY ("vendor_product_id") REFERENCES "public"."vendor_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_vendor_product_id_vendor_products_id_fk" FOREIGN KEY ("vendor_product_id") REFERENCES "public"."vendor_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_location_id_inventory_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."inventory_locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_batch_id_stock_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."stock_batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subcategories" ADD CONSTRAINT "subcategories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_payments" ADD CONSTRAINT "supplier_payments_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_payments" ADD CONSTRAINT "supplier_payments_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_to_employees_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "units" ADD CONSTRAINT "units_subcategory_id_subcategories_id_fk" FOREIGN KEY ("subcategory_id") REFERENCES "public"."subcategories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_logs" ADD CONSTRAINT "usage_logs_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_catalogues" ADD CONSTRAINT "vendor_catalogues_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_catalogues" ADD CONSTRAINT "vendor_catalogues_master_service_id_master_services_id_fk" FOREIGN KEY ("master_service_id") REFERENCES "public"."master_services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_catalogues" ADD CONSTRAINT "vendor_catalogues_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_catalogues" ADD CONSTRAINT "vendor_catalogues_subcategory_id_subcategories_id_fk" FOREIGN KEY ("subcategory_id") REFERENCES "public"."subcategories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_products" ADD CONSTRAINT "vendor_products_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_products" ADD CONSTRAINT "vendor_products_master_product_id_master_products_id_fk" FOREIGN KEY ("master_product_id") REFERENCES "public"."master_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_products" ADD CONSTRAINT "vendor_products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_products" ADD CONSTRAINT "vendor_products_subcategory_id_subcategories_id_fk" FOREIGN KEY ("subcategory_id") REFERENCES "public"."subcategories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_subscriptions" ADD CONSTRAINT "vendor_subscriptions_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_subscriptions" ADD CONSTRAINT "vendor_subscriptions_plan_id_subscription_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;