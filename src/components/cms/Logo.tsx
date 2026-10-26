/** Logo di halaman masuk Payload & sudut kiri atas: gaya panel toko. */
export function Logo() {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
      <span style={{ width: 40, height: 40, borderRadius: 12, background: "#465FFF", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 20 }}>D</span>
      <span style={{ lineHeight: 1.15 }}>
        <span style={{ display: "block", fontWeight: 600, fontSize: 18 }}>Delova CMS</span>
        <span style={{ display: "block", fontSize: 12, opacity: 0.6 }}>Blog, panduan &amp; koleksi</span>
      </span>
    </span>
  );
}
