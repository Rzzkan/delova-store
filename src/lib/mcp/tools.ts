/* eslint-disable @typescript-eslint/no-explicit-any */
import { revalidatePath } from "next/cache";
import { getPayload } from "payload";
import config from "@payload-config";
import { lexicalToMarkdown, markdownToLexical } from "./markdown";
import { BRAND_SLUGS } from "@/lib/brands";
import { CATEGORIES } from "@/lib/categories";
import { abs, siteUrl } from "@/lib/seo";
import { getHome, saveHome, type HomeSettings } from "@/lib/settings";
import { getStore, saveStore, type StoreInfo } from "@/lib/store";
import { trustFor, TRUST_MAX } from "@/lib/trust";

export type ToolDef = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: Record<string, unknown>;
  handler: (args: Record<string, any>) => Promise<unknown>;
};

/* ───────────── util ───────────── */
const BRANDS_ALL = ["semua", ...BRAND_SLUGS];
const CAT_SLUGS = CATEGORIES.map((c) => c.slug) as string[];
const bad = (m: string): never => { throw new Error(m); };
const str = (v: unknown, max: number, label: string) => {
  if (typeof v !== "string") bad(`${label} harus berupa teks`);
  return (v as string).trim().slice(0, max);
};
const oneOf = (v: unknown, opts: string[], label: string) => (opts.includes(String(v)) ? String(v) : bad(`${label} harus salah satu dari: ${opts.join(", ")}`));
const P = () => getPayload({ config });

const md2lex = async (_c: "posts" | "koleksi", _field: string, md: string) => markdownToLexical(md);
const lex2md = async (_c: "posts" | "koleksi", _field: string, data: any) => lexicalToMarkdown(data).markdown;

const faqIn = (v: unknown) => {
  if (!Array.isArray(v)) return bad("faq harus berupa daftar {q, a}");
  return v.slice(0, 10).map((x: any, i) => ({ q: str(x?.q, 200, `faq[${i}].q`), a: str(x?.a, 1200, `faq[${i}].a`) })).filter((x) => x.q && x.a);
};
const seoIn = (v: any) => ({
  ...(v?.metaTitle !== undefined ? { metaTitle: str(v.metaTitle, 70, "seo.metaTitle") } : {}),
  ...(v?.metaDescription !== undefined ? { metaDescription: str(v.metaDescription, 170, "seo.metaDescription") } : {}),
});
const heroId = (v: unknown) => (v === null || v === "" ? null : typeof v === "number" || /^\d+$/.test(String(v)) ? Number(v) : bad("hero_image_id harus angka (lihat tool media_list)"));
const cmsLink = (c: string, id: unknown) => `${siteUrl()}/cms/collections/${c}/${id}`;

const faqSchema = { type: "array", maxItems: 10, description: "Tanya jawab (tampil di halaman + schema FAQ untuk Google)", items: { type: "object", properties: { q: { type: "string" }, a: { type: "string" } }, required: ["q", "a"] } };
const seoSchema = { type: "object", description: "Judul/deskripsi untuk Google (kosong = otomatis)", properties: { metaTitle: { type: "string", description: "maks ±60 huruf" }, metaDescription: { type: "string", description: "maks ±155 huruf" } } };
const statusSchema = { type: "string", enum: ["draft", "published"], description: "draft = belum tampil di situs; published = tayang" };

/* ───────────── Blog ───────────── */
const postRow = (d: any) => ({ id: d.id, title: d.title, slug: d.slug, type: d.type, brand: d.brand, status: d._status, published_at: d.publishedAt, updated_at: d.updatedAt, url: d._status === "published" ? abs(`/blog/${d.slug}`) : null, cms_url: cmsLink("posts", d.id) });

async function findOne(collection: "posts" | "koleksi", a: Record<string, any>) {
  const payload = await P();
  if (a.id !== undefined && a.id !== "") return payload.findByID({ collection, id: a.id, depth: 0, overrideAccess: true, draft: false });
  if (a.slug) {
    const r = await payload.find({ collection, where: { slug: { equals: String(a.slug) } }, limit: 1, depth: 0, overrideAccess: true, draft: false });
    return r.docs[0] ?? bad(`Tidak ada ${collection === "posts" ? "artikel" : "halaman koleksi"} dengan slug "${a.slug}"`);
  }
  return bad("Isi id atau slug");
}

