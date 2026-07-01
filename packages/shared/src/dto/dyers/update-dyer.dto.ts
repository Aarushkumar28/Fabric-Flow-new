import { z } from 'zod';
import { CreateDyerSchema } from './create-dyer.dto';

export const UpdateDyerSchema = CreateDyerSchema.partial();
export type UpdateDyerDto = z.infer<typeof UpdateDyerSchema>;
