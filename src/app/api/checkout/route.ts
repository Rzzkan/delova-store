import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getProductsByIds, getVariantsByIds } from "@/lib/products";
import { orderMessage, waLink, waNumber, type OrderLine } from "@/lib/whatsapp";

type In = { productId: string; variantId?: string; qty: number };
const str = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);

/** Harga & stok dihitung ulang di server — data keranjang dari browser tidak dipercaya. */
export async function POST(req: Request) {
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 400 }); }

  const name = str(b.name, 80), phone = str(b.phone, 20), address = str(b.address, 400), note = str(b.note, 200);
  if (name.length < 2 || !/^[0-9+ ]{9,16}$/.test(phone) || address.length < 10) return NextResponse.json({ error: "Lengkapi nama, nomor WhatsApp, dan alamat" }, { status: 400 });
  if (!waNumber()) return NextResponse.json({ error: "Nomor WhatsApp toko belum diatur (NEXT_PUBLIC_WA_NUMBER)" }, { status: 500 });

  const raw = Array.isArray(b.items) ? (b.items as In[]).slice(0, 50) : [];
  if (!raw.length) return NextResponse.json({ error: "Keranjang kosong" }, { status: 400 });

  const products = new Map((await getProductsByIds([...new Set(raw.map((i) => String(i.productId)))])).map((p) => [p.id, p]));
  const variants = new Map((await getVariantsByIds(raw.filter((i) => i.variantId).map((i) => String(i.variantId)))).map((v) => [v.id, v]));

  const lines: OrderLine[] = [];
  let total = 0;
  for (const i of raw) {
    const p = products.get(String(i.productId));
    const v = i.variantId ? variants.get(String(i.variantId)) : undefined;
    const qty = Math.max(1, Math.min(Number(i.qty) || 1, 99));
    if (!p || (i.variantId && (!v || v.productId !== p.id))) return NextResponse.json({ error: "Ada produk yang sudah tidak tersedia, mohon perbarui keranjang" }, { status: 409 });
    const stock = v ? v.stock : p.stock;
    if (stock < qty) return NextResponse.json({ error: `Stok "${p.name}${v ? ` (${v.name})` : ""}" tidak cukup (sisa ${stock})` }, { status: 409 });
    const price = v ? v.price : p.price;
    lines.push({ name: p.name, variant: v?.name, qty, price });
    total += price * qty;
  }

  const db = await getDb();
  await db.execute({
    sql: "INSERT INTO leads (created_at, name, phone, address, note, items, total) VALUES (?,?,?,?,?,?,?)",
    args: [Math.floor(Date.now() / 1000), name, phone, address, note, JSON.stringify(lines), total],
  });
  return NextResponse.json({ ok: true, total, waUrl: waLink(orderMessage({ name, phone, address, note }, lines, total)) });
}
