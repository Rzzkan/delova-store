import { Shell } from "@/components/Shell";
import { BrandHome } from "@/components/BrandHome";

export const dynamic = "force-dynamic";

export default function Home() {
  return (<Shell brand="wardrobe"><BrandHome brand="wardrobe" /></Shell>);
}
