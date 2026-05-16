"use client";

import { Building2, Check, ChevronRight, LogOut } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { selectCompany, type CompanyMapping } from "@/lib/auth";

const tokenKey = "propertyConnect.authToken";
const userKey = "propertyConnect.user";
const companiesKey = "propertyConnect.companies";
const userProfileKey = "propertyConnect.userProfile";
const selectedCompanyKey = "propertyConnect.selectedCompany";
const companySelectionReturnPathKey = "propertyConnect.companySelectionReturnPath";
const previousCompanyKey = "propertyConnect.previousCompany";
const loginPath = "/propertyconnect/login";
const companySelectionPath = "/propertyconnect/company-selection";
const dashboardPath = "/propertyconnect/dashboard";

export function CompanySelection() {
  const [companies, setCompanies] = useState<CompanyMapping[]>([]);
  const [userName, setUserName] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      const storage = getAuthStorage();

      if (!storage) {
        window.location.replace(loginPath);
        return;
      }

      if (storage.getItem(selectedCompanyKey)) {
        window.location.replace(dashboardPath);
        return;
      }

      const mappedCompanies = readCompanies(storage);
      const user = readStoredObject<{ name?: string }>(storage, userKey);
      setCompanies(mappedCompanies);
      setUserName(user?.name ?? "");
      setSelectedCompanyId(mappedCompanies[0]?.id ?? "");
      setIsLoaded(true);
    }, 0);

    return () => window.clearTimeout(timerId);
  }, []);

  const selectedCompany = useMemo(
    () => companies.find((company) => company.id === selectedCompanyId),
    [companies, selectedCompanyId],
  );

  async function continueToWorkspace() {
    const storage = getAuthStorage();

    if (!storage || !selectedCompany) {
      return;
    }

    setServerError("");
    setIsSubmitting(true);

    try {
      const userProfile = readUserProfile(storage);
      const result = await selectCompany({ company: selectedCompany, userProfile });
      storage.setItem(tokenKey, result.token);
      storage.setItem(userProfileKey, JSON.stringify(result.userProfile));
      storage.setItem(selectedCompanyKey, JSON.stringify(selectedCompany));
      clearSwitchCompanyState(storage);
      window.location.assign(dashboardPath);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Unable to select company.");
      setIsSubmitting(false);
    }
  }

  function cancelSelection() {
    const storage = getAuthStorage();

    if (!storage) {
      window.location.assign(loginPath);
      return;
    }

    const returnPath = safeReturnPath(storage.getItem(companySelectionReturnPathKey));
    const previousCompany = storage.getItem(previousCompanyKey);
    clearSwitchCompanyState(storage);

    if (returnPath && previousCompany) {
      storage.setItem(selectedCompanyKey, previousCompany);
      window.location.assign(returnPath);
      return;
    }

    signOut();
  }

  function signOut() {
    [localStorage, sessionStorage].forEach((storage) => {
      storage.removeItem(tokenKey);
      storage.removeItem(companiesKey);
      storage.removeItem(selectedCompanyKey);
      storage.removeItem(userKey);
      storage.removeItem(userProfileKey);
      clearSwitchCompanyState(storage);
    });
    window.location.assign(loginPath);
  }

  if (!isLoaded) {
    return (
      <main className="flex min-h-screen items-center justify-center px-5">
        <div className="panel rounded-[28px] px-8 py-6 text-sm font-semibold text-[color:var(--brand-strong)]">
          Loading companies...
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-8">
      <section className="w-full max-w-[620px]">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-lg font-semibold text-[color:var(--brand-strong)]">
            <span className="topbar-shade flex h-11 w-11 items-center justify-center rounded-2xl text-white">
              <Building2 aria-hidden="true" size={22} />
            </span>
            PropertyConnect
          </div>
          <button
            className="btn-secondary flex h-11 w-11 items-center justify-center rounded-2xl transition hover:brightness-105"
            onClick={signOut}
            type="button"
            aria-label="Sign out"
          >
            <LogOut aria-hidden="true" size={19} />
          </button>
        </div>

        <div className="page-surface rounded-[32px] border border-[color:var(--line-strong)] p-5 shadow-[var(--shadow-panel)] sm:p-7">
          <div className="mb-7">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--brand)]">
              Select Company
            </p>
            <h1 className="display-font mt-3 text-3xl font-semibold text-[color:var(--brand-strong)]">
              Choose your active company
            </h1>
            <p className="mt-3 text-sm leading-7 text-[color:var(--foreground-muted)]">
              {userName ? `Welcome ${userName}. ` : ""}Continue with one of the companies mapped to your coreConnect user account.
            </p>
          </div>

          {companies.length > 0 ? (
            <div className="space-y-3">
              {companies.map((company) => {
                const isSelected = company.id === selectedCompanyId;

                return (
                  <button
                    className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${
                      isSelected
                        ? "border-[color:var(--brand-border)] bg-[color:var(--brand-tint)] shadow-[0_14px_30px_rgba(19,138,158,0.12)]"
                        : "border-[color:var(--line)] bg-[color:var(--surface-raised)] hover:border-[color:var(--line-strong)]"
                    }`}
                    key={company.id}
                    onClick={() => setSelectedCompanyId(company.id)}
                    type="button"
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--surface-muted)] text-[color:var(--brand-strong)]">
                      <Building2 aria-hidden="true" size={21} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-[color:var(--brand-strong)]">{company.name}</span>
                      <span className="mt-1 block text-sm text-[color:var(--foreground-muted)]">{company.code}</span>
                    </span>
                    {isSelected ? (
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--brand)] text-white">
                        <Check aria-hidden="true" size={18} />
                      </span>
                    ) : null}
                  </button>
                );
              })}

              {serverError ? (
                <div className="rounded-2xl border border-[color:var(--danger)]/20 bg-[color:var(--danger-soft)] px-4 py-3 text-sm text-[color:var(--danger)]">
                  {serverError}
                </div>
              ) : null}

              <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button className="btn-secondary h-12 rounded-2xl px-5 text-sm font-semibold" onClick={cancelSelection} type="button">
                  Cancel
                </button>
                <button
                  className="btn-primary flex h-12 items-center justify-center gap-2 rounded-2xl px-6 text-sm font-semibold transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={!selectedCompany || isSubmitting}
                  onClick={continueToWorkspace}
                  type="button"
                >
                  {isSubmitting ? "Validating..." : "Continue"}
                  <ChevronRight aria-hidden="true" size={18} />
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-[color:var(--warning)]/20 bg-[color:var(--warning-soft)] px-4 py-3 text-sm leading-6 text-[color:var(--warning)]">
              No company mapping was returned for this user. Please contact your administrator.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function clearSwitchCompanyState(storage: Storage) {
  storage.removeItem(companySelectionReturnPathKey);
  storage.removeItem(previousCompanyKey);
}

function safeReturnPath(path: string | null) {
  if (!path || path === companySelectionPath || path === loginPath) {
    return "";
  }

  return path.startsWith("/propertyconnect/") ? path : "";
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

function readCompanies(storage: Storage): CompanyMapping[] {
  const rawCompanies = storage.getItem(companiesKey);

  if (!rawCompanies) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawCompanies);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readUserProfile(storage: Storage): Record<string, unknown> {
  const rawProfile = storage.getItem(userProfileKey);

  if (!rawProfile) {
    return {};
  }

  try {
    const parsed = JSON.parse(rawProfile);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
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
