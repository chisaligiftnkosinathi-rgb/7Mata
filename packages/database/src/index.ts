import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema/index.js';

let clientInstance: postgres.Sql | undefined;
let dbInstance: ReturnType<typeof drizzle> | undefined;

export function getClient(): postgres.Sql {
  if (!clientInstance) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is required to initialize postgres client');
    }
    clientInstance = postgres(connectionString, {
      max: Number(process.env.DB_POOL_SIZE ?? 10),
    });
  }
  return clientInstance;
}

export function getDb() {
  if (!dbInstance) {
    dbInstance = drizzle(getClient(), { schema });
  }
  return dbInstance;
}

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    return (getDb() as any)[prop];
  },
});

export const client = new Proxy({} as postgres.Sql, {
  get(_target, prop) {
    return (getClient() as any)[prop];
  },
});

export * from './schema/index.js';
