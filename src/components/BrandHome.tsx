import Link from "next/link";
import { ProductGrid } from "./ProductCard";
import { ReviewCard } from "./ReviewCard";
import { Logo } from "./Logo";
import { CATEGORIES } from "@/lib/categories";
import { BRANDS, BRAND_SLUGS, type BrandSlug } from "@/lib/brands";
import { categoryCounts, listProducts } from "@/lib/products";
import { thumb } from "@/lib/format";
import { getHome } from "@/lib/settings";
import { homeReviews, ratingSummary } from "@/lib/reviews";

/** "Gaya *ceria* si kecil" → kata di antara tanda * diberi warna aksen. */
function Accent({ text }: { text: string }) {
  return <>{text.split(/(\*[^*]+\*)/g).map((p, i) => (p.startsWith("*") && p.endsWith("*") ? <em key={i} className="text-accent-ink">{p.slice(1, -1)}</em> : p))}</>;
}

const BLURB: Record<BrandSlug, string> = {
  wardrobe: "Kebaya, batik & gamis untuk bunda",
  kids: "Busana anak perempuan yang ceria",
  scarf: "Hijab segi empat, pashmina & bergo",
  daily: "Blouse, cardigan, skirt & inner untuk sehari-hari",
};

const TRUST = [
  ["Sinkron Shopee", "Stok & harga selalu sama dengan toko resmi"],
  ["Dua Cara Beli", "Checkout WhatsApp atau langsung di Shopee"],
  ["Kirim Nusantara", "Dikemas rapi, dikirim ke seluruh Indonesia"],
  ["Admin Ramah", "Tanya ukuran & bahan via WhatsApp"],
];

