"use client";

const apiBaseUrl = process.env.NEXT_PUBLIC_PROPERTYCONNECT_API_URL ?? "http://localhost:8080/propertyConnect/api";
const customerManagementBaseUrl = `${apiBaseUrl}/propertymanagement/customer-management`;

export type Prospect = {
  id?: number;
  companyId?: number;
  leadId?: number;
  prospectNo?: string;
  customerName: string;
  mobileNo: string;
  email?: string;
  status?: string;
  createdBy?: number;
  updatedBy?: number;
};

export type ProspectRequirement = {
  id?: number;
  companyId?: number;
  prospectId?: number;
  propertyId?: number;
  propertyName?: string;
  unitType?: string;
  bedrooms?: number;
  budgetFrom?: number;
  budgetTo?: number;
  moveInDate?: string;
  notes?: string;
  createdBy?: number;
  updatedBy?: number;
};

export type ProspectSiteVisit = {
  id?: number;
  companyId?: number;
  prospectId?: number;
  unitId?: number;
  visitAt?: string;
  status?: string;
  notes?: string;
  createdBy?: number;
  updatedBy?: number;
};

export type ProspectOffer = {
  id?: number;
  companyId?: number;
  prospectId?: number;
  unitId?: number;
  offerNo?: string;
  baseAmount?: number;
  discountAmount?: number;
  finalAmount?: number;
  specialTerms?: string;
  status?: string;
  approvalRequired?: boolean;
  createdBy?: number;
  updatedBy?: number;
};

export type ProspectNegotiation = {
  id?: number;
  companyId?: number;
  offerId?: number;
  proposedAmount?: number;
  notes?: string;
  status?: string;
  createdBy?: number;
};

export type ProspectReservation = {
  id?: number;
  companyId?: number;
  reservationNo?: string;
  leadId?: number;
  prospectId?: number;
  offerId?: number;
  propertyId?: number;
  unitId?: number;
  status?: string;
  approvalStatus?: string;
  reservationFee?: number;
  paidAmount?: number;
  paymentWaived?: boolean;
  expiresAt?: string;
  createdBy?: number;
  updatedBy?: number;
};

export type Reservation = ProspectReservation;

export type ProspectPaymentReceipt = {
  id?: number;
  reservationId?: number;
  receiptNo?: string;
  amount?: number;
  paymentMethod?: string;
  paidAt?: string;
  erpReceiptId?: number;
  createdBy?: number;
};

export async function listProspects() {
  const companyId = selectedCompanyId();
  return request<Prospect[]>(`/prospects${companyId ? `?companyId=${companyId}` : ""}`);
}

export async function getProspect(id: number) {
  return request<Prospect>(`/prospects/${id}`);
}

export async function listProspectRequirements(prospectId: number) {
  return request<ProspectRequirement[]>(`/prospects/${prospectId}/requirements`);
}

export async function saveProspectRequirement(payload: ProspectRequirement) {
  return request<ProspectRequirement>("/requirements", { method: "POST", body: withCreatedBy(payload) });
}

export async function updateProspectRequirement(id: number, payload: ProspectRequirement) {
  return request<ProspectRequirement>(`/requirements/${id}`, { method: "PUT", body: withUpdatedBy(payload) });
}

export async function listProspectSiteVisits(prospectId: number) {
  return request<ProspectSiteVisit[]>(`/prospects/${prospectId}/site-visits`);
}

export async function listProspectOffers(prospectId: number) {
  return request<ProspectOffer[]>(`/prospects/${prospectId}/offers`);
}

export async function listProspectReservations(prospectId: number) {
  return request<ProspectReservation[]>(`/prospects/${prospectId}/reservations`);
}

export async function listReservations() {
  const companyId = selectedCompanyId();
  return request<Reservation[]>(`/reservations${companyId ? `?companyId=${companyId}` : ""}`);
}

export async function saveProspectOffer(payload: ProspectOffer) {
  return request<ProspectOffer>("/offers", { method: "POST", body: withCreatedBy(payload) });
}

export async function updateProspectOffer(id: number, payload: ProspectOffer) {
  return request<ProspectOffer>(`/offers/${id}`, { method: "PUT", body: withUpdatedBy(payload) });
}

export async function saveProspectNegotiation(payload: ProspectNegotiation) {
  return request<ProspectNegotiation>("/negotiations", { method: "POST", body: withCreatedBy(payload) });
}

export async function saveProspectReservation(payload: ProspectReservation) {
  return request<ProspectReservation>("/reservations", { method: "POST", body: normalizeDateTime(withCreatedBy(payload)) });
}

export async function approveProspectReservation(id: number, payload: { approved: boolean; comments?: string; approvedBy?: number }) {
  return request<ProspectReservation>(`/reservations/${id}/approval`, { method: "POST", body: { ...payload, approvedBy: payload.approvedBy ?? loggedUserId() } });
}

export async function recordProspectReservationPayment(id: number, payload: ProspectPaymentReceipt) {
  return request<ProspectPaymentReceipt>(`/reservations/${id}/payment`, { method: "POST", body: normalizeDateTime(withCreatedBy(payload)) });
}

export async function confirmProspectReservation(id: number) {
  return request<ProspectReservation>(`/reservations/${id}/confirm${userQuery("updatedBy")}`, { method: "POST" });
}

export async function cancelProspectReservation(id: number) {
  return request<ProspectReservation>(`/reservations/${id}/cancel${userQuery("updatedBy")}`, { method: "POST" });
}

export async function expireProspectReservation(id: number) {
  return request<ProspectReservation>(`/reservations/${id}/expire${userQuery("updatedBy")}`, { method: "POST" });
}

export async function moveProspectReservationToLease(id: number) {
  return request<ProspectReservation>(`/reservations/${id}/move-to-lease${userQuery("updatedBy")}`, { method: "POST" });
}

export async function saveProspectSiteVisit(payload: ProspectSiteVisit) {
  return request<ProspectSiteVisit>("/site-visits", { method: "POST", body: normalizeDateTime(withCreatedBy(payload)) });
}

export async function updateProspectSiteVisit(id: number, payload: ProspectSiteVisit) {
  return request<ProspectSiteVisit>(`/site-visits/${id}`, { method: "PUT", body: normalizeDateTime(withUpdatedBy(payload)) });
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

function normalizeDateTime<T extends Record<string, unknown>>(payload: T): T {
  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => {
      if ((key === "visitAt" || key === "expiresAt" || key === "paidAt") && typeof value === "string" && value.length === 16) {
        return [key, `${value}:00`];
      }
      return [key, value];
    }),
  ) as T;
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

function userQuery(name: string) {
  const userId = loggedUserId();
  return userId ? `?${name}=${userId}` : "";
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
