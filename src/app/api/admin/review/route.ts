import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { isAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { maskBuyer } from "@/lib/reviews";

const s = (v: unknown, n: number) => String(v ?? "").trim().slice(0, n);

/** op: "update" (featured/hidden) | "create" (ulasan manual) | "delete" (hanya ulasan manual). */
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => null);
  const db = await getDb();
  if (b?.op === "update" && b.id) {
    const sets: string[] = [];
    const args: (string | number)[] = [];
    if (typeof b.featured === "boolean") { sets.push("featured = ?"); args.push(b.featured ? 1 : 0); }
    if (typeof b.hidden === "boolean") { sets.push("hidden = ?"); args.push(b.hidden ? 1 : 0); }
    if (!sets.length) return NextResponse.json({ error: "tidak ada perubahan" }, { status: 400 });
    await db.execute({ sql: `UPDATE reviews SET ${sets.join(", ")} WHERE id = ?`, args: [...args, String(b.id)] });
    return NextResponse.json({ ok: true });
  }
  if (b?.op === "delete" && b.id) {
    await db.execute({ sql: "DELETE FROM reviews WHERE id = ? AND source = 'manual'", args: [String(b.id)] });
    return NextResponse.json({ ok: true });
  }
  if (b?.op === "create") {
    const comment = s(b.comment, 1200);
    const rating = Math.round(Number(b.rating));
    if (comment.length < 10 || !(rating >= 1 && rating <= 5)) return NextResponse.json({ error: "Isi komentar (min 10 huruf) dan bintang 1–5" }, { status: 400 });
    const image = s(b.image, 600);
    const imgs = image.startsWith("/") || image.startsWith("https://") ? [image] : [];
    await db.execute({
      sql: "INSERT INTO reviews (id, product_id, buyer, rating, comment, images, reply, created_at, featured, source, synced_at) VALUES (?,?,?,?,?,?,?,?,1,'manual',?)",
      args: [`manual-${randomUUID()}`, s(b.productId, 60) || null, maskBuyer(s(b.buyer, 60) || "pembeli"), rating, comment, JSON.stringify(imgs), s(b.reply, 600) || null, Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000)],
    });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "op tidak dikenal" }, { status: 400 });
}
