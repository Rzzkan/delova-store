import { withPayload } from "@payloadcms/next/withPayload";

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@libsql/client", "libsql"],
  poweredByHeader: false,
  // CMS tidak punya login sendiri: arahkan ke login panel toko (sesi yang sama)
  async redirects() {
    return [{ source: "/cms/login", destination: "/admin/login?next=/cms", permanent: false }];
  },
};
export default withPayload(nextConfig);
