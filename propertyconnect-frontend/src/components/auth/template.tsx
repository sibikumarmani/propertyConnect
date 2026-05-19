"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopBar, type WorkspaceCompany, type WorkspaceUser } from "@/components/layout/app-top-bar";
import { collapsedSidebarWidth, expandedSidebarWidth, navigationGroups } from "@/components/layout/navigation";
import { getSession, logout as logoutSession, type CompanyMapping } from "@/lib/auth";
import { applyThemeSettings, getStoredAccentColor, getStoredThemeMode } from "@/lib/theme";

const tokenKey = "propertyConnect.authToken";
const selectedCompanyKey = "propertyConnect.selectedCompany";
const userKey = "propertyConnect.user";
const userProfileKey = "propertyConnect.userProfile";
const companiesKey = "propertyConnect.companies";
const companySelectionReturnPathKey = "propertyConnect.companySelectionReturnPath";
const previousCompanyKey = "propertyConnect.previousCompany";
const loginPath = "/propertyconnect/login";
const companySelectionPath = "/propertyconnect/company-selection";
const standalonePaths = new Set([loginPath, "/propertyconnect/company-selection"]);

type StoredUserProfile = Record<string, unknown>;

export function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isStandalonePath = standalonePaths.has(pathname);
  const [company, setCompany] = useState<WorkspaceCompany | null>(null);
  const [user, setUser] = useState<WorkspaceUser | null>(null);
  const [userProfile, setUserProfile] = useState<StoredUserProfile | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const userInitials = useMemo(() => initials(user?.name), [user?.name]);
  const userCode = stringValue(userProfile?.userCode ?? userProfile?.loginId ?? user?.id);
  const userRole = buildUserRole(userProfile, company);
  const userAvatarImage = profileImage(userProfile);

  useEffect(() => {
    applyThemeSettings(getStoredThemeMode(), getStoredAccentColor(), false);
  }, []);

  useEffect(() => {
    if (isStandalonePath) {
      return;
    }

    const timerId = window.setTimeout(async () => {
      const storage = getAuthStorage() ?? sessionStorage;

      try {
        const session = await getSession();
        if (!session.authenticated) {
          throw new Error("Please sign in again.");
        }

        if (session.user) {
          storage.setItem(userKey, JSON.stringify(session.user));
        }
        if (session.companies?.length) {
          storage.setItem(companiesKey, JSON.stringify(session.companies));
        }
        if (session.userProfile) {
          storage.setItem(userProfileKey, JSON.stringify(session.userProfile));
        }

        const storedCompany =
          readStoredObject<WorkspaceCompany>(storage, selectedCompanyKey) ??
          selectedCompanyFromSession(session.companies ?? [], session.selectedCompanyId);

        if (!storedCompany) {
          window.location.replace(companySelectionPath);
          return;
        }

        storage.setItem(selectedCompanyKey, JSON.stringify(storedCompany));
        setCompany(storedCompany);
        setUser(readStoredObject<WorkspaceUser>(storage, userKey));
        setUserProfile(readStoredObject<StoredUserProfile>(storage, userProfileKey));
        setIsLoaded(true);
      } catch {
        clearSessionStorage(localStorage);
        clearSessionStorage(sessionStorage);
        window.location.replace(loginPath);
      }
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [isStandalonePath, pathname]);

  function signOut() {
    logoutSession();
    clearSessionStorage(localStorage);
    clearSessionStorage(sessionStorage);
    window.location.assign(loginPath);
  }

  function switchCompany() {
    const storage = getAuthStorage();

    if (!storage) {
      window.location.assign(loginPath);
      return;
    }

    storage.removeItem(selectedCompanyKey);
    storage.setItem(companySelectionReturnPathKey, pathname || "/propertyconnect/dashboard");

    if (company) {
      storage.setItem(previousCompanyKey, JSON.stringify(company));
    }

    window.location.assign(companySelectionPath);
  }

  if (isStandalonePath) {
    return children;
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
      <AppSidebar
        collapsed={sidebarCollapsed}
        groups={navigationGroups}
        pathname={pathname}
        onToggleCollapse={() => setSidebarCollapsed((value) => !value)}
      />

      <div className="transition-all duration-300" style={{ marginLeft: sidebarCollapsed ? collapsedSidebarWidth : expandedSidebarWidth }}>
        <div
          className="fixed right-0 top-0 z-40 transition-all duration-300"
          style={{ left: sidebarCollapsed ? collapsedSidebarWidth : expandedSidebarWidth }}
        >
          <AppTopBar
            company={company}
            user={user}
            avatarImage={userAvatarImage}
            userCode={userCode}
            userInitials={userInitials}
            userRole={userRole}
            onLogout={signOut}
            onSwitchCompany={switchCompany}
          />
        </div>

        <main className="mx-auto max-w-[1600px] p-0 pt-20 sm:pt-22 lg:pt-24">{children}</main>
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

function getAuthStorage() {
  if (localStorage.getItem(tokenKey)) {
    return localStorage;
  }

  if (sessionStorage.getItem(tokenKey)) {
    return sessionStorage;
  }

  return null;
}

function clearSessionStorage(storage: Storage) {
  storage.removeItem(tokenKey);
  storage.removeItem(companiesKey);
  storage.removeItem(selectedCompanyKey);
  storage.removeItem(userKey);
  storage.removeItem(userProfileKey);
  storage.removeItem(companySelectionReturnPathKey);
  storage.removeItem(previousCompanyKey);
}

function selectedCompanyFromSession(companies: CompanyMapping[], selectedCompanyId?: number) {
  if (!selectedCompanyId) {
    return null;
  }

  return companies.find((company) => company.companyId === selectedCompanyId || Number(company.id) === selectedCompanyId) ?? null;
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

function buildUserRole(profile: StoredUserProfile | null, company: WorkspaceCompany | null) {
  const roles = arrayValue(profile?.roles).map((role) => (typeof role === "string" ? role : stringValue(objectValue(role)?.name)));
  return [...roles.filter(Boolean), company?.name].filter(Boolean).join(" • ") || company?.name || "Secured workspace";
}

function profileImage(profile: StoredUserProfile | null) {
  const nestedProfile = objectValue(profile?.userProfile);
  const imageValue =
    profile?.displayPicture ??
    profile?.profilePicture ??
    profile?.profileImage ??
    profile?.avatarImage ??
    profile?.photoUrl ??
    profile?.imageUrl ??
    nestedProfile?.displayPicture ??
    nestedProfile?.profilePicture ??
    nestedProfile?.profileImage ??
    nestedProfile?.avatarImage ??
    nestedProfile?.photoUrl ??
    nestedProfile?.imageUrl;

  return stringValue(imageValue);
}

function arrayValue(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function objectValue(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function stringValue(value: unknown) {
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
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
