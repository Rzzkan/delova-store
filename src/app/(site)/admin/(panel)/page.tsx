import { getDb } from "@/lib/db";
import { isMock } from "@/lib/shopee/config";
import { listShops } from "@/lib/products";
import { timeAgo } from "@/lib/format";
import { BRANDS } from "@/lib/brands";
import { ShopBrandSelect, SyncButton } from "@/components/AdminControls";
import { Card, PageHeader } from "@/components/AdminFrame";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard Admin", robots: { index: false } };

const num = (v: unknown) => Number(v ?? 0).toLocaleString("id-ID");

export default async function Admin({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  const sp = await searchParams;
  const db = await getDb();
  const since = Math.floor(Date.now() / 1000) - 30 * 86400;
  const [shops, stat, leadStat, logs, leads] = await Promise.all([
    listShops(),
    db.execute("SELECT COUNT(*) AS n, SUM(hidden = 0) AS shown, SUM(stock <= 0) AS soldout, SUM(featured = 1) AS featured FROM products WHERE status = 'NORMAL'"),
    db.execute({ sql: "SELECT COUNT(*) AS n, COALESCE(SUM(total), 0) AS total FROM leads WHERE created_at >= ?", args: [since] }),
    db.execute("SELECT l.*, s.name AS shop_name FROM sync_logs l LEFT JOIN shops s ON s.shop_id = l.shop_id ORDER BY l.id DESC LIMIT 8"),
    db.execute("SELECT id, created_at, name, total, token FROM leads ORDER BY id DESC LIMIT 8"),
  ]);
  const s = stat.rows[0], l = leadStat.rows[0];
  const mock = isMock() && shops.some((x) => x.isMock);
  const metrics = [
    { label: "Produk aktif", value: num(s.shown), note: `${num(s.n)} total · ${num(s.featured)} unggulan`, tone: "bg-blush text-brand" },
    { label: "Stok habis", value: num(s.soldout), note: "produk dengan stok 0", tone: "bg-[#FEF3F2] text-[#D92D20]" },
    { label: "Pesanan WhatsApp (30 hari)", value: num(l.n), note: `Rp${num(l.total)} total`, tone: "bg-[#ECFDF3] text-[#027A48]" },
    { label: "Toko terhubung", value: num(shops.length), note: shops.map((x) => BRANDS[x.brand].short).join(" · ") || "belum ada", tone: "bg-[#FFFAEB] text-[#B54708]" },
  ];

  return (
    <>
      <PageHeader title="Dashboard" desc="Ringkasan toko, sinkron Shopee, dan pesanan WhatsApp terbaru." />
      {sp.ok && <p className="rounded-xl bg-sage/20 p-3 text-sm">{sp.ok}</p>}
      {sp.err && <p role="alert" className="rounded-xl bg-blush p-3 text-sm text-brand">{sp.err}</p>}
      {mock && (
        <p className="rounded-xl border border-[#FEDF89] bg-[#FFFAEB] p-4 text-sm text-[#B54708]">
          <strong>Mode demo.</strong> Produk adalah data contoh. Isi <code>SHOPEE_PARTNER_ID</code> & <code>SHOPEE_PARTNER_KEY</code>, lalu hubungkan toko Shopee — atau pakai <a className="underline" href="/admin/impor">Impor Excel</a>.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-2xl border border-sand bg-white p-5">
            <span className={`inline-flex h-10 min-w-10 items-center justify-center rounded-xl px-2 text-sm font-semibold ${m.tone}`}>●</span>
            <p className="mt-4 text-sm text-ink/60">{m.label}</p>
            <p className="mt-1 text-3xl font-semibold">{m.value}</p>
            <p className="mt-1 truncate text-xs text-ink/50">{m.note}</p>
          </div>
        ))}
      </div>

      <Card title="Toko Shopee" action={<div className="flex items-start gap-2"><a href="/api/shopee/auth" className="btn-outline !py-2 text-sm">+ Hubungkan toko</a><SyncButton label="Sinkron semua" /></div>}>
        {shops.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {shops.map((x) => (
              <div key={x.shopId} className="rounded-xl border border-sand p-4">
                <p className="font-semibold">{x.name}</p>
                <p className="mt-0.5 text-xs text-ink/50">ID {x.shopId}</p>
                <span className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${x.authorized ? "bg-[#ECFDF3] text-[#027A48]" : "bg-[#FFFAEB] text-[#B54708]"}`}>
                  {x.isMock ? "data contoh" : x.authorized ? "API terhubung" : "impor Excel / belum diotorisasi"}
                </span>
                <ShopBrandSelect shopId={x.shopId} brand={x.brand} />
                <p className="mt-2 text-sm text-ink/70">Sinkron terakhir: {timeAgo(x.lastSyncAt)}</p>
                {!x.isMock && x.authorized && <div className="mt-3"><SyncButton shopId={x.shopId} label="Sinkron toko ini" /></div>}
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-ink/50">Belum ada toko. Hubungkan lewat API Shopee atau impor Excel.</p>}
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Pesanan WhatsApp Terbaru">
          {leads.rows.length ? (
            <ul className="divide-y divide-sand text-sm">
              {leads.rows.map((r) => (
                <li key={String(r.id)} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <span><strong>#{String(r.id)}</strong> · {String(r.name)} · Rp{Number(r.total).toLocaleString("id-ID")} <span className="text-ink/40">· {timeAgo(Number(r.created_at))}</span></span>
                  {r.token ? <a className="whitespace-nowrap font-medium text-brand hover:underline" href={`/pesanan/${String(r.token)}`}>Detail</a> : null}
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-ink/50">Belum ada pesanan.</p>}
        </Card>

        <Card title="Riwayat Sinkron">
          {logs.rows.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wider text-ink/50"><tr><th>Waktu</th><th>Toko</th><th>Status</th><th>Update</th><th>Hapus</th></tr></thead>
                <tbody>{logs.rows.map((r) => (
                  <tr key={String(r.id)} className="border-t border-sand">
                    <td className="py-2.5 pl-3">{timeAgo(Number(r.finished_at))}</td><td>{String(r.shop_name ?? r.shop_id)}</td>
                    <td><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${r.status === "ok" ? "bg-[#ECFDF3] text-[#027A48]" : "bg-[#FEF3F2] text-[#D92D20]"}`}>{String(r.status)}</span></td>
                    <td>{Number(r.upserted)}</td><td>{Number(r.removed)}</td>
                  </tr>))}</tbody>
              </table>
            </div>
          ) : <p className="text-sm text-ink/50">Belum ada sinkron.</p>}
        </Card>
      </div>
    </>
  );
}
