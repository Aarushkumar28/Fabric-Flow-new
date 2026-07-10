/**
 * backfill-yarn-inward.ts
 *
 * One-time script: for every YARN PurchaseOrder that has NO matching YarnInward row,
 * create one with status=PENDING using the same resolution logic as the service.
 *
 * Run (from repo root):
 *   npx ts-node -P apps/textile-flow-svc/tsconfig.json \
 *     -r tsconfig-paths/register \
 *     apps/textile-flow-svc/scripts/backfill-yarn-inward.ts
 *
 * Safe to run multiple times — it queries for POs with zero inward rows
 * each time so already-backfilled POs are never double-processed.
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL || '';
if (!connectionString) throw new Error('DATABASE_URL not set');
const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('=== Yarn Inward Backfill ===\n');

  // Find all YARN POs that currently have NO linked YarnInward rows
  const orphanPOs = await prisma.purchaseOrder.findMany({
    where: {
      poType: 'YARN',
      yarnInwards: { none: {} },
    },
    include: {
      items: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`Found ${orphanPOs.length} orphaned YARN POs (no YarnInward row).\n`);

  if (orphanPOs.length === 0) {
    console.log('Nothing to backfill. All YARN POs already have a linked YarnInward.');
    return;
  }

  let successCount = 0;
  let skipCount = 0;

  for (const po of orphanPOs as any[]) {
    const firstItem = po.items[0];

    if (!firstItem) {
      console.warn(`  [SKIP] PO ${po.poNumber} (${po.id}) — no items, cannot backfill.`);
      skipCount++;
      continue;
    }

    // Resolve mill: try name match against supplierName
    const mill = po.supplierName
      ? await prisma.mill.findFirst({
          where: { name: { contains: po.supplierName, mode: 'insensitive' } },
        })
      : null;

    // Resolve knitter: try name match against deliveryName
    const knitter = po.deliveryName
      ? await prisma.knitter.findFirst({
          where: { name: { contains: po.deliveryName, mode: 'insensitive' } },
        })
      : null;

    if (!mill) {
      console.warn(
        `  [SKIP] PO ${po.poNumber} — cannot resolve mill from supplierName="${po.supplierName}". ` +
          `Update the PO's supplierName to match a Mill record exactly, then re-run.`
      );
      skipCount++;
      continue;
    }

    if (!knitter) {
      console.warn(
        `  [SKIP] PO ${po.poNumber} — cannot resolve knitter from deliveryName="${po.deliveryName}". ` +
          `Update the PO's deliveryName to match a Knitter record exactly, then re-run.`
      );
      skipCount++;
      continue;
    }

    const bags = Number(firstItem.bags) ?? 0;
    const bagWeight = Number(firstItem.bagWeight) ?? 60;
    const totalWeight = bags * bagWeight;
    const rate = Number(firstItem.rate) ?? 0;
    const cgst = Number(firstItem.cgst) ?? 2.5;
    const sgst = Number(firstItem.sgst) ?? 2.5;
    const taxable = totalWeight * rate;
    const cgstAmt = taxable * (cgst / 100);
    const sgstAmt = taxable * (sgst / 100);

    try {
      await prisma.yarnInward.create({
        data: {
          status: 'PENDING',
          purchaseOrderId: po.id,
          receiptDate: po.deliveryDate ?? new Date(),
          millId: mill.id,
          deliveryKnitterId: knitter.id,
          hfBatch: po.hfCode,
          yarnCount: firstItem.count ?? null,
          yarnQuality: firstItem.quality ?? null,
          numBags: bags,
          bagWeight: bagWeight,
          totalWeight: totalWeight,
          ratePerKg: rate,
          cgstRate: cgst,
          sgstRate: sgst,
          cgstAmount: cgstAmt,
          sgstAmount: sgstAmt,
          totalCost: taxable + cgstAmt + sgstAmt,
          purchaseAccount: 'C.N.T.LLP',
          receivedWeight: null,
          millInvoiceNo: null,
          millDcNo: null,
        },
      });

      console.log(
        `  [OK]   PO ${po.poNumber} → YarnInward created (mill: ${mill.name}, knitter: ${knitter.name})`
      );
      successCount++;
    } catch (err) {
      console.error(`  [ERR]  PO ${po.poNumber} — DB error:`, err);
      skipCount++;
    }
  }

  console.log(
    `\n=== Backfill complete: ${successCount} created, ${skipCount} skipped / errored out of ${orphanPOs.length} orphaned POs ===`
  );
}

main()
  .catch((e) => {
    console.error('Fatal error during backfill:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
