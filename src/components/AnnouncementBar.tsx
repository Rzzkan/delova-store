export function AnnouncementBar({ messages }: { messages: string[] }) {
  const row = [...messages, ...messages];
  if (!messages.length) return null;
  return (
    <div className="overflow-hidden bg-brand py-2 text-xs tracking-wide text-cream" role="note">
      <div className="marquee flex w-max gap-12 whitespace-nowrap">
        {row.map((m, i) => (<span key={i} className="flex items-center gap-12">{m}<span className="text-accent-light" aria-hidden>✦</span></span>))}
      </div>
    </div>
  );
}
