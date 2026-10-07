import { getDb } from "@/lib/db";

/** Menyajikan gambar yang diunggah admin (disimpan di database). Immutable: ID acak, tak pernah berubah isinya. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return new Response("Not found", { status: 404 });
  const db = await getDb();
  const r = await db.execute({ sql: "SELECT mime, data FROM media WHERE id = ?", args: [id] });
  if (!r.rows.length) return new Response("Not found", { status: 404 });
  const data = r.rows[0].data as ArrayBuffer;
  return new Response(data, {
    headers: { "Content-Type": String(r.rows[0].mime), "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" },
  });
}
