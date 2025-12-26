import type { Config } from "drizzle-kit";

export default {
  schema: "./shared/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.NEW_DATABASE_URL || process.env.DATABASE_URL || "",
  },
} satisfies Config;

