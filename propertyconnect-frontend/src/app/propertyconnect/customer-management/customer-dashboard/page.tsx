import { Building2, CircleDollarSign, UsersRound } from "lucide-react";

const customerMetrics = [
  { label: "Active customers", value: "1,248", caption: "Across selected company", icon: UsersRound },
  { label: "Tenant accounts", value: "936", caption: "Residential and commercial", icon: Building2 },
  { label: "Monthly billing value", value: "$3.84M", caption: "Rent, service, and recoveries", icon: CircleDollarSign },
];

const customerSegments = [
  { label: "Residential tenants", customers: "824", value: "$1.92M" },
  { label: "Commercial tenants", customers: "286", value: "$1.12M" },
  { label: "Retail tenants", customers: "138", value: "$528K" },
];

export default function CustomerDashboardPage() {
  return (
    <section className="page-surface min-h-[calc(100vh-6rem)] rounded-none border border-[color:var(--line-strong)] shadow-[0_28px_80px_rgba(24,50,71,0.12)]">
      <div className="border-b border-[color:var(--line)] px-5 py-5 sm:px-6 sm:py-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--brand)]">Customer management</p>
        <h1 className="display-font mt-2 text-3xl font-semibold text-[color:var(--brand-strong)]">Customer Dashboard</h1>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-[color:var(--foreground-muted)]">
          Consolidated customer position for tenants, account value, and portfolio-level customer concentration.
        </p>
      </div>

      <div className="grid gap-4 p-4 sm:grid-cols-3 sm:p-6">
        {customerMetrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <article className="panel rounded-[24px] p-5" key={metric.label}>
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--brand-tint)] text-[color:var(--brand)]">
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-[color:var(--foreground-muted)]">{metric.label}</p>
              <p className="display-font mt-2 text-3xl font-semibold text-[color:var(--brand-strong)]">{metric.value}</p>
              <p className="mt-3 text-sm text-[color:var(--foreground-muted)]">{metric.caption}</p>
            </article>
          );
        })}
      </div>

      <div className="px-4 pb-6 sm:px-6">
        <section className="panel overflow-hidden rounded-[28px]">
          <div className="border-b border-[color:var(--line)] p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--brand)]">Customer portfolio</p>
            <h2 className="display-font mt-2 text-xl font-semibold text-[color:var(--brand-strong)]">Segment value</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-[color:var(--surface-muted)] text-xs uppercase tracking-[0.16em] text-[color:var(--foreground-muted)]">
                <tr>
                  <th className="px-5 py-3 font-semibold">Segment</th>
                  <th className="px-5 py-3 font-semibold">Customers</th>
                  <th className="px-5 py-3 font-semibold">Monthly value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--line)]">
                {customerSegments.map((segment) => (
                  <tr key={segment.label}>
                    <td className="px-5 py-4 font-semibold text-[color:var(--brand-strong)]">{segment.label}</td>
                    <td className="px-5 py-4 text-[color:var(--foreground)]">{segment.customers}</td>
                    <td className="px-5 py-4 text-[color:var(--foreground)]">{segment.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </section>
  );
}
