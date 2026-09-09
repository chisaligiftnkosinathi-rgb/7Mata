import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema/index.js';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}

const client = postgres(connectionString, {
  max: Number(process.env.DB_POOL_SIZE ?? 10),
});

export const db = drizzle(client, { schema });
export { client };
export * from './schema/index.js';
