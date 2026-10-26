import { RichText } from "@payloadcms/richtext-lexical/react";

/** Menampilkan isi dari editor CMS (Lexical) dengan gaya artikel. */
export function RichContent({ data, className = "" }: { data: unknown; className?: string }) {
  if (!data || typeof data !== "object") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <div className={`cms-prose ${className}`}><RichText data={data as any} /></div>;
}
