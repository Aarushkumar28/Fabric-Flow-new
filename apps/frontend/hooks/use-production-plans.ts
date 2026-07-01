import { useQuery } from '@tanstack/react-query';
import { getProductionPlans } from '@/lib/api/production';
import { QUERY_KEYS } from '@/lib/query-keys';
import { QUERY_CONFIG } from '@/lib/react-query-config';

export function useProductionPlans(params: {
  page: number;
  limit: number;
  status?: string;
  stage?: string;
}) {
  return useQuery({
    queryKey: [
      ...QUERY_KEYS.plans,
      params.page,
      params.limit,
      params.status ?? '',
      params.stage ?? '',
    ],
    queryFn: () => getProductionPlans(params),
    ...QUERY_CONFIG.tables,
  });
}
