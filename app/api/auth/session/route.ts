import { authConfigured, authRequired, requestHasSession, requestUser } from "@/lib/auth";

export async function GET(request: Request) {
  const required = authRequired();
  const user = requestUser(request);
  return Response.json({ required, configured: authConfigured(), authenticated: !required || requestHasSession(request), user: user?.name || "ผู้ดูแลร้าน", username: user?.username || "admin", role: user?.role || process.env.SHOPPOS_ADMIN_ROLE || "owner" });
}
