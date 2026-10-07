/* eslint-disable @typescript-eslint/no-explicit-any */
type W = { fbq?: (...a: any[]) => void; ttq?: { track: (...a: any[]) => void; page?: () => void }; gtag?: (...a: any[]) => void };

export type TrackEvent = "ViewContent" | "AddToCart" | "InitiateCheckout" | "Lead" | "ShopeeClick";

/** Kirim event ke Meta Pixel, TikTok Pixel, dan Google Analytics 4 (yang aktif saja). */
export function track(event: TrackEvent, data: { content_ids?: string[]; content_name?: string; value?: number; num_items?: number } = {}) {
  if (typeof window === "undefined") return;
  const w = window as unknown as W;
  // Skrip pixel dimuat setelah hidrasi; event yang terlalu awal (mis. ViewContent) ditunda sampai salah satu siap.
  if (!w.fbq && !w.ttq && !w.gtag) {
    let tries = 0;
    const t = setInterval(() => {
      const x = window as unknown as W;
      if (x.fbq || x.ttq || x.gtag) { clearInterval(t); setTimeout(() => send(event, data), 400); }
      else if (++tries > 25) clearInterval(t); // tidak ada pixel aktif
    }, 200);
    return;
  }
  send(event, data);
}

function send(event: TrackEvent, data: { content_ids?: string[]; content_name?: string; value?: number; num_items?: number }) {
  const w = window as unknown as W;
  const common = { currency: "IDR", ...data };
  try {
    // Meta
    if (event === "ShopeeClick") w.fbq?.("trackCustom", "ShopeeClick", common);
    else w.fbq?.("track", event, { ...common, content_type: "product" });
    // TikTok
    const tt = { ViewContent: "ViewContent", AddToCart: "AddToCart", InitiateCheckout: "InitiateCheckout", Lead: "SubmitForm", ShopeeClick: "ClickButton" }[event];
    w.ttq?.track(tt, { ...common, content_type: "product", contents: (data.content_ids ?? []).map((id) => ({ content_id: id, content_name: data.content_name })) });
    // GA4
    const items = (data.content_ids ?? []).map((id) => ({ item_id: id, item_name: data.content_name, price: data.value, quantity: 1 }));
    const ga = {
      ViewContent: ["view_item", { currency: "IDR", value: data.value, items }],
      AddToCart: ["add_to_cart", { currency: "IDR", value: data.value, items }],
      InitiateCheckout: ["begin_checkout", { currency: "IDR", value: data.value }],
      Lead: ["generate_lead", { currency: "IDR", value: data.value }],
      ShopeeClick: ["click_shopee", { item_id: data.content_ids?.[0], item_name: data.content_name }],
    }[event] as [string, Record<string, unknown>];
    w.gtag?.("event", ga[0], ga[1]);
  } catch {
    /* pelacakan tidak boleh mengganggu belanja */
  }
}

/** Dipanggil saat pindah halaman (navigasi client-side Next.js tidak memuat ulang skrip). */
export function trackPageView(url: string) {
  if (typeof window === "undefined") return;
  const w = window as unknown as W;
  try {
    w.fbq?.("track", "PageView");
    w.ttq?.page?.();
    w.gtag?.("event", "page_view", { page_location: url, page_path: new URL(url).pathname });
  } catch { /* abaikan */ }
}
