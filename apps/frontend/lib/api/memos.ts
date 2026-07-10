import api from "@/lib/api";
import {
  MemoSchema,
  type Memo,
} from "@textile-flow/shared";

export async function getMemos(): Promise<Memo[]> {
  const response = await api.get("/memos");
  return MemoSchema.array().parse(response.data);
}
