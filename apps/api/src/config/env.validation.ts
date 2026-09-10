import { z } from 'zod';
import { DEFAULT_CORS_ORIGINS, DEFAULT_PORT } from './constants';
import {
  composeDatabaseUrl,
  resolveDatabaseConnection,
} from './database-connection';

const corsOriginsSchema = z
  .string()
  .default(DEFAULT_CORS_ORIGINS.join(','))
  .transform((value) =>
    value
      .split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0),
  )
  .refine((origins) => origins.length > 0, {
    message: 'must contain at least one origin',
  });

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(DEFAULT_PORT),
  DATABASE_HOST: z.string().min(1),
  DATABASE_PORT: z.coerce.number().int().positive().default(3306),
  DATABASE_USER: z.string().min(1),
  DATABASE_PASSWORD: z.string().default(''),
  DATABASE_NAME: z.string().min(1),
  /** Always derived for drizzle-kit / tooling; prefer discrete DATABASE_* at runtime. */
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32, 'must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'must be at least 32 characters'),
  JWT_ACCESS_TTL: z.string().min(1).default('15m'),
  JWT_REFRESH_TTL: z.string().min(1).default('7d'),
  JWT_PASSWORD_RESET_TTL: z.string().min(1).default('1h'),
  CORS_ORIGINS: corsOriginsSchema,
  STORAGE_DRIVER: z.enum(['local']).default('local'),
  STORAGE_LOCAL_ROOT: z.string().min(1).default('./storage/uploads'),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Map alternate env names used by other apps in the monorepo / shared .env style.
 */
function applyEnvAliases(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const next = { ...config };

  if (next.PORT == null && next.API_PORT != null) {
    next.PORT = next.API_PORT;
  }
  if (next.CORS_ORIGINS == null && next.CORS_ORIGIN != null) {
    next.CORS_ORIGINS = next.CORS_ORIGIN;
  }
  if (next.JWT_ACCESS_TTL == null && next.JWT_ACCESS_EXPIRES_IN != null) {
    next.JWT_ACCESS_TTL = next.JWT_ACCESS_EXPIRES_IN;
  }
  if (next.JWT_REFRESH_TTL == null && next.JWT_REFRESH_EXPIRES_IN != null) {
    next.JWT_REFRESH_TTL = next.JWT_REFRESH_EXPIRES_IN;
  }

  return next;
}

export function validateEnv(config: Record<string, unknown>): Env {
  const aliased = applyEnvAliases(config);

  let dbParts;
  try {
    dbParts = resolveDatabaseConnection(aliased);
  } catch (error) {
    throw new Error(
      `Invalid environment variables: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  const withDatabase = {
    ...aliased,
    DATABASE_HOST: dbParts.host,
    DATABASE_PORT: dbParts.port,
    DATABASE_USER: dbParts.user,
    DATABASE_PASSWORD: dbParts.password,
    DATABASE_NAME: dbParts.database,
    DATABASE_URL: composeDatabaseUrl(dbParts),
  };

  const parsed = envSchema.safeParse(withDatabase);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || 'env'}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid environment variables: ${issues}`);
  }

  return parsed.data;
}
