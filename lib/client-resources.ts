export type ApiResource = { id: number; name: string; details: string; active: boolean; status: string; createdAt: string };
function notifyResourcesChanged() { if (typeof window !== "undefined") window.dispatchEvent(new Event("shoppos:resources-changed")); }

export async function postResource(resource: string, body: Record<string, unknown>) {
  const response = await fetch(`/api/management/${resource}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!response.ok) return null;
  const result = await response.json() as ApiResource; notifyResourcesChanged(); return result;
}

export async function patchResource(resource: string, id: number, body: Record<string, unknown>) {
  const response = await fetch(`/api/management/${resource}?id=${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (response.ok) notifyResourcesChanged(); return response;
}

export async function deleteResource(resource: string, id: number) {
  const response = await fetch(`/api/management/${resource}?id=${id}`, { method: "DELETE" });
  if (response.ok) notifyResourcesChanged(); return response;
}
