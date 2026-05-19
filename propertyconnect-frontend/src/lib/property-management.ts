"use client";

const apiBaseUrl = process.env.NEXT_PUBLIC_PROPERTYCONNECT_API_URL ?? "http://localhost:8080/propertyConnect/api";
const propertyManagementBaseUrl = `${apiBaseUrl}/propertymanagement/property-management`;

export type MasterRecord = {
  id?: number;
  companyId?: number;
  code: string;
  name: string;
  description?: string;
  parentId?: number;
  sortOrder?: number;
  attributes?: string;
  status?: string;
  activeStatus?: "ACTIVE" | "INACTIVE" | string;
  createdBy?: number;
  updatedBy?: number;
};

export type PropertyMaster = {
  id?: number;
  companyId?: number;
  code: string;
  name: string;
  description?: string;
  propertyType: string;
  region?: string;
  addressLine1?: string;
  city?: string;
  emirate?: string;
  country?: string;
  ownershipType?: string;
  ownerName?: string;
  titleDeedNo?: string;
  reraPermitNo?: string;
  documentReference?: string;
  documentStatus?: string;
  ownershipRows?: PropertyOwnershipRow[];
  documentRows?: PropertyDocumentRow[];
  totalBlocks?: number;
  totalFloors?: number;
  totalUnits?: number;
  totalAmenities?: number;
  builtUpArea?: number;
  plotArea?: number;
  marketValue?: number;
  annualServiceCharge?: number;
  operatingModel?: string;
  facilityManager?: string;
  onboardingStatus?: string;
  activeStatus?: string;
  createdBy?: number;
  updatedBy?: number;
};

export type PropertyOwnershipRow = {
  id?: number;
  propertyId?: number;
  party: string;
  role: string;
  shareRight?: string;
  reference?: string;
  status?: string;
  sortOrder?: number;
  createdBy?: number;
  updatedBy?: number;
};

export type PropertyDocumentRow = {
  id?: number;
  propertyId?: number;
  document: string;
  category: string;
  reference: string;
  updatedDate?: string;
  status?: string;
  sortOrder?: number;
  createdBy?: number;
  updatedBy?: number;
};

export type WorkflowRow = {
  id?: number;
  propertyId?: number;
  stepCode: string;
  stepName: string;
  ownerName?: string;
  progressPercent?: number;
  state?: string;
  sortOrder?: number;
  updatedBy?: number;
};

export type PropertySummary = {
  propertyId: number;
  blockCount: number;
  floorCount: number;
  unitCount: number;
  occupiedUnits: number;
  vacantUnits: number;
  reservedUnits: number;
  maintenanceUnits: number;
  amenityCount: number;
};

export type PropertyTreeNode = {
  id: number;
  type: "PROPERTY" | "BLOCK" | "FLOOR" | "UNIT";
  code: string;
  name: string;
  status?: string;
  parentId?: number;
  children?: PropertyTreeNode[];
};

export type PropertySearch = {
  search?: string;
  region?: string;
  propertyType?: string;
  onboardingStatus?: string;
  includeInactive?: boolean;
  page?: number;
  pageSize?: number;
};

export async function listProperties(search: PropertySearch = {}) {
  const params = new URLSearchParams();
  const companyId = selectedCompanyId();
  if (companyId) params.set("companyId", String(companyId));
  Object.entries(search).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });
  return request<PropertyMaster[]>(`/properties${params.size ? `?${params}` : ""}`);
}

export async function getProperty(id: number) {
  return request<PropertyMaster>(`/properties/${id}`);
}

export async function createProperty(payload: PropertyMaster) {
  return request<PropertyMaster>("/properties", { method: "POST", body: withCompanyAndUser(payload) });
}

export async function savePropertyProfile(id: number, payload: PropertyMaster) {
  return request<PropertyMaster>(`/properties/${id}/profile`, { method: "PUT", body: withCompanyAndUser(payload, "updatedBy") });
}

export async function savePropertyDocuments(id: number, payload: PropertyMaster) {
  return request<PropertyMaster>(`/properties/${id}/documents`, { method: "PUT", body: withCompanyAndUser(payload, "updatedBy") });
}

export async function savePropertyOperatingModel(id: number, payload: PropertyMaster) {
  return request<PropertyMaster>(`/properties/${id}/operating-model`, { method: "PUT", body: withCompanyAndUser(payload, "updatedBy") });
}

export async function listBlocks(propertyId: number) {
  return request<MasterRecord[]>(`/properties/${propertyId}/blocks`);
}

export async function saveBlock(propertyId: number, payload: MasterRecord) {
  return request<MasterRecord>(`/properties/${propertyId}/blocks`, { method: "POST", body: withUser(payload) });
}

export async function updateBlock(id: number, payload: MasterRecord) {
  return request<MasterRecord>(`/blocks/${id}`, { method: "PUT", body: withUser(payload) });
}

