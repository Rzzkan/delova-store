import { NextResponse } from "next/server";
import { verifyPush } from "@/lib/shopee/client";
import { syncItem } from "@/lib/shopee/sync";

export const maxDuration = 60;

/**
 * Shopee Live Push → /api/shopee/webhook
 * Saat produk/stok/harga berubah, Shopee mengirim notifikasi; kita sinkron item terkait saja (hampir real-time).
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const url = process.env.SHOPEE_WEBHOOK_URL || req.url;
  if (!verifyPush(url, raw, req.headers.get("authorization"))) return NextResponse.json({ error: "bad signature" }, { status: 401 });
  try {
    const body = JSON.parse(raw);
    const shopId = Number(body.shop_id);
    const itemId = Number(body.data?.item_id);
    if (shopId && itemId) await syncItem(shopId, itemId);
  } catch (e) {
    console.error("webhook error", e);
  }
  return NextResponse.json({ ok: true }); // selalu 200 agar Shopee tidak retry berlebihan
}
