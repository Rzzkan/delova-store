import { NextResponse } from "next/server";
import { checkPassword, sessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  const f = await req.formData();
  if (!checkPassword(String(f.get("password") ?? ""))) return NextResponse.redirect(new URL("/admin/login?err=1", req.url), 303);
  const res = NextResponse.redirect(new URL("/admin", req.url), 303);
  res.cookies.set(sessionCookie());
  return res;
}
