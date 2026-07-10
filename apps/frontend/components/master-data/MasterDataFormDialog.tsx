"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { X, Plus, Pencil } from "lucide-react";

export type FormField = {
  name: string;
  label: string;
  type: "text" | "number";
  required: boolean;
  validation?: {
    pattern: string;
    message: string;
  };
};

type MasterDataFormDialogProps = {
  title: string;
  fields: FormField[];
  openLabel: string;
  submitLabel: string;
  defaultValues?: Record<string, unknown>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSubmit: (values: Record<string, unknown>) => void;
  isPending?: boolean;
};

function getSchema(fields: FormField[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const field of fields) {
    let schema: z.ZodTypeAny;

    if (field.type === "number") {
      schema = field.required
        ? z.coerce.number()
        : z.union([z.coerce.number(), z.literal("")]).optional();
    } else {
      let strSchema: z.ZodTypeAny = z.string();
      if (field.required) {
        strSchema = (strSchema as z.ZodString).min(1, `${field.label} is required`);
      } else {
        strSchema = strSchema.optional().or(z.literal(""));
      }
      if (field.validation?.pattern) {
        const regex = new RegExp(field.validation.pattern);
        schema = strSchema.refine(
          (val) => !val || regex.test(val as string),
          { message: field.validation!.message }
        );
      } else {
        schema = strSchema;
      }
    }
    shape[field.name] = schema;
  }
  return z.object(shape);
}

export default function MasterDataFormDialog({
  title,
  fields,
  openLabel,
  submitLabel,
  defaultValues,
  open: controlledOpen,
  onOpenChange,
  onSubmit,
  isPending,
}: MasterDataFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const schema = useMemo(() => getSchema(fields), [fields]);
  const form = useForm<Record<string, unknown>>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues ?? {},
  });

  useEffect(() => {
    form.reset(defaultValues ?? {});
  }, [defaultValues, form, open]);

  const handleSubmit = form.handleSubmit((values) => {
    onSubmit(values);
    setOpen(false);
    form.reset({});
  });

  const isEdit = submitLabel === "Update";

  return (
    <>
      {/* Trigger button — only shown when not controlled externally */}
      {!onOpenChange && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all duration-200"
        >
          <Plus className="h-4 w-4" />
          {openLabel}
        </button>
      )}

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="w-full max-w-lg rounded-2xl border border-slate-700/60 bg-slate-900/95 shadow-2xl animate-in fade-in-0 slide-in-from-bottom-4 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
              <div className="flex items-center gap-2.5">
                {isEdit
                  ? <Pencil className="h-4 w-4 text-blue-400" />
                  : <Plus className="h-4 w-4 text-emerald-400" />
                }
                <h2 className="text-base font-semibold text-slate-100">{title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {fields.map((field) => (
                  <div
                    key={field.name}
                    className={field.name === "name" || field.name === "description" ? "sm:col-span-2" : ""}
                  >
                    <label
                      className="block text-xs font-medium text-slate-400 mb-1.5"
                      htmlFor={field.name}
                    >
                      {field.label}
                      {field.required && <span className="text-rose-400 ml-0.5">*</span>}
                    </label>
                    <input
                      id={field.name}
                      type={field.type}
                      {...form.register(field.name)}
                      className="w-full rounded-lg border border-slate-700/60 bg-slate-800/80 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all"
                      placeholder={field.label}
                    />
                    {form.formState.errors[field.name] && (
                      <p className="mt-1 text-xs text-rose-400">
                        {form.formState.errors[field.name]?.message?.toString() ||
                          `Invalid ${field.label.toLowerCase()}`}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm font-medium text-slate-300 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all duration-200 disabled:opacity-60 ${
                    isEdit
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/20"
                      : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/20"
                  }`}
                >
                  {isPending ? "Saving..." : submitLabel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
