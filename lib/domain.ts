export type Product = { id: number; branchId?: number; name: string; sku: string; price: number; stock: number; category: string; emoji: string; color: string; image?: string };
export type CartItem = Product & { qty: number };
export type PaymentMethod = "cash" | "qr" | "card";
export type Order = { id: string; branchId?: number; items: CartItem[]; total: number; createdAt: string; status: "paid" | "voided"; paymentMethod: PaymentMethod; tableId?: number; tableName?: string; customerId?: number; customerName?: string };
