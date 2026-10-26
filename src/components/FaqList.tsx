export function FaqList({ faq, title = "Pertanyaan yang Sering Ditanyakan" }: { faq: { q: string; a: string }[]; title?: string }) {
  if (!faq.length) return null;
  return (
    <section className="mt-14" aria-labelledby="faq-h">
      <h2 id="faq-h" className="text-2xl">{title}</h2>
      <div className="mt-5 divide-y divide-sand rounded-2xl border border-sand bg-white">
        {faq.map((f, i) => (
          <details key={i} className="group p-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold">{f.q}<span className="text-brand transition group-open:rotate-45" aria-hidden>+</span></summary>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink/75">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
