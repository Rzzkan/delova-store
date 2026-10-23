import { getSeoSettings } from "@/lib/seo-settings";

export const dynamic = "force-dynamic";

/** Crawler & browser lama selalu meminta /favicon.ico — arahkan ke ikon yang dipilih admin. */
export async function GET() {
  const { favicon } = await getSeoSettings();
  return new Response(null, { status: 307, headers: { Location: favicon || "/site-icon", "Cache-Control": "public, max-age=300" } });
}
