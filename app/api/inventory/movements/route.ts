import { requirePermission } from "@/lib/auth";
import { readStore } from "@/lib/store";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const blocked = requirePermission(request, "view_inventory"); if (blocked) return blocked;
  const limit = Math.min(200, Math.max(1, Number(new URL(request.url).searchParams.get("limit") || 50)));
  return Response.json((await readStore()).inventoryMovements.slice(0, limit));
}
