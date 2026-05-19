"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Check,
  FileText,
  Layers3,
  Loader2,
  Plus,
  RefreshCcw,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";

import {
  createProperty,
  getProperty,
  listAmenities,
  listBlocks,
  listFloors,
  listProperties,
  listUnits,
  listWorkflow,
  saveAmenity,
  saveBlock,
  saveFloor,
  savePropertyDocuments,
  savePropertyOperatingModel,
  savePropertyProfile,
  saveUnit,
  saveWorkflow,
  updateAmenity,
  updateBlock,
  updateFloor,
  updateUnit,
  type MasterRecord,
  type PropertyDocumentRow,
  type PropertyMaster,
  type PropertyOwnershipRow,
  type WorkflowRow,
} from "@/lib/property-management";

type TabKey = "profile" | "ownership" | "documents" | "structure" | "commercial" | "operations";
type DraftRecord = MasterRecord & { draftKey?: string; kind?: "block" | "floor" | "unit" | "amenity" };
type OwnershipRow = PropertyOwnershipRow & { draftKey: string; shareRight: string; reference: string; status: string };
type DocumentRow = Omit<PropertyDocumentRow, "updatedDate"> & { draftKey: string; updated: string; status: string };

const emptyProperty: PropertyMaster = {
  code: "",
  name: "",
  propertyType: "RESIDENCE",
  region: "",
  addressLine1: "",
  city: "Dubai",
  emirate: "Dubai",
  country: "UAE",
  ownershipType: "OWN",
  ownerName: "",
  onboardingStatus: "DRAFT",
  activeStatus: "ACTIVE",
};

const tabs: { key: TabKey; label: string; icon: typeof Building2 }[] = [
  { key: "profile", label: "Property Profile", icon: Building2 },
  { key: "ownership", label: "Ownership", icon: ShieldCheck },
  { key: "documents", label: "Documents", icon: FileText },
  { key: "structure", label: "Structure Setup", icon: Layers3 },
  { key: "commercial", label: "Commercial & Finance", icon: FileText },
  { key: "operations", label: "Operations Setup", icon: ShieldCheck },
];

const propertyTypes = ["RESIDENCE", "COMMERCIAL", "MIXED_USE", "RETAIL", "STAFF_ACCOMMODATION"];
const holdingTypes = ["OWN", "LEASED", "MANAGED", "JOINT_VENTURE"];
const statuses = ["DRAFT", "IN_PROGRESS", "REVIEW", "READY", "ACTIVE"];

