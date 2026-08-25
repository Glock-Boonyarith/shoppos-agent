import { authConfigured, authRequired, authenticateUser, createSessionToken, sessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  if (!authRequired()) return Response.json({ authenticated: true, required: false, user: "ผู้ดูแลร้าน", role: process.env.SHOPPOS_ADMIN_ROLE || "owner" });
  if (!authConfigured()) return Response.json({ error: "ยังไม่ได้ตั้งค่า SHOPPOS_ADMIN_PASSWORD และ SHOPPOS_SESSION_SECRET" }, { status: 503 });
  const body = (await request.json()) as { username?: string; password?: string };
  const user = body.username && body.password ? await authenticateUser(body.username.trim(), body.password) : null;
  if (!user) return Response.json({ error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
  const response = Response.json({ authenticated: true, required: true, user: user.name, username: user.username, role: user.role });
  response.headers.append("Set-Cookie", `${sessionCookie}=${createSessionToken(user)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=43200${process.env.NODE_ENV === "production" ? "; Secure" : ""}`);
  return response;
}
