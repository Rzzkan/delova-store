import Link from "next/link";
import { redirect } from "next/navigation";
import { Shell } from "@/components/Shell";
import { isAdmin } from "@/lib/auth";
import { getSeoSettings } from "@/lib/seo-settings";
import { SeoEditor } from "@/components/SeoEditor";

export const dynamic = "force-dynamic";
export const metadata = { title: "Favicon & Robots.txt", robots: { index: false } };

export default async function SeoAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
  return (
    <Shell>
      <div className="container-x max-w-3xl space-y-8 py-10">
        <div>
          <Link href="/admin" className="text-sm text-brand underline">← Admin</Link>
          <h1 className="mt-2 text-4xl font-semibold">Favicon & Robots.txt</h1>
          <p className="mt-2 text-sm text-ink/60">Ikon tab browser dan aturan untuk mesin pencari. Hasil robots.txt bisa dicek di <a className="underline" href="/robots.txt" target="_blank">/robots.txt</a>.</p>
        </div>
        <SeoEditor initial={await getSeoSettings()} />
      </div>
    </Shell>
  );
}
