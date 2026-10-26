import { getHome } from "@/lib/settings";
import { HomeEditor } from "@/components/HomeEditor";
import { PageHeader } from "@/components/AdminFrame";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tampilan Beranda", robots: { index: false } };

export default async function Tampilan() {
  return (
    <>
      <PageHeader title="Tampilan Beranda" desc="Ubah foto & teks beranda tanpa menyentuh kode. Gambar diunggah ke database situs (otomatis dikecilkan)." />
      <HomeEditor initial={await getHome()} />
    </>
  );
}