/** Beranda satu brand. Wardrobe memakai teks/foto dari /admin/tampilan; Kids & Scarf punya salinan sendiri (brands.ts). */
export async function BrandHome({ brand }: { brand: BrandSlug }) {
  const b = BRANDS[brand];
  const home = await getHome();
  const [reviews, summary, featured, latest, best, counts] = await Promise.all([
    homeReviews(6, brand),
    ratingSummary(brand),
    listProducts({ brand, featured: true, limit: 4, sort: "terlaris" }),
    listProducts({ brand, limit: 8, sort: "terbaru" }),
    listProducts({ brand, limit: 4, sort: "terlaris" }),
    categoryCounts(brand),
  ]);
  const shopeeUrl = home.shopeeUrls[brand] || b.shopeeUrl;
  const hero = brand === "wardrobe" ? home.hero : b.hero;
  const heroImg = (brand === "wardrobe" ? home.hero.image : home.brandHeroes[brand]) || featured.items[0]?.images[0] || best.items[0]?.images[0];
  const cats = CATEGORIES.filter((c) => b.categories.includes(c.slug) && (counts[c.slug] ?? 0) > 0);
  const catImages = await Promise.all(
    cats.map(async (c) => home.categoryImages[c.slug] || (await listProducts({ brand, category: c.slug, limit: 1, sort: "terlaris" })).items[0]?.images[0]),
  );

  return (
    <>
      {/* HERO */}
      <section className="pattern-kawung relative overflow-hidden">
        <div className="container-x grid items-center gap-10 py-14 md:grid-cols-2 md:py-24">
          <div>
            <p className="eyebrow">{hero.eyebrow}</p>
            <h1 className="mt-4 text-4xl leading-[1.08] text-brand md:text-6xl"><Accent text={hero.title} /></h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-ink/70">{hero.subtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              {hero.cta1Label && <Link href={hero.cta1Href} className="btn-primary">{hero.cta1Label}</Link>}
              {hero.cta2Label && <Link href={hero.cta2Href} className="btn-outline">{hero.cta2Label}</Link>}
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-md">
            <div className="hero-ring absolute -inset-3 rounded-[2.5rem] border-2 border-accent/60" aria-hidden />
            <div className="aspect-[4/5] overflow-hidden rounded-[2rem] bg-sand shadow-2xl shadow-brand/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {heroImg && <img src={heroImg} alt={`Koleksi unggulan ${b.name}`} className="h-full w-full object-cover" />}
            </div>
          </div>
        </div>
      </section>

      {b.provisional && (
        <p className="bg-accent-light/60 py-2 text-center text-xs text-ink/70">Tampilan {b.name} masih sementara — unggah logo di admin & kirim warna brand untuk disesuaikan.</p>
      )}

      {/* TRUST */}
      <section className="border-y border-sand bg-white/70">
        <div className="container-x grid grid-cols-2 gap-6 py-6 md:grid-cols-4">
          {TRUST.map(([t, d]) => (
            <div key={t}><p className="text-sm font-semibold text-brand">{t}</p><p className="mt-0.5 text-xs text-ink/60">{d}</p></div>
          ))}
        </div>
      </section>

      {/* KATEGORI */}
      {cats.length > 1 && (
        <section className="container-x mt-20">
          <div className="mb-8 text-center"><p className="eyebrow">Jelajahi</p><h2 className="mt-2 text-3xl md:text-4xl">Belanja per Kategori</h2></div>
          <div className={`mx-auto grid grid-cols-2 gap-4 ${cats.length >= 4 ? "md:grid-cols-4 max-w-6xl" : cats.length === 3 ? "md:grid-cols-3 max-w-4xl" : "md:grid-cols-2 max-w-4xl"}`}>
            {cats.map((c, i) => (
              <Link key={c.slug} href={`/produk?brand=${brand}&kategori=${c.slug}`} className="group relative aspect-[3/4] overflow-hidden rounded-3xl bg-sand">
                {catImages[i] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thumb(catImages[i]!)} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/80 via-transparent to-transparent" />
                <div className="absolute bottom-0 p-4 text-cream"><p className="font-display text-xl leading-tight">{c.label}</p><p className="text-xs text-cream/70">{counts[c.slug] ?? 0} produk</p></div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* TERBARU */}
      <section className="container-x mt-24">
        <div className="mb-8 flex items-end justify-between">
          <div><p className="eyebrow">Baru datang</p><h2 className="mt-2 text-3xl md:text-4xl">Koleksi Terbaru</h2></div>
          <Link href={`/produk?brand=${brand}&urut=terbaru`} className="text-sm font-medium text-brand underline underline-offset-4">Lihat semua</Link>
        </div>
        {latest.items.length ? <ProductGrid items={latest.items} /> : <p className="text-sm text-ink/50">Produk akan tampil setelah toko Shopee {b.name} disinkronkan.</p>}
      </section>

      {/* CERITA (hanya Wardrobe, diatur dari admin) */}
      {brand === "wardrobe" && (
        <section className="mt-24 bg-brand text-cream">
          <div className="pattern-kawung-light">
            <div className="container-x grid items-center gap-8 py-16 md:grid-cols-2">
              <div>
                {home.story.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={home.story.image} alt="" loading="lazy" className="mb-6 aspect-[16/10] w-full rounded-3xl object-cover" />
                )}
                <h2 className="text-3xl leading-tight md:text-5xl">{home.story.title}</h2>
              </div>
              <div className="space-y-4 text-cream/85">
                {home.story.body.split("\n").filter(Boolean).map((para, i) => (<p key={i}>{para}</p>))}
                {home.story.ctaLabel && <Link href={home.story.ctaHref} className="btn mt-2 border border-accent-light text-accent-light hover:bg-accent-light hover:text-brand-dark">{home.story.ctaLabel}</Link>}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* TERLARIS */}
      {best.items.length > 0 && (
        <section className="container-x mt-24">
          <div className="mb-8 text-center"><p className="eyebrow">Paling dicari</p><h2 className="mt-2 text-3xl md:text-4xl">Terlaris Minggu Ini</h2></div>
          <ProductGrid items={best.items} />
        </section>
      )}

      {/* ULASAN */}
      {reviews.length > 0 && (
        <section className="container-x mt-24">
          <div className="mb-8 text-center">
            <p className="eyebrow">Ulasan</p>
            <h2 className="mt-2 text-3xl md:text-4xl">{home.reviews.title}</h2>
            <p className="mt-2 text-sm text-ink/60">
              {summary ? <><span className="text-accent-ink">★</span> {summary.avg.toFixed(1)} · {summary.sold.toLocaleString("id-ID")}+ produk terjual · </> : null}{home.reviews.subtitle}
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{reviews.map((r) => (<ReviewCard key={r.id} r={r} />))}</div>
        </section>
      )}

      {/* KELUARGA DELOVA — masing-masing tile memakai tema brand-nya sendiri */}
      <section className="container-x mt-24">
        <div className="mb-8 text-center"><p className="eyebrow">Keluarga Delova</p><h2 className="mt-2 text-3xl md:text-4xl">Empat toko, satu keluarga</h2></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BRAND_SLUGS.map((s) => (
            <Link key={s} href={BRANDS[s].home} data-brand={s} className={`group flex flex-col items-center gap-5 rounded-3xl border-2 bg-cream p-8 text-center transition hover:-translate-y-1 hover:shadow-xl ${s === brand ? "border-brand" : "border-sand"}`}>
              <Logo brand={s} imageUrl={home.logos[s]} size="lg" />
              <p className="text-sm text-ink/70">{BLURB[s]}</p>
              <span className="btn-primary !py-2">Kunjungi</span>
            </Link>
          ))}
        </div>
      </section>

      {/* SHOPEE */}
      <section className="container-x mt-12">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-sand bg-white p-6 md:p-8">
          <div><p className="eyebrow">Toko resmi</p><h2 className="mt-1 text-2xl">{b.name} di Shopee</h2></div>
          <a href={shopeeUrl} target="_blank" rel="noopener noreferrer" className="btn-shopee">Buka toko Shopee</a>
        </div>
      </section>
    </>
  );
}
