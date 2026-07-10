import { z } from "zod";

export const GreyFabricInwardSchema = z.object({
  id: z.union([z.string(), z.number()]),
  receiptDate: z.string().optional(),
  supplierName: z.string(),
  fabricType: z.string().nullable().optional(),
  colour: z.string().nullable().optional(),
  totalWeight: z.coerce.number(),
  rollCount: z.coerce.number().nullable().optional(),
  ratePerKg: z.coerce.number().nullable().optional(),
  totalCost: z.coerce.number().nullable().optional(),
  purchaseAccount: z.string().nullable().optional(),
  remarks: z.string().nullable().optional(),
});

export type GreyFabricInward = z.infer<typeof GreyFabricInwardSchema>;
