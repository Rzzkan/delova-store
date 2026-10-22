import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { CATEGORIES } from "@/lib/categories";

/** Kurasi admin: sembunyikan, tandai unggulan, atau paksa kategori. Tidak ditimpa saat sinkron Shopee. */
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => null);
  // Diskon massal: { ids: [...], discount_pct: 20 | null }
  if (Array.isArray(b?.ids)) {
    const pct = b.discount_pct == null || b.discount_pct === "" ? null : Number(b.discount_pct);
    if (pct !== null && (!Number.isInteger(pct) || pct < 0 || pct > 90)) return NextResponse.json({ error: "diskon 0–90%" }, { status: 400 });
    const ids = (b.ids as unknown[]).map(String).slice(0, 5000);
    if (!ids.length) return NextResponse.json({ ok: true, n: 0 });
    const db = await getDb();
    await db.execute({ sql: `UPDATE products SET discount_pct = ? WHERE id IN (${ids.map(() => "?").join(",")})`, args: [pct || null, ...ids] });
    return NextResponse.json({ ok: true, n: ids.length });
  }
  if (!b?.id) return NextResponse.json({ error: "id wajib" }, { status: 400 });
  const sets: string[] = [];
  const args: (string | number | null)[] = [];
  if (typeof b.hidden === "boolean") { sets.push("hidden = ?"); args.push(b.hidden ? 1 : 0); }
  if (typeof b.featured === "boolean") { sets.push("featured = ?"); args.push(b.featured ? 1 : 0); }
  if ("discount_pct" in b) {
    const pct = b.discount_pct == null || b.discount_pct === "" ? null : Number(b.discount_pct);
    if (pct !== null && (!Number.isInteger(pct) || pct < 0 || pct > 90)) return NextResponse.json({ error: "diskon 0–90%" }, { status: 400 });
    sets.push("discount_pct = ?"); args.push(pct || null);
  }
  if ("category_override" in b) {
    const c = b.category_override;
    if (c !== null && c !== "" && !CATEGORIES.some((x) => x.slug === c) && c !== "lainnya") return NextResponse.json({ error: "kategori tidak valid" }, { status: 400 });
    sets.push("category_override = ?"); args.push(c || null);
  }
  if (!sets.length) return NextResponse.json({ error: "tidak ada perubahan" }, { status: 400 });
  const db = await getDb();
  await db.execute({ sql: `UPDATE products SET ${sets.join(", ")} WHERE id = ?`, args: [...args, String(b.id)] });
  return NextResponse.json({ ok: true });
}
