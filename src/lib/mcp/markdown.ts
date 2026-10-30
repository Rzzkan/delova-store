/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Konversi Markdown ⇄ isi editor CMS (Lexical JSON). Ditulis sendiri agar tidak bergantung pada runtime editor
 * (aman dijalankan di server). Mendukung: judul ## ###, paragraf, **tebal**, *miring*, ~~coret~~, `kode`,
 * tautan, daftar bullet/nomor (bersarang), kutipan, garis pemisah.
 */
const F = { bold: 1, italic: 2, strike: 4, code: 16 };

const text = (t: string, format = 0) => ({ type: "text", version: 1, text: t, format, detail: 0, mode: "normal", style: "" });
const base = { version: 1, direction: "ltr", format: "", indent: 0 };

const INLINE = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*\*([^*]+)\*\*\*|\*\*([^*]+)\*\*|__([^_]+)__|\*([^*\n]+)\*|(?<!\w)_([^_\n]+)_(?!\w)|~~([^~]+)~~|`([^`]+)`/g;

function inline(src: string, fmt = 0): any[] {
  const out: any[] = [];
  let last = 0;
  for (const m of src.matchAll(INLINE)) {
    if (m.index! > last) out.push(text(src.slice(last, m.index), fmt));
    if (m[1] !== undefined) {
      const url = m[2];
      if (/^(https?:\/\/|\/|mailto:|tel:)/.test(url)) out.push({ ...base, type: "link", version: 3, fields: { linkType: "custom", newTab: /^https?:/.test(url), url }, children: inline(m[1], fmt) });
      else out.push(text(m[0], fmt));
    } else if (m[3] !== undefined) out.push(text(m[3], fmt | F.bold | F.italic));
    else if (m[4] !== undefined || m[5] !== undefined) out.push(...inline((m[4] ?? m[5])!, fmt | F.bold));
    else if (m[6] !== undefined || m[7] !== undefined) out.push(...inline((m[6] ?? m[7])!, fmt | F.italic));
    else if (m[8] !== undefined) out.push(text(m[8], fmt | F.strike));
    else if (m[9] !== undefined) out.push(text(m[9], fmt | F.code));
    last = m.index! + m[0].length;
  }
  if (last < src.length) out.push(text(src.slice(last), fmt));
  return out.length ? out : [];
}

const para = (s: string) => {
  const kids: any[] = [];
  s.split("\n").forEach((line, i) => {
    if (i > 0) kids.push({ type: "linebreak", version: 1 });
    kids.push(...inline(line.trim()));
  });
  return { ...base, type: "paragraph", textFormat: 0, textStyle: "", children: kids };
};

const BULLET = /^(\s*)([-*+])\s+(.*)$/;
const ORDERED = /^(\s*)(\d+)[.)]\s+(.*)$/;

function buildList(lines: string[], start: number, indent: number): { node: any; next: number } {
  const first = lines[start];
  const ordered = ORDERED.test(first);
  const items: any[] = [];
  let i = start;
  let value = 1;
  while (i < lines.length) {
    const m = lines[i].match(ordered ? ORDERED : BULLET);
    const m2 = lines[i].match(ordered ? BULLET : ORDERED);
    const ind = (m ?? m2)?.[1].length ?? -1;
    if (!m && !m2) break;
    if (ind < indent) break;
    if (ind > indent) {
      // sub-daftar → masuk ke item terakhir
      const sub = buildList(lines, i, ind);
      // konvensi Lexical: sub-daftar berada di listitem pembungkus tersendiri
      items.push({ ...base, type: "listitem", value: value, children: [sub.node] });
      i = sub.next;
      continue;
    }
    if (!m) break; // jenis daftar berganti pada level yang sama
    items.push({ ...base, type: "listitem", value: value++, children: inline(m[3].trim()) });
    i++;
  }
  return { node: { ...base, type: "list", listType: ordered ? "number" : "bullet", tag: ordered ? "ol" : "ul", start: 1, children: items }, next: i };
}

export function markdownToLexical(md: string): any {
  const lines = md.replace(/\r\n?/g, "\n").split("\n");
  const children: any[] = [];
  let buf: string[] = [];
  const flush = () => { if (buf.length) { children.push(para(buf.join("\n"))); buf = []; } };
  for (let i = 0; i < lines.length; ) {
    const line = lines[i];
    let m: RegExpMatchArray | null;
    if (!line.trim()) { flush(); i++; continue; }
    if ((m = line.match(/^(#{1,6})\s+(.*?)\s*#*\s*$/))) {
      flush();
      const lvl = m[1].length <= 2 ? "h2" : "h3"; // editor CMS hanya h2 & h3
      children.push({ ...base, type: "heading", tag: lvl, children: inline(m[2]) });
      i++; continue;
    }
    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) { flush(); children.push({ type: "horizontalrule", version: 1 }); i++; continue; }
    if (/^>\s?/.test(line)) {
      flush();
      const q: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) q.push(lines[i++].replace(/^>\s?/, ""));
      children.push({ ...base, type: "quote", children: inline(q.join(" ").trim()) });
      continue;
    }
    if (BULLET.test(line) || ORDERED.test(line)) {
      flush();
      const { node, next } = buildList(lines, i, (line.match(/^(\s*)/)![1] ?? "").length);
      children.push(node); i = next; continue;
    }
    buf.push(line); i++;
  }
  flush();
  if (!children.length) children.push(para(""));
  return { root: { type: "root", ...base, children } };
}

/* ───────────── Lexical → Markdown ───────────── */
function inlineMd(nodes: any[] = []): string {
  return nodes.map((n) => {
    if (n.type === "linebreak") return "\n";
    if (n.type === "link" || n.type === "autolink") {
      const url = n.fields?.url ?? n.url ?? "";
      return url ? `[${inlineMd(n.children)}](${url})` : inlineMd(n.children);
    }
    if (n.type === "text") {
      let t: string = n.text ?? "";
      if (!t.trim()) return t;
      const f = n.format ?? 0;
      const lead = t.match(/^\s*/)![0], trail = t.match(/\s*$/)![0];
      t = t.trim();
      if (f & F.code) t = "`" + t + "`";
      if (f & F.strike) t = `~~${t}~~`;
      if ((f & F.bold) && (f & F.italic)) t = `***${t}***`;
      else if (f & F.bold) t = `**${t}**`;
      else if (f & F.italic) t = `*${t}*`;
      return lead + t + trail;
    }
    return n.children ? inlineMd(n.children) : "";
  }).join("");
}

function listMd(n: any, depth = 0): string[] {
  const out: string[] = [];
  const pad = "  ".repeat(depth);
  let num = 0;
  for (const li of n.children ?? []) {
    const inl = (li.children ?? []).filter((c: any) => c.type !== "list");
    const subs = (li.children ?? []).filter((c: any) => c.type === "list");
    if (inl.length) {
      num++;
      out.push(`${pad}${n.listType === "number" ? `${num}.` : "-"} ${inlineMd(inl).replace(/\n/g, " ")}`);
    }
    for (const sub of subs) out.push(...listMd(sub, inl.length ? depth + 1 : depth + 1));
  }
  return out;
}

export function lexicalToMarkdown(data: any): { markdown: string; hasEmbeddedMedia: boolean } {
  let media = false;
  const blocks: string[] = [];
  for (const n of data?.root?.children ?? []) {
    switch (n.type) {
      case "heading": blocks.push(`${"#".repeat(Number(String(n.tag).replace("h", "")) || 2)} ${inlineMd(n.children)}`); break;
      case "paragraph": { const t = inlineMd(n.children).trim(); if (t) blocks.push(t); break; }
      case "quote": blocks.push(inlineMd(n.children).trim().split("\n").map((l) => `> ${l}`).join("\n")); break;
      case "list": blocks.push(listMd(n).join("\n")); break;
      case "horizontalrule": blocks.push("---"); break;
      case "upload": case "block": case "relationship": media = true; blocks.push("<!-- gambar/blok khusus (tidak bisa diedit lewat chat) -->"); break;
      default: if (n.children) { const t = inlineMd(n.children).trim(); if (t) blocks.push(t); }
    }
  }
  return { markdown: blocks.join("\n\n"), hasEmbeddedMedia: media };
}
