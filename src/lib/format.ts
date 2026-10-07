export const idr = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

export const discountPct = (price: number, original?: number | null) =>
  original && original > price ? Math.round(((original - price) / original) * 100) : 0;

/** Shopee CDN mendukung suffix _tn untuk thumbnail kecil. */
export function thumb(url: string): string {
  if (url.includes("susercontent.com") && !url.endsWith("_tn")) return `${url}_tn`;
  return url;
}

export const compact = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(".0", "")}rb` : String(n);

export function timeAgo(sec?: number | null): string {
  if (!sec) return "belum pernah";
  const d = Math.max(0, Math.floor(Date.now() / 1000) - sec);
  if (d < 90) return "baru saja";
  if (d < 3600) return `${Math.floor(d / 60)} menit lalu`;
  if (d < 86400) return `${Math.floor(d / 3600)} jam lalu`;
  return `${Math.floor(d / 86400)} hari lalu`;
}
