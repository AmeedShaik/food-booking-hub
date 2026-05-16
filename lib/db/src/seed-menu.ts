/**
 * Idempotent seed script: inserts the default menu items if the table is empty.
 *
 * Run with: pnpm --filter @workspace/db tsx src/seed-menu.ts
 *
 * Safe to run repeatedly — only inserts when no menu items exist yet.
 */
import { db, menuItemsTable, pool } from "./index";

const DEFAULT_ITEMS = [
  {
    name: "Chicken Biryani",
    description: "Aromatic basmati rice slow-cooked with tender chicken and signature spices.",
    pricePaise: 25000, // ₹250
    category: "Biryani",
    sortOrder: 10,
  },
  {
    name: "Mutton Biryani",
    description: "Premium mutton biryani, marinated overnight and dum-cooked to perfection.",
    pricePaise: 35000, // ₹350
    category: "Biryani",
    sortOrder: 20,
  },
  {
    name: "Chicken 65",
    description: "Crispy, spicy fried chicken — a classic South Indian starter.",
    pricePaise: 20000, // ₹200
    category: "Starters",
    sortOrder: 30,
  },
];

async function main() {
  const existing = await db.select().from(menuItemsTable);
  if (existing.length > 0) {
    console.log(`[seed-menu] Table already has ${existing.length} item(s), skipping.`);
    return;
  }

  console.log(`[seed-menu] Inserting ${DEFAULT_ITEMS.length} default menu items...`);
  await db.insert(menuItemsTable).values(DEFAULT_ITEMS);
  console.log("[seed-menu] Done.");
}

main()
  .catch((err) => {
    console.error("[seed-menu] Failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
