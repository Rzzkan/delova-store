import { withPayload } from "@payloadcms/next/withPayload";

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@libsql/client", "libsql"],
  poweredByHeader: false,
};
export default withPayload(nextConfig);
