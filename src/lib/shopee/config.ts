export function shopeeConfig() {
  const test = process.env.SHOPEE_ENV === "test";
  return {
    partnerId: Number(process.env.SHOPEE_PARTNER_ID || 0),
    partnerKey: process.env.SHOPEE_PARTNER_KEY || "",
    host: process.env.SHOPEE_API_HOST || (test ? "https://partner.test-stable.shopeemobile.com" : "https://partner.shopeemobile.com"),
    redirect: process.env.SHOPEE_REDIRECT_URL || "",
  };
}

/** Mode demo: dipakai selama kredensial Shopee Open Platform belum diisi. */
export const isMock = () => !process.env.SHOPEE_PARTNER_ID || !process.env.SHOPEE_PARTNER_KEY;
