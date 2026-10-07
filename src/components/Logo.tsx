import type { BrandSlug } from "@/lib/brands";

const KIDS = ["#E84234", "#57AEA5", "#F1CC5E", "#44849F", "#86AC33", "#F96605"]; // D-E-L-O-V-A pada logo Kids

/**
 * Wordmark brand, digambar dengan teks (tajam di semua ukuran).
 * Jika admin mengunggah file logo di /admin/tampilan, gambar itu dipakai menggantikan.
 */
export function Logo({ brand, imageUrl, size = "md" }: { brand: BrandSlug; imageUrl?: string; size?: "md" | "lg" }) {
  const sc = size === "lg" ? 1.5 : 1;
  if (imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={imageUrl} alt={`Delova ${brand}`} style={{ height: 40 * sc, maxWidth: 220 * sc }} className="w-auto object-contain" />;
  }
  const big = { fontSize: 28 * sc, lineHeight: 1 };
  if (brand === "kids") {
    return (
      <span className="inline-block leading-none" role="img" aria-label="Delova Kids">
        <span className="font-display block tracking-wide" style={{ ...big, fontWeight: 700 }} aria-hidden>
          {"DELOVA".split("").map((c, i) => (<span key={i} style={{ color: KIDS[i] }}>{c}</span>))}
        </span>
        <span aria-hidden style={{ fontFamily: "Caveat, cursive", fontWeight: 700, fontSize: 17 * sc, color: "rgb(var(--ink))", display: "block", marginTop: 2 }}>Kids</span>
      </span>
    );
  }
  const sub = brand === "scarf" ? "scarf" : "wardrobe";
  return (
    <span className="inline-block leading-none" role="img" aria-label={`Delova ${sub}`}>
      <span className="block text-brand-light" style={{ ...big, fontWeight: 800, letterSpacing: "-0.01em", fontFamily: "Inter, sans-serif" }} aria-hidden>DELOVA</span>
      {/* huruf-huruf dibentangkan selebar "DELOVA", seperti pada logo */}
      <span className="mt-1 flex justify-between text-accent" style={{ fontSize: 11 * sc, fontWeight: 300 }} aria-hidden>
        {sub.split("").map((c, i) => (<span key={i}>{c}</span>))}
      </span>
    </span>
  );
}
