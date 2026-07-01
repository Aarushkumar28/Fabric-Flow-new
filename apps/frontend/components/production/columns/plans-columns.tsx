'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ProductionPlan } from '@/types/production';
import { StatusBadge } from '../status-badge';

export const planColumns: ColumnDef<ProductionPlan>[] = [
  {
    accessorKey: 'planNo',
    header: 'Plan No',
  },
  {
    accessorKey: 'lotNo',
    header: 'Lot',
  },
  {
    accessorKey: 'stage',
    header: 'Stage',
  },
  {
    accessorKey: 'plannedWeight',
    header: 'Planned',
  },
  {
    accessorKey: 'completedWeight',
    header: 'Completed',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <StatusBadge status={row.original.status} />
    ),
  },
];
