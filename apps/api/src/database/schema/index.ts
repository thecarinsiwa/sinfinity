/**
 * Drizzle table + relation mappings introspected from MySQL.
 * DDL source of truth: database/sql/sinfinity_schema.sql
 *
 * Refresh after applying the SQL schema:
 *   pnpm --filter @sinfinity/api db:introspect
 */
export * from './schema';
export * from './relations';
