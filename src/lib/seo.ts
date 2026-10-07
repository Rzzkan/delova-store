import { BRANDS, BRAND_SLUGS, type BrandSlug } from "./brands";
import type { Product } from "./products";

export const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
export const abs = (u: string) => (u.startsWith("http") ? u : `${siteUrl()}${u.startsWith("/") ? "" : "/"}${u}`);

/** Judul & deskripsi halaman brand — memuat nama brand + kata kunci yang dicari pembeli. */
export const BRAND_SEO: Record<BrandSlug, { title: string; description: string; h1: string; copy: string }> = {
  wardrobe: {
    title: "Delova Wardrobe — Kebaya Modern, Batik & Gamis | Official Store",
    description: "Belanja kebaya modern, batik, dan gamis dari Delova Wardrobe. Bahan adem, potongan nyaman, stok & harga selalu update dengan toko resmi Shopee. Kirim ke seluruh Indonesia.",
    h1: "Delova Wardrobe",
    copy: "Delova Wardrobe menghadirkan kebaya modern, batik, wastra, dan gamis dengan potongan masa kini yang nyaman dipakai untuk wisuda, acara keluarga, hingga kegiatan harian. Semua produk, harga, dan stok di situs ini tersinkron langsung dengan toko resmi Delova Wardrobe di Shopee, sehingga kamu bisa membeli lewat WhatsApp admin atau langsung di Shopee dengan garansi dan gratis ongkir Shopee.",
  },
  kids: {
    title: "Delova Kids — Kebaya & Baju Anak Perempuan | Official Store",
    description: "Kebaya anak, dress batik anak, dan busana anak perempuan dari Delova Kids. Bahan lembut dan adem, cocok untuk acara keluarga dan sehari-hari. Stok tersinkron dengan Shopee.",
    h1: "Delova Kids",
    copy: "Delova Kids adalah toko busana anak perempuan dari keluarga Delova: kebaya anak, dress batik, set kutubaru, dan gamis anak dengan bahan lembut, adem, dan tidak gatal. Cocok untuk hari Kartini, acara keluarga, maupun bermain sehari-hari. Beli lewat WhatsApp atau langsung di Shopee.",
  },
  scarf: {
    title: "Delova Scarf — Hijab Segi Empat, Pashmina & Bergo | Official Store",
    description: "Hijab segi empat, pashmina voal, dan bergo instan dari Delova Scarf. Bahan jatuh dan nyaman seharian, banyak pilihan warna dan motif. Stok tersinkron dengan Shopee.",
    h1: "Delova Scarf",
    copy: "Delova Scarf menyediakan hijab segi empat, pashmina, dan bergo instan dengan bahan viscose, voal, dan jersey yang jatuh, lembut, dan mudah dibentuk, dengan pilihan warna dan motif yang mudah dipadukan.",
  },
  daily: {
    title: "Delova Daily — Blouse, Cardigan, Skirt & Inner | Official Store",
    description: "Blouse, cardigan, skirt, dan inner dari Delova Daily: effortless style for every day. Nyaman, versatile, dan mudah dipadupadankan. Stok tersinkron dengan Shopee.",
    h1: "Delova Daily",
    copy: "Delova Daily adalah sister brand Delova Wardrobe yang berfokus pada fashion sehari-hari: blouse, cardigan, skirt, dan inner yang nyaman, versatile, dan mudah dipadupadankan untuk bekerja, hangout, hingga rutinitas harian.",
  },
};

export const CATEGORY_SEO: Record<string, { h1: string; copy: string }> = {
  kebaya: { h1: "Kebaya Modern", copy: "Koleksi kebaya modern dan klasik: kebaya brokat, tulle, dan kutubaru dengan potongan nyaman untuk wisuda, kondangan, dan acara keluarga." },
  batik: { h1: "Batik & Wastra", copy: "Batik, wastra, tenun, dan lurik dalam siluet masa kini: dress, outer, dan rok batik untuk acara maupun keseharian." },
  gamis: { h1: "Gamis & Dress", copy: "Gamis dan dress modest dengan bahan adem untuk harian maupun pesta." },
  hijab: { h1: "Hijab & Scarf", copy: "Hijab segi empat, pashmina voal, dan bergo instan dengan banyak pilihan warna dan motif." },
  anak: { h1: "Busana Anak Perempuan", copy: "Kebaya anak, dress batik anak, dan gamis anak yang lembut, adem, dan nyaman." },
  blouse: { h1: "Blouse Wanita", copy: "Blouse dan atasan wanita yang nyaman, versatile, dan mudah dipadupadankan." },
  cardigan: { h1: "Cardigan", copy: "Cardigan rajut dan outer ringan untuk bergaya berlapis sepanjang hari." },
  skirt: { h1: "Skirt & Rok", copy: "Skirt dan rok dengan potongan simpel yang jatuh rapi untuk kerja maupun hangout." },
  inner: { h1: "Inner & Tank Top", copy: "Inner dan tank top nyaman untuk dipadukan dengan blouse dan cardigan." },
};

export function organizationLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Delova",
    url: siteUrl(),
    sameAs: [
      ...BRAND_SLUGS.map((b) => BRANDS[b].shopeeUrl),
      "https://www.instagram.com/delovawardrobe",
      "https://www.tiktok.com/@delovawardrobe",
      "https://www.instagram.com/delovakids",
      "https://www.tiktok.com/@delovakids",
      "https://www.instagram.com/delovawardrobescarf",
      "https://www.tiktok.com/@delovascarf",
    ],
  };
}

export function websiteLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Delova",
    url: siteUrl(),
    potentialAction: { "@type": "SearchAction", target: `${siteUrl()}/produk?q={search_term_string}`, "query-input": "required name=search_term_string" },
  };
}

export function breadcrumbLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: abs(it.url) })),
  };
}

/** Product JSON-LD. Rating hanya dicantumkan bila jumlah ulasan NYATA dari Shopee tersedia — tidak dikarang. */
export function productLd(p: Product) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    image: p.images.slice(0, 6),
    description: p.description.slice(0, 500) || p.name,
    sku: String(p.itemId),
    brand: { "@type": "Brand", name: BRANDS[p.brand].name },
    ...(p.rating && p.reviewCount && p.reviewCount > 0
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: Number(p.rating.toFixed(1)), reviewCount: p.reviewCount } }
      : {}),
    offers: {
      "@type": "Offer",
      url: `${siteUrl()}/produk/${p.slug}`,
      priceCurrency: "IDR",
      price: p.price,
      priceValidUntil: new Date(Date.now() + 30 * 86400_000).toISOString().slice(0, 10),
      itemCondition: "https://schema.org/NewCondition",
      availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: BRANDS[p.brand].name },
    },
  };
}

export const ldScript = (data: unknown) => ({ __html: JSON.stringify(data).replace(/</g, "\\u003c") });
