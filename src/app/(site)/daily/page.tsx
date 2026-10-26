import type { Metadata } from "next";
import { Shell } from "@/components/Shell";
import { BrandHome } from "@/components/BrandHome";
import { SeoBlock } from "@/components/SeoBlock";
import { BRAND_SEO } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: { absolute: BRAND_SEO.daily.title },
  description: BRAND_SEO.daily.description,
  alternates: { canonical: "/daily" },
  openGraph: { title: BRAND_SEO.daily.title, description: BRAND_SEO.daily.description, url: "/daily", type: "website", locale: "id_ID" },
};

export default function Page() {
  return (<Shell brand="daily"><BrandHome brand="daily" /><SeoBlock brand="daily" /></Shell>);
}
