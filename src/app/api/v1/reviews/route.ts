import { guarded } from "@/lib/api/guard";
import { apiReviews } from "@/lib/api/data";
export const dynamic = "force-dynamic";
export const GET = (req: Request) => guarded(req, (c) => apiReviews(c.url.searchParams));
export const HEAD = GET;
