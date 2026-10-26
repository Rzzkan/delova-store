/** Strip keunggulan di bawah hero. File murni (tanpa database) agar aman dipakai di komponen klien. */
export type TrustItem = { title: string; desc: string };
export const TRUST_DEFAULTS: TrustItem[] = [
  { title: "Sinkron Shopee", desc: "Stok & harga selalu sama dengan toko resmi" },
  { title: "Dua Cara Beli", desc: "Checkout WhatsApp atau langsung di Shopee" },
  { title: "Kirim Nusantara", desc: "Dikemas rapi, dikirim ke seluruh Indonesia" },
  { title: "Admin Ramah", desc: "Tanya ukuran & bahan via WhatsApp" },
];
export const TRUST_MAX = 6;

/** Kunci tidak ada = bawaan; array kosong = disembunyikan. */
export function trustFor(h: { trust: Record<string, TrustItem[]> }, brand: string): TrustItem[] {
  const t = h.trust[brand];
  return Array.isArray(t) ? t : TRUST_DEFAULTS;
}
