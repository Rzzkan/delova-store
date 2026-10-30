import { guarded } from "@/lib/api/guard";
import { apiProducts } from "@/lib/api/data";
export const dynamic = "force-dynamic";
export const GET = (req: Request) => guarded(req, (c) => apiProducts(c.url.searchParams));
export const HEAD = GET;
