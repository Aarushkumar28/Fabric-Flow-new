import { z } from 'zod';
import { CreateMillSchema } from './create-mill.dto';

export const UpdateMillSchema = CreateMillSchema.partial();
export type UpdateMillDto = z.infer<typeof UpdateMillSchema>;
