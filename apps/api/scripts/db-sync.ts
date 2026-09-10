/**
 * Verify (and optionally sync) MySQL against the SQL source of truth.
 *
 * Usage:
 *   pnpm db:sync              # report only; exit 1 if anything missing
 *   pnpm db:sync -- --apply   # create DB / baseline / pending migrations when safe
 *   pnpm db:sync -- --json    # machine-readable report
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { createConnection, type Connection, type RowDataPacket } from 'mysql2/promise';
import {
  resolveDatabaseConnection,
  type DatabaseConnectionParts,
} from '../src/config/database-connection';

type CheckStatus = 'ok' | 'missing' | 'partial' | 'error';

type DbSyncReport = {
  connection: {
    host: string;
    port: number;
    user: string;
    database: string;
  };
  server: { ok: boolean; version?: string; error?: string };
  database: { status: CheckStatus; exists: boolean };
  tables: {
    status: CheckStatus;
    expected: number;
    present: number;
    /** All BASE TABLE names currently in the database (sorted). */
    names: string[];
    missing: string[];
    extra: string[];
  };
  migrations: {
    status: CheckStatus;
    filesOnDisk: string[];
    trackingTableExists: boolean;
    applied: string[];
    pending: string[];
  };
  actions: string[];
  ok: boolean;
};

const API_ROOT = resolve(__dirname, '..');
const REPO_ROOT = resolve(API_ROOT, '../..');
const SCHEMA_PATH = join(REPO_ROOT, 'database', 'sql', 'sinfinity_schema.sql');
const MIGRATIONS_DIR = join(REPO_ROOT, 'database', 'sql', 'migrations');

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

function parseFlags(argv: string[]): { apply: boolean; json: boolean } {
  return {
    apply: argv.includes('--apply'),
    json: argv.includes('--json'),
  };
}

