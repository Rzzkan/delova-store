import Link from "next/link";
import { redirect } from "next/navigation";
import { Shell } from "@/components/Shell";
import { isAdmin } from "@/lib/auth";
import { ImportForm } from "@/components/ImportForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Impor Excel Shopee", robots: { index: false } };

export default async function Impor() {
  if (!(await isAdmin())) redirect("/admin/login");
  return (
    <Shell>
      <div className="container-x max-w-3xl space-y-8 py-10">
        <div>
          <Link href="/admin" className="text-sm text-brand underline">← Admin</Link>
          <h1 className="mt-2 text-4xl font-semibold">Impor Excel Shopee</h1>
          <p className="mt-2 text-sm text-ink/60">Cadangan bila API Shopee belum terhubung: perbarui produk, harga, dan stok dari file Mass Update Seller Centre. Impor ulang kapan saja untuk memperbarui.</p>
        </div>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-ink/70">
          <li>Seller Centre → pilih toko → Produk Saya → <b>Mass Update</b> → tab <b>Download</b>.</li>
          <li>Buat & unduh 3 template: <b>Informasi Dasar</b>, <b>Informasi Penjualan</b>, <b>Informasi Media</b> (filter sama).</li>
          <li>Unggah ketiganya sekaligus di bawah, pilih brand, lalu <b>Cek dulu</b> sebelum <b>Impor</b>.</li>
        </ol>
        <ImportForm />
      </div>
    </Shell>
  );
}
