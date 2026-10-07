import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { isBrand } from "@/lib/brands";

/** Atur brand tiap toko Shopee (jika tebakan otomatis dari nama toko keliru). */
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => null);
  if (!b || !Number(b.shopId) || !isBrand(b.brand)) return NextResponse.json({ error: "data tidak valid" }, { status: 400 });
  const db = await getDb();
  await db.execute({ sql: "UPDATE shops SET brand = ? WHERE shop_id = ?", args: [b.brand, Number(b.shopId)] });
  return NextResponse.json({ ok: true });
}
