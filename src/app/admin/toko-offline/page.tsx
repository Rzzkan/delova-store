import Link from "next/link";
import { redirect } from "next/navigation";
import { Shell } from "@/components/Shell";
import { isAdmin } from "@/lib/auth";
import { getStore } from "@/lib/store";
import { StoreEditor } from "@/components/StoreEditor";

export const dynamic = "force-dynamic";
export const metadata = { title: "Toko Offline", robots: { index: false } };

export default async function TokoOfflineAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
  return (
    <Shell>
      <div className="container-x max-w-3xl space-y-8 py-10">
        <div>
          <Link href="/admin" className="text-sm text-brand underline">← Admin</Link>
          <h1 className="mt-2 text-4xl font-semibold">Toko Offline</h1>
          <p className="mt-2 text-sm text-ink/60">Informasi toko fisik yang tampil di halaman <Link className="underline" href="/toko-offline">/toko-offline</Link>, footer, dan hasil pencarian Google.</p>
        </div>
        <StoreEditor initial={await getStore()} />
      </div>
    </Shell>
  );
}
