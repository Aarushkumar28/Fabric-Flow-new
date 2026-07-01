import { z } from 'zod';

export const CreateKnittingSchema = z.object({
  dcNo: z.string().min(1),
  knitterNameId: z.number().int().positive(),
  totalYarnQty: z.number().positive(),
  loopLength: z.union([z.number(), z.string()]).optional(),
  dia: z.union([z.number(), z.string()]).optional(),
  count: z.string().optional(),
  gauge: z.string().optional(),
  fabricDescriptionId: z.number().int().positive(),
  greyFabricWeight: z.number().positive(),
  receivedWeight: z.number().positive(),
  noOfRolls: z.number().int().positive(),
  dateGiven: z.string().optional(),
  yarnUsages: z.array(
    z.object({
      yarnLotId: z.number().int().positive(),
      hfCode: z.string().min(1),
      quantity: z.number().positive(),
    }),
  ).min(1),
});

export type CreateKnittingDto = z.infer<typeof CreateKnittingSchema>;
