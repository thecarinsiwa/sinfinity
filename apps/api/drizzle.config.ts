/**
 * Introspection only.
 * Do not use drizzle-kit generate / push to create or replace DDL.
 * Source of truth: database/sql/sinfinity_schema.sql
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'drizzle-kit';
import {
  composeDatabaseUrl,
  resolveDatabaseConnection,
} from './src/config/database-connection';

function loadEnvFile(filePath: string): void {
  if (!existsSync(filePath)) {
    return;
  }
  for (const line of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const eq = trimmed.indexOf('=');
    if (eq <= 0) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(resolve(__dirname, '.env'));

let databaseUrl: string;
try {
  databaseUrl = composeDatabaseUrl(resolveDatabaseConnection(process.env));
} catch (error) {
  throw new Error(
    `${error instanceof Error ? error.message : String(error)}. Copy .env.example to .env in apps/api.`,
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
