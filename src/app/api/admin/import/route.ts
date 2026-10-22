import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/auth";
import { applyPlan, buildPlan, summarize } from "@/lib/import";

export const maxDuration = 120;

/** mode=preview → ringkasan tanpa menyimpan; mode=apply → simpan. File dikirim ulang pada tiap mode (tanpa state di server). */
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const f = await req.formData();
    const mode = String(f.get("mode") ?? "preview");
    const removeMissing = f.get("removeMissing") === "1";
    const uploads = f.getAll("files").filter((x): x is File => x instanceof File);
    if (!uploads.length) return NextResponse.json({ error: "Pilih file .xlsx dulu" }, { status: 400 });
    if (uploads.length > 3) return NextResponse.json({ error: "Maksimal 3 file (Dasar, Penjualan, Media)" }, { status: 400 });
    const files = [];
    for (const u of uploads) {
      if (!u.name.toLowerCase().endsWith(".xlsx")) return NextResponse.json({ error: `${u.name}: harus berformat .xlsx` }, { status: 400 });
      if (u.size > 15_000_000) return NextResponse.json({ error: `${u.name}: terlalu besar (maks 15 MB)` }, { status: 400 });
      files.push({ name: u.name, data: new Uint8Array(await u.arrayBuffer()) });
    }
    const plan = buildPlan(files);
    if (mode === "apply") {
      const r = await applyPlan(plan, { brand: String(f.get("brand") ?? ""), shopName: String(f.get("shopName") ?? ""), removeMissing });
      revalidatePath("/", "layout");
      return NextResponse.json({ ok: true, ...r });
    }
    return NextResponse.json({ ok: true, summary: await summarize(plan, { removeMissing }) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Gagal memproses file" }, { status: 400 });
  }
}
