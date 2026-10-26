import type { Metadata } from "next";
import Link from "next/link";
import { Shell } from "@/components/Shell";
import { CATEGORIES } from "@/lib/categories";
import { breadcrumbLd, CATEGORY_SEO, ldScript } from "@/lib/seo";
import { listKoleksi } from "@/lib/cms";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: { absolute: "Koleksi — Kebaya, Batik, Gamis, Hijab & Busana Anak | Delova" },
  description: "Jelajahi koleksi Delova per kategori: kebaya modern, batik, gamis, hijab, busana anak, dan fashion harian.",
  alternates: { canonical: "/koleksi" },
};

export default async function KoleksiIndex() {
  const custom = await listKoleksi();
  const customSlugs = new Set(custom.map((c) => c.slug));
  const auto = CATEGORIES.filter((c) => !customSlugs.has(c.slug)).map((c) => ({ slug: c.slug, title: CATEGORY_SEO[c.slug]?.h1 ?? c.label, summary: c.blurb }));
  const all = [...custom.map((c) => ({ slug: c.slug, title: c.title, summary: c.summary ?? "" })), ...auto];
  return (
    <Shell>
      <div className="container-x py-10">
        <script type="application/ld+json" dangerouslySetInnerHTML={ldScript(breadcrumbLd([{ name: "Beranda", url: "/" }, { name: "Koleksi", url: "/koleksi" }]))} />
        <p className="eyebrow">Jelajahi</p>
        <h1 className="mt-2 text-4xl font-semibold">Koleksi Delova</h1>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {all.map((c) => (
            <li key={c.slug}>
              <Link href={`/koleksi/${c.slug}`} className="block h-full rounded-2xl border border-sand bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-lg">
                <h2 className="text-xl">{c.title}</h2>
                {c.summary && <p className="mt-2 line-clamp-3 text-sm text-ink/65">{c.summary}</p>}
                <span className="mt-4 inline-block text-sm font-medium text-brand">Lihat produk →</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </Shell>
  );
}
