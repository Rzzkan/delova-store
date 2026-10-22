import { appUrl } from "@/lib/origin";
import { NextResponse } from "next/server";
import { checkPassword, sessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  const f = await req.formData();
  if (!checkPassword(String(f.get("password") ?? ""))) return NextResponse.redirect(appUrl("/admin/login?err=1", req), 303);
  const res = NextResponse.redirect(appUrl("/admin", req), 303);
  res.cookies.set(sessionCookie());
  return res;
}