function extractExpectedTables(schemaSql: string): string[] {
  const names = new Set<string>();
  const re = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`([^`]+)`/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(schemaSql)) != null) {
    names.add(match[1]);
  }
  return [...names].sort();
}

function listMigrationFiles(): string[] {
  if (!existsSync(MIGRATIONS_DIR)) {
    return [];
  }
  return readdirSync(MIGRATIONS_DIR)
    .filter((name) => /^\d{3}_.+\.sql$/i.test(name))
    .sort();
}

async function connectServer(parts: DatabaseConnectionParts): Promise<Connection> {
  return createConnection({
    host: parts.host,
    port: parts.port,
    user: parts.user,
    password: parts.password,
    multipleStatements: true,
  });
}

async function connectDatabase(parts: DatabaseConnectionParts): Promise<Connection> {
  return createConnection({
    host: parts.host,
    port: parts.port,
    user: parts.user,
    password: parts.password,
    database: parts.database,
    multipleStatements: true,
  });
}

async function databaseExists(
  conn: Connection,
  database: string,
): Promise<boolean> {
  const [rows] = await conn.query<RowDataPacket[]>(
    'SELECT SCHEMA_NAME AS name FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?',
    [database],
  );
  return rows.length > 0;
}

async function listPresentTables(
  conn: Connection,
  database: string,
): Promise<string[]> {
  const [rows] = await conn.query<RowDataPacket[]>(
    `SELECT TABLE_NAME AS name
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = ?
       AND TABLE_TYPE = 'BASE TABLE'
     ORDER BY TABLE_NAME`,
    [database],
  );
  return rows.map((row) => String(row.name));
}

async function trackingTableExists(
  conn: Connection,
  database: string,
): Promise<boolean> {
  const [rows] = await conn.query<RowDataPacket[]>(
    `SELECT 1 AS ok
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'schema_migrations'
     LIMIT 1`,
    [database],
  );
  return rows.length > 0;
}

async function listAppliedMigrations(conn: Connection): Promise<string[]> {
  const [rows] = await conn.query<RowDataPacket[]>(
    'SELECT id FROM schema_migrations ORDER BY id',
  );
  return rows.map((row) => String(row.id));
}

async function ensureTrackingTable(conn: Connection): Promise<void> {
  await conn.query(`
    CREATE TABLE IF NOT EXISTS \`schema_migrations\` (
      \`id\` VARCHAR(255) NOT NULL,
      \`applied_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

async function applySqlFile(conn: Connection, filePath: string): Promise<void> {
  const sql = readFileSync(filePath, 'utf8');
  await conn.query(sql);
}

function printHuman(report: DbSyncReport): void {
  const line = (label: string, value: string) => {
    // eslint-disable-next-line no-console
    console.log(`${label.padEnd(14)} ${value}`);
  };

  // eslint-disable-next-line no-console
  console.log('');
  // eslint-disable-next-line no-console
  console.log('Sinfinity db:sync');
  // eslint-disable-next-line no-console
  console.log('────────────────');
  line(
    'Target',
    `${report.connection.user}@${report.connection.host}:${report.connection.port}/${report.connection.database}`,
  );
  line(
    'Server',
    report.server.ok
      ? `OK (${report.server.version ?? 'mysql'})`
      : `FAIL (${report.server.error})`,
  );
  line(
    'Database',
    report.database.exists
      ? `OK (${report.connection.database})`
      : `MISSING (${report.connection.database})`,
  );
  line(
    'Tables',
    `${report.tables.present}/${report.tables.expected} matched baseline` +
      (report.tables.names.length
        ? ` — ${report.tables.names.length} in database`
        : ''),
  );
  if (report.tables.names.length) {
    // eslint-disable-next-line no-console
    console.log('');
    // eslint-disable-next-line no-console
    console.log(`Tables present (${report.tables.names.length})`);
    for (const name of report.tables.names) {
      // eslint-disable-next-line no-console
      console.log(`  • ${name}`);
    }
  }
  if (report.tables.missing.length) {
    // eslint-disable-next-line no-console
    console.log('');
    // eslint-disable-next-line no-console
    console.log(`Tables missing (${report.tables.missing.length})`);
    for (const name of report.tables.missing) {
      // eslint-disable-next-line no-console
      console.log(`  ✗ ${name}`);
    }
  }
  if (report.tables.extra.length) {
    // eslint-disable-next-line no-console
    console.log('');
    // eslint-disable-next-line no-console
    console.log(
      `Tables extra / not in baseline (${report.tables.extra.length})`,
    );
    for (const name of report.tables.extra) {
      // eslint-disable-next-line no-console
      console.log(`  + ${name}`);
    }
  }
  line(
    'Migrations',
    `${report.migrations.filesOnDisk.length} file(s) on disk` +
      (report.migrations.trackingTableExists
        ? `, ${report.migrations.applied.length} applied, ${report.migrations.pending.length} pending`
        : ', tracking table schema_migrations absent'),
  );

  if (report.migrations.filesOnDisk.length === 0) {
    // eslint-disable-next-line no-console
    console.log(
      '               (no NNN_*.sql yet — baseline-only installs are fine)',
    );
  } else if (report.migrations.pending.length) {
    // eslint-disable-next-line no-console
    console.log(
      `               pending: ${report.migrations.pending.join(', ')}`,
    );
  }

  if (report.actions.length) {
    // eslint-disable-next-line no-console
    console.log('');
    // eslint-disable-next-line no-console
    console.log('Actions');
    for (const action of report.actions) {
      // eslint-disable-next-line no-console
      console.log(`  • ${action}`);
    }
  }

  // eslint-disable-next-line no-console
  console.log('');
  // eslint-disable-next-line no-console
  console.log(report.ok ? 'Result: OK' : 'Result: NEEDS ATTENTION');
}

async function main(): Promise<void> {
  const flags = parseFlags(process.argv.slice(2));
  loadEnvFile(join(API_ROOT, '.env'));

  if (!existsSync(SCHEMA_PATH)) {
    throw new Error(`Baseline schema not found: ${SCHEMA_PATH}`);
  }

  const parts = resolveDatabaseConnection(process.env);
  const expectedTables = extractExpectedTables(
    readFileSync(SCHEMA_PATH, 'utf8'),
  ).filter((name) => name !== 'schema_migrations');
  const migrationFiles = listMigrationFiles();

  const report: DbSyncReport = {
    connection: {
      host: parts.host,
      port: parts.port,
      user: parts.user,
      database: parts.database,
    },
    server: { ok: false },
    database: { status: 'missing', exists: false },
    tables: {
      status: 'missing',
      expected: expectedTables.length,
      present: 0,
      names: [],
      missing: [...expectedTables],
      extra: [],
    },
    migrations: {
      status: migrationFiles.length ? 'partial' : 'ok',
      filesOnDisk: migrationFiles,
      trackingTableExists: false,
      applied: [],
      pending: [...migrationFiles],
    },
    actions: [],
    ok: false,
  };

  let serverConn: Connection | undefined;
  let dbConn: Connection | undefined;

  try {
    try {
      serverConn = await connectServer(parts);
      const [versionRows] = await serverConn.query<RowDataPacket[]>(
        'SELECT VERSION() AS version',
      );
      report.server = {
        ok: true,
        version: String(versionRows[0]?.version ?? ''),
      };
    } catch (error) {
      report.server = {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
      report.ok = false;
      if (flags.json) {
        // eslint-disable-next-line no-console
        console.log(JSON.stringify(report, null, 2));
      } else {
        printHuman(report);
      }
      process.exitCode = 1;
      return;
    }

    report.database.exists = await databaseExists(serverConn, parts.database);
    report.database.status = report.database.exists ? 'ok' : 'missing';

    if (!report.database.exists && flags.apply) {
      await serverConn.query(
        `CREATE DATABASE IF NOT EXISTS \`${parts.database}\`
         DEFAULT CHARACTER SET utf8mb4
         DEFAULT COLLATE utf8mb4_unicode_ci`,
      );
      report.actions.push(`Created database \`${parts.database}\``);
      report.database.exists = true;
      report.database.status = 'ok';
    }

    if (report.database.exists) {
      dbConn = await connectDatabase(parts);
      let present = await listPresentTables(dbConn, parts.database);
      const businessPresent = present.filter(
        (name) => name !== 'schema_migrations',
      );

      if (businessPresent.length === 0 && flags.apply) {
        await applySqlFile(dbConn, SCHEMA_PATH);
        report.actions.push(
          `Applied baseline ${basename(SCHEMA_PATH)} (empty database)`,
        );
        present = await listPresentTables(dbConn, parts.database);
      }

      const presentSet = new Set(
        present.filter((name) => name !== 'schema_migrations'),
      );
      const expectedSet = new Set(expectedTables);
      report.tables.names = [...present].sort();
      report.tables.present = [...expectedSet].filter((t) =>
        presentSet.has(t),
      ).length;
      report.tables.missing = expectedTables.filter((t) => !presentSet.has(t));
      report.tables.extra = present.filter((t) => !expectedSet.has(t));
      report.tables.status =
        report.tables.missing.length === 0
          ? 'ok'
          : report.tables.present === 0
            ? 'missing'
            : 'partial';

      if (
        report.tables.status === 'partial' &&
        flags.apply &&
        report.tables.present > 0
      ) {
        report.actions.push(
          `Partial schema detected (${report.tables.missing.length} missing table(s)) — not auto-patched; add/apply SQL migrations instead`,
        );
      }

      report.migrations.trackingTableExists = await trackingTableExists(
        dbConn,
        parts.database,
      );

      if (flags.apply) {
        await ensureTrackingTable(dbConn);
        if (!report.migrations.trackingTableExists) {
          report.actions.push('Ensured table `schema_migrations`');
          report.migrations.trackingTableExists = true;
        }

        // Bootstrap: if baseline just applied / DB already full and tracking empty,
        // mark nothing unless we apply real migration files.
        for (const file of migrationFiles) {
          const applied = await listAppliedMigrations(dbConn);
          if (applied.includes(file)) {
            continue;
          }
          const filePath = join(MIGRATIONS_DIR, file);
          await applySqlFile(dbConn, filePath);
          await dbConn.query(
            'INSERT INTO schema_migrations (id) VALUES (?)',
            [file],
          );
          report.actions.push(`Applied migration ${file}`);
        }
      }

      if (report.migrations.trackingTableExists) {
        report.migrations.applied = await listAppliedMigrations(dbConn);
        report.migrations.pending = migrationFiles.filter(
          (file) => !report.migrations.applied.includes(file),
        );
      } else {
        report.migrations.applied = [];
        report.migrations.pending = [...migrationFiles];
      }

      if (migrationFiles.length === 0) {
        report.migrations.status = 'ok';
      } else if (
        report.migrations.trackingTableExists &&
        report.migrations.pending.length === 0
      ) {
        report.migrations.status = 'ok';
      } else if (
        report.migrations.trackingTableExists &&
        report.migrations.applied.length > 0
      ) {
        report.migrations.status = 'partial';
      } else {
        report.migrations.status = 'missing';
      }
    } else if (!flags.apply) {
      report.actions.push(
        'Run `pnpm db:sync -- --apply` to create the database and apply the baseline',
      );
    }

    report.ok =
      report.server.ok &&
      report.database.status === 'ok' &&
      report.tables.status === 'ok' &&
      (report.migrations.status === 'ok' ||
        (report.migrations.filesOnDisk.length === 0 &&
          report.tables.status === 'ok'));

    if (!report.ok && !flags.apply && report.database.exists) {
      if (report.tables.status !== 'ok') {
        report.actions.push(
          report.tables.present === 0
            ? 'Empty database: `pnpm db:sync -- --apply` will load sinfinity_schema.sql'
            : 'Missing tables: write/apply incremental SQL under database/sql/migrations/',
        );
      }
      if (
        report.migrations.filesOnDisk.length > 0 &&
        report.migrations.pending.length > 0
      ) {
        report.actions.push(
          'Pending migrations: `pnpm db:sync -- --apply` applies them in order',
        );
      }
    }

    if (flags.json) {
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(report, null, 2));
    } else {
      printHuman(report);
    }

    process.exitCode = report.ok ? 0 : 1;
  } finally {
    await dbConn?.end().catch(() => undefined);
    await serverConn?.end().catch(() => undefined);
  }
}

main().catch((error: unknown) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exitCode = 1;
});
