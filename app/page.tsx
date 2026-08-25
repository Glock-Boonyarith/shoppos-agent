"use client";

import { useMemo, useState } from "react";

type Product = {
  id: number;
  name: string;
  sku: string;
  price: number;
  stock: number;
  category: string;
  emoji: string;
  color: string;
};
type CartItem = Product & { qty: number };
const seedProducts: Product[] = [];
const money = (n: number) =>
  `฿${n.toLocaleString("th-TH", { minimumFractionDigits: 2 })}`;
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
  const [products, setProducts] = useState(seedProducts);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [category, setCategory] = useState("ทั้งหมด");
  const [query, setQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [paid, setPaid] = useState(false);
  const categories = [
    "ทั้งหมด",
    "ของกิน",
    "ของฝาก",
    "ของใช้",
  ];
  const dropdowns: Record<string, string[]> = {
    "ขายหน้าร้าน": ["รายการขาย", "ใบเสร็จการขาย"],
    "คลังสินค้า": ["สินค้าทั้งหมด", "รับสินค้าเข้า", "ปรับสต็อก"],
    รายงาน: ["สรุปยอดขาย", "สินค้าขายดี"],
    "ระบบจัดการร้านค้า": ["ออกแบบเมนู", "จัดการโต๊ะ", "จัดการออร์เดอร์", "จัดการพนักงาน", "จัดการสาขา", "ลูกค้า", "ผู้ใช้งาน", "สิทธิ์การเข้าถึง", "ตั้งค่าร้าน"],
  };
  const [openMenu, setOpenMenu] = useState("ขายหน้าร้าน");
  const [subPage, setSubPage] = useState("");
  const filtered = useMemo(
    () =>
      products.filter(
        (p) =>
          (category === "ทั้งหมด" || p.category === category) &&
          p.name.toLowerCase().includes(query.toLowerCase()),
      ),
    [products, category, query],
  );
  const total = cart.reduce((s, p) => s + p.price * p.qty, 0);
  const addToCart = (p: Product) =>
    setCart((c) =>
      c.some((i) => i.id === p.id)
        ? c.map((i) =>
            i.id === p.id ? { ...i, qty: Math.min(i.qty + 1, p.stock) } : i,
          )
        : [...c, { ...p, qty: 1 }],
    );
  const changeQty = (id: number, delta: number) =>
    setCart((c) =>
      c
        .map((i) => (i.id === id ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0),
    );
  return (
    <main className={`app-shell ${active === "ขายหน้าร้าน" ? "sales-mode" : ""}`}>
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
            <small>สาขาหลัก</small>
          </div>
          <span>⌄</span>
        </div>
        <p className="nav-label">เมนูหลัก</p>
        <nav>
          {[
            ["ภาพรวม", "dashboard"],
            ["ขายหน้าร้าน", "cart"],
            ["คลังสินค้า", "box"],
            ["รายงาน", "chart"],
            ["ระบบจัดการร้านค้า", "settings"],
          ].map(([label, icon]) => (
            <div className="nav-group" key={label}>
              <button
                className={active === label ? "nav-item active" : "nav-item"}
                onClick={() => {
                  setActive(label);
                  setSubPage("");
                  if (dropdowns[label]) setOpenMenu(openMenu === label ? "" : label);
                }}
              >
                <Icon name={icon} />
                {label}
                {label === "คลังสินค้า" &&
                  products.filter((p) => p.stock <= 5).length > 0 && (
                    <em>{products.filter((p) => p.stock <= 5).length}</em>
                  )}
                {dropdowns[label] && <span className="nav-chevron">{openMenu === label ? "⌃" : "⌄"}</span>}
              </button>
              {dropdowns[label] && openMenu === label && (
                <div className="subnav">
                  {dropdowns[label].map((child) => (
                    <button key={child} onClick={() => { setActive(label); setSubPage(child); }}>{child}</button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className="nav-item" onClick={() => { setActive("ระบบจัดการร้านค้า"); setSubPage("ตั้งค่าร้าน"); }}>
            <Icon name="settings" />
            ตั้งค่า
          </button>
          <div className="user-card">
            <div className="user-avatar">?</div>
            <div>
              <strong>ผู้ดูแลร้าน</strong>
              <small>บัญชีผู้ใช้งาน</small>
            </div>
            <span>•••</span>
          </div>
        </div>
      </aside>
      <section className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">วันนี้</p>
            <h1>{active}</h1>
          </div>
          <div className="top-actions">
            <button className="icon-button">
              <Icon name="bell" />
            </button>
            <div className="top-user">
              <div className="user-avatar">?</div>
              <span>ผู้ดูแลร้าน</span>
              <b>⌄</b>
            </div>
          </div>
        </header>
        {subPage === "ตั้งค่าร้าน" ? (
          <SettingsPanel onBack={() => setSubPage("")} />
        ) : subPage ? (
          <ManagementPanel title={subPage} onBack={() => setSubPage("")} />
        ) : active === "ขายหน้าร้าน" ? (
          <>
            <div className="pos-layout">
              <div className="catalog">
                <div className="search-row">
                  <div className="search">
                    <Icon name="search" size={18} />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="ค้นหาชื่อสินค้าหรือ SKU..."
                    />
                    <kbd>⌘ K</kbd>
                  </div>
                  <button className="scan-btn">⌁ &nbsp; สแกนบาร์โค้ด</button>
                </div>
                <div className="category-row">
                  {categories.map((c) => (
                    <button
                      className={
                        category === c ? "category active" : "category"
                      }
                      onClick={() => setCategory(c)}
                      key={c}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <div className="section-head">
                  <div>
                    <h2>สินค้าทั้งหมด</h2>
                    <span>{filtered.length} รายการ</span>
                  </div>
                  <button
                    className="add-product"
                    onClick={() => setShowAdd(true)}
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
                          <span>{p.emoji}</span>
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
                            <button onClick={() => changeQty(item.id, 1)}>
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
                    onClick={() => {
                      setPaid(true);
                      setCart([]);
                    }}
                  >
                    ชำระเงิน <span>{money(total)}　→</span>
                  </button>
                  <div className="payment-note">
                    รับชำระด้วย เงินสด · QR พร้อมเพย์ · บัตร
                  </div>
                </div>
              </aside>
            </div>
          </>
        ) : active === "ภาพรวม" ? (
          <Dashboard products={products} />
        ) : active === "ระบบจัดการร้านค้า" ? (
          <SystemPanel onSelect={setSubPage} />
        ) : (
          <Inventory products={products} onAdd={() => setShowAdd(true)} />
        )}
        {paid && (
          <div className="toast" onClick={() => setPaid(false)}>
            ✓ ชำระเงินสำเร็จ — เปิดบิลใหม่ได้เลย
          </div>
        )}
        {showAdd && (
          <AddModal
            onClose={() => setShowAdd(false)}
            onSave={(p) => {
              setProducts((x) => [{ ...p, id: Date.now() }, ...x]);
              setShowAdd(false);
            }}
          />
        )}
      </section>
    </main>
  );
}
function SettingsPanel({ onBack }: { onBack: () => void }) {
  const [saved, setSaved] = useState(false);
  const [tax, setTax] = useState("ไม่รวมภาษี");
  const [receipt, setReceipt] = useState(true);
  const [sound, setSound] = useState(true);
  return <div className="settings-panel"><div className="settings-head"><div><button className="back-link" onClick={onBack}>← กลับไประบบจัดการร้านค้า</button><h2>ตั้งค่าระบบ</h2><span>กำหนดค่าการทำงานของร้านค้าและหน้าขายหน้าร้าน</span></div><button className="save-settings" onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2200); }}>{saved ? "บันทึกแล้ว ✓" : "บันทึกการตั้งค่า"}</button></div><div className="settings-sections"><section className="settings-section"><div className="settings-section-title"><Icon name="settings" size={19} /><div><strong>ตั้งค่าร้านค้า</strong><span>ข้อมูลพื้นฐานที่ใช้แสดงในระบบ</span></div></div><label>ชื่อร้าน<input placeholder="กรอกชื่อร้านค้า" /></label><label>สาขาหลัก<input placeholder="กรอกชื่อสาขา" /></label></section><section className="settings-section"><div className="settings-section-title"><Icon name="receipt" size={19} /><div><strong>การขายและใบเสร็จ</strong><span>ตั้งค่ารูปแบบการคิดเงิน</span></div></div><label>รูปแบบภาษี<select value={tax} onChange={e => setTax(e.target.value)}><option>ไม่รวมภาษี</option><option>รวมภาษีแล้ว</option></select></label><Toggle label="ออกใบเสร็จอัตโนมัติ" value={receipt} onChange={() => setReceipt(!receipt)} /><Toggle label="เสียงแจ้งเตือนเมื่อชำระเงิน" value={sound} onChange={() => setSound(!sound)} /></section></div></div>;
}
function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: () => void }) { return <button className="toggle-row" onClick={onChange}><span>{label}</span><i className={value ? "toggle on" : "toggle"}><b /></i></button>; }
function ManagementPanel({ title, onBack }: { title: string; onBack: () => void }) {
  const [items, setItems] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const labels: Record<string, string> = {
    "ออกแบบเมนู": "ชื่อเมนูหรือรายการสินค้า", "จัดการโต๊ะ": "ชื่อโต๊ะหรือโซน", "จัดการออร์เดอร์": "เลขที่ออร์เดอร์", "จัดการพนักงาน": "ชื่อพนักงาน", "จัดการสาขา": "ชื่อสาขา", ลูกค้า: "ชื่อลูกค้า", ผู้ใช้งาน: "ชื่อผู้ใช้งาน", "สิทธิ์การเข้าถึง": "ชื่อบทบาท", "ตั้งค่าร้าน": "หัวข้อการตั้งค่า", "รายการขาย": "เลขที่รายการขาย", "ใบเสร็จการขาย": "เลขที่ใบเสร็จ", "สินค้าทั้งหมด": "ชื่อสินค้า", "รับสินค้าเข้า": "เลขที่เอกสารรับเข้า", "ปรับสต็อก": "รายการปรับสต็อก", "สรุปยอดขาย": "ช่วงเวลารายงาน", "สินค้าขายดี": "ชื่อสินค้า",
  };
  const label = labels[title] ?? "ชื่อรายการ";
  return <div className="management-panel"><div className="management-head"><div><button className="back-link" onClick={onBack}>← กลับไประบบจัดการร้านค้า</button><h2>{title}</h2><span>เพิ่มและจัดการข้อมูลในส่วนนี้ได้จากหน้านี้</span></div><div className="management-count">{items.length}<small>รายการ</small></div></div><div className="management-form"><input value={draft} onChange={e => setDraft(e.target.value)} placeholder={label} onKeyDown={e => { if (e.key === "Enter" && draft.trim()) { setItems(x => [...x, draft.trim()]); setDraft(""); } }} /><button className="add-product" disabled={!draft.trim()} onClick={() => { setItems(x => [...x, draft.trim()]); setDraft(""); }}><Icon name="plus" size={16} /> เพิ่มรายการ</button></div>{items.length === 0 ? <div className="management-empty"><div className="management-empty-icon"><Icon name="box" size={28} /></div><strong>ยังไม่มีข้อมูล{title}</strong><span>เริ่มต้นด้วยการเพิ่มรายการใหม่ด้านบน</span></div> : <div className="management-list">{items.map((item, index) => <div className="management-row" key={item + index}><span>{index + 1}</span><b>{item}</b><button onClick={() => setItems(x => x.filter((_, i) => i !== index))}>ลบ</button></div>)}</div>}</div>;
}
function SystemPanel({ onSelect }: { onSelect: (title: string) => void }) {
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
function Dashboard({ products }: { products: Product[] }) {
  const low = products.filter((p) => p.stock <= 5).length;
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
            <strong>฿0.00</strong>
            <small>ยังไม่มีรายการขาย</small>
          </div>
        </div>
        <div className="dash-card amber">
          <div className="dash-icon">
            <Icon name="cash" size={29} />
          </div>
          <div>
            <span>ยอดรับชำระ</span>
            <strong>฿0.00</strong>
            <small>ยังไม่มีข้อมูล</small>
          </div>
        </div>
        <div className="dash-card green">
          <div className="dash-icon">
            <Icon name="receipt" size={29} />
          </div>
          <div>
            <span>รายการขาย</span>
            <strong>0</strong>
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
            <small>ยังไม่มีส่วนลด</small>
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
            <strong>฿0.00</strong>
            <small>วันนี้</small>
          </div>
        </div>
        <div className="dash-card amber">
          <div className="dash-icon">
            <Icon name="cash" size={29} />
          </div>
          <div>
            <span>ยอดรับวันนี้</span>
            <strong>฿0.00</strong>
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
            <span>ยังไม่มีข้อมูล</span>
          </div>
          <div className="empty-chart">
            <div className="chart-lines">
              <i />
              <i />
              <i />
              <i />
            </div>
            <div className="chart-message">ข้อมูลจะแสดงเมื่อมีการขายสินค้า</div>
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
function Inventory({
  products,
  onAdd,
}: {
  products: Product[];
  onAdd: () => void;
}) {
  return (
    <div className="inventory">
      <div className="inventory-stats">
        <div>
          <span>สินค้าทั้งหมด</span>
          <strong>{products.length}</strong>
          <small>จำนวนสินค้าที่เพิ่มไว้</small>
        </div>
        <div>
          <span>มูลค่าสต็อก</span>
          <strong>
            {money(products.reduce((a, p) => a + p.price * p.stock, 0))}
          </strong>
          <small>คำนวณจากราคาขาย</small>
        </div>
        <div className="warning">
          <span>ต้องเติมสต็อก</span>
          <strong>{products.filter((p) => p.stock <= 5).length}</strong>
          <small>รายการที่เหลือน้อย</small>
        </div>
      </div>
      <div className="inventory-head">
        <div>
          <h2>รายการสินค้าในคลัง</h2>
          <span>รายการสินค้าที่เพิ่มเข้าระบบ</span>
        </div>
        <button className="add-product" onClick={onAdd}>
          <Icon name="plus" size={17} /> เพิ่มสินค้า
        </button>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>สินค้า</th>
              <th>SKU</th>
              <th>หมวดหมู่</th>
              <th>ราคาขาย</th>
              <th>คงเหลือ</th>
              <th>สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-table">
                  ยังไม่มีสินค้าในคลัง
                  <br />
                  <small>กด “เพิ่มสินค้า” เพื่อเริ่มต้นใช้งาน</small>
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="table-product">
                      <span style={{ background: p.color }}>{p.emoji}</span>
                      <b>{p.name}</b>
                    </div>
                  </td>
                  <td>{p.sku}</td>
                  <td>{p.category}</td>
                  <td>{money(p.price)}</td>
                  <td>
                    <b>{p.stock}</b> ชิ้น
                  </td>
                  <td>
                    <label
                      className={p.stock <= 5 ? "status low" : "status good"}
                    >
                      {p.stock <= 5 ? "ใกล้หมด" : "ปกติ"}
                    </label>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
function AddModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (p: Product) => void;
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-head">
          <div>
            <h2>เพิ่มสินค้าใหม่</h2>
            <span>กรอกรายละเอียดสินค้าเพื่อเพิ่มเข้าคลัง</span>
          </div>
          <button onClick={onClose}>×</button>
        </div>
        <label>
          ชื่อสินค้า
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="เช่น กาแฟคั่วกลาง"
          />
        </label>
        <div className="form-row">
          <label>
            ราคาขาย
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
            />
          </label>
          <label>
            จำนวนเริ่มต้น
            <input
              type="number"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="0"
            />
          </label>
        </div>
        <label>
          หมวดหมู่
          <select>
            <option>กาแฟ</option>
            <option>ชา</option>
            <option>เบเกอรี่</option>
            <option>เครื่องดื่ม</option>
          </select>
        </label>
        <div className="modal-actions">
          <button onClick={onClose}>ยกเลิก</button>
          <button
            className="save"
            disabled={!name || !price}
            onClick={() =>
              onSave({
                id: 0,
                name,
                sku: `NEW-${Date.now().toString().slice(-3)}`,
                price: Number(price),
                stock: Number(stock) || 0,
                category: "กาแฟ",
                emoji: "📦",
                color: "#ddd4c7",
              })
            }
          >
            บันทึกสินค้า
          </button>
        </div>
      </div>
    </div>
  );
}
