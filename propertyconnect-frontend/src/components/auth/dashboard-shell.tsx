"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Building2,
  ChevronDown,
  ClipboardCheck,
  CreditCard,
  FileText,
  House,
  Layers3,
  LogOut,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  Sparkles,
  SquareStack,
  UserCircle2,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";

const tokenKey = "propertyConnect.authToken";
const selectedCompanyKey = "propertyConnect.selectedCompany";
const userKey = "propertyConnect.user";
const userProfileKey = "propertyConnect.userProfile";
const companiesKey = "propertyConnect.companies";
const loginPath = "/propertyconnect/login";

type StoredCompany = {
  code?: string;
  name?: string;
};

type StoredUser = {
  name?: string;
  email?: string;
};

type NavigationItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

type NavigationGroup = {
  label: string;
  icon: LucideIcon;
  items: NavigationItem[];
};

const navigationGroups: NavigationGroup[] = [
  {
    label: "Insights",
    icon: BarChart3,
    items: [
      { href: "/propertyconnect/dashboard", label: "Dashboard", icon: BarChart3 },
      { href: "/propertyconnect/reports", label: "Reports", icon: FileText },
      { href: "/propertyconnect/notifications", label: "Notifications", icon: MessageSquare },
    ],
  },
  {
    label: "Administration",
    icon: ShieldCheck,
    items: [
      { href: "/propertyconnect/users", label: "Users", icon: Users },
      { href: "/propertyconnect/roles", label: "Roles", icon: ShieldCheck },
      { href: "/propertyconnect/approvals", label: "Approvals", icon: ClipboardCheck },
    ],
  },
  {
    label: "Property Setup",
    icon: House,
    items: [
      { href: "/propertyconnect/properties", label: "Properties", icon: House },
      { href: "/propertyconnect/buildings", label: "Buildings", icon: Layers3 },
      { href: "/propertyconnect/units", label: "Units", icon: SquareStack },
    ],
  },
  {
    label: "Leasing",
    icon: FileText,
    items: [
      { href: "/propertyconnect/leases", label: "Leases", icon: FileText },
      { href: "/propertyconnect/rent-billing", label: "Rent & Billing", icon: CreditCard },
      { href: "/propertyconnect/tenants", label: "Tenants", icon: Users },
      { href: "/propertyconnect/owners", label: "Owners", icon: Building2 },
    ],
  },
  {
    label: "Work Orders",
    icon: Wrench,
    items: [
      { href: "/propertyconnect/maintenance", label: "Maintenance", icon: Wrench },
      { href: "/propertyconnect/inspections", label: "Inspections", icon: ClipboardCheck },
    ],
  },
];

