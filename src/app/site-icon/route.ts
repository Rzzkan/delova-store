/** Ikon bawaan (dipakai bila favicon belum diunggah dari /admin/seo). */
const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#6B2330"/><text x="32" y="45" text-anchor="middle" font-family="Georgia,serif" font-size="38" fill="#D9B876">D</text></svg>`;
export function GET() {
  return new Response(SVG, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=3600" } });
}
