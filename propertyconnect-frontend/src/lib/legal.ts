"use client";

const apiBaseUrl = process.env.NEXT_PUBLIC_PROPERTYCONNECT_API_URL ?? "http://localhost:8080/propertyConnect/api";
const legalManagementBaseUrl = `${apiBaseUrl}/propertymanagement/legal-management`;

export type LegalLookup = {
  id: number;
  code?: string;
  label: string;
};

export type LegalLookups = {
  legalTypes: LegalLookup[];
  stages: LegalLookup[];
  reasons: LegalLookup[];
  documentStatuses: LegalLookup[];
  approvalStatuses: LegalLookup[];
  documentTypes: LegalLookup[];
};

export type LegalCardAttachment = {
  id?: number;
  legalCardId?: number;
  documentTypeId: number;
  documentType?: string;
  fileName: string;
  createdBy?: number;
  createdOn?: string;
  updatedBy?: number;
  updatedOn?: string;
};

export type LegalCardTimeline = {
  id?: number;
  legalCardId?: number;
  statusId: number;
  status?: string;
  step: string;
  action: "Created" | "Updated" | "Workflow";
  remarks?: string;
  actor?: string;
  timestamp?: string;
  createdBy?: number;
  createdOn?: string;
  updatedBy?: number;
  updatedOn?: string;
};

export type LegalCard = {
  id?: number;
  companyId?: number;
  legalCardNo?: string;
  legalTypeId: number;
  legalType?: string;
  currentStageId: number;
  currentStage?: string;
  reasonId: number;
  reason?: string;
  tenantId: number;
  tenant?: string;
  propertyId: number;
  property?: string;
  unitId: number;
  unit?: string;
  advocateId?: number;
  advocate?: string;
  caseNumber?: string;
  priority: "H" | "M" | "L";
  priorityLabel?: string;
  documentStatusId: number;
  documentStatus?: string;
  approvalStatusId: number;
  approvalStatus?: string;
  documentDate: string;
  dueDate: string;
  dueAmount: number | string;
  comments?: string;
  createdBy?: number;
  createdOn?: string;
  updatedBy?: number;
  updatedOn?: string;
  attachments?: LegalCardAttachment[];
  timeline?: LegalCardTimeline[];
};

export type LegalCardSearch = {
  companyId?: number;
  legalTypeId?: number;
  tenantId?: number;
  propertyId?: number;
  unitId?: number;
  advocateId?: number;
  legalCardNo?: string;
  documentDateFrom?: string;
  documentDateTo?: string;
  dueDate?: string;
  documentStatusIds?: number[];
  approvalStatusIds?: number[];
};

export type LegalDashboard = {
  totalCount: number;
  completedCount: number;
  inProgressCount: number;
  legalTypeCounts: Array<{ legalTypeId: number; legalType: string; count: number }>;
  cards: LegalCard[];
};

export async function getLegalLookups() {
  return request<LegalLookups>("/lookups");
}

export async function getLegalDashboard() {
  const companyId = selectedCompanyId();
  return request<LegalDashboard>(`/dashboard${companyId ? `?companyId=${companyId}` : ""}`);
}

export async function searchLegalCards(payload: LegalCardSearch) {
  return request<LegalCard[]>("/legal-cards/search", { method: "POST", body: withSelectedCompany(payload) });
}

export async function createLegalCard(payload: LegalCard) {
  return request<LegalCard>("/legal-cards", { method: "POST", body: withCreatedBy(withSelectedCompany(payload)) });
}

export async function updateLegalCard(id: number, payload: LegalCard) {
  return request<LegalCard>(`/legal-cards/${id}`, { method: "PUT", body: withUpdatedBy(withSelectedCompany(payload)) });
}

export async function applyLegalWorkflow(id: number, payload: { statusId: number; comments: string; updatedBy?: number }) {
  return request<LegalCard>(`/legal-cards/${id}/workflow`, { method: "POST", body: withUpdatedBy(payload) });
}

async function request<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const response = await fetch(`${legalManagementBaseUrl}${path}`, {
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
    throw new Error(payload?.message ?? "Legal management request failed.");
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

function withSelectedCompany<T extends { companyId?: number }>(payload: T): T {
  return {
    ...payload,
    companyId: payload.companyId ?? selectedCompanyId(),
  };
}

function withCreatedBy<T extends { createdBy?: number }>(payload: T): T {
  return {
    ...payload,
    createdBy: payload.createdBy ?? loggedUserId(),
  };
}

function withUpdatedBy<T extends { updatedBy?: number }>(payload: T): T {
  return {
    ...payload,
    updatedBy: payload.updatedBy ?? loggedUserId(),
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
    const company = JSON.parse(rawCompany) as { companyId?: number; id?: string | number };
    const value = company.companyId ?? Number(company.id);
    return Number.isFinite(value) ? Number(value) : undefined;
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
