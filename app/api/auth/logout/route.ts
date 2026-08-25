import { sessionCookie } from "@/lib/auth";

export async function POST() {
  const response = Response.json({ authenticated: false });
  response.headers.append("Set-Cookie", `${sessionCookie}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
  return response;
}
