import type { ReactNode } from "react";
import { BRANDS, BRAND_SLUGS, type BrandSlug } from "@/lib/brands";
import { getHome } from "@/lib/settings";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { Logo } from "./Logo";
import { AnnouncementBar } from "./AnnouncementBar";
import Link from "next/link";

/** Membungkus halaman dengan tema brand (warna, font, logo). data-brand mengatur variabel CSS. */
export async function Shell({ brand = "wardrobe", children }: { brand?: BrandSlug; children: ReactNode }) {
  const home = await getHome();
  const b = BRANDS[brand];
  const messages = brand === "wardrobe" ? home.announcements : b.announcements;
  const logo = (size?: "md" | "lg", slug: BrandSlug = brand) => <Logo brand={slug} imageUrl={home.logos[slug]} size={size} />;
  return (
    <div data-brand={brand} className="min-h-screen bg-cream text-ink">
      <AnnouncementBar messages={messages} />
      <nav aria-label="Pilih brand Delova" className="border-b border-sand bg-white">
        <ul className="container-x flex items-center gap-1 text-xs">
          {BRAND_SLUGS.map((s) => (
            <li key={s}>
              <Link href={BRANDS[s].home} aria-current={s === brand ? "page" : undefined}
                className={`flex items-center gap-2 border-b-2 px-3 py-2 transition ${s === brand ? "border-brand font-semibold text-brand" : "border-transparent text-ink/60 hover:text-ink"}`}>
                <span className="h-2 w-2 rounded-full" style={{ background: BRANDS[s].dot }} aria-hidden />{BRANDS[s].name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <Header brand={brand} nav={b.nav} logo={logo()} />
      <main>{children}</main>
      <Footer brand={brand} logo={logo("lg")} />
    </div>
  );
}
