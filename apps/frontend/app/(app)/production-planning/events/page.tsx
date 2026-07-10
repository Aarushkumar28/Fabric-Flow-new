'use client';

import { QueryStateWrapper } from '@/components/production/query-state-wrapper';
import { useProductionEvents } from '@/hooks/use-production-events';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Card, CardContent } from '@/components/ui/card';
import {
  ClipboardPlus, Ban, Activity,
} from 'lucide-react';
import { ProductionEventType } from '@/types/production';

function isMetadataRecord(metadata: unknown): metadata is Record<string, unknown> {
  return typeof metadata === 'object' && metadata !== null && !Array.isArray(metadata);
}

export default function EventsPage() {
  const { data: events = [], isLoading, error, refetch } = useProductionEvents();

  const getEventIcon = (type: ProductionEventType) => {
    switch (type) {
      case 'PLAN_CREATED':
        return <ClipboardPlus className="h-4 w-4 text-blue-400" />;
      case 'PLAN_CANCELLED':
        return <Ban className="h-4 w-4 text-rose-400" />;
      default:
        return <Activity className="h-4 w-4 text-slate-400" />;
    }
  };

  const getEventColor = (type: ProductionEventType) => {
    switch (type) {
      case 'PLAN_CREATED':
        return 'bg-blue-500/10 border-blue-500/30';
      case 'PLAN_CANCELLED':
        return 'bg-rose-500/10 border-rose-500/30';
      default:
        return 'bg-slate-800/80 border-slate-700/50';
    }
  };

  return (
    <ProtectedRoute>
      <QueryStateWrapper
        isLoading={isLoading}
        error={error}
        retry={refetch}
        isEmpty={events.length === 0}
        emptyTitle="No MES Events"
        emptyDescription="No production events have been recorded yet."
      >
        <div className="p-6 space-y-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              Operational Event Timeline
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Complete, tamper-evident audit history of all production plan lifecycles and machine operations.
            </p>
          </div>

          <Card className="glass-card border-slate-800 bg-slate-900/40">
            <CardContent className="p-6">
              <div className="relative pl-6 border-l border-slate-800 space-y-6">
                  {events.map((event) => (
                    <div key={event.id} className="relative group">
                      {/* Icon Node */}
                      <div
                        className={`absolute -left-10 top-0.5 p-2 rounded-xl border flex items-center justify-center ${getEventColor(event.eventType)} shadow-lg`}
                      >
                        {getEventIcon(event.eventType)}
                      </div>

                      {/* Log Content Card */}
                      <div className="border border-slate-800/60 bg-slate-900/30 rounded-xl p-4 transition-all duration-300 hover:border-slate-700/50 hover:bg-slate-800/10">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            {event.eventType.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(event.createdAt).toLocaleString()}
                          </span>
                        </div>

                        <p className="text-sm text-slate-200 mt-2 font-medium">
                          {event.message}
                        </p>

                        {/* Meta labels */}
                        <div className="flex gap-4 mt-3">
                          {event.productionPlanId !== null && (
                            <div className="text-[10px] text-slate-500">
                              Plan ID: <strong className="text-slate-400">#{event.productionPlanId}</strong>
                            </div>
                          )}
                        </div>

                        {/* Metadata details if exists */}
                        {isMetadataRecord(event.metadata) && Object.keys(event.metadata).length > 0 && (
                          <div className="mt-3 bg-slate-950/80 border border-slate-800/50 rounded-lg p-2.5">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1 mb-1">
                              Event Metadata
                            </span>
                            <pre className="text-[10px] text-slate-400 font-mono overflow-x-auto max-w-full">
                              {JSON.stringify(event.metadata, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
            </CardContent>
          </Card>
        </div>
      </QueryStateWrapper>
    </ProtectedRoute>
  );
}