export function PropertyMasterWorkspace() {
  const router = useRouter();
  const [properties, setProperties] = useState<PropertyMaster[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<PropertyMaster>(emptyProperty);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tab, setTab] = useState<TabKey>("profile");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [ownershipRows, setOwnershipRows] = useState<OwnershipRow[]>([]);
  const [documentRows, setDocumentRows] = useState<DocumentRow[]>([]);
  const [blocks, setBlocks] = useState<DraftRecord[]>([]);
  const [floors, setFloors] = useState<DraftRecord[]>([]);
  const [units, setUnits] = useState<DraftRecord[]>([]);
  const [amenities, setAmenities] = useState<DraftRecord[]>([]);
  const [blockId, setBlockId] = useState<number | null>(null);
  const [floorId, setFloorId] = useState<number | null>(null);
  const [workflow, setWorkflow] = useState<WorkflowRow[]>([]);

  const filteredProperties = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return properties.filter((property) => {
      const matchesType = !typeFilter || property.propertyType === typeFilter;
      const matchesQuery =
        !normalized ||
        [property.code, property.name, property.region, property.city, property.propertyType, property.onboardingStatus].some((value) =>
          String(value ?? "").toLowerCase().includes(normalized),
        );
      return matchesType && matchesQuery;
    });
  }, [properties, query, typeFilter]);

  const selectedProperty = useMemo(() => properties.find((property) => property.id === selectedId) ?? null, [properties, selectedId]);

  const refresh = useCallback(async (preferredId?: number | null) => {
    setLoading(true);
    setError("");
    try {
      const loaded = await listProperties({ pageSize: 100 });
      setProperties(loaded);
      const nextId = preferredId && loaded.some((property) => property.id === preferredId) ? preferredId : loaded[0]?.id ?? null;
      const nextProperty = loaded.find((property) => property.id === nextId) ?? loaded[0] ?? emptyProperty;
      setSelectedId(nextId);
      loadPropertyIntoForm(nextProperty);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load property masters.");
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshStructure = useCallback(async (propertyId: number) => {
    const [loadedBlocks, loadedAmenities, loadedWorkflow] = await Promise.all([listBlocks(propertyId), listAmenities(propertyId), listWorkflow(propertyId)]);
    setBlocks(loadedBlocks);
    setAmenities(loadedAmenities);
    setWorkflow(loadedWorkflow);

    const nextBlockId = loadedBlocks[0]?.id ?? null;
    setBlockId(nextBlockId);
    if (!nextBlockId) {
      setFloors([]);
      setUnits([]);
      setFloorId(null);
      return;
    }

    const loadedFloors = await listFloors(nextBlockId);
    setFloors(loadedFloors);
    const nextFloorId = loadedFloors[0]?.id ?? null;
    setFloorId(nextFloorId);
    setUnits(nextFloorId ? await listUnits(nextFloorId) : []);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  useEffect(() => {
    if (selectedId) {
      const timer = window.setTimeout(() => {
        void refreshStructure(selectedId);
      }, 0);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [refreshStructure, selectedId]);

  function loadPropertyIntoForm(property: PropertyMaster) {
    setForm({ ...emptyProperty, ...property });
    setOwnershipRows(ownershipRowsFromProperty(property));
    setDocumentRows(documentRowsFromProperty(property));
  }

  function selectProperty(property: PropertyMaster) {
    setSelectedId(property.id ?? null);
    setMessage("");
    setError("");
  }

  async function editProperty(property: PropertyMaster) {
    if (!property.id) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const loaded = await getProperty(property.id);
      setSelectedId(loaded.id ?? null);
      loadPropertyIntoForm(loaded);
      setDrawerOpen(true);
      setTab("profile");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load property for edit.");
    } finally {
      setSaving(false);
    }
  }

  function startNewProperty() {
    setSelectedId(null);
    loadPropertyIntoForm(emptyProperty);
    setBlocks([]);
    setFloors([]);
    setUnits([]);
    setAmenities([]);
    setWorkflow([]);
    setBlockId(null);
    setFloorId(null);
    setDrawerOpen(true);
    setTab("profile");
    setMessage("");
    setError("");
  }

  async function run(action: () => Promise<number | null | void>, success: string) {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const nextId = await action();
      const effectiveId = typeof nextId === "number" ? nextId : selectedId;
      setMessage(success);
      await refresh(effectiveId);
      if (effectiveId) {
        await refreshStructure(effectiveId);
      }
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to complete action.");
    } finally {
      setSaving(false);
    }
  }

  async function saveBaseProperty(nextStatus: string) {
    validateProperty();
    const payload = propertyPayload(nextStatus);
    if (!selectedId) {
      const created = await createProperty(payload);
      if (!created.id) {
        throw new Error("Property was saved without an id.");
      }
      return created.id;
    }
    const saved = await savePropertyProfile(selectedId, payload);
    const id = saved.id ?? selectedId;
    if (!id) {
      throw new Error("Property was saved without an id.");
    }
    await savePropertyDocuments(id, documentPayload(payload));
    await savePropertyOperatingModel(id, payload);
    return id;
  }

  async function submitProperty(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await run(() => saveBaseProperty(form.onboardingStatus === "DRAFT" ? "IN_PROGRESS" : form.onboardingStatus ?? "IN_PROGRESS"), selectedId ? "Property updated." : "Property created.");
  }

  async function saveDraft() {
    await run(() => saveBaseProperty("DRAFT"), "Draft saved.");
  }

  async function submitFinal() {
    await run(async () => {
      const id = await saveBaseProperty("ACTIVE");
      await saveStructureRows(id);
      await saveWorkflowRows(id);
      return id;
    }, "Property submitted.");
  }

  async function saveStructureRows(propertyId: number) {
    for (const row of blocks) {
      if (!row.code && !row.name) continue;
      const payload = normalizeRecord(row);
      if (row.id) await updateBlock(row.id, payload);
      else await saveBlock(propertyId, payload);
    }
    for (const row of floors) {
      if (!row.code && !row.name) continue;
      const parentId = row.parentId ?? blockId;
      if (!parentId) throw new Error("Select a block before saving floors.");
      const payload = normalizeRecord({ ...row, parentId });
      if (row.id) await updateFloor(row.id, payload);
      else await saveFloor(parentId, payload);
    }
    for (const row of units) {
      if (!row.code && !row.name) continue;
      const parentId = row.parentId ?? floorId;
      if (!parentId) throw new Error("Select a floor before saving units.");
      const payload = normalizeRecord({ ...row, parentId });
      if (row.id) await updateUnit(row.id, payload);
      else await saveUnit(parentId, payload);
    }
    for (const row of amenities) {
      if (!row.code && !row.name) continue;
      const payload = normalizeRecord(row);
      if (row.id) await updateAmenity(row.id, payload);
      else await saveAmenity(propertyId, payload);
    }
  }

  async function saveWorkflowRows(propertyId: number) {
    for (const row of workflow) {
      if (!row.stepCode && !row.stepName) continue;
      await saveWorkflow(propertyId, {
        ...row,
        stepCode: required(row.stepCode, "Workflow step code is required"),
        stepName: required(row.stepName, "Workflow step name is required"),
        progressPercent: clamp(row.progressPercent ?? 0, 0, 100),
        state: row.state || "PENDING",
      });
    }
  }

  return (
    <main className="page-surface min-h-screen px-5 py-6 lg:px-8">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-[color:var(--foreground-muted)]">Property Management / Property Master</p>
          <h1 className="display-font text-3xl font-semibold text-[color:var(--brand-strong)]">Property Master</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold" onClick={() => void refresh(selectedId)} type="button">
            <RefreshCcw className="h-4 w-4" /> Refresh
          </button>
          <button className="btn-primary inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold" onClick={startNewProperty} type="button">
            <Plus className="h-4 w-4" /> Create Onboarding Request
          </button>
        </div>
      </div>

      {message ? <Notice tone="success" label={message} /> : null}
      {error ? <Notice tone="danger" label={error} /> : null}

      <div className="grid gap-4 xl:grid-cols-[324px_1fr]">
        <aside className="panel h-fit rounded-lg">
          <div className="border-b border-[color:var(--line)] p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[color:var(--brand-strong)]">Property List</h2>
              <span className="pill-brand rounded-full px-2.5 py-1 text-xs font-bold">{filteredProperties.length}</span>
            </div>
            <div className="field mt-4 flex items-center gap-2 rounded-lg px-3 py-2">
              <Search className="h-4 w-4 text-[color:var(--foreground-subtle)]" />
              <input className="w-full bg-transparent text-sm outline-none" onChange={(event) => setQuery(event.target.value)} placeholder="Search property..." value={query} />
            </div>
            <SelectField label="Type" value={typeFilter} onChange={setTypeFilter} options={["", ...propertyTypes]} />
          </div>
          <div className="max-h-[690px] space-y-2 overflow-auto p-4">
            {loading ? <LoadingRow /> : null}
            {!loading && filteredProperties.length === 0 ? <EmptyRow label="No property masters found." /> : null}
            {filteredProperties.map((property) => (
              <div
                className="w-full rounded-lg border p-3 text-left transition hover:border-[color:var(--brand-border)]"
                key={property.id ?? property.code}
                style={{ background: selectedId === property.id ? "var(--brand-tint)" : "var(--surface-raised)", borderColor: selectedId === property.id ? "var(--brand-border)" : "var(--line)" }}
              >
                <div className="flex items-start justify-between gap-3">
                  <button className="min-w-0 flex-1 text-left" onClick={() => selectProperty(property)} type="button">
                    <p className="text-sm font-bold text-[color:var(--brand-strong)]">{property.name}</p>
                    <p className="text-xs font-semibold text-[color:var(--foreground-muted)]">{property.code} / {labelize(property.propertyType)} / {property.region || "Region pending"}</p>
                  </button>
                  <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${statusClass(property.onboardingStatus)}`}>{labelize(property.onboardingStatus)}</span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <p className="text-xs text-[color:var(--foreground-muted)]">{property.totalBlocks ?? 0} blocks / {property.totalUnits ?? 0} units</p>
                  <div className="flex gap-2">
                    {property.id ? (
                      <>
                        <button className="btn-secondary rounded-md px-3 py-1.5 text-xs font-bold" onClick={() => void editProperty(property)} type="button">
                          Edit
                        </button>
                        <button className="btn-secondary rounded-md px-3 py-1.5 text-xs font-bold" onClick={() => router.push(`/propertyconnect/property-management/property-view?propertyId=${property.id}`)} type="button">
                          View
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </aside>

        <ReadOnlyPropertyPanel property={selectedProperty} onCreate={startNewProperty} onEdit={selectedProperty ? () => void editProperty(selectedProperty) : undefined} onView={selectedProperty?.id ? () => router.push(`/propertyconnect/property-management/property-view?propertyId=${selectedProperty.id}`) : undefined} />
      </div>

      {drawerOpen ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-[color:var(--overlay)]">
          <section className="h-full w-full max-w-6xl overflow-y-auto bg-[color:var(--surface-strong)] shadow-2xl">
          <div className="flex items-start justify-between border-b border-[color:var(--line)] p-4">
            <div>
              <p className="text-xs font-bold text-[color:var(--foreground-muted)]">Property Intake</p>
              <h2 className="text-xl font-bold text-[color:var(--brand-strong)]">{selectedId ? `Edit ${selectedProperty?.name ?? "Property"}` : "New Onboarding Request"}</h2>
            </div>
            <button className="btn-secondary inline-flex h-10 w-10 items-center justify-center rounded-lg" onClick={() => setDrawerOpen(false)} title="Close intake" type="button">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="m-4 flex gap-1 overflow-x-auto rounded-lg bg-[color:var(--surface-muted)] p-1">
            {tabs.map((item) => {
              const Icon = item.icon;
              return (
                <button className={`inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-bold ${tab === item.key ? "bg-[color:var(--surface-raised)] text-[color:var(--brand)] shadow-sm" : "text-[color:var(--foreground-muted)]"}`} key={item.key} onClick={() => setTab(item.key)} type="button">
                  <Icon className="h-4 w-4" /> {item.label}
                </button>
              );
            })}
          </div>

          <form className="px-4 pb-4" onSubmit={submitProperty}>
            {tab === "profile" ? (
              <div className="grid gap-4 lg:grid-cols-2">
                <Field label="Property Name" required value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
                <SelectField label="Property Holding Type" value={form.ownershipType} onChange={(value) => setForm({ ...form, ownershipType: value })} options={holdingTypes} />
                <SelectField label="Type" value={form.propertyType} onChange={(value) => setForm({ ...form, propertyType: value })} options={propertyTypes} />
                <Field label="Region" required value={form.region} onChange={(value) => setForm({ ...form, region: value })} />
                <Field label="Address" value={form.addressLine1} onChange={(value) => setForm({ ...form, addressLine1: value })} />
                <Field label="Category" value={form.description} onChange={(value) => setForm({ ...form, description: value })} />
                <Field label="Usage Type" value={form.operatingModel} onChange={(value) => setForm({ ...form, operatingModel: value })} />
                <Field label="Community" value={form.city} onChange={(value) => setForm({ ...form, city: value })} />
                <SelectField label="Status" value={form.onboardingStatus} onChange={(value) => setForm({ ...form, onboardingStatus: value })} options={statuses} />
                <Field label="Property Code" value={form.code} onChange={(value) => setForm({ ...form, code: value })} />
              </div>
            ) : null}

            {tab === "ownership" ? (
              <EditableTable
                columns={["Party", "Role", "Share / Right", "Reference", "Status", ""]}
                emptyLabel="No ownership rows."
                onAdd={() => setOwnershipRows([...ownershipRows, newOwnershipRow(form)])}
                rows={ownershipRows.map((row, index) => (
                  <tr key={row.id ?? row.draftKey}>
                    <EditableCell value={row.party} onChange={(value) => updateOwnership(index, { party: value })} />
                    <EditableCell value={row.role} onChange={(value) => updateOwnership(index, { role: value })} />
                    <EditableCell value={row.shareRight} onChange={(value) => updateOwnership(index, { shareRight: value })} />
                    <EditableCell value={row.reference} onChange={(value) => updateOwnership(index, { reference: value })} />
                    <EditableCell value={row.status} onChange={(value) => updateOwnership(index, { status: value })} />
                    <RemoveCell persisted={Boolean(row.id)} onRemove={() => removeDraftRow("ownership", index)} />
                  </tr>
                ))}
              />
            ) : null}

            {tab === "documents" ? (
              <EditableTable
                columns={["Document", "Category", "Reference", "Updated", "Status", ""]}
                emptyLabel="No document rows."
                onAdd={() => setDocumentRows([...documentRows, newDocumentRow()])}
                rows={documentRows.map((row, index) => (
                  <tr key={row.id ?? row.draftKey}>
                    <EditableCell value={row.document} onChange={(value) => updateDocument(index, { document: value })} />
                    <EditableCell value={row.category} onChange={(value) => updateDocument(index, { category: value })} />
                    <EditableCell value={row.reference} onChange={(value) => updateDocument(index, { reference: value })} />
                    <EditableCell type="date" value={row.updated} onChange={(value) => updateDocument(index, { updated: value })} />
                    <EditableCell value={row.status} onChange={(value) => updateDocument(index, { status: value })} />
                    <RemoveCell persisted={Boolean(row.id)} onRemove={() => removeDraftRow("documents", index)} />
                  </tr>
                ))}
              />
            ) : null}

            {tab === "structure" ? (
              <div className="grid gap-4">
                <div className="grid gap-4 xl:grid-cols-2">
                  <RecordTable title="Buildings / Blocks" records={blocks} selectedId={blockId} onSelect={(row) => void selectBlock(row)} onAdd={() => setBlocks([...blocks, newRecord("block", blocks.length + 1)])} onChange={(index, value) => updateRecord(setBlocks, index, value)} onRemove={(index) => removeDraftRow("blocks", index)} />
                  <RecordTable title="Floors" records={floors} selectedId={floorId} onSelect={(row) => void selectFloor(row)} onAdd={() => setFloors([...floors, newRecord("floor", floors.length + 1, blockId)])} onChange={(index, value) => updateRecord(setFloors, index, value)} onRemove={(index) => removeDraftRow("floors", index)} disabled={!blockId && blocks.every((row) => !row.id)} />
                  <RecordTable title="Units" records={units} onAdd={() => setUnits([...units, newRecord("unit", units.length + 1, floorId)])} onChange={(index, value) => updateRecord(setUnits, index, value)} onRemove={(index) => removeDraftRow("units", index)} disabled={!floorId && floors.every((row) => !row.id)} />
                  <RecordTable title="Amenities" records={amenities} onAdd={() => setAmenities([...amenities, newRecord("amenity", amenities.length + 1)])} onChange={(index, value) => updateRecord(setAmenities, index, value)} onRemove={(index) => removeDraftRow("amenities", index)} />
                </div>
                <p className="text-xs font-semibold text-[color:var(--foreground-muted)]">Saved rows are master data and cannot be removed from this intake screen. Add a new draft row, then save draft or submit to persist it.</p>
              </div>
            ) : null}

            {tab === "commercial" ? (
              <div className="grid gap-4 lg:grid-cols-2">
                <NumberField label="Built-up Area" value={form.builtUpArea} onChange={(value) => setForm({ ...form, builtUpArea: value })} />
                <NumberField label="Plot Area" value={form.plotArea} onChange={(value) => setForm({ ...form, plotArea: value })} />
                <NumberField label="Market Value" value={form.marketValue} onChange={(value) => setForm({ ...form, marketValue: value })} />
                <NumberField label="Annual Service Charge" value={form.annualServiceCharge} onChange={(value) => setForm({ ...form, annualServiceCharge: value })} />
                <Field label="RERA Permit No" value={form.reraPermitNo} onChange={(value) => setForm({ ...form, reraPermitNo: value })} />
                <Field label="Title Deed No" value={form.titleDeedNo} onChange={(value) => setForm({ ...form, titleDeedNo: value })} />
              </div>
            ) : null}

            {tab === "operations" ? (
              <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
                <div className="grid h-fit gap-4">
                  <Field label="Operating Model" value={form.operatingModel} onChange={(value) => setForm({ ...form, operatingModel: value })} />
                  <Field label="Facility Manager" value={form.facilityManager} onChange={(value) => setForm({ ...form, facilityManager: value })} />
                  <SelectField label="Onboarding Status" value={form.onboardingStatus} onChange={(value) => setForm({ ...form, onboardingStatus: value })} options={statuses} />
                </div>
                <EditableTable
                  columns={["Step Code", "Step Name", "Owner", "Progress", "State"]}
                  emptyLabel="No workflow rows."
                  onAdd={() => setWorkflow([...workflow, { stepCode: "", stepName: "", ownerName: "", progressPercent: 0, state: "PENDING", sortOrder: workflow.length + 1 }])}
                  rows={workflow.map((row, index) => (
                    <tr key={row.id ?? `workflow-${index}`}>
                      <EditableCell value={row.stepCode} onChange={(value) => updateWorkflow(index, { stepCode: value })} />
                      <EditableCell value={row.stepName} onChange={(value) => updateWorkflow(index, { stepName: value })} />
                      <EditableCell value={row.ownerName} onChange={(value) => updateWorkflow(index, { ownerName: value })} />
                      <EditableCell type="number" value={String(row.progressPercent ?? 0)} onChange={(value) => updateWorkflow(index, { progressPercent: clamp(Number(value), 0, 100) })} />
                      <EditableCell value={row.state} onChange={(value) => updateWorkflow(index, { state: value })} />
                    </tr>
                  ))}
                />
              </div>
            ) : null}

            <div className="mt-8 flex flex-col gap-3 rounded-lg border border-[color:var(--line)] bg-[color:var(--surface-muted)] p-3 sm:flex-row sm:items-center sm:justify-between">
              <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${statusClass(form.onboardingStatus)}`}>{labelize(form.onboardingStatus)}</span>
              <div className="flex flex-wrap gap-2">
                <button className="btn-secondary inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold disabled:opacity-60" disabled={saving} onClick={() => void saveDraft()} type="button">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Draft
                </button>
                <button className="btn-primary inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold disabled:opacity-60" disabled={saving} onClick={() => void submitFinal()} type="button">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Submit
                </button>
              </div>
            </div>
          </form>
          </section>
        </div>
      ) : null}
    </main>
  );

  function updateOwnership(index: number, patch: Partial<OwnershipRow>) {
    setOwnershipRows((rows) => rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)));
  }

  function updateDocument(index: number, patch: Partial<DocumentRow>) {
    setDocumentRows((rows) => rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)));
  }

  function updateWorkflow(index: number, patch: Partial<WorkflowRow>) {
    setWorkflow((rows) => rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)));
  }

  async function selectBlock(row: DraftRecord) {
    if (!row.id) {
      setBlockId(null);
      return;
    }
    setBlockId(row.id);
    const loadedFloors = await listFloors(row.id);
    setFloors(loadedFloors);
    const nextFloorId = loadedFloors[0]?.id ?? null;
    setFloorId(nextFloorId);
    setUnits(nextFloorId ? await listUnits(nextFloorId) : []);
  }

  async function selectFloor(row: DraftRecord) {
    if (!row.id) {
      setFloorId(null);
      return;
    }
    setFloorId(row.id);
    setUnits(await listUnits(row.id));
  }

  function removeDraftRow(kind: "ownership" | "documents" | "blocks" | "floors" | "units" | "amenities", index: number) {
    if (!window.confirm("Remove this unsaved row?")) return;
    if (kind === "ownership") setOwnershipRows((rows) => rows.filter((_, rowIndex) => rowIndex !== index));
    if (kind === "documents") setDocumentRows((rows) => rows.filter((_, rowIndex) => rowIndex !== index));
    if (kind === "blocks") setBlocks((rows) => rows.filter((_, rowIndex) => rowIndex !== index));
    if (kind === "floors") setFloors((rows) => rows.filter((_, rowIndex) => rowIndex !== index));
    if (kind === "units") setUnits((rows) => rows.filter((_, rowIndex) => rowIndex !== index));
    if (kind === "amenities") setAmenities((rows) => rows.filter((_, rowIndex) => rowIndex !== index));
  }

  function validateProperty() {
    required(form.name, "Property name is required");
    required(form.propertyType, "Property type is required");
    required(form.region, "Region is required");
    if (documentRows.some((row) => row.document || row.reference) && documentRows.some((row) => !row.document || !row.reference)) {
      throw new Error("Document and reference are required for every document row.");
    }
  }

  function propertyPayload(nextStatus: string): PropertyMaster {
    const firstOwner = ownershipRows.find((row) => row.party.trim()) ?? ownershipRows[0];
    return {
      ...form,
      code: form.code?.trim() || codeFromName(form.name),
      name: form.name.trim(),
      region: form.region?.trim(),
      propertyType: form.propertyType,
      ownershipType: form.ownershipType,
      ownerName: firstOwner?.party || form.ownerName,
      onboardingStatus: nextStatus,
      ownershipRows: ownershipRows
        .filter((row) => row.party.trim() || row.role.trim() || row.shareRight.trim() || row.reference.trim())
        .map((row, index) => ({
          id: row.id,
          propertyId: row.propertyId,
          party: row.party.trim(),
          role: row.role.trim() || "Owner",
          shareRight: row.shareRight.trim() || "100%",
          reference: row.reference.trim(),
          status: row.status.trim() || "ACTIVE",
          sortOrder: row.sortOrder ?? (index + 1) * 10,
        })),
      documentRows: documentRows
        .filter((row) => row.document.trim() || row.category.trim() || row.reference.trim())
        .map((row, index) => ({
          id: row.id,
          propertyId: row.propertyId,
          document: row.document.trim(),
          category: row.category.trim() || "Legal",
          reference: row.reference.trim(),
          updatedDate: row.updated,
          status: row.status.trim() || "ACTIVE",
          sortOrder: row.sortOrder ?? (index + 1) * 10,
        })),
    };
  }

  function documentPayload(payload: PropertyMaster): PropertyMaster {
    const firstDocument = documentRows.find((row) => row.document.trim() || row.reference.trim());
    return {
      ...payload,
      titleDeedNo: firstDocument?.document.toLowerCase().includes("title") ? firstDocument.reference : payload.titleDeedNo,
      documentReference: firstDocument?.reference ?? payload.documentReference,
      documentStatus: firstDocument?.status ?? payload.documentStatus,
      documentRows: payload.documentRows,
    };
  }
}

