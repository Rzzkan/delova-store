import type { CollectionConfig } from "payload";
import { brandOptions, categoryOptions, faqField, seoGroup, slugField } from "./shared";

/** Artikel blog & panduan belanja. */
export const Posts: CollectionConfig = {
  slug: "posts",
  labels: { singular: "Artikel", plural: "Blog & Panduan" },
  admin: { useAsTitle: "title", defaultColumns: ["title", "type", "brand", "_status", "publishedAt"], group: "Konten" },
  versions: { drafts: true, maxPerDoc: 10 },
  access: { read: ({ req: { user } }) => (user ? true : { _status: { equals: "published" } }) },
  defaultSort: "-publishedAt",
  fields: [
    { name: "title", label: "Judul", type: "text", required: true },
    slugField("title"),
    {
      type: "row",
      fields: [
        { name: "type", label: "Jenis", type: "select", defaultValue: "blog", required: true, options: [{ label: "Blog", value: "blog" }, { label: "Panduan", value: "panduan" }], admin: { width: "33%" } },
        { name: "brand", label: "Untuk toko", type: "select", defaultValue: "semua", required: true, options: brandOptions, admin: { width: "33%" } },
        { name: "publishedAt", label: "Tanggal terbit", type: "date", admin: { width: "33%", date: { pickerAppearance: "dayOnly" } } },
      ],
    },
    { name: "excerpt", label: "Ringkasan (tampil di daftar & Google)", type: "textarea", required: true, maxLength: 220 },
    { name: "heroImage", label: "Foto utama", type: "upload", relationTo: "media" },
    { name: "content", label: "Isi artikel", type: "richText", required: true },
    faqField,
    {
      name: "related",
      label: "Produk terkait (ditampilkan di akhir artikel)",
      type: "group",
      admin: { description: "Kosongkan semua untuk menampilkan terlaris dari toko yang dipilih di atas." },
      fields: [
        { name: "category", label: "Kategori", type: "select", options: categoryOptions },
        { name: "keyword", label: "Kata kunci nama produk (mis. pashmina)", type: "text" },
      ],
    },
    seoGroup,
  ],
  hooks: {
    beforeChange: [({ data }) => (data._status === "published" && !data.publishedAt ? { ...data, publishedAt: new Date().toISOString() } : data)],
  },
};
