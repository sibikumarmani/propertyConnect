"use client";

const apiBaseUrl = process.env.NEXT_PUBLIC_PROPERTYCONNECT_API_URL ?? "http://localhost:8080/propertyConnect/api";
const customerManagementBaseUrl = `${apiBaseUrl}/propertymanagement/customer-management`;

export type ReservationProspect = {
  id?: number;
  prospectNo?: string;
  customerName?: string;
  mobileNo?: string;
};

export type ReservationOffer = {
  id?: number;
  prospectId?: number;
  propertyId?: number;
  propertyName?: string;
  requirementLevel?: number;
  blockId?: number;
  blockName?: string;
  floorId?: number;
  floorName?: string;
  unitId?: number;
  offerNo?: string;
  baseAmount?: number;
  discountAmount?: number;
  finalAmount?: number;
  specialTerms?: string;
  status?: number;
  approvalRequired?: boolean;
};

export type Reservation = {
  id?: number;
  companyId?: number;
  reservationNo?: string;
  leadId?: number;
  prospectId?: number;
  offerId?: number;
  propertyId?: number;
  blockId?: number;
  floorId?: number;
  unitId?: number;
  status?: number;
  approvalStatus?: number;
  reservationFee?: number;
  paidAmount?: number;
  paymentWaived?: boolean;
  expiresAt?: string;
  createdBy?: number;
  createdOn?: string;
  updatedBy?: number;
  updatedOn?: string;
};

export type ReservationPaymentReceipt = {
  id?: number;
  reservationId?: number;
  receiptNo?: string;
  amount?: number;
  paymentMethod?: string;
  paidAt?: string;
  erpReceiptId?: number;
  createdBy?: number;
  createdOn?: string;
};

export async function listReservationProspects() {
  const companyId = selectedCompanyId();
  return request<ReservationProspect[]>(`/prospects${companyId ? `?companyId=${companyId}` : ""}`);
}

export async function listReservationOffers() {
  const companyId = selectedCompanyId();
  return request<ReservationOffer[]>(`/offers${companyId ? `?companyId=${companyId}` : ""}`);
}

export async function listReservations() {
  const companyId = selectedCompanyId();
  return request<Reservation[]>(`/reservations${companyId ? `?companyId=${companyId}` : ""}`);
}

export async function saveReservation(payload: Reservation) {
  return request<Reservation>("/reservations", { method: "POST", body: normalizeDateTime(withCreatedBy(payload)) });
}

export async function updateReservation(id: number, payload: Reservation) {
  return request<Reservation>(`/reservations/${id}`, { method: "PUT", body: normalizeDateTime(withUpdatedBy(payload)) });
}

export async function approveReservation(id: number, payload: { approved: boolean; comments?: string; approvedBy?: number }) {
  return request<Reservation>(`/reservations/${id}/approval`, { method: "POST", body: { ...payload, approvedBy: payload.approvedBy ?? loggedUserId() } });
}

export async function updateReservationStatus(id: number, payload: { status: string; comments?: string; updatedBy?: number }) {
  return request<Reservation>(`/reservations/${id}/status`, { method: "POST", body: { ...payload, updatedBy: payload.updatedBy ?? loggedUserId() } });
}

export async function recordReservationPayment(id: number, payload: ReservationPaymentReceipt) {
  return request<ReservationPaymentReceipt>(`/reservations/${id}/payment`, { method: "POST", body: normalizeDateTime(withCreatedBy(payload)) });
}

export async function confirmReservation(id: number) {
  return request<Reservation>(`/reservations/${id}/confirm${userQuery("updatedBy")}`, { method: "POST" });
}

export async function cancelReservation(id: number) {
  return request<Reservation>(`/reservations/${id}/cancel${userQuery("updatedBy")}`, { method: "POST" });
}

export async function expireReservation(id: number) {
  return request<Reservation>(`/reservations/${id}/expire${userQuery("updatedBy")}`, { method: "POST" });
}

export async function moveReservationToLease(id: number) {
  return request<Reservation>(`/reservations/${id}/move-to-lease${userQuery("updatedBy")}`, { method: "POST" });
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
      if ((key === "expiresAt" || key === "paidAt") && typeof value === "string" && value.length === 16) {
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
  const rawUser = localStorage.getItem("propertyConnect.user") ?? sessionStorage.getItem("propertyConnect.user");
  if (!rawUser) {
    return undefined;
  }
  try {
    const user = JSON.parse(rawUser) as { userId?: number; id?: string | number };
    const value = user.userId ?? Number(user.id);
    return Number.isFinite(value) ? Number(value) : undefined;
  } catch {
    return undefined;
  }
}

function userQuery(name: string) {
  const userId = loggedUserId();
  return userId === undefined ? "" : `?${name}=${userId}`;
}
