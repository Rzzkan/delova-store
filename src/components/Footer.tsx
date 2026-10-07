import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import { waNumber } from "@/lib/whatsapp";

const SHOPEE = [
  ["Delova Wardrobe", "https://shopee.co.id/delovawardrobe"],
  ["Delova Kids", "https://shopee.co.id/delovakids"],
  ["Delova Scarf", "https://shopee.co.id/delovascarf"],
];
const SOCIAL = [
  ["Instagram", "https://www.instagram.com/delovawardrobe"],
  ["TikTok", "https://www.tiktok.com/@delovawardrobe"],
  ["IG Kids", "https://www.instagram.com/delovakids"],
  ["IG Scarf", "https://www.instagram.com/delovawardrobescarf"],
];

export function Footer() {
  const wa = waNumber();
  return (
    <footer className="relative mt-24 overflow-hidden bg-maroon-dark text-cream">
      <div className="pattern-kawung-light absolute inset-0" aria-hidden />
      <div className="container-x relative grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-1">
          <p className="font-display text-3xl tracking-[.18em]">DELOVA</p>
          <p className="mt-3 text-sm leading-relaxed text-cream/70">Wastra Indonesia dalam siluet modern, untuk bunda, si kecil, dan seluruh keluarga.</p>
        </div>
        <div>
          <p className="eyebrow">Belanja</p>
          <ul className="mt-4 space-y-2 text-sm text-cream/80">
            {CATEGORIES.map((c) => (<li key={c.slug}><Link className="hover:text-gold-light" href={`/produk?kategori=${c.slug}`}>{c.label}</Link></li>))}
          </ul>
        </div>
        <div>
          <p className="eyebrow">Toko Resmi Shopee</p>
          <ul className="mt-4 space-y-2 text-sm text-cream/80">
            {SHOPEE.map(([l, u]) => (<li key={u}><a className="hover:text-gold-light" href={u} target="_blank" rel="noopener noreferrer">{l}</a></li>))}
          </ul>
        </div>
        <div>
          <p className="eyebrow">Ikuti & Hubungi</p>
          <ul className="mt-4 space-y-2 text-sm text-cream/80">
            {SOCIAL.map(([l, u]) => (<li key={u}><a className="hover:text-gold-light" href={u} target="_blank" rel="noopener noreferrer">{l}</a></li>))}
            {wa && <li><a className="hover:text-gold-light" href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer">WhatsApp Admin</a></li>}
          </ul>
        </div>
      </div>
      <div className="relative border-t border-cream/10 py-5 text-center text-xs text-cream/50">© {new Date().getFullYear()} Delova Wardrobe. Stok & harga disinkronkan dari Shopee.</div>
    </footer>
  );
}
