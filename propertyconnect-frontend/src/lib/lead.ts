"use client";

const apiBaseUrl = process.env.NEXT_PUBLIC_PROPERTYCONNECT_API_URL ?? "http://localhost:8080/propertyConnect/api";
const customerManagementBaseUrl = `${apiBaseUrl}/propertymanagement/customer-management`;

export type Lead = {
  id?: number;
  companyId?: number;
  leadNo?: string;
  customerId?: number;
  customerCode?: string;
  customerType?: number;
  customerTypeName?: string;
  customerName: string;
  contactPerson?: string;
  mobileNo: string;
  email?: string;
  preferredContactMethod?: number;
  purpose?: number;
  status?: number;
  qualificationScore?: number;
  qualificationNotes?: string;
  createdBy?: number;
  createdOn?: string;
  updatedBy?: number;
  updatedOn?: string;
};

export type ErpCodeValue = {
  id: number;
  codeId?: number;
  codeType?: string;
  clientId?: number;
  companyId?: number;
  category?: string;
  externalId?: string;
  value: string;
  sort?: number;
  level?: string;
};

export type BusinessParty = {
  id: number;
  companyId?: number;
  externalId?: string;
  name: string;
  legalName?: string;
  type?: string;
  partyId?: number;
  partyType?: number;
  typeOfFirm?: number;
  typeOfBusinessName?: string;
  gstin?: string;
  pan?: string;
  contactNumber?: string;
  email?: string;
  addressLine?: string;
  status?: string;
  createdBy?: number;
  createdOn?: string;
  updatedBy?: number;
  updatedOn?: string;
};

export type LeadStageTarget = "QUALIFIED" | "CONVERTED_TO_PROSPECT";

export async function listLeads() {
  const companyId = selectedCompanyId();
  return request<Lead[]>(`/leads${companyId ? `?companyId=${companyId}` : ""}`);
}

export async function listCustomers() {
  return searchCustomers("");
}

export async function listCodeValues(codeType: string) {
  const params = new URLSearchParams();
  params.set("codeType", codeType);
  return request<ErpCodeValue[]>(`/erp-code-values?${params.toString()}`);
}

export async function searchCustomers(search: string) {
  const companyId = selectedCompanyId();
  if (!companyId) {
    throw new Error("Select a company before searching business parties.");
  }
  const params = new URLSearchParams();
  params.set("companyId", String(companyId));
  if (search.trim()) {
    params.set("search", search.trim());
  }
  return request<BusinessParty[]>(`/customers?${params.toString()}`);
}

export async function createLead(payload: Lead) {
  return request<Lead>("/leads", { method: "POST", body: withSelectedCompany(payload) });
}

export async function updateLead(id: number, payload: Lead) {
  return request<Lead>(`/leads/${id}`, { method: "PUT", body: withSelectedCompany(payload) });
}

export async function qualifyLead(id: number, payload: { score: number; notes?: string; updatedBy?: number }) {
  return request<Lead>(`/leads/${id}/qualify`, { method: "POST", body: payload });
}

export async function convertLeadToProspect<T>(id: number, createdBy?: number, payload?: unknown) {
  const userId = createdBy ?? loggedUserId();
  return request<T>(`/leads/${id}/convert-to-prospect${userId ? `?createdBy=${userId}` : ""}`, { method: "POST", body: payload ?? {} });
}

async function request<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const response = await fetch(`${customerManagementBaseUrl}${path}`, {
    method: options.method ?? "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.message ?? "Customer management request failed.");
  }
  return payload;
}

function authHeaders(): Record<string, string> {
  if (typeof window === "undefined") {
    return {};
  }
  const token = localStorage.getItem("propertyConnect.authToken") ?? sessionStorage.getItem("propertyConnect.authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function withSelectedCompany(payload: Lead): Lead {
  return {
    ...payload,
    companyId: payload.companyId ?? selectedCompanyId(),
    createdBy: payload.createdBy ?? loggedUserId(),
  };
}

function selectedCompanyId(): number | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }
  const rawCompany = localStorage.getItem("propertyConnect.selectedCompany") ?? sessionStorage.getItem("propertyConnect.selectedCompany");
  if (!rawCompany) {
    return undefined;
  }
  try {
    const company = JSON.parse(rawCompany) as { companyId?: unknown; selectedCompanyId?: unknown; id?: unknown };
    return numericValue(company.companyId ?? company.selectedCompanyId ?? company.id);
  } catch {
    return undefined;
  }
}

function loggedUserId(): number | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }
  const user = storedObject("propertyConnect.user");
  const profile = storedObject("propertyConnect.userProfile");
  const nestedProfile = objectValue(profile?.userProfile) ?? objectValue(profile?.loggedUserProfile) ?? objectValue(profile?.loggedUser) ?? objectValue(profile?.user);
  return numericValue(nestedProfile?.id ?? nestedProfile?.userId ?? profile?.id ?? profile?.userId ?? user?.id);
}

function storedObject(key: string): Record<string, unknown> | null {
  const rawValue = localStorage.getItem(key) ?? sessionStorage.getItem(key);
  if (!rawValue) {
    return null;
  }
  try {
    const value = JSON.parse(rawValue);
    return objectValue(value);
  } catch {
    return null;
  }
}

function objectValue(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function numericValue(value: unknown): number | undefined {
  const numeric = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(numeric) && numeric > 0 ? numeric : undefined;
}
