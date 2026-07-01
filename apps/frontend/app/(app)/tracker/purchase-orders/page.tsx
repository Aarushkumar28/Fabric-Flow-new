'use client';

import PurchaseOrderForm from '@/components/purchase-orders/PurchaseOrderForm';
import { ProtectedRoute } from '@/components/auth/protected-route';

export default function PurchaseOrdersPage() {
  return (
    <ProtectedRoute>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
            Purchase Orders
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Yarn &amp; Grey Fabric POs — generate, preview, and print.
          </p>
        </div>
        <PurchaseOrderForm />
      </div>
    </ProtectedRoute>
  );
}
