"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { THEME_COOKIE } from "@/lib/admin-theme";

const ICONS: Record<string, string> = {
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  box: "M21 8 12 3 3 8v8l9 5 9-5V8ZM3 8l9 5 9-5M12 13v8",
  upload: "M12 16V4m0 0L7 9m5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3",
  brush: "M4 20c3 0 5-1 5-4a3 3 0 0 0-3-3c-3 0-2 4-2 7Zm5-4L20 5l-1-1L8 15",
  star: "m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z",
  store: "M4 9 5.5 4h13L20 9M4 9h16M4 9v11h16V9M9 20v-6h6v6",
  chart: "M4 20V10m6 10V4m6 16v-8m4 8H2",
  gear: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 0-.1-1.2l2-1.5-2-3.4-2.3.9a7.5 7.5 0 0 0-2-1.2L14.600 3h-4l-.4 2.6a7.500 7.500 0 0 0-2 1.200l-2.300-.9-2 3.400 2 1.500a7.400 7.400 0 0 0 0 2.400l-2 1.500 2 3.400 2.300-.9a7.500 7.500 0 0 0 2 1.200l.4 2.600h4l.4-2.600a7.500 7.500 0 0 0 2-1.200l2.300.9 2-3.400-2-1.500c.1-.4.100-.8.100-1.200Z",
  out: "M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 16l-4-4 4-4M6 12h10",
  menu: "M4 7h16M4 12h16M4 17h16",
  x: "M6 6l12 12M18 6 6 18",
  sun: "M12 4V2m0 20v-2M4 12H2m20 0h-2M6 6 4.600 4.600M19.400 19.400 18 18M6 18l-1.400 1.400M19.400 4.600 18 6M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
  moon: "M20 14.500A8 8 0 0 1 9.500 4a8 8 0 1 0 10.500 10.500Z",
  ext: "M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5",
};
export const Icon = ({ n, size = 20 }: { n: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={ICONS[n]} /></svg>
);

const GROUPS: { title: string; items: { href: string; label: string; icon: string }[] }[] = [
  { title: "Menu", items: [
    { href: "/admin", label: "Dashboard", icon: "grid" },
    { href: "/admin/produk", label: "Produk", icon: "box" },
    { href: "/admin/impor", label: "Impor Excel Shopee", icon: "upload" },
  ] },
  { title: "Konten", items: [
    { href: "/admin/tampilan", label: "Tampilan Beranda", icon: "brush" },
    { href: "/admin/ulasan", label: "Ulasan Unggulan", icon: "star" },
    { href: "/admin/toko-offline", label: "Toko Offline", icon: "store" },
  ] },
  { title: "Pengaturan", items: [
    { href: "/admin/pelacakan", label: "Pixel & Analytics", icon: "chart" },
    { href: "/admin/seo", label: "SEO, Favicon & Identitas", icon: "gear" },
  ] },
];

type Theme = "light" | "dark";

export function AdminFrame({ children, initialTheme }: { children: ReactNode; initialTheme?: Theme }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(initialTheme ?? "light");
  // Belum pernah memilih → ikuti pengaturan perangkat.
  useEffect(() => {
    if (!initialTheme && window.matchMedia?.("(prefers-color-scheme: dark)").matches) setTheme("dark");
  }, [initialTheme]);
  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.cookie = `${THEME_COOKIE}=${next}; path=/admin; max-age=31536000; samesite=lax`;
  }
  const active = (h: string) => (h === "/admin" ? path === "/admin" : path.startsWith(h));
  const title = GROUPS.flatMap((g) => g.items).find((i) => active(i.href))?.label ?? "Admin";
  return (
    <div data-admin data-theme={theme} className="min-h-screen bg-cream text-ink">
      {open && <button aria-label="Tutup menu" className="fixed inset-0 z-40 bg-ink/40 lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-sand bg-white transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-[72px] items-center gap-3 border-b border-sand px-6">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-lg font-bold text-white">D</span>
          <div className="leading-tight"><p className="text-base font-semibold">Delova Admin</p><p className="text-xs text-ink/50">Panel toko</p></div>
        </div>
        <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-5" aria-label="Menu admin">
          {GROUPS.map((g) => (
            <div key={g.title}>
              <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-ink/40">{g.title}</p>
              <ul className="space-y-1">
                {g.items.map((i) => (
                  <li key={i.href}>
                    <Link href={i.href} onClick={() => setOpen(false)} aria-current={active(i.href) ? "page" : undefined}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${active(i.href) ? "bg-blush text-brand" : "text-ink/70 hover:bg-cream hover:text-ink"}`}>
                      <Icon n={i.icon} />{i.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <div className="border-t border-sand p-4">
          <form action="/api/admin/logout" method="post">
            <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink/70 transition hover:bg-cream hover:text-ink"><Icon n="out" />Keluar</button>
          </form>
        </div>
      </aside>

      <div className="lg:pl-[280px]">
        <header className="sticky top-0 z-30 flex h-[72px] items-center gap-3 border-b border-sand bg-white px-4 md:px-6">
          <button className="flex h-10 w-10 items-center justify-center rounded-lg border border-sand lg:hidden" onClick={() => setOpen(true)} aria-label="Buka menu"><Icon n="menu" /></button>
          <p className="text-lg font-semibold">{title}</p>
          <div className="ml-auto flex items-center gap-2">
            <a href="/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-sand px-3.5 py-2 text-sm font-medium text-ink/70 transition hover:bg-cream"><Icon n="ext" size={16} /><span className="hidden sm:inline">Lihat situs</span></a>
            <button onClick={toggle} className="flex h-10 w-10 items-center justify-center rounded-lg border border-sand text-ink/70 transition hover:bg-cream" aria-label={theme === "dark" ? "Ganti ke mode terang" : "Ganti ke mode gelap"} title={theme === "dark" ? "Mode terang" : "Mode gelap"}>
              <Icon n={theme === "dark" ? "sun" : "moon"} size={18} />
            </button>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blush text-sm font-semibold text-brand" aria-label="Admin">A</span>
          </div>
        </header>
        <main className="mx-auto max-w-screen-2xl space-y-6 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

/** Judul halaman + keterangan, dipakai di atas isi tiap halaman admin. */
export function PageHeader({ title, desc, actions }: { title: string; desc?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="text-2xl font-semibold">{title}</h1>{desc && <p className="mt-1 max-w-3xl text-sm text-ink/60">{desc}</p>}</div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, action, children, className = "" }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`min-w-0 rounded-2xl border border-sand bg-white ${className}`}>
      {(title || action) && <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sand px-5 py-4 md:px-6"><h2 className="text-base font-semibold">{title}</h2>{action}</div>}
      <div className="p-5 md:p-6">{children}</div>
    </section>
  );
}
