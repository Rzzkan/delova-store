import type { CollectionConfig } from "payload";
import path from "node:path";

/** Foto untuk artikel & halaman koleksi. Disimpan di folder data/ (ikut volume Docker). */
export const Media: CollectionConfig = {
  slug: "media",
  labels: { singular: "Foto", plural: "Foto" },
  admin: { group: "Konten" },
  access: { read: () => true },
  upload: {
    staticDir: path.resolve(process.cwd(), "data/cms-media"),
    mimeTypes: ["image/*"],
    imageSizes: [
      { name: "card", width: 800, height: undefined, withoutEnlargement: true },
      { name: "hero", width: 1600, height: undefined, withoutEnlargement: true },
    ],
    adminThumbnail: "card",
  },
  fields: [{ name: "alt", label: "Teks alternatif (untuk SEO & aksesibilitas)", type: "text", required: true }],
};
