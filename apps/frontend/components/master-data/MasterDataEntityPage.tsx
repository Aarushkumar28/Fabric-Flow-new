"use client";

import { useMemo, useState } from "react";
import { Search, RefreshCw, AlertTriangle } from "lucide-react";
import MasterDataFormDialog, { type FormField } from "./MasterDataFormDialog";
import MasterDataTable from "./MasterDataTable";
import { useMasterData } from "@/hooks/useMasterData";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useQueryClient } from "@tanstack/react-query";

type MasterDataEntityPageProps = {
  entity: string;
  title: string;
  columns: { key: string; header: string }[];
  fields: FormField[];
};

// Derive a singular label: "Mills" → "Mill", "Wash Types" → "Wash Type"
function singular(title: string) {
  if (title.endsWith("s") && !title.endsWith("ss")) return title.slice(0, -1);
  return title;
}

export default function MasterDataEntityPage({
  entity,
  title,
  columns,
  fields,
}: MasterDataEntityPageProps) {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, createMutation, updateMutation, deleteMutation } =
    useMasterData(entity);

  const [editingRow, setEditingRow] = useState<Record<string, unknown> | null>(null);
  const [search, setSearch] = useState("");

  // Client-side search across all string columns
  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data as Array<{ id: string | number; [key: string]: unknown }>;
    return (data as Array<{ id: string | number; [key: string]: unknown }>).filter((row) =>
      Object.values(row).some(
        (val) => val && String(val).toLowerCase().includes(q)
      )
    );
  }, [data, search]);

  const singularTitle = singular(title);

  return (
    <ProtectedRoute>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
              {title}
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {isLoading
                ? "Loading..."
                : `${(data as unknown[]).length} record${(data as unknown[]).length !== 1 ? "s" : ""} total`}
            </p>
          </div>

          <MasterDataFormDialog
            title={`Add ${singularTitle}`}
            openLabel={`Add ${singularTitle}`}
            submitLabel="Create"
            fields={fields}
            isPending={createMutation.isPending}
            onSubmit={(values) => createMutation.mutate(values)}
          />
        </div>

        {/* Search + refresh bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder={`Search ${title.toLowerCase()}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-700/60 bg-slate-800/80 pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all"
            />
          </div>
          <button
            type="button"
            onClick={() => setSearch("")}
            title="Clear search"
            className="rounded-lg border border-slate-700 bg-slate-800/50 p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {/* Error state */}
        {isError && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/5 p-8">
            <AlertTriangle className="h-8 w-8 text-rose-400" />
            <p className="text-sm text-rose-300 font-medium">Failed to load {title.toLowerCase()}</p>
            <button
              type="button"
              onClick={() => queryClient.invalidateQueries({ queryKey: [entity] })}
              className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition-all"
            >
              Retry
            </button>
          </div>
        )}

        {/* Table */}
        {!isError && (
          <MasterDataTable
            columns={columns}
            data={filteredData}
            isLoading={isLoading}
            onEdit={(_, row) => setEditingRow(row)}
            onDelete={(id) => deleteMutation.mutate(id)}
          />
        )}

        {/* Edit dialog — controlled externally */}
        <MasterDataFormDialog
          title={`Edit ${singularTitle}`}
          openLabel=""
          submitLabel="Update"
          fields={fields}
          open={Boolean(editingRow)}
          isPending={updateMutation.isPending}
          onOpenChange={(open) => {
            if (!open) setEditingRow(null);
          }}
          defaultValues={editingRow ?? {}}
          onSubmit={(values) => {
            const rawId = editingRow?.id;
            if (rawId === undefined || rawId === null) return;
            updateMutation.mutate({ id: String(rawId), ...values });
            setEditingRow(null);
          }}
        />
      </div>
    </ProtectedRoute>
  );
}
