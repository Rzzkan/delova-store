import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { getHome } from "@/lib/settings";
import { HomeEditor } from "@/components/HomeEditor";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tampilan Beranda", robots: { index: false } };

export default async function Tampilan() {
  if (!(await isAdmin())) redirect("/admin/login");
  return (
    <div className="container-x space-y-8 py-10">
      <div><Link href="/admin" className="text-sm text-maroon underline">← Admin</Link><h1 className="mt-2 text-5xl font-semibold">Tampilan Beranda</h1>
        <p className="mt-2 text-sm text-ink/60">Ubah foto & teks beranda tanpa menyentuh kode. Gambar diunggah ke database situs (otomatis dikecilkan).</p></div>
      <HomeEditor initial={await getHome()} />
    </div>
  );
}
