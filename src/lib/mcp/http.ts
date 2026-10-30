import crypto from "node:crypto";
import { handleRpc } from "./rpc";

const MIN_LEN = 24;
const fails = new Map<string, { n: number; t: number }>();

function tokenOk(given: string): boolean {
  const want = process.env.MCP_TOKEN ?? "";
  if (want.length < MIN_LEN || !given) return false;
  const h = (s: string) => crypto.createHash("sha256").update(s).digest();
  return crypto.timingSafeEqual(h(given), h(want));
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

/** Dipakai route /api/mcp (header Bearer) dan /api/mcp/<token> (token di URL, untuk konektor claude.ai tanpa OAuth). */
export async function mcpPost(req: Request, urlToken?: string): Promise<Response> {
  if ((process.env.MCP_TOKEN ?? "").length < MIN_LEN) return json({ error: "MCP belum aktif: isi MCP_TOKEN (min. 24 karakter) di server" }, 503);
  const ip = (req.headers.get("x-forwarded-for") ?? "?").split(",")[0].trim();
  const f = fails.get(ip);
  if (f && Date.now() - f.t < 10 * 60_000 && f.n >= 20) return json({ error: "Terlalu banyak percobaan" }, 429);
  const bearer = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!tokenOk(urlToken ?? bearer)) {
    fails.set(ip, { n: (f && Date.now() - f.t < 10 * 60_000 ? f.n : 0) + 1, t: Date.now() });
    return json({ error: "Tidak diizinkan" }, 401);
  }
  fails.delete(ip);
  let body: unknown;
  try { body = await req.json(); } catch { return json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "JSON tidak valid" } }, 400); }
  if (Array.isArray(body)) {
    const out = (await Promise.all(body.map((b) => handleRpc(b)))).filter(Boolean);
    return out.length ? json(out) : new Response(null, { status: 202 });
  }
  const res = await handleRpc(body as never);
  return res ? json(res) : new Response(null, { status: 202 });
}

export const mcpNotAllowed = () => new Response(JSON.stringify({ error: "Gunakan POST" }), { status: 405, headers: { allow: "POST", "content-type": "application/json" } });
