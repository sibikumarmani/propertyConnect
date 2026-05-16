"use client";

import {
  Building2,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Home,
  TrendingUp,
  Wrench,
  type LucideIcon,
} from "lucide-react";

type Tone = "brand" | "success" | "warning" | "danger";

type ExecutiveMetricItem = {
  label: string;
  value: string;
  caption: string;
  change: string;
  icon: LucideIcon;
  tone: Tone;
};

type PortfolioMixItem = {
  label: string;
  value: string;
  percent: number;
};

type RiskItemData = {
  label: string;
  value: string;
  caption: string;
};

type AssetStatus = "Strong" | "Stable" | "Watch" | "Action";

type AssetPerformanceItem = {
  asset: string;
  occupancy: string;
  revenue: string;
  collection: string;
  status: AssetStatus;
};

const executiveMetrics: ExecutiveMetricItem[] = [
  {
    label: "Portfolio value",
    value: "$248.6M",
    caption: "Across 18 managed assets",
    change: "+6.4% YoY",
    icon: Building2,
    tone: "success",
  },
  {
    label: "Monthly revenue",
    value: "$3.84M",
    caption: "Rent, service, and recoveries",
    change: "+4.1% vs last month",
    icon: CircleDollarSign,
    tone: "success",
  },
  {
    label: "Occupancy",
    value: "94.7%",
    caption: "1,286 of 1,358 units occupied",
    change: "Target 96%",
    icon: Home,
    tone: "warning",
  },
  {
    label: "Net collection",
    value: "91.8%",
    caption: "$314K overdue balance",
    change: "-2.3% vs target",
    icon: CreditCard,
    tone: "danger",
  },
];

const portfolioMix: PortfolioMixItem[] = [
  { label: "Residential", value: "$1.92M", percent: 50 },
  { label: "Commercial", value: "$1.12M", percent: 29 },
  { label: "Retail", value: "$528K", percent: 14 },
  { label: "Parking & other", value: "$272K", percent: 7 },
];

const riskItems: RiskItemData[] = [
  { label: "Leases expiring in 90 days", value: "42", caption: "$486K monthly revenue at renewal risk" },
  { label: "High-value overdue accounts", value: "18", caption: "$221K concentrated in top 10 tenants" },
  { label: "Critical maintenance backlog", value: "9", caption: "Elevator, HVAC, and water-pressure issues" },
];

const assetPerformance: AssetPerformanceItem[] = [
  { asset: "Harbor Heights", occupancy: "98.2%", revenue: "$842K", collection: "96.1%", status: "Strong" },
  { asset: "Cedar Business Park", occupancy: "92.4%", revenue: "$618K", collection: "89.7%", status: "Watch" },
  { asset: "Metro Retail Plaza", occupancy: "88.9%", revenue: "$406K", collection: "84.2%", status: "Action" },
  { asset: "Palm Residence", occupancy: "96.8%", revenue: "$512K", collection: "93.5%", status: "Stable" },
];

