import { guarded } from "@/lib/api/guard";
import { apiStock } from "@/lib/api/data";
export const dynamic = "force-dynamic";
export const GET = (req: Request) => guarded(req, (c) => apiStock(c.url.searchParams));
export const HEAD = GET;
