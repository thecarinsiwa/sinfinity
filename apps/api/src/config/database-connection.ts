/**
 * Build / parse MySQL connection settings for the API and drizzle-kit.
 */

export type DatabaseConnectionParts = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
};

export function composeDatabaseUrl(parts: DatabaseConnectionParts): string {
  const user = encodeURIComponent(parts.user);
  const passwordSegment =
    parts.password.length > 0
      ? `:${encodeURIComponent(parts.password)}`
      : '';
  return `mysql://${user}${passwordSegment}@${parts.host}:${parts.port}/${parts.database}`;
}

export function parseDatabaseUrl(url: string): DatabaseConnectionParts {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('DATABASE_URL is not a valid URL');
  }

  if (parsed.protocol !== 'mysql:' && parsed.protocol !== 'mysql2:') {
    throw new Error('DATABASE_URL must use mysql:// scheme');
  }

  const database = parsed.pathname.replace(/^\//, '').trim();
  if (!database) {
    throw new Error('DATABASE_URL must include a database name');
  }

  return {
    host: parsed.hostname || '127.0.0.1',
    port: parsed.port ? Number(parsed.port) : 3306,
    user: decodeURIComponent(parsed.username || 'root'),
    password: decodeURIComponent(parsed.password || ''),
    database,
  };
}

/**
 * Prefer discrete DATABASE_* vars when present; otherwise parse DATABASE_URL.
 */
export function resolveDatabaseConnection(
  raw: Record<string, unknown>,
): DatabaseConnectionParts {
  const host = optionalString(raw.DATABASE_HOST);
  const user = optionalString(raw.DATABASE_USER);
  const database = optionalString(raw.DATABASE_NAME);
  const hasDiscrete = Boolean(host || user || database);

  if (hasDiscrete) {
    if (!host || !user || !database) {
      throw new Error(
        'DATABASE_HOST, DATABASE_USER and DATABASE_NAME are required together (or use DATABASE_URL)',
      );
    }

    const portRaw = raw.DATABASE_PORT;
    const port =
      portRaw === undefined || portRaw === ''
        ? 3306
        : Number(portRaw);
    if (!Number.isInteger(port) || port <= 0) {
      throw new Error('DATABASE_PORT must be a positive integer');
    }

    return {
      host,
      port,
      user,
      password: optionalString(raw.DATABASE_PASSWORD) ?? '',
      database,
    };
  }

  const url = optionalString(raw.DATABASE_URL);
  if (!url) {
    throw new Error(
      'Database config required: set DATABASE_HOST/USER/NAME (and optional PORT/PASSWORD) or DATABASE_URL',
    );
  }

  return parseDatabaseUrl(url);
}

function optionalString(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
