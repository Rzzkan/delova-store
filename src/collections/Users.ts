import type { CollectionConfig } from "payload";

/** Akun yang boleh masuk ke /cms. */
export const Users: CollectionConfig = {
  slug: "users",
  labels: { singular: "Pengguna", plural: "Pengguna" },
  auth: true,
  admin: { useAsTitle: "email", group: "Pengaturan" },
  fields: [],
};
