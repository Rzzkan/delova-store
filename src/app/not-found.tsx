import Link from "next/link";
import { Shell } from "@/components/Shell";
export default function NotFound() {
  return (
    <Shell>
    <div className="container-x py-32 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-3 text-4xl font-semibold">Halaman tidak ditemukan</h1>
      <Link href="/produk" className="btn-primary mt-8">Lihat semua produk</Link>
    </div>
    </Shell>
  );
}
