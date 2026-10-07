import Link from "next/link";
import { redirect } from "next/navigation";
import { Shell } from "@/components/Shell";
import { isAdmin } from "@/lib/auth";
import { getStoredTracking, getTracking } from "@/lib/tracking";
import { TrackingEditor } from "@/components/TrackingEditor";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pixel & Analytics", robots: { index: false } };

export default async function Pelacakan() {
  if (!(await isAdmin())) redirect("/admin/login");
  const [stored, active] = await Promise.all([getStoredTracking(), getTracking()]);
  return (
    <Shell>
      <div className="container-x max-w-3xl space-y-8 py-10">
        <div>
          <Link href="/admin" className="text-sm text-brand underline">← Admin</Link>
          <h1 className="mt-2 text-4xl font-semibold">Pixel & Analytics</h1>
          <p className="mt-2 text-sm text-ink/60">Tempel ID dari Meta, TikTok, dan Google — aktif langsung tanpa deploy ulang. Kosongkan untuk mematikan.</p>
        </div>
        <TrackingEditor initial={stored} active={active} />
      </div>
    </Shell>
  );
}
