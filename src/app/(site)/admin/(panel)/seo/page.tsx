import { getSeoSettings } from "@/lib/seo-settings";
import { SeoEditor } from "@/components/SeoEditor";
import { Card, PageHeader } from "@/components/AdminFrame";

export const dynamic = "force-dynamic";
export const metadata = { title: "Identitas, Favicon & Robots.txt", robots: { index: false } };

export default async function SeoAdmin() {
  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="SEO, Favicon & Identitas" desc={<>Nama legal perusahaan, ikon tab browser, dan aturan untuk mesin pencari. Hasil robots.txt bisa dicek di <a className="underline" href="/robots.txt" target="_blank">/robots.txt</a>.</>} />
      <Card><SeoEditor initial={await getSeoSettings()} /></Card>
    </div>
  );
}
