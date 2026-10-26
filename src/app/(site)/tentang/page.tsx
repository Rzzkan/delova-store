import type { Metadata } from "next";
import Link from "next/link";
import { Shell } from "@/components/Shell";
import { BRANDS, BRAND_SLUGS } from "@/lib/brands";
import { getSeoSettings } from "@/lib/seo-settings";
import { abs, breadcrumbLd, ldScript, organizationLd } from "@/lib/seo";
import { getStore } from "@/lib/store";
import { waNumber } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { legalName } = await getSeoSettings();
  const title = `Tentang Kami — ${legalName} (Delova)`;
  const description = `Delova dikelola oleh ${legalName}: busana wastra modern — kebaya, batik, gamis, hijab, dan Delova Kids. Toko resmi di Shopee dan toko offline di Yogyakarta.`;
  return { title: { absolute: title }, description: description.slice(0, 160), alternates: { canonical: "/tentang" }, openGraph: { title, description: description.slice(0, 160), url: "/tentang" } };
}

export default async function Tentang() {
  const [{ legalName }, store] = await Promise.all([getSeoSettings(), getStore()]);
  const wa = waNumber();
  return (
    <Shell>
      <div className="container-x max-w-3xl py-12">
        <script type="application/ld+json" dangerouslySetInnerHTML={ldScript(organizationLd(legalName))} />
        <script type="application/ld+json" dangerouslySetInnerHTML={ldScript(breadcrumbLd([{ name: "Beranda", url: "/" }, { name: "Tentang Kami", url: "/tentang" }]))} />
        <p className="eyebrow">Tentang Kami</p>
        <h1 className="mt-2 text-4xl font-semibold">{legalName}</h1>
        <p className="mt-4 text-sm leading-relaxed text-ink/75">
          Situs <strong>{abs("/").replace(/\/$/, "")}</strong> dioperasikan oleh <strong>{legalName}</strong>, pemilik dan pengelola brand <strong>Delova</strong> —
          busana wastra Indonesia modern: kebaya, batik, gamis, hijab, busana anak, dan fashion harian. Pesanan dilayani lewat toko resmi kami di Shopee atau lewat WhatsApp admin.
        </p>

        <h2 className="mt-10 text-xl font-semibold">Brand di bawah {legalName}</h2>
        <ul className="mt-3 divide-y divide-sand rounded-2xl border border-sand bg-white text-sm">
          {BRAND_SLUGS.map((b) => (
            <li key={b} className="flex flex-wrap items-center justify-between gap-2 p-4">
              <Link className="font-medium hover:text-brand" href={b === "wardrobe" ? "/" : `/${b}`}>{BRANDS[b].name}</Link>
              <a className="text-brand underline" href={BRANDS[b].shopeeUrl} target="_blank" rel="noopener noreferrer">Toko Shopee resmi</a>
            </li>
          ))}
        </ul>

        <h2 className="mt-10 text-xl font-semibold">Hubungi kami</h2>
        <ul className="mt-3 space-y-2 text-sm text-ink/75">
          {wa && <li>WhatsApp admin: <a className="underline" href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer">+{wa}</a></li>}
          {store.enabled && <li>Toko offline: <Link className="underline" href="/toko-offline">{store.name}</Link>{store.address ? ` — ${store.address.replace(/\s+/g, " ")}` : ""}</li>}
          <li>Instagram: <a className="underline" href="https://www.instagram.com/delovawardrobe" target="_blank" rel="noopener noreferrer">@delovawardrobe</a> · TikTok: <a className="underline" href="https://www.tiktok.com/@delovawardrobe" target="_blank" rel="noopener noreferrer">@delovawardrobe</a></li>
        </ul>
        <p className="mt-10 text-xs text-ink/50">© {new Date().getFullYear()} {legalName}. Seluruh hak cipta dilindungi.</p>
      </div>
    </Shell>
  );
}
