import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { AdminFrame } from "@/components/AdminFrame";
import { THEME_COOKIE } from "@/lib/admin-theme";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false } };

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) redirect("/admin/login");
  const t = (await cookies()).get(THEME_COOKIE)?.value;
  return <AdminFrame initialTheme={t === "dark" || t === "light" ? t : undefined}>{children}</AdminFrame>;
}
