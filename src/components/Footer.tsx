import Link from "next/link";
import type { ReactNode } from "react";
import { BRANDS, BRAND_SLUGS, type BrandSlug } from "@/lib/brands";
import { waNumber } from "@/lib/whatsapp";

const SOCIALS: Record<BrandSlug, [string, string][]> = {
  wardrobe: [["Instagram", "https://www.instagram.com/delovawardrobe"], ["TikTok", "https://www.tiktok.com/@delovawardrobe"]],
  kids: [["Instagram", "https://www.instagram.com/delovakids"], ["TikTok", "https://www.tiktok.com/@delovakids"]],
  scarf: [["Instagram", "https://www.instagram.com/delovawardrobescarf"], ["TikTok", "https://www.tiktok.com/@delovascarf"]],
  daily: [],
};

export function Footer({ brand, logo, shopeeUrls }: { brand: BrandSlug; logo: ReactNode; shopeeUrls: Record<BrandSlug, string> }) {
  const wa = waNumber();
  return (
    <footer className="relative mt-24 overflow-hidden bg-brand-dark text-cream">
      <div className="pattern-kawung-light absolute inset-0" aria-hidden />
      <div className="container-x relative grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-1">
          <div className="inline-block rounded-xl bg-cream px-4 py-3">{logo}</div>
          <p className="mt-3 text-sm leading-relaxed text-cream/70">Satu keluarga Delova: busana wastra modern untuk bunda, si kecil, dan hijab pelengkap gayamu.</p>
        </div>
        <div>
          <p className="eyebrow !text-accent">Belanja</p>
          <ul className="mt-4 space-y-2 text-sm text-cream/80">
            {BRANDS[brand].nav.map((n) => (<li key={n.href}><Link className="hover:text-accent-light" href={n.href}>{n.label}</Link></li>))}
          </ul>
        </div>
        <div>
          <p className="eyebrow !text-accent">Toko Resmi Shopee</p>
          <ul className="mt-4 space-y-2 text-sm text-cream/80">
            {BRAND_SLUGS.map((b) => (<li key={b}><a className="hover:text-accent-light" href={shopeeUrls[b]} target="_blank" rel="noopener noreferrer">{BRANDS[b].name}</a></li>))}
          </ul>
        </div>
        <div>
          <p className="eyebrow !text-accent">Ikuti & Hubungi</p>
          <ul className="mt-4 space-y-2 text-sm text-cream/80">
            {SOCIALS[brand].map(([l, u]) => (<li key={u}><a className="hover:text-accent-light" href={u} target="_blank" rel="noopener noreferrer">{l}</a></li>))}
            {wa && <li><a className="hover:text-accent-light" href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer">WhatsApp Admin</a></li>}
          </ul>
        </div>
      </div>
      <div className="relative border-t border-cream/10 py-5 text-center text-xs text-cream/50">© {new Date().getFullYear()} Delova Wardrobe. Stok & harga disinkronkan dari Shopee.</div>
    </footer>
  );
}
