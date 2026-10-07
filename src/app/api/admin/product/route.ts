import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { CATEGORIES } from "@/lib/categories";

/** Kurasi admin: sembunyikan, tandai unggulan, atau paksa kategori. Tidak ditimpa saat sinkron Shopee. */
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => null);
  if (!b?.id) return NextResponse.json({ error: "id wajib" }, { status: 400 });
  const sets: string[] = [];
  const args: (string | number | null)[] = [];
  if (typeof b.hidden === "boolean") { sets.push("hidden = ?"); args.push(b.hidden ? 1 : 0); }
  if (typeof b.featured === "boolean") { sets.push("featured = ?"); args.push(b.featured ? 1 : 0); }
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
