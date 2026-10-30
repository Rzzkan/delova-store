import { guarded } from "@/lib/api/guard";
import { apiShops } from "@/lib/api/data";
export const dynamic = "force-dynamic";
export const GET = (req: Request) => guarded(req, () => apiShops());
export const HEAD = GET;
