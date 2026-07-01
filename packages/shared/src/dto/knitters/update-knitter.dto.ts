import { z } from 'zod';
import { CreateKnitterSchema } from './create-knitter.dto';

export const UpdateKnitterSchema = CreateKnitterSchema.partial();
export type UpdateKnitterDto = z.infer<typeof UpdateKnitterSchema>;
