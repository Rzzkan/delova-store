import { mcpNotAllowed, mcpPost } from "@/lib/mcp/http";

export const dynamic = "force-dynamic";
export const POST = async (req: Request, ctx: { params: Promise<{ token: string }> }) => mcpPost(req, (await ctx.params).token);
export const GET = mcpNotAllowed;
export const DELETE = mcpNotAllowed;
