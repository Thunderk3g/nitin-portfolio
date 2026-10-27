import "server-only";
import fs from "node:fs";
import path from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;
type Pg = ReturnType<typeof postgres>;

const POOL_OPTIONS = {
  prepare: false,
  max: 5,
  idle_timeout: 20,
  max_lifetime: 60 * 30,
  connect_timeout: 1,
} as const;

/** Per-attempt budget in withDbRetry (covers connect + query). */
const ATTEMPT_TIMEOUT_MS = 1_200;
/** Circuit breaker cooldown when TCP port 6543 is blocked/unreachable. */
const TCP_CIRCUIT_COOLDOWN_MS = 15 * 60 * 1_000;
const CIRCUIT_FILE = path.join(process.cwd(), ".next", "cache", "tcp-circuit.json");

const globalForDb = globalThis as unknown as {
  __nitinPg?: Pg;
  __nitinDb?: Db;
  __nitinTcpBlockedUntil?: number;
};

export function isTcpCircuitOpen(): boolean {
  const now = Date.now();
  if ((globalForDb.__nitinTcpBlockedUntil ?? 0) > now) return true;
  try {
    if (fs.existsSync(CIRCUIT_FILE)) {
      const data = JSON.parse(fs.readFileSync(CIRCUIT_FILE, "utf8")) as { blockedUntil?: number };
      if ((data.blockedUntil ?? 0) > now) {
        globalForDb.__nitinTcpBlockedUntil = data.blockedUntil;
        return true;
      }
    }
  } catch {
    // Ignore file read error
  }
  return false;
}

export function tripTcpCircuit(): void {
  const blockedUntil = Date.now() + TCP_CIRCUIT_COOLDOWN_MS;
  globalForDb.__nitinTcpBlockedUntil = blockedUntil;
  try {
    fs.mkdirSync(path.dirname(CIRCUIT_FILE), { recursive: true });
    fs.writeFileSync(CIRCUIT_FILE, JSON.stringify({ blockedUntil }), "utf8");
  } catch {
    // Ignore read-only filesystem on serverless
  }
}

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

  globalForDb.__nitinPg = client;
  globalForDb.__nitinDb = instance;
  return instance;
}

export const db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    const real = resolveDb();
    const value = Reflect.get(real as object, prop, receiver);
    return typeof value === "function" ? value.bind(real) : value;
  },
});

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

export function isConnectionError(err: unknown): boolean {
  for (let e: unknown = err, depth = 0; e && depth < 5; depth++) {
    const code = (e as { code?: unknown }).code;
    if (typeof code === "string" && CONNECTION_ERROR_CODES.has(code)) return true;
    e = (e as { cause?: unknown }).cause;
  }
  return false;
}

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

export async function withDbRetry<T>(run: () => Promise<T>): Promise<T> {
  if (isTcpCircuitOpen()) {
    const err = new Error("TCP database port circuit open (using HTTPS fallback)") as Error & {
      code: string;
    };
    err.code = "QUERY_ATTEMPT_TIMEOUT";
    throw err;
  }

  resolveDb();
  const pool = globalForDb.__nitinPg;
  try {
    return await withTimeout(run(), ATTEMPT_TIMEOUT_MS);
  } catch (err) {
    if (isConnectionError(err)) {
      tripTcpCircuit();
      resetPool(pool);
    }
    throw err;
  }
}

export { schema };
