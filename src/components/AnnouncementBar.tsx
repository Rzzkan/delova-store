const MSGS = [
  "Stok & harga tersinkron langsung dengan toko Shopee Delova",
  "Gratis ongkir & garansi Shopee untuk pembelian lewat Shopee",
  "Order via WhatsApp: dilayani admin ramah, kirim ke seluruh Indonesia",
  "Kebaya • Batik • Hijab • Delova Kids",
];
export function AnnouncementBar() {
  const row = [...MSGS, ...MSGS];
  return (
    <div className="overflow-hidden bg-maroon py-2 text-xs tracking-wide text-cream" role="note">
      <div className="marquee flex w-max gap-12 whitespace-nowrap">
        {row.map((m, i) => (<span key={i} className="flex items-center gap-12">{m}<span className="text-gold-light" aria-hidden>✦</span></span>))}
      </div>
    </div>
  );
}