function ReadOnlyPropertyPanel({
  property,
  onCreate,
  onEdit,
  onView,
}: {
  property: PropertyMaster | null;
  onCreate: () => void;
  onEdit?: () => void;
  onView?: () => void;
}) {
  if (!property) {
    return (
      <section className="panel flex min-h-[420px] items-center justify-center rounded-lg p-8 text-center">
        <div className="max-w-md">
          <Building2 className="mx-auto h-10 w-10 text-[color:var(--brand)]" />
          <h2 className="mt-3 text-xl font-bold text-[color:var(--brand-strong)]">No property master selected</h2>
          <p className="mt-2 text-sm text-[color:var(--foreground-muted)]">Create an onboarding request to capture property profile, ownership, documents, structure, commercial and operations details.</p>
          <button className="btn-primary mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold" onClick={onCreate} type="button">
            <Plus className="h-4 w-4" /> Create Onboarding Request
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="panel rounded-lg">
      <div className="flex flex-col gap-3 border-b border-[color:var(--line)] p-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold text-[color:var(--foreground-muted)]">{property.code}</p>
          <h2 className="text-2xl font-bold text-[color:var(--brand-strong)]">{property.name}</h2>
          <p className="mt-1 text-sm text-[color:var(--foreground-muted)]">{[property.addressLine1, property.city, property.region].filter(Boolean).join(", ") || "Address not captured"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {onEdit ? <button className="btn-secondary rounded-lg px-4 py-2 text-sm font-bold" onClick={onEdit} type="button">Edit</button> : null}
          {onView ? <button className="btn-primary rounded-lg px-4 py-2 text-sm font-bold" onClick={onView} type="button">View</button> : null}
        </div>
      </div>
      <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
        <ReadOnlyMetric label="Buildings / Blocks" value={property.totalBlocks ?? 0} />
        <ReadOnlyMetric label="Floors" value={property.totalFloors ?? 0} />
        <ReadOnlyMetric label="Units" value={property.totalUnits ?? 0} />
        <ReadOnlyMetric label="Amenities" value={property.totalAmenities ?? 0} />
      </div>
      <div className="grid gap-4 border-t border-[color:var(--line)] p-4 xl:grid-cols-2">
        <ReadOnlyField label="Holding Type" value={labelize(property.ownershipType)} />
        <ReadOnlyField label="Property Type" value={labelize(property.propertyType)} />
        <ReadOnlyField label="Region" value={property.region} />
        <ReadOnlyField label="Community" value={property.city} />
        <ReadOnlyField label="Owner" value={property.ownerName} />
        <ReadOnlyField label="Status" value={labelize(property.onboardingStatus)} />
        <ReadOnlyField label="Title Deed" value={property.titleDeedNo} />
        <ReadOnlyField label="RERA Permit" value={property.reraPermitNo} />
        <ReadOnlyField label="Operating Model" value={property.operatingModel} />
        <ReadOnlyField label="Facility Manager" value={property.facilityManager} />
      </div>
    </section>
  );
}

function ReadOnlyMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[color:var(--line)] bg-[color:var(--surface-muted)] p-4">
      <p className="text-xs font-bold text-[color:var(--foreground-muted)]">{label}</p>
      <p className="mt-2 text-2xl font-bold text-[color:var(--brand-strong)]">{value}</p>
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-lg border border-[color:var(--line)] bg-[color:var(--surface-muted)] p-3">
      <p className="text-xs font-bold text-[color:var(--foreground-muted)]">{label}</p>
      <p className="mt-1 text-sm font-bold text-[color:var(--brand-strong)]">{value || "Not captured"}</p>
    </div>
  );
}

