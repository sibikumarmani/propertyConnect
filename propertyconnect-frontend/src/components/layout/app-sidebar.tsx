"use client";

import Link from "next/link";
import { type Dispatch, type SetStateAction, useState } from "react";
import { ChevronDown, PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { collapsedSidebarWidth, expandedSidebarWidth, type NavigationGroup, type NavigationItem } from "@/components/layout/navigation";

type AppSidebarProps = {
  collapsed: boolean;
  groups: NavigationGroup[];
  pathname: string;
  onToggleCollapse: () => void;
};

export function AppSidebar({ collapsed, groups, pathname, onToggleCollapse }: AppSidebarProps) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    Executive: true,
    "Customer Management": true,
  });
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    "CRM Leasing": true,
  });

  return (
    <aside
      className="fixed left-0 top-0 z-40 flex h-screen flex-col border-r transition-all duration-300"
      style={{
        width: collapsed ? collapsedSidebarWidth : expandedSidebarWidth,
        background: "var(--menu-surface)",
        borderColor: "var(--menu-border)",
      }}
    >
      <div className="flex items-center border-b px-3 py-4" style={{ borderColor: "var(--menu-border)" }}>
        {!collapsed ? <span className="flex-1 truncate text-sm font-bold text-[color:var(--brand-strong)]">PropertyConnect</span> : null}
        <button
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="ml-auto rounded-xl p-1.5 text-[color:var(--foreground-muted)] transition hover:bg-[color:var(--surface-muted)]"
          onClick={onToggleCollapse}
          type="button"
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3">
        <div className="flex flex-col gap-1">
          {groups.map((group) => {
            const active = group.items.some((item) => isNavigationItemActive(pathname, item));
            const expanded = active || (expandedGroups[group.label] ?? false);
            const GroupIcon = group.icon;

            return (
              <div key={group.label}>
                <button
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition"
                  onClick={() => !collapsed && setExpandedGroups((previous) => ({ ...previous, [group.label]: !expanded }))}
                  style={{
                    background: active && !collapsed ? "var(--brand-tint)" : "transparent",
                    color: active ? "var(--brand-strong)" : "var(--menu-item-text)",
                  }}
                  title={collapsed ? group.label : undefined}
                  type="button"
                >
                  <GroupIcon className="h-5 w-5 shrink-0" style={{ color: active ? "var(--brand)" : "var(--foreground-muted)" }} />
                  {!collapsed ? (
                    <>
                      <span className="flex-1 text-left">{group.label}</span>
                      <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${expanded ? "rotate-0" : "-rotate-90"}`} />
                    </>
                  ) : null}
                </button>

                {!collapsed && expanded ? (
                  <div className="ml-4 mt-1 flex flex-col gap-0.5 border-l pl-2" style={{ borderColor: "var(--line)" }}>
                    {group.items.map((item) => (
                      <SidebarItem
                        expandedItems={expandedItems}
                        item={item}
                        key={item.href ?? item.label}
                        pathname={pathname}
                        setExpandedItems={setExpandedItems}
                      />
                    ))}
                  </div>
                ) : null}

                {collapsed ? (
                  <div className="mt-1 flex flex-col gap-0.5">
                    {group.items.map((item) => (
                      <SidebarItem
                        collapsed
                        expandedItems={expandedItems}
                        item={item}
                        key={item.href ?? item.label}
                        pathname={pathname}
                        setExpandedItems={setExpandedItems}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}

function SidebarItem({
  collapsed = false,
  expandedItems,
  item,
  pathname,
  setExpandedItems,
}: {
  collapsed?: boolean;
  expandedItems: Record<string, boolean>;
  item: NavigationItem;
  pathname: string;
  setExpandedItems: Dispatch<SetStateAction<Record<string, boolean>>>;
}) {
  const active = isNavigationItemActive(pathname, item);
  const expanded = active || (expandedItems[item.label] ?? false);
  const ItemIcon = item.icon;

  if (item.items?.length) {
    if (collapsed) {
      return item.items.map((child) => (
        <SidebarItem
          collapsed
          expandedItems={expandedItems}
          item={child}
          key={child.href ?? child.label}
          pathname={pathname}
          setExpandedItems={setExpandedItems}
        />
      ));
    }

    return (
      <div>
        <button
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition"
          onClick={() => setExpandedItems((previous) => ({ ...previous, [item.label]: !expanded }))}
          style={{
            background: active ? "var(--brand-tint)" : "transparent",
            color: active ? "var(--brand-strong)" : "var(--foreground)",
          }}
          type="button"
        >
          <ItemIcon className="h-4 w-4" style={{ color: active ? "var(--brand)" : "var(--foreground-subtle)" }} />
          <span className="flex-1 truncate text-left">{item.label}</span>
          <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${expanded ? "rotate-0" : "-rotate-90"}`} />
        </button>
        {expanded ? (
          <div className="ml-4 mt-1 flex flex-col gap-0.5 border-l pl-2" style={{ borderColor: "var(--line)" }}>
            {item.items.map((child) => (
              <SidebarItem
                expandedItems={expandedItems}
                item={child}
                key={child.href ?? child.label}
                pathname={pathname}
                setExpandedItems={setExpandedItems}
              />
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  if (!item.href) {
    return null;
  }

  return (
    <Link
      className={`flex items-center gap-3 rounded-lg text-sm font-medium transition ${collapsed ? "justify-center p-2" : "px-3 py-2"}`}
      href={item.href}
      style={{
        background: active ? "var(--brand-tint)" : "transparent",
        color: active ? "var(--brand-strong)" : "var(--foreground)",
      }}
      title={collapsed ? item.label : undefined}
    >
      <ItemIcon className={collapsed ? "h-5 w-5" : "h-4 w-4"} style={{ color: active ? "var(--brand)" : "var(--foreground-subtle)" }} />
      {!collapsed ? <span className="truncate">{item.label}</span> : null}
    </Link>
  );
}

function isNavigationItemActive(pathname: string, item: NavigationItem): boolean {
  if (item.href && isItemActive(pathname, item.href)) {
    return true;
  }
  return item.items?.some((child) => isNavigationItemActive(pathname, child)) ?? false;
}

function isItemActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
