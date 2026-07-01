'use client';

import { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { ColumnDef } from '@tanstack/react-table';
import { AlertCircle, Calendar, ClipboardList, PlusCircle, RefreshCw, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { ProtectedRoute } from '@/components/auth/protected-route';

import { DataTable } from '@/components/production/data-table';
import { PaginationControls } from '@/components/production/pagination-controls';
import { planColumns } from '@/components/production/columns/plans-columns';
import { QueryStateWrapper } from '@/components/production/query-state-wrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useCancelPlan } from '@/hooks/use-cancel-plan';
import { useCreateProductionPlan } from '@/hooks/use-create-production-plan';
import { useKnittingLots } from '@/hooks/use-knitting-lots';
import { useProductionPlans } from '@/hooks/use-production-plans';
import { ProductionPlan } from '@/types/production';
import {
  createProductionPlanSchema,
  type CreateProductionPlanInput,
} from '@/validators/create-production-plan';

export default function ProductionPlanningPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const form = useForm<CreateProductionPlanInput>({
    resolver: zodResolver(createProductionPlanSchema),
    defaultValues: {
      lotNo: '',
      stage: '',
      plannedWeight: 0,
      priority: 'NORMAL',
    },
  });

  const plansQuery = useProductionPlans({
    page,
    limit,
    status: statusFilter || undefined,
    stage: stageFilter || undefined,
  });
  const knittingLotsQuery = useKnittingLots();
  const createPlanMutation = useCreateProductionPlan(() => {
    setCreateOpen(false);
    form.reset({
      lotNo: '',
      stage: '',
      plannedWeight: 0,
      priority: 'NORMAL',
    });
  });
  const cancelPlanMutation = useCancelPlan();

  const plansList = plansQuery.data?.data ?? [];
  const knittingLots = knittingLotsQuery.data ?? [];

  const columns = useMemo<ColumnDef<ProductionPlan>[]>(
    () => [
      ...planColumns,
      {
        id: 'delayed',
        header: 'Delayed',
        cell: ({ row }) =>
          row.original.delayed ? (
            <span className="flex items-center gap-1.5 text-rose-400 font-semibold text-xs bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full w-fit">
              <AlertCircle className="h-3 w-3" /> YES
            </span>
          ) : (
            <span className="text-slate-500 text-xs">NO</span>
          ),
      },
      {
        id: 'plannedDate',
        header: 'Planned Date',
        cell: ({ row }) => (
          <span className="text-slate-400 text-xs">
            {new Date(row.original.plannedDate).toLocaleDateString()}
          </span>
        ),
      },
      {
        id: 'actions',
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const plan = row.original;
          const isClosed = plan.status === 'COMPLETED' || plan.status === 'CANCELLED';

          return (
            <div className="text-right space-x-2">
              {!isClosed && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={cancelPlanMutation.isPending}
                  onClick={() => {
                    if (confirm('Are you sure you want to cancel this plan?')) {
                      cancelPlanMutation.mutate({ id: plan.id });
                    }
                  }}
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [cancelPlanMutation],
  );

  const handleCreatePlan = (values: CreateProductionPlanInput) => {
    createPlanMutation.mutate({
      ...values,
      plannedDate: new Date().toISOString().split('T')[0],
    });
  };

  return (
    <ProtectedRoute>
      <div className="p-6 space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Production Planning
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Create plans and track stage-wise weight completion.
            </p>
          </div>
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/20"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Create Plan
          </Button>
        </div>

        <Card className="glass-card border-slate-800 bg-slate-900/40">
          <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Status Filter
              </label>
              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-slate-700/60 bg-slate-800/80 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Stage Search
              </label>
              <input
                type="text"
                placeholder="e.g. DYEING, KNITTING"
                value={stageFilter}
                onChange={(event) => {
                  setStageFilter(event.target.value.toUpperCase());
                  setPage(1);
                }}
                className="w-full rounded-lg border border-slate-700/60 bg-slate-800/80 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setStatusFilter('');
                  setStageFilter('');
                  setPage(1);
                }}
                className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Reset Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-slate-800 bg-slate-900/40">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-200 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-blue-400" />
              Active Production Plans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <QueryStateWrapper
              isLoading={plansQuery.isLoading}
              error={plansQuery.error}
              retry={plansQuery.refetch}
              isEmpty={plansList.length === 0}
              emptyTitle="No Plans Found"
              emptyDescription="No production plans match the filter criteria."
            >
              <div className="space-y-4">
                <DataTable columns={columns} data={plansList} />

                {plansQuery.data && plansQuery.data.totalPages > 1 && (
                  <PaginationControls
                    page={page}
                    totalPages={plansQuery.data.totalPages}
                    onPrevious={() => setPage((current) => Math.max(current - 1, 1))}
                    onNext={() =>
                      setPage((current) =>
                        Math.min(current + 1, plansQuery.data?.totalPages ?? current),
                      )
                    }
                  />
                )}
              </div>
            </QueryStateWrapper>
          </CardContent>
        </Card>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="max-w-md bg-slate-900 border-slate-800 text-slate-100">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                Create Production Plan
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreatePlan)} className="space-y-4 pt-2">
                <FormField
                  control={form.control}
                  name="lotNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lot No</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="w-full rounded-lg border border-slate-700/60 bg-slate-800/80 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">Select a lot...</option>
                          {knittingLots.map((lot) => (
                            <option key={lot.id} value={lot.lotNo}>
                              {lot.lotNo}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stage</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="w-full rounded-lg border border-slate-700/60 bg-slate-800/80 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">Select a stage...</option>
                          <option value="KNITTING">Knitting</option>
                          <option value="DYEING">Dyeing</option>
                          <option value="COMPACTING">Compacting</option>
                          <option value="FINISHING">Finishing</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="w-full rounded-lg border border-slate-700/60 bg-slate-800/80 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="LOW">Low</option>
                          <option value="NORMAL">Normal</option>
                          <option value="HIGH">High</option>
                          <option value="URGENT">Urgent</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="plannedWeight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Planned Weight</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          className="border-slate-700/60 bg-slate-800/80 text-slate-200 focus-visible:ring-blue-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4 justify-end pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCreateOpen(false)}
                    className="border-slate-750 text-slate-300 hover:bg-slate-800"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createPlanMutation.isPending || knittingLotsQuery.isLoading}
                    className="bg-blue-600 hover:bg-blue-500"
                  >
                    {createPlanMutation.isPending ? 'Creating...' : 'Create Plan'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
