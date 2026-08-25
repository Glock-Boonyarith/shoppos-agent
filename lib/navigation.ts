import type { Permission } from "@/lib/permissions";

export const sidebarDropdowns: Record<string, string[]> = {
  "ขายหน้าร้าน": ["รายการขาย", "ใบเสร็จการขาย"],
  "คลังสินค้า": ["สินค้าทั้งหมด", "รับสินค้าเข้า", "ปรับสต็อก"],
  รายงาน: ["สรุปยอดขาย", "สินค้าขายดี"],
  "ระบบจัดการร้านค้า": ["ออกแบบเมนู", "จัดการโต๊ะ", "จัดการออร์เดอร์", "จัดการพนักงาน", "จัดการสาขา", "ลูกค้า", "ผู้ใช้งาน", "สิทธิ์การเข้าถึง", "ตั้งค่าร้าน"],
};

const sidebarItems: Array<[string, string, Permission]> = [
  ["ภาพรวม", "dashboard", "view_reports"],
  ["ขายหน้าร้าน", "cart", "sell"],
  ["คลังสินค้า", "box", "view_inventory"],
  ["รายงาน", "chart", "view_reports"],
  ["ระบบจัดการร้านค้า", "settings", "manage_settings"],
];

export function getSidebarItems(can: (permission: Permission) => boolean) {
  return sidebarItems.filter(([, , permission]) => can(permission));
}
