import { z } from 'zod';

export const CreateInhouseKnittedFabricSchema = z.object({
  lotNo: z.string().min(1),
  description: z.string().optional(),
  weight: z.number().positive().optional(),
});

export type CreateInhouseKnittedFabricDto = z.infer<typeof CreateInhouseKnittedFabricSchema>;
