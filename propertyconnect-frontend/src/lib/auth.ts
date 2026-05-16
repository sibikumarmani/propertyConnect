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

function numericId(id: string): number | undefined {
  const value = Number(id);
  return Number.isFinite(value) ? value : undefined;
}
