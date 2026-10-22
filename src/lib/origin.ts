/** Alamat publik situs untuk redirect. Di balik proxy (Caddy), req.url berisi alamat internal (0.0.0.0:3000), jadi jangan dipakai mentah. */
export function appUrl(path: string, req: Request): URL {
  const site = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
  if (site && !/^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/.test(site)) return new URL(path, site);
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || "http";
  if (host && !host.startsWith("0.0.0.0")) return new URL(path, `${proto}://${host}`);
  return new URL(path, req.url);
}
