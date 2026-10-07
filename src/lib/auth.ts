import { cookies } from "next/headers";
import crypto from "node:crypto";

const COOKIE = "delova_admin";

function expected(): string | null {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return null;
  const secret = process.env.SESSION_SECRET || "dev-secret-change-me";
  return crypto.createHmac("sha256", secret).update(`admin:${pw}`).digest("hex");
}

const safeEq = (a: string, b: string) => {
  const A = Buffer.from(a);
  const B = Buffer.from(b);
  return A.length === B.length && crypto.timingSafeEqual(A, B);
};

export const adminEnabled = () => !!process.env.ADMIN_PASSWORD;

export function checkPassword(input: string): boolean {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return false;
  const h = (s: string) => crypto.createHash("sha256").update(s).digest("hex");
  return safeEq(h(input), h(pw));
}

export async function isAdmin(): Promise<boolean> {
  const exp = expected();
  if (!exp) return false;
  const v = (await cookies()).get(COOKIE)?.value;
  return !!v && safeEq(v, exp);
}

export function sessionCookie() {
  return {
    name: COOKIE,
    value: expected() ?? "",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: (process.env.NEXT_PUBLIC_SITE_URL ?? "").startsWith("https://"),
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  };
}
export const COOKIE_NAME = COOKIE;
