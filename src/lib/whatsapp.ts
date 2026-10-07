import { idr } from "./format";

export const waNumber = () => (process.env.NEXT_PUBLIC_WA_NUMBER || "").replace(/\D/g, "");
export const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export function waLink(text: string): string {
  return `https://wa.me/${waNumber()}?text=${encodeURIComponent(text)}`;
}

export type OrderLine = { name: string; variant?: string; qty: number; price: number; slug: string; image: string };

/**
 * Pesan ke admin. Link halaman pesanan ditaruh PERTAMA karena WhatsApp hanya membuat pratinjau
 * (foto + judul) untuk link pertama; halaman itu memuat semua foto produk.
 */
export function orderMessage(
  c: { name: string; phone: string; address: string; note?: string },
  lines: OrderLine[],
  total: number,
  orderNo: number,
  token: string,
): string {
  const site = siteUrl();
  const items = lines
    .map((l, i) => {
      const row = `${i + 1}. *${l.name}*${l.variant ? ` (${l.variant})` : ""}\n    ${l.qty} × ${idr(l.price)} = ${idr(l.price * l.qty)}`;
      return lines.length <= 6 ? `${row}\n    ${site}/produk/${l.slug}` : row;
    })
    .join("\n");
  return [
    `Halo Delova, saya mau order 🛍️`,
    ``,
    `Foto & detail pesanan #${orderNo}:`,
    `${site}/pesanan/${token}`,
    ``,
    items,
    ``,
    `*Total: ${idr(total)}* (belum ongkir)`,
    ``,
    `Nama: ${c.name}`,
    `WhatsApp: ${c.phone}`,
    `Alamat: ${c.address}`,
    c.note ? `Catatan: ${c.note}` : null,
  ]
    .filter((x) => x !== null)
    .join("\n");
}
