import { idr } from "./format";

export const waNumber = () => (process.env.NEXT_PUBLIC_WA_NUMBER || "").replace(/\D/g, "");

export function waLink(text: string): string {
  const n = waNumber();
  return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
}

export type OrderLine = { name: string; variant?: string; qty: number; price: number };

export function orderMessage(c: { name: string; phone: string; address: string; note?: string }, lines: OrderLine[], total: number): string {
  const items = lines
    .map((l, i) => `${i + 1}. ${l.name}${l.variant ? ` (${l.variant})` : ""} x${l.qty} — ${idr(l.price * l.qty)}`)
    .join("\n");
  return [
    "Halo Delova, saya mau order:",
    "",
    items,
    "",
    `Total: ${idr(total)} (belum ongkir)`,
    "",
    `Nama: ${c.name}`,
    `WhatsApp: ${c.phone}`,
    `Alamat: ${c.address}`,
    c.note ? `Catatan: ${c.note}` : "",
  ]
    .filter((x, i, a) => x !== "" || a[i - 1] !== "")
    .join("\n");
}
