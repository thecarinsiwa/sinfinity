/**
 * drizzle-kit introspect also writes a SQL dump + meta journal.
 * Those are discarded: the canonical DDL is database/sql/sinfinity_schema.sql
 */
import { readdirSync, rmSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

const schemaDir = join(process.cwd(), 'src/database/schema');

for (const file of readdirSync(schemaDir)) {
  if (file.endsWith('.sql')) {
    unlinkSync(join(schemaDir, file));
  }
}

rmSync(join(schemaDir, 'meta'), { recursive: true, force: true });
