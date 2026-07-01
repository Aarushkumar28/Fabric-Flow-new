import { z } from "zod";
import { MillSchema, KnitterSchema } from "./master-data.contracts";

export const YarnLotSchema = z.object({
  id: z.union([z.string(), z.number()]),
  hfCode: z.string(),
  totalWeight: z.coerce.number(),
  availableWeight: z.coerce.number(),
  totalCost: z.coerce.number(),
  millId: z.union([z.string(), z.number()]),
  mill: MillSchema.optional(),
});

export type YarnLot = z.infer<typeof YarnLotSchema>;

export const YarnInwardSchema = z.object({
  id: z.union([z.string(), z.number()]),
  receiptDate: z.string().optional(),
  millId: z.union([z.string(), z.number()]),
  mill: MillSchema.optional(),
  deliveryKnitterId: z.union([z.string(), z.number()]).optional(),
  deliveryKnitter: KnitterSchema.optional(),
  hfBatch: z.string().nullable().optional(),
  yarnCount: z.string().nullable().optional(),
  yarnQuality: z.string().nullable().optional(),
  totalWeight: z.coerce.number(),
  numBags: z.coerce.number().nullable().optional(),
  ratePerKg: z.coerce.number().nullable().optional(),
  totalCost: z.coerce.number().nullable().optional(),
  purchaseAccount: z.string().nullable().optional(),
  remarks: z.string().nullable().optional(),
});

export type YarnInward = z.infer<typeof YarnInwardSchema>;
