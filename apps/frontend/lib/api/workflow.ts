import api from "@/lib/api";
import {
  WorkflowEventSchema,
  type WorkflowEvent,
  type CreateWorkflowEventDto,
  WorkflowStatus,
} from "@textile-flow/shared";

export async function createWorkflowEvent(
  dto: CreateWorkflowEventDto
): Promise<WorkflowEvent> {
  const response = await api.post("/workflow", dto);
  return WorkflowEventSchema.parse(response.data);
}

export async function updateWorkflowStatus(
  id: number,
  status: WorkflowStatus
): Promise<WorkflowEvent> {
  const response = await api.patch(`/workflow/${id}/status`, { status });
  return WorkflowEventSchema.parse(response.data);
}

export async function getWorkflowEvent(id: number): Promise<WorkflowEvent> {
  const response = await api.get(`/workflow/${id}`);
  return WorkflowEventSchema.parse(response.data);
}
