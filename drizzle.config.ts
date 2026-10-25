import { defineConfig } from "drizzle-kit";

// drizzle-kit does not load .env.local on its own
process.loadEnvFile(".env.local");

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
