// Sinkron manual dari terminal: npm run sync
import { syncAll } from "../src/lib/shopee/sync";

syncAll().then((r) => {
  if (r.mock) console.log("Mode demo — isi SHOPEE_PARTNER_ID & SHOPEE_PARTNER_KEY di .env.local");
  for (const x of r.results) console.log(x.error ? `✗ ${x.name}: ${x.error}` : `✓ ${x.name}: ${x.upserted} diperbarui, ${x.removed} dihapus`);
  process.exit(0);
});
