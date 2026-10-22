import { appUrl } from "@/lib/origin";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { isMock } from "@/lib/shopee/config";
import { buildAuthUrl } from "@/lib/shopee/client";

/** Admin klik "Hubungkan toko Shopee" → diarahkan ke halaman otorisasi Shopee. */
export async function GET(req: Request) {
  if (!(await isAdmin())) return NextResponse.redirect(appUrl("/admin/login", req));
  if (isMock()) return NextResponse.redirect(appUrl("/admin?err=Isi+SHOPEE_PARTNER_ID+dan+SHOPEE_PARTNER_KEY+dulu", req));
  return NextResponse.redirect(buildAuthUrl());
}
