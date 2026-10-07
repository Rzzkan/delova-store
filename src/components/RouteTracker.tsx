"use client";
import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackPageView } from "@/lib/track";

/** PageView pertama sudah dikirim oleh snippet; komponen ini hanya menangani perpindahan halaman berikutnya. */
export function RouteTracker() {
  const path = usePathname();
  const sp = useSearchParams();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (path.startsWith("/admin")) return;
    trackPageView(window.location.href);
  }, [path, sp]);
  return null;
}
