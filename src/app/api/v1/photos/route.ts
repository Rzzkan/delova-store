import { guarded } from "@/lib/api/guard";
import { apiPhotos } from "@/lib/api/data";
export const dynamic = "force-dynamic";
export const GET = (req: Request) => guarded(req, (c) => apiPhotos(c.url.searchParams));
export const HEAD = GET;
