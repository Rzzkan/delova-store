import { getHome } from "@/lib/settings";

export async function AnnouncementBar() {
  const { announcements } = await getHome();
  const row = [...announcements, ...announcements];
  return (
    <div className="overflow-hidden bg-maroon py-2 text-xs tracking-wide text-cream" role="note">
      <div className="marquee flex w-max gap-12 whitespace-nowrap">
        {row.map((m, i) => (<span key={i} className="flex items-center gap-12">{m}<span className="text-gold-light" aria-hidden>✦</span></span>))}
      </div>
    </div>
  );
}