export async function deactivateBlock(id: number) {
  const updatedBy = loggedUserId();
  return request<Record<string, never>>(`/blocks/${id}${updatedBy ? `?updatedBy=${updatedBy}` : ""}`, { method: "DELETE" });
}

export async function listFloors(blockId: number) {
  return request<MasterRecord[]>(`/blocks/${blockId}/floors`);
}

export async function saveFloor(blockId: number, payload: MasterRecord) {
  return request<MasterRecord>(`/blocks/${blockId}/floors`, { method: "POST", body: withUser(payload) });
}

export async function updateFloor(id: number, payload: MasterRecord) {
  return request<MasterRecord>(`/floors/${id}`, { method: "PUT", body: withUser(payload) });
}

export async function deactivateFloor(id: number) {
  const updatedBy = loggedUserId();
  return request<Record<string, never>>(`/floors/${id}${updatedBy ? `?updatedBy=${updatedBy}` : ""}`, { method: "DELETE" });
}

export async function listUnits(floorId: number) {
  return request<MasterRecord[]>(`/floors/${floorId}/units`);
}

export async function saveUnit(floorId: number, payload: MasterRecord) {
  return request<MasterRecord>(`/floors/${floorId}/units`, { method: "POST", body: withUser(payload) });
}

export async function updateUnit(id: number, payload: MasterRecord) {
  return request<MasterRecord>(`/units/${id}`, { method: "PUT", body: withUser(payload) });
}

export async function deactivateUnit(id: number) {
  const updatedBy = loggedUserId();
  return request<Record<string, never>>(`/units/${id}${updatedBy ? `?updatedBy=${updatedBy}` : ""}`, { method: "DELETE" });
}

export async function listAmenities(propertyId: number) {
  return request<MasterRecord[]>(`/properties/${propertyId}/amenities`);
}

export async function saveAmenity(propertyId: number, payload: MasterRecord) {
  return request<MasterRecord>(`/properties/${propertyId}/amenities`, { method: "POST", body: withUser(payload) });
}

export async function updateAmenity(id: number, payload: MasterRecord) {
  return request<MasterRecord>(`/amenities/${id}`, { method: "PUT", body: withUser(payload) });
}

export async function deactivateAmenity(id: number) {
  const updatedBy = loggedUserId();
  return request<Record<string, never>>(`/amenities/${id}${updatedBy ? `?updatedBy=${updatedBy}` : ""}`, { method: "DELETE" });
}

export async function listWorkflow(propertyId: number) {
  return request<WorkflowRow[]>(`/properties/${propertyId}/workflow`);
}

export async function saveWorkflow(propertyId: number, payload: WorkflowRow) {
  return request<WorkflowRow>(`/properties/${propertyId}/workflow`, { method: "POST", body: withUser(payload) });
}

export async function getPropertyTree(propertyId: number) {
  return request<PropertyTreeNode>(`/properties/${propertyId}/tree`);
}

export async function getPropertySummary(propertyId: number) {
  return request<PropertySummary>(`/properties/${propertyId}/summary`);
}

async function request<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const response = await fetch(`${propertyManagementBaseUrl}${path}`, {
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
    throw new Error(payload?.message ?? "Property management request failed.");
  }
  return payload;
}

function withCompanyAndUser<T extends PropertyMaster>(payload: T, userField: "createdBy" | "updatedBy" = "createdBy"): T {
  return {
    ...payload,
    companyId: payload.companyId ?? selectedCompanyId(),
    [userField]: payload[userField] ?? loggedUserId(),
  };
}

function withUser<T extends MasterRecord | WorkflowRow>(payload: T): T {
  return {
    ...payload,
    updatedBy: payload.updatedBy ?? loggedUserId(),
  };
}

function authHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("propertyConnect.authToken") ?? sessionStorage.getItem("propertyConnect.authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function selectedCompanyId(): number | undefined {
  if (typeof window === "undefined") return undefined;
  const rawCompany = localStorage.getItem("propertyConnect.selectedCompany") ?? sessionStorage.getItem("propertyConnect.selectedCompany");
  if (!rawCompany) return undefined;
  try {
    const company = JSON.parse(rawCompany) as { companyId?: number; id?: string | number };
    const value = company.companyId ?? Number(company.id);
    return Number.isFinite(value) ? Number(value) : undefined;
  } catch {
    return undefined;
  }
}

function loggedUserId(): number | undefined {
  if (typeof window === "undefined") return undefined;
  const user = storedObject("propertyConnect.user");
  const profile = storedObject("propertyConnect.userProfile");
  const nested = objectValue(profile?.userProfile) ?? objectValue(profile?.loggedUserProfile) ?? objectValue(profile?.loggedUser) ?? objectValue(profile?.user);
  return numericValue(nested?.id ?? nested?.userId ?? profile?.id ?? profile?.userId ?? user?.id);
}

function storedObject(key: string): Record<string, unknown> | null {
  const rawValue = localStorage.getItem(key) ?? sessionStorage.getItem(key);
  if (!rawValue) return null;
  try {
    return objectValue(JSON.parse(rawValue));
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
