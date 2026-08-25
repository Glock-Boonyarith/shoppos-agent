import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

export type StoredProduct = {
  id: number;
  branchId?: number;
  name: string;
  sku: string;
  price: number;
  stock: number;
  category: string;
  emoji: string;
  color: string;
  image?: string;
};
export type StoredOrderItem = StoredProduct & { qty: number };
export type StoredOrder = { id: string; branchId?: number; items: StoredOrderItem[]; total: number; createdAt: string; status: "paid" | "voided"; paymentMethod: "cash" | "qr" | "card"; tableId?: number; tableName?: string; customerId?: number; customerName?: string };
export type StoredResource = { id: number; name: string; details: string; active: boolean; status: string; createdAt: string };
export type StoredUser = { id: number; username: string; name: string; role: "owner" | "manager" | "cashier" | "warehouse"; passwordHash: string; active: boolean; createdAt: string };
export type StoredInventoryMovement = { id: number; productId: number; productName: string; delta: number; reason: string; source: "sale" | "receipt" | "adjustment"; createdAt: string; createdBy: string };
export type StoreData = { products: StoredProduct[]; orders: StoredOrder[]; resources: Record<string, StoredResource[]>; users: StoredUser[]; inventoryMovements: StoredInventoryMovement[] };

const dataDirectory = path.join(process.cwd(), "data");
const databaseFile = path.join(dataDirectory, "shoppos.sqlite");
let database: DatabaseSync | undefined;
let writeQueue = Promise.resolve();

function getDatabase() {
  if (database) return database;
  mkdirSync(dataDirectory, { recursive: true });
  database = new DatabaseSync(databaseFile);
  database.exec(`PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY, name TEXT NOT NULL, sku TEXT NOT NULL UNIQUE, price REAL NOT NULL, stock INTEGER NOT NULL DEFAULT 0, category TEXT NOT NULL, emoji TEXT NOT NULL, color TEXT NOT NULL, image TEXT NOT NULL DEFAULT '', branch_id INTEGER);
    CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, items_json TEXT NOT NULL, total REAL NOT NULL, created_at TEXT NOT NULL, status TEXT NOT NULL, payment_method TEXT NOT NULL DEFAULT 'cash', table_id INTEGER, table_name TEXT, customer_id INTEGER, customer_name TEXT, branch_id INTEGER);
    CREATE TABLE IF NOT EXISTS resources (id INTEGER PRIMARY KEY, resource TEXT NOT NULL, name TEXT NOT NULL, details TEXT NOT NULL DEFAULT '', active INTEGER NOT NULL DEFAULT 1, status TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT NOT NULL UNIQUE, name TEXT NOT NULL, role TEXT NOT NULL, password_hash TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS inventory_movements (id INTEGER PRIMARY KEY, product_id INTEGER NOT NULL, product_name TEXT NOT NULL, delta INTEGER NOT NULL, reason TEXT NOT NULL, source TEXT NOT NULL, created_at TEXT NOT NULL, created_by TEXT NOT NULL);`);
  try { database.exec("ALTER TABLE orders ADD COLUMN payment_method TEXT NOT NULL DEFAULT 'cash'"); } catch { /* column already exists */ }
  try { database.exec("ALTER TABLE orders ADD COLUMN table_id INTEGER"); } catch { /* column already exists */ }
  try { database.exec("ALTER TABLE orders ADD COLUMN table_name TEXT"); } catch { /* column already exists */ }
  try { database.exec("ALTER TABLE orders ADD COLUMN customer_id INTEGER"); } catch { /* column already exists */ }
  try { database.exec("ALTER TABLE orders ADD COLUMN customer_name TEXT"); } catch { /* column already exists */ }
  try { database.exec("ALTER TABLE products ADD COLUMN branch_id INTEGER"); } catch { /* column already exists */ }
  try { database.exec("ALTER TABLE products ADD COLUMN image TEXT NOT NULL DEFAULT ''"); } catch { /* column already exists */ }
  try { database.exec("ALTER TABLE orders ADD COLUMN branch_id INTEGER"); } catch { /* column already exists */ }
  return database;
}

