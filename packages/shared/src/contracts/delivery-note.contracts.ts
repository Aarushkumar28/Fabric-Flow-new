import { z } from "zod";
import { KnitterSchema } from "./master-data.contracts";
import { YarnLotSchema } from "./yarn.contracts";

export const DeliveryNoteSchema = z.object({
  id: z.union([z.string(), z.number()]),
  sourceKnitterId: z.union([z.string(), z.number()]),
  destinationKnitterId: z.union([z.string(), z.number()]),
  yarnLotId: z.union([z.string(), z.number()]),
  quantity: z.coerce.number(),
  dcNumber: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  sourceKnitter: KnitterSchema.optional(),
  destinationKnitter: KnitterSchema.optional(),
  yarnLot: YarnLotSchema.optional(),
});

export type DeliveryNote = z.infer<typeof DeliveryNoteSchema>;
