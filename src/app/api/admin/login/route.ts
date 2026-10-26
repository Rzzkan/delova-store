import { appUrl } from "@/lib/origin";
import { NextResponse } from "next/server";
import { checkPassword, sessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  const f = await req.formData();
  const raw = String(f.get("next") ?? "");
  // hanya izinkan tujuan di dalam situs sendiri: /admin… atau /cms…
  const next = /^\/(admin|cms)(\/[\w\-./]*)?$/.test(raw) ? raw : "/admin";
  if (!checkPassword(String(f.get("password") ?? ""))) return NextResponse.redirect(appUrl(`/admin/login?err=1${next !== "/admin" ? `&next=${encodeURIComponent(next)}` : ""}`, req), 303);
  const res = NextResponse.redirect(appUrl(next, req), 303);
  res.cookies.set(sessionCookie());
  return res;
}
