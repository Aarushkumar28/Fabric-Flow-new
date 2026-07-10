import api from "@/lib/api";
import {
  DeliveryNoteSchema,
  type DeliveryNote,
} from "@textile-flow/shared";

export async function getDeliveryNotes(): Promise<DeliveryNote[]> {
  const response = await api.get("/delivery-notes");
  return DeliveryNoteSchema.array().parse(response.data);
}
