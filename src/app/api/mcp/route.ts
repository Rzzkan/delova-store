import { mcpNotAllowed, mcpPost } from "@/lib/mcp/http";

export const dynamic = "force-dynamic";
export const POST = (req: Request) => mcpPost(req);
export const GET = mcpNotAllowed;
export const DELETE = mcpNotAllowed;
