"use client";

import { useCallback, useEffect, useState } from "react";
import { BarChart3, Loader2, RefreshCcw } from "lucide-react";

import { reportSummary, type ReportSummary } from "@/lib/reports";

export function CustomerManagementReports() {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setSummary(await reportSummary());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load report data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  return (
    <section className="page-surface min-h-[calc(100vh-6rem)] rounded-none border border-[color:var(--line-strong)] shadow-[0_28px_80px_rgba(24,50,71,0.12)]">
      <div className="border-b border-[color:var(--line)] px-5 py-5 sm:px-6 sm:py-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--brand)]">Customer management</p>
        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[color:var(--brand-tint)] text-[color:var(--brand)]">
              <BarChart3 className="h-5 w-5" />
            </span>
            <h1 className="display-font text-3xl font-semibold text-[color:var(--brand-strong)]">Reports</h1>
          </div>
          <button className="btn-secondary inline-flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold" onClick={refresh} type="button">
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {error ? <div className="mx-4 mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 xl:mx-6">{error}</div> : null}

      <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-4 xl:p-6">
        {loading ? (
          <div className="panel flex items-center gap-2 rounded-lg p-5 text-sm text-[color:var(--foreground-muted)]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading reports...
          </div>
        ) : null}
        <Metric label="Leads" value={String(summary?.leads ?? 0)} caption="Total enquiries" />
        <Metric label="Qualified leads" value={String(summary?.qualifiedLeads ?? 0)} caption="Ready to convert" />
        <Metric label="Prospects" value={String(summary?.prospects ?? 0)} caption="Active pipeline" />
        <Metric label="Reservations" value={String(summary?.activeReservations ?? 0)} caption="Active approvals and payments" />
        <Metric label="Confirmed" value={String(summary?.confirmedReservations ?? 0)} caption="Reserved units" />
      </div>
    </section>
  );
}

function Metric({ label, value, caption }: { label: string; value: string; caption: string }) {
  return (
    <article className="panel rounded-lg p-5">
      <p className="text-sm font-medium text-[color:var(--foreground-muted)]">{label}</p>
      <p className="display-font mt-2 text-3xl font-semibold text-[color:var(--brand-strong)]">{value}</p>
      <p className="mt-3 text-sm text-[color:var(--foreground-muted)]">{caption}</p>
    </article>
  );
}
