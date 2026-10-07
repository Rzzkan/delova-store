import Link from "next/link";
export default function NotFound() {
  return (
    <div className="container-x py-32 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-3 text-5xl font-semibold">Halaman tidak ditemukan</h1>
      <Link href="/produk" className="btn-primary mt-8">Lihat semua produk</Link>
    </div>
  );
}
