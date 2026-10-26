import Link from "next/link";
import { getStore } from "@/lib/store";
import { StoreEditor } from "@/components/StoreEditor";
import { Card, PageHeader } from "@/components/AdminFrame";

export const dynamic = "force-dynamic";
export const metadata = { title: "Toko Offline", robots: { index: false } };

export default async function TokoOfflineAdmin() {
  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Toko Offline" desc={<>Informasi toko fisik yang tampil di halaman <Link className="underline" href="/toko-offline">/toko-offline</Link>, footer, dan hasil pencarian Google.</>} />
      <Card><StoreEditor initial={await getStore()} /></Card>
    </div>
  );
}
