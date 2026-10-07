import Link from "next/link";
import { BRANDS, BRAND_SLUGS, type BrandSlug } from "@/lib/brands";
import { BRAND_SEO, ldScript, organizationLd, websiteLd, breadcrumbLd } from "@/lib/seo";

/** Teks pengantar brand (dibaca Google) + structured data. Ditaruh di bawah konten halaman brand. */
export function SeoBlock({ brand, home }: { brand: BrandSlug; home?: boolean }) {
  const s = BRAND_SEO[brand];
  const path = brand === "wardrobe" ? "/" : `/${brand}`;
  const ld: unknown[] = [breadcrumbLd([{ name: "Beranda", url: "/" }, ...(brand === "wardrobe" ? [] : [{ name: BRANDS[brand].name, url: path }])])];
  if (home) ld.push(organizationLd(), websiteLd());
  return (
    <section className="container-x py-12 border-t border-ink/10">
      {ld.map((d, i) => (<script key={i} type="application/ld+json" dangerouslySetInnerHTML={ldScript(d)} />))}
      <h2 className="text-xl font-semibold">{s.h1} — Toko Resmi</h2>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink/70">{s.copy}</p>
      <p className="mt-4 text-sm text-ink/60">
        Lihat juga:{" "}
        {BRAND_SLUGS.filter((b) => b !== brand).map((b, i) => (
          <span key={b}>{i > 0 && " · "}<Link className="underline hover:text-brand" href={b === "wardrobe" ? "/" : `/${b}`}>{BRANDS[b].name}</Link></span>
        ))}
      </p>
    </section>
  );
}
