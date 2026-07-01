"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { masterDataConfig } from "@/lib/master-data-config";

export default function MasterDataSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950/70 p-4">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">Master Data</h2>
      <nav className="space-y-1">
        {masterDataConfig.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.entity}
              href={item.path}
              className={`block rounded px-3 py-2 text-sm ${
                isActive ? "bg-blue-600/20 text-blue-300" : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              {item.title}
            </Link>
          );
        })}
      </nav>

      <h2 className="mb-4 mt-8 text-sm font-semibold uppercase tracking-wide text-slate-400">Inventory</h2>
      <nav className="space-y-1">
        <Link
          href="/tracker/yarn-inward"
          className={`block rounded px-3 py-2 text-sm ${
            pathname === "/tracker/yarn-inward" ? "bg-blue-600/20 text-blue-300" : "text-slate-300 hover:bg-slate-800"
          }`}
        >
          Yarn Inward
        </Link>
        <Link
          href="/tracker/yarn"
          className={`block rounded px-3 py-2 text-sm ${
            pathname === "/tracker/yarn" ? "bg-blue-600/20 text-blue-300" : "text-slate-300 hover:bg-slate-800"
          }`}
        >
          Yarn Inventory
        </Link>
        <Link
          href="/tracker/delivery-notes"
          className={`block rounded px-3 py-2 text-sm ${
            pathname === "/tracker/delivery-notes" ? "bg-blue-600/20 text-blue-300" : "text-slate-300 hover:bg-slate-800"
          }`}
        >
          Delivery Notes (Transfers)
        </Link>
      </nav>

      <h2 className="mb-4 mt-8 text-sm font-semibold uppercase tracking-wide text-slate-400">Knitting</h2>
      <nav className="space-y-1">
        <Link
          href="/tracker/memos"
          className={`block rounded px-3 py-2 text-sm ${
            pathname === "/tracker/memos" ? "bg-blue-600/20 text-blue-300" : "text-slate-300 hover:bg-slate-800"
          }`}
        >
          Memos
        </Link>
        <Link
          href="/tracker/grey-fabric-inward"
          className={`block rounded px-3 py-2 text-sm ${
            pathname === "/tracker/grey-fabric-inward" ? "bg-blue-600/20 text-blue-300" : "text-slate-300 hover:bg-slate-800"
          }`}
        >
          Grey Fabric Inward
        </Link>
        <Link
          href="/tracker/knitter-programs"
          className={`block rounded px-3 py-2 text-sm ${
            pathname === "/tracker/knitter-programs" ? "bg-blue-600/20 text-blue-300" : "text-slate-300 hover:bg-slate-800"
          }`}
        >
          Knitter Production
        </Link>
      </nav>

      <h2 className="mb-4 mt-8 text-sm font-semibold uppercase tracking-wide text-slate-400">Dyeing</h2>
      <nav className="space-y-1">
        <Link
          href="/tracker/dyeing"
          className={`block rounded px-3 py-2 text-sm ${
            pathname === "/tracker/dyeing" ? "bg-blue-600/20 text-blue-300" : "text-slate-300 hover:bg-slate-800"
          }`}
        >
          Dyeing Dispatch
        </Link>
      </nav>

      <h2 className="mb-4 mt-8 text-sm font-semibold uppercase tracking-wide text-slate-400">MES / Planning</h2>
      <nav className="space-y-1">
        <Link
          href="/production-planning"
          className={`block rounded px-3 py-2 text-sm ${
            pathname === "/production-planning" ? "bg-blue-600/20 text-blue-300" : "text-slate-300 hover:bg-slate-800"
          }`}
        >
          Production Plans
        </Link>
        <Link
          href="/production-planning/dashboard"
          className={`block rounded px-3 py-2 text-sm ${
            pathname === "/production-planning/dashboard" ? "bg-blue-600/20 text-blue-300" : "text-slate-300 hover:bg-slate-800"
          }`}
        >
          MES Dashboard
        </Link>
        <Link
          href="/production-planning/events"
          className={`block rounded px-3 py-2 text-sm ${
            pathname === "/production-planning/events" ? "bg-blue-600/20 text-blue-300" : "text-slate-300 hover:bg-slate-800"
          }`}
        >
          Event Timeline
        </Link>
      </nav>
    </aside>
  );
}
