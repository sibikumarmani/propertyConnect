export type LoginPayload = {
  loginId: string;
  password: string;
  rememberMe: boolean;
};

export type CompanyMapping = {
  id: string;
  code: string;
  name: string;
  clientId?: number;
  companyId?: number;
  selectedCompanyId?: number;
  userCompanyId?: number;
  groupId?: number;
  timeZone?: string;
};

export type LoginResult = {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  companies?: CompanyMapping[];
  userProfile?: Record<string, unknown>;
};

export type CompanySelectionPayload = {
  company: CompanyMapping;
  userProfile: Record<string, unknown>;
};

export type CompanySelectionResult = {
  token: string;
  userProfile: Record<string, unknown>;
};

export type SessionResult = {
  authenticated: boolean;
  token?: string;
  user?: LoginResult["user"];
  companies?: CompanyMapping[];
  userProfile?: Record<string, unknown>;
  selectedCompanyId?: number;
};

const apiBaseUrl =
  process.env.NEXT_PUBLIC_PROPERTYCONNECT_API_URL ?? "http://localhost:8080/propertyConnect/api";

export async function login(payload: LoginPayload): Promise<LoginResult> {
  const response = await fetch(`${apiBaseUrl}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message ?? "Unable to sign in. Please check your details.");
  }

  return response.json();
}

export async function selectCompany(payload: CompanySelectionPayload): Promise<CompanySelectionResult> {
  const response = await fetch(`${apiBaseUrl}/auth/company`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    credentials: "include",
    body: JSON.stringify({
      clientId: payload.company.clientId,
      companyId: payload.company.companyId ?? numericId(payload.company.id),
      selectedCompanyId: payload.company.selectedCompanyId,
      selectedGroupCompanyId: payload.company.groupId,
      selectedCompanyTimeZone: payload.company.timeZone,
      userCompanyId: payload.company.userCompanyId,
      loggedInUserTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      userProfile: payload.userProfile,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message ?? "Unable to select company. Please try again.");
  }

  return response.json();
}

export async function getSession(): Promise<SessionResult> {
  const response = await fetch(`${apiBaseUrl}/auth/session`, {
    method: "GET",
    headers: authHeaders(),
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message ?? "Please sign in again.");
  }

  return response.json();
}

export async function logout(): Promise<void> {
  await fetch(`${apiBaseUrl}/auth/logout`, {
    method: "POST",
    headers: authHeaders(),
    credentials: "include",
  }).catch(() => undefined);
}

function numericId(id: string): number | undefined {
  const value = Number(id);
  return Number.isFinite(value) ? value : undefined;
}

function authHeaders(): Record<string, string> {
  if (typeof window === "undefined") {
    return {};
  }

  const token = localStorage.getItem("propertyConnect.authToken") ?? sessionStorage.getItem("propertyConnect.authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}
