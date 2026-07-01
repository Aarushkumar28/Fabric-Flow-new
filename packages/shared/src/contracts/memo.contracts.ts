import { z } from "zod";
import {
  KnitterSchema,
  DyerSchema,
} from "./master-data.contracts";

export const MemoLineSchema = z.object({
  id: z.union([z.string(), z.number()]),
  memoId: z.union([z.string(), z.number()]),
  yarnLotId: z.union([z.string(), z.number()]).optional(),
  knitterId: z.union([z.string(), z.number()]).optional(),
  knittingLotId: z.union([z.string(), z.number()]).nullable().optional(),
  greyFabricLotId: z.union([z.string(), z.number()]).nullable().optional(),
  sentWeight: z.coerce.number().optional(),
  yarnCount: z.string().nullable().optional(),
  dia: z.string().nullable().optional(),
  gg: z.string().nullable().optional(),
  loopLength: z.string().nullable().optional(),
  fabricName: z.string().nullable().optional(),
  fabricColour: z.string().nullable().optional(),
  expectedRolls: z.coerce.number().nullable().optional(),
  preAssignedDyerId: z.union([z.string(), z.number()]).nullable().optional(),
  knitter: KnitterSchema.optional(),
  dyer: DyerSchema.optional(),
});

export type MemoLine = z.infer<typeof MemoLineSchema>;

export const MemoSchema = z.object({
  id: z.union([z.string(), z.number()]),
  memoNo: z.coerce.number(),
  issueDate: z.string(),
  programmeRef: z.string().nullable().optional(),
  account: z.string().nullable().optional(),
  remarks: z.string().nullable().optional(),
  lines: z.array(MemoLineSchema).optional(),
});

export type Memo = z.infer<typeof MemoSchema>;
