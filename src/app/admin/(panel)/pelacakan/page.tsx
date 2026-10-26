import { getStoredTracking, getTracking } from "@/lib/tracking";
import { TrackingEditor } from "@/components/TrackingEditor";
import { Card, PageHeader } from "@/components/AdminFrame";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pixel & Analytics", robots: { index: false } };

export default async function Pelacakan() {
  const [stored, active] = await Promise.all([getStoredTracking(), getTracking()]);
  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Pixel & Analytics" desc="Tempel ID dari Meta, TikTok, dan Google — aktif langsung tanpa deploy ulang. Kosongkan untuk mematikan." />
      <Card><TrackingEditor initial={stored} active={active} /></Card>
    </div>
  );
}
