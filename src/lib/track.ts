/* eslint-disable @typescript-eslint/no-explicit-any */
type W = { fbq?: (...a: any[]) => void; ttq?: { track: (...a: any[]) => void } };

/** Kirim event ke Meta Pixel & TikTok Pixel (jika aktif). */
export function track(event: "ViewContent" | "AddToCart" | "InitiateCheckout" | "Contact", data: Record<string, any> = {}) {
  if (typeof window === "undefined") return;
  const w = window as unknown as W;
  try {
    w.fbq?.("track", event, { currency: "IDR", ...data });
    const tt: Record<string, string> = { ViewContent: "ViewContent", AddToCart: "AddToCart", InitiateCheckout: "InitiateCheckout", Contact: "Contact" };
    w.ttq?.track(tt[event], { currency: "IDR", ...data });
  } catch {
    /* abaikan */
  }
}
