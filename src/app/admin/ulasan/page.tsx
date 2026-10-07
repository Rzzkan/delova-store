import Link from "next/link";
import { Shell } from "@/components/Shell";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { allReviews } from "@/lib/reviews";
import { listProducts } from "@/lib/products";
import { AddReview, ReviewRow } from "@/components/ReviewAdmin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ulasan", robots: { index: false } };

export default async function Ulasan() {
  if (!(await isAdmin())) redirect("/admin/login");
  const [reviews, { items }] = await Promise.all([allReviews(200), listProducts({ limit: 200, includeHidden: true })]);
  return (
    <Shell>
    <div className="container-x space-y-8 py-10">
      <div><Link href="/admin" className="text-sm text-brand underline">← Admin</Link><h1 className="mt-2 text-4xl font-semibold">Ulasan Unggulan</h1>
        <p className="mt-2 text-sm text-ink/60">Centang <strong>Unggulan</strong> untuk menampilkan ulasan di beranda. Jika yang dicentang kurang dari 6, sisanya diisi otomatis dengan ulasan bintang 5 yang paling informatif. Nama pembeli selalu disamarkan.</p></div>
      <AddReview products={items.map((p) => ({ id: p.id, name: p.name }))} />
      {reviews.length ? (
        <div className="overflow-x-auto"><table className="w-full text-left"><thead className="text-xs uppercase tracking-wider text-ink/50"><tr><th className="py-2">Bintang</th><th>Ulasan</th><th>Unggulan</th><th>Sembunyi</th><th /></tr></thead>
          <tbody>{reviews.map((r) => (<ReviewRow key={r.id} r={r} />))}</tbody></table></div>
      ) : <p className="text-sm text-ink/50">Belum ada ulasan. Ulasan Shopee akan masuk setelah sinkron pertama, atau tambah manual di atas.</p>}
    </div>
    </Shell>
  );
}
