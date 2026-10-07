import { createClient, type Client } from "@libsql/client";
import { mkdirSync } from "node:fs";
import { SCHEMA } from "./schema";
import { isMock } from "./shopee/config";
import { seedMock } from "./seed";

function resolveUrl(): string {
  if (process.env.TURSO_DATABASE_URL) return process.env.TURSO_DATABASE_URL;
  // Vercel: filesystem read-only kecuali /tmp (data demo, tidak permanen)
  if (process.env.VERCEL) return "file:/tmp/delova.db";
  mkdirSync("data", { recursive: true });
  return "file:data/delova.db";
}

const g = globalThis as unknown as { __delovaDb?: Promise<Client> };

async function init(): Promise<Client> {
  const c = createClient({ url: resolveUrl(), authToken: process.env.TURSO_AUTH_TOKEN });
  await c.executeMultiple(SCHEMA);
  if (isMock()) {
    const r = await c.execute("SELECT COUNT(*) AS n FROM products");
    if (Number(r.rows[0].n) === 0) await seedMock(c);
  }
  return c;
}

export function getDb(): Promise<Client> {
  if (!g.__delovaDb) {
    g.__delovaDb = init().catch((e) => {
      g.__delovaDb = undefined;
      throw e;
    });
  }
  return g.__delovaDb;
}
