import api from "@/lib/api";
import {
  KnitterSchema,
  MillSchema,
  DyerSchema,
  type Knitter,
  type Mill,
  type Dyer,
} from "@textile-flow/shared";

export async function getKnitters(): Promise<Knitter[]> {
  const response = await api.get("/knitters");
  return KnitterSchema.array().parse(response.data);
}

export async function getMills(): Promise<Mill[]> {
  const response = await api.get("/mills");
  return MillSchema.array().parse(response.data);
}

export async function getDyers(): Promise<Dyer[]> {
  const response = await api.get("/dyers");
  return DyerSchema.array().parse(response.data);
}
