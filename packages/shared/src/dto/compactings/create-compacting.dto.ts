import { z } from 'zod';

export const CreateCompactingSchema = z.object({
  lotNo: z.string().min(1),
  dyeingId: z.number().int().positive().optional(),
  compacterId: z.number().int().positive().optional(),
  colourId: z.number().int().positive().optional(),
  finalWeight: z.number().positive().optional(),
});

export type CreateCompactingDto = z.infer<typeof CreateCompactingSchema>;
