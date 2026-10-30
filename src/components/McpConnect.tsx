"use client";
import { useState } from "react";

/** Menampilkan URL konektor (rahasia) dengan tombol lihat & salin. */
export function McpConnect({ url, bearerCmd }: { url: string; bearerCmd: string }) {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState("");
  async function copy(label: string, v: string) {
    try { await navigator.clipboard.writeText(v); setCopied(label); setTimeout(() => setCopied(""), 1800); } catch { /* abaikan */ }
  }
  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="mcp-url" className="mb-1.5 block text-sm font-medium">URL konektor (untuk claude.ai)</label>
        <div className="flex gap-2">
          <input id="mcp-url" readOnly className="input font-mono text-xs" type={show ? "text" : "password"} value={url} onFocus={(e) => e.currentTarget.select()} />
          <button type="button" className="btn-outline !py-2" onClick={() => setShow((s) => !s)}>{show ? "Sembunyikan" : "Tampilkan"}</button>
          <button type="button" className="btn-primary !py-2" onClick={() => copy("url", url)}>{copied === "url" ? "Tersalin ✓" : "Salin"}</button>
        </div>
        <p className="mt-1.5 text-xs text-ink/55">URL ini berisi kunci rahasia. Siapa pun yang memilikinya bisa mengubah konten situs — jangan dibagikan.</p>
      </div>
      <div>
        <label htmlFor="mcp-cmd" className="mb-1.5 block text-sm font-medium">Perintah untuk Claude Code (opsional)</label>
        <div className="flex gap-2">
          <input id="mcp-cmd" readOnly className="input font-mono text-xs" type={show ? "text" : "password"} value={bearerCmd} onFocus={(e) => e.currentTarget.select()} />
          <button type="button" className="btn-outline !py-2" onClick={() => copy("cmd", bearerCmd)}>{copied === "cmd" ? "Tersalin ✓" : "Salin"}</button>
        </div>
      </div>
    </div>
  );
}
