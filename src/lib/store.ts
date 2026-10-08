import { getDb } from "./db";

/** Info toko offline — diatur dari /admin/toko-offline. */
export type StoreInfo = {
  enabled: boolean;
  name: string;
  address: string;
  phone: string;
  hours: string;      // satu baris per hari/rentang
  mapsUrl: string;    // tautan Google Maps / share.google
  embedUrl: string;   // src iframe "Embed a map" (opsional)
  image: string;
  note: string;
};

export const STORE_DEFAULTS: StoreInfo = {
  enabled: true,
  name: "Delova Wardrobe Store",
  address: "",
  phone: "",
  hours: "",
  mapsUrl: "https://share.google/XC6bjRiwzxNr7TMkL",
  embedUrl: "",
  image: "",
  note: "Kunjungi toko offline kami untuk mencoba langsung koleksi kebaya, batik, dan hijab Delova.",
};

const KEY = "store";
const str = (v: unknown, max: number) => String(v ?? "").slice(0, max).trim();
const GOOGLE_HOST = /(^|\.)(google\.com|google\.co\.id|goo\.gl|share\.google|g\.page|maps\.app\.goo\.gl)$/;

function mapsUrl(v: unknown): string {
  try {
    const u = new URL(str(v, 400));
    return u.protocol === "https:" && GOOGLE_HOST.test(u.hostname) ? u.toString() : "";
  } catch { return ""; }
}
/** Terima src saja atau seluruh tag <iframe …>; hanya embed resmi Google Maps yang diizinkan. */
function embedUrl(v: unknown): string {
  const raw = str(v, 2000);
  const m = raw.match(/src=["']([^"']+)["']/);
  const s = (m ? m[1] : raw).replace(/&amp;/g, "&");
  return s.startsWith("https://www.google.com/maps/embed") ? s : "";
}

function normalize(s: Partial<Record<keyof StoreInfo, unknown>> | null): StoreInfo {
  const d = STORE_DEFAULTS;
  const x = s ?? {};
  const img = str(x.image, 600);
  return {
    enabled: x.enabled === undefined ? d.enabled : x.enabled === true,
    name: str(x.name, 80) || d.name,
    address: str(x.address, 300),
    phone: str(x.phone, 20).replace(/[^\d+ ]/g, ""),
    hours: str(x.hours, 400),
    mapsUrl: x.mapsUrl === undefined ? d.mapsUrl : mapsUrl(x.mapsUrl),
    embedUrl: embedUrl(x.embedUrl),
    image: img.startsWith("/") || img.startsWith("https://") ? img : "",
    note: x.note === undefined ? d.note : str(x.note, 240),
  };
}

export async function getStore(): Promise<StoreInfo> {
  try {
    const db = await getDb();
    const r = await db.execute({ sql: "SELECT value FROM settings WHERE key = ?", args: [KEY] });
    return normalize(r.rows.length ? JSON.parse(String(r.rows[0].value)) : null);
  } catch {
    return STORE_DEFAULTS;
  }
}

export async function saveStore(input: Partial<Record<keyof StoreInfo, unknown>>): Promise<StoreInfo> {
  const v = normalize(input);
  const db = await getDb();
  await db.execute({
    sql: "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    args: [KEY, JSON.stringify(v)],
  });
  return v;
}
