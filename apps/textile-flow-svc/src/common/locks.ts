import { PrismaTransaction } from '../prisma/prisma.service';
import { z } from 'zod';

export async function lockYarnLot(tx: PrismaTransaction, id: number) {
  const rows = await tx.$queryRaw`
    SELECT id, available_weight, total_weight
    FROM yarn_lots
    WHERE id = ${id}
    FOR UPDATE
  `;
  const schema = z.array(
    z.object({
      id: z.number(),
      available_weight: z.number(),
      total_weight: z.number(),
    }),
  );
  return schema.parse(rows)[0] ?? null;
}
