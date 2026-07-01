import { z } from 'zod';

export const createProductionPlanSchema = z.object({
  lotNo: z.string().min(1),

  stage: z.string().min(1),

  plannedWeight: z.coerce.number().positive(),

  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']),
});

export type CreateProductionPlanInput = z.infer<
  typeof createProductionPlanSchema
>;
