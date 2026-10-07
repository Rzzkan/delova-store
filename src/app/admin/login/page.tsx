import { adminEnabled } from "@/lib/auth";

export const metadata = { title: "Admin", robots: { index: false } };

export default async function Login({ searchParams }: { searchParams: Promise<{ err?: string }> }) {
  const { err } = await searchParams;
  return (
    <div className="container-x flex min-h-[60vh] items-center justify-center py-16">
      <form action="/api/admin/login" method="post" className="w-full max-w-sm space-y-4 rounded-3xl border border-sand bg-white p-8">
        <h1 className="text-4xl font-semibold">Admin Delova</h1>
        {!adminEnabled() && <p className="rounded-xl bg-blush p-3 text-sm text-maroon">ADMIN_PASSWORD belum diisi di .env.local</p>}
        <label className="block text-sm font-medium" htmlFor="pw">Password</label>
        <input id="pw" name="password" type="password" required className="input" autoFocus />
        {err && <p role="alert" className="text-sm text-maroon">Password salah.</p>}
        <button className="btn-primary w-full">Masuk</button>
      </form>
    </div>
  );
}
