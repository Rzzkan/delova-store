// Gambar placeholder untuk MODE DEMO. Tidak dipakai setelah produk Shopee tersinkron.
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function GET(req: Request) {
  const u = new URL(req.url);
  const t = esc((u.searchParams.get("t") || "Delova").slice(0, 60));
  const c = /^[0-9a-fA-F]{6}$/.test(u.searchParams.get("c") || "") ? u.searchParams.get("c")! : "6B2330";
  const v = Number(u.searchParams.get("v")) || 1;
  const words = t.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > 16) { lines.push(cur.trim()); cur = w; } else cur += " " + w;
  }
  if (cur.trim()) lines.push(cur.trim());
  const rot = (v - 1) * 18;
  const minimal = u.searchParams.get("m") === "1";
  if (minimal) {
    const shade = (v - 1) * 6;
    const svgm = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000"><rect width="800" height="1000" fill="#${c}"/><rect width="800" height="1000" fill="#fff" opacity="${0.04 * shade}"/>
<text x="400" y="${470 - lines.length * 26}" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-weight="700" font-size="50" fill="#181818" fill-opacity=".85">${lines.map((l, i) => `<tspan x="400" dy="${i ? 62 : 0}">${l}</tspan>`).join("")}</text>
<text x="400" y="920" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="22" letter-spacing="8" fill="#181818" fill-opacity=".5">DELOVA DAILY · ${v}</text></svg>`;
    return new Response(svgm, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=86400" } });
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000">
<defs>
<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#${c}"/><stop offset="1" stop-color="#${c}" stop-opacity=".62"/></linearGradient>
<pattern id="k" width="80" height="80" patternUnits="userSpaceOnUse" patternTransform="rotate(${rot})">
<g fill="none" stroke="#FAF4EA" stroke-opacity=".22" stroke-width="1.5"><ellipse cx="40" cy="20" rx="10" ry="20"/><ellipse cx="40" cy="60" rx="10" ry="20"/><ellipse cx="20" cy="40" rx="20" ry="10"/><ellipse cx="60" cy="40" rx="20" ry="10"/></g>
</pattern></defs>
<rect width="800" height="1000" fill="url(#g)"/><rect width="800" height="1000" fill="url(#k)"/>
<rect x="40" y="40" width="720" height="920" rx="8" fill="none" stroke="#D9B876" stroke-opacity=".6" stroke-width="2"/>
<text x="400" y="${470 - lines.length * 26}" text-anchor="middle" font-family="Georgia,serif" font-size="56" fill="#FAF4EA">${lines.map((l, i) => `<tspan x="400" dy="${i ? 66 : 0}">${l}</tspan>`).join("")}</text>
<text x="400" y="900" text-anchor="middle" font-family="Georgia,serif" font-size="26" letter-spacing="10" fill="#D9B876">DELOVA · FOTO ${v}</text>
</svg>`;
  return new Response(svg, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=86400" } });
}
