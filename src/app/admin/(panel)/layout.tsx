import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { AdminFrame } from "@/components/AdminFrame";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false } };

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) redirect("/admin/login");
  return <AdminFrame>{children}</AdminFrame>;
}
