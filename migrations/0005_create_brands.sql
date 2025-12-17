-- Create brands table
CREATE TABLE IF NOT EXISTS "brands" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" varchar NOT NULL REFERENCES "categories"("id") ON DELETE CASCADE,
	"name" text NOT NULL,
	"logo" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create index on category_id for faster lookups
CREATE INDEX IF NOT EXISTS "brands_category_id_idx" ON "brands"("category_id");

-- Create index on name for faster searches
CREATE INDEX IF NOT EXISTS "brands_name_idx" ON "brands"("name");

