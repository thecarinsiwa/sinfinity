import type { MySql2Database } from 'drizzle-orm/mysql2';
import type * as schema from './schema';

export type DrizzleDB = MySql2Database<typeof schema>;
