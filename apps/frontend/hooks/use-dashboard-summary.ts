import { useQuery } from '@tanstack/react-query';
import { getProductionSummary } from '@/lib/api/production';
import { QUERY_KEYS } from '@/lib/query-keys';
import { QUERY_CONFIG } from '@/lib/react-query-config';

export function useDashboardSummary() {
  return useQuery({
    queryKey: QUERY_KEYS.dashboard,
    queryFn: getProductionSummary,
    ...QUERY_CONFIG.dashboard,
  });
}
