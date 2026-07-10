import { z } from "zod";

export * from './constants';

// ──────────────────────────────────────────────
// Master Data
// ──────────────────────────────────────────────
export * from './yarn-inward';
export * from './memos';
export * from './grey-fabric-inward';
export * from './mills';
export * from './knitters';
export * from './dyers';
export * from './compacters';
export * from './dyeing-programs';

export const MillResponseSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  addressLine1: z.string().nullable().optional(),
  addressLine2: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  pincode: z.string().nullable().optional(),
  contactPerson: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  contactNo: z.string().optional(),
  gstin: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type MillResponse = z.infer<typeof MillResponseSchema>;

export const CreateColourSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required").max(20),
  hexCode: z.string().optional(),
  description: z.string().optional(),
});
export type CreateColourDto = z.infer<typeof CreateColourSchema>;
export const UpdateColourSchema = CreateColourSchema.partial();
export type UpdateColourDto = z.infer<typeof UpdateColourSchema>;



// ──────────────────────────────────────────────
// Yarn Lots
// ──────────────────────────────────────────────
export * from './yarn-lots/create-yarn-lot.dto';
export * from './yarn-lots/update-yarn-lot.dto';

// ──────────────────────────────────────────────
// Delivery Notes
// ──────────────────────────────────────────────
export * from './delivery-notes';
export * from './yarn-receipts';
export * from './knittings';
export * from './dyeings';
export * from './compactings';
export * from './dyeing-orders';
export * from './inhouse-knitted-fabrics';

// ──────────────────────────────────────────────
// Audit Log
// ──────────────────────────────────────────────
export const AuditLogResponseSchema = z.object({
  id: z.number().int().positive(),
  tableName: z.string(),
  recordId: z.string(),
  action: z.enum(["CREATE", "UPDATE", "DELETE"]),
  oldData: z.record(z.unknown()).nullable(),
  newData: z.record(z.unknown()).nullable(),
  performedBy: z.string(),
  performedAt: z.date(),
});
export type AuditLogResponse = z.infer<typeof AuditLogResponseSchema>;

// ──────────────────────────────────────────────
// Common
// ──────────────────────────────────────────────
export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(
  itemSchema: T,
) =>
  z.object({
    data: z.array(itemSchema),
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
  });
