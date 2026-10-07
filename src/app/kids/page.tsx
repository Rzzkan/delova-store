import type { Metadata } from "next";
import { Shell } from "@/components/Shell";
import { BrandHome } from "@/components/BrandHome";
import { SeoBlock } from "@/components/SeoBlock";
import { BRAND_SEO } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: { absolute: BRAND_SEO.kids.title },
  description: BRAND_SEO.kids.description,
  alternates: { canonical: "/kids" },
  openGraph: { title: BRAND_SEO.kids.title, description: BRAND_SEO.kids.description, url: "/kids", type: "website", locale: "id_ID" },
};

export default function Page() {
  return (<Shell brand="kids"><BrandHome brand="kids" /><SeoBlock brand="kids" /></Shell>);
}
