import type { CollectionConfig } from "payload";
import { brandOptions, categoryOptions, faqField, seoGroup, slugField } from "./shared";

/** Halaman koleksi dengan URL bersih (/koleksi/pashmina) — judul, teks pengantar & FAQ diatur di sini, produk diambil otomatis. */
export const Koleksi: CollectionConfig = {
  slug: "koleksi",
  labels: { singular: "Halaman Koleksi", plural: "Halaman Koleksi" },
  admin: { useAsTitle: "title", defaultColumns: ["title", "slug", "brand", "category", "_status"], group: "Konten" },
  versions: { drafts: true, maxPerDoc: 10 },
  access: { read: ({ req: { user } }) => (user ? true : { _status: { equals: "published" } }) },
  fields: [
    { name: "title", label: "Judul halaman (H1)", type: "text", required: true, admin: { description: "Contoh: Hijab Pashmina Viscose" } },
    slugField("title"),
    {
      type: "row",
      fields: [
        { name: "brand", label: "Produk dari toko", type: "select", defaultValue: "semua", required: true, options: brandOptions, admin: { width: "33%" } },
        { name: "category", label: "Kategori", type: "select", options: categoryOptions, admin: { width: "33%" } },
        { name: "keyword", label: "Kata kunci nama produk", type: "text", admin: { width: "33%", description: "Mis. pashmina — hanya produk yang namanya memuat kata ini." } },
      ],
    },
    { name: "sort", label: "Urutan produk", type: "select", defaultValue: "terlaris", options: [{ label: "Terlaris", value: "terlaris" }, { label: "Terbaru", value: "terbaru" }, { label: "Harga terendah", value: "termurah" }] },
    { name: "summary", label: "Ringkasan 1–2 kalimat (di bawah judul)", type: "textarea", maxLength: 260 },
    { name: "heroImage", label: "Foto (opsional)", type: "upload", relationTo: "media" },
    { name: "intro", label: "Teks pengantar (di atas produk)", type: "richText" },
    { name: "bottom", label: "Teks SEO (di bawah produk)", type: "richText", admin: { description: "Panduan memilih, bahan, cara perawatan. 150–400 kata ideal." } },
    faqField,
    seoGroup,
  ],
};
