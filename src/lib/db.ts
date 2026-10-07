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
  // Migrasi untuk database lama: kolom token pada leads
  try { await c.execute("ALTER TABLE leads ADD COLUMN token TEXT"); } catch { /* sudah ada */ }
  try { await c.execute("ALTER TABLE shops ADD COLUMN brand TEXT NOT NULL DEFAULT 'wardrobe'"); } catch { /* sudah ada */ }
  await c.execute("UPDATE shops SET brand='kids' WHERE brand='wardrobe' AND (lower(name) LIKE '%kids%' OR lower(slug) LIKE '%kids%')");
  await c.execute("UPDATE shops SET brand='scarf' WHERE brand='wardrobe' AND (lower(name) LIKE '%scarf%' OR lower(slug) LIKE '%scarf%')");
  await c.execute("UPDATE shops SET brand='daily' WHERE brand='wardrobe' AND (lower(name) LIKE '%daily%' OR lower(slug) LIKE '%daily%')");
  await c.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_token ON leads(token)");
  if (isMock()) {
    const r = await c.execute("SELECT COUNT(*) AS n FROM products");
    const daily = await c.execute("SELECT COUNT(*) AS n FROM shops WHERE brand = 'daily'");
    // seed ulang aman (INSERT OR IGNORE): melengkapi data contoh bila ada brand baru
    if (Number(r.rows[0].n) === 0 || Number(daily.rows[0].n) === 0) await seedMock(c);
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
