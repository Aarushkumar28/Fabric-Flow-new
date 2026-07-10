'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import type { YarnLot, YarnLotFormData, Mill } from '@/types/yarn';

interface YarnLotFormProps {
  initial?: YarnLot | null;
  mills: Mill[];
  onSubmit: (data: YarnLotFormData) => void;
  isSubmitting: boolean;
}

const SELECT_CLASS =
  'w-full rounded-lg border border-slate-700/60 bg-slate-800/80 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all';

export function YarnLotForm({ initial, mills, onSubmit, isSubmitting }: YarnLotFormProps) {
  const [form, setForm] = useState(() => ({
    hfCode: initial?.hfCode || '',
    millId: initial?.millId ? String(initial.millId) : '',
    totalWeight: initial?.totalWeight ? String(initial.totalWeight) : '',
    ratePerKg: initial?.ratePerKg ? String(initial.ratePerKg) : '',
    cgstRate: '2.5',
    sgstRate: '2.5',
    description: initial?.description || '',
    count: initial?.count || '',
  }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      hfCode: form.hfCode,
      millId: Number(form.millId),
      totalWeight: Number(form.totalWeight),
      ratePerKg: Number(form.ratePerKg),
      description: form.description,
      count: form.count,
    });
  };

  // Live calculations
  const totalWeight = Number(form.totalWeight) || 0;
  const ratePerKg = Number(form.ratePerKg) || 0;
  const cgstRate = Number(form.cgstRate) || 0;
  const sgstRate = Number(form.sgstRate) || 0;
  const taxable = totalWeight * ratePerKg;
  const cgstAmt = taxable * (cgstRate / 100);
  const sgstAmt = taxable * (sgstRate / 100);
  const totalCost = taxable + cgstAmt + sgstAmt;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* HF Code + Mill */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-xs font-medium text-slate-400 mb-1.5 block">
            HF Code <span className="text-rose-400">*</span>
          </Label>
          <Input
            value={form.hfCode}
            onChange={(e) => setForm({ ...form, hfCode: e.target.value })}
            required
            placeholder="e.g. HF-001"
            className="bg-slate-800/80 border-slate-700/60 text-slate-200"
          />
        </div>
        <div>
          <Label className="text-xs font-medium text-slate-400 mb-1.5 block">
            Mill <span className="text-rose-400">*</span>
          </Label>
          <select
            required
            className={SELECT_CLASS}
            value={form.millId}
            onChange={(e) => setForm({ ...form, millId: e.target.value })}
          >
            <option value="">Select mill…</option>
            {mills.map((m) => (
              <option key={m.id} value={String(m.id)}>{m.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Total Weight + Rate per Kg */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-xs font-medium text-slate-400 mb-1.5 block">
            Total Weight (kg) <span className="text-rose-400">*</span>
          </Label>
          <Input
            type="number"
            step="any"
            required
            placeholder="0.00"
            className="bg-slate-800/80 border-slate-700/60 text-slate-200"
            value={form.totalWeight}
            onChange={(e) => setForm({ ...form, totalWeight: e.target.value })}
          />
        </div>
        <div>
          <Label className="text-xs font-medium text-slate-400 mb-1.5 block">
            Rate per Kg (₹) <span className="text-rose-400">*</span>
          </Label>
          <Input
            type="number"
            step="any"
            required
            placeholder="0.00"
            className="bg-slate-800/80 border-slate-700/60 text-slate-200"
            value={form.ratePerKg}
            onChange={(e) => setForm({ ...form, ratePerKg: e.target.value })}
          />
        </div>
      </div>

      {/* CGST + SGST */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-xs font-medium text-slate-400 mb-1.5 block">CGST (%)</Label>
          <Input
            type="number"
            step="0.1"
            min="0"
            className="bg-slate-800/80 border-slate-700/60 text-slate-200"
            value={form.cgstRate}
            onChange={(e) => setForm({ ...form, cgstRate: e.target.value })}
          />
        </div>
        <div>
          <Label className="text-xs font-medium text-slate-400 mb-1.5 block">SGST (%)</Label>
          <Input
            type="number"
            step="0.1"
            min="0"
            className="bg-slate-800/80 border-slate-700/60 text-slate-200"
            value={form.sgstRate}
            onChange={(e) => setForm({ ...form, sgstRate: e.target.value })}
          />
        </div>
      </div>

      {/* Description + Count */}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 sm:col-span-1">
          <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Description</Label>
          <Input
            placeholder="e.g. 30s Combed Cotton"
            className="bg-slate-800/80 border-slate-700/60 text-slate-200"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div>
          <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Count</Label>
          <Input
            placeholder="e.g. 30/1"
            className="bg-slate-800/80 border-slate-700/60 text-slate-200"
            value={form.count}
            onChange={(e) => setForm({ ...form, count: e.target.value })}
          />
        </div>
      </div>

      {/* Live Calculation Summary */}
      <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-4 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Live Calculation</p>
        {[
          { label: 'Taxable Amount', value: `₹${taxable.toFixed(2)}` },
          { label: `CGST (${cgstRate}%)`, value: `₹${cgstAmt.toFixed(2)}` },
          { label: `SGST (${sgstRate}%)`, value: `₹${sgstAmt.toFixed(2)}` },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between text-sm">
            <span className="text-slate-400">{label}</span>
            <span className="text-slate-200 font-medium">{value}</span>
          </div>
        ))}
        <div className="flex justify-between text-sm border-t border-slate-700/60 pt-2 mt-1">
          <span className="font-semibold text-slate-200">Total Cost</span>
          <span className="text-lg font-bold text-emerald-400">₹{totalCost.toFixed(2)}</span>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold shadow-lg shadow-emerald-500/20 disabled:opacity-60"
      >
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {initial ? 'Update Lot' : 'Create Lot'}
      </Button>
    </form>
  );
}
