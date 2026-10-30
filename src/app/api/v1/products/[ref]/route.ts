import { guarded } from "@/lib/api/guard";
import { apiProduct } from "@/lib/api/data";
export const dynamic = "force-dynamic";
export const GET = (req: Request, ctx: { params: Promise<{ ref: string }> }) => guarded(req, async () => apiProduct(decodeURIComponent((await ctx.params).ref)));
export const HEAD = GET;
