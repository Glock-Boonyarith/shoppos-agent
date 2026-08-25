import { requirePermission, requestUser } from "@/lib/auth";
import { hashPassword } from "@/lib/passwords";
import { readStore, updateStore, type StoredUser } from "@/lib/store";

export const dynamic = "force-dynamic";
const roles: StoredUser["role"][] = ["owner", "manager", "cashier", "warehouse"];
function safeUser(user: StoredUser) { return { id: user.id, username: user.username, name: user.name, role: user.role, active: user.active, createdAt: user.createdAt }; }

export async function GET(request: Request) {
  const blocked = requirePermission(request, "manage_staff"); if (blocked) return blocked;
  return Response.json((await readStore()).users.map(safeUser));
}

export async function POST(request: Request) {
  const blocked = requirePermission(request, "manage_staff"); if (blocked) return blocked;
  const body = (await request.json()) as { username?: string; name?: string; password?: string; role?: StoredUser["role"] };
  if (!body.username?.trim() || !body.name?.trim() || !body.password || body.password.length < 6 || !roles.includes(body.role ?? "cashier")) return Response.json({ error: "กรุณากรอกชื่อผู้ใช้ ชื่อ พาสเวิร์ดอย่างน้อย 6 ตัว และบทบาทให้ถูกต้อง" }, { status: 400 });
  if (body.role === "owner" && requestUser(request)?.role !== "owner") return Response.json({ error: "เฉพาะเจ้าของร้านเท่านั้นที่สร้างบัญชี owner ได้" }, { status: 403 });
  const user: StoredUser = { id: Date.now(), username: body.username.trim().toLowerCase(), name: body.name.trim(), role: body.role!, passwordHash: hashPassword(body.password), active: true, createdAt: new Date().toISOString() };
  try {
    await updateStore((current) => { if (current.users.some((candidate) => candidate.username === user.username)) throw new Error("DUPLICATE_USERNAME"); return { ...current, users: [user, ...current.users] }; });
  } catch (error) { if (error instanceof Error && error.message === "DUPLICATE_USERNAME") return Response.json({ error: "ชื่อผู้ใช้นี้มีอยู่แล้ว" }, { status: 409 }); throw error; }
  return Response.json(safeUser(user), { status: 201 });
}

export async function PATCH(request: Request) {
  const blocked = requirePermission(request, "manage_staff"); if (blocked) return blocked;
  const id = Number(new URL(request.url).searchParams.get("id")); const body = (await request.json()) as Partial<StoredUser> & { password?: string };
  if (!Number.isFinite(id)) return Response.json({ error: "รหัสผู้ใช้งานไม่ถูกต้อง" }, { status: 400 });
  const actor = requestUser(request);
  if (body.active === false && actor?.role !== "owner") {
    const target = (await readStore()).users.find(user => user.id === id);
    if (target?.role === "owner") return Response.json({ error: "เฉพาะเจ้าของร้านเท่านั้นที่ปิดใช้งานบัญชี owner ได้" }, { status: 403 });
  }
  if (body.role === "owner" && requestUser(request)?.role !== "owner") return Response.json({ error: "เฉพาะเจ้าของร้านเท่านั้นที่กำหนดบทบาท owner ได้" }, { status: 403 });
  let updated: StoredUser | undefined;
  await updateStore((current) => ({ ...current, users: current.users.map((user) => { if (user.id !== id) return user; updated = { ...user, name: body.name?.trim() || user.name, role: roles.includes(body.role as StoredUser["role"]) ? body.role! : user.role, active: body.active ?? user.active, passwordHash: body.password && body.password.length >= 6 ? hashPassword(body.password) : user.passwordHash }; return updated; }) }));
  return updated ? Response.json(safeUser(updated)) : Response.json({ error: "ไม่พบผู้ใช้งาน" }, { status: 404 });
}

export async function DELETE(request: Request) {
  const blocked = requirePermission(request, "manage_staff"); if (blocked) return blocked;
  const id = Number(new URL(request.url).searchParams.get("id")); if (!Number.isFinite(id)) return Response.json({ error: "รหัสผู้ใช้งานไม่ถูกต้อง" }, { status: 400 });
  if (requestUser(request)?.role !== "owner" && (await readStore()).users.some(user => user.id === id && user.role === "owner")) return Response.json({ error: "เฉพาะเจ้าของร้านเท่านั้นที่ลบบัญชี owner ได้" }, { status: 403 });
  await updateStore((current) => ({ ...current, users: current.users.filter((user) => user.id !== id) }));
  return Response.json({ ok: true });
}
