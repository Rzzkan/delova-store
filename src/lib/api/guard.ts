import crypto from "node:crypto";

/**
 * Pengaman API publik v1 (read-only, server-to-server).
 * - Kunci API di env API_KEYS: "nama=kunci,nama2=kunci2" (kunci min. 32 karakter). Satu kunci per pemakai → bisa dicabut sendiri-sendiri.
 * - Dikirim lewat header "Authorization: Bearer <kunci>" atau "X-API-Key". Kunci di query string DITOLAK (bocor di log).
 * - Perbandingan constant-time (hash sha256), rate limit per kunci, penguncian IP setelah gagal berulang.
 * - Hanya GET/HEAD. Tidak ada header CORS (bukan untuk dipanggil dari browser).
 */
const MIN_KEY = 32;
const WINDOW = 60_000;
const LIMIT = Math.max(10, Number(process.env.API_RATE_LIMIT) || 60); // permintaan / menit / kunci
const MAX_FAILS = 10; // gagal per IP per 10 menit
const LOCK_MS = 10 * 60_000;

type Key = { name: string; hash: Buffer };
const sha = (s: string) => crypto.createHash("sha256").update(s).digest();

let cache: { raw: string; keys: Key[] } | null = null;
function keys(): Key[] {
  const raw = process.env.API_KEYS ?? "";
  if (cache?.raw === raw) return cache.keys;
  const list: Key[] = [];
  for (const part of raw.split(",")) {
    const i = part.indexOf("=");
    if (i < 1) continue;
    const name = part.slice(0, i).trim().replace(/[^\w.-]/g, "").slice(0, 40);
    const key = part.slice(i + 1).trim();
    if (name && key.length >= MIN_KEY) list.push({ name, hash: sha(key) });
  }
  cache = { raw, keys: list };
  return list;
}

const hits = new Map<string, number[]>();
const fails = new Map<string, { n: number; t: number }>();

export type Ctx = { req: Request; url: URL; client: string; rid: string };
export type Handler = (c: Ctx) => Promise<unknown>;
export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}

function respond(status: number, body: unknown, rid: string, extra: Record<string, string> = {}, head = false) {
  return new Response(head ? null : JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
      "x-request-id": rid,
      "referrer-policy": "no-referrer",
      ...extra,
    },
  });
}

export async function guarded(req: Request, handler: Handler): Promise<Response> {
  const rid = crypto.randomUUID();
  const url = new URL(req.url);
  const head = req.method === "HEAD";
  const err = (e: ApiError, extra?: Record<string, string>) => respond(e.status, { error: { code: e.code, message: e.message, request_id: rid } }, rid, extra, head);
  if (req.method !== "GET" && !head) return err(new ApiError(405, "method_not_allowed", "API ini read-only: gunakan GET."), { allow: "GET, HEAD" });

  const all = keys();
  if (!all.length) return err(new ApiError(503, "api_disabled", "API belum diaktifkan: isi API_KEYS di server."));

  const ip = (req.headers.get("x-forwarded-for") ?? "?").split(",")[0].trim();
  const f = fails.get(ip);
  if (f && Date.now() - f.t < LOCK_MS && f.n >= MAX_FAILS) return err(new ApiError(429, "locked", "Terlalu banyak percobaan gagal. Coba lagi nanti."), { "retry-after": String(Math.ceil((LOCK_MS - (Date.now() - f.t)) / 1000)) });

  if (url.searchParams.has("api_key") || url.searchParams.has("key")) return err(new ApiError(400, "key_in_query", "Jangan kirim kunci lewat query string; pakai header Authorization atau X-API-Key."));
  const given = (req.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1] ?? req.headers.get("x-api-key") ?? "").trim();
  const h = given ? sha(given) : null;
  // loop semua kunci tanpa break → waktu tetap
  let who: string | null = null;
  for (const k of all) if (h && crypto.timingSafeEqual(h, k.hash)) who = k.name;
  if (!who) {
    fails.set(ip, { n: (f && Date.now() - f.t < LOCK_MS ? f.n : 0) + 1, t: Date.now() });
    return err(new ApiError(401, "unauthorized", "Kunci API tidak ada atau salah."), { "www-authenticate": 'Bearer realm="delova-api"' });
  }
  fails.delete(ip);

  const now = Date.now();
  const arr = (hits.get(who) ?? []).filter((t) => now - t < WINDOW);
  const reset = Math.ceil(((arr[0] ?? now) + WINDOW) / 1000);
  const rl = (left: number) => ({ "x-ratelimit-limit": String(LIMIT), "x-ratelimit-remaining": String(Math.max(0, left)), "x-ratelimit-reset": String(reset) });
  if (arr.length >= LIMIT) {
    hits.set(who, arr);
    return err(new ApiError(429, "rate_limited", `Batas ${LIMIT} permintaan/menit terlampaui.`), { ...rl(0), "retry-after": String(Math.max(1, reset - Math.floor(now / 1000))) });
  }
  arr.push(now);
  hits.set(who, arr);
  if (hits.size > 500) for (const [k, v] of hits) if (!v.some((t) => now - t < WINDOW)) hits.delete(k);

  try {
    const data = await handler({ req, url, client: who, rid });
    console.log(`[api] ${who} ${req.method} ${url.pathname} 200`);
    return respond(200, data, rid, rl(LIMIT - arr.length), head);
  } catch (e) {
    if (e instanceof ApiError) return err(e, rl(LIMIT - arr.length));
    console.error("[api] error", rid, e);
    return err(new ApiError(500, "internal_error", "Terjadi kesalahan di server."), rl(LIMIT - arr.length));
  }
}

export const isoSec = (s: number | null | undefined) => (s ? new Date(s * 1000).toISOString() : null);
