import crypto from "node:crypto";
import { getDb } from "../db";
import { shopeeConfig } from "./config";

/* eslint-disable @typescript-eslint/no-explicit-any */
export type J = Record<string, any>;

const nowSec = () => Math.floor(Date.now() / 1000);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const hmac = (key: string, base: string) => crypto.createHmac("sha256", key).update(base).digest("hex");

export type ShopAuth = {
  shop_id: number;
  access_token: string | null;
  refresh_token: string | null;
  expires_at: number | null;
};

/** Link otorisasi: penjual membuka ini, login Seller Centre, lalu Shopee redirect ke SHOPEE_REDIRECT_URL. */
export function buildAuthUrl(): string {
  const { partnerId, partnerKey, host, redirect } = shopeeConfig();
  const path = "/api/v2/shop/auth_partner";
  const ts = nowSec();
  const sign = hmac(partnerKey, `${partnerId}${path}${ts}`);
  return `${host}${path}?partner_id=${partnerId}&timestamp=${ts}&sign=${sign}&redirect=${encodeURIComponent(redirect)}`;
}

async function request(url: string, init: RequestInit, attempt = 0): Promise<J> {
  const res = await fetch(url, { ...init, cache: "no-store" });
  const text = await res.text();
  let json: J;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Shopee HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  if (json.error) {
    const retryable = res.status === 429 || res.status >= 500 || ["error_server", "error_busy", "error_rate_limit"].includes(json.error);
    if (retryable && attempt < 3) {
      await sleep(1000 * 2 ** attempt);
      return request(url, init, attempt + 1);
    }
    throw new Error(`Shopee ${json.error}: ${json.message || ""}`.trim());
  }
  return json;
}

async function publicPost(path: string, body: J): Promise<J> {
  const { partnerId, partnerKey, host } = shopeeConfig();
  const ts = nowSec();
  const sign = hmac(partnerKey, `${partnerId}${path}${ts}`);
  const url = `${host}${path}?partner_id=${partnerId}&timestamp=${ts}&sign=${sign}`;
  return request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, partner_id: partnerId }),
  });
}

/** Tukar `code` dari callback menjadi access_token + refresh_token, simpan ke DB. */
export async function exchangeCode(code: string, shopId: number): Promise<void> {
  const r = await publicPost("/api/v2/auth/token/get", { code, shop_id: shopId });
  await saveTokens(shopId, r.access_token, r.refresh_token, r.expire_in);
}

async function saveTokens(shopId: number, access: string, refresh: string, expireIn: number) {
  const db = await getDb();
  const exp = nowSec() + Number(expireIn || 14400);
  const upd = await db.execute({
    sql: "UPDATE shops SET access_token=?, refresh_token=?, expires_at=?, authorized_at=COALESCE(authorized_at, ?) WHERE shop_id=?",
    args: [access, refresh, exp, nowSec(), shopId],
  });
  if (!upd.rowsAffected) {
    await db.execute({
      sql: "INSERT INTO shops (shop_id, name, slug, access_token, refresh_token, expires_at, authorized_at) VALUES (?,?,?,?,?,?,?)",
      args: [shopId, `Shop ${shopId}`, `shop-${shopId}`, access, refresh, exp, nowSec()],
    });
  }
}

async function validToken(shop: ShopAuth): Promise<string> {
  if (!shop.access_token || !shop.refresh_token) throw new Error(`Toko ${shop.shop_id} belum diotorisasi`);
  if ((shop.expires_at ?? 0) - 300 > nowSec()) return shop.access_token;
  const r = await publicPost("/api/v2/auth/access_token/get", { refresh_token: shop.refresh_token, shop_id: shop.shop_id });
  await saveTokens(shop.shop_id, r.access_token, r.refresh_token, r.expire_in);
  shop.access_token = r.access_token;
  shop.refresh_token = r.refresh_token;
  shop.expires_at = nowSec() + Number(r.expire_in || 14400);
  return r.access_token;
}

/** GET ke endpoint shop-level (butuh access_token + shop_id pada signature). */
export async function shopGet(shop: ShopAuth, path: string, params: Record<string, string | number> = {}): Promise<J> {
  const { partnerId, partnerKey, host } = shopeeConfig();
  const token = await validToken(shop);
  const ts = nowSec();
  const sign = hmac(partnerKey, `${partnerId}${path}${ts}${token}${shop.shop_id}`);
  const q = new URLSearchParams({
    partner_id: String(partnerId),
    timestamp: String(ts),
    access_token: token,
    shop_id: String(shop.shop_id),
    sign,
    ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
  });
  const json = await request(`${host}${path}?${q}`, { method: "GET" });
  return json.response ?? {};
}

/** Verifikasi header Authorization pada Live Push Shopee: HMAC-SHA256(key, `${url}|${body}`). */
export function verifyPush(url: string, rawBody: string, header: string | null): boolean {
  if (!header) return false;
  const key = process.env.SHOPEE_PUSH_KEY || shopeeConfig().partnerKey;
  if (!key) return false;
  const expected = hmac(key, `${url}|${rawBody}`);
  const a = Buffer.from(expected);
  const b = Buffer.from(header.trim());
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
