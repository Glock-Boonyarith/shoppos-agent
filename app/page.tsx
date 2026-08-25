"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { hasPermission, type Permission, type UserRole } from "@/lib/permissions";
import { money } from "@/lib/formatters";
import type { CartItem, Order, PaymentMethod, Product } from "@/lib/domain";
import { deleteResource, patchResource, postResource, type ApiResource } from "@/lib/client-resources";
import { DomainHeader } from "@/app/components/Shared";
import { getSidebarItems, sidebarDropdowns } from "@/lib/navigation";
import { ReportsPanel } from "@/app/components/ReportsPanel";
import { OrderHistoryPanel } from "@/app/components/OrderHistoryPanel";
import { AddProductModal, InventoryPanel } from "@/app/components/InventoryPanel";
import { SettingsPanel as StoreSettingsPanel, SystemPanel as StoreSystemPanel } from "@/app/components/StoreSettings";
import { PermissionPanel as AccessPermissionPanel, UserPanel as AccessUserPanel } from "@/app/components/AccessPanels";

const seedProducts: Product[] = [];
const goBackInApp = () => window.dispatchEvent(new Event("shoppos:back"));
function Icon({ name, size = 19 }: { name: string; size?: number }) {
  const paths: Record<string, string> = {
    dashboard: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
    cart: "M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 1.9-1.4L21 8H6M10 21a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm9 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z",
    box: "M21 8 12 3 3 8l9 5 9-5ZM3 8v9l9 5 9-5V8M12 13v9",
    chart: "M4 19V5m0 14h17M8 16v-5m4 5V7m4 9v-8m4 8v-4",
    settings:
      "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm8.4-3.5 1.1-.8-1.7-3-1.3.5a7.7 7.7 0 0 0-1.8-1l-.2-1.4h-3.5l-.2 1.4a7.7 7.7 0 0 0-1.8 1l-1.3-.5-1.7 3 1.1.8a7.4 7.4 0 0 0 0 2l-1.1.8 1.7 3 1.3-.5a7.7 7.7 0 0 0 1.8 1l.2 1.4h3.5l.2-1.4a7.7 7.7 0 0 0 1.8-1l1.3.5 1.7-3-1.1-.8a7.4 7.4 0 0 0 0-2Z",
    search: "m21 21-4.3-4.3M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z",
    plus: "M12 5v14M5 12h14",
    bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4",
    bag: "M6 8h12l1 13H5L6 8Zm3 0V6a3 3 0 0 1 6 0v2",
    cash: "M3 6h18v12H3zM7 12h.01M17 12h.01M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
    receipt: "M5 3h14v18l-3-2-4 2-4-2-3 2V3Zm4 5h6M9 12h6M9 15h4",
    wallet:
      "M4 6h16v13H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm0 0V4h13a2 2 0 0 1 2 2v1m-5 7h.01",
    alert: "M12 3 2 21h20L12 3Zm0 6v5m0 3h.01",
    users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m6-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8-5v6m3-3h-6",
    user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2m8-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8",
    shield: "M12 3 20 6v5c0 5-3.4 8.2-8 10-4.6-1.8-8-5-8-10V6l8-3Zm-3 9 2 2 4-4",
    menu: "M4 6h16M4 12h16M4 18h16",
    table: "M4 5h16v4H4zM6 9v10m12-10v10M3 19h18",
    orders: "M5 3h14v18l-3-2-4 2-4-2-3 2V3Zm4 5h6M9 12h6M9 15h4",
    staff: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m6-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm10-5v6m3-3h-6",
    branches: "M3 21h18M5 21V7l7-4 7 4v14M9 21v-4h6v4M9 9h.01M15 9h.01M9 13h.01M15 13h.01",
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[name]} />
    </svg>
  );
}
export default function Home() {
  const [active, setActive] = useState("ขายหน้าร้าน");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [products, setProducts] = useState<Product[]>(seedProducts);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [category, setCategory] = useState("ทั้งหมด");
  const [query, setQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [pendingDeleteProduct, setPendingDeleteProduct] = useState<Product | null>(null);
  const [paid, setPaid] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [tables, setTables] = useState<ApiResource[]>([]);
  const [selectedTableId, setSelectedTableId] = useState("");
  const [customers, setCustomers] = useState<ApiResource[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [menuEntries, setMenuEntries] = useState<MenuEntry[]>([]);
  const [categoryEntries, setCategoryEntries] = useState<ApiResource[]>([]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [newCategory, setNewCategory] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [pendingDeleteCategory, setPendingDeleteCategory] = useState<ApiResource | null>(null);
  const [categoryNotice, setCategoryNotice] = useState("");
  const [branches, setBranches] = useState<ApiResource[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const categories = useMemo(() => ["ทั้งหมด", ...Array.from(new Set([
    ...categoryEntries.filter(entry => entry.active).map(entry => entry.name),
    ...products.map(product => product.category),
  ].filter(Boolean)))], [categoryEntries, products]);
  const [openMenu, setOpenMenu] = useState("ขายหน้าร้าน");
  const [subPage, setSubPage] = useState("");
  const [auth, setAuth] = useState({ checked: false, required: false, configured: false, authenticated: true, role: "owner" as UserRole, user: "ผู้ดูแลร้าน" });
  useEffect(() => {
    fetch("/api/auth/session").then((response) => response.json()).then((session) => setAuth({ ...session, checked: true })).catch(() => setAuth((current) => ({ ...current, checked: true })));
  }, []);
  useEffect(() => { fetch("/api/management/tables").then(response => response.ok ? response.json() as Promise<ApiResource[]> : Promise.reject()).then(setTables).catch(() => { /* tables remain optional */ }); }, []);
  useEffect(() => { fetch("/api/management/customers").then(response => response.ok ? response.json() as Promise<ApiResource[]> : Promise.reject()).then(setCustomers).catch(() => { /* customers remain optional */ }); }, []);
  useEffect(() => { fetch("/api/management/menu").then(response => response.ok ? response.json() as Promise<ApiResource[]> : Promise.reject()).then(rows => setMenuEntries(hydrateMenu(rows))).catch(() => { /* menu remains optional */ }); }, []);
  useEffect(() => { fetch("/api/management/categories").then(response => response.ok ? response.json() as Promise<ApiResource[]> : Promise.reject()).then(setCategoryEntries).catch(() => { /* categories remain optional */ }); }, []);
  useEffect(() => { fetch("/api/management/branches").then(response => response.ok ? response.json() as Promise<ApiResource[]> : Promise.reject()).then(rows => { setBranches(rows); setSelectedBranchId(current => current || (rows[0] ? String(rows[0].id) : "")); }).catch(() => { /* branches remain optional */ }); }, []);
  useEffect(() => { const refreshResources = () => { fetch("/api/management/tables").then(response => response.ok ? response.json() as Promise<ApiResource[]> : Promise.reject()).then(setTables).catch(() => undefined); fetch("/api/management/customers").then(response => response.ok ? response.json() as Promise<ApiResource[]> : Promise.reject()).then(setCustomers).catch(() => undefined); fetch("/api/management/menu").then(response => response.ok ? response.json() as Promise<ApiResource[]> : Promise.reject()).then(rows => setMenuEntries(hydrateMenu(rows))).catch(() => undefined); fetch("/api/management/categories").then(response => response.ok ? response.json() as Promise<ApiResource[]> : Promise.reject()).then(setCategoryEntries).catch(() => undefined); fetch("/api/management/branches").then(response => response.ok ? response.json() as Promise<ApiResource[]> : Promise.reject()).then(setBranches).catch(() => undefined); }; window.addEventListener("shoppos:resources-changed", refreshResources); return () => window.removeEventListener("shoppos:resources-changed", refreshResources); }, []);
  useEffect(() => {
    let cancelled = false;
    const branchQuery = selectedBranchId ? `?branchId=${encodeURIComponent(selectedBranchId)}` : "";
    Promise.all([fetch(`/api/products${branchQuery}`).then((response) => response.ok ? response.json() : Promise.reject()), fetch(`/api/orders${branchQuery}`).then((response) => response.ok ? response.json() : Promise.reject())])
      .then(([storedProducts, storedOrders]) => { if (!cancelled) { setProducts(storedProducts); setOrders(storedOrders); } })
      .catch(() => { /* localStorage state remains available while the server store is unavailable */ });
    return () => { cancelled = true; };
  }, [selectedBranchId]);
  useEffect(() => { const handleBack = () => setSubPage(""); window.addEventListener("shoppos:back", handleBack); return () => window.removeEventListener("shoppos:back", handleBack); }, []);
  useEffect(() => { const handleShortcut = (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); searchInputRef.current?.focus(); } }; window.addEventListener("keydown", handleShortcut); return () => window.removeEventListener("keydown", handleShortcut); }, []);
  const filtered = useMemo(
    () =>
      products.filter(
        (p) =>
          (menuEntries.filter(entry => entry.productId != null).length === 0 || menuEntries.some(entry => entry.productId === p.id && entry.active)) &&
          (category === "ทั้งหมด" || p.category === category) &&
          `${p.name} ${p.sku}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [products, category, query, menuEntries],
  );
  const total = cart.reduce((s, p) => s + p.price * p.qty, 0);
  const addCategory = async () => {
    const name = newCategory.trim();
    if (!name) return;
    if (categories.some(item => item !== "ทั้งหมด" && item.toLowerCase() === name.toLowerCase() && (editingCategoryId == null || categoryEntries.find(entry => entry.name === item)?.id !== editingCategoryId))) { setCategoryError("มีหมวดหมู่นี้อยู่แล้ว"); return; }
    if (editingCategoryId != null) {
      const currentEntry = categoryEntries.find(entry => entry.id === editingCategoryId);
      if (!currentEntry) return;
      const response = await patchResource("categories", editingCategoryId, { name });
      if (!response.ok) { setCategoryError("ไม่สามารถแก้ไขหมวดหมู่ได้"); return; }
      setCategoryEntries(current => current.map(entry => entry.id === editingCategoryId ? { ...entry, name } : entry));
      setProducts(current => current.map(product => product.category === currentEntry.name ? { ...product, category: name } : product));
    } else {
      const saved = await postResource("categories", { name });
      if (!saved) { setCategoryError("ไม่สามารถเพิ่มหมวดหมู่ได้"); return; }
      setCategoryEntries(current => [saved, ...current]);
    }
    setCategory(name);
    setNewCategory("");
    setCategoryError("");
    setEditingCategoryId(null);
    setShowAddCategory(false);
  };
  const editCategory = (entry: ApiResource) => { setEditingCategoryId(entry.id); setNewCategory(entry.name); setCategoryError(""); setShowAddCategory(true); };
  const deleteCategory = async (entry: ApiResource) => {
    if (products.some(product => product.category === entry.name)) { setCategoryNotice("ลบไม่ได้ เพราะยังมีสินค้าใช้หมวดหมู่นี้อยู่ กรุณาย้ายหรือลบสินค้าก่อน"); return; }
    setPendingDeleteCategory(entry);
  };
  const confirmDeleteCategory = async () => {
    if (!pendingDeleteCategory) return;
    const entry = pendingDeleteCategory;
    const response = await deleteResource("categories", entry.id);
    if (!response.ok) { setPendingDeleteCategory(null); setCategoryNotice("ไม่สามารถลบหมวดหมู่ได้"); return; }
    setCategoryEntries(current => current.filter(item => item.id !== entry.id));
    if (category === entry.name) setCategory("ทั้งหมด");
    setPendingDeleteCategory(null);
  };
  const addToCart = (p: Product) => {
    if (p.stock <= 0) return;
    setCart((c) =>
      c.some((i) => i.id === p.id)
        ? c.map((i) =>
            i.id === p.id ? { ...i, qty: Math.min(i.qty + 1, p.stock) } : i,
          )
        : [...c, { ...p, qty: 1 }],
    );
  };
  const changeQty = (id: number, delta: number) =>
    setCart((c) =>
      c
        .map((i) => (i.id === id ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0),
    );
  const checkout = async () => {
    if (!cart.length) return;
    setCheckoutError("");
    const selectedTable = tables.find(table => String(table.id) === selectedTableId);
    const selectedCustomer = customers.find(customer => String(customer.id) === selectedCustomerId);
    let order: Order;
    try {
      const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: cart, total, paymentMethod, tableId: selectedTable?.id, customerId: selectedCustomer?.id, ...(selectedBranchId ? { branchId: Number(selectedBranchId) } : {}) }) });
      if (!response.ok) { const result = await response.json().catch(() => ({})); setCheckoutError(result.error || "ไม่สามารถบันทึกการขายได้ กรุณาตรวจสอบการเชื่อมต่อ"); return; }
      order = await response.json() as Order;
    } catch { setCheckoutError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ จึงยังไม่บันทึกการขาย"); return; }
    setOrders((current) => [order, ...current]);
    setProducts((current) => current.map((product) => {
      const sold = cart.find((item) => item.id === product.id)?.qty ?? 0;
      return sold ? { ...product, stock: Math.max(0, product.stock - sold) } : product;
    }));
    setCart([]);
    if (selectedTable) setTables(current => current.map(table => table.id === selectedTable.id ? { ...table, status: "ไม่ว่าง" } : table));
    setSelectedTableId("");
    setSelectedCustomerId("");
    setPaid(true);
  };
  const deleteProduct = async (id: number) => {
    try {
      const response = await fetch(`/api/products?id=${id}${selectedBranchId ? `&branchId=${encodeURIComponent(selectedBranchId)}` : ""}`, { method: "DELETE" });
      if (!response.ok) { const result = await response.json().catch(() => ({})); setCheckoutError(result.error || "ไม่สามารถลบสินค้าได้"); return; }
      const result = await response.json(); setProducts(result.products as Product[]);
    } catch { setCheckoutError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ จึงยังไม่ลบสินค้า"); }
  };
  const requestDeleteProduct = (id: number) => setPendingDeleteProduct(products.find(product => product.id === id) ?? null);
  const saveProduct = async (product: Product) => {
    try {
      const method = product.id ? "PUT" : "POST";
      const response = await fetch(product.id ? `/api/products?id=${product.id}` : "/api/products", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...product, ...(selectedBranchId ? { branchId: Number(selectedBranchId) } : {}) }) });
      if (!response.ok) { const result = await response.json().catch(() => ({})); setCheckoutError(result.error || "ไม่สามารถบันทึกสินค้าได้"); return; }
      const result = await response.json(); const saved = (result.product || result) as Product; setProducts(current => product.id ? current.map(item => item.id === product.id ? saved : item) : [saved, ...current]);
    } catch { setCheckoutError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ จึงยังไม่บันทึกสินค้า"); return; }
    setEditProduct(null);
    setShowAdd(false);
  };
  if (!auth.checked) return <div className="auth-loading">กำลังตรวจสอบการเข้าสู่ระบบ…</div>;
  if (auth.required && !auth.authenticated) return <LoginScreen configured={auth.configured} onLogin={(session) => setAuth((current) => ({ ...current, ...session, authenticated: true }))} />;
  const can = (permission: Permission) => !auth.required || hasPermission(auth.role, permission);
  const logout = async () => { await fetch("/api/auth/logout", { method: "POST" }); setAuth(current => ({ ...current, authenticated: false })); };
  const navigation = getSidebarItems(can);
  return (
    <main className={`app-shell ${active === "ขายหน้าร้าน" ? "sales-mode" : ""} ${sidebarOpen ? "sidebar-open" : "sidebar-collapsed"}`}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">N</div>
          <div>
            <b>nara.</b>
            <span>STORE MANAGER</span>
          </div>
        </div>
        <div className="shop-switch">
          <div className="shop-avatar">N</div>
          <div>
            <strong>ร้านของคุณ</strong>
            {branches.length > 0 ? <select value={selectedBranchId} onChange={event => setSelectedBranchId(event.target.value)} aria-label="เลือกสาขา">{branches.filter(branch => branch.active).map(branch => <option value={branch.id} key={branch.id}>{branch.name}</option>)}</select> : <small>ยังไม่มีสาขา</small>}
          </div>
          <span>⌄</span>
        </div>
        <p className="nav-label">เมนูหลัก</p>
        <nav>
          {navigation.map(([label, icon]) => (
            <div className="nav-group" key={label}>
              <button
                className={active === label ? "nav-item active" : "nav-item"}
                title={!sidebarOpen ? label : undefined}
                onClick={() => {
                  setActive(label);
                  setSubPage("");
                  if (sidebarDropdowns[label]) setOpenMenu(openMenu === label ? "" : label);
                }}
              >
                <Icon name={icon} />
                <span className="nav-label-text">{label}</span>
                {label === "คลังสินค้า" &&
                  products.filter((p) => p.stock <= 5).length > 0 && (
                    <em>{products.filter((p) => p.stock <= 5).length}</em>
                  )}
                {sidebarDropdowns[label] && <span className="nav-chevron">{openMenu === label ? "⌃" : "⌄"}</span>}
              </button>
              {sidebarDropdowns[label] && openMenu === label && (
                <div className="subnav">
                  {sidebarDropdowns[label].filter((child) => {
                    if (child === "รายการขาย" || child === "ใบเสร็จการขาย" || child === "จัดการออร์เดอร์") return can("view_orders");
                    if (child === "สินค้าทั้งหมด" || child === "รับสินค้าเข้า" || child === "ปรับสต็อก") return can(child === "สินค้าทั้งหมด" ? "view_inventory" : "manage_inventory");
                    if (child === "สรุปยอดขาย" || child === "สินค้าขายดี") return can("view_reports");
                    if (child === "ออกแบบเมนู") return can("manage_products");
                    if (child === "จัดการโต๊ะ") return can("sell");
                    if (child === "จัดการพนักงาน" || child === "ผู้ใช้งาน" || child === "สิทธิ์การเข้าถึง") return can("manage_staff");
                    if (child === "ลูกค้า") return can("view_orders");
                    if (child === "จัดการสาขา") return can("manage_branches");
                    return can("manage_settings");
                  }).map((child) => (
                    <button key={child} onClick={() => { setActive(label); setSubPage(child); }}>{child}</button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          {can("manage_settings") && <button className="nav-item" title={!sidebarOpen ? "ตั้งค่า" : undefined} onClick={() => { setActive("ระบบจัดการร้านค้า"); setSubPage("ตั้งค่าร้าน"); }}>
            <Icon name="settings" />
            <span className="nav-label-text">ตั้งค่า</span>
          </button>}
          <button className="user-card" onClick={logout} title="ออกจากระบบ">
            <div className="user-avatar">?</div>
            <div>
              <strong>{auth.user}</strong>
              <small>{auth.role}</small>
            </div>
            <span>•••</span>
          </button>
        </div>
      </aside>
      <section className="content">
        <header className="topbar">
          <div className="topbar-title">
            <button className="sidebar-toggle" onClick={() => setSidebarOpen(open => !open)} aria-label={sidebarOpen ? "ย่อเมนู" : "เปิดเมนู"} title={sidebarOpen ? "ย่อเมนู" : "เปิดเมนู"}>
              <Icon name="menu" size={20} />
            </button>
            <div>
              <p className="eyebrow">วันนี้</p>
              <h1>{active}</h1>
            </div>
          </div>
          <div className="top-actions">
            <button className="icon-button">
              <Icon name="bell" />
            </button>
            <div className="top-user">
              <div className="user-avatar">?</div>
              <span>{auth.user}</span>
              <b>⌄</b>
            </div>
          </div>
        </header>
        {sidebarOpen && <button className="sidebar-overlay" aria-label="ปิดเมนู" onClick={() => setSidebarOpen(false)} />}
        {subPage === "รายการขาย" || subPage === "ใบเสร็จการขาย" || subPage === "จัดการออร์เดอร์" ? (
          <OrderHistoryPanel orders={orders} receiptMode={subPage === "ใบเสร็จการขาย"} managementMode={subPage === "จัดการออร์เดอร์"} onUpdated={setOrders} />
        ) : subPage === "ผู้ใช้งาน" ? (
          <AccessUserPanel />
        ) : subPage === "สิทธิ์การเข้าถึง" ? (
          <AccessPermissionPanel />
        ) : subPage === "ลูกค้า" ? (
          <CustomersPanel />
        ) : subPage === "สรุปยอดขาย" || subPage === "สินค้าขายดี" ? (
          <ReportsPanel orders={orders} bestSellerMode={subPage === "สินค้าขายดี"} />
        ) : subPage === "รับสินค้าเข้า" || subPage === "ปรับสต็อก" ? (
          <InventoryAdjustment products={products} mode={subPage} onUpdated={setProducts} />
        ) : subPage === "ออกแบบเมนู" ? (
          <MenuDesigner />
        ) : subPage === "จัดการโต๊ะ" ? (
          <TablesPanel />
        ) : subPage === "จัดการพนักงาน" ? (
          <StaffPanel />
        ) : subPage === "จัดการสาขา" ? (
          <BranchesPanel />
        ) : subPage === "ตั้งค่าร้าน" ? (
          <StoreSettingsPanel onBack={() => setSubPage("")} />
        ) : subPage ? (
          <div className="management-empty"><strong>ไม่พบโมดูลนี้</strong><span>กรุณาเลือกเมนูจาก Sidebar อีกครั้ง</span></div>
        ) : active === "ขายหน้าร้าน" ? (
          <>
            <div className="pos-layout">
              <div className="catalog">
                <div className="search-row">
                  <div className="search">
                    <Icon name="search" size={18} />
                      <input
                      ref={searchInputRef}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="ค้นหาชื่อสินค้าหรือ SKU..."
                    />
                    <kbd>⌘ K</kbd>
                  </div>
                  <button className="scan-btn" onClick={() => searchInputRef.current?.focus()}>⌁ &nbsp; สแกนบาร์โค้ด</button>
                </div>
                <div className="category-row">
                  {categories.map((c) => {
                    const entry = categoryEntries.find(item => item.active && item.name === c);
                    return <div className="category-slot" key={c}>
                      <button className={category === c ? "category active" : "category"} onClick={() => setCategory(c)}>{c}</button>
                      {entry && <span className="category-actions">
                        <button onClick={() => editCategory(entry)} title={`แก้ไข ${c}`} aria-label={`แก้ไข ${c}`}>✎</button>
                        <button onClick={() => void deleteCategory(entry)} title={`ลบ ${c}`} aria-label={`ลบ ${c}`}>×</button>
                      </span>}
                    </div>;
                  })}
                  <button className="category category-add" onClick={() => { setEditingCategoryId(null); setNewCategory(""); setCategoryError(""); setShowAddCategory(true); }} title="เพิ่มหมวดหมู่" aria-label="เพิ่มหมวดหมู่"><Icon name="plus" size={16} /></button>
                </div>
                <div className="section-head">
                  <div>
                    <h2>สินค้าทั้งหมด</h2>
                    <span>{filtered.length} รายการ</span>
                  </div>
                  {tables.length > 0 && <label className="table-select">โต๊ะ<select value={selectedTableId} onChange={event => setSelectedTableId(event.target.value)}><option value="">ไม่ระบุโต๊ะ</option>{tables.map(table => <option value={table.id} key={table.id} disabled={table.status === "ไม่ว่าง"}>{table.name}{table.status === "ไม่ว่าง" ? " (ไม่ว่าง)" : ""}</option>)}</select></label>}
                  {customers.length > 0 && <label className="table-select">ลูกค้า<select value={selectedCustomerId} onChange={event => setSelectedCustomerId(event.target.value)}><option value="">ลูกค้าทั่วไป</option>{customers.filter(customer => customer.active).map(customer => <option value={customer.id} key={customer.id}>{customer.name}</option>)}</select></label>}
                  <div className="payment-methods"><span>ช่องทางชำระเงิน</span><div><button className={paymentMethod === "cash" ? "selected" : ""} onClick={() => setPaymentMethod("cash")}>เงินสด</button><button className={paymentMethod === "qr" ? "selected" : ""} onClick={() => setPaymentMethod("qr")}>QR</button><button className={paymentMethod === "card" ? "selected" : ""} onClick={() => setPaymentMethod("card")}>บัตร</button></div></div>
                  <button
                    className="add-product"
                    onClick={() => { setEditProduct(null); setShowAdd(true); }}
                  >
                    <Icon name="plus" size={17} /> เพิ่มสินค้า
                  </button>
                </div>
                <div className="product-grid">
                  {filtered.length === 0 ? (
                    <div className="empty product-empty">
                      ยังไม่มีสินค้าในระบบ
                      <br />
                      <small>กด “เพิ่มสินค้า” เพื่อเริ่มต้นใช้งาน</small>
                    </div>
                  ) : (
                    filtered.map((p) => (
                      <button
                        className="product-card"
                        key={p.id}
                        onClick={() => addToCart(p)}
                      >
                        <div
                          className="product-art"
                          style={{ background: p.color }}
                        >
                          {p.image ? <img src={p.image} alt={p.name} /> : <span>{p.emoji}</span>}
                          <small>{p.stock <= 5 ? "ใกล้หมด" : "พร้อมขาย"}</small>
                        </div>
                        <div className="product-info">
                          <div>
                            <strong>{p.name}</strong>
                            <small>
                              {p.sku} · {p.category}
                            </small>
                          </div>
                          <b>{money(p.price)}</b>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
              <aside className="cart-panel">
                <div className="cart-heading">
                  <div>
                    <h2>รายการขาย</h2>
                    <span>{cart.length} รายการ</span>
                  </div>
                  <button className="clear" onClick={() => setCart([])}>
                    ล้างทั้งหมด
                  </button>
                </div>
                <div className="cart-items">
                  {cart.length === 0 ? (
                    <div className="empty">
                      ยังไม่มีสินค้าในรายการ
                      <br />
                      <small>เลือกสินค้าจากรายการด้านซ้ายเพื่อเริ่มขาย</small>
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div className="cart-item" key={item.id}>
                        <div
                          className="mini-art"
                          style={{ background: item.color }}
                        >
                          {item.emoji}
                        </div>
                        <div className="item-main">
                          <strong>{item.name}</strong>
                          <small>{money(item.price)} / ชิ้น</small>
                          <div className="qty">
                            <button onClick={() => changeQty(item.id, -1)}>
                              −
                            </button>
                            <span>{item.qty}</span>
                            <button onClick={() => { const product = products.find((p) => p.id === item.id); if (product && item.qty < product.stock) changeQty(item.id, 1); }}>
                              +
                            </button>
                          </div>
                        </div>
                        <b>{money(item.price * item.qty)}</b>
                      </div>
                    ))
                  )}
                </div>
                <div className="summary">
                  <div>
                    <span>ยอดรวม</span>
                    <b>{money(total)}</b>
                  </div>
                  <div>
                    <span>ส่วนลด</span>
                    <b>฿0.00</b>
                  </div>
                  <div className="total">
                    <span>ยอดชำระทั้งหมด</span>
                    <strong>{money(total)}</strong>
                  </div>
                  <button
                    className="pay-button"
                    disabled={!cart.length}
                    onClick={checkout}
                  >
                    ชำระเงิน <span>{money(total)}　→</span>
                  </button>
                  <div className="payment-note">เลือกช่องทาง: {paymentMethod === "cash" ? "เงินสด" : paymentMethod === "qr" ? "QR พร้อมเพย์" : "บัตร"}</div>
                </div>
              </aside>
            </div>
          </>
        ) : active === "ภาพรวม" ? (
          <Dashboard products={products} orders={orders} />
        ) : active === "ระบบจัดการร้านค้า" ? (
          <StoreSystemPanel onSelect={setSubPage} />
        ) : (
          <InventoryPanel products={products} categories={categoryEntries} onProductsChanged={setProducts} onCategoriesChanged={setCategoryEntries} onAdd={() => { setEditProduct(null); setShowAdd(true); }} onEdit={(product) => { setEditProduct(product); setShowAdd(true); }} onDelete={requestDeleteProduct} />
        )}
        {paid && (
          <div className="toast" onClick={() => setPaid(false)}>
            ✓ ชำระเงินสำเร็จ — เปิดบิลใหม่ได้เลย
          </div>
        )}
        {checkoutError && <div className="toast error" onClick={() => setCheckoutError("")}>ไม่สามารถชำระเงินได้: {checkoutError}</div>}
        {showAdd && (
            <AddProductModal
            onClose={() => setShowAdd(false)}
            initialProduct={editProduct}
            categories={categories.filter(item => item !== "ทั้งหมด")}
            onSave={saveProduct}
          />
        )}
        {pendingDeleteProduct && (
          <div className="modal-backdrop" onClick={() => setPendingDeleteProduct(null)}>
            <div className="modal delete-product-modal" onClick={event => event.stopPropagation()}>
              <div className="modal-head"><div><h2>ยืนยันการลบสินค้า</h2><span>การดำเนินการนี้ไม่สามารถย้อนกลับได้</span></div><button onClick={() => setPendingDeleteProduct(null)}>×</button></div>
              <div className="delete-product-preview"><div className="delete-product-image" style={{ background: pendingDeleteProduct.color }}>{pendingDeleteProduct.image ? <img src={pendingDeleteProduct.image} alt="" /> : pendingDeleteProduct.emoji}</div><div><strong>{pendingDeleteProduct.name}</strong><small>{pendingDeleteProduct.sku} · {pendingDeleteProduct.category}</small></div></div>
              <p className="delete-product-warning">คุณต้องการลบสินค้านี้ออกจากคลังสินค้าใช่หรือไม่?</p>
              <div className="modal-actions"><button onClick={() => setPendingDeleteProduct(null)}>ยกเลิก</button><button className="delete-confirm" onClick={async () => { const product = pendingDeleteProduct; setPendingDeleteProduct(null); await deleteProduct(product.id); }}>ลบสินค้า</button></div>
            </div>
          </div>
        )}
        {showAddCategory && (
          <div className="modal-backdrop" onClick={() => setShowAddCategory(false)}>
            <div className="modal category-modal" onClick={event => event.stopPropagation()}>
              <div className="modal-head"><div><h2>{editingCategoryId == null ? "เพิ่มหมวดหมู่" : "แก้ไขหมวดหมู่"}</h2><span>จัดการหมวดหมู่สำหรับจัดกลุ่มสินค้า</span></div><button onClick={() => { setShowAddCategory(false); setEditingCategoryId(null); }}>×</button></div>
              <label>ชื่อหมวดหมู่<input autoFocus value={newCategory} onChange={event => { setNewCategory(event.target.value); setCategoryError(""); }} onKeyDown={event => { if (event.key === "Enter") void addCategory(); }} placeholder="เช่น เครื่องดื่ม" /></label>
              {categoryError && <p className="category-error">{categoryError}</p>}
              <div className="modal-actions"><button onClick={() => { setShowAddCategory(false); setEditingCategoryId(null); }}>ยกเลิก</button><button className="save" disabled={!newCategory.trim()} onClick={() => void addCategory()}>{editingCategoryId == null ? "เพิ่มหมวดหมู่" : "บันทึกการแก้ไข"}</button></div>
            </div>
          </div>
        )}
        {pendingDeleteCategory && (
          <div className="modal-backdrop" onClick={() => setPendingDeleteCategory(null)}>
            <div className="modal confirm-modal" onClick={event => event.stopPropagation()}><div className="confirm-icon danger">!</div><div className="modal-head confirm-head"><div><h2 className="delete-category-title">ลบหมวดหมู่</h2><span>การดำเนินการนี้ไม่สามารถย้อนกลับได้</span></div></div><p className="confirm-message">คุณกำลังจะลบหมวดหมู่<br /><strong>“{pendingDeleteCategory.name}”</strong><br />ต้องการดำเนินการต่อใช่หรือไม่?</p><div className="modal-actions"><button onClick={() => setPendingDeleteCategory(null)}>ยกเลิก</button><button className="delete-confirm" onClick={() => void confirmDeleteCategory()}>ลบหมวดหมู่</button></div></div>
          </div>
        )}
        {categoryNotice && (
          <div className="modal-backdrop" onClick={() => setCategoryNotice("")}>
            <div className="modal confirm-modal" onClick={event => event.stopPropagation()}><div className="confirm-icon warning">!</div><div className="modal-head confirm-head"><div><h2>ไม่สามารถดำเนินการได้</h2><span>กรุณาตรวจสอบข้อมูลแล้วลองใหม่</span></div></div><p className="confirm-message">{categoryNotice}</p><div className="modal-actions"><button className="save" onClick={() => setCategoryNotice("")}>เข้าใจแล้ว</button></div></div>
          </div>
        )}
      </section>
    </main>
  );
}
function LoginScreen({ configured, onLogin }: { configured: boolean; onLogin: (session: { user: string; role: UserRole }) => void }) {
  const [username, setUsername] = useState("admin"); const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
      const result = await response.json();
      if (!response.ok) setError(result.error || "เข้าสู่ระบบไม่สำเร็จ"); else onLogin({ user: result.user, role: result.role });
    } catch { setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้"); }
    setLoading(false);
  };
  return <main className="login-screen"><div className="login-card"><div className="login-logo">N</div><h1>เข้าสู่ระบบ</h1><p>เข้าสู่ระบบจัดการร้านค้าเพื่อเริ่มใช้งาน</p>{!configured ? <div className="login-warning">ยังไม่ได้ตั้งค่าระบบ Login<br /><small>กำหนด SHOPPOS_SESSION_SECRET และรหัสผ่านผู้ดูแลในไฟล์ .env.local</small></div> : <><label>ชื่อผู้ใช้<input autoFocus value={username} onChange={(e) => setUsername(e.target.value)} /></label><label>รหัสผ่าน<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") submit(); }} placeholder="กรอกรหัสผ่าน" /></label>{error && <div className="login-error">{error}</div>}<button className="login-button" disabled={!username || !password || loading} onClick={submit}>{loading ? "กำลังตรวจสอบ…" : "เข้าสู่ระบบ"}</button></>}</div></main>;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function LegacySystemPanel({ onSelect }: { onSelect: (title: string) => void }) {
  return (
    <div className="system-panel">
      <div className="system-heading">
        <div><h2>ระบบจัดการร้านค้า</h2><span>จัดการการตั้งค่าและผู้ใช้งานของร้าน</span></div>
      </div>
      <div className="system-grid">
        {[["menu", "ออกแบบเมนู", "จัดหมวดหมู่และรายการอาหารหรือสินค้า"], ["table", "จัดการโต๊ะ", "ตั้งค่าโซนโต๊ะและสถานะการใช้งาน"], ["orders", "จัดการออร์เดอร์", "ติดตามและจัดการออร์เดอร์ของร้าน"], ["staff", "จัดการพนักงาน", "เพิ่มพนักงานและกำหนดสิทธิ์การใช้งาน"], ["branches", "จัดการสาขา", "เพิ่มและดูแลข้อมูลสาขาของร้าน"], ["users", "ลูกค้า", "จัดการข้อมูลลูกค้าและประวัติการซื้อ"], ["user", "ผู้ใช้งาน", "เพิ่มและจัดการบัญชีผู้ใช้งาน"], ["shield", "สิทธิ์การเข้าถึง", "กำหนดสิทธิ์สำหรับแต่ละบทบาท"], ["settings", "ตั้งค่าร้าน", "ข้อมูลร้าน ช่องทางชำระเงิน และใบเสร็จ"]].map(([icon, title, description]) => <button className="system-card" key={title} onClick={() => onSelect(title)}><div className="system-icon"><Icon name={icon} size={22} /></div><div><strong>{title}</strong><span>{description}</span></div><b>›</b></button>)}
      </div>
    </div>
  );
}
type MenuEntry = { id: number; name: string; price: number; category: string; active: boolean; productId?: number };
type CustomerEntry = { id: number; name: string; phone: string; active: boolean };
type TableEntry = { id: number; name: string; zone: string; status: "ว่าง" | "ไม่ว่าง" };
type StaffEntry = { id: number; name: string; role: string; phone: string; active: boolean };
type BranchEntry = { id: number; name: string; address: string; active: boolean };
function parseResourceDetails(details: string) { try { return JSON.parse(details) as Record<string, unknown>; } catch { return {}; } }
const hydrateMenu = (rows: ApiResource[]): MenuEntry[] => rows.map(row => { const details = parseResourceDetails(row.details); return { id: row.id, name: row.name, price: Number(details.price ?? 0), category: String(details.category ?? "ของกิน"), active: row.active, ...(Number.isFinite(Number(details.productId)) ? { productId: Number(details.productId) } : {}) }; });
const hydrateTables = (rows: ApiResource[]): TableEntry[] => rows.map(row => { const details = parseResourceDetails(row.details); return { id: row.id, name: row.name, zone: String(details.zone ?? "โซนหลัก"), status: row.status === "ไม่ว่าง" ? "ไม่ว่าง" : "ว่าง" }; });
const hydrateStaff = (rows: ApiResource[]): StaffEntry[] => rows.map(row => { const details = parseResourceDetails(row.details); return { id: row.id, name: row.name, role: String(details.role ?? "แคชเชียร์"), phone: String(details.phone ?? ""), active: row.active }; });
const hydrateBranches = (rows: ApiResource[]): BranchEntry[] => rows.map(row => { const details = parseResourceDetails(row.details); return { id: row.id, name: row.name, address: String(details.address ?? ""), active: row.active }; });
const hydrateCustomers = (rows: ApiResource[]): CustomerEntry[] => rows.map(row => { const details = parseResourceDetails(row.details); return { id: row.id, name: row.name, phone: String(details.phone ?? ""), active: row.active }; });
function useStoredList<T>(key: string, fallback: T[], remote?: string, hydrate?: (rows: ApiResource[]) => T[]) {
  const [items, setItems] = useState<T[]>(() => {
    if (typeof window === "undefined") return fallback;
    try { return JSON.parse(window.localStorage.getItem(key) ?? "[]"); } catch { return fallback; }
  });
  useEffect(() => { window.localStorage.setItem(key, JSON.stringify(items)); }, [items, key]);
  useEffect(() => { if (!remote) return; fetch(`/api/management/${remote}`).then(response => response.ok ? response.json() as Promise<ApiResource[]> : Promise.reject()).then(rows => setItems(hydrate ? hydrate(rows) : rows as T[])).catch(() => { /* local fallback */ }); }, [remote, hydrate]);
  return [items, setItems] as const;
}
function MenuDesigner() {
  const [items, setItems] = useStoredList<MenuEntry>("shoppos.menu", [], "menu", hydrateMenu);
  const [name, setName] = useState(""); const [price, setPrice] = useState(""); const [category, setCategory] = useState("ของกิน");
  const [productId, setProductId] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  useEffect(() => { fetch("/api/products").then(response => response.ok ? response.json() as Promise<Product[]> : Promise.reject()).then(setProducts).catch(() => undefined); }, []);
  const selectProduct = (id: string) => { setProductId(id); const product = products.find(item => String(item.id) === id); if (product) { setName(product.name); setPrice(String(product.price)); setCategory(product.category); } };
  const add = async () => { if (!name.trim() || !price) return; const details = { price: Number(price), category, ...(productId ? { productId: Number(productId) } : {}) }; const saved = await postResource("menu", { name, details: JSON.stringify(details) }); if (!saved) return; setItems(current => [{ id: saved.id, name: name.trim(), price: Number(price), category, active: true, ...(productId ? { productId: Number(productId) } : {}) }, ...current]); setName(""); setPrice(""); setProductId(""); };
  return <div className="domain-page"><DomainHeader title="ออกแบบเมนู" subtitle="สร้างรายการเมนูและเชื่อมกับสินค้าในคลังสำหรับหน้าขาย" /><div className="domain-form"><select value={productId} onChange={e => selectProduct(e.target.value)}><option value="">สร้างเมนูอิสระ</option>{products.map(product => <option value={product.id} key={product.id}>{product.name} · SKU {product.sku}</option>)}</select><input value={name} onChange={e => setName(e.target.value)} placeholder="ชื่อเมนู" /><input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="ราคา" /><select value={category} onChange={e => setCategory(e.target.value)}><option>ของกิน</option><option>ของฝาก</option><option>ของใช้</option></select><button className="add-product" disabled={!name.trim() || !price} onClick={add}><Icon name="plus" size={16} /> เพิ่มเมนู</button></div><div className="domain-list">{items.length === 0 ? <DomainEmpty icon="menu" text="ยังไม่มีเมนู" /> : items.map(item => <div className="domain-row" key={item.id}><div className="domain-avatar">☰</div><div><b>{item.name}</b><small>{item.category} · {money(item.price)}{item.productId ? " · เชื่อมกับสินค้าในคลัง" : " · เมนูอิสระ"}</small></div><button className={item.active ? "status good" : "status low"} onClick={() => { const active = !item.active; setItems(current => current.map(entry => entry.id === item.id ? { ...entry, active } : entry)); patchResource("menu", item.id, { active }); }}>{item.active ? "เปิดขาย" : "ปิดขาย"}</button><button className="table-delete" onClick={() => { setItems(current => current.filter(entry => entry.id !== item.id)); deleteResource("menu", item.id); }}>ลบ</button></div>)}</div></div>;
}
function TablesPanel() {
  const [items, setItems] = useStoredList<TableEntry>("shoppos.tables", [], "tables", hydrateTables);
  const [name, setName] = useState(""); const [zone, setZone] = useState("");
  const add = async () => { if (!name.trim()) return; const details = { zone: zone.trim() || "โซนหลัก" }; const saved = await postResource("tables", { name, details: JSON.stringify(details), status: "ว่าง" }); if (!saved) return; setItems(current => [{ id: saved.id, name: name.trim(), zone: details.zone, status: "ว่าง" }, ...current]); setName(""); setZone(""); };
  return <div className="domain-page"><DomainHeader title="จัดการโต๊ะ" subtitle="จัดโซนโต๊ะและติดตามสถานะโต๊ะแบบเรียลไทม์" /><div className="domain-form"><input value={name} onChange={e => setName(e.target.value)} placeholder="ชื่อโต๊ะ เช่น A01" /><input value={zone} onChange={e => setZone(e.target.value)} placeholder="โซน เช่น ชั้น 1" /><button className="add-product" disabled={!name.trim()} onClick={add}><Icon name="plus" size={16} /> เพิ่มโต๊ะ</button></div><div className="table-grid">{items.length === 0 ? <DomainEmpty icon="table" text="ยังไม่มีโต๊ะ" /> : items.map(item => <button className={"table-card " + (item.status === "ไม่ว่าง" ? "occupied" : "")} key={item.id} onClick={() => { const status = item.status === "ว่าง" ? "ไม่ว่าง" : "ว่าง"; setItems(current => current.map(entry => entry.id === item.id ? { ...entry, status } : entry)); patchResource("tables", item.id, { status }); }}><Icon name="table" size={28} /><strong>{item.name}</strong><small>{item.zone}</small><label>{item.status}</label></button>)}</div></div>;
}
function StaffPanel() {
  const [items, setItems] = useStoredList<StaffEntry>("shoppos.staff", [], "staff", hydrateStaff);
  const [name, setName] = useState(""); const [role, setRole] = useState("แคชเชียร์"); const [phone, setPhone] = useState("");
  const add = async () => { if (!name.trim()) return; const saved = await postResource("staff", { name, details: JSON.stringify({ role, phone }) }); if (!saved) return; setItems(current => [{ id: saved.id, name: name.trim(), role, phone, active: true }, ...current]); setName(""); setPhone(""); };
  return <div className="domain-page"><DomainHeader title="จัดการพนักงาน" subtitle="เพิ่มพนักงาน กำหนดบทบาท และดูสถานะการใช้งาน" /><div className="domain-form"><input value={name} onChange={e => setName(e.target.value)} placeholder="ชื่อพนักงาน" /><select value={role} onChange={e => setRole(e.target.value)}><option>แคชเชียร์</option><option>ผู้จัดการ</option><option>คลังสินค้า</option><option>พนักงานเสิร์ฟ</option></select><input value={phone} onChange={e => setPhone(e.target.value)} placeholder="เบอร์โทรศัพท์ (ถ้ามี)" /><button className="add-product" disabled={!name.trim()} onClick={add}><Icon name="plus" size={16} /> เพิ่มพนักงาน</button></div><div className="domain-list">{items.length === 0 ? <DomainEmpty icon="staff" text="ยังไม่มีพนักงาน" /> : items.map(item => <div className="domain-row" key={item.id}><div className="domain-avatar"><Icon name="user" size={17} /></div><div><b>{item.name}</b><small>{item.role}{item.phone ? " · " + item.phone : ""}</small></div><button className={item.active ? "status good" : "status low"} onClick={() => { const active = !item.active; setItems(current => current.map(entry => entry.id === item.id ? { ...entry, active } : entry)); patchResource("staff", item.id, { active }); }}>{item.active ? "ใช้งาน" : "ปิดใช้งาน"}</button><button className="table-delete" onClick={() => { setItems(current => current.filter(entry => entry.id !== item.id)); deleteResource("staff", item.id); }}>ลบ</button></div>)}</div></div>;
}
function BranchesPanel() {
  const [items, setItems] = useStoredList<BranchEntry>("shoppos.branches", [], "branches", hydrateBranches);
  const [name, setName] = useState(""); const [address, setAddress] = useState("");
  const add = async () => { if (!name.trim()) return; const saved = await postResource("branches", { name, details: JSON.stringify({ address }) }); if (!saved) return; setItems(current => [{ id: saved.id, name: name.trim(), address, active: true }, ...current]); setName(""); setAddress(""); };
  return <div className="domain-page"><DomainHeader title="จัดการสาขา" subtitle="ดูแลข้อมูลสาขาและสถานะการเปิดให้บริการ" /><div className="domain-form"><input value={name} onChange={e => setName(e.target.value)} placeholder="ชื่อสาขา" /><input value={address} onChange={e => setAddress(e.target.value)} placeholder="ที่อยู่สาขา (ถ้ามี)" /><button className="add-product" disabled={!name.trim()} onClick={add}><Icon name="plus" size={16} /> เพิ่มสาขา</button></div><div className="domain-list">{items.length === 0 ? <DomainEmpty icon="branches" text="ยังไม่มีสาขา" /> : items.map(item => <div className="domain-row" key={item.id}><div className="domain-avatar"><Icon name="branches" size={17} /></div><div><b>{item.name}</b><small>{item.address || "ยังไม่ได้ระบุที่อยู่"}</small></div><button className={item.active ? "status good" : "status low"} onClick={() => { const active = !item.active; setItems(current => current.map(entry => entry.id === item.id ? { ...entry, active } : entry)); patchResource("branches", item.id, { active }); }}>{item.active ? "เปิดให้บริการ" : "ปิดสาขา"}</button><button className="table-delete" onClick={() => { setItems(current => current.filter(entry => entry.id !== item.id)); deleteResource("branches", item.id); }}>ลบ</button></div>)}</div></div>;
}
function CustomersPanel() {
  const [items, setItems] = useStoredList<CustomerEntry>("shoppos.customers", [], "customers", hydrateCustomers);
  const [name, setName] = useState(""); const [phone, setPhone] = useState("");
  const add = async () => { if (!name.trim()) return; const saved = await postResource("customers", { name, details: JSON.stringify({ phone }) }); if (!saved) return; setItems(current => [{ id: saved.id, name: name.trim(), phone, active: true }, ...current]); setName(""); setPhone(""); };
  return <div className="domain-page"><DomainHeader title="ลูกค้า" subtitle="จัดเก็บข้อมูลลูกค้าเพื่อใช้กับรายการขายและการติดตามประวัติ" /><div className="domain-form"><input value={name} onChange={e => setName(e.target.value)} placeholder="ชื่อลูกค้า" /><input value={phone} onChange={e => setPhone(e.target.value)} placeholder="เบอร์โทรศัพท์ (ถ้ามี)" /><button className="add-product" disabled={!name.trim()} onClick={add}><Icon name="plus" size={16} /> เพิ่มลูกค้า</button></div><div className="domain-list">{items.length === 0 ? <DomainEmpty icon="users" text="ยังไม่มีข้อมูลลูกค้า" /> : items.map(item => <div className="domain-row" key={item.id}><div className="domain-avatar"><Icon name="user" size={17} /></div><div><b>{item.name}</b><small>{item.phone || "ยังไม่ได้ระบุเบอร์โทรศัพท์"}</small></div><button className="table-delete" onClick={() => { setItems(current => current.filter(entry => entry.id !== item.id)); deleteResource("customers", item.id); }}>ลบ</button></div>)}</div></div>;
}
function DomainEmpty({ icon, text }: { icon: string; text: string }) { return <div className="domain-empty"><Icon name={icon} size={30} /><strong>{text}</strong><span>เริ่มต้นด้วยการเพิ่มข้อมูลด้านบน</span></div>; }
function InventoryAdjustment({ products, mode, onUpdated }: { products: Product[]; mode: string; onUpdated: (products: Product[]) => void }) {
  const [productId, setProductId] = useState(products[0]?.id ? String(products[0].id) : "");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [movements, setMovements] = useState<Array<{ id: number; productName: string; delta: number; reason: string; source: string; createdAt: string; createdBy: string }>>([]);
  const refreshMovements = () => { fetch("/api/inventory/movements?limit=20").then(response => response.ok ? response.json() : Promise.reject()).then(setMovements).catch(() => { /* local fallback */ }); };
  useEffect(() => { refreshMovements(); }, []);
  const adjust = async () => {
    const amount = Number(quantity) * (mode === "ปรับสต็อก" ? -1 : 1);
    if (!productId || !amount || !reason.trim()) return;
    try {
      const response = await fetch("/api/inventory/adjust", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId: Number(productId), delta: amount, reason }) });
      const result = await response.json();
      if (!response.ok) { setMessage(result.error || "ไม่สามารถบันทึกได้"); return; }
      onUpdated(result.products); setQuantity(""); setReason(""); setMessage("บันทึกการเปลี่ยนแปลงแล้ว"); refreshMovements();
    } catch { setMessage("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้"); }
  };
  return <div className="adjustment-page"><div className="management-head"><div><button className="back-link" onClick={goBackInApp}>← กลับ</button><h2>{mode}</h2><span>{mode === "รับสินค้าเข้า" ? "เพิ่มจำนวนสินค้าเข้าสู่คลัง" : "ลดสต็อกเมื่อพบของเสีย ชำรุด หรือยอดไม่ตรง"}</span></div></div>{products.length === 0 ? <div className="management-empty"><div className="management-empty-icon"><Icon name="box" size={28} /></div><strong>ยังไม่มีสินค้า</strong><span>เพิ่มสินค้าก่อนจึงจะปรับสต็อกได้</span></div> : <div className="adjustment-card"><label>สินค้า<select value={productId} onChange={(e) => setProductId(e.target.value)}>{products.map(product => <option value={product.id} key={product.id}>{product.name} · คงเหลือ {product.stock} ชิ้น</option>)}</select></label><label>{mode === "รับสินค้าเข้า" ? "จำนวนที่รับเข้า" : "จำนวนที่ตัดออก"}<input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="ระบุจำนวน" /></label><label>เหตุผล<input value={reason} onChange={(e) => setReason(e.target.value)} placeholder={mode === "รับสินค้าเข้า" ? "เช่น รับสินค้าจากซัพพลายเออร์" : "เช่น สินค้าชำรุดหรือสูญหาย"} /></label><button className="pay-button" disabled={!productId || !quantity || !reason.trim()} onClick={adjust}>บันทึกการเปลี่ยนแปลง</button>{message && <p className="adjustment-message">{message}</p>}</div>}<div className="movement-history"><div className="section-head"><div><h2>ประวัติการเคลื่อนไหวสต็อก</h2><span>รายการล่าสุดจากการขาย รับเข้า และปรับสต็อก</span></div></div>{movements.length === 0 ? <div className="management-empty"><strong>ยังไม่มีประวัติ</strong></div> : <div className="report-table"><table><thead><tr><th>วันที่</th><th>สินค้า</th><th>เปลี่ยนแปลง</th><th>เหตุผล</th><th>โดย</th></tr></thead><tbody>{movements.map(movement => <tr key={movement.id}><td>{new Date(movement.createdAt).toLocaleString("th-TH")}</td><td><b>{movement.productName}</b></td><td><label className={movement.delta > 0 ? "status good" : "status low"}>{movement.delta > 0 ? "+" : ""}{movement.delta}</label></td><td>{movement.reason}</td><td>{movement.createdBy}</td></tr>)}</tbody></table></div>}</div></div>;
}
function Dashboard({ products, orders }: { products: Product[]; orders: Order[] }) {
  const low = products.filter((p) => p.stock <= 5).length;
  const paidOrders = orders.filter(order => order.status === "paid");
  const salesTotal = paidOrders.reduce((sum, order) => sum + order.total, 0);
  const today = new Date().toDateString();
  const todayTotal = paidOrders.filter((order) => new Date(order.createdAt).toDateString() === today).reduce((sum, order) => sum + order.total, 0);
  const chartData = Array.from({ length: 7 }, (_, index) => { const date = new Date(); date.setHours(0, 0, 0, 0); date.setDate(date.getDate() - (6 - index)); const key = date.toDateString(); return { label: date.toLocaleDateString("th-TH", { weekday: "short" }), total: paidOrders.filter(order => new Date(order.createdAt).toDateString() === key).reduce((sum, order) => sum + order.total, 0) }; });
  const chartMax = Math.max(...chartData.map(day => day.total), 1);
  return (
    <div className="dashboard">
      <div className="welcome-bar">
        <strong>ยินดีต้อนรับสู่ระบบจัดการร้านค้า</strong>
        <span>เริ่มเพิ่มข้อมูลสินค้าเพื่อดูภาพรวม</span>
      </div>
      <div className="dashboard-cards">
        <div className="dash-card cyan">
          <div className="dash-icon">
            <Icon name="bag" size={29} />
          </div>
          <div>
            <span>ยอดขายทั้งหมด</span>
            <strong>{money(salesTotal)}</strong>
            <small>{paidOrders.length ? `${paidOrders.length} รายการ` : "ยังไม่มีรายการขาย"}</small>
          </div>
        </div>
        <div className="dash-card amber">
          <div className="dash-icon">
            <Icon name="cash" size={29} />
          </div>
          <div>
            <span>ยอดรับชำระ</span>
            <strong>{money(salesTotal)}</strong>
            <small>ยอดรับชำระสะสม</small>
          </div>
        </div>
        <div className="dash-card green">
          <div className="dash-icon">
            <Icon name="receipt" size={29} />
          </div>
          <div>
            <span>รายการขาย</span>
            <strong>{paidOrders.length}</strong>
            <small>รายการทั้งหมด</small>
          </div>
        </div>
        <div className="dash-card red">
          <div className="dash-icon">
            <Icon name="wallet" size={29} />
          </div>
          <div>
            <span>ส่วนลดทั้งหมด</span>
            <strong>฿0.00</strong>
            <small>ส่วนลดทั้งหมด</small>
          </div>
        </div>
      </div>
      <div className="dashboard-cards second">
        <div className="dash-card cyan">
          <div className="dash-icon">
            <Icon name="bag" size={29} />
          </div>
          <div>
            <span>ยอดขายวันนี้</span>
            <strong>{money(todayTotal)}</strong>
            <small>วันนี้</small>
          </div>
        </div>
        <div className="dash-card amber">
          <div className="dash-icon">
            <Icon name="cash" size={29} />
          </div>
          <div>
            <span>ยอดรับวันนี้</span>
            <strong>{money(todayTotal)}</strong>
            <small>วันนี้</small>
          </div>
        </div>
        <div className="dash-card green">
          <div className="dash-icon">
            <Icon name="box" size={29} />
          </div>
          <div>
            <span>สินค้าในคลัง</span>
            <strong>{products.length}</strong>
            <small>รายการสินค้า</small>
          </div>
        </div>
        <div className="dash-card red">
          <div className="dash-icon">
            <Icon name="alert" size={29} />
          </div>
          <div>
            <span>สินค้าใกล้หมด</span>
            <strong>{low}</strong>
            <small>ต้องตรวจสอบ</small>
          </div>
        </div>
      </div>
      <div className="dashboard-lower">
        <div className="panel chart-panel">
          <div className="panel-title">
            <div>
              <h2>กราฟสรุปยอดขาย</h2>
              <small>ภาพรวมยอดขายของร้าน</small>
            </div>
            <span>ย้อนหลัง 7 วัน</span>
          </div>
          <div className="sales-chart">
            {chartData.map(day => <div className="sales-bar-group" key={day.label}><span className="sales-bar-value">{day.total ? money(day.total) : "–"}</span><div className="sales-bar-track"><i style={{ height: `${Math.max(day.total / chartMax * 100, day.total ? 8 : 2)}%` }} /></div><small>{day.label}</small></div>)}
          </div>
        </div>
        <div className="panel recent-panel">
          <div className="panel-title">
            <div>
              <h2>สินค้าใกล้หมดล่าสุด</h2>
              <small>รายการที่ควรตรวจสอบ</small>
            </div>
            <span>ดูทั้งหมด</span>
          </div>
          {products.filter((p) => p.stock <= 5).length === 0 ? (
            <div className="empty-recent">
              <Icon name="box" size={32} />
              <span>ยังไม่มีสินค้าที่ต้องเติมสต็อก</span>
            </div>
          ) : (
            products
              .filter((p) => p.stock <= 5)
              .map((p) => (
                <div className="recent-row" key={p.id}>
                  <span>{p.emoji}</span>
                  <b>{p.name}</b>
                  <em>{p.stock} ชิ้น</em>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
}
