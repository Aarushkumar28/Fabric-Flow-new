import { useQuery } from '@tanstack/react-query';
import { getTodayPlans } from '@/lib/api/production';
import { QUERY_KEYS } from '@/lib/query-keys';
import { QUERY_CONFIG } from '@/lib/react-query-config';

export function useTodayPlans() {
  return useQuery({
    queryKey: [...QUERY_KEYS.dashboard, 'today'],
    queryFn: getTodayPlans,
    ...QUERY_CONFIG.dashboard,
  });
}
