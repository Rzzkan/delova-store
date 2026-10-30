import { TOOLS, type ToolDef } from "./tools";

/** MCP (Model Context Protocol) lewat HTTP: JSON-RPC 2.0 tanpa sesi. Cukup untuk Claude (claude.ai & Claude Code). */
const SUPPORTED = ["2025-06-18", "2025-03-26", "2024-11-05"];

const INSTRUCTIONS = `Server ini mengelola konten situs Delova Store (delova.id).
- Artikel blog & panduan: blog_* — isi ditulis dalam Markdown (gunakan ## dan ### untuk judul; jangan # ). Artikel baru dibuat sebagai DRAFT; terbitkan hanya bila diminta (status "published").
- Halaman koleksi (URL /koleksi/<slug>): koleksi_*.
- Teks beranda, bar pengumuman, strip keunggulan, link Shopee, info toko offline: web_content_get / web_content_update.
- Sebelum mengubah konten yang sudah ada, baca dulu dengan *_get. Setiap perubahan mengembalikan nilai sebelumnya agar bisa dikembalikan.
- Produk, harga, dan stok tidak dikelola di sini (itu berasal dari Shopee).`;

type Req = { jsonrpc?: string; id?: string | number | null; method?: string; params?: Record<string, unknown> };
type Res = { jsonrpc: "2.0"; id: string | number | null; result?: unknown; error?: { code: number; message: string } };

const err = (id: Req["id"], code: number, message: string): Res => ({ jsonrpc: "2.0", id: id ?? null, error: { code, message } });
const ok = (id: Req["id"], result: unknown): Res => ({ jsonrpc: "2.0", id: id ?? null, result });

async function callTool(t: ToolDef, args: Record<string, unknown>) {
  const started = Date.now();
  try {
    const out = await t.handler(args ?? {});
    console.log(`[mcp] ${t.name} ok ${Date.now() - started}ms`);
    return { content: [{ type: "text", text: typeof out === "string" ? out : JSON.stringify(out, null, 2) }] };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[mcp] ${t.name} gagal: ${msg}`);
    return { isError: true, content: [{ type: "text", text: `Gagal: ${msg}` }] };
  }
}

/** Mengembalikan null untuk notifikasi (tidak perlu balasan). */
export async function handleRpc(req: Req): Promise<Res | null> {
  const { id, method, params } = req;
  if (!method) return err(id, -32600, "Permintaan tidak valid");
  if (id === undefined) return null; // notifikasi, mis. notifications/initialized
  switch (method) {
    case "initialize": {
      const want = String((params as { protocolVersion?: string } | undefined)?.protocolVersion ?? "");
      return ok(id, {
        protocolVersion: SUPPORTED.includes(want) ? want : SUPPORTED[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "delova-store", version: "1.0.0" },
        instructions: INSTRUCTIONS,
      });
    }
    case "ping":
      return ok(id, {});
    case "tools/list":
      return ok(id, { tools: TOOLS.map(({ name, description, inputSchema, annotations }) => ({ name, description, inputSchema, annotations })) });
    case "tools/call": {
      const name = String((params as { name?: string } | undefined)?.name ?? "");
      const t = TOOLS.find((x) => x.name === name);
      if (!t) return err(id, -32602, `Tool tidak dikenal: ${name}`);
      return ok(id, await callTool(t, ((params as { arguments?: Record<string, unknown> }).arguments ?? {})));
    }
    default:
      return err(id, -32601, `Metode tidak dikenal: ${method}`);
  }
}
