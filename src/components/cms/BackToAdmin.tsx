"use client";
import { useEffect, useState } from "react";

const COOKIE = "payload-theme"; // sama dengan panel toko (/admin)

/** Di atas menu CMS: kembali ke panel toko, ganti tema (terang/gelap, selaras dengan /admin), dan keluar. */
export function BackToAdmin() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    const t = document.documentElement.getAttribute("data-theme");
    setTheme(t === "dark" ? "dark" : "light");
  }, []);
  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    document.cookie = `${COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
  }
  return (
    <div className="delova-nav-top">
      <a href="/admin" className="delova-nav-back">← Panel Toko</a>
      <a href="/admin/tampilan" className="delova-nav-back">Tampilan Beranda</a>
      <button type="button" onClick={toggle} className="delova-nav-back" aria-label="Ganti tema">{theme === "dark" ? "☀ Mode terang" : "☾ Mode gelap"}</button>
      <form action="/api/admin/logout" method="post"><button type="submit" className="delova-nav-back delova-nav-out">Keluar</button></form>
    </div>
  );
}
