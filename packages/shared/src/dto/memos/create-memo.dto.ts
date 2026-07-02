import { z } from 'zod';

// The 3 grey-fabric sourcing options for a memo line
export const MemoLineSourceSchema = z.enum([
  'PURCHASED_LOT', // Existing GreyFabricLot where source=PURCHASED
  'PROGRAM_LOT',   // Existing GreyFabricLot where source=KNITTED (via KnitterProgram)
  'NEW_PROGRAM',   // Create a new KnitterProgram inline, then reference its lot
]);
export type MemoLineSource = z.infer<typeof MemoLineSourceSchema>;

// Sub-form for creating a new KnitterProgram inline (used by NEW_PROGRAM source)
const NewProgramPayloadSchema = z.object({
  knitterId: z.number().int().positive(),
  yarns: z.array(z.object({
    yarnLotId: z.number().int().positive(),
    quantityUsed: z.number().positive(),
  })).min(1),
  greyWeight: z.number().positive(),
  programDate: z.string().optional(),
  dia: z.string().optional(),
  gg: z.string().optional(),
  loopLength: z.string().optional(),
});

const MemoLineSchema = z
  .object({
    // Source selector (optional for backward compat; service will infer from IDs if missing)
    source: MemoLineSourceSchema.optional(),

    // Option 1: purchased grey fabric lot
    greyFabricLotId: z.number().int().positive().optional(),

    // Option 2: existing knitter-program lot (pass the knitterProgramId to resolve the lot)
    knitterProgramId: z.number().int().positive().optional(),

    // Option 3: create a new program inline
    newProgram: NewProgramPayloadSchema.optional(),

    // Legacy / backward-compat fields (still accepted)
    knittingLotId: z.number().int().positive().optional(),
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
    // preAssignedDyerId removed — dyer is set at memo level only
  })
  .describe('Memo line with explicit grey-fabric source');

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
