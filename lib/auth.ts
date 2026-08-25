import { createHmac, timingSafeEqual } from "node:crypto";
import { hasPermission, type Permission, type UserRole } from "@/lib/permissions";
import { readStore, type StoredUser } from "@/lib/store";
import { verifyPassword } from "@/lib/passwords";

export { hasPermission } from "@/lib/permissions";
export type { Permission, UserRole } from "@/lib/permissions";

export const sessionCookie = "shoppos_session";
const sessionLifetimeSeconds = 60 * 60 * 12;

export function authRequired() {
  return process.env.SHOPPOS_AUTH_REQUIRED === "true" || process.env.NODE_ENV === "production";
}

function configuredRole(): UserRole {
  const role = process.env.SHOPPOS_ADMIN_ROLE;
  return role === "manager" || role === "cashier" || role === "warehouse" ? role : "owner";
}

export type AuthenticatedUser = Pick<StoredUser, "id" | "username" | "name" | "role">;
type SessionPayload = AuthenticatedUser & { exp: number };
function readToken(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = createHmac("sha256", secret()).update(payload).digest("base64url");
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SessionPayload;
    return parsed.exp > Math.floor(Date.now() / 1000) ? parsed : null;
  } catch { return null; }
}

function requestToken(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  return cookieHeader.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${sessionCookie}=`))?.split("=").slice(1).join("=");
}

function secret() {
  return process.env.SHOPPOS_SESSION_SECRET || "development-only-shoppos-secret";
}

export function authConfigured() {
  return Boolean(process.env.SHOPPOS_ADMIN_PASSWORD) && Boolean(process.env.SHOPPOS_SESSION_SECRET);
}

export function createSessionToken(user: AuthenticatedUser = { id: 0, username: "admin", name: "ผู้ดูแลร้าน", role: configuredRole() }) {
  const expiresAt = Math.floor(Date.now() / 1000) + sessionLifetimeSeconds;
  const payload = Buffer.from(JSON.stringify({ ...user, exp: expiresAt })).toString("base64url");
  const signature = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function validSessionToken(token: string | undefined) {
  return Boolean(readToken(token));
}

export function requestHasSession(request: Request) {
  return Boolean(readToken(requestToken(request)));
}

export function requestRole(request: Request): UserRole | null { return readToken(requestToken(request))?.role ?? null; }
export function requestUser(request: Request): AuthenticatedUser | null {
  const user = readToken(requestToken(request));
  return user ? { id: user.id, username: user.username, name: user.name, role: user.role } : null;
}

export async function authenticateUser(username: string, password: string): Promise<AuthenticatedUser | null> {
  const users = (await readStore()).users;
  const user = users.find((candidate) => candidate.username === username && candidate.active);
  if (user && verifyPassword(password, user.passwordHash)) return { id: user.id, username: user.username, name: user.name, role: user.role };
  if (username === (process.env.SHOPPOS_ADMIN_USERNAME || "admin") && password === process.env.SHOPPOS_ADMIN_PASSWORD) return { id: 0, username, name: "ผู้ดูแลร้าน", role: configuredRole() };
  return null;
}

export function unauthorizedIfRequired(request: Request) {
  if (authRequired() && (!authConfigured() || !requestHasSession(request))) return Response.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  return null;
}

export function requireAuthenticated(request: Request) {
  if (!authRequired()) return null;
  if (!authConfigured() || !requestHasSession(request)) return Response.json({ error: "กรุณาเข้าสู่ระบบก่อนจัดการข้อมูล" }, { status: 401 });
  return null;
}

export function requirePermission(request: Request, permission: Permission) {
  const blocked = requireAuthenticated(request);
  if (blocked) return blocked;
  const role = requestRole(request) || "owner";
  return role && hasPermission(role, permission) ? null : Response.json({ error: "ไม่มีสิทธิ์สำหรับการทำรายการนี้" }, { status: 403 });
}
