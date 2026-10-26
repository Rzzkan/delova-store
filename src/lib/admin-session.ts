import crypto from "node:crypto";

/** Sesi login panel toko (/admin). Dipisah dari next/headers agar bisa dipakai juga oleh CMS (Payload). */
export const COOKIE_NAME = "delova_admin";

export function expectedSession(): string | null {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return null;
  const secret = process.env.SESSION_SECRET || "dev-secret-change-me";
  return crypto.createHmac("sha256", secret).update(`admin:${pw}`).digest("hex");
}

export const safeEq = (a: string, b: string) => {
  const A = Buffer.from(a);
  const B = Buffer.from(b);
  return A.length === B.length && crypto.timingSafeEqual(A, B);
};

/** Benar bila header Cookie memuat sesi admin yang sah. */
export function hasAdminSession(cookieHeader: string | null | undefined): boolean {
  const exp = expectedSession();
  if (!exp || !cookieHeader) return false;
  for (const part of cookieHeader.split(";")) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i).trim() === COOKIE_NAME) return safeEq(part.slice(i + 1).trim(), exp);
  }
  return false;
}
