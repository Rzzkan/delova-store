import { allReviews } from "@/lib/reviews";
import { listProducts } from "@/lib/products";
import { AddReview, ReviewRow } from "@/components/ReviewAdmin";
import { Card, PageHeader } from "@/components/AdminFrame";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ulasan", robots: { index: false } };

export default async function Ulasan() {
  const [reviews, { items }] = await Promise.all([allReviews(200), listProducts({ limit: 200, includeHidden: true })]);
  return (
    <>
      <PageHeader title="Ulasan Unggulan" desc={<>Centang <strong>Unggulan</strong> untuk menampilkan ulasan di beranda. Jika yang dicentang kurang dari 6, sisanya diisi otomatis dengan ulasan bintang 5 yang paling informatif. Nama pembeli selalu disamarkan.</>} />
      <Card><AddReview products={items.map((p) => ({ id: p.id, name: p.name }))} /></Card>
      <Card title={`Semua ulasan (${reviews.length})`}>
        {reviews.length ? (
          <div className="overflow-x-auto"><table className="w-full text-left"><thead className="text-xs uppercase tracking-wider text-ink/50"><tr><th>Bintang</th><th>Ulasan</th><th>Unggulan</th><th>Sembunyi</th><th /></tr></thead>
            <tbody>{reviews.map((r) => (<ReviewRow key={r.id} r={r} />))}</tbody></table></div>
        ) : <p className="text-sm text-ink/50">Belum ada ulasan. Ulasan Shopee akan masuk setelah sinkron pertama, atau tambah manual di atas.</p>}
      </Card>
    </>
  );
}
