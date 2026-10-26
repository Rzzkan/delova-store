import type { Metadata } from "next";
import { Shell } from "@/components/Shell";
import { BrandHome } from "@/components/BrandHome";
import { SeoBlock } from "@/components/SeoBlock";
import { BRAND_SEO } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: { absolute: BRAND_SEO.wardrobe.title },
  description: BRAND_SEO.wardrobe.description,
  alternates: { canonical: "/" },
  openGraph: { title: BRAND_SEO.wardrobe.title, description: BRAND_SEO.wardrobe.description, url: "/", type: "website", locale: "id_ID" },
};

export default function Home() {
  return (<Shell brand="wardrobe"><BrandHome brand="wardrobe" /><SeoBlock brand="wardrobe" home /></Shell>);
}
