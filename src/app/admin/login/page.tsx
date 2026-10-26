import { adminEnabled } from "@/lib/auth";

export const metadata = { title: "Masuk Admin", robots: { index: false } };

export default async function Login({ searchParams }: { searchParams: Promise<{ err?: string }> }) {
  const { err } = await searchParams;
  return (
    <div data-admin className="flex min-h-screen items-center justify-center bg-cream px-4 py-12 text-ink">
      <form action="/api/admin/login" method="post" className="w-full max-w-md space-y-5 rounded-2xl border border-sand bg-white p-8 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-xl font-bold text-white">D</span>
          <div><h1 className="text-xl font-semibold leading-tight">Delova Admin</h1><p className="text-sm text-ink/50">Masuk untuk mengelola toko</p></div>
        </div>
        {!adminEnabled() && <p className="rounded-lg bg-blush p-3 text-sm text-brand">ADMIN_PASSWORD belum diisi di .env</p>}
        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="pw">Password</label>
          <input id="pw" name="password" type="password" required className="input" autoFocus autoComplete="current-password" />
        </div>
        {err && <p role="alert" className="rounded-lg bg-blush p-3 text-sm text-brand">Password salah.</p>}
        <button className="btn-primary w-full">Masuk</button>
      </form>
    </div>
  );
}
