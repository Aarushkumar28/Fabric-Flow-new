import { z } from 'zod';

export const CreateYarnLotSchema = z.object({
  hfCode: z.string().min(1),
  purchaseOrderNo: z.string().optional(),
  invoiceNo: z.string().optional(),
  deliveryTo: z.string().optional(),
  millId: z.number().int().positive(),
  description: z.string().optional(),
  count: z.string().optional(),
  quality: z.string().optional(),
  noOfBags: z.number().int().nonnegative().default(0),
  bagWeight: z.number().positive().default(60),
  ratePerKg: z.number().nonnegative().default(0),
  cgstRate: z.number().min(0).optional(),
  sgstRate: z.number().min(0).optional(),
});

export type CreateYarnLotDto = z.infer<typeof CreateYarnLotSchema>;
