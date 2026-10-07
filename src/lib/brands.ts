/** Tiga brand Delova — masing-masing punya toko Shopee, logo, dan tone warna sendiri (warna: globals.css). */
export type BrandSlug = "wardrobe" | "kids" | "scarf";
export const BRAND_SLUGS: BrandSlug[] = ["wardrobe", "kids", "scarf"];

export type Brand = {
  slug: BrandSlug;
  name: string;
  short: string;
  home: string;
  catalog: string;
  shopeeUrl: string;
  categories: string[];
  nav: { label: string; href: string }[];
  announcements: string[];
  hero: { eyebrow: string; title: string; subtitle: string; cta1Label: string; cta1Href: string; cta2Label: string; cta2Href: string };
  dot: string; // warna titik pada pemilih brand
  provisional?: boolean;
};

export const BRANDS: Record<BrandSlug, Brand> = {
  wardrobe: {
    slug: "wardrobe", name: "Delova Wardrobe", short: "Wardrobe", home: "/", catalog: "/produk?brand=wardrobe",
    shopeeUrl: "https://shopee.co.id/delovawardrobe", categories: ["kebaya", "batik", "gamis"],
    nav: [
      { label: "Kebaya", href: "/produk?brand=wardrobe&kategori=kebaya" },
      { label: "Batik & Wastra", href: "/produk?brand=wardrobe&kategori=batik" },
      { label: "Gamis & Dress", href: "/produk?brand=wardrobe&kategori=gamis" },
      { label: "Semua Produk", href: "/produk" },
    ],
    announcements: [], // wardrobe memakai pengumuman dari /admin/tampilan
    hero: { eyebrow: "", title: "", subtitle: "", cta1Label: "", cta1Href: "", cta2Label: "", cta2Href: "" },
    dot: "#E7BCBD",
  },
  kids: {
    slug: "kids", name: "Delova Kids", short: "Kids", home: "/kids", catalog: "/produk?brand=kids",
    shopeeUrl: "https://shopee.co.id/delovakids", categories: ["anak"],
    nav: [
      { label: "Semua Delova Kids", href: "/produk?brand=kids" },
      { label: "Terlaris", href: "/produk?brand=kids&urut=terlaris" },
      { label: "Terbaru", href: "/produk?brand=kids&urut=terbaru" },
    ],
    announcements: ["Busana anak perempuan yang lembut, adem, dan nyaman", "Stok & harga tersinkron dengan toko Shopee Delova Kids", "Couple dengan bunda? Lihat koleksi Delova Wardrobe ✦"],
    hero: {
      eyebrow: "Delova Kids", title: "Gaya *ceria* untuk si kecil.",
      subtitle: "Kebaya, dress batik, dan busana anak perempuan yang lembut, adem, dan nyaman — untuk bermain maupun acara spesial keluarga.",
      cta1Label: "Belanja Delova Kids", cta1Href: "/produk?brand=kids", cta2Label: "Lihat Terlaris", cta2Href: "/produk?brand=kids&urut=terlaris",
    },
    dot: "#F96605",
  },
  scarf: {
    slug: "scarf", name: "Delova Scarf", short: "Scarf", home: "/scarf", catalog: "/produk?brand=scarf",
    shopeeUrl: "https://shopee.co.id/delovascarf", categories: ["hijab"],
    nav: [
      { label: "Semua Delova Scarf", href: "/produk?brand=scarf" },
      { label: "Terlaris", href: "/produk?brand=scarf&urut=terlaris" },
      { label: "Terbaru", href: "/produk?brand=scarf&urut=terbaru" },
    ],
    announcements: ["Hijab segi empat, pashmina, & bergo berbahan lembut", "Stok & harga tersinkron dengan toko Shopee Delova Scarf", "Padukan dengan kebaya & batik Delova Wardrobe ✦"],
    hero: {
      eyebrow: "Delova Scarf", title: "Hijab yang *jatuh* dan nyaman seharian.",
      subtitle: "Segi empat, pashmina, dan bergo dengan bahan lembut, warna yang mudah dipadukan, dan motif wastra pilihan.",
      cta1Label: "Belanja Delova Scarf", cta1Href: "/produk?brand=scarf", cta2Label: "Lihat Terlaris", cta2Href: "/produk?brand=scarf&urut=terlaris",
    },
    dot: "#7C8B6F",
    provisional: true,
  },
};

export const isBrand = (v: unknown): v is BrandSlug => typeof v === "string" && (BRAND_SLUGS as string[]).includes(v);

/** Tebak brand dari nama/slug toko Shopee. */
export function brandForShop(name: string): BrandSlug {
  const n = name.toLowerCase();
  if (n.includes("kids")) return "kids";
  if (n.includes("scarf")) return "scarf";
  return "wardrobe";
}
