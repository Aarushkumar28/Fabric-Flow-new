import { z } from 'zod';

export const CreateDyeingOrderSchema = z.object({
  orderNo: z.string().optional(),
  lines: z.array(
    z.object({
      knittingId: z.number().int().positive(),
      quantity: z.number().positive(),
    }),
  ).min(1),
});

export type CreateDyeingOrderDto = z.infer<typeof CreateDyeingOrderSchema>;
