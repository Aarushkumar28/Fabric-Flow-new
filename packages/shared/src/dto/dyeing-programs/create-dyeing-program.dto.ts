import { z } from "zod";

export const CreateDyeingProgramSchema = z.object({
  programNo: z.string().min(1),
  dyerId: z.number().int().positive(),
  colourId: z.number().int().positive(),
  greyFabricLotId: z.number().int().positive(),
  startDate: z.string().datetime().optional(),
  remarks: z.string().optional(),
});

export type CreateDyeingProgramDto = z.infer<typeof CreateDyeingProgramSchema>;
