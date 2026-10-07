import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { syncAll, syncShop } from "@/lib/shopee/sync";
import { isMock } from "@/lib/shopee/config";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

async function authorized(req: Request): Promise<boolean> {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") === `Bearer ${secret}`) return true;
  return isAdmin();
}

/** GET = dipanggil Vercel Cron (Bearer CRON_SECRET). POST = tombol "Sinkron" di admin. */
async function handle(req: Request) {
  if (!(await authorized(req))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (isMock()) return NextResponse.json({ mock: true, message: "Mode demo: isi kredensial Shopee untuk sinkron sungguhan." });
  const shop = Number(new URL(req.url).searchParams.get("shop"));
  if (shop) return NextResponse.json({ mock: false, results: [await syncShop(shop)] });
  return NextResponse.json(await syncAll());
}
export const GET = handle;
export const POST = handle;
