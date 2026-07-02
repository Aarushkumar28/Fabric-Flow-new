import { z } from 'zod';

export const UpdateDyeingSchema = z.object({
  initialWeight: z.number().positive().optional(),
  finalWeight: z.number().positive().optional(),
  knitterDcNo: z.string().optional(),
  // companyDcNo is read-only / auto-synced from lotNo — not accepted from client
  dateGiven: z.string().optional(),
  compacterId: z.number().int().positive().optional(),
  status: z.string().optional(),
  fbNo: z.string().optional(),
  // Task 4: new dyeing dispatch fields
  receivedGreyWeight: z.number().positive().optional(),
  greyReceivedDate: z.string().optional(),
  sentWeightToCompacter: z.number().positive().optional(),
});

export type UpdateDyeingDto = z.infer<typeof UpdateDyeingSchema>;
