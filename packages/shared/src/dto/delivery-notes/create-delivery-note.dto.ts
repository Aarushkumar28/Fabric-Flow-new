import { z } from 'zod';

export const CreateDeliveryNoteSchema = z.object({
  sourceKnitterId: z.number().int().positive(),
  destinationKnitterId: z.number().int().positive(),
  yarnLotId: z.number().int().positive(),
  quantity: z.number().positive(),
  dcNumber: z.string().optional(),
  note: z.string().optional(),
});

export type CreateDeliveryNoteDto = z.infer<typeof CreateDeliveryNoteSchema>;
