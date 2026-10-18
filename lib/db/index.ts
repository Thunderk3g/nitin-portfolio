import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Runtime database client (server-only).
 *
 * Connects through the Supabase transaction pooler (:6543), so `prepare: false`
 * is mandatory. The client is created LAZILY — the connection string is only
 * required when the first query runs, never at module load. This matters
 * because `next build` loads route modules (to collect page data) without the
 * runtime env present; an eager client would throw during the build.
 *
 * Idle sockets to the pooler get reset by the network/pooler (read ECONNRESET),
 * and a silently dropped socket makes the next query hang until TCP gives up.
 * So the pool closes idle sockets itself (idle_timeout) before that happens,
 * recycles long-lived ones (max_lifetime), bounds connects (connect_timeout),
 * and reads go through `withDbRetry`, which fails fast and retries once on a
 * fresh pool after a connection-level error.
 */
type Db = ReturnType<typeof drizzle<typeof schema>>;
type Pg = ReturnType<typeof postgres>;

const POOL_OPTIONS = {
  prepare: false,
  max: 5,
  idle_timeout: 20, // seconds — close idle sockets before the network does
  max_lifetime: 60 * 30, // seconds
  connect_timeout: 10, // seconds
} as const;

/** Per-attempt budget in withDbRetry (covers connect + query). */
const ATTEMPT_TIMEOUT_MS = 8_000;

const globalForDb = globalThis as unknown as {
  __nitinPg?: Pg;
  __nitinDb?: Db;
};

function resolveDb(): Db {
  if (globalForDb.__nitinDb) return globalForDb.__nitinDb;

  const connectionString =
    process.env.POOL_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "Missing POOL_DATABASE_URL (or DATABASE_URL) — set it in your environment.",
    );
  }

  const client = globalForDb.__nitinPg ?? postgres(connectionString, POOL_OPTIONS);
  const instance = drizzle(client, { schema });

  // Cache in every environment: in dev it survives HMR reloads, and in
  // production it stops each `db.*` access from opening a fresh pool.
  globalForDb.__nitinPg = client;
  globalForDb.__nitinDb = instance;
  return instance;
}

/**
 * Lazy proxy: resolves the real Drizzle client on first property access, so
 * importing `db` never requires the connection string — only *using* it does.
 */
export const db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    const real = resolveDb();
    const value = Reflect.get(real as object, prop, receiver);
    return typeof value === "function" ? value.bind(real) : value;
  },
});

/** Error codes meaning "the connection is broken", not "the query is wrong". */
const CONNECTION_ERROR_CODES = new Set([
  "ECONNRESET",
  "EPIPE",
  "ETIMEDOUT",
  "ECONNREFUSED",
  "ENOTFOUND",
  "EAI_AGAIN",
  "CONNECTION_CLOSED",
  "CONNECTION_ENDED",
  "CONNECTION_DESTROYED",
  "CONNECT_TIMEOUT",
  "QUERY_ATTEMPT_TIMEOUT",
]);

/** Walks the cause chain — Drizzle wraps driver errors in DrizzleQueryError. */
export function isConnectionError(err: unknown): boolean {
  for (let e: unknown = err, depth = 0; e && depth < 5; depth++) {
    const code = (e as { code?: unknown }).code;
    if (typeof code === "string" && CONNECTION_ERROR_CODES.has(code)) return true;
    e = (e as { cause?: unknown }).cause;
  }
  return false;
}

/**
 * Drop the pool a failed attempt used so the retry gets fresh sockets. Only
 * the current pool is reset (concurrent failures on the same pool reset it
 * once); `end({ timeout: 0 })` destroys its sockets, which also frees any
 * query hung on a dead one.
 */
function resetPool(stale: Pg | undefined) {
  if (!stale || globalForDb.__nitinPg !== stale) return;
  globalForDb.__nitinPg = undefined;
  globalForDb.__nitinDb = undefined;
  stale.end({ timeout: 0 }).catch(() => {});
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      const err = new Error(`Database attempt exceeded ${ms}ms`) as Error & { code: string };
      err.code = "QUERY_ATTEMPT_TIMEOUT";
      reject(err);
    }, ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/**
 * Run a READ against the pool, failing fast instead of hanging and retrying
 * once on a fresh pool after a connection-level error. `run` must build its
 * query inside the callback so the retry re-issues it. Not for writes: a write
 * whose connection died may already have committed.
 */
export async function withDbRetry<T>(run: () => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    resolveDb();
    const pool = globalForDb.__nitinPg;
    try {
      return await withTimeout(run(), ATTEMPT_TIMEOUT_MS);
    } catch (err) {
      if (attempt >= 2 || !isConnectionError(err)) throw err;
      resetPool(pool);
    }
  }
}

export { schema };
