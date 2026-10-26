import type { Metadata } from "next";
import { Shell } from "@/components/Shell";
import { BrandHome } from "@/components/BrandHome";
import { SeoBlock } from "@/components/SeoBlock";
import { BRAND_SEO } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: { absolute: BRAND_SEO.scarf.title },
  description: BRAND_SEO.scarf.description,
  alternates: { canonical: "/scarf" },
  openGraph: { title: BRAND_SEO.scarf.title, description: BRAND_SEO.scarf.description, url: "/scarf", type: "website", locale: "id_ID" },
};

export default function Page() {
  return (<Shell brand="scarf"><BrandHome brand="scarf" /><SeoBlock brand="scarf" /></Shell>);
}
