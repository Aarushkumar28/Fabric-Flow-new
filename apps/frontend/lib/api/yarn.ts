import api from "@/lib/api";
import {
  YarnLotSchema,
  YarnInwardSchema,
  type YarnLot,
  type YarnInward,
} from "@textile-flow/shared";

export async function getYarnLots(): Promise<YarnLot[]> {
  const response = await api.get("/yarn-lots");
  return YarnLotSchema.array().parse(response.data);
}

export async function getYarnInwards(): Promise<YarnInward[]> {
  const response = await api.get("/yarn-inward");
  return YarnInwardSchema.array().parse(response.data);
}
