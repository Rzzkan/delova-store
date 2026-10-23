import { buildRobots, getSeoSettings } from "@/lib/seo-settings";
import { siteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function GET() {
  return new Response(buildRobots(await getSeoSettings(), siteUrl()), {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=300" },
  });
}
