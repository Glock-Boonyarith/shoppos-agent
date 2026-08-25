import { requirePermission, requestUser } from "@/lib/auth";
import { updateStore, type StoredInventoryMovement } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const blocked = requirePermission(request, "manage_inventory");
  if (blocked) return blocked;
  const body = (await request.json()) as { productId?: number; delta?: number; reason?: string };
  if (!Number.isFinite(body.productId) || !Number.isFinite(body.delta) || !body.delta || !body.reason?.trim()) return Response.json({ error: "กรุณาระบุสินค้า จำนวน และเหตุผล" }, { status: 400 });
  let updatedStock: number | undefined;
  let found = false;
  const actor = requestUser(request)?.name || "ผู้ใช้งาน";
  const source: StoredInventoryMovement["source"] = Number(body.delta) > 0 ? "receipt" : "adjustment";
  let store;
  try {
    store = await updateStore((current) => {
      const movementId = Date.now(); const createdAt = new Date().toISOString();
      const products = current.products.map((product) => {
      if (product.id !== body.productId) return product;
      found = true;
      updatedStock = product.stock + Number(body.delta);
      if (updatedStock < 0) throw new Error("จำนวนสต็อกไม่สามารถติดลบได้");
      return { ...product, stock: updatedStock };
      });
      if (!found) return { ...current, products };
      const productName = current.products.find((product) => product.id === body.productId)?.name || "สินค้า";
      return { ...current, products, inventoryMovements: [{ id: movementId, productId: Number(body.productId), productName, delta: Number(body.delta), reason: body.reason!.trim(), source, createdAt, createdBy: actor }, ...current.inventoryMovements] };
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "ไม่สามารถปรับสต็อกได้" }, { status: 409 });
  }
  if (!found) return Response.json({ error: "ไม่พบสินค้า" }, { status: 404 });
  return Response.json({ products: store.products, stock: updatedStock });
}
