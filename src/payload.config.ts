import path from "node:path";
import { buildConfig } from "payload";
import { sqliteAdapter } from "@payloadcms/db-sqlite";
import { HeadingFeature, lexicalEditor } from "@payloadcms/richtext-lexical";
import sharp from "sharp";
import { id } from "@payloadcms/translations/languages/id";
import { en } from "@payloadcms/translations/languages/en";
import { Users } from "./collections/Users";
import { Media } from "./collections/Media";
import { Posts } from "./collections/Posts";
import { Koleksi } from "./collections/Koleksi";
import { migrations } from "./migrations";

const secret = process.env.PAYLOAD_SECRET || process.env.SESSION_SECRET || "dev-only-secret-ganti-di-produksi";

/**
 * Payload CMS untuk blog, panduan & halaman koleksi.
 * Admin di /cms (panel toko tetap di /admin). Database sendiri: data/cms.db (satu volume dengan database toko).
 */
export default buildConfig({
  secret,
  routes: { admin: "/cms", api: "/cms-api" },
  admin: {
    user: Users.slug,
    meta: { titleSuffix: " — Delova CMS" },
    components: {
      graphics: { Logo: "/components/cms/Logo#Logo", Icon: "/components/cms/Icon#Icon" },
      beforeNavLinks: ["/components/cms/BackToAdmin#BackToAdmin"],
    },
    importMap: { baseDir: path.resolve(process.cwd(), "src"), importMapFile: path.resolve(process.cwd(), "src/app/(payload)/cms/importMap.js") },
  },
  i18n: { supportedLanguages: { id, en }, fallbackLanguage: "id" },
  collections: [Posts, Koleksi, Media, Users],
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [
      ...defaultFeatures.filter((f) => f.key !== "heading"),
      HeadingFeature({ enabledHeadingSizes: ["h2", "h3"] }),
    ],
  }),
  db: sqliteAdapter({
    client: { url: process.env.CMS_DATABASE_URL || `file:${path.resolve(process.cwd(), "data/cms.db")}` },
    // Dev: skema disinkronkan otomatis. Produksi: migrasi di src/migrations dijalankan otomatis saat server start.
    migrationDir: path.resolve(process.cwd(), "src/migrations"),
    prodMigrations: migrations,
  }),
  sharp,
  typescript: { outputFile: path.resolve(process.cwd(), "src/payload-types.ts") },
  async onInit(payload) {
  // Pastikan akun bersama ada sejak awal, supaya layar "buat pengguna pertama" tidak pernah bisa dipakai orang lain.
    const { totalDocs } = await payload.count({ collection: "users" });
    if (totalDocs === 0) await payload.create({ collection: "users", data: { email: process.env.CMS_ADMIN_EMAIL || "admin@delova.id" } as never });
  },
});
