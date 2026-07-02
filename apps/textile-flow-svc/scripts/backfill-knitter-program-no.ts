/**
 * backfill-knitter-program-no.ts
 *
 * One-time script: for every KnitterProgram row that has no programNo,
 * assign one in ascending id order using the pattern KP-XXXX.
 *
 * Run (from repo root):
 *   cd apps/textile-flow-svc
 *   ../../node_modules/.bin/ts-node \
 *     -P tsconfig.json \
 *     -r tsconfig-paths/register \
 *     scripts/backfill-knitter-program-no.ts
 *
 * Safe to run multiple times — only processes rows where programNo IS NULL.
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL || '';
if (!connectionString) throw new Error('DATABASE_URL not set');
const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

async function main() {
  console.log('=== KnitterProgram programNo Backfill ===\n');

  const programs = await prisma.knitterProgram.findMany({
    where: { programNo: null },
    orderBy: { id: 'asc' },
  });

  console.log(`Found ${programs.length} programs without a programNo.\n`);

  if (programs.length === 0) {
    console.log('Nothing to backfill. All KnitterPrograms already have a programNo.');
    await pool.end();
    return;
  }

  let updated = 0;
  for (const program of programs) {
    const programNo = `KP-${String(program.id).padStart(4, '0')}`;
    try {
      await prisma.knitterProgram.update({
        where: { id: program.id },
        data: { programNo },
      });
      console.log(`  ✅ KnitterProgram #${program.id} → ${programNo}`);
      updated++;
    } catch (err) {
      console.error(`  ❌ KnitterProgram #${program.id}: ${(err as Error).message}`);
    }
  }

  console.log(`\nDone. Updated ${updated}/${programs.length} records.`);
  await pool.end();
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
