import api from "@/lib/api";
import {
  GreyFabricInwardSchema,
  type GreyFabricInward,
} from "@textile-flow/shared";

export async function getGreyFabricInwards(): Promise<GreyFabricInward[]> {
  const response = await api.get("/grey-fabric-inward");
  return GreyFabricInwardSchema.array().parse(response.data);
}