export async function readStore(): Promise<StoreData> {
  const db = getDatabase();
  const products = db.prepare("SELECT id, name, sku, price, stock, category, emoji, color, image, branch_id FROM products ORDER BY id DESC").all() as Array<StoredProduct & { image: string; branch_id: number | null }>;
  const orderRows = db.prepare("SELECT id, items_json, total, created_at, status, payment_method, table_id, table_name, customer_id, customer_name, branch_id FROM orders ORDER BY created_at DESC").all() as Array<{ id: string; items_json: string; total: number; created_at: string; status: StoredOrder["status"]; payment_method: StoredOrder["paymentMethod"]; table_id: number | null; table_name: string | null; customer_id: number | null; customer_name: string | null; branch_id: number | null }>;
  const resourceRows = db.prepare("SELECT id, resource, name, details, active, status, created_at FROM resources ORDER BY id DESC").all() as Array<{ id: number; resource: string; name: string; details: string; active: number; status: string; created_at: string }>;
  const users = db.prepare("SELECT id, username, name, role, password_hash, active, created_at FROM users ORDER BY id DESC").all() as Array<{ id: number; username: string; name: string; role: StoredUser["role"]; password_hash: string; active: number; created_at: string }>;
  const inventoryMovements = db.prepare("SELECT id, product_id, product_name, delta, reason, source, created_at, created_by FROM inventory_movements ORDER BY created_at DESC").all() as Array<{ id: number; product_id: number; product_name: string; delta: number; reason: string; source: StoredInventoryMovement["source"]; created_at: string; created_by: string }>;
  const resources: Record<string, StoredResource[]> = {};
  resourceRows.forEach((row) => { (resources[row.resource] ??= []).push({ id: row.id, name: row.name, details: row.details, active: Boolean(row.active), status: row.status, createdAt: row.created_at }); });
  return { products: products.map(({ branch_id, ...product }) => ({ ...product, ...(branch_id == null ? {} : { branchId: branch_id }) })), orders: orderRows.map((row) => ({ id: row.id, items: JSON.parse(row.items_json) as StoredOrderItem[], total: row.total, createdAt: row.created_at, status: row.status, paymentMethod: row.payment_method || "cash", ...(row.branch_id == null ? {} : { branchId: row.branch_id }), ...(row.table_id == null ? {} : { tableId: row.table_id, tableName: row.table_name || undefined }), ...(row.customer_id == null ? {} : { customerId: row.customer_id, customerName: row.customer_name || undefined }) })), resources, users: users.map((row) => ({ id: row.id, username: row.username, name: row.name, role: row.role, passwordHash: row.password_hash, active: Boolean(row.active), createdAt: row.created_at })), inventoryMovements: inventoryMovements.map((row) => ({ id: row.id, productId: row.product_id, productName: row.product_name, delta: row.delta, reason: row.reason, source: row.source, createdAt: row.created_at, createdBy: row.created_by })) };
}

export async function updateStore(mutator: (current: StoreData) => StoreData | Promise<StoreData>) {
  const operation = writeQueue.then(async () => {
    const next = await mutator(await readStore());
    const db = getDatabase();
    db.exec("BEGIN IMMEDIATE");
    try {
      db.exec("DELETE FROM products; DELETE FROM orders; DELETE FROM resources; DELETE FROM users; DELETE FROM inventory_movements;");
      const productStatement = db.prepare("INSERT INTO products (id, name, sku, price, stock, category, emoji, color, image, branch_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
      next.products.forEach((product) => productStatement.run(product.id, product.name, product.sku, product.price, product.stock, product.category, product.emoji, product.color, product.image ?? "", product.branchId ?? null));
      const orderStatement = db.prepare("INSERT INTO orders (id, items_json, total, created_at, status, payment_method, table_id, table_name, customer_id, customer_name, branch_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
      next.orders.forEach((order) => orderStatement.run(order.id, JSON.stringify(order.items), order.total, order.createdAt, order.status, order.paymentMethod, order.tableId ?? null, order.tableName ?? null, order.customerId ?? null, order.customerName ?? null, order.branchId ?? null));
      const resourceStatement = db.prepare("INSERT INTO resources (id, resource, name, details, active, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
      Object.entries(next.resources).forEach(([resource, items]) => items.forEach((item) => resourceStatement.run(item.id, resource, item.name, item.details, item.active ? 1 : 0, item.status, item.createdAt)));
      const userStatement = db.prepare("INSERT INTO users (id, username, name, role, password_hash, active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
      next.users.forEach((user) => userStatement.run(user.id, user.username, user.name, user.role, user.passwordHash, user.active ? 1 : 0, user.createdAt));
      const movementStatement = db.prepare("INSERT INTO inventory_movements (id, product_id, product_name, delta, reason, source, created_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
      next.inventoryMovements.forEach((movement) => movementStatement.run(movement.id, movement.productId, movement.productName, movement.delta, movement.reason, movement.source, movement.createdAt, movement.createdBy));
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
    return next;
  });
  writeQueue = operation.then(() => undefined, () => undefined);
  return operation;
}
