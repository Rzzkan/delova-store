import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { isBrand, BRANDS } from "@/lib/brands";

/** Atur brand tiap toko Shopee (jika tebakan otomatis dari nama toko keliru). */
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => null);
  if (!b || !Number(b.shopId) || !isBrand(b.brand)) return NextResponse.json({ error: "data tidak valid" }, { status: 400 });
  const db = await getDb();
  const id = Number(b.shopId);
  const cur = await db.execute({ sql: "SELECT name FROM shops WHERE shop_id = ?", args: [id] });
  if (!cur.rows.length) return NextResponse.json({ error: "toko tidak ditemukan" }, { status: 404 });
  // Nama toko ikut brand agar tidak ada dua toko bernama sama (mis. dua "Delova Scarf").
  const nm = BRANDS[b.brand as keyof typeof BRANDS].name;
  const dup = await db.execute({ sql: "SELECT 1 FROM shops WHERE name = ? AND shop_id <> ? LIMIT 1", args: [nm, id] });
  if (dup.rows.length) await db.execute({ sql: "UPDATE shops SET brand = ? WHERE shop_id = ?", args: [b.brand, id] });
  else await db.execute({ sql: "UPDATE shops SET brand = ?, name = ?, slug = ? WHERE shop_id = ?", args: [b.brand, nm, nm.toLowerCase().replace(/\s+/g, ""), id] });
  return NextResponse.json({ ok: true });
}
