import type { Field } from "payload";
import { CATEGORIES } from "@/lib/categories";
import { BRAND_SLUGS, BRANDS } from "@/lib/brands";

export const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

export const brandOptions = [{ label: "Semua toko", value: "semua" }, ...BRAND_SLUGS.map((b) => ({ label: BRANDS[b].name, value: b }))];
export const categoryOptions = [{ label: "— tidak dibatasi —", value: "" }, ...CATEGORIES.map((c) => ({ label: c.label, value: c.slug }))];

export const slugField = (from: string): Field => ({
  name: "slug",
  label: "Alamat URL (slug)",
  type: "text",
  required: true,
  unique: true,
  index: true,
  admin: { description: "Huruf kecil dan tanda hubung. Kosongkan untuk dibuat otomatis dari judul. Mengubahnya setelah terbit akan mengubah alamat halaman." },
  hooks: {
    beforeValidate: [({ value, data }) => (value ? slugify(String(value)) : slugify(String(data?.[from] ?? "")))],
  },
});

export const seoGroup: Field = {
  name: "seo",
  label: "SEO",
  type: "group",
  fields: [
    { name: "metaTitle", label: "Judul Google (maks ±60 huruf)", type: "text", maxLength: 70, admin: { description: "Kosong = memakai judul halaman." } },
    { name: "metaDescription", label: "Deskripsi Google (maks ±155 huruf)", type: "textarea", maxLength: 170, admin: { description: "Kosong = diambil dari ringkasan." } },
  ],
};

export const faqField: Field = {
  name: "faq",
  label: "Tanya Jawab (FAQ)",
  type: "array",
  maxRows: 10,
  admin: { description: "Ditampilkan di halaman dan dikirim ke Google sebagai FAQ." },
  labels: { singular: "Pertanyaan", plural: "Pertanyaan" },
  fields: [
    { name: "q", label: "Pertanyaan", type: "text", required: true },
    { name: "a", label: "Jawaban", type: "textarea", required: true },
  ],
};
