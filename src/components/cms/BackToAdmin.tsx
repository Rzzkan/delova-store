/** Di atas menu CMS: kembali ke panel toko dan keluar (satu sesi dengan /admin). */
export function BackToAdmin() {
  return (
    <div className="delova-nav-top">
      <a href="/admin" className="delova-nav-back">← Panel Toko</a>
      <a href="/admin/tampilan" className="delova-nav-back">Tampilan Beranda</a>
      <form action="/api/admin/logout" method="post"><button type="submit" className="delova-nav-back delova-nav-out">Keluar</button></form>
    </div>
  );
}
