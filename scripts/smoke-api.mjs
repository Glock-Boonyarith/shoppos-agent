const baseUrl = process.env.SHOPPOS_BASE_URL || "http://127.0.0.1:3000";
const endpoints = [
  "/api/auth/session",
  "/api/products",
  "/api/products?branchId=1",
  "/api/orders",
  "/api/orders?branchId=1",
  "/api/management/branches",
  "/api/management/menu",
  "/api/inventory/movements",
];

for (const endpoint of endpoints) {
  const response = await fetch(`${baseUrl}${endpoint}`);
  if (!response.ok) throw new Error(`${endpoint} returned HTTP ${response.status}`);
  const body = await response.json();
  if (body == null || (typeof body !== "object" && typeof body !== "boolean")) throw new Error(`${endpoint} returned an invalid JSON body`);
  console.log(`ok ${endpoint} (${response.status})`);
}

let productId;
try {
  const productResponse = await fetch(`${baseUrl}/api/products`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "__api_smoke_product__", sku: `SMOKE-${Date.now()}`, price: 25, stock: 3, category: "ของใช้", emoji: "🧪", color: "#eee" }) });
  const product = await productResponse.json();
  if (!productResponse.ok) throw new Error(`/api/products POST returned HTTP ${productResponse.status}: ${JSON.stringify(product)}`);
  productId = product.id;
  const orderResponse = await fetch(`${baseUrl}/api/orders`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: [{ ...product, qty: 1 }], total: 25, paymentMethod: "cash" }) });
  const order = await orderResponse.json();
  if (!orderResponse.ok || order.status !== "paid") throw new Error(`/api/orders POST failed: ${JSON.stringify(order)}`);
  const cancelResponse = await fetch(`${baseUrl}/api/orders?id=${encodeURIComponent(order.id)}`, { method: "PATCH" });
  const cancelled = await cancelResponse.json();
  if (!cancelResponse.ok || cancelled.status !== "voided") throw new Error(`/api/orders PATCH failed: ${JSON.stringify(cancelled)}`);
  console.log(`ok sale lifecycle (${order.id})`);
} finally {
  if (productId) {
    const cleanup = await fetch(`${baseUrl}/api/products?id=${productId}`, { method: "DELETE" });
    if (!cleanup.ok) throw new Error(`/api/products cleanup failed with HTTP ${cleanup.status}`);
  }
}
