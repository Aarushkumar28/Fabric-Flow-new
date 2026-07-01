import { z } from 'zod';

export const WorkflowEventSchema = z.object({
  entityType: z.string(),
  entityId: z.number(),
  event: z.string(),
  oldStatus: z.string().optional(),
  newStatus: z.string().optional(),
});

export type WorkflowEvent = z.infer<typeof WorkflowEventSchema>;
