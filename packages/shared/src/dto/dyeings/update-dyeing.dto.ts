import { z } from 'zod';

export const UpdateDyeingSchema = z.object({
  initialWeight: z.number().positive().optional(),
  finalWeight: z.number().positive().optional(),
  knitterDcNo: z.string().optional(),
  companyDcNo: z.string().optional(),
  dateGiven: z.string().optional(),
  compacterId: z.number().int().positive().optional(),
  status: z.string().optional(),
  fbNo: z.string().optional(),
});

export type UpdateDyeingDto = z.infer<typeof UpdateDyeingSchema>;