function RecordTable({
  title,
  records,
  selectedId,
  disabled,
  onSelect,
  onAdd,
  onChange,
  onRemove,
}: {
  title: string;
  records: DraftRecord[];
  selectedId?: number | null;
  disabled?: boolean;
  onSelect?: (row: DraftRecord) => void;
  onAdd: () => void;
  onChange: (index: number, row: DraftRecord) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <section className="rounded-lg border border-[color:var(--line)]">
      <div className="flex items-center justify-between border-b border-[color:var(--line)] px-3 py-2">
        <h3 className="text-sm font-bold">{title}</h3>
        <button className="btn-secondary inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold disabled:opacity-50" disabled={disabled} onClick={onAdd} type="button">
          <Plus className="h-3.5 w-3.5" /> Add
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="bg-[color:var(--surface-muted)] text-xs uppercase text-[color:var(--foreground-muted)]">
            <tr>
              <th className="px-3 py-2">Code</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Description</th>
              <th className="px-3 py-2">Sort</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr><td className="px-3 py-3 text-[color:var(--foreground-muted)]" colSpan={5}>No rows.</td></tr>
            ) : null}
            {records.map((row, index) => (
              <tr className={selectedId === row.id ? "bg-[color:var(--brand-tint)]" : ""} key={row.id ?? row.draftKey}>
                <td className="border-t border-[color:var(--line)] px-2 py-2"><input className="field w-full rounded-md px-2 py-1" value={row.code ?? ""} onChange={(event) => onChange(index, { ...row, code: event.target.value })} onFocus={() => onSelect?.(row)} /></td>
                <td className="border-t border-[color:var(--line)] px-2 py-2"><input className="field w-full rounded-md px-2 py-1" value={row.name ?? ""} onChange={(event) => onChange(index, { ...row, name: event.target.value })} onFocus={() => onSelect?.(row)} /></td>
                <td className="border-t border-[color:var(--line)] px-2 py-2"><input className="field w-full rounded-md px-2 py-1" value={row.description ?? ""} onChange={(event) => onChange(index, { ...row, description: event.target.value })} /></td>
                <td className="border-t border-[color:var(--line)] px-2 py-2"><input className="field w-20 rounded-md px-2 py-1" type="number" value={row.sortOrder ?? 0} onChange={(event) => onChange(index, { ...row, sortOrder: Number(event.target.value) })} /></td>
                <RemoveCell persisted={Boolean(row.id)} onRemove={() => onRemove(index)} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function EditableTable({ columns, rows, emptyLabel, onAdd }: { columns: string[]; rows: React.ReactNode[]; emptyLabel: string; onAdd: () => void }) {
  return (
    <section className="rounded-lg border border-[color:var(--line)]">
      <div className="flex justify-end border-b border-[color:var(--line)] px-3 py-2">
        <button className="btn-secondary inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold" onClick={onAdd} type="button">
          <Plus className="h-3.5 w-3.5" /> Add Row
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-[color:var(--surface-muted)] text-xs uppercase text-[color:var(--foreground-muted)]">
            <tr>{columns.map((column) => <th className="px-3 py-2" key={column}>{column}</th>)}</tr>
          </thead>
          <tbody>
            {rows.length === 0 ? <tr><td className="px-3 py-3 text-[color:var(--foreground-muted)]" colSpan={columns.length}>{emptyLabel}</td></tr> : rows}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function EditableCell({ value, onChange, type = "text" }: { value?: string; onChange: (value: string) => void; type?: "text" | "number" | "date" }) {
  return (
    <td className="border-t border-[color:var(--line)] px-2 py-2">
      <input className="field w-full rounded-md px-2 py-1" type={type} value={value ?? ""} onChange={(event) => onChange(event.target.value)} />
    </td>
  );
}

function RemoveCell({ persisted, onRemove }: { persisted: boolean; onRemove: () => void }) {
  return (
    <td className="border-t border-[color:var(--line)] px-2 py-2 text-right">
      <button className="btn-secondary inline-flex h-8 w-8 items-center justify-center rounded-md disabled:cursor-not-allowed disabled:opacity-40" disabled={persisted} onClick={onRemove} title={persisted ? "Saved rows cannot be removed here" : "Remove row"} type="button">
        <Trash2 className="h-4 w-4" />
      </button>
    </td>
  );
}

function Field({ label, value, onChange, required = false }: { label: string; value?: string; onChange: (value: string) => void; required?: boolean }) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-[color:var(--foreground-muted)]">{label}{required ? " *" : ""}</span>
      <input className="field mt-1 w-full rounded-lg px-3 py-2 text-sm" onChange={(event) => onChange(event.target.value)} required={required} value={value ?? ""} />
    </label>
  );
}

function NumberField({ label, value, onChange }: { label: string; value?: number; onChange: (value: number | undefined) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-[color:var(--foreground-muted)]">{label}</span>
      <input className="field mt-1 w-full rounded-lg px-3 py-2 text-sm" min="0" onChange={(event) => onChange(event.target.value ? Number(event.target.value) : undefined)} type="number" value={value ?? ""} />
    </label>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value?: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <label className="mt-3 block">
      <span className="text-xs font-bold text-[color:var(--foreground-muted)]">{label}</span>
      <select className="field mt-1 w-full rounded-lg px-3 py-2 text-sm" onChange={(event) => onChange(event.target.value)} value={value ?? ""}>
        {options.map((option) => <option key={option || "all"} value={option}>{option ? labelize(option) : "All"}</option>)}
      </select>
    </label>
  );
}

function Notice({ label, tone }: { label: string; tone: "success" | "danger" }) {
  return <div className={`mb-4 rounded-lg px-4 py-3 text-sm font-semibold ${tone === "success" ? "pill-success" : "pill-danger"}`}>{label}</div>;
}

function LoadingRow() {
  return <div className="flex items-center gap-2 rounded-lg bg-[color:var(--surface-muted)] p-3 text-sm font-semibold"><Loader2 className="h-4 w-4 animate-spin" /> Loading</div>;
}

function EmptyRow({ label }: { label: string }) {
  return <div className="rounded-lg bg-[color:var(--surface-muted)] p-3 text-sm text-[color:var(--foreground-muted)]">{label}</div>;
}

function updateRecord(setter: React.Dispatch<React.SetStateAction<DraftRecord[]>>, index: number, value: DraftRecord) {
  setter((rows) => rows.map((row, rowIndex) => (rowIndex === index ? value : row)));
}

function ownershipRowsFromProperty(property: PropertyMaster): OwnershipRow[] {
  if (property.ownershipRows?.length) {
    return property.ownershipRows.map((row) => ({
      draftKey: `ownership-${row.id ?? crypto.randomUUID()}`,
      id: row.id,
      propertyId: row.propertyId,
      party: row.party ?? "",
      role: row.role ?? "",
      shareRight: row.shareRight ?? "",
      reference: row.reference ?? "",
      status: row.status ?? "ACTIVE",
      sortOrder: row.sortOrder,
    }));
  }
  return [
    {
      draftKey: "ownership-primary",
      party: property.ownerName || "Property Holding Type",
      role: labelize(property.ownershipType || "Owned Property"),
      shareRight: property.ownershipType === "MANAGED" ? "Managed" : "100%",
      reference: property.titleDeedNo || "Property Master",
      status: property.activeStatus || "ACTIVE",
    },
  ];
}

function documentRowsFromProperty(property: PropertyMaster): DocumentRow[] {
  if (property.documentRows?.length) {
    return property.documentRows.map((row) => ({
      draftKey: `document-${row.id ?? crypto.randomUUID()}`,
      id: row.id,
      propertyId: row.propertyId,
      document: row.document ?? "",
      category: row.category ?? "Legal",
      reference: row.reference ?? "",
      updated: row.updatedDate ?? "",
      status: row.status ?? "ACTIVE",
      sortOrder: row.sortOrder,
    }));
  }
  const rows: DocumentRow[] = [];
  if (property.titleDeedNo || property.documentReference) {
    rows.push({
      draftKey: "document-primary",
      document: property.titleDeedNo ? "Title Deed" : "Property Document",
      category: "Legal",
      reference: property.titleDeedNo || property.documentReference || "",
      updated: "",
      status: property.documentStatus || "ACTIVE",
    });
  }
  if (property.reraPermitNo) {
    rows.push({
      draftKey: "document-rera",
      document: "RERA Permit",
      category: "Compliance",
      reference: property.reraPermitNo,
      updated: "",
      status: property.documentStatus || "ACTIVE",
    });
  }
  return rows.length ? rows : [newDocumentRow()];
}

function newOwnershipRow(property: PropertyMaster): OwnershipRow {
  return { draftKey: crypto.randomUUID(), party: property.ownerName ?? "", role: "Corporate Owner", shareRight: "100%", reference: "", status: "ACTIVE" };
}

function newDocumentRow(): DocumentRow {
  return { draftKey: crypto.randomUUID(), document: "", category: "Legal", reference: "", updated: "", status: "ACTIVE" };
}

function newRecord(kind: DraftRecord["kind"], count: number, parentId?: number | null): DraftRecord {
  const prefix = kind === "block" ? "BLK" : kind === "floor" ? "FLR" : kind === "unit" ? "UNT" : "AMN";
  return { draftKey: crypto.randomUUID(), kind, code: `${prefix}-${String(count).padStart(2, "0")}`, name: "", description: "", parentId: parentId ?? undefined, sortOrder: count, attributes: "{}" };
}

function normalizeRecord(record: DraftRecord): MasterRecord {
  return {
    ...record,
    code: required(record.code, "Code is required"),
    name: required(record.name, "Name is required"),
    attributes: record.attributes || "{}",
    activeStatus: record.activeStatus || "ACTIVE",
  };
}

function codeFromName(name: string) {
  const base = name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24);
  return base || `PROP-${Date.now()}`;
}

function required(value: string | undefined, message: string) {
  if (!value?.trim()) throw new Error(message);
  return value.trim();
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(value, max));
}

function statusClass(value?: string) {
  if (value === "ACTIVE" || value === "READY") return "pill-success";
  if (value === "REVIEW" || value === "IN_PROGRESS") return "pill-warning";
  return "pill-brand";
}

function labelize(value?: string) {
  return String(value ?? "").replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}
