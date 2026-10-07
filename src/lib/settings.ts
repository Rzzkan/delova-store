import { getDb } from "./db";
import { CATEGORIES } from "./categories";
import { BRAND_SLUGS } from "./brands";

/** Semua teks & gambar beranda yang bisa diubah dari /admin/tampilan. Gambar = URL (upload → /api/media/…, atau link luar). */
export type HomeSettings = {
  announcements: string[];
  hero: { eyebrow: string; title: string; subtitle: string; image: string; cta1Label: string; cta1Href: string; cta2Label: string; cta2Href: string };
  categoryImages: Record<string, string>;
  story: { title: string; body: string; image: string; ctaLabel: string; ctaHref: string };
  reviews: { title: string; subtitle: string };
  logos: Record<string, string>;
  brandHeroes: Record<string, string>;
};

export const HOME_DEFAULTS: HomeSettings = {
  announcements: [
    "Stok & harga tersinkron langsung dengan toko Shopee Delova",
    "Gratis ongkir & garansi Shopee untuk pembelian lewat Shopee",
    "Order via WhatsApp: dilayani admin ramah, kirim ke seluruh Indonesia",
    "Kebaya • Batik • Hijab • Delova Kids",
  ],
  hero: {
    eyebrow: "Wastra Indonesia · Modern",
    title: "Dipakai dengan bangga, *diwariskan* dengan cinta.",
    subtitle: "Kebaya, batik, gamis, dan hijab dengan siluet masa kini — untuk bunda, si kecil, dan keluarga. Sedikit lebih rapi, banyak lebih nyaman.",
    image: "",
    cta1Label: "Belanja Sekarang",
    cta1Href: "/produk",
    cta2Label: "Koleksi Kebaya",
    cta2Href: "/produk?kategori=kebaya",
  },
  categoryImages: {},
  story: {
    title: "Wastra bukan sekadar pakaian. Ia cerita yang kita pakai.",
    body: "Delova menghadirkan kebaya, batik, dan hijab dengan potongan yang nyaman dipakai setiap hari maupun di hari istimewa.\nSatu keluarga, tiga toko: Wardrobe untuk bunda, Kids untuk si kecil, dan Scarf untuk hijab.",
    image: "",
    ctaLabel: "Temukan gayamu",
    ctaHref: "/produk",
  },
  reviews: { title: "Kata Pembeli Delova", subtitle: "Ulasan asli dari pembeli di Shopee" },
  logos: {},
  brandHeroes: {},
};

const KEY = "home";

function merge(stored: Partial<HomeSettings> | null): HomeSettings {
  const d = HOME_DEFAULTS;
  const s = stored ?? {};
  return {
    announcements: Array.isArray(s.announcements) && s.announcements.length ? s.announcements.map(String) : d.announcements,
    hero: { ...d.hero, ...(s.hero ?? {}) },
    categoryImages: { ...(s.categoryImages ?? {}) },
    story: { ...d.story, ...(s.story ?? {}) },
    reviews: { ...d.reviews, ...(s.reviews ?? {}) },
    logos: { ...(s.logos ?? {}) },
    brandHeroes: { ...(s.brandHeroes ?? {}) },
  };
}

export async function getHome(): Promise<HomeSettings> {
  try {
    const db = await getDb();
    const r = await db.execute({ sql: "SELECT value FROM settings WHERE key = ?", args: [KEY] });
    return merge(r.rows.length ? JSON.parse(String(r.rows[0].value)) : null);
  } catch {
    return HOME_DEFAULTS; // jangan sampai halaman gagal render hanya karena pengaturan
  }
}

const str = (v: unknown, max: number) => String(v ?? "").slice(0, max);
/** Hanya izinkan gambar dari upload sendiri, path relatif, atau https. */
const img = (v: unknown) => {
  const s = str(v, 600).trim();
  return s === "" || s.startsWith("/") || s.startsWith("https://") ? s : "";
};
const href = (v: unknown) => {
  const s = str(v, 300).trim();
  return s.startsWith("/") || s.startsWith("https://") ? s : "/produk";
};

/** Validasi + simpan. Input dari admin tidak dipercaya begitu saja. */
export async function saveHome(input: Partial<HomeSettings>): Promise<HomeSettings> {
  const cur = merge(input);
  const clean: HomeSettings = {
    announcements: cur.announcements.map((a) => str(a, 140).trim()).filter(Boolean).slice(0, 8),
    hero: {
      eyebrow: str(cur.hero.eyebrow, 60), title: str(cur.hero.title, 140), subtitle: str(cur.hero.subtitle, 320), image: img(cur.hero.image),
      cta1Label: str(cur.hero.cta1Label, 40), cta1Href: href(cur.hero.cta1Href), cta2Label: str(cur.hero.cta2Label, 40), cta2Href: href(cur.hero.cta2Href),
    },
    categoryImages: Object.fromEntries(CATEGORIES.map((c) => [c.slug, img(cur.categoryImages[c.slug])]).filter(([, v]) => v)),
    story: { title: str(cur.story.title, 160), body: str(cur.story.body, 900), image: img(cur.story.image), ctaLabel: str(cur.story.ctaLabel, 40), ctaHref: href(cur.story.ctaHref) },
    reviews: { title: str(cur.reviews.title, 80), subtitle: str(cur.reviews.subtitle, 140) },
    logos: Object.fromEntries(BRAND_SLUGS.map((b) => [b, img(cur.logos[b])]).filter(([, v]) => v)),
    brandHeroes: Object.fromEntries(BRAND_SLUGS.map((b) => [b, img(cur.brandHeroes[b])]).filter(([, v]) => v)),
  };
  if (!clean.announcements.length) clean.announcements = HOME_DEFAULTS.announcements;
  const db = await getDb();
  await db.execute({
    sql: "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    args: [KEY, JSON.stringify(clean)],
  });
  return clean;
}
