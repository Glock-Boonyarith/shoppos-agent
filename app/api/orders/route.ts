import { readStore, updateStore, type StoredInventoryMovement, type StoredOrder, type StoredOrderItem } from "@/lib/store";
import { requirePermission, requestUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const blocked = requirePermission(request, "view_orders");
  if (blocked) return blocked;
  const branchValue = new URL(request.url).searchParams.get("branchId"); const branchId = branchValue == null || branchValue === "" ? undefined : Number(branchValue); const orders = (await readStore()).orders;
  return Response.json(branchId == null ? orders : orders.filter(order => order.branchId == null || order.branchId === branchId));
}

export async function POST(request: Request) {
  const blocked = requirePermission(request, "sell");
  if (blocked) return blocked;
  const body = (await request.json()) as { items?: StoredOrderItem[]; total?: number; paymentMethod?: StoredOrder["paymentMethod"]; tableId?: number; tableName?: string; customerId?: number; branchId?: number };
  if (!body.items?.length || typeof body.total !== "number" || !Number.isFinite(body.total) || body.total < 0 || !["cash", "qr", "card"].includes(body.paymentMethod || "")) {
    return Response.json({ error: "รายการขายไม่ถูกต้อง" }, { status: 400 });
  }
  let created: StoredOrder | undefined;
  try {
    const actor = requestUser(request)?.name || "ผู้ใช้งาน";
    await updateStore((current) => {
      const quantities = new Map(body.items!.map((item) => [item.id, item.qty]));
      if (quantities.size !== body.items!.length) throw new Error("รายการสินค้าซ้ำกัน");
      const canonicalItems: StoredOrderItem[] = [];
      let calculatedTotal = 0;
      for (const item of body.items!) {
        if (!Number.isInteger(item.qty) || item.qty <= 0) throw new Error("จำนวนสินค้าไม่ถูกต้อง");
        const product = current.products.find(candidate => candidate.id === item.id && (body.branchId == null || candidate.branchId == null || candidate.branchId === body.branchId));
        if (!product) throw new Error("ไม่พบสินค้าในคลัง");
        if (item.qty > product.stock) throw new Error(`สินค้า ${product.name} มีไม่พอ`);
        calculatedTotal += product.price * item.qty;
        canonicalItems.push({ ...product, qty: item.qty });
      }
      if (Math.abs(calculatedTotal - body.total!) > 0.01) throw new Error("ยอดรวมออร์เดอร์ไม่ตรงกับราคาสินค้า");
      const products = current.products.map((product) => {
        const qty = quantities.get(product.id) ?? 0;
        return qty ? { ...product, stock: product.stock - qty } : product;
      });
      const selectedTable = body.tableId == null ? undefined : current.resources.tables?.find(table => table.id === body.tableId);
      if (body.tableId != null && !selectedTable) throw new Error("ไม่พบโต๊ะที่เลือก");
      const selectedCustomer = body.customerId == null ? undefined : current.resources.customers?.find(customer => customer.id === body.customerId);
      if (body.customerId != null && !selectedCustomer) throw new Error("ไม่พบลูกค้าที่เลือก");
      created = { id: `ORD-${Date.now()}`, items: canonicalItems, total: calculatedTotal, createdAt: new Date().toISOString(), status: "paid", paymentMethod: body.paymentMethod!, ...(body.branchId == null ? {} : { branchId: body.branchId }), ...(selectedTable ? { tableId: selectedTable.id, tableName: selectedTable.name } : {}), ...(selectedCustomer ? { customerId: selectedCustomer.id, customerName: selectedCustomer.name } : {}) };
      const movements: StoredInventoryMovement[] = canonicalItems.map((item) => ({ id: Date.now() + item.id, productId: item.id, productName: item.name, delta: -item.qty, reason: `ขายสินค้า ${created!.id}`, source: "sale", createdAt: created!.createdAt, createdBy: actor }));
      const resources = selectedTable ? { ...current.resources, tables: (current.resources.tables ?? []).map(table => table.id === selectedTable.id ? { ...table, status: "ไม่ว่าง" } : table) } : current.resources;
      return { products, orders: [created, ...current.orders], resources, users: current.users, inventoryMovements: [...movements, ...current.inventoryMovements] };
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "ไม่สามารถบันทึกออร์เดอร์ได้" }, { status: 409 });
  }
  return Response.json(created, { status: 201 });
}

export async function PATCH(request: Request) {
  const blocked = requirePermission(request, "manage_orders"); if (blocked) return blocked;
  const id = new URL(request.url).searchParams.get("id"); if (!id) return Response.json({ error: "กรุณาระบุเลขที่ออร์เดอร์" }, { status: 400 });
  let updated: StoredOrder | undefined;
  try {
    await updateStore((current) => {
      const order = current.orders.find(candidate => candidate.id === id);
      if (!order) throw new Error("ไม่พบออร์เดอร์");
      if (order.status === "voided") throw new Error("ออร์เดอร์นี้ถูกยกเลิกไปแล้ว");
      const products = current.products.map(product => { const item = order.items.find(entry => entry.id === product.id); return item ? { ...product, stock: product.stock + item.qty } : product; });
      const now = new Date().toISOString(); const actor = requestUser(request)?.name || "ผู้ใช้งาน";
      const movements = order.items.map(item => ({ id: Date.now() + item.id, productId: item.id, productName: item.name, delta: item.qty, reason: `คืนสต็อกจากการยกเลิก ${order.id}`, source: "adjustment" as const, createdAt: now, createdBy: actor }));
      updated = { ...order, status: "voided" };
      const resources = order.tableId == null ? current.resources : { ...current.resources, tables: (current.resources.tables ?? []).map(table => table.id === order.tableId ? { ...table, status: "ว่าง" } : table) };
      return { ...current, products, orders: current.orders.map(candidate => candidate.id === id ? updated! : candidate), resources, inventoryMovements: [...movements, ...current.inventoryMovements] };
    });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "ไม่สามารถยกเลิกออร์เดอร์ได้" }, { status: 409 }); }
  return Response.json(updated);
}
