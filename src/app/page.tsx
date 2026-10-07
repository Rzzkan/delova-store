import Link from "next/link";
import { ProductGrid } from "@/components/ProductCard";
import { CATEGORIES } from "@/lib/categories";
import { categoryCounts, listProducts, listShops } from "@/lib/products";
import { thumb } from "@/lib/format";
import { getHome } from "@/lib/settings";
import { homeReviews, ratingSummary } from "@/lib/reviews";
import { ReviewCard } from "@/components/ReviewCard";

/** "Dipakai *diwariskan* cinta" → kata di antara tanda * dicetak miring emas. */
function Accent({ text }: { text: string }) {
  return <>{text.split(/(\*[^*]+\*)/g).map((p, i) => (p.startsWith("*") && p.endsWith("*") ? <em key={i} className="text-gold">{p.slice(1, -1)}</em> : p))}</>;
}

export const dynamic = "force-dynamic";

const TRUST = [
  ["Sinkron Shopee", "Stok & harga selalu sama dengan toko resmi"],
  ["Dua Cara Beli", "Checkout WhatsApp atau langsung di Shopee"],
  ["Kirim Nusantara", "Dikemas rapi, dikirim ke seluruh Indonesia"],
  ["Admin Ramah", "Tanya ukuran & bahan via WhatsApp"],
];

export default async function Home() {
  const [home, reviews, summary, featured, latest, best, counts, shops] = await Promise.all([
    getHome(),
    homeReviews(6),
    ratingSummary(),
    listProducts({ featured: true, limit: 4, sort: "terlaris" }),
    listProducts({ limit: 8, sort: "terbaru" }),
    listProducts({ limit: 4, sort: "terlaris" }),
    categoryCounts(),
    listShops(),
  ]);
  const heroImg = home.hero.image || featured.items[0]?.images[0];
  const catImg = async (slug: string) => (await listProducts({ category: slug, limit: 1, sort: "terlaris" })).items[0]?.images[0];
  const catImages = await Promise.all(CATEGORIES.map(async (c) => home.categoryImages[c.slug] || (await catImg(c.slug))));

  return (
    <>
      {/* HERO */}
      <section className="pattern-kawung relative overflow-hidden">
        <div className="container-x grid items-center gap-10 py-14 md:grid-cols-2 md:py-24">
          <div>
            <p className="eyebrow">{home.hero.eyebrow}</p>
            <h1 className="mt-4 text-5xl font-semibold leading-[1.05] text-maroon md:text-7xl">
              <Accent text={home.hero.title} />
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-ink/70">
              {home.hero.subtitle}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {home.hero.cta1Label && <Link href={home.hero.cta1Href} className="btn-primary">{home.hero.cta1Label}</Link>}
              {home.hero.cta2Label && <Link href={home.hero.cta2Href} className="btn-outline">{home.hero.cta2Label}</Link>}
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-3 rounded-[2.5rem] border border-gold/40" aria-hidden />
            <div className="aspect-[4/5] overflow-hidden rounded-[2rem] bg-sand shadow-2xl shadow-maroon/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {heroImg && <img src={heroImg} alt="Koleksi unggulan Delova" className="h-full w-full object-cover" />}
            </div>
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="border-y border-sand bg-white/60">
        <div className="container-x grid grid-cols-2 gap-6 py-6 md:grid-cols-4">
          {TRUST.map(([t, d]) => (
            <div key={t}><p className="text-sm font-medium text-maroon">{t}</p><p className="mt-0.5 text-xs text-ink/60">{d}</p></div>
          ))}
        </div>
      </section>

      {/* KATEGORI */}
      <section className="container-x mt-20">
        <div className="mb-8 text-center"><p className="eyebrow">Jelajahi</p><h2 className="mt-2 text-4xl font-semibold md:text-5xl">Belanja per Kategori</h2></div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {CATEGORIES.map((c, i) => (counts[c.slug] ?? 0) > 0 && (
            <Link key={c.slug} href={`/produk?kategori=${c.slug}`} className="group relative aspect-[3/4] overflow-hidden rounded-3xl bg-sand">
              {catImages[i] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumb(catImages[i]!)} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-maroon-dark/80 via-transparent to-transparent" />
              <div className="absolute bottom-0 p-4 text-cream">
                <p className="font-display text-2xl leading-tight">{c.label}</p>
                <p className="text-xs text-cream/70">{counts[c.slug] ?? 0} produk</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* TERBARU */}
      <section className="container-x mt-24">
        <div className="mb-8 flex items-end justify-between">
          <div><p className="eyebrow">Baru datang</p><h2 className="mt-2 text-4xl font-semibold md:text-5xl">Koleksi Terbaru</h2></div>
          <Link href="/produk?urut=terbaru" className="text-sm text-maroon underline underline-offset-4">Lihat semua</Link>
        </div>
        <ProductGrid items={latest.items} />
      </section>

      {/* STORY */}
      <section className="mt-24 bg-maroon text-cream">
        <div className="pattern-kawung-light">
          <div className="container-x grid items-center gap-8 py-16 md:grid-cols-2">
            <div>
              {home.story.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={home.story.image} alt="" loading="lazy" className="mb-6 aspect-[16/10] w-full rounded-3xl object-cover" />
              )}
              <h2 className="text-4xl font-semibold leading-tight md:text-6xl">{home.story.title}</h2>
            </div>
            <div className="space-y-4 text-cream/80">
              {home.story.body.split("\n").filter(Boolean).map((para, i) => (<p key={i}>{para}</p>))}
              {home.story.ctaLabel && <Link href={home.story.ctaHref} className="btn mt-2 border border-gold-light text-gold-light hover:bg-gold-light hover:text-maroon-dark">{home.story.ctaLabel}</Link>}
            </div>
          </div>
        </div>
      </section>

      {/* TERLARIS */}
      <section className="container-x mt-24">
        <div className="mb-8 text-center"><p className="eyebrow">Paling dicari</p><h2 className="mt-2 text-4xl font-semibold md:text-5xl">Terlaris Minggu Ini</h2></div>
        <ProductGrid items={best.items} />
      </section>

      {/* ULASAN */}
      {reviews.length > 0 && (
        <section className="container-x mt-24">
          <div className="mb-8 text-center">
            <p className="eyebrow">Ulasan</p>
            <h2 className="mt-2 text-4xl font-semibold md:text-5xl">{home.reviews.title}</h2>
            <p className="mt-2 text-sm text-ink/60">
              {summary ? <><span className="text-gold">★</span> {summary.avg.toFixed(1)} · {summary.sold.toLocaleString("id-ID")}+ produk terjual · </> : null}{home.reviews.subtitle}
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {reviews.map((r) => (<ReviewCard key={r.id} r={r} />))}
          </div>
        </section>
      )}

      {/* TOKO */}
      <section className="container-x mt-24">
        <div className="rounded-[2rem] border border-sand bg-white p-8 md:p-12">
          <p className="eyebrow">Toko resmi</p>
          <h2 className="mt-2 text-4xl font-semibold">Belanja juga di Shopee</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {shops.map((s) => (
              <a key={s.shopId} href={s.shopeeUrl ?? "https://shopee.co.id"} target="_blank" rel="noopener noreferrer"
                className="group flex items-center justify-between rounded-2xl border border-sand p-5 transition hover:border-[#EE4D2D]">
                <span className="font-display text-2xl">{s.name}</span>
                <span className="text-sm text-[#EE4D2D] transition group-hover:translate-x-1">Buka →</span>
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
