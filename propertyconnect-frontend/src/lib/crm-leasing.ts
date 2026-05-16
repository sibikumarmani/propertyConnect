"use client";

const apiBaseUrl = process.env.NEXT_PUBLIC_PROPERTYCONNECT_API_URL ?? "http://localhost:8081/propertyConnect/api";
const leasingBaseUrl = `${apiBaseUrl}/propertymanagement/crm-leasing`;

export type Lead = {
  id?: number;
  leadNo?: string;
  customerName: string;
  mobileNo: string;
  email?: string;
  source?: string;
  purpose?: string;
  status?: string;
  qualificationScore?: number;
  qualificationNotes?: string;
};

export type Prospect = {
  id?: number;
  leadId?: number;
  prospectNo?: string;
  customerName: string;
  mobileNo: string;
  email?: string;
  status?: string;
};

export type Requirement = {
  id?: number;
  prospectId?: number;
  propertyId?: number;
  propertyName?: string;
  unitType?: string;
  bedrooms?: number;
  budgetFrom?: number;
  budgetTo?: number;
  moveInDate?: string;
  notes?: string;
};

export type Unit = {
  id?: number;
  propertyId?: number;
  propertyName?: string;
  unitCode?: string;
  unitType?: string;
  bedrooms?: number;
  askingRent?: number;
  status?: string;
};

export type SiteVisit = {
  id?: number;
  prospectId?: number;
  unitId?: number;
  visitAt?: string;
  status?: string;
  notes?: string;
};

export type Offer = {
  id?: number;
  prospectId?: number;
  unitId?: number;
  offerNo?: string;
  baseAmount?: number;
  discountAmount?: number;
  finalAmount?: number;
  specialTerms?: string;
  status?: string;
  approvalRequired?: boolean;
};

export type Negotiation = {
  id?: number;
  offerId?: number;
  proposedAmount?: number;
  notes?: string;
  status?: string;
};

export type Reservation = {
  id?: number;
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
};

export type PaymentReceipt = {
  id?: number;
  reservationId?: number;
  receiptNo?: string;
  amount?: number;
  paymentMethod?: string;
  paidAt?: string;
  erpReceiptId?: number;
};

export type StatusHistory = {
  id?: number;
  entityType?: string;
  entityId?: number;
  fromStatus?: string;
  toStatus?: string;
  comments?: string;
  changedAt?: string;
};

export type ReportSummary = {
  leads: number;
  qualifiedLeads: number;
  prospects: number;
  activeReservations: number;
  confirmedReservations: number;
  latestHistory: StatusHistory[];
};

export async function listLeads() {
  return request<Lead[]>("/leads");
}

export async function createLead(payload: Lead) {
  return request<Lead>("/leads", { method: "POST", body: payload });
}

export async function qualifyLead(id: number, payload: { score: number; notes?: string; updatedBy?: number }) {
  return request<Lead>(`/leads/${id}/qualify`, { method: "POST", body: payload });
}

export async function convertLeadToProspect(id: number, createdBy?: number) {
  return request<Prospect>(`/leads/${id}/convert-to-prospect${createdBy ? `?createdBy=${createdBy}` : ""}`, { method: "POST" });
}

export async function listProspects() {
  return request<Prospect[]>("/prospects");
}

export async function getProspect(id: number) {
  return request<Prospect>(`/prospects/${id}`);
}

export async function saveRequirement(payload: Requirement) {
  return request<Requirement>("/requirements", { method: "POST", body: payload });
}

export async function createUnit(payload: Unit) {
  return request<Unit>("/units", { method: "POST", body: payload });
}

export async function searchUnits(payload: Partial<Unit & { budgetTo: number }>) {
  return request<Unit[]>("/units/search", { method: "POST", body: payload });
}

export async function createSiteVisit(payload: SiteVisit) {
  return request<SiteVisit>("/site-visits", { method: "POST", body: normalizeDateTime(payload) });
}

export async function createOffer(payload: Offer) {
  return request<Offer>("/offers", { method: "POST", body: payload });
}

export async function listOffers() {
  return request<Offer[]>("/offers");
}

export async function createNegotiation(payload: Negotiation) {
  return request<Negotiation>("/negotiations", { method: "POST", body: payload });
}

export async function listReservations() {
  return request<Reservation[]>("/reservations");
}

export async function createReservation(payload: Reservation) {
  return request<Reservation>("/reservations", { method: "POST", body: normalizeDateTime(payload) });
}

export async function approveReservation(id: number, payload: { approved: boolean; comments?: string; approvedBy?: number }) {
  return request<Reservation>(`/reservations/${id}/approval`, { method: "POST", body: payload });
}

export async function recordReservationPayment(id: number, payload: PaymentReceipt) {
  return request<PaymentReceipt>(`/reservations/${id}/payment`, { method: "POST", body: normalizeDateTime(payload) });
}

export async function confirmReservation(id: number, updatedBy?: number) {
  return request<Reservation>(`/reservations/${id}/confirm${updatedBy ? `?updatedBy=${updatedBy}` : ""}`, { method: "POST" });
}

export async function moveReservationToLease(id: number, updatedBy?: number) {
  return request<Reservation>(`/reservations/${id}/move-to-lease${updatedBy ? `?updatedBy=${updatedBy}` : ""}`, { method: "POST" });
}

export async function reportSummary() {
  return request<ReportSummary>("/reports/summary");
}

async function request<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const response = await fetch(`${leasingBaseUrl}${path}`, {
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
    throw new Error(payload?.message ?? "CRM leasing request failed.");
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
