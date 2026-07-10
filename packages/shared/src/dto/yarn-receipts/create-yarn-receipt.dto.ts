import { z } from 'zod';

export const CreateYarnReceiptSchema = z.object({
  yarnLotId: z.number().int().positive(),
  quantity: z.number().positive(),
  receiptDate: z.string().optional(),
  dcNo: z.string().optional(),
});

export type CreateYarnReceiptDto = z.infer<typeof CreateYarnReceiptSchema>;
