/**
 * Database Connection
 * Neon PostgreSQL with Drizzle ORM
 */

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Allow build to succeed without DATABASE_URL (runtime check in API routes)
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/db';

const sql = neon(DATABASE_URL);
export const db = drizzle(sql, { schema });

export * from './schema';
