"use client";

const apiBaseUrl = process.env.NEXT_PUBLIC_PROPERTYCONNECT_API_URL ?? "http://localhost:8080/propertyConnect/api";
const customerManagementBaseUrl = `${apiBaseUrl}/propertymanagement/customer-management`;

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

export async function reportSummary() {
  return request<ReportSummary>("/reports/summary");
}

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${customerManagementBaseUrl}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.message ?? "Report request failed.");
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
