"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Eye, EyeOff, Loader2, LockKeyhole, ShieldCheck, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { getSession, login, selectCompany } from "@/lib/auth";

const loginSchema = z.object({
  loginId: z.string().min(2, "Enter your login ID"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

type FieldName = "loginId" | "password";

const tokenKey = "propertyConnect.authToken";
const userKey = "propertyConnect.user";
const companiesKey = "propertyConnect.companies";
const userProfileKey = "propertyConnect.userProfile";
const selectedCompanyKey = "propertyConnect.selectedCompany";
const dashboardPath = "/propertyconnect/dashboard";
const companySelectionPath = "/propertyconnect/company-selection";
const fieldStyles = "field h-12 w-full rounded-2xl pl-11 pr-4 text-[15px] transition";

export function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");

  const defaultValues = useMemo<LoginFormValues>(
    () => ({
      loginId: "",
      password: "",
      rememberMe: true,
    }),
    [],
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues,
  });

  useEffect(() => {
    const timerId = window.setTimeout(async () => {
      const storage = getAuthStorage() ?? sessionStorage;

      try {
        const session = await getSession();
        if (!session.authenticated) {
          return;
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

        const selectedCompany =
          readStoredObject(storage, selectedCompanyKey) ??
          selectedCompanyFromSession(session.companies ?? [], session.selectedCompanyId);

        if (selectedCompany) {
          storage.setItem(selectedCompanyKey, JSON.stringify(selectedCompany));
          window.location.replace(dashboardPath);
          return;
        }

        if (storage.getItem(companiesKey)) {
          window.location.replace(companySelectionPath);
        }
      } catch {
        return;
      }
    }, 0);

    return () => window.clearTimeout(timerId);
  }, []);

  async function onSubmit(values: LoginFormValues) {
    setServerError("");

    try {
      const result = await login(values);
      const storage = values.rememberMe ? localStorage : sessionStorage;
      const companies = result.companies ?? [];
      const userProfile = result.userProfile ?? {};

      storage.setItem(tokenKey, result.token);
      storage.setItem(userKey, JSON.stringify(result.user));
      storage.setItem(companiesKey, JSON.stringify(companies));
      storage.setItem(userProfileKey, JSON.stringify(userProfile));

      if (shouldSelectSingleCompany(userProfile, companies.length)) {
        const companyResult = await selectCompany({ company: companies[0], userProfile });
        storage.setItem(tokenKey, companyResult.token);
        storage.setItem(userProfileKey, JSON.stringify(companyResult.userProfile));
        storage.setItem(selectedCompanyKey, JSON.stringify(companies[0]));
        window.location.assign(dashboardPath);
        return;
      }

      if (companies.length > 1) {
        window.location.assign(companySelectionPath);
        return;
      }

      setServerError("No company mapping was returned for this user. Please contact your administrator.");
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Unable to sign in.");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="page-surface w-full max-w-5xl overflow-hidden rounded-none border border-[color:var(--line-strong)] shadow-[var(--shadow-panel)]">
        <div className="grid lg:grid-cols-[0.95fr_1.05fr]">
          <section className="topbar-shade px-8 py-10 text-white">
            <div className="flex items-center gap-3 text-lg font-semibold">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-white">
                <Building2 aria-hidden="true" size={22} />
              </span>
              PropertyConnect
            </div>

            <p className="mt-10 text-xs font-semibold uppercase tracking-[0.28em] text-white/70">Secure Access</p>
            <h1 className="display-font mt-3 text-4xl font-semibold text-white">PropertyConnect Login</h1>
            <p className="mt-4 max-w-md text-sm leading-7 text-white/80">
              Sign in with coreConnect ERP credentials, then select the active company before entering the secured workspace.
            </p>

            <div className="mt-8 space-y-3">
              {[
                { label: "1. Sign in", desc: "Validate user credentials through coreConnect ERP." },
                { label: "2. Select company", desc: "Choose the company context mapped to your account." },
                { label: "3. Open workspace", desc: "Continue to the property management operations console." },
              ].map((step) => (
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4" key={step.label}>
                  <p className="text-sm font-semibold text-white">{step.label}</p>
                  <p className="mt-1 text-sm text-white/70">{step.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--brand)]">Sign in</p>
              <h2 className="display-font mt-3 text-3xl font-semibold text-[color:var(--brand-strong)]">Access your workspace</h2>
              <p className="mt-3 text-sm leading-7 text-[color:var(--foreground-muted)]">
                Company access and permissions are checked after your ERP login succeeds.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
              <LoginField
                error={errors.loginId?.message}
                icon={<UserRound aria-hidden="true" size={19} />}
                label="Login ID"
                name="loginId"
                placeholder="Enter login ID"
                register={register}
              />

              <div>
                <label className="mb-2 block text-sm font-semibold text-[color:var(--brand-strong)]" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--foreground-subtle)]">
                    <LockKeyhole aria-hidden="true" size={19} />
                  </span>
                  <input
                    {...register("password")}
                    className={`${fieldStyles} pr-12`}
                    id="password"
                    placeholder="Enter password"
                    type={showPassword ? "text" : "password"}
                  />
                  <button
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-[color:var(--foreground-muted)] transition hover:bg-[color:var(--surface-muted)] hover:text-[color:var(--brand-strong)]"
                    onClick={() => setShowPassword((value) => !value)}
                    type="button"
                  >
                    {showPassword ? <EyeOff aria-hidden="true" size={18} /> : <Eye aria-hidden="true" size={18} />}
                  </button>
                </div>
                {errors.password?.message ? (
                  <p className="mt-2 text-sm text-[color:var(--danger)]">{errors.password.message}</p>
                ) : null}
              </div>

              <div className="flex items-center justify-between gap-4">
                <label className="flex items-center gap-2 text-sm text-[color:var(--foreground-muted)]">
                  <input
                    {...register("rememberMe")}
                    className="h-4 w-4 rounded border-[color:var(--line-strong)] text-[color:var(--brand)] focus:ring-[color:var(--brand)]"
                    type="checkbox"
                  />
                  Remember me
                </label>
              </div>

              {serverError ? (
                <div className="rounded-2xl border border-[color:var(--danger)]/20 bg-[color:var(--danger-soft)] px-4 py-3 text-sm text-[color:var(--danger)]">
                  {serverError}
                </div>
              ) : null}

              <button
                className="btn-primary flex h-12 w-full items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? <Loader2 aria-hidden="true" className="animate-spin" size={18} /> : null}
                {isSubmitting ? "Signing in..." : "Sign in"}
              </button>

              <div className="flex items-center gap-2 rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-soft)] px-4 py-3 text-sm text-[color:var(--foreground-muted)]">
                <ShieldCheck aria-hidden="true" className="h-4 w-4 text-[color:var(--brand)]" />
                Secured workspace access through PropertyConnect backend.
              </div>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}

function shouldSelectSingleCompany(userProfile: Record<string, unknown>, companyCount: number) {
  if (companyCount !== 1) {
    return false;
  }

  return userCategory(userProfile) === "N";
}

function userCategory(userProfile: Record<string, unknown>) {
  const nestedProfile = objectValue(userProfile.userProfile);
  const category = stringValue(nestedProfile?.userCategory ?? userProfile.userCategory);
  return category.toUpperCase();
}

function objectValue(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function LoginField({
  error,
  icon,
  label,
  name,
  placeholder,
  register,
  type = "text",
}: {
  error?: string;
  icon: React.ReactNode;
  label: string;
  name: FieldName;
  placeholder: string;
  register: ReturnType<typeof useForm<LoginFormValues>>["register"];
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-[color:var(--brand-strong)]" htmlFor={name}>
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--foreground-subtle)]">
          {icon}
        </span>
        <input {...register(name)} className={fieldStyles} id={name} placeholder={placeholder} type={type} />
      </div>
      {error ? <p className="mt-2 text-sm text-[color:var(--danger)]">{error}</p> : null}
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

function selectedCompanyFromSession(companies: Array<{ id: string; companyId?: number }>, selectedCompanyId?: number) {
  if (!selectedCompanyId) {
    return null;
  }

  return companies.find((company) => company.companyId === selectedCompanyId || Number(company.id) === selectedCompanyId) ?? null;
}

function readStoredObject(storage: Storage, key: string): Record<string, unknown> | null {
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
