import type { CollectionConfig } from "payload";
import { hasAdminSession } from "@/lib/admin-session";

/**
 * Akun CMS. Tidak ada login terpisah: siapa pun yang sudah masuk ke panel toko (/admin) otomatis masuk ke /cms
 * dengan password admin yang sama. Satu akun CMS dipakai bersama.
 */
export const Users: CollectionConfig = {
  slug: "users",
  labels: { singular: "Pengguna", plural: "Pengguna" },
  auth: {
    disableLocalStrategy: { enableFields: true, optionalPassword: true },
    strategies: [
      {
        name: "delova-admin",
        authenticate: async ({ payload, headers }) => {
          if (!hasAdminSession(headers.get("cookie"))) return { user: null };
          const found = await payload.find({ collection: "users", limit: 1, sort: "id", depth: 0, overrideAccess: true });
          const doc = found.docs[0] ?? (await payload.create({ collection: "users", data: { email: process.env.CMS_ADMIN_EMAIL || "admin@delova.id" } as never, overrideAccess: true }));
          return { user: { ...doc, collection: "users" } as never };
        },
      },
    ],
  },
  admin: { useAsTitle: "email", group: "Pengaturan", hidden: true },
  fields: [],
};
