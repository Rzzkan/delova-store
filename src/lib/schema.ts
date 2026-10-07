export const SCHEMA = `
CREATE TABLE IF NOT EXISTS shops (
  shop_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  default_category TEXT,
  shopee_url TEXT,
  access_token TEXT,
  refresh_token TEXT,
  expires_at INTEGER,
  authorized_at INTEGER,
  last_sync_at INTEGER,
  is_mock INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  shop_id INTEGER NOT NULL,
  item_id INTEGER NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  original_price INTEGER,
  stock INTEGER NOT NULL DEFAULT 0,
  sold INTEGER NOT NULL DEFAULT 0,
  rating REAL,
  images TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'NORMAL',
  has_model INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'lainnya',
  category_override TEXT,
  hidden INTEGER NOT NULL DEFAULT 0,
  featured INTEGER NOT NULL DEFAULT 0,
  shopee_url TEXT NOT NULL,
  shopee_created_at INTEGER,
  shopee_updated_at INTEGER,
  synced_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_products_shop ON products(shop_id);
CREATE TABLE IF NOT EXISTS variants (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  model_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  sku TEXT,
  price INTEGER NOT NULL,
  original_price INTEGER,
  stock INTEGER NOT NULL DEFAULT 0,
  image TEXT
);
CREATE INDEX IF NOT EXISTS idx_variants_product ON variants(product_id);
CREATE TABLE IF NOT EXISTS sync_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shop_id INTEGER,
  started_at INTEGER,
  finished_at INTEGER,
  status TEXT,
  upserted INTEGER NOT NULL DEFAULT 0,
  removed INTEGER NOT NULL DEFAULT 0,
  message TEXT
);
CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at INTEGER,
  name TEXT,
  phone TEXT,
  address TEXT,
  note TEXT,
  items TEXT,
  total INTEGER
);
`;
