import { z } from 'zod';
import { CreateCompacterSchema } from './create-compacter.dto';

export const UpdateCompacterSchema = CreateCompacterSchema.partial();
export type UpdateCompacterDto = z.infer<typeof UpdateCompacterSchema>;
