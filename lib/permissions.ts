export type UserRole = "owner" | "manager" | "cashier" | "warehouse";
export type Permission =
  | "sell"
  | "view_orders"
  | "manage_orders"
  | "view_reports"
  | "view_inventory"
  | "manage_products"
  | "manage_inventory"
  | "manage_staff"
  | "manage_branches"
  | "manage_settings";

const rolePermissions: Record<UserRole, Permission[]> = {
  owner: ["sell", "view_orders", "manage_orders", "view_reports", "view_inventory", "manage_products", "manage_inventory", "manage_staff", "manage_branches", "manage_settings"],
  manager: ["sell", "view_orders", "manage_orders", "view_reports", "view_inventory", "manage_products", "manage_inventory", "manage_staff"],
  cashier: ["sell", "view_orders", "manage_orders", "view_inventory"],
  warehouse: ["view_inventory", "manage_products", "manage_inventory"],
};

export function hasPermission(role: UserRole, permission: Permission) {
  return rolePermissions[role]?.includes(permission) ?? false;
}
