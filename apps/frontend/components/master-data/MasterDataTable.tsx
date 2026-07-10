"use client";

import { Pencil, Trash2 } from "lucide-react";

type Column = {
  key: string;
  header: string;
};

type RowData = {
  id: string | number;
  [key: string]: unknown;
};

type MasterDataTableProps = {
  columns: Column[];
  data: RowData[];
  isLoading?: boolean;
  onEdit: (id: string, values: Record<string, unknown>) => void;
  onDelete: (id: string | number) => void;
};

function Skeleton({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="border-t border-slate-800/60">
          {Array.from({ length: cols + 1 }).map((__, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 rounded-md bg-slate-800 animate-pulse" style={{ width: j === cols ? "80px" : "auto" }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function MobileCards({
  columns,
  data,
  isLoading,
  onEdit,
  onDelete,
}: MasterDataTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3 p-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-2">
            {Array.from({ length: 3 }).map((__, j) => (
              <div key={j} className="h-4 rounded bg-slate-800 animate-pulse" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-slate-500">
        No records found. Add one above.
      </div>
    );
  }

  return (
    <div className="space-y-3 p-3">
      {data.map((row) => (
        <div
          key={row.id}
          className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-2"
        >
          {columns.map((column) => (
            column.key === "id" ? null : (
              <div key={column.key} className="flex justify-between items-start gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 shrink-0">
                  {column.header}
                </span>
                {column.key === "hexCode" && row[column.key] ? (
                  <div className="flex items-center gap-1.5">
                    <div
                      className="h-3.5 w-3.5 rounded-full border border-slate-700"
                      style={{ backgroundColor: String(row[column.key]) }}
                    />
                    <span className="font-mono text-xs text-slate-300">
                      {String(row[column.key])}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-slate-200 text-right">
                    {String(row[column.key] ?? "—")}
                  </span>
                )}
              </div>
            )
          ))}
          <div className="flex gap-2 pt-2 border-t border-slate-800/60">
            <button
              type="button"
              onClick={() => onEdit(String(row.id), row as Record<string, unknown>)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs font-medium text-blue-300 hover:bg-blue-500/20 transition-all"
            >
              <Pencil className="h-3 w-3" />
              Edit
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm("Are you sure you want to delete this record?")) {
                  onDelete(row.id);
                }
              }}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-300 hover:bg-rose-500/20 transition-all"
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </button>
          </div>
        </div>
      ))}
      {data.length > 0 && (
        <p className="text-right text-xs text-slate-500 pr-1">
          {data.length} record{data.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}

export default function MasterDataTable(props: MasterDataTableProps) {
  const { columns, data, isLoading, onEdit, onDelete } = props;

  return (
    <>
      {/* Mobile: card layout */}
      <div className="block md:hidden rounded-xl border border-slate-800 bg-slate-900/40">
        <MobileCards {...props} />
      </div>

      {/* Desktop: table layout */}
      <div className="hidden md:block overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/80">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-400"
                >
                  {column.header}
                </th>
              ))}
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-widest text-slate-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <Skeleton cols={columns.length} />
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="px-4 py-12 text-center text-sm text-slate-500"
                >
                  No records found. Add one above.
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr
                  key={row.id}
                  className={`border-t border-slate-800/60 transition-colors hover:bg-slate-800/30 ${
                    idx % 2 === 0 ? "" : "bg-slate-950/20"
                  }`}
                >
                  {columns.map((column) => (
                    <td key={`${row.id}-${column.key}`} className="px-4 py-3 text-slate-200">
                      {column.key === "hexCode" && row[column.key] ? (
                        <div className="flex items-center gap-2">
                          <div
                            className="h-4 w-4 rounded-full border border-slate-700 shrink-0"
                            style={{ backgroundColor: String(row[column.key]) }}
                          />
                          <span className="font-mono text-xs text-slate-300">
                            {String(row[column.key])}
                          </span>
                        </div>
                      ) : (
                        <span className={column.key === "id" ? "font-mono text-xs text-slate-500" : ""}>
                          {String(row[column.key] ?? "—")}
                        </span>
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(String(row.id), row as Record<string, unknown>)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 px-2.5 py-1.5 text-xs font-medium text-blue-300 hover:bg-blue-500/20 hover:border-blue-500/50 transition-all duration-150"
                      >
                        <Pencil className="h-3 w-3" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this record?")) {
                            onDelete(row.id);
                          }
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-500/20 hover:border-rose-500/50 transition-all duration-150"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {!isLoading && data.length > 0 && (
          <div className="border-t border-slate-800/60 px-4 py-2.5 text-right">
            <span className="text-xs text-slate-500">{data.length} record{data.length !== 1 ? "s" : ""}</span>
          </div>
        )}
      </div>
    </>
  );
}
