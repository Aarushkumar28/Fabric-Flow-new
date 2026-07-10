import { apiClient } from './client';
import {
  CancelPlanPayload,
  CreateProductionPlanPayload,
  PaginatedResponse,
  ProductionEvent,
  ProductionPlan,
  ProductionSummary,
} from '@/types/production';

export async function getProductionPlans(params: {
  page?: number;
  limit?: number;
  status?: string;
  stage?: string;
}) {
  return apiClient<PaginatedResponse<ProductionPlan>>('/production-planning', {
    params,
  });
}

export async function getProductionSummary() {
  return apiClient<ProductionSummary>('/production-planning/summary');
}

export async function getProductionEvents() {
  return apiClient<ProductionEvent[]>('/production-planning/events');
}

export async function getTodayPlans() {
  return apiClient<ProductionPlan[]>('/production-planning/today');
}

export async function getDelayedPlans() {
  return apiClient<ProductionPlan[]>('/production-planning/delayed');
}

export async function createProductionPlan(payload: CreateProductionPlanPayload) {
  return apiClient<ProductionPlan>('/production-planning', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function cancelPlan({ id }: CancelPlanPayload) {
  return apiClient<ProductionPlan>(`/production-planning/${id}`, {
    method: 'DELETE',
  });
}
