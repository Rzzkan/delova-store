import { ImportForm } from "@/components/ImportForm";
import { Card, PageHeader } from "@/components/AdminFrame";

export const dynamic = "force-dynamic";
export const metadata = { title: "Impor Excel Shopee", robots: { index: false } };

export default function Impor() {
  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Impor Excel Shopee" desc="Cadangan bila API Shopee belum terhubung: perbarui produk, harga, dan stok dari file Mass Update Seller Centre. Impor ulang kapan saja untuk memperbarui." />
      <Card title="Langkah">
        <ol className="list-decimal space-y-1 pl-5 text-sm text-ink/70">
          <li>Seller Centre → pilih toko → Produk Saya → <b>Mass Update</b> → tab <b>Download</b>.</li>
          <li>Buat & unduh 3 template: <b>Informasi Dasar</b>, <b>Informasi Penjualan</b>, <b>Informasi Media</b> (filter sama).</li>
          <li>Unggah ketiganya sekaligus di bawah, pilih brand, lalu <b>Cek dulu</b> sebelum <b>Impor</b>.</li>
        </ol>
      </Card>
      <Card title="Unggah file"><ImportForm /></Card>
    </div>
  );
}
