/**
 * Introspection only.
 * Do not use drizzle-kit generate / push to create or replace DDL.
 * Source of truth: database/sql/sinfinity_schema.sql
 */
import { defineConfig } from 'drizzle-kit';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL is required for drizzle-kit. Copy .env.example to .env in apps/api.',
  );
}

export default defineConfig({
  dialect: 'mysql',
  schema: './src/database/schema/index.ts',
  out: './src/database/schema',
  dbCredentials: {
    url: databaseUrl,
  },
  introspect: {
    casing: 'preserve',
  },
});
