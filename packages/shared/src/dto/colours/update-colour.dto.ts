import { z } from "zod";

export const UpdateColourDto = z.object({
  name: z.string().min(1).optional(),
  code: z.string().min(1).max(20).optional(),
  hexCode: z.string().optional(),
  description: z.string().optional(),
});

export type UpdateColourDtoType = z.infer<typeof UpdateColourDto>;
