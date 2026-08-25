import { readStore, updateStore, type StoredProduct } from "@/lib/store";
import { requirePermission } from "@/lib/auth";

export const dynamic = "force-dynamic";
function branchFrom(request: Request, body?: Partial<StoredProduct>) { const value = body?.branchId ?? new URL(request.url).searchParams.get("branchId"); return value == null || value === "" ? undefined : Number(value); }

export async function GET(request: Request) {
  const blocked = requirePermission(request, "view_inventory");
  if (blocked) return blocked;
  const branchId = branchFrom(request); const products = (await readStore()).products;
  return Response.json(branchId == null ? products : products.filter(product => product.branchId == null || product.branchId === branchId));
}

export async function POST(request: Request) {
  const blocked = requirePermission(request, "manage_products");
  if (blocked) return blocked;
  const body = (await request.json()) as Partial<StoredProduct>;
  const branchId = branchFrom(request, body);
  if (!body.name?.trim() || body.price == null || !Number.isFinite(Number(body.price)) || Number(body.price) < 0 || !Number.isInteger(Number(body.stock ?? 0)) || Number(body.stock ?? 0) < 0) {
    return Response.json({ error: "กรุณากรอกชื่อ ราคา และจำนวนสินค้าให้ถูกต้อง" }, { status: 400 });
  }
  const product: StoredProduct = {
    id: Date.now(), name: body.name.trim(), sku: body.sku?.trim() || `SKU-${Date.now()}`,
    price: Number(body.price), stock: Number(body.stock ?? 0), category: body.category || "ของกิน",
    emoji: body.emoji || "📦", color: body.color || "#ddd4c7", image: body.image || "", ...(branchId == null ? {} : { branchId }),
  };
  let store;
  try {
    store = await updateStore((current) => { if (current.products.some(item => item.sku === product.sku)) throw new Error("SKU ซ้ำ"); return { ...current, products: [product, ...current.products] }; });
  } catch (error) { if (error instanceof Error && error.message === "SKU ซ้ำ") return Response.json({ error: "SKU นี้มีอยู่แล้ว" }, { status: 409 }); throw error; }
  return Response.json(product, { status: 201, headers: { "X-Store-Count": String(store.products.length) } });
}

export async function PUT(request: Request) {
  const blocked = requirePermission(request, "manage_products");
  if (blocked) return blocked;
  const id = Number(new URL(request.url).searchParams.get("id"));
  const body = (await request.json()) as Partial<StoredProduct>;
  const branchId = branchFrom(request, body);
  if (!Number.isFinite(id) || !body.name?.trim() || body.price == null || !Number.isFinite(Number(body.price)) || Number(body.price) < 0 || !Number.isInteger(Number(body.stock ?? 0)) || Number(body.stock ?? 0) < 0) {
    return Response.json({ error: "ข้อมูลสินค้าไม่ถูกต้อง" }, { status: 400 });
  }
  let updated: StoredProduct | undefined;
  let store;
  try {
    store = await updateStore((current) => {
      const nextSku = body.sku?.trim();
      if (nextSku && current.products.some(item => item.id !== id && item.sku === nextSku)) throw new Error("SKU ซ้ำ");
      return { ...current, products: current.products.map((product) => {
        if (product.id !== id) return product;
        updated = { ...product, ...body, id, name: body.name!.trim(), sku: nextSku || product.sku, price: Number(body.price), stock: Number(body.stock ?? 0), ...(branchId == null ? {} : { branchId }) };
        return updated;
      }) };
    });
  } catch (error) { if (error instanceof Error && error.message === "SKU ซ้ำ") return Response.json({ error: "SKU นี้มีอยู่แล้ว" }, { status: 409 }); throw error; }
  if (!updated) return Response.json({ error: "ไม่พบสินค้า" }, { status: 404 });
  return Response.json({ product: updated, products: store.products });
}

export async function DELETE(request: Request) {
  const blocked = requirePermission(request, "manage_products");
  if (blocked) return blocked;
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isFinite(id)) return Response.json({ error: "รหัสสินค้าไม่ถูกต้อง" }, { status: 400 });
  const store = await updateStore((current) => ({ ...current, products: current.products.filter((product) => product.id !== id) }));
  return Response.json({ ok: true, products: store.products });
}
