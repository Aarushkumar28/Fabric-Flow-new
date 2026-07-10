import { z } from "zod";

export const MillSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string(),
});

export type Mill = z.infer<typeof MillSchema>;

export const KnitterSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string(),
});

export type Knitter = z.infer<typeof KnitterSchema>;

export const DyerSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string(),
});

export type Dyer = z.infer<typeof DyerSchema>;

export const CompacterSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string(),
});

export type Compacter = z.infer<typeof CompacterSchema>;

export const ColourSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string(),
});

export type Colour = z.infer<typeof ColourSchema>;
