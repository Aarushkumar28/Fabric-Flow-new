/**
 * Deduplication script — run ONCE before the unique-hfCode/poNumber migration.
 * Keeps the OLDEST record (lowest createdAt) for each duplicate group and
 * appends a numeric suffix to the duplicates so they become unique.
 *
 * Usage: ts-node scripts/dedup-po-fields.ts
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function deduplicateField(field: 'hfCode' | 'poNumber', column: string) {
  // Find all duplicate groups
  const dupes: { value: string }[] = await prisma.$queryRawUnsafe(
    `SELECT ${column} as value FROM purchase_orders GROUP BY ${column} HAVING COUNT(*) > 1`
  );

  console.log(`\nDeduplicating ${field} — ${dupes.length} duplicate group(s) found`);

  for (const { value } of dupes) {
    const records: { id: string }[] = await prisma.$queryRawUnsafe(
      `SELECT id FROM purchase_orders WHERE ${column} = $1 ORDER BY created_at ASC`,
      value
    );

    // Keep the first (oldest) record as-is; rename the rest
    for (let i = 1; i < records.length; i++) {
      const newValue = `${value}_dup${i}`;
      await prisma.$executeRawUnsafe(
        `UPDATE purchase_orders SET ${column} = $1 WHERE id = $2`,
        newValue,
        records[i].id
      );
      console.log(`  [${field}] renamed id=${records[i].id}: "${value}" → "${newValue}"`);
    }
  }
}

async function main() {
  await deduplicateField('hfCode', 'hf_code');
  await deduplicateField('poNumber', 'po_number');
  console.log('\nDeduplication complete. You can now run the Prisma migration.');
  await prisma.$disconnect();
  await pool.end();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  await pool.end();
  process.exit(1);
});
