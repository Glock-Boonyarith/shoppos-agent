"use client";

import { useMemo, useState } from "react";
import { money } from "@/lib/formatters";
import type { Product } from "@/lib/domain";
import { deleteResource, patchResource, postResource, type ApiResource } from "@/lib/client-resources";

type InventoryPanelProps = { products: Product[]; categories: ApiResource[]; onAdd: () => void; onEdit: (product: Product) => void; onDelete: (id: number) => void; onProductsChanged: (products: Product[]) => void; onCategoriesChanged: (categories: ApiResource[]) => void };

export function InventoryPanel({ products, categories: categoryEntries, onAdd, onEdit, onDelete, onProductsChanged, onCategoriesChanged }: InventoryPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState("ทั้งหมด");
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ApiResource | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [pendingDeleteCategory, setPendingDeleteCategory] = useState<ApiResource | null>(null);
  const [categoryNotice, setCategoryNotice] = useState("");
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const categories = useMemo(() => Array.from(new Set(["ทั้งหมด", ...categoryEntries.filter(item => item.active).map(item => item.name), ...products.map(item => item.category)].filter(Boolean))), [categoryEntries, products]);
  const filteredProducts = useMemo(() => products.filter(product => {
    const matchesSearch = `${product.name} ${product.sku}`.toLowerCase().includes(search.toLowerCase());
    const matchesStock = stockFilter === "all" || (stockFilter === "low" && product.stock > 0 && product.stock <= 5) || (stockFilter === "out" && product.stock === 0) || (stockFilter === "normal" && product.stock > 5);
    return matchesSearch && matchesStock;
  }).sort((a, b) => sortBy === "stock" ? b.stock - a.stock : sortBy === "price" ? b.price - a.price : a.name.localeCompare(b.name, "th")), [products, search, stockFilter, sortBy]);
  const visibleCategories = selectedCategory === "ทั้งหมด" ? categories.filter(item => item !== "ทั้งหมด") : [selectedCategory];
  const productsByCategory = (name: string) => filteredProducts.filter(product => product.category === name);
  const openCategoryModal = (entry?: ApiResource) => { setEditingCategory(entry ?? null); setCategoryName(entry?.name ?? ""); setCategoryError(""); setShowCategoryModal(true); };
  const saveCategory = async () => {
    const name = categoryName.trim();
    if (!name) return;
    if (categories.some(item => item !== "ทั้งหมด" && item.toLowerCase() === name.toLowerCase() && item !== editingCategory?.name)) { setCategoryError("มีหมวดหมู่นี้อยู่แล้ว"); return; }
    if (editingCategory) {
      const response = await patchResource("categories", editingCategory.id, { name });
      if (!response.ok) { setCategoryError("ไม่สามารถแก้ไขหมวดหมู่ได้"); return; }
      onCategoriesChanged(categoryEntries.map(item => item.id === editingCategory.id ? { ...item, name } : item));
      onProductsChanged(products.map(product => product.category === editingCategory.name ? { ...product, category: name } : product));
      if (selectedCategory === editingCategory.name) setSelectedCategory(name);
    } else {
      const saved = await postResource("categories", { name });
      if (!saved) { setCategoryError("ไม่สามารถเพิ่มหมวดหมู่ได้"); return; }
      onCategoriesChanged([saved, ...categoryEntries]);
      setSelectedCategory(name);
    }
    setShowCategoryModal(false);
  };
  const removeCategory = async (entry: ApiResource) => {
    if (products.some(product => product.category === entry.name)) { setCategoryNotice("ลบไม่ได้ เพราะยังมีสินค้าใช้หมวดหมู่นี้อยู่ กรุณาย้ายหรือลบสินค้าก่อน"); return; }
    setPendingDeleteCategory(entry);
  };
  const confirmRemoveCategory = async () => {
    if (!pendingDeleteCategory) return;
    const entry = pendingDeleteCategory;
    const response = await deleteResource("categories", entry.id);
    if (!response.ok) { setPendingDeleteCategory(null); setCategoryNotice("ไม่สามารถลบหมวดหมู่ได้"); return; }
    onCategoriesChanged(categoryEntries.filter(item => item.id !== entry.id));
    if (selectedCategory === entry.name) setSelectedCategory("ทั้งหมด");
    setPendingDeleteCategory(null);
  };
  const exportCsv = () => {
    const header = ["สินค้า", "SKU", "หมวดหมู่", "ราคาขาย", "คงเหลือ", "สถานะ"];
    const rows = filteredProducts.map(product => [product.name, product.sku, product.category, product.price, product.stock, product.stock === 0 ? "หมด" : product.stock <= 5 ? "ใกล้หมด" : "ปกติ"]);
    const csv = [header, ...rows].map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" })); const link = document.createElement("a"); link.href = url; link.download = `คลังสินค้า-${new Date().toISOString().slice(0, 10)}.csv`; link.click(); URL.revokeObjectURL(url);
  };
  return <div className="inventory">
    <div className="inventory-toolbar"><label className="inventory-search"><span>⌕</span><input value={search} onChange={event => setSearch(event.target.value)} placeholder="ค้นหาชื่อสินค้า หรือ SKU" /></label><select value={stockFilter} onChange={event => setStockFilter(event.target.value)} aria-label="กรองสถานะสต็อก"><option value="all">สต็อกทั้งหมด</option><option value="normal">มีสินค้า</option><option value="low">ใกล้หมด</option><option value="out">สินค้าหมด</option></select><select value={sortBy} onChange={event => setSortBy(event.target.value)} aria-label="เรียงลำดับ"><option value="name">เรียงตามชื่อ</option><option value="stock">คงเหลือมากไปน้อย</option><option value="price">ราคาสูงไปต่ำ</option></select><button className="inventory-export" onClick={exportCsv}>⇩ ส่งออก CSV</button></div>
    <div className="inventory-stats"><div><span>พร้อมขาย</span><strong>{products.filter(product => product.stock > 5).length}</strong><small>สินค้าที่พร้อมขาย</small></div><div><span>มีส่วนลด</span><strong>0</strong><small>รายการโปรโมชั่น</small></div><div><span>ถังขยะ</span><strong>0</strong><small>รายการที่ถูกลบ</small></div><div><span>ใกล้หมด</span><strong>{products.filter(product => product.stock > 0 && product.stock <= 5).length}</strong><small>ต้องเติมสินค้า</small></div><div className="warning"><span>หมด</span><strong>{products.filter(product => product.stock === 0).length}</strong><small>สินค้าหมดสต็อก</small></div></div>
    <div className="inventory-head"><div><h2>จัดการคลังสินค้า</h2><span>เพิ่ม แก้ไข ลบ และจัดกลุ่มสินค้าในคลัง</span></div><div className="inventory-head-actions"><button className="category-manage-button" onClick={() => openCategoryModal()}>＋ เพิ่มหมวดหมู่</button><button className="add-product" onClick={onAdd}>＋ เพิ่มสินค้า</button></div></div>
    <div className="inventory-category-bar"><div className="inventory-category-label">หมวดหมู่สินค้า</div>{categories.map(category => { const entry = categoryEntries.find(item => item.active && item.name === category); return <div className={selectedCategory === category ? "inventory-category selected" : "inventory-category"} key={category}><button onClick={() => setSelectedCategory(category)}>{category}<small>{category === "ทั้งหมด" ? products.length : productsByCategory(category).length}</small></button>{entry && <span><button title="แก้ไขหมวดหมู่" onClick={() => openCategoryModal(entry)}>✎</button><button title="ลบหมวดหมู่" onClick={() => void removeCategory(entry)}>×</button></span>}</div>; })}</div>
    <div className="inventory-tables">{visibleCategories.length === 0 ? <div className="empty-table inventory-empty">ยังไม่มีหมวดหมู่สินค้า<br /><small>กด “เพิ่มหมวดหมู่” เพื่อเริ่มต้นใช้งาน</small></div> : visibleCategories.map(category => <section className="inventory-category-section" key={category}><div className="inventory-category-heading"><div><h3>{category}</h3><span>{productsByCategory(category).length} รายการ</span></div><button onClick={() => setSelectedCategory(category)}>ดูหมวดหมู่นี้ →</button></div><div className="table-wrap"><table><thead><tr><th>สินค้า</th><th>SKU</th><th>ราคาขาย</th><th>คงเหลือ</th><th>สถานะ</th><th>จัดการ</th></tr></thead><tbody>{productsByCategory(category).length === 0 ? <tr><td colSpan={6} className="empty-table">ยังไม่มีสินค้าในหมวดหมู่นี้</td></tr> : productsByCategory(category).map(product => <tr key={product.id}><td><div className="table-product"><span style={{ background: product.color }}>{product.image ? <img src={product.image} alt="" /> : product.emoji}</span><b>{product.name}</b></div></td><td>{product.sku}</td><td>{money(product.price)}</td><td><b>{product.stock}</b> ชิ้น</td><td><label className={product.stock <= 5 ? "status low" : "status good"}>{product.stock <= 5 ? "ใกล้หมด" : "ปกติ"}</label></td><td><div className="table-actions"><button className="table-action" onClick={() => onEdit(product)}>แก้ไข</button><button className="table-delete" onClick={() => onDelete(product.id)}>ลบ</button></div></td></tr>)}</tbody></table></div></section>)}</div>
    {showCategoryModal && <div className="modal-backdrop" onClick={() => setShowCategoryModal(false)}><div className="modal" onClick={event => event.stopPropagation()}><div className="modal-head"><div><h2>{editingCategory ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่"}</h2><span>จัดกลุ่มสินค้าให้ค้นหาและจัดการได้ง่าย</span></div><button onClick={() => setShowCategoryModal(false)}>×</button></div><label>ชื่อหมวดหมู่<input autoFocus value={categoryName} onChange={event => { setCategoryName(event.target.value); setCategoryError(""); }} onKeyDown={event => { if (event.key === "Enter") void saveCategory(); }} placeholder="เช่น เครื่องดื่ม" /></label>{categoryError && <p className="category-error">{categoryError}</p>}<div className="modal-actions"><button onClick={() => setShowCategoryModal(false)}>ยกเลิก</button><button className="save" disabled={!categoryName.trim()} onClick={() => void saveCategory()}>{editingCategory ? "บันทึกการแก้ไข" : "เพิ่มหมวดหมู่"}</button></div></div></div>}
    {pendingDeleteCategory && <div className="modal-backdrop" onClick={() => setPendingDeleteCategory(null)}><div className="modal confirm-modal" onClick={event => event.stopPropagation()}><div className="confirm-icon danger">!</div><div className="modal-head confirm-head"><div><h2 className="delete-category-title">ลบหมวดหมู่</h2><span>การดำเนินการนี้ไม่สามารถย้อนกลับได้</span></div></div><p className="confirm-message">คุณกำลังจะลบหมวดหมู่<br /><strong>“{pendingDeleteCategory.name}”</strong><br />ต้องการดำเนินการต่อใช่หรือไม่?</p><div className="modal-actions"><button onClick={() => setPendingDeleteCategory(null)}>ยกเลิก</button><button className="delete-confirm" onClick={() => void confirmRemoveCategory()}>ลบหมวดหมู่</button></div></div></div>}
    {categoryNotice && <div className="modal-backdrop" onClick={() => setCategoryNotice("")}><div className="modal confirm-modal" onClick={event => event.stopPropagation()}><div className="confirm-icon warning">!</div><div className="modal-head confirm-head"><div><h2>ไม่สามารถดำเนินการได้</h2><span>กรุณาตรวจสอบข้อมูลแล้วลองใหม่</span></div></div><p className="confirm-message">{categoryNotice}</p><div className="modal-actions"><button className="save" onClick={() => setCategoryNotice("")}>เข้าใจแล้ว</button></div></div></div>}
  </div>;
}

export function AddProductModal({ onClose, onSave, initialProduct, categories }: { onClose: () => void; onSave: (product: Product) => void; initialProduct: Product | null; categories: string[] }) {
  const [name, setName] = useState(initialProduct?.name ?? ""); const [price, setPrice] = useState(initialProduct ? String(initialProduct.price) : ""); const [stock, setStock] = useState(initialProduct ? String(initialProduct.stock) : ""); const [category, setCategory] = useState(initialProduct?.category ?? categories[0] ?? ""); const [image, setImage] = useState(initialProduct?.image ?? ""); const [imageError, setImageError] = useState("");
  const chooseImage = (file?: File) => { if (!file) return; if (!file.type.startsWith("image/")) { setImageError("กรุณาเลือกไฟล์รูปภาพเท่านั้น"); return; } if (file.size > 2 * 1024 * 1024) { setImageError("ขนาดรูปต้องไม่เกิน 2 MB"); return; } const reader = new FileReader(); reader.onload = () => { setImage(String(reader.result)); setImageError(""); }; reader.readAsDataURL(file); };
  return <div className="modal-backdrop"><div className="modal"><div className="modal-head"><div><h2>{initialProduct ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"}</h2><span>กรอกรายละเอียดสินค้าเพื่อเพิ่มเข้าคลัง</span></div><button onClick={onClose}>×</button></div><label>ชื่อสินค้า<input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="เช่น กาแฟคั่วกลาง" /></label><div className="form-row"><label>ราคาขาย<input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" /></label><label>จำนวนเริ่มต้น<input type="number" value={stock} onChange={e => setStock(e.target.value)} placeholder="0" /></label></div><label>หมวดหมู่<select value={category} onChange={e => setCategory(e.target.value)}>{categories.map(item => <option key={item}>{item}</option>)}</select></label><div className="product-image-field"><span>รูปสินค้า</span><div className="product-image-picker">{image ? <img src={image} alt="ตัวอย่างรูปสินค้า" /> : <span className="product-image-placeholder">📷</span>}<label className="image-upload-button">{image ? "เปลี่ยนรูป" : "เลือกรูปสินค้า"}<input type="file" accept="image/*" onChange={event => chooseImage(event.target.files?.[0])} /></label>{image && <button type="button" className="image-remove-button" onClick={() => setImage("")}>ลบรูป</button>}</div><small>รองรับ JPG, PNG, WEBP ขนาดไม่เกิน 2 MB</small>{imageError && <em className="image-error">{imageError}</em>}</div><div className="modal-actions"><button onClick={onClose}>ยกเลิก</button><button className="save" disabled={!name || !price || !category} onClick={() => onSave({ id: initialProduct?.id ?? 0, name, sku: initialProduct?.sku ?? `NEW-${Date.now().toString().slice(-3)}`, price: Number(price), stock: Number(stock) || 0, category, emoji: initialProduct?.emoji ?? "📦", color: initialProduct?.color ?? "#ddd4c7", ...(image ? { image } : {}) })}>{initialProduct ? "บันทึกการแก้ไข" : "บันทึกสินค้า"}</button></div></div></div>;
}
