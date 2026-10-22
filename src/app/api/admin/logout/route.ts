import { appUrl } from "@/lib/origin";
import { NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/auth";

export async function POST(req: Request) {
  const res = NextResponse.redirect(appUrl("/admin/login", req), 303);
  res.cookies.delete(COOKIE_NAME);
  return res;
}