async function postData(a: Record<string, any>, creating: boolean) {
  const d: Record<string, any> = {};
  if (a.title !== undefined) d.title = str(a.title, 200, "title");
  if (a.slug !== undefined) d.slug = str(a.slug, 80, "slug");
  if (a.type !== undefined) d.type = oneOf(a.type, ["blog", "panduan"], "type");
  if (a.brand !== undefined) d.brand = oneOf(a.brand, BRANDS_ALL, "brand");
  if (a.excerpt !== undefined) d.excerpt = str(a.excerpt, 220, "excerpt");
  if (a.published_at !== undefined) d.publishedAt = a.published_at ? new Date(str(a.published_at, 40, "published_at")).toISOString() : null;
  if (a.hero_image_id !== undefined) d.heroImage = heroId(a.hero_image_id);
  if (a.faq !== undefined) d.faq = faqIn(a.faq);
  if (a.seo !== undefined) d.seo = seoIn(a.seo);
  if (a.related !== undefined) {
    d.related = {
      ...(a.related?.category !== undefined ? { category: a.related.category ? oneOf(a.related.category, CAT_SLUGS, "related.category") : "" } : {}),
      ...(a.related?.keyword !== undefined ? { keyword: str(a.related.keyword, 60, "related.keyword") } : {}),
    };
  }
  if (a.content_markdown !== undefined) d.content = await md2lex("posts", "content", str(a.content_markdown, 60000, "content_markdown"));
  if (a.status !== undefined) d._status = oneOf(a.status, ["draft", "published"], "status");
  else if (creating) d._status = "draft";
  if (creating) for (const k of ["title", "excerpt", "content"]) if (d[k] === undefined) bad(`${k === "content" ? "content_markdown" : k} wajib diisi`);
  return d;
}

const postFields = {
  title: { type: "string", description: "Judul artikel" },
  slug: { type: "string", description: "Alamat URL (huruf kecil-tanda-hubung). Kosong = dibuat dari judul" },
  type: { type: "string", enum: ["blog", "panduan"] },
  brand: { type: "string", enum: BRANDS_ALL, description: "Untuk toko mana (semua = tampil di semua toko)" },
  excerpt: { type: "string", description: "Ringkasan ≤220 huruf (tampil di daftar & Google)" },
  content_markdown: { type: "string", description: "Isi artikel dalam Markdown. Judul bagian pakai ## dan ###; mendukung **tebal**, *miring*, daftar, kutipan, tautan [teks](url)" },
  faq: faqSchema,
  related: { type: "object", description: "Produk terkait di akhir artikel", properties: { category: { type: "string", enum: ["", ...CAT_SLUGS] }, keyword: { type: "string", description: "Kata dalam nama produk, mis. pashmina" } } },
  seo: seoSchema,
  hero_image_id: { type: ["integer", "null"], description: "ID foto dari media_list (null = hapus)" },
  published_at: { type: "string", description: "Tanggal terbit ISO (opsional; otomatis saat terbit)" },
  status: statusSchema,
};

/* ───────────── Koleksi ───────────── */
const kolRow = (d: any) => ({ id: d.id, title: d.title, slug: d.slug, brand: d.brand, category: d.category || null, keyword: d.keyword || null, status: d._status, updated_at: d.updatedAt, url: d._status === "published" ? abs(`/koleksi/${d.slug}`) : null, cms_url: cmsLink("koleksi", d.id) });

