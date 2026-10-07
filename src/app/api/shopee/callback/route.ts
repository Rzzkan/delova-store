import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { exchangeCode } from "@/lib/shopee/client";
import { refreshShopProfile, syncShop } from "@/lib/shopee/sync";

export const maxDuration = 60;

/** Shopee redirect ke sini dengan ?code=...&shop_id=... setelah penjual menyetujui. */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const back = (msg: string, ok = false) => NextResponse.redirect(new URL(`/admin?${ok ? "ok" : "err"}=${encodeURIComponent(msg)}`, req.url));
  if (!(await isAdmin())) return NextResponse.redirect(new URL("/admin/login", req.url));

  const code = u.searchParams.get("code");
  const shopId = Number(u.searchParams.get("shop_id"));
  if (!code || !shopId) {
    if (u.searchParams.get("main_account_id")) return back("Otorisasi via Main Account belum didukung. Otorisasi tiap toko (shop) satu per satu.");
    return back("Callback Shopee tidak lengkap (code/shop_id kosong)");
  }
  try {
    await exchangeCode(code, shopId);
    await refreshShopProfile(shopId);
    const r = await syncShop(shopId); // sinkron awal langsung setelah terhubung
    return r.error ? back(`Terhubung, tapi sinkron gagal: ${r.error}`) : back(`Toko ${r.name} terhubung — ${r.upserted} produk disinkronkan`, true);
  } catch (e) {
    return back(e instanceof Error ? e.message : "Gagal menukar token");
  }
}
