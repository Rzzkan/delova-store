import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Shell } from "@/components/Shell";
import { getStore } from "@/lib/store";
import { abs, breadcrumbLd, ldScript, organizationLd } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getStore();
  const title = `${s.name} — Toko Offline Delova${s.address ? ", Yogyakarta" : ""}`;
  const description = `Kunjungi ${s.name}${s.address ? ` di ${s.address.replace(/\s+/g, " ").slice(0, 90)}` : ""}. Lihat langsung kebaya, batik, hijab, dan busana anak Delova.`;
  return { title: { absolute: title }, description: description.slice(0, 160), alternates: { canonical: "/toko-offline" }, openGraph: { title, description: description.slice(0, 160), url: "/toko-offline" } };
}

export default async function TokoOffline() {
  const s = await getStore();
  if (!s.enabled) notFound();
  const wa = s.phone.replace(/\D/g, "").replace(/^0/, "62");
  const lines = s.hours.split("\n").map((l) => l.trim()).filter(Boolean);
  const ld = {
    "@context": "https://schema.org",
    "@type": "ClothingStore",
    name: s.name,
    url: abs("/toko-offline"),
    ...(s.image ? { image: abs(s.image) } : {}),
    ...(s.phone ? { telephone: s.phone } : {}),
    ...(s.address ? { address: { "@type": "PostalAddress", streetAddress: s.address, addressCountry: "ID" } } : {}),
    ...(s.mapsUrl ? { hasMap: s.mapsUrl } : {}),
    ...(lines.length ? { openingHours: lines } : {}),
    parentOrganization: { "@type": "Organization", name: "Delova", url: abs("/") },
  };
  return (
    <Shell>
      <div className="container-x max-w-4xl py-12">
        <script type="application/ld+json" dangerouslySetInnerHTML={ldScript(ld)} />
        <script type="application/ld+json" dangerouslySetInnerHTML={ldScript(breadcrumbLd([{ name: "Beranda", url: "/" }, { name: "Toko Offline", url: "/toko-offline" }]))} />
        <script type="application/ld+json" dangerouslySetInnerHTML={ldScript(organizationLd())} />
        <p className="eyebrow">Toko Offline</p>
        <h1 className="mt-2 text-4xl font-semibold">{s.name}</h1>
        {s.note && <p className="mt-3 max-w-2xl text-ink/70">{s.note}</p>}

        {s.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.image} alt={`Tampak ${s.name}`} className="mt-8 aspect-video w-full rounded-3xl object-cover" />
        )}

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <section className="rounded-3xl border border-sand bg-white p-6">
            <h2 className="text-lg font-semibold">Alamat</h2>
            <p className="mt-2 whitespace-pre-line text-sm text-ink/70">{s.address || "Alamat lengkap tersedia di Google Maps."}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              {s.mapsUrl && <a className="btn-primary" href={s.mapsUrl} target="_blank" rel="noopener noreferrer">Buka di Google Maps</a>}
              {wa.length >= 9 && <a className="btn-outline" href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer">Chat WhatsApp</a>}
            </div>
          </section>
          <section className="rounded-3xl border border-sand bg-white p-6">
            <h2 className="text-lg font-semibold">Jam Buka</h2>
            {lines.length ? (
              <ul className="mt-2 space-y-1 text-sm text-ink/70">{lines.map((l) => (<li key={l}>{l}</li>))}</ul>
            ) : (
              <p className="mt-2 text-sm text-ink/70">Cek jam buka terbaru di Google Maps.</p>
            )}
            {s.phone && <p className="mt-4 text-sm"><span className="text-ink/50">Telepon:</span> <a className="underline" href={`tel:${s.phone.replace(/\s/g, "")}`}>{s.phone}</a></p>}
          </section>
        </div>

        {s.embedUrl && (
          <iframe title={`Peta ${s.name}`} src={s.embedUrl} className="mt-8 h-80 w-full rounded-3xl border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
        )}
      </div>
    </Shell>
  );
}