async function kolData(a: Record<string, any>, creating: boolean) {
  const d: Record<string, any> = {};
  if (a.title !== undefined) d.title = str(a.title, 200, "title");
  if (a.slug !== undefined) d.slug = str(a.slug, 80, "slug");
  if (a.brand !== undefined) d.brand = oneOf(a.brand, BRANDS_ALL, "brand");
  if (a.category !== undefined) d.category = a.category ? oneOf(a.category, CAT_SLUGS, "category") : "";
  if (a.keyword !== undefined) d.keyword = str(a.keyword, 60, "keyword");
  if (a.sort !== undefined) d.sort = oneOf(a.sort, ["terlaris", "terbaru", "termurah"], "sort");
  if (a.summary !== undefined) d.summary = str(a.summary, 260, "summary");
  if (a.hero_image_id !== undefined) d.heroImage = heroId(a.hero_image_id);
  if (a.faq !== undefined) d.faq = faqIn(a.faq);
  if (a.seo !== undefined) d.seo = seoIn(a.seo);
  if (a.intro_markdown !== undefined) d.intro = await md2lex("koleksi", "intro", str(a.intro_markdown, 20000, "intro_markdown"));
  if (a.bottom_markdown !== undefined) d.bottom = await md2lex("koleksi", "bottom", str(a.bottom_markdown, 40000, "bottom_markdown"));
  if (a.status !== undefined) d._status = oneOf(a.status, ["draft", "published"], "status");
  else if (creating) d._status = "draft";
  if (creating && !d.title) bad("title wajib diisi");
  return d;
}
const kolFields = {
  title: { type: "string", description: "Judul halaman (H1), mis. Hijab Pashmina Viscose" },
  slug: { type: "string", description: "Alamat /koleksi/<slug>. Memakai nama kategori bawaan (mis. kebaya) menimpa halaman otomatisnya" },
  brand: { type: "string", enum: BRANDS_ALL, description: "Produk dari toko mana" },
  category: { type: "string", enum: ["", ...CAT_SLUGS], description: "Batasi ke satu kategori (kosong = semua)" },
  keyword: { type: "string", description: "Hanya produk yang namanya memuat kata ini (mis. pashmina)" },
  sort: { type: "string", enum: ["terlaris", "terbaru", "termurah"] },
  summary: { type: "string", description: "Ringkasan 1–2 kalimat di bawah judul" },
  intro_markdown: { type: "string", description: "Teks pengantar di atas produk (Markdown)" },
  bottom_markdown: { type: "string", description: "Teks SEO di bawah produk (Markdown, 150–400 kata ideal)" },
  faq: faqSchema,
  seo: seoSchema,
  hero_image_id: { type: ["integer", "null"] },
  status: statusSchema,
};

/* ───────────── Konten web ───────────── */
const pick = (o: any, keys: string[]) => Object.fromEntries(keys.filter((k) => o && o[k] !== undefined).map((k) => [k, o[k]]));
const STORE_KEYS = ["enabled", "name", "address", "phone", "hours", "mapsUrl", "embedUrl", "note"] as const;

async function webSnapshot() {
  const h = await getHome();
  const s = await getStore();
  return {
    announcements: h.announcements,
    hero: pick(h.hero, ["eyebrow", "title", "subtitle", "cta1Label", "cta1Href", "cta2Label", "cta2Href"]),
    story: pick(h.story, ["title", "body", "ctaLabel", "ctaHref"]),
    reviews: h.reviews,
    trust: Object.fromEntries(BRAND_SLUGS.map((b) => [b, { custom: Array.isArray(h.trust[b]), items: trustFor(h, b) }])),
    shopee_urls: h.shopeeUrls,
    toko_offline: pick(s, [...STORE_KEYS]),
  };
}

async function webUpdate(a: Record<string, any>) {
  const section = oneOf(a.section, ["announcements", "hero", "story", "reviews", "trust", "shopee_url", "toko_offline"], "section");
  const before = await webSnapshot();
  const v = a.value;
  if (section === "toko_offline") {
    if (!v || typeof v !== "object") bad("value harus objek");
    const cur = await getStore();
    await saveStore({ ...cur, ...pick(v, [...STORE_KEYS]) } as Partial<Record<keyof StoreInfo, unknown>>);
  } else {
    const cur: HomeSettings = await getHome();
    const next: HomeSettings = { ...cur, trust: { ...cur.trust }, shopeeUrls: { ...cur.shopeeUrls } };
    if (section === "announcements") {
      if (!Array.isArray(v) || v.some((x) => typeof x !== "string")) bad("value harus daftar teks (maks 8 pesan)");
      next.announcements = v;
    } else if (section === "hero") {
      if (!v || typeof v !== "object") bad("value harus objek");
      next.hero = { ...cur.hero, ...pick(v, ["eyebrow", "title", "subtitle", "cta1Label", "cta1Href", "cta2Label", "cta2Href"]) } as HomeSettings["hero"];
    } else if (section === "story") {
      if (!v || typeof v !== "object") bad("value harus objek");
      next.story = { ...cur.story, ...pick(v, ["title", "body", "ctaLabel", "ctaHref"]) } as HomeSettings["story"];
    } else if (section === "reviews") {
      if (!v || typeof v !== "object") bad("value harus objek");
      next.reviews = { ...cur.reviews, ...pick(v, ["title", "subtitle"]) } as HomeSettings["reviews"];
    } else if (section === "trust") {
      const b = oneOf(a.brand, BRAND_SLUGS, "brand");
      if (v === "default" || v === null) delete next.trust[b];
      else if (Array.isArray(v) && v.length <= TRUST_MAX && v.every((x) => x && typeof x.title === "string" && typeof x.desc === "string")) next.trust[b] = v;
      else bad(`value harus daftar {title, desc} (maks ${TRUST_MAX}), [] untuk menyembunyikan, atau "default"`);
    } else if (section === "shopee_url") {
      const b = oneOf(a.brand, BRAND_SLUGS, "brand");
      if (v === "" || v === null) delete next.shopeeUrls[b];
      else if (typeof v === "string" && v.startsWith("https://")) next.shopeeUrls[b] = v;
      else bad("value harus URL https:// (atau kosong untuk bawaan)");
    }
    await saveHome(next);
  }
  revalidatePath("/", "layout");
  const after = await webSnapshot();
  const key = section === "shopee_url" ? "shopee_urls" : section;
  const scope = (x: any) => (a.brand && x && typeof x === "object" && !Array.isArray(x) && a.brand in x ? x[a.brand] : x);
  return { section, brand: a.brand ?? undefined, previous: scope((before as any)[key]), current: scope((after as any)[key]), catatan: "Perubahan langsung tampil di situs. Untuk mengembalikan, kirim ulang nilai 'previous'." };
}

