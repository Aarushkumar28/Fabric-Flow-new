import { z } from 'zod';

const MemoLineSchema = z
  .object({
    knittingLotId: z.number().int().positive().optional(),
    greyFabricLotId: z.number().int().positive().optional(),
    yarnLotId: z.number().int().positive().optional(),
    knitterId: z.number().int().positive().optional(),
    sentWeight: z.number().positive().optional(),
    yarnCount: z.string().optional(),
    dia: z.string().optional(),
    gg: z.string().optional(),
    loopLength: z.string().optional(),
    fabricName: z.string().optional(),
    fabricColour: z.string().optional(),
    expectedRolls: z.number().int().positive().optional(),
    preAssignedDyerId: z.number().int().positive().optional(),
  })
  .describe('Memo lines for new knitting-based dyeing dispatch');

export const CreateMemoSchema = z.object({
  memoNo: z.number().int().positive().optional(),
  issueDate: z.string().optional(),
  dyerId: z.number().int().positive().optional(),
  programmeRef: z.string().optional(),
  account: z.string().optional(),
  remarks: z.string().optional(),
  lines: z.array(MemoLineSchema).min(1),
});

export type CreateMemoDto = z.infer<typeof CreateMemoSchema>;