export function DashboardShell() {
  const pathname = usePathname();
  const [company, setCompany] = useState<StoredCompany | null>(null);
  const [user, setUser] = useState<StoredUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const userInitials = useMemo(() => initials(user?.name), [user?.name]);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      const storage = getAuthStorage();

      if (!storage) {
        window.location.replace(loginPath);
        return;
      }

      setCompany(readStoredObject<StoredCompany>(storage, selectedCompanyKey));
      setUser(readStoredObject<StoredUser>(storage, userKey));
      setIsLoaded(true);
    }, 0);

    return () => window.clearTimeout(timerId);
  }, []);

  function signOut() {
    [localStorage, sessionStorage].forEach((storage) => {
      storage.removeItem(tokenKey);
      storage.removeItem(companiesKey);
      storage.removeItem(selectedCompanyKey);
      storage.removeItem(userKey);
      storage.removeItem(userProfileKey);
    });
    window.location.assign(loginPath);
  }

  if (!isLoaded) {
    return (
      <main className="flex min-h-screen items-center justify-center px-5">
        <div className="panel rounded-[28px] px-8 py-6 text-sm font-semibold text-[color:var(--brand-strong)]">
          Opening workspace...
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen">
      <Sidebar
        collapsed={sidebarCollapsed}
        groups={navigationGroups}
        pathname={pathname}
        onToggleCollapse={() => setSidebarCollapsed((value) => !value)}
      />

      <div className="transition-all duration-300" style={{ marginLeft: sidebarCollapsed ? 64 : 260 }}>
        <div className="fixed right-0 top-0 z-40 transition-all duration-300" style={{ left: sidebarCollapsed ? 64 : 260 }}>
          <TopBar company={company} user={user} userInitials={userInitials} onLogout={signOut} />
        </div>

        <main className="mx-auto max-w-[1600px] p-0 pt-20 sm:pt-22 lg:pt-24">
          <section className="page-surface min-h-[calc(100vh-6rem)] rounded-none border border-[color:var(--line-strong)] shadow-[0_28px_80px_rgba(24,50,71,0.12)]">
            <div className="border-b border-[color:var(--line)] px-5 py-5 sm:px-6 sm:py-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--brand)]">Workspace</p>
              <h1 className="display-font mt-2 text-3xl font-semibold text-[color:var(--brand-strong)]">
                {company?.name ? company.name : "Property workspace"}
              </h1>
              <p className="mt-3 max-w-4xl text-sm leading-7 text-[color:var(--foreground-muted)]">
                {user?.name ? `${user.name} is signed in through coreConnect ERP.` : "You are signed in through coreConnect ERP."}
              </p>
            </div>

            <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6 xl:grid-cols-4">
              <StatCard label="Company" value={company?.code || "Active"} caption={company?.name || "Selected context"} />
              <StatCard label="Authentication" value="ERP" caption="Validated by coreConnect" tone="success" />
              <StatCard label="Scope" value="Login" caption="Initial integration phase" tone="warning" />
              <StatCard label="Backend" value="Live" caption="PropertyConnect API" tone="success" />
            </div>

            <div className="grid gap-4 px-4 pb-6 sm:px-6 xl:grid-cols-[1.2fr_0.8fr]">
              <section className="panel rounded-[28px] p-5 sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--brand)]">Next modules</p>
                <h2 className="display-font mt-2 text-xl font-semibold text-[color:var(--brand-strong)]">Navigation preview</h2>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {navigationGroups.slice(2).map((group) => (
                    <div className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-raised)] p-4" key={group.label}>
                      <group.icon className="h-5 w-5 text-[color:var(--brand)]" />
                      <p className="mt-3 text-sm font-semibold text-[color:var(--brand-strong)]">{group.label}</p>
                      <p className="mt-1 text-sm text-[color:var(--foreground-muted)]">{group.items.map((item) => item.label).join(", ")}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="panel rounded-[28px] p-5 sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--brand)]">Session</p>
                <h2 className="display-font mt-2 text-xl font-semibold text-[color:var(--brand-strong)]">Active context</h2>
                <dl className="mt-5 space-y-4 text-sm">
                  <div>
                    <dt className="text-[color:var(--foreground-muted)]">User</dt>
                    <dd className="mt-1 font-semibold text-[color:var(--brand-strong)]">{user?.name || "User"}</dd>
                  </div>
                  <div>
                    <dt className="text-[color:var(--foreground-muted)]">Company</dt>
                    <dd className="mt-1 font-semibold text-[color:var(--brand-strong)]">{company?.name || "Not selected"}</dd>
                  </div>
                  <div>
                    <dt className="text-[color:var(--foreground-muted)]">Company code</dt>
                    <dd className="mt-1 font-semibold text-[color:var(--brand-strong)]">{company?.code || "-"}</dd>
                  </div>
                </dl>
              </section>
            </div>
          </section>
        </main>
      </div>

      <Link
        className="fixed bottom-6 right-6 z-30 inline-flex items-center gap-2 rounded-full bg-[color:var(--brand)] px-4 py-3 text-sm font-semibold text-white shadow-[0_20px_45px_rgba(16,39,56,0.26)] transition hover:-translate-y-0.5 hover:brightness-105"
        href="/propertyconnect/dashboard"
      >
        <Sparkles className="h-4 w-4" />
        <span>Agent</span>
      </Link>
    </div>
  );
}

function Sidebar({
  collapsed,
  groups,
  pathname,
  onToggleCollapse,
}: {
  collapsed: boolean;
  groups: NavigationGroup[];
  pathname: string;
  onToggleCollapse: () => void;
}) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ Insights: true });

  return (
    <aside
      className="fixed left-0 top-0 z-40 flex h-screen flex-col border-r transition-all duration-300"
      style={{
        width: collapsed ? 64 : 260,
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
            const active = group.items.some((item) => isItemActive(pathname, item.href));
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
                      <SidebarItem item={item} key={item.href} pathname={pathname} />
                    ))}
                  </div>
                ) : null}

                {collapsed ? (
                  <div className="mt-1 flex flex-col gap-0.5">
                    {group.items.map((item) => (
                      <SidebarItem collapsed item={item} key={item.href} pathname={pathname} />
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

function SidebarItem({ collapsed = false, item, pathname }: { collapsed?: boolean; item: NavigationItem; pathname: string }) {
  const active = isItemActive(pathname, item.href);
  const ItemIcon = item.icon;

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

function TopBar({
  company,
  user,
  userInitials,
  onLogout,
}: {
  company: StoredCompany | null;
  user: StoredUser | null;
  userInitials: string;
  onLogout: () => void;
}) {
  return (
    <header className="topbar-shade relative z-40 border-b text-white backdrop-blur-xl" style={{ borderColor: "var(--topbar-border)" }}>
      <div className="mx-auto flex h-18 max-w-[1600px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/70">Application</p>
          <h2 className="display-font truncate text-2xl font-semibold text-white">Property Management Administration</h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden min-w-0 text-right md:block">
            <p className="truncate text-sm font-semibold text-white">{user?.name || "User"}</p>
            <p className="truncate text-xs text-white/70">{company?.name || user?.email || "Member"}</p>
          </div>
          <div className="topbar-button flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl text-sm font-bold">
            {userInitials || <UserCircle2 className="h-5 w-5" />}
          </div>
          <button
            aria-label="Sign out"
            className="topbar-button flex h-12 w-12 items-center justify-center rounded-2xl transition hover:brightness-110"
            onClick={onLogout}
            type="button"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}

function StatCard({ caption, label, tone = "brand", value }: { caption: string; label: string; tone?: "brand" | "success" | "warning"; value: string }) {
  const toneClass = tone === "success" ? "pill-success" : tone === "warning" ? "pill-warning" : "pill-brand";

  return (
    <article className="panel flex h-full flex-col rounded-[24px] p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-[color:var(--foreground-muted)]">{label}</p>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${toneClass}`}>Live</span>
      </div>
      <p className="display-font text-3xl font-semibold text-[color:var(--brand-strong)]">{value}</p>
      <p className="mt-2 text-sm text-[color:var(--foreground-muted)]">{caption}</p>
    </article>
  );
}

function isItemActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getAuthStorage() {
  if (localStorage.getItem(tokenKey)) {
    return localStorage;
  }

  if (sessionStorage.getItem(tokenKey)) {
    return sessionStorage;
  }

  return null;
}

function readStoredObject<T>(storage: Storage, key: string): T | null {
  const rawValue = storage.getItem(key);

  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function initials(value?: string) {
  return (value ?? "PC")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