/* ───────────── Daftar tool ───────────── */
export const TOOLS: ToolDef[] = [
  {
    name: "blog_list",
    description: "Daftar artikel blog/panduan (terbaru dulu), termasuk draft. Tidak memuat isi lengkap — pakai blog_get.",
    inputSchema: { type: "object", properties: { status: { type: "string", enum: ["all", "draft", "published"], default: "all" }, type: { type: "string", enum: ["blog", "panduan"] }, search: { type: "string", description: "Cari di judul" }, limit: { type: "integer", default: 20, maximum: 100 }, page: { type: "integer", default: 1 } } },
    annotations: { readOnlyHint: true },
    handler: async (a) => {
      const and: any[] = [];
      if (a.status === "draft" || a.status === "published") and.push({ _status: { equals: a.status } });
      if (a.type) and.push({ type: { equals: oneOf(a.type, ["blog", "panduan"], "type") } });
      if (a.search) and.push({ title: { like: String(a.search).slice(0, 80) } });
      const r = await (await P()).find({ collection: "posts", where: and.length ? { and } : {}, sort: "-updatedAt", limit: Math.min(100, Number(a.limit) || 20), page: Number(a.page) || 1, depth: 0, overrideAccess: true, draft: false });
      return { total: r.totalDocs, page: r.page, total_pages: r.totalPages, items: r.docs.map(postRow) };
    },
  },
  {
    name: "blog_get",
    description: "Baca satu artikel lengkap (isi dalam Markdown). Isi id atau slug.",
    inputSchema: { type: "object", properties: { id: { type: ["integer", "string"] }, slug: { type: "string" } } },
    annotations: { readOnlyHint: true },
    handler: async (a) => {
      const d: any = await findOne("posts", a);
      const conv = lexicalToMarkdown(d.content);
      return { ...postRow(d), excerpt: d.excerpt, content_markdown: conv.markdown, ...(conv.hasEmbeddedMedia ? { peringatan: "Isi memuat gambar/blok khusus (tampil sebagai komentar HTML). Mengirim content_markdown akan menggantikan seluruh isi dan menghapusnya — edit bagian itu di /cms." } : {}), faq: d.faq ?? [], related: d.related ?? {}, seo: d.seo ?? {}, hero_image_id: d.heroImage ?? null };
    },
  },
  {
    name: "blog_create",
    description: "Buat artikel baru. Default berstatus DRAFT (belum tampil di situs). Set status 'published' hanya bila pengguna meminta menerbitkan. Wajib: title, excerpt, content_markdown.",
    inputSchema: { type: "object", properties: postFields, required: ["title", "excerpt", "content_markdown"] },
    handler: async (a) => {
      const d = await postData(a, true);
      const r: any = await (await P()).create({ collection: "posts", data: d as any, draft: false, overrideAccess: true });
      revalidatePath("/", "layout");
      return { dibuat: postRow(r) };
    },
  },
  {
    name: "blog_update",
    description: "Ubah artikel (hanya field yang dikirim yang berubah). Wajib id (dari blog_list/blog_get). Untuk menerbitkan atau menurunkan ke draft, kirim status. Hasil memuat 'previous' untuk field yang berubah.",
    inputSchema: { type: "object", properties: { id: { type: ["integer", "string"] }, ...postFields }, required: ["id"] },
    handler: async (a) => {
      const old: any = await findOne("posts", { id: a.id });
      const patch: Record<string, any> = { ...a };
      delete patch.id;
      if (patch.slug === old.slug) delete patch.slug;
      const d = await postData(patch, false);
      if (!Object.keys(d).length) bad("Tidak ada field yang diubah");
      const previous: Record<string, unknown> = {};
      for (const k of Object.keys(d)) {
        if (k === "content") previous.content_markdown = await lex2md("posts", "content", old.content);
        else previous[k] = old[k];
      }
      const r: any = await (await P()).update({ collection: "posts", id: old.id, data: d as any, draft: false, overrideAccess: true });
      revalidatePath("/", "layout");
      return { diperbarui: postRow(r), previous };
    },
  },
  {
    name: "blog_delete",
    description: "Hapus artikel PERMANEN. Konfirmasi dulu ke pengguna; pertimbangkan blog_update status 'draft' sebagai alternatif aman. Wajib confirm: true.",
    inputSchema: { type: "object", properties: { id: { type: ["integer", "string"] }, slug: { type: "string" }, confirm: { type: "boolean" } }, required: ["confirm"] },
    annotations: { destructiveHint: true },
    handler: async (a) => {
      if (a.confirm !== true) bad("Set confirm: true setelah pengguna setuju");
      const old: any = await findOne("posts", a);
      await (await P()).delete({ collection: "posts", id: old.id, overrideAccess: true });
      revalidatePath("/", "layout");
      return { dihapus: { id: old.id, title: old.title, slug: old.slug }, catatan: "Tidak bisa dibatalkan." };
    },
  },
  {
    name: "koleksi_list",
    description: "Daftar halaman koleksi buatan CMS (URL /koleksi/<slug>), termasuk draft. Kategori bawaan tanpa halaman CMS tetap punya halaman otomatis.",
    inputSchema: { type: "object", properties: { status: { type: "string", enum: ["all", "draft", "published"], default: "all" }, limit: { type: "integer", default: 50 } } },
    annotations: { readOnlyHint: true },
    handler: async (a) => {
      const where: any = a.status === "draft" || a.status === "published" ? { _status: { equals: a.status } } : {};
      const r = await (await P()).find({ collection: "koleksi", where, sort: "title", limit: Math.min(200, Number(a.limit) || 50), depth: 0, overrideAccess: true, draft: false });
      return { total: r.totalDocs, items: r.docs.map(kolRow), kategori_bawaan: CAT_SLUGS };
    },
  },
  {
    name: "koleksi_get",
    description: "Baca satu halaman koleksi lengkap (teks dalam Markdown). Isi id atau slug.",
    inputSchema: { type: "object", properties: { id: { type: ["integer", "string"] }, slug: { type: "string" } } },
    annotations: { readOnlyHint: true },
    handler: async (a) => {
      const d: any = await findOne("koleksi", a);
      return { ...kolRow(d), sort: d.sort, summary: d.summary ?? "", intro_markdown: await lex2md("koleksi", "intro", d.intro), bottom_markdown: await lex2md("koleksi", "bottom", d.bottom), faq: d.faq ?? [], seo: d.seo ?? {}, hero_image_id: d.heroImage ?? null };
    },
  },
  {
    name: "koleksi_save",
    description: "Buat atau ubah halaman koleksi. Sertakan id untuk mengubah; tanpa id dan slug yang sudah ada → mengubah halaman itu; selain itu membuat baru (default DRAFT). Contoh: title 'Hijab Pashmina Viscose', brand 'scarf', category 'hijab', keyword 'pashmina'. Produk terisi otomatis dari Shopee.",
    inputSchema: { type: "object", properties: { id: { type: ["integer", "string"] }, ...kolFields } },
    handler: async (a) => {
      const payload = await P();
      let old: any = null;
      if (a.id !== undefined) old = await findOne("koleksi", { id: a.id });
      else if (a.slug) old = (await payload.find({ collection: "koleksi", where: { slug: { equals: String(a.slug) } }, limit: 1, depth: 0, overrideAccess: true, draft: false })).docs[0] ?? null;
      const patch: Record<string, any> = { ...a };
      delete patch.id;
      if (old && a.slug === old.slug) delete patch.slug;
      const d = await kolData(patch, !old);
      if (old && !Object.keys(d).length) bad("Tidak ada field yang diubah");
      const previous = old ? Object.fromEntries(Object.keys(d).map((k) => [k, k === "intro" || k === "bottom" ? undefined : old[k]])) : undefined;
      if (old && d.intro) (previous as any).intro_markdown = await lex2md("koleksi", "intro", old.intro);
      if (old && d.bottom) (previous as any).bottom_markdown = await lex2md("koleksi", "bottom", old.bottom);
      const r: any = old
        ? await payload.update({ collection: "koleksi", id: old.id, data: d as any, draft: false, overrideAccess: true })
        : await payload.create({ collection: "koleksi", data: d as any, draft: false, overrideAccess: true });
      revalidatePath("/", "layout");
      return { [old ? "diperbarui" : "dibuat"]: kolRow(r), ...(previous ? { previous } : {}) };
    },
  },
  {
    name: "koleksi_delete",
    description: "Hapus halaman koleksi buatan CMS PERMANEN (kategori bawaan kembali ke halaman otomatis). Wajib confirm: true setelah pengguna setuju.",
    inputSchema: { type: "object", properties: { id: { type: ["integer", "string"] }, slug: { type: "string" }, confirm: { type: "boolean" } }, required: ["confirm"] },
    annotations: { destructiveHint: true },
    handler: async (a) => {
      if (a.confirm !== true) bad("Set confirm: true setelah pengguna setuju");
      const old: any = await findOne("koleksi", a);
      await (await P()).delete({ collection: "koleksi", id: old.id, overrideAccess: true });
      revalidatePath("/", "layout");
      return { dihapus: { id: old.id, title: old.title, slug: old.slug } };
    },
  },
  {
    name: "media_list",
    description: "Daftar foto yang sudah diunggah di CMS (id, teks alternatif, URL) untuk dipakai sebagai hero_image_id. Mengunggah foto baru dilakukan manual di /cms.",
    inputSchema: { type: "object", properties: { search: { type: "string", description: "Cari di teks alternatif / nama file" }, limit: { type: "integer", default: 30 } } },
    annotations: { readOnlyHint: true },
    handler: async (a) => {
      const where: any = a.search ? { or: [{ alt: { like: String(a.search).slice(0, 60) } }, { filename: { like: String(a.search).slice(0, 60) } }] } : {};
      const r = await (await P()).find({ collection: "media", where, sort: "-createdAt", limit: Math.min(100, Number(a.limit) || 30), depth: 0, overrideAccess: true });
      return { total: r.totalDocs, items: r.docs.map((m: any) => ({ id: m.id, alt: m.alt, filename: m.filename, url: abs(m.url), size: m.width && m.height ? `${m.width}x${m.height}` : null })) };
    },
  },
  {
    name: "web_content_get",
    description: "Baca teks web yang bisa diedit: bar pengumuman, hero beranda Wardrobe, bagian cerita, judul ulasan, strip keunggulan per toko (wardrobe/kids/scarf/daily), link Shopee, dan info toko offline.",
    inputSchema: { type: "object", properties: {} },
    annotations: { readOnlyHint: true },
    handler: async () => webSnapshot(),
  },
  {
    name: "web_content_update",
    description:
      "Ubah satu bagian teks web (langsung tampil di situs). Hasil memuat 'previous' untuk membatalkan. Bagian & bentuk value:\n" +
      "• announcements: daftar teks pesan (maks 8, ≤140 huruf; ini bar pengumuman Wardrobe)\n" +
      "• hero: objek sebagian {eyebrow,title,subtitle,cta1Label,cta1Href,cta2Label,cta2Href}; title boleh memakai *kata* untuk warna aksen. Hanya beranda Wardrobe; hero Kids/Scarf/Daily ada di kode.\n" +
      "• story: {title,body,ctaLabel,ctaHref} (body: satu baris = satu paragraf)\n" +
      "• reviews: {title,subtitle}\n" +
      "• trust (butuh brand): daftar {title,desc} maks 6 untuk strip di bawah hero toko itu; [] menyembunyikan; \"default\" mengembalikan teks bawaan\n" +
      "• shopee_url (butuh brand): URL https:// toko Shopee; \"\" = bawaan\n" +
      "• toko_offline: objek sebagian {enabled,name,address,phone,hours,mapsUrl,embedUrl,note}",
    inputSchema: { type: "object", properties: { section: { type: "string", enum: ["announcements", "hero", "story", "reviews", "trust", "shopee_url", "toko_offline"] }, brand: { type: "string", enum: BRAND_SLUGS }, value: {} }, required: ["section", "value"] },
    handler: webUpdate,
  },
];
