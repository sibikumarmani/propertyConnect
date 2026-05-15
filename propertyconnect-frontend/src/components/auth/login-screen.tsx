"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Eye, EyeOff, Loader2, LockKeyhole, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { login, selectCompany } from "@/lib/auth";

const loginSchema = z.object({
  loginId: z.string().min(2, "Enter your login ID"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

type FieldName = "loginId" | "password";

const fieldStyles =
  "h-12 w-full rounded-md border border-slate-300 bg-white pl-11 pr-4 text-[15px] text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-100";

const tokenKey = "propertyConnect.authToken";
const userKey = "propertyConnect.user";
const companiesKey = "propertyConnect.companies";
const userProfileKey = "propertyConnect.userProfile";
const selectedCompanyKey = "propertyConnect.selectedCompany";
const dashboardPath = "/propertyconnect/dashboard";
const companySelectionPath = "/propertyconnect/company-selection";

export function LoginScreen() {
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
    <main className="flex min-h-screen bg-[#f6f8fb]">
      <section
        className="relative hidden w-[42%] min-w-[460px] overflow-hidden bg-[#163a4b] bg-cover bg-center px-12 py-10 text-white lg:flex lg:flex-col"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(9, 30, 42, 0.76), rgba(9, 30, 42, 0.26)), url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1400&q=85')",
        }}
      >
        <div className="relative z-10 flex items-center gap-3 text-lg font-semibold">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-teal-400 text-[#102d3b]">
            <Building2 aria-hidden="true" size={22} />
          </span>
          PropertyConnect
        </div>
      </section>

      <section className="flex flex-1 items-center justify-center px-5 py-8 sm:px-8">
        <div className="w-full max-w-[440px]">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">
              Secure sign in
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-950">Sign in to PropertyConnect</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Use your coreConnect ERP credentials. Company access is checked after login.
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
              <label className="mb-2 block text-sm font-medium text-slate-800" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
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
                  className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                  onClick={() => setShowPassword((value) => !value)}
                  type="button"
                >
                  {showPassword ? <EyeOff aria-hidden="true" size={18} /> : <Eye aria-hidden="true" size={18} />}
                </button>
              </div>
              {errors.password?.message ? (
                <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
              ) : null}
            </div>

            <div className="flex items-center justify-between gap-4">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  {...register("rememberMe")}
                  className="h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
                  type="checkbox"
                />
                Remember me
              </label>
            </div>

            {serverError ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {serverError}
              </div>
            ) : null}

            <button
              className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#163a4b] px-5 text-sm font-semibold text-white transition hover:bg-[#102d3b] disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? <Loader2 aria-hidden="true" className="animate-spin" size={18} /> : null}
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </section>
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
      <label className="mb-2 block text-sm font-medium text-slate-800" htmlFor={name}>
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
          {icon}
        </span>
        <input {...register(name)} className={fieldStyles} id={name} placeholder={placeholder} type={type} />
      </div>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
