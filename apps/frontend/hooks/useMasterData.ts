"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";
import type { AxiosError } from "axios";

function extractErrorMessage(error: unknown, fallback: string): string {
  const axiosErr = error as AxiosError<{ message?: string | string[] }>;
  const msg = axiosErr?.response?.data?.message;
  if (Array.isArray(msg)) return msg.join('; ');
  if (typeof msg === 'string') return msg;
  return fallback;
}

export function useMasterData(entity: string) {
  const queryClient = useQueryClient();
  const queryKey = [entity];

  const { data = [], isLoading, isError, error } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data } = await api.get(`/${entity}`);
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (newData: Record<string, unknown>) => api.post(`/${entity}`, newData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success(`${entity.slice(0, -1)} created`);
    },
    onError: (err: unknown) =>
      toast.error(extractErrorMessage(err, `Failed to create ${entity.slice(0, -1)}`)),
  });

  const updateMutation = useMutation({
    // FIX RC4: id type widened from string to string | number.
    // Prisma / backend returns numeric ids (Int). The original type
    // forced a string check in MasterDataEntityPage which silently aborted
    // the update when the backend returned a number id.
    // String() coercion here keeps the URL correct: /mills/42
    mutationFn: ({ id, ...data }: { id: string | number } & Record<string, unknown>) =>
      api.patch(`/${entity}/${String(id)}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success(`${entity.slice(0, -1)} updated`);
    },
    onError: (err: unknown) =>
      toast.error(extractErrorMessage(err, `Failed to update ${entity.slice(0, -1)}`)),
  });

  const deleteMutation = useMutation({
    // FIX RC4: same — accept number | string so delete works with numeric ids
    mutationFn: (id: string | number) => api.delete(`/${entity}/${String(id)}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success(`${entity.slice(0, -1)} deleted`);
    },
    onError: (err: unknown) =>
      toast.error(extractErrorMessage(err, `Failed to delete ${entity.slice(0, -1)}`)),
  });

  return { data, isLoading, isError, error, createMutation, updateMutation, deleteMutation };
}
