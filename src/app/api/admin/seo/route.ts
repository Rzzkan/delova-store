import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/auth";
import { saveSeoSettings } from "@/lib/seo-settings";

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  const saved = await saveSeoSettings(body);
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true, settings: saved });
}
