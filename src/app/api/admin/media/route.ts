import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { isAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";

const MAX = 1_500_000; // 1,5 MB — browser sudah mengecilkan gambar sebelum unggah
const TYPES = new Set(["image/webp", "image/jpeg", "image/png"]);

function sniff(b: Uint8Array): string | null {
  if (b[0] === 0xff && b[1] === 0xd8) return "image/jpeg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45) return "image/webp";
  return null;
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const f = (await req.formData().catch(() => null))?.get("file");
  if (!(f instanceof File)) return NextResponse.json({ error: "File tidak ada" }, { status: 400 });
  if (f.size > MAX) return NextResponse.json({ error: "Gambar terlalu besar (maks 1,5 MB)" }, { status: 413 });
  const bytes = new Uint8Array(await f.arrayBuffer());
  const mime = sniff(bytes); // cek isi file, bukan hanya ekstensi
  if (!mime || !TYPES.has(mime)) return NextResponse.json({ error: "Format harus JPG, PNG, atau WebP" }, { status: 415 });
  const id = randomUUID();
  const db = await getDb();
  await db.execute({ sql: "INSERT INTO media (id, mime, data, size, created_at) VALUES (?,?,?,?,?)", args: [id, mime, bytes, bytes.length, Math.floor(Date.now() / 1000)] });
  return NextResponse.json({ url: `/api/media/${id}` });
}
