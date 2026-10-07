export const CATEGORIES = [
  { slug: "kebaya", label: "Kebaya", blurb: "Kebaya modern & klasik" },
  { slug: "batik", label: "Batik & Wastra", blurb: "Batik, tenun, lurik" },
  { slug: "gamis", label: "Gamis & Dress", blurb: "Modest dress harian & pesta" },
  { slug: "hijab", label: "Hijab & Scarf", blurb: "Pashmina, segi empat, instan" },
  { slug: "anak", label: "Delova Kids", blurb: "Busana anak perempuan" },
  { slug: "blouse", label: "Blouse", blurb: "Atasan & blouse harian" },
  { slug: "cardigan", label: "Cardigan", blurb: "Cardigan & outer rajut" },
  { slug: "skirt", label: "Skirt", blurb: "Rok simpel & versatile" },
  { slug: "inner", label: "Inner", blurb: "Inner & tank top" },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"] | "lainnya";

export const categoryLabel = (slug: string) =>
  CATEGORIES.find((c) => c.slug === slug)?.label ?? "Lainnya";

const RULES: [CategorySlug, string[]][] = [
  ["anak", ["anak", "kids", "baby", "bayi", "balita", "girl"]],
  ["kebaya", ["kebaya", "kutubaru", "brokat"]],
  ["hijab", ["hijab", "scarf", "pashmina", "segi empat", "voal", "bergo", "khimar", "jilbab", "kerudung"]],
  ["gamis", ["gamis", "dress", "abaya", "tunik", "tunic", "maxi"]],
  ["batik", ["batik", "wastra", "tenun", "jarik", "sarung", "lurik", "songket", "kain", "rok", "outer", "kemeja", "blouse"]],
];

/** Tebak kategori dari nama produk; fallback ke kategori bawaan toko Shopee-nya. */
const DAILY_RULES: [CategorySlug, string[]][] = [
  ["cardigan", ["cardigan", "kardigan", "rajut", "outer", "knit"]],
  ["skirt", ["skirt", "rok"]],
  ["inner", ["inner", "tank", "singlet", "camisole", "dalaman"]],
  ["blouse", ["blouse", "blus", "kemeja", "atasan", "top", "tunik", "shirt"]],
];

export function detectCategory(name: string, shopDefault?: string | null, brand?: string): CategorySlug {
  if (brand === "daily") {
    const n = name.toLowerCase();
    for (const [slug, kws] of DAILY_RULES) if (kws.some((k) => n.includes(k))) return slug;
    return "blouse";
  }
  if (shopDefault === "anak") return "anak";
  const n = name.toLowerCase();
  for (const [slug, kws] of RULES) if (kws.some((k) => n.includes(k))) return slug;
  return (shopDefault as CategorySlug) || "lainnya";
}

export function defaultCategoryForShop(shopName: string): CategorySlug {
  const n = shopName.toLowerCase();
  if (n.includes("kids")) return "anak";
  if (n.includes("scarf")) return "hijab";
  if (n.includes("daily")) return "blouse";
  return "gamis";
}
