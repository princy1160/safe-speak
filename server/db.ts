import pg from "pg"; // Use pg instead of neon
import { drizzle } from "drizzle-orm/node-postgres"; // Use node-postgres adapter
import * as schema from "@shared/schema";
import dotenv from "dotenv";

const {Pool}=pg

dotenv.config({ path: './server/.env' });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set.");
}

// Create connection pool using DATABASE_URL
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Initialize Drizzle ORM with Pool and schema
export const db = drizzle(pool, { schema });
