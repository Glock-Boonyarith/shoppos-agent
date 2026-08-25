# ShopPOS

ระบบขายหน้าร้านและจัดการร้านค้าสำหรับร้านอาหาร/ร้านค้าหลายส่วน ประกอบด้วยหน้าขาย, สินค้าและคลัง, ออร์เดอร์, รายงาน และโมดูลจัดการร้านค้า

## เริ่มต้นใช้งาน

```bash
npm install
npm run dev
```

เปิด `http://localhost:3000`

## ฟีเจอร์ที่มีในโปรเจกต์

- หน้าขายหน้าร้านพร้อมตะกร้าและตรวจสอบจำนวนคงเหลือ
- สร้างออร์เดอร์และตัดสต็อกเมื่อชำระเงิน
- Backend ตรวจสอบจำนวน สินค้า และยอดรวมจากฐานข้อมูลก่อนบันทึกออร์เดอร์
- รองรับช่องทางชำระเงิน เงินสด, QR และบัตร พร้อมบันทึกในออร์เดอร์
- จัดการออร์เดอร์และยกเลิกออร์เดอร์พร้อมคืนสต็อก
- เพิ่ม แก้ไข ลบสินค้า และรับสินค้า/ปรับสต็อก
- ประวัติการเคลื่อนไหวสต็อกย้อนหลัง พร้อมผู้ทำรายการและเหตุผล
- Dashboard แสดงกราฟยอดขายย้อนหลัง 7 วัน
- รายงานกรองช่วงเวลาและส่งออก CSV
- Dashboard และรายงานไม่นับออร์เดอร์ที่ยกเลิกแล้ว
- ประวัติการขาย ใบเสร็จ และรายงานยอดขาย/สินค้าขายดี
- ออกแบบเมนูและเปิด/ปิดการขาย
- เชื่อมเมนูเข้ากับสินค้าในคลัง และกรองรายการหน้าขายตามเมนูที่เปิดใช้งาน
- จัดการโต๊ะและสถานะว่าง/ไม่ว่าง
- เลือกโต๊ะจากหน้าขายและเปลี่ยนสถานะโต๊ะตามออร์เดอร์
- เลือกลูกค้าในหน้าขายและบันทึกความสัมพันธ์กับออร์เดอร์
- จัดการข้อมูลลูกค้า
- จัดการพนักงาน สาขา และบัญชีผู้ใช้งานใน SQLite
- Login/Session พร้อมบัญชีผู้ใช้, password hash และ role-based permission

## Persistence

สินค้า ออร์เดอร์ ผู้ใช้งาน และประวัติสต็อกใช้ SQLite ผ่าน `node:sqlite` และสร้างไฟล์ `data/shoppos.sqlite` อัตโนมัติเมื่อมีการเรียก API ไฟล์ฐานข้อมูลถูก ignore ใน Git

ข้อมูลโต๊ะ เมนู พนักงาน สาขา การตั้งค่า ลูกค้า และผู้ใช้งานถูกเก็บใน SQLite ผ่าน API ส่วน localStorage ใช้เป็น cache ของหน้าจอจัดการเท่านั้น ไม่ถือเป็นแหล่งบันทึกออร์เดอร์หรือสินค้า

## เปิดใช้งาน Login

คัดลอก `.env.example` เป็น `.env.local` แล้วตั้งค่าอย่างน้อย:

```env
SHOPPOS_AUTH_REQUIRED=true
SHOPPOS_ADMIN_USERNAME=admin
SHOPPOS_ADMIN_PASSWORD=เปลี่ยนเป็นรหัสผ่านที่ปลอดภัย
SHOPPOS_SESSION_SECRET=สุ่มค่ายาวอย่างน้อย 32 ตัวอักษร
SHOPPOS_ADMIN_ROLE=owner
```

เมื่อเปิดใช้งานแล้ว API สินค้า ออร์เดอร์ ปรับสต็อก และโมดูลจัดการร้านค้าจะต้องมี session ก่อนใช้งาน โดย Production จะบังคับใช้ Login อัตโนมัติ

บทบาทที่รองรับคือ `owner`, `manager`, `cashier` และ `warehouse` โดย API จะตรวจ permission ตามบทบาทก่อนทำรายการ ผู้ดูแลเริ่มต้นใช้ค่าจาก `.env.local` และสามารถสร้างบัญชีผู้ใช้งานเพิ่มเติมจากเมนู “ผู้ใช้งาน” ได้

## ตรวจสอบโค้ด

```bash
npm run lint
npx next build --webpack
# ต้องเปิด npm run dev หรือ npm start ไว้ก่อน
# สำหรับ smoke test แบบเขียนข้อมูลชั่วคราว ให้ใช้ SHOPPOS_AUTH_REQUIRED=false ใน development
npm run test:api
```

## โครงสร้างสำคัญ

- `app/page.tsx` — client UI และ flow การขาย
- `app/api/` — Route Handlers สำหรับ auth, products, orders และ inventory
- `lib/store.ts` — SQLite persistence layer
- `lib/auth.ts` — session และ API protection
- `lib/navigation.ts` — โครงสร้าง Sidebar, dropdown และ permission ของเมนู
- `app/components/ReportsPanel.tsx` — รายงานยอดขาย สินค้าขายดี และ CSV export
- `app/components/OrderHistoryPanel.tsx` — ประวัติออร์เดอร์ การยกเลิก และใบเสร็จ
- `app/components/InventoryPanel.tsx` — ตารางคลังสินค้าและฟอร์มสินค้า
- `app/components/StoreSettings.tsx` — หน้าระบบจัดการร้านค้าและตั้งค่าร้าน
- `app/components/AccessPanels.tsx` — บัญชีผู้ใช้งานและตารางสิทธิ์ตามบทบาท
- `app/globals.css` — design system และ responsive layout
