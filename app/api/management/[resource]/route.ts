import { requirePermission, type Permission } from "@/lib/auth";
import { readStore, updateStore, type StoredResource } from "@/lib/store";

export const dynamic = "force-dynamic";
const allowedResources = new Set(["menu", "tables", "staff", "branches", "settings", "customers", "categories"]);
const resourcePermissions: Record<string, Permission> = { menu: "manage_products", tables: "sell", staff: "manage_staff", branches: "manage_branches", settings: "manage_settings", customers: "view_orders", categories: "manage_products" };

function keyOf(value: string) { return value.replace(/[^a-z]/g, ""); }
async function getKey(context: { params: Promise<{ resource: string }> }) { return keyOf((await context.params).resource); }

export async function GET(request: Request, context: { params: Promise<{ resource: string }> }) {
  const resource = await getKey(context); if (!allowedResources.has(resource)) return Response.json({ error: "ไม่พบโมดูล" }, { status: 404 });
  const blocked = requirePermission(request, resourcePermissions[resource]); if (blocked) return blocked;
  return Response.json((await readStore()).resources[resource] ?? []);
}

export async function POST(request: Request, context: { params: Promise<{ resource: string }> }) {
  const resource = await getKey(context); if (!allowedResources.has(resource)) return Response.json({ error: "ไม่พบโมดูล" }, { status: 404 });
  const blocked = requirePermission(request, resourcePermissions[resource]); if (blocked) return blocked;
  const body = (await request.json()) as Partial<StoredResource>;
  if (!body.name?.trim()) return Response.json({ error: "กรุณาระบุชื่อรายการ" }, { status: 400 });
  const item: StoredResource = { id: Date.now(), name: body.name.trim(), details: body.details?.trim() ?? "", active: body.active !== false, status: body.status ?? "", createdAt: new Date().toISOString() };
  await updateStore((current) => ({ ...current, resources: { ...current.resources, [resource]: [item, ...(current.resources[resource] ?? [])] } }));
  return Response.json(item, { status: 201 });
}

export async function DELETE(request: Request, context: { params: Promise<{ resource: string }> }) {
  const resource = await getKey(context); const id = Number(new URL(request.url).searchParams.get("id"));
  if (!allowedResources.has(resource) || !Number.isFinite(id)) return Response.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  const blocked = requirePermission(request, resourcePermissions[resource]); if (blocked) return blocked;
  if (resource === "categories") {
    const store = await readStore();
    const category = (store.resources.categories ?? []).find(item => item.id === id);
    if (category && store.products.some(product => product.category === category.name)) return Response.json({ error: "หมวดหมู่นี้ยังมีสินค้าใช้งานอยู่" }, { status: 409 });
  }
  await updateStore((current) => ({ ...current, resources: { ...current.resources, [resource]: (current.resources[resource] ?? []).filter((item) => item.id !== id) } }));
  return Response.json({ ok: true });
}

export async function PATCH(request: Request, context: { params: Promise<{ resource: string }> }) {
  const resource = await getKey(context); const id = Number(new URL(request.url).searchParams.get("id"));
  const body = (await request.json()) as Partial<StoredResource>;
  if (!allowedResources.has(resource) || !Number.isFinite(id)) return Response.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  const blocked = requirePermission(request, resourcePermissions[resource]); if (blocked) return blocked;
  let found = false;
  await updateStore((current) => {
    const currentItem = (current.resources[resource] ?? []).find(item => item.id === id);
    const nextName = body.name?.trim() || currentItem?.name;
    const resources = { ...current.resources, [resource]: (current.resources[resource] ?? []).map((item) => { if (item.id !== id) return item; found = true; return { ...item, name: nextName || item.name, details: body.details ?? item.details, active: body.active ?? item.active, status: body.status ?? item.status }; }) };
    const products = resource === "categories" && currentItem && nextName ? current.products.map(product => product.category === currentItem.name ? { ...product, category: nextName } : product) : current.products;
    return { ...current, products, resources };
  });
  return found ? Response.json({ ok: true }) : Response.json({ error: "ไม่พบรายการ" }, { status: 404 });
}
