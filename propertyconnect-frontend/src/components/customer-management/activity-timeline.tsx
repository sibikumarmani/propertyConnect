"use client";

import type { StatusHistory } from "@/lib/activity";

export function ActivityTimeline({ activity }: { activity: StatusHistory[] }) {
  if (activity.length === 0) {
    return <p className="rounded-lg border border-[color:var(--line)] p-4 text-sm text-[color:var(--foreground-muted)]">No activity recorded yet.</p>;
  }

  return (
    <div className="grid gap-3">
      {activity.map((item) => (
        <article className="rounded-lg border border-[color:var(--line)] bg-[color:var(--surface-raised)] p-4" key={item.id ?? `${item.entityType}-${item.entityId}-${item.changedAt}`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[color:var(--brand-strong)]">{formatActivityStatus(item)}</p>
              <p className="mt-1 text-sm text-[color:var(--foreground-muted)]">{item.comments || "Status updated"}</p>
            </div>
            <p className="text-xs font-semibold text-[color:var(--foreground-muted)]">{formatDateTime(item.changedAt)}</p>
          </div>
          {item.changedBy !== undefined ? <p className="mt-3 text-xs font-medium text-[color:var(--foreground-subtle)]">By user {item.changedBy}</p> : null}
        </article>
      ))}
    </div>
  );
}

function formatActivityStatus(item: StatusHistory) {
  if (item.fromStatus && item.toStatus) {
    return `${formatLabel(item.fromStatus)} -> ${formatLabel(item.toStatus)}`;
  }
  return formatLabel(item.toStatus ?? item.fromStatus ?? "Activity");
}

function formatDateTime(value?: string) {
  if (!value) {
    return "-";
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
}

function formatLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
