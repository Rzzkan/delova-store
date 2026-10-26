import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Shell } from "@/components/Shell";
import { getDb } from "@/lib/db";
import { idr } from "@/lib/format";
import { waLink } from "@/lib/whatsapp";
import type { OrderLine } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";
type P = Promise<{ token: string }>;

async function load(token: string) {
  if (!/^[A-Za-z0-9_-]{10,40}$/.test(token)) return null;
  const db = await getDb();
  const r = await db.execute({ sql: "SELECT id, created_at, name, items, total FROM leads WHERE token = ?", args: [token] });
  if (!r.rows.length) return null;
  const x = r.rows[0];
  return { id: Number(x.id), createdAt: Number(x.created_at), name: String(x.name), total: Number(x.total), lines: JSON.parse(String(x.items)) as OrderLine[] };
}

/** og:image = foto produk pertama → WhatsApp menampilkannya sebagai pratinjau saat link dibagikan. */
export async function generateMetadata({ params }: { params: P }): Promise<Metadata> {
  const o = await load((await params).token);
  if (!o) return { robots: { index: false } };
  const title = `Pesanan #${o.id} — ${o.lines.length} produk · ${idr(o.total)}`;
  return {
    title,
    robots: { index: false, follow: false },
    openGraph: { title, description: o.lines.map((l) => `${l.name} ×${l.qty}`).join(", ").slice(0, 200), images: o.lines[0]?.image ? [o.lines[0].image] : [] },
  };
}

export default async function OrderPage({ params }: { params: P }) {
  const o = await load((await params).token);
  if (!o) notFound();
  return (
    <Shell>
    <div className="container-x max-w-3xl py-10">
      <p className="eyebrow">Pesanan #{o.id}</p>
      <h1 className="mt-2 text-4xl font-semibold">Detail Pesanan</h1>
      <p className="mt-2 text-sm text-ink/60">Atas nama {o.name} · {new Date(o.createdAt * 1000).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</p>
      <ul className="mt-8 divide-y divide-sand rounded-3xl border border-sand bg-white">
        {o.lines.map((l, i) => (
          <li key={i} className="flex gap-4 p-5">
            <Link href={`/produk/${l.slug}`} className="h-32 w-24 flex-none overflow-hidden rounded-xl bg-sand">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {l.image && <img src={l.image} alt={l.name} className="h-full w-full object-cover" />}
            </Link>
            <div className="flex-1">
              <Link href={`/produk/${l.slug}`} className="font-medium hover:text-brand">{l.name}</Link>
              {l.variant && <p className="text-sm text-ink/60">Varian: {l.variant}</p>}
              <p className="mt-2 text-sm">{l.qty} × {idr(l.price)}</p>
              <p className="font-medium text-brand">{idr(l.price * l.qty)}</p>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex justify-between rounded-2xl bg-white p-5 text-lg"><span>Total (belum ongkir)</span><strong className="text-brand">{idr(o.total)}</strong></div>
      <a className="btn-primary mt-6" href={waLink(`Halo Delova, saya mau menanyakan pesanan #${o.id}`)}>Tanya admin via WhatsApp</a>
    </div>
    </Shell>
  );
}
