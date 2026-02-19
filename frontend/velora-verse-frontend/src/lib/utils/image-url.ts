const FRAPPE_URL = process.env.NEXT_PUBLIC_FRAPPE_URL || "http://localhost:8002";

export function resolveImageUrl(path: string | null | undefined): string {
  if (!path) return "/placeholder.svg";
  if (path.startsWith("http")) return path;
  return `${FRAPPE_URL}${path}`;
}