export function Dashboard() {
  return (
    <section className="page-surface min-h-[calc(100vh-6rem)] rounded-none border border-[color:var(--line-strong)] shadow-[0_28px_80px_rgba(24,50,71,0.12)]">
      <div className="border-b border-[color:var(--line)] px-5 py-5 sm:px-6 sm:py-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--brand)]">Executive dashboard</p>
        <h1 className="display-font mt-2 text-3xl font-semibold text-[color:var(--brand-strong)]">
          Executive Dashboard
        </h1>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-[color:var(--foreground-muted)]">
          CEO-level view of asset value, revenue, occupancy, collections, lease exposure, and operational risk for the selected company.
        </p>
      </div>

      <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6 xl:grid-cols-4">
        {executiveMetrics.map((metric) => (
          <ExecutiveMetric key={metric.label} {...metric} />
        ))}
      </div>

      <div className="grid gap-4 px-4 pb-6 sm:px-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="panel rounded-[28px] p-5 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--brand)]">Revenue mix</p>
              <h2 className="display-font mt-2 text-xl font-semibold text-[color:var(--brand-strong)]">
                Monthly income by asset class
              </h2>
            </div>
            <span className="w-fit rounded-full bg-[color:var(--brand-tint)] px-3 py-1 text-xs font-semibold text-[color:var(--brand-strong)]">
              $3.84M total
            </span>
          </div>
          <div className="mt-6 space-y-4">
            {portfolioMix.map((item) => (
              <ProgressRow key={item.label} {...item} />
            ))}
          </div>
        </section>

        <section className="panel rounded-[28px] p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--brand)]">Board attention</p>
          <h2 className="display-font mt-2 text-xl font-semibold text-[color:var(--brand-strong)]">Top risks</h2>
          <div className="mt-5 space-y-3">
            {riskItems.map((item) => (
              <RiskItem key={item.label} {...item} />
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-4 px-4 pb-6 sm:px-6 xl:grid-cols-[1fr_1.2fr]">
        <section className="panel rounded-[28px] p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--brand)]">Operating health</p>
          <h2 className="display-font mt-2 text-xl font-semibold text-[color:var(--brand-strong)]">Management priorities</h2>
          <div className="mt-5 grid gap-3">
            <PriorityCard icon={TrendingUp} label="Revenue protection" value="$486K" caption="Renewals requiring executive oversight" />
            <PriorityCard icon={Clock3} label="Collection acceleration" value="7 days" caption="Reduce average overdue period this month" />
            <PriorityCard icon={Wrench} label="Service reliability" value="96 hrs" caption="Target closure time for critical work orders" />
          </div>
        </section>

        <section className="panel overflow-hidden rounded-[28px]">
          <div className="border-b border-[color:var(--line)] p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--brand)]">Asset performance</p>
            <h2 className="display-font mt-2 text-xl font-semibold text-[color:var(--brand-strong)]">Executive asset ranking</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="bg-[color:var(--surface-muted)] text-xs uppercase tracking-[0.16em] text-[color:var(--foreground-muted)]">
                <tr>
                  <th className="px-5 py-3 font-semibold">Asset</th>
                  <th className="px-5 py-3 font-semibold">Occupancy</th>
                  <th className="px-5 py-3 font-semibold">Revenue</th>
                  <th className="px-5 py-3 font-semibold">Collection</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--line)]">
                {assetPerformance.map((asset) => (
                  <tr key={asset.asset}>
                    <td className="px-5 py-4 font-semibold text-[color:var(--brand-strong)]">{asset.asset}</td>
                    <td className="px-5 py-4 text-[color:var(--foreground)]">{asset.occupancy}</td>
                    <td className="px-5 py-4 text-[color:var(--foreground)]">{asset.revenue}</td>
                    <td className="px-5 py-4 text-[color:var(--foreground)]">{asset.collection}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${assetStatusClass(asset.status)}`}>
                        {asset.status}
                      </span>
                    </td>
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

function ExecutiveMetric({
  caption,
  change,
  icon: Icon,
  label,
  tone,
  value,
}: {
  caption: string;
  change: string;
  icon: LucideIcon;
  label: string;
  tone: Tone;
  value: string;
}) {
  return (
    <article className="panel flex h-full flex-col rounded-[24px] p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-[color:var(--foreground-muted)]">{label}</p>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${toneClass(tone)}`}>{change}</span>
      </div>
      <p className="display-font text-3xl font-semibold text-[color:var(--brand-strong)]">{value}</p>
      <div className="mt-4 flex items-center gap-2 text-sm text-[color:var(--foreground-muted)]">
        <Icon className="h-4 w-4 shrink-0 text-[color:var(--brand)]" />
        <span>{caption}</span>
      </div>
    </article>
  );
}

function ProgressRow({ label, percent, value }: { label: string; percent: number; value: string }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold text-[color:var(--brand-strong)]">{label}</span>
        <span className="text-[color:var(--foreground-muted)]">{value}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-[color:var(--surface-muted)]">
        <div className="h-full rounded-full bg-[color:var(--brand)]" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function RiskItem({ caption, label, value }: { caption: string; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-raised)] p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[color:var(--brand-strong)]">{label}</p>
          <p className="mt-1 text-sm leading-6 text-[color:var(--foreground-muted)]">{caption}</p>
        </div>
        <span className="display-font text-2xl font-semibold text-[color:var(--brand)]">{value}</span>
      </div>
    </div>
  );
}

function PriorityCard({ caption, icon: Icon, label, value }: { caption: string; icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-raised)] p-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--brand-tint)] text-[color:var(--brand)]">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[color:var(--brand-strong)]">{label}</p>
        <p className="mt-1 text-sm text-[color:var(--foreground-muted)]">{caption}</p>
      </div>
      <p className="display-font text-2xl font-semibold text-[color:var(--brand-strong)]">{value}</p>
    </div>
  );
}

function assetStatusClass(status: AssetStatus) {
  if (status === "Strong" || status === "Stable") {
    return toneClass("success");
  }

  if (status === "Watch") {
    return toneClass("warning");
  }

  return toneClass("danger");
}

function toneClass(tone: Tone) {
  const classes: Record<Tone, string> = {
    brand: "pill-brand",
    danger: "pill-danger",
    success: "pill-success",
    warning: "pill-warning",
  };

  return classes[tone];
}
