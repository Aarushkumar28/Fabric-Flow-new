import { z } from 'zod';

export const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/;

export const optionalString = (schema: z.ZodTypeAny) => schema.optional().or(z.literal(''));
