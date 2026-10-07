import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { isMock } from "@/lib/shopee/config";
import { buildAuthUrl } from "@/lib/shopee/client";

/** Admin klik "Hubungkan toko Shopee" → diarahkan ke halaman otorisasi Shopee. */
export async function GET(req: Request) {
  if (!(await isAdmin())) return NextResponse.redirect(new URL("/admin/login", req.url));
  if (isMock()) return NextResponse.redirect(new URL("/admin?err=Isi+SHOPEE_PARTNER_ID+dan+SHOPEE_PARTNER_KEY+dulu", req.url));
  return NextResponse.redirect(buildAuthUrl());
}
