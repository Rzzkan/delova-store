import { listProducts, listShops } from "@/lib/products";
import { BRANDS } from "@/lib/brands";
import { AdminProducts } from "@/components/AdminProducts";
import { Card, PageHeader } from "@/components/AdminFrame";

export const dynamic = "force-dynamic";
export const metadata = { title: "Produk", robots: { index: false } };

export default async function ProdukAdmin() {
  const [shops, { items, total }] = await Promise.all([listShops(), listProducts({ includeHidden: true, limit: 5000, sort: "terbaru" })]);
  return (
    <>
      <PageHeader title={`Produk (${total})`} desc="Harga & stok hanya bisa diubah di Shopee. Di sini kamu mengatur tampilan: kategori, diskon, unggulan, sembunyikan." />
      <Card>
        <AdminProducts
          shops={shops.map((s) => ({ shopId: s.shopId, name: s.name, dot: BRANDS[s.brand].dot }))}
          products={items.map((p) => ({ id: p.id, shopId: p.shopId, name: p.name, price: p.price, stock: p.stock, sold: p.sold, category: p.category, hidden: p.hidden, featured: p.featured, discount: p.discountPct ?? 0 }))}
        />
      </Card>
    </>
  );
}
