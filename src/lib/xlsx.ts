import { unzipSync, strFromU8 } from "fflate";

/** Pembaca .xlsx minimal (sheet pertama saja) — cukup untuk template Mass Update Shopee. Tanpa library spreadsheet berat. */
const ENT: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
const decode = (s: string) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === "#") {
      const code = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : m;
    }
    return ENT[e.toLowerCase()] ?? m;
  });

const colIndex = (letters: string) => letters.split("").reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0) - 1;
const texts = (xml: string) => [...xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((m) => decode(m[1])).join("");

export type Row = { n: number; cells: Map<number, string> };

export function readXlsx(buf: Uint8Array): Row[] {
  const files = unzipSync(buf, {
    filter: (f) => {
      if (f.originalSize > 120_000_000) throw new Error("File terlalu besar");
      return f.name === "xl/sharedStrings.xml" || /^xl\/worksheets\/sheet1\.xml$/.test(f.name);
    },
  });
  const sheet = files["xl/worksheets/sheet1.xml"];
  if (!sheet) throw new Error("Sheet pertama tidak ditemukan — pastikan ini file .xlsx dari Shopee");
  const shared: string[] = files["xl/sharedStrings.xml"]
    ? [...strFromU8(files["xl/sharedStrings.xml"]).matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => texts(m[1].replace(/<rPh[\s\S]*?<\/rPh>/g, "")))
    : [];

  const rows: Row[] = [];
  const xml = strFromU8(sheet);
  for (const rm of xml.matchAll(/<row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/g)) {
    const n = Number(/\br="(\d+)"/.exec(rm[1])?.[1] ?? rows.length + 1);
    const cells = new Map<number, string>();
    for (const cm of (rm[2] ?? "").matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = cm[1];
      const ref = /\br="([A-Z]+)\d+"/.exec(attrs);
      if (!ref || cm[2] === undefined) continue;
      const t = /\bt="(\w+)"/.exec(attrs)?.[1];
      let val = "";
      if (t === "s") val = shared[Number(/<v>(\d+)<\/v>/.exec(cm[2])?.[1])] ?? "";
      else if (t === "inlineStr") val = texts(cm[2]);
      else val = decode(/<v>([\s\S]*?)<\/v>/.exec(cm[2])?.[1] ?? "");
      if (val !== "") cells.set(colIndex(ref[1]), val);
    }
    rows.push({ n, cells });
  }
  return rows;
}
