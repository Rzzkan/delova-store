import { getDb } from "./db";

/** ID pelacakan yang diatur dari /admin/pelacakan. Jika kosong, jatuh ke variabel env lama. */
export type TrackingSettings = { metaPixelId: string; tiktokPixelId: string; ga4Id: string; verifyDomain: string };

const KEY = "tracking";
const RE = {
  metaPixelId: /^\d{8,20}$/,                 // 15–16 digit angka
  tiktokPixelId: /^[A-Z0-9]{10,30}$/,        // mis. C1A2B3D4E5F6G7H8I9J0
  ga4Id: /^G-[A-Z0-9]{6,14}$/,               // G-XXXXXXXXXX
  verifyDomain: /^[A-Za-z0-9_-]{10,80}$/,    // kode verifikasi domain Meta
} as const;

export const empty = (): TrackingSettings => ({ metaPixelId: "", tiktokPixelId: "", ga4Id: "", verifyDomain: "" });

function clean(input: Partial<Record<keyof TrackingSettings, unknown>>): { value: TrackingSettings; errors: string[] } {
  const value = empty();
  const errors: string[] = [];
  const label = { metaPixelId: "Meta Pixel ID", tiktokPixelId: "TikTok Pixel ID", ga4Id: "Google Analytics Measurement ID", verifyDomain: "Kode verifikasi domain Meta" };
  for (const k of Object.keys(RE) as (keyof TrackingSettings)[]) {
    let v = String(input[k] ?? "").trim();
    if (k === "ga4Id" || k === "tiktokPixelId") v = v.toUpperCase();
    if (!v) continue;
    if (RE[k].test(v)) value[k] = v;
    else errors.push(`${label[k]} tidak valid`);
  }
  return { value, errors };
}

export async function getStoredTracking(): Promise<TrackingSettings> {
  try {
    const db = await getDb();
    const r = await db.execute({ sql: "SELECT value FROM settings WHERE key = ?", args: [KEY] });
    return r.rows.length ? clean(JSON.parse(String(r.rows[0].value))).value : empty();
  } catch {
    return empty();
  }
}

/** Nilai efektif: pengaturan admin diutamakan, env sebagai cadangan. */
export async function getTracking(): Promise<TrackingSettings> {
  const s = await getStoredTracking();
  const env = clean({
    metaPixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID,
    tiktokPixelId: process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID,
    ga4Id: process.env.NEXT_PUBLIC_GA4_ID,
  }).value;
  return {
    metaPixelId: s.metaPixelId || env.metaPixelId,
    tiktokPixelId: s.tiktokPixelId || env.tiktokPixelId,
    ga4Id: s.ga4Id || env.ga4Id,
    verifyDomain: s.verifyDomain,
  };
}

export async function saveTracking(input: Partial<Record<keyof TrackingSettings, unknown>>) {
  const { value, errors } = clean(input);
  if (errors.length) return { ok: false as const, errors };
  const db = await getDb();
  await db.execute({
    sql: "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    args: [KEY, JSON.stringify(value)],
  });
  return { ok: true as const, value };
}
