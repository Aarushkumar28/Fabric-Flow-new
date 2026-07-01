import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api/client';
import { QUERY_CONFIG } from '@/lib/react-query-config';

interface KnittingLot {
  id: number;
  lotNo: string;
}

export function useKnittingLots() {
  return useQuery({
    queryKey: ['knitting-lots'],
    queryFn: () => apiClient<KnittingLot[]>('/knitting-lots'),
    ...QUERY_CONFIG.tables,
  });
}
