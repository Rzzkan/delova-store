import { getDb } from "./db";

/** Pengaturan favicon & robots.txt — diatur dari /admin/seo. */
export type SeoSettings = {
  favicon: string;                         // URL gambar (kosong = ikon bawaan)
  robotsMode: "auto" | "custom" | "block"; // auto = aturan bawaan + tambahan; custom = tulis sendiri; block = tutup total
  extraDisallow: string;                   // satu path per baris, mis. /produk?urut=
  blockAi: boolean;                        // tolak bot pelatih AI (GPTBot, CCBot, dll.)
  custom: string;                          // isi robots.txt penuh bila mode custom
};

export const SEO_DEFAULTS: SeoSettings = { favicon: "", robotsMode: "auto", extraDisallow: "", blockAi: false, custom: "" };
export const BASE_DISALLOW = ["/admin", "/api", "/keranjang", "/checkout", "/pesanan"];
export const AI_BOTS = ["GPTBot", "ChatGPT-User", "OAI-SearchBot", "CCBot", "Google-Extended", "anthropic-ai", "ClaudeBot", "PerplexityBot", "Bytespider"];

const KEY = "seo";
const str = (v: unknown, max: number) => String(v ?? "").slice(0, max).trim();

function paths(v: unknown): string {
  return str(v, 3000).split(/\r?\n/).map((l) => l.trim()).filter((l) => l.startsWith("/") && !/\s/.test(l) && l.length <= 120).slice(0, 50).join("\n");
}

function normalize(s: Partial<Record<keyof SeoSettings, unknown>> | null): SeoSettings {
  const x = s ?? {};
  const fav = str(x.favicon, 600);
  const mode = x.robotsMode === "custom" || x.robotsMode === "block" ? x.robotsMode : "auto";
  return {
    favicon: fav.startsWith("/api/media/") || fav.startsWith("https://") ? fav : "",
    robotsMode: mode,
    extraDisallow: paths(x.extraDisallow),
    blockAi: x.blockAi === true,
    // buang karakter kontrol, tetapi pertahankan baris baru
    custom: String(x.custom ?? "").replace(/[^\S\n]+$/gm, "").replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "").slice(0, 5000).trim(),
  };
}

export async function getSeoSettings(): Promise<SeoSettings> {
  try {
    const db = await getDb();
    const r = await db.execute({ sql: "SELECT value FROM settings WHERE key = ?", args: [KEY] });
    return normalize(r.rows.length ? JSON.parse(String(r.rows[0].value)) : null);
  } catch { return SEO_DEFAULTS; }
}

export async function saveSeoSettings(input: Partial<Record<keyof SeoSettings, unknown>>): Promise<SeoSettings> {
  const v = normalize(input);
  const db = await getDb();
  await db.execute({ sql: "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", args: [KEY, JSON.stringify(v)] });
  return v;
}

export function buildRobots(s: SeoSettings, site: string): string {
  const sitemap = `Sitemap: ${site}/sitemap.xml`;
  if (s.robotsMode === "block") return `User-agent: *\nDisallow: /\n`;
  if (s.robotsMode === "custom" && s.custom) return /^sitemap:/im.test(s.custom) ? `${s.custom}\n` : `${s.custom}\n\n${sitemap}\n`;
  const lines = ["User-agent: *", "Allow: /", "Allow: /api/media/", ...[...BASE_DISALLOW, ...s.extraDisallow.split("\n").filter(Boolean)].map((p) => `Disallow: ${p}`)];
  if (s.blockAi) for (const b of AI_BOTS) lines.push("", `User-agent: ${b}`, "Disallow: /");
  lines.push("", sitemap);
  return lines.join("\n") + "\n";
}
