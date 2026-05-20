"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, Edit3, Loader2, Plus, Save, Trash2, X } from "lucide-react";

import { listCodeValues } from "@/lib/lead";
import {
  getPropertySummary,
  listBlocks,
  listFloors,
  listProperties,
  listPropertyViewTabRows,
  listUnits,
  saveBlock,
  saveFloor,
  savePropertyViewTabRows,
  saveUnit,
  updateBlock,
  updateFloor,
  updateUnit,
  type MasterRecord,
  type PropertyMaster,
  type PropertySummary,
  type PropertyViewEntityType,
  type PropertyViewTabRow,
} from "@/lib/property-management";

type NodeType = PropertyViewEntityType;
type DialogMode = "create" | "edit";
type TabCode = "PROFILE" | "OWNERSHIP" | "DOCUMENTS" | "FLOORS" | "UNITS" | "LEASE" | "CHARGES" | "FACILITIES" | "ACTIVITY";
type StructureNode = { type: NodeType; record: MasterRecord; block?: MasterRecord; floor?: MasterRecord };
type StructureState = { blocks: MasterRecord[]; floorsByBlock: Record<number, MasterRecord[]>; unitsByFloor: Record<number, MasterRecord[]> };
type TabDraftRow = PropertyViewTabRow & { draftKey: string; data: Record<string, string> };
type ColumnDef = { key: string; label: string; required?: boolean; inputType?: "date" | "number" | "text" };
type Option = { label: string; value: string };
type TreeDepth = 1 | 2 | 3;
type StructureForm = {
  code: string;
  name: string;
  type: string;
  parentId: string;
  floors: string;
  units: string;
  residenceUnits: string;
  retailUnits: string;
  parkingBays: string;
  vacantUnits: string;
  reservedUnits: string;
  area: string;
  bedrooms: string;
  baseRent: string;
  serviceCharge: string;
  status: string;
};

const emptySummary: PropertySummary = { propertyId: 0, blockCount: 0, floorCount: 0, unitCount: 0, occupiedUnits: 0, vacantUnits: 0, reservedUnits: 0, maintenanceUnits: 0, amenityCount: 0 };
const emptyStructure: StructureState = { blocks: [], floorsByBlock: {}, unitsByFloor: {} };
const typeOptions = ["Residence", "Commercial", "Mixed Use", "Retail"];
const fallbackUnitTypeOptions: Option[] = ["Studio", "1 Bed", "2 Bed", "3 Bed", "Retail", "Office"].map((value) => ({ label: value, value }));
const unitStatusOptions = ["VACANT", "OCCUPIED", "RESERVED", "UNDER_MAINTENANCE"];
const activeStatusOptions = [{ label: "Active", value: "Y" }, { label: "Inactive", value: "N" }];

const tabsByType: Record<NodeType, Array<{ code: TabCode; label: string; editable?: boolean }>> = {
  BLOCK: [
    { code: "PROFILE", label: "Profile" },
    { code: "OWNERSHIP", label: "Ownership", editable: true },
    { code: "DOCUMENTS", label: "Documents", editable: true },
    { code: "FLOORS", label: "Floors" },
    { code: "FACILITIES", label: "Facilities", editable: true },
    { code: "ACTIVITY", label: "Activity", editable: true },
  ],
  FLOOR: [
    { code: "PROFILE", label: "Profile" },
    { code: "DOCUMENTS", label: "Documents", editable: true },
    { code: "UNITS", label: "Units" },
    { code: "ACTIVITY", label: "Activity", editable: true },
  ],
  UNIT: [
    { code: "PROFILE", label: "Profile" },
    { code: "OWNERSHIP", label: "Ownership", editable: true },
    { code: "DOCUMENTS", label: "Documents", editable: true },
    { code: "LEASE", label: "Lease", editable: true },
    { code: "CHARGES", label: "Charges", editable: true },
    { code: "ACTIVITY", label: "Activity", editable: true },
  ],
};

const columnsByTab: Record<TabCode, ColumnDef[]> = {
  PROFILE: [],
  FLOORS: [],
  UNITS: [],
  OWNERSHIP: [
    { key: "party", label: "Party", required: true },
    { key: "role", label: "Role", required: true },
    { key: "shareRight", label: "Share / Right" },
    { key: "reference", label: "Reference" },
    { key: "status", label: "Status" },
  ],
  DOCUMENTS: [
    { key: "document", label: "Document", required: true },
    { key: "category", label: "Category", required: true },
    { key: "reference", label: "Reference", required: true },
    { key: "updated", label: "Updated", inputType: "date" },
    { key: "status", label: "Status" },
  ],
  LEASE: [
    { key: "lease", label: "Lease", required: true },
    { key: "tenant", label: "Tenant", required: true },
    { key: "start", label: "Start", inputType: "date" },
    { key: "end", label: "End", inputType: "date" },
    { key: "status", label: "Status" },
  ],
  CHARGES: [
    { key: "charge", label: "Charge", required: true },
    { key: "frequency", label: "Frequency" },
    { key: "amount", label: "Amount" },
    { key: "status", label: "Status" },
  ],
  FACILITIES: [
    { key: "facility", label: "Facility", required: true },
    { key: "category", label: "Category" },
    { key: "reference", label: "Reference" },
    { key: "status", label: "Status" },
  ],
  ACTIVITY: [
    { key: "title", label: "Activity", required: true },
    { key: "detail", label: "Details" },
    { key: "context", label: "Context" },
    { key: "eventDate", label: "Date", inputType: "date" },
    { key: "status", label: "Status" },
  ],
};

export function PropertyViewWorkspace() {
  const [properties, setProperties] = useState<PropertyMaster[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [structure, setStructure] = useState<StructureState>(emptyStructure);
  const [summary, setSummary] = useState<PropertySummary>(emptySummary);
  const [selectedKey, setSelectedKey] = useState("");
  const [activeTab, setActiveTab] = useState<TabCode>("PROFILE");
  const [tabRows, setTabRows] = useState<TabDraftRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [dialog, setDialog] = useState<{ mode: DialogMode; type: NodeType; record?: MasterRecord } | null>(null);
  const [form, setForm] = useState<StructureForm>(() => newForm("BLOCK"));
  const [unitTypeOptions, setUnitTypeOptions] = useState<Option[]>(fallbackUnitTypeOptions);
  const [treeDepth, setTreeDepth] = useState<TreeDepth>(3);

  const selectedProperty = useMemo(() => properties.find((property) => property.id === selectedId) ?? properties[0] ?? null, [properties, selectedId]);
  const nodes = useMemo(() => flattenStructure(structure), [structure]);
  const visibleNodes = useMemo(() => nodes.filter((node) => nodeDepth(node) <= treeDepth), [nodes, treeDepth]);
  const selectedNode = useMemo(() => visibleNodes.find((node) => nodeKey(node) === selectedKey) ?? visibleNodes[0] ?? null, [selectedKey, visibleNodes]);
  const effectiveSelectedKey = selectedNode ? nodeKey(selectedNode) : selectedKey;
  const currentTabs = selectedNode ? tabsByType[selectedNode.type] : [];
  const currentTab = currentTabs.find((tab) => tab.code === activeTab) ?? currentTabs[0];
  const occupancyRate = summary.unitCount ? Math.round((summary.occupiedUnits / summary.unitCount) * 100) : 0;

  const refreshProperties = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const loaded = await listProperties({ pageSize: 100 });
      const requestedId = selectedPropertyIdFromLocation();
      setProperties(loaded);
      setSelectedId((current) => requestedId && loaded.some((property) => property.id === requestedId) ? requestedId : current && loaded.some((property) => property.id === current) ? current : loaded[0]?.id ?? null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load properties.");
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshStructure = useCallback(async (propertyId: number) => {
    setError("");
    try {
      const [loadedBlocks, loadedSummary] = await Promise.all([listBlocks(propertyId), getPropertySummary(propertyId)]);
      const floorsByBlock: Record<number, MasterRecord[]> = {};
      const unitsByFloor: Record<number, MasterRecord[]> = {};
      await Promise.all(loadedBlocks.map(async (block) => {
        if (!block.id) return;
        const floors = await listFloors(block.id);
        floorsByBlock[block.id] = floors;
        await Promise.all(floors.map(async (floor) => {
          if (floor.id) unitsByFloor[floor.id] = await listUnits(floor.id);
        }));
      }));
      const nextStructure = { blocks: loadedBlocks, floorsByBlock, unitsByFloor };
      setStructure(nextStructure);
      setSummary(loadedSummary);
      setSelectedKey((current) => {
        const nextNodes = flattenStructure(nextStructure);
        return current && nextNodes.some((node) => nodeKey(node) === current) ? current : nextNodes[0] ? nodeKey(nextNodes[0]) : "";
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load property view.");
      setStructure(emptyStructure);
      setSummary(emptySummary);
    }
  }, []);

  const refreshTabRows = useCallback(async (propertyId: number, node: StructureNode, tabCode: TabCode) => {
    if (!tabsByType[node.type].some((tab) => tab.code === tabCode && tab.editable)) {
      setTabRows([]);
      return;
    }
    const loaded = await listPropertyViewTabRows(propertyId, node.type, requireId(node.record.id), tabCode);
    setTabRows(loaded.map(toDraftRow));
  }, []);

  const refreshUnitTypes = useCallback(async () => {
    try {
      const loaded = await listCodeValues("pa_unit_type");
      const options = loaded
        .filter((codeValue) => codeValue.value?.trim())
        .sort((left, right) => (left.sort ?? Number.MAX_SAFE_INTEGER) - (right.sort ?? Number.MAX_SAFE_INTEGER) || left.value.localeCompare(right.value))
        .map((codeValue) => ({ label: codeValue.value, value: codeValue.value }));
      if (options.length > 0) setUnitTypeOptions(options);
    } catch {
      setUnitTypeOptions(fallbackUnitTypeOptions);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void refreshProperties(), 0);
    return () => window.clearTimeout(timer);
  }, [refreshProperties]);

  useEffect(() => {
    const timer = window.setTimeout(() => void refreshUnitTypes(), 0);
    return () => window.clearTimeout(timer);
  }, [refreshUnitTypes]);

  useEffect(() => {
    if (!selectedId) return;
    const timer = window.setTimeout(() => void refreshStructure(selectedId), 0);
    return () => window.clearTimeout(timer);
  }, [refreshStructure, selectedId]);

  useEffect(() => {
    if (!selectedProperty?.id || !selectedNode || !currentTab) return;
    const timer = window.setTimeout(() => {
      void refreshTabRows(selectedProperty.id!, selectedNode, currentTab.code).catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Unable to load tab data.");
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [currentTab, refreshTabRows, selectedNode, selectedProperty?.id]);

  function applyTreeDepth(depth: TreeDepth) {
    setTreeDepth(depth);
  }

  function openCreate(type: NodeType) {
    setCreateOpen(false);
    setDialog({ mode: "create", type });
    const nextForm = newForm(type, selectedNode, structure);
    setForm(type === "UNIT" ? { ...nextForm, name: unitTypeOptions[0]?.label ?? nextForm.name, type: unitTypeOptions[0]?.value ?? nextForm.type } : nextForm);
  }

  function openEdit(node: StructureNode) {
    setDialog({ mode: "edit", type: node.type, record: node.record });
    setForm(formFromNode(node));
  }

  async function submitStructure(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProperty?.id || !dialog) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const payload = formToRecord(dialog.type, form, dialog.record);
      if (dialog.type === "BLOCK") {
        if (dialog.mode === "edit" && dialog.record?.id) await updateBlock(dialog.record.id, payload);
        else await saveBlock(selectedProperty.id, payload);
      }
      if (dialog.type === "FLOOR") {
        const blockId = Number(form.parentId);
        if (!blockId) throw new Error("Select a block before saving the floor.");
        if (dialog.mode === "edit" && dialog.record?.id) await updateFloor(dialog.record.id, payload);
        else await saveFloor(blockId, payload);
      }
      if (dialog.type === "UNIT") {
        const floorId = Number(form.parentId);
        if (!floorId) throw new Error("Select a floor before saving the unit.");
        if (dialog.mode === "edit" && dialog.record?.id) await updateUnit(dialog.record.id, payload);
        else await saveUnit(floorId, payload);
      }
      setDialog(null);
      setMessage(`${titleFor(dialog.type)} saved.`);
      await refreshStructure(selectedProperty.id);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save record.");
    } finally {
      setSaving(false);
    }
  }

  async function saveActiveTab() {
    if (!selectedProperty?.id || !selectedNode || !currentTab?.editable) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      validateRows(currentTab.code, tabRows);
      const saved = await savePropertyViewTabRows(selectedProperty.id, selectedNode.type, requireId(selectedNode.record.id), currentTab.code, tabRows.map(fromDraftRow));
      setTabRows(saved.map(toDraftRow));
      setMessage(`${currentTab.label} saved.`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save tab data.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="page-surface min-h-screen px-3 py-5 sm:px-5 lg:px-8">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-[color:var(--foreground-muted)]">Property Management / Property View</p>
          <h1 className="display-font text-3xl font-semibold text-[color:var(--brand-strong)]">Property View</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary rounded-lg px-4 py-2 text-sm font-semibold" type="button">Filter</button>
          <div className="relative">
            <button className="btn-primary inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold" disabled={!selectedProperty} onClick={() => setCreateOpen((open) => !open)} type="button">
              <Plus className="h-4 w-4" /> Create <ChevronDown className="h-4 w-4" />
            </button>
            {createOpen ? (
              <div className="absolute right-0 z-20 mt-2 w-44 rounded-lg border border-[color:var(--line)] bg-[color:var(--surface-raised)] p-1 shadow-xl">
                <MenuButton label="Add Block" onClick={() => openCreate("BLOCK")} />
                <MenuButton label="Add Floor" onClick={() => openCreate("FLOOR")} disabled={structure.blocks.length === 0} />
                <MenuButton label="Add Unit" onClick={() => openCreate("UNIT")} disabled={!hasFloors(structure)} />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {message ? <Notice tone="success" label={message} /> : null}
      {error ? <Notice tone="danger" label={error} /> : null}

      <div className="grid gap-4 xl:grid-cols-[260px_1fr]">
        <aside className="panel h-fit overflow-hidden rounded-lg">
          <div className="border-b border-[color:var(--line)] p-4">
            <Select ariaLabel="Property" value={String(selectedProperty?.id ?? "")} onChange={(value) => { setSelectedId(Number(value) || null); setSelectedKey(""); }} options={properties.map((property) => ({ label: property.name, value: String(property.id ?? "") }))} />
            <div className="mt-4 grid grid-cols-2 gap-2">
              <TreeActionSelect label="Expand..." onChange={applyTreeDepth} options={[{ label: "Expand all", value: 3 }, { label: "Expand block level", value: 1 }, { label: "Expand floor level", value: 2 }]} />
              <TreeActionSelect label="Collapse..." onChange={applyTreeDepth} options={[{ label: "Collapse all", value: 1 }, { label: "Collapse unit level", value: 2 }, { label: "Collapse floor level", value: 1 }]} />
            </div>
          </div>
          <div className="max-h-[680px] overflow-auto p-4">
            {loading ? <div className="flex items-center gap-2 rounded-lg bg-[color:var(--surface-muted)] p-3 text-sm font-semibold"><Loader2 className="h-4 w-4 animate-spin" /> Loading</div> : null}
            {!loading && structure.blocks.length === 0 ? <div className="rounded-lg bg-[color:var(--surface-muted)] p-3 text-sm text-[color:var(--foreground-muted)]">No block, floor or unit records found.</div> : null}
            <TreeMenu depth={treeDepth} structure={structure} selectedKey={effectiveSelectedKey} onSelect={setSelectedKey} />
          </div>
        </aside>

        <section className="panel overflow-hidden rounded-lg">
          {selectedNode && selectedProperty ? (
            <NodeDetails
              activeTab={currentTab?.code ?? "PROFILE"}
              node={selectedNode}
              occupancyRate={occupancyRate}
              onAddTabRow={() => setTabRows((rows) => [...rows, newTabRow(currentTab?.code ?? "ACTIVITY", rows.length)])}
              onCreateStructure={openCreate}
              onEdit={() => openEdit(selectedNode)}
              onEditStructure={openEdit}
              onRemoveDraftRow={(draftKey) => setTabRows((rows) => rows.filter((row) => row.draftKey !== draftKey))}
              onSaveTab={saveActiveTab}
              onTabChange={setActiveTab}
              onUpdateTabRow={(draftKey, key, value) => setTabRows((rows) => rows.map((row) => row.draftKey === draftKey ? { ...row, data: { ...row.data, [key]: value } } : row))}
              property={selectedProperty}
              saving={saving}
              structure={structure}
              summary={summary}
              tabRows={tabRows}
              tabs={currentTabs}
              unitTypeOptions={unitTypeOptions}
            />
          ) : (
            <div className="p-6 text-sm text-[color:var(--foreground-muted)]">Select a property, then create a block, floor or unit.</div>
          )}
        </section>
      </div>

      {dialog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[color:var(--overlay)] p-4">
          <form className="w-full max-w-3xl rounded-lg bg-[color:var(--surface-strong)] shadow-2xl" onSubmit={submitStructure}>
            <div className="flex items-start justify-between border-b border-[color:var(--line)] p-4">
              <div>
                <p className="text-xs font-bold text-[color:var(--foreground-muted)]">Property Structure</p>
                <h2 className="text-xl font-bold text-[color:var(--brand-strong)]">{dialog.mode === "edit" ? "Edit" : "Add"} {titleFor(dialog.type)}</h2>
              </div>
              <button className="btn-secondary inline-flex h-10 w-10 items-center justify-center rounded-lg" onClick={() => setDialog(null)} type="button"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid gap-4 p-4 lg:grid-cols-2">
              <StructureFields type={dialog.type} form={form} structure={structure} unitTypeOptions={unitTypeOptions} onChange={(next) => setForm((current) => ({ ...current, ...next }))} />
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-[color:var(--line)] p-4">
              <button className="btn-secondary rounded-lg px-4 py-2 text-sm font-semibold" onClick={() => setDialog(null)} type="button">Cancel</button>
              <button className="btn-primary inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold" disabled={saving} type="submit">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </main>
  );
}

function NodeDetails({
  activeTab,
  node,
  occupancyRate,
  onAddTabRow,
  onCreateStructure,
  onEdit,
  onEditStructure,
  onRemoveDraftRow,
  onSaveTab,
  onTabChange,
  onUpdateTabRow,
  property,
  saving,
  structure,
  summary,
  tabRows,
  tabs,
  unitTypeOptions,
}: {
  activeTab: TabCode;
  node: StructureNode;
  occupancyRate: number;
  onAddTabRow: () => void;
  onCreateStructure: (type: NodeType) => void;
  onEdit: () => void;
  onEditStructure: (node: StructureNode) => void;
  onRemoveDraftRow: (draftKey: string) => void;
  onSaveTab: () => void;
  onTabChange: (tab: TabCode) => void;
  onUpdateTabRow: (draftKey: string, key: string, value: string) => void;
  property: PropertyMaster;
  saving: boolean;
  structure: StructureState;
  summary: PropertySummary;
  tabRows: TabDraftRow[];
  tabs: Array<{ code: TabCode; label: string; editable?: boolean }>;
  unitTypeOptions: Option[];
}) {
  const attrs = parseAttributes(node.record.attributes);
  const currentTab = tabs.find((tab) => tab.code === activeTab) ?? tabs[0];
  const title = pathFor(node, property);
  const blockFloors = node.type === "BLOCK" ? structure.floorsByBlock[node.record.id ?? 0] ?? [] : [];
  const blockUnits = node.type === "BLOCK" ? blockFloors.flatMap((floor) => structure.unitsByFloor[floor.id ?? 0] ?? []) : [];
  const blockCounts = unitCounts(blockUnits);
  const blockTotalUnits = blockUnits.length || numericText(attrs.units);
  const floorUnits = node.type === "FLOOR" ? structure.unitsByFloor[node.record.id ?? 0] ?? [] : [];
  const floorCounts = unitCounts(floorUnits);
  const floorTotalUnits = floorUnits.length || numericText(attrs.units);
  const floorOccupancyRate = floorTotalUnits ? Math.round((floorCounts.occupied / floorTotalUnits) * 100) : 0;

  return (
    <div>
      <div className="flex items-start justify-between gap-4 border-b border-[color:var(--line)] px-4 py-3">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold text-[color:var(--brand-strong)]">{title}</h2>
          <p className="mt-1 text-sm font-semibold text-[color:var(--foreground-muted)]">{subtitleFor(node, attrs)}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="pill-success rounded-full px-3 py-1 text-xs font-bold">{node.type === "UNIT" ? labelize(node.record.status) : activeStatusLabel(node.record.activeStatus)}</span>
          <button className="btn-secondary inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-semibold" onClick={onEdit} type="button"><Edit3 className="h-4 w-4" /> Edit</button>
        </div>
      </div>

      {node.type === "BLOCK" ? (
        <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-6">
          <Metric label="Floors" value={String(blockFloors.length || numericText(attrs.floors))} />
          <Metric label="Total Units" value={String(blockTotalUnits)} />
          <Metric hint="Residence" label="Residence Units" value={String(numericText(attrs.residenceUnits) || blockCounts.residential)} />
          <Metric hint="Retail" label="Retail Units" value={String(numericText(attrs.retailUnits) || blockCounts.retail)} />
          <Metric label="Occupancy %" value={`${blockTotalUnits ? Math.round((blockCounts.occupied / blockTotalUnits) * 100) : occupancyRate}%`} />
          <Metric label="Reserved" value={String(blockCounts.reserved || summary.reservedUnits)} />
        </div>
      ) : null}

      {node.type === "FLOOR" ? (
        <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-6">
          <Metric label="Total Units" value={String(floorTotalUnits)} />
          <Metric hint="Residence" label="Residence Units" value={String(numericText(attrs.residenceUnits) || floorCounts.residential)} />
          <Metric hint="Retail" label="Retail Units" value={String(numericText(attrs.retailUnits) || floorCounts.retail)} />
          <Metric hint={`${floorCounts.occupied} occupied`} label="Occupancy %" value={`${floorOccupancyRate}%`} />
          <Metric hint="Ready to lease" label="Vacant" tone="warning" value={String(floorCounts.vacant || attrs.vacantUnits || 0)} />
          <Metric hint="Pending contract" label="Reserved" tone="warning" value={String(floorCounts.reserved || attrs.reservedUnits || 0)} />
        </div>
      ) : null}

      <div className="mx-4 mt-3 flex gap-1 overflow-x-auto rounded-lg bg-[color:var(--surface-muted)] p-1">
        {tabs.map((tab) => (
          <button className={`h-9 shrink-0 rounded-md px-3 text-sm font-bold ${activeTab === tab.code ? "bg-[color:var(--surface-raised)] text-[color:var(--brand)] shadow-sm" : "text-[color:var(--foreground-muted)]"}`} key={tab.code} onClick={() => onTabChange(tab.code)} type="button">
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-4">
        {activeTab === "PROFILE" ? <ProfilePanel node={node} unitTypeOptions={unitTypeOptions} /> : null}
        {activeTab === "FLOORS" ? <ChildTable onAdd={() => onCreateStructure("FLOOR")} onEdit={(floor) => onEditStructure({ type: "FLOOR", record: floor, block: node.record, floor })} rows={structure.floorsByBlock[node.record.id ?? 0] ?? []} type="Floor" /> : null}
        {activeTab === "UNITS" ? <UnitTable onAdd={() => onCreateStructure("UNIT")} onEdit={(unit) => onEditStructure({ type: "UNIT", record: unit, block: node.block, floor: node.record })} rows={structure.unitsByFloor[node.record.id ?? 0] ?? []} unitTypeOptions={unitTypeOptions} /> : null}
        {currentTab?.editable && activeTab === "ACTIVITY" ? (
          <ActivityTimeline
            node={node}
            onAdd={onAddTabRow}
            onRemoveDraftRow={onRemoveDraftRow}
            onSave={onSaveTab}
            onUpdate={onUpdateTabRow}
            rows={tabRows}
            saving={saving}
          />
        ) : null}
        {currentTab?.editable && activeTab !== "ACTIVITY" ? (
          <EditableTabTable
            columns={columnsByTab[activeTab]}
            onAdd={onAddTabRow}
            onRemoveDraftRow={onRemoveDraftRow}
            onSave={onSaveTab}
            onUpdate={onUpdateTabRow}
            rows={tabRows}
            saving={saving}
            tabLabel={currentTab.label}
          />
        ) : null}
      </div>
    </div>
  );
}

function EditableTabTable({ columns, onAdd, onRemoveDraftRow, onSave, onUpdate, rows, saving, tabLabel }: { columns: ColumnDef[]; onAdd: () => void; onRemoveDraftRow: (draftKey: string) => void; onSave: () => void; onUpdate: (draftKey: string, key: string, value: string) => void; rows: TabDraftRow[]; saving: boolean; tabLabel: string }) {
  return (
    <section className="overflow-hidden rounded-lg border border-[color:var(--line)]">
      <div className="flex items-center justify-between border-b border-[color:var(--line)] px-4 py-3">
        <h3 className="text-sm font-bold text-[color:var(--brand-strong)]">{tabLabel}</h3>
        <button className="btn-secondary inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-semibold" onClick={onAdd} type="button"><Plus className="h-4 w-4" /> Add</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-[color:var(--surface-muted)] text-xs uppercase text-[color:var(--foreground-muted)]">
            <tr>
              {columns.map((column) => <th className="px-4 py-3 font-bold" key={column.key}>{column.label}</th>)}
              <th className="w-16 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? <tr><td className="px-4 py-5 text-[color:var(--foreground-muted)]" colSpan={columns.length + 1}>No rows saved.</td></tr> : null}
            {rows.map((row) => (
              <tr key={row.draftKey}>
                {columns.map((column) => (
                  <td className="border-t border-[color:var(--line)] px-3 py-2" key={column.key}>
                    <input className="field h-9 w-full rounded-md px-2 text-sm" placeholder={column.required ? "Required" : ""} type={column.inputType ?? "text"} value={column.inputType === "date" ? dateInputValue(row.data[column.key]) : row.data[column.key] ?? ""} onChange={(event) => onUpdate(row.draftKey, column.key, event.target.value)} />
                  </td>
                ))}
                <td className="border-t border-[color:var(--line)] px-3 py-2 text-right">
                  {!row.id ? <button className="btn-secondary inline-flex h-8 w-8 items-center justify-center rounded-md" onClick={() => onRemoveDraftRow(row.draftKey)} title="Remove draft row" type="button"><Trash2 className="h-4 w-4" /></button> : <span className="text-xs font-semibold text-[color:var(--foreground-muted)]">Saved</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end border-t border-[color:var(--line)] bg-[color:var(--surface-muted)] px-4 py-3">
        <button className="btn-primary inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold" disabled={saving} onClick={onSave} type="button">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
        </button>
      </div>
    </section>
  );
}

function ProfilePanel({ node, unitTypeOptions }: { node: StructureNode; unitTypeOptions: Option[] }) {
  const attrs = parseAttributes(node.record.attributes);
  const rows = node.type === "BLOCK"
    ? [["Block", node.record.name], ["Code", node.record.code], ["Type", attrs.type], ["Floors", attrs.floors], ["Total Units", attrs.units], ["Residence Units", attrs.residenceUnits], ["Retail Units", attrs.retailUnits], ["Parking Bays", attrs.parkingBays], ["Status", activeStatusLabel(node.record.activeStatus)]]
    : node.type === "FLOOR"
      ? [["Floor", node.record.name], ["Code", node.record.code], ["Block", node.block?.name], ["Type", attrs.type], ["Total Units", attrs.units], ["Residence Units", attrs.residenceUnits], ["Retail Units", attrs.retailUnits], ["Vacant", attrs.vacantUnits], ["Reserved", attrs.reservedUnits], ["Status", activeStatusLabel(node.record.activeStatus)]]
      : [["Unit", node.record.code], ["Unit Type", optionLabel(unitTypeOptions, attrs.unitType || node.record.name)], ["Block", node.block?.name], ["Floor", node.floor?.name], ["Area", attrs.area], ["Bedrooms", attrs.bedrooms], ["Base Rent", formatCurrencyValue(attrs.baseRent)], ["Service Charge", formatCurrencyValue(attrs.serviceCharge)], ["Status", labelize(node.record.status)]];
  return <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{rows.map(([label, value]) => <ReadOnlyField key={label} label={label ?? ""} value={value || "Not captured"} />)}</div>;
}

function ChildTable({ onAdd, onEdit, rows, type }: { onAdd: () => void; onEdit: (row: MasterRecord) => void; rows: MasterRecord[]; type: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-[color:var(--line)]">
      <div className="flex items-center justify-between border-b border-[color:var(--line)] px-4 py-3">
        <h3 className="text-sm font-bold text-[color:var(--brand-strong)]">{type}s</h3>
        <button className="btn-secondary inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-semibold" onClick={onAdd} type="button"><Plus className="h-4 w-4" /> Add {type}</button>
      </div>
      <table className="w-full min-w-[680px] text-left text-sm">
        <thead className="bg-[color:var(--surface-muted)] text-xs uppercase text-[color:var(--foreground-muted)]"><tr><th className="px-4 py-3">{type}</th><th className="px-4 py-3">Code</th><th className="px-4 py-3">Description</th><th className="px-4 py-3">Status</th><th className="w-20 px-4 py-3"></th></tr></thead>
        <tbody>
          {rows.length === 0 ? <tr><td className="px-4 py-5 text-[color:var(--foreground-muted)]" colSpan={5}>No {type.toLowerCase()} rows saved.</td></tr> : null}
          {rows.map((row) => <tr key={row.id}><td className="border-t border-[color:var(--line)] px-4 py-3 font-semibold">{row.name}</td><td className="border-t border-[color:var(--line)] px-4 py-3">{row.code}</td><td className="border-t border-[color:var(--line)] px-4 py-3">{row.description || "Not captured"}</td><td className="border-t border-[color:var(--line)] px-4 py-3">{activeStatusLabel(row.activeStatus)}</td><td className="border-t border-[color:var(--line)] px-4 py-3 text-right"><button className="btn-secondary inline-flex h-8 w-8 items-center justify-center rounded-md" onClick={() => onEdit(row)} title={`Edit ${type}`} type="button"><Edit3 className="h-4 w-4" /></button></td></tr>)}
        </tbody>
      </table>
    </div>
  );
}

function UnitTable({ onAdd, onEdit, rows, unitTypeOptions }: { onAdd: () => void; onEdit: (row: MasterRecord) => void; rows: MasterRecord[]; unitTypeOptions: Option[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-[color:var(--line)]">
      <div className="flex items-center justify-between border-b border-[color:var(--line)] px-4 py-3">
        <h3 className="text-sm font-bold text-[color:var(--brand-strong)]">Units</h3>
        <button className="btn-secondary inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-semibold" onClick={onAdd} type="button"><Plus className="h-4 w-4" /> Add Unit</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-[color:var(--surface-muted)] text-xs uppercase text-[color:var(--foreground-muted)]">
            <tr>
              <th className="px-4 py-3">Unit</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Area</th>
              <th className="px-4 py-3">Rent</th>
              <th className="px-4 py-3">Occupancy</th>
              <th className="px-4 py-3">Status</th>
              <th className="w-20 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? <tr><td className="px-4 py-5 text-[color:var(--foreground-muted)]" colSpan={7}>No unit rows saved.</td></tr> : null}
            {rows.map((row) => {
              const attrs = parseAttributes(row.attributes);
              const occupancy = labelize(row.status || "VACANT");
              return (
                <tr key={row.id}>
                  <td className="border-t border-[color:var(--line)] px-4 py-3 font-semibold">{row.code || row.name}</td>
                  <td className="border-t border-[color:var(--line)] px-4 py-3">{optionLabel(unitTypeOptions, attrs.unitType || row.name) || "Not captured"}</td>
                  <td className="border-t border-[color:var(--line)] px-4 py-3">{formatArea(attrs.area)}</td>
                  <td className="border-t border-[color:var(--line)] px-4 py-3">{formatRentShort(attrs.baseRent)}</td>
                  <td className="border-t border-[color:var(--line)] px-4 py-3">{occupancy}</td>
                  <td className="border-t border-[color:var(--line)] px-4 py-3"><span className={`${statusTone(row.activeStatus)} rounded-full px-3 py-1 text-xs font-bold`}>{activeStatusLabel(row.activeStatus)}</span></td>
                  <td className="border-t border-[color:var(--line)] px-4 py-3 text-right"><button className="btn-secondary inline-flex h-8 w-8 items-center justify-center rounded-md" onClick={() => onEdit(row)} title="Edit Unit" type="button"><Edit3 className="h-4 w-4" /></button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ActivityTimeline({ node, onAdd, onRemoveDraftRow, onSave, onUpdate, rows, saving }: { node: StructureNode; onAdd: () => void; onRemoveDraftRow: (draftKey: string) => void; onSave: () => void; onUpdate: (draftKey: string, key: string, value: string) => void; rows: TabDraftRow[]; saving: boolean }) {
  return (
    <section className="overflow-hidden rounded-lg border border-[color:var(--line)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--line)] px-4 py-3">
        <h3 className="text-sm font-bold text-[color:var(--brand-strong)]">{node.record.code || node.record.name} Activity</h3>
        <div className="flex gap-2">
          <button className="btn-secondary h-9 rounded-lg px-3 text-sm font-semibold" type="button">View All</button>
          <button className="btn-secondary inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-semibold" onClick={onAdd} type="button"><Plus className="h-4 w-4" /> Add</button>
        </div>
      </div>
      <div className="p-4">
        {rows.length === 0 ? <div className="rounded-lg bg-[color:var(--surface-muted)] p-4 text-sm text-[color:var(--foreground-muted)]">No activity rows saved.</div> : null}
        <div className="relative space-y-4 pl-5 before:absolute before:left-[7px] before:top-2 before:h-[calc(100%-16px)] before:w-px before:bg-[color:var(--brand-border)]">
          {rows.map((row) => (
            <div className="relative rounded-lg border border-[color:var(--line)] bg-[color:var(--surface-raised)] p-3" key={row.draftKey}>
              <span className="absolute -left-[21px] top-4 h-2.5 w-2.5 rounded-full bg-[color:var(--brand)]" />
              <div className="grid gap-3 lg:grid-cols-[1.5fr_1.5fr_1fr_140px_72px]">
                <input className="field h-9 rounded-md px-2 text-sm font-semibold" placeholder="Activity title" value={row.data.title ?? ""} onChange={(event) => onUpdate(row.draftKey, "title", event.target.value)} />
                <input className="field h-9 rounded-md px-2 text-sm" placeholder="Details" value={row.data.detail ?? ""} onChange={(event) => onUpdate(row.draftKey, "detail", event.target.value)} />
                <input className="field h-9 rounded-md px-2 text-sm" placeholder="Context" value={row.data.context ?? ""} onChange={(event) => onUpdate(row.draftKey, "context", event.target.value)} />
                <input className="field h-9 rounded-md px-2 text-sm" type="date" value={dateInputValue(row.data.eventDate)} onChange={(event) => onUpdate(row.draftKey, "eventDate", event.target.value)} />
                {!row.id ? <button className="btn-secondary inline-flex h-9 items-center justify-center rounded-md" onClick={() => onRemoveDraftRow(row.draftKey)} title="Remove draft row" type="button"><Trash2 className="h-4 w-4" /></button> : <span className="flex h-9 items-center justify-center text-xs font-semibold text-[color:var(--foreground-muted)]">Saved</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-end border-t border-[color:var(--line)] bg-[color:var(--surface-muted)] px-4 py-3">
        <button className="btn-primary inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold" disabled={saving} onClick={onSave} type="button">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
        </button>
      </div>
    </section>
  );
}

function TreeActionSelect({ label, onChange, options }: { label: string; onChange: (depth: TreeDepth) => void; options: Array<{ label: string; value: TreeDepth }> }) {
  return (
    <label className="relative block">
      <select
        aria-label={label}
        className="field h-9 w-full rounded-lg px-3 text-xs font-semibold outline-none"
        defaultValue=""
        onChange={(event) => {
          const value = Number(event.target.value) as TreeDepth;
          if (value) onChange(value);
          event.currentTarget.value = "";
        }}
      >
        <option value="">{label}</option>
        {options.map((option) => <option key={`${label}-${option.label}`} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

function TreeMenu({ depth, structure, selectedKey, onSelect }: { depth: TreeDepth; structure: StructureState; selectedKey: string; onSelect: (key: string) => void }) {
  return <div className="space-y-1">{structure.blocks.map((block) => <TreeBranch block={block} depth={depth} key={`BLOCK-${block.id}`} onSelect={onSelect} selectedKey={selectedKey} structure={structure} />)}</div>;
}

function TreeBranch({ block, depth, onSelect, selectedKey, structure }: { block: MasterRecord; depth: TreeDepth; onSelect: (key: string) => void; selectedKey: string; structure: StructureState }) {
  const blockKey = `BLOCK-${block.id}`;
  return (
    <div>
      <TreeButton depth={0} label={block.name} selected={selectedKey === blockKey} onClick={() => onSelect(blockKey)} />
      {depth >= 2 ? (structure.floorsByBlock[block.id ?? 0] ?? []).map((floor) => {
        const floorKey = `FLOOR-${floor.id}`;
        return (
          <div key={floorKey}>
            <TreeButton depth={1} label={floor.name} selected={selectedKey === floorKey} onClick={() => onSelect(floorKey)} />
            {depth >= 3 ? (structure.unitsByFloor[floor.id ?? 0] ?? []).map((unit) => {
              const unitKey = `UNIT-${unit.id}`;
              return <TreeButton depth={2} key={unitKey} label={unit.code || unit.name} selected={selectedKey === unitKey} onClick={() => onSelect(unitKey)} />;
            }) : null}
          </div>
        );
      }) : null}
    </div>
  );
}

function TreeButton({ depth, label, selected, onClick }: { depth: number; label?: string; selected: boolean; onClick: () => void }) {
  return (
    <button className="mb-1 flex h-10 w-full items-center gap-2 rounded-lg border px-3 text-left text-sm font-bold transition" onClick={onClick} style={{ background: selected ? "var(--brand-tint)" : "var(--surface-muted)", borderColor: selected ? "var(--brand-border)" : "var(--line)", paddingLeft: `${12 + depth * 16}px` }} type="button">
      <span className="h-3 w-3 border-b border-l border-[color:var(--brand-border)]" />
      <span className="truncate">{label || "Unnamed"}</span>
    </button>
  );
}

function StructureFields({ type, form, structure, unitTypeOptions, onChange }: { type: NodeType; form: StructureForm; structure: StructureState; unitTypeOptions: Option[]; onChange: (value: Partial<StructureForm>) => void }) {
  if (type === "BLOCK") return <><Field label="Block" required value={form.name} onChange={(name) => onChange({ name, code: form.code || codeFromName(name, "BLK") })} /><SelectField label="Type" value={form.type} onChange={(value) => onChange({ type: value })} options={typeOptions} /><NumberField label="Floors" value={form.floors} onChange={(floors) => onChange({ floors })} /><NumberField label="Units" value={form.units} onChange={(units) => onChange({ units })} /><NumberField label="Residence Units" value={form.residenceUnits} onChange={(residenceUnits) => onChange({ residenceUnits })} /><NumberField label="Retail Units" value={form.retailUnits} onChange={(retailUnits) => onChange({ retailUnits })} /><NumberField label="Parking Bays" value={form.parkingBays} onChange={(parkingBays) => onChange({ parkingBays })} /><SelectField label="Status" value={form.status} onChange={(status) => onChange({ status })} options={activeStatusOptions} /></>;
  if (type === "FLOOR") return <><SelectField label="Block" value={form.parentId} onChange={(parentId) => onChange({ parentId })} options={structure.blocks.map((block) => ({ label: block.name, value: String(block.id ?? "") }))} /><Field label="Floor" required value={form.name} onChange={(name) => onChange({ name, code: form.code || `FLR-${name}` })} /><SelectField label="Type" value={form.type} onChange={(value) => onChange({ type: value })} options={typeOptions} /><NumberField label="Unit Count" value={form.units} onChange={(units) => onChange({ units })} /><NumberField label="Residence Units" value={form.residenceUnits} onChange={(residenceUnits) => onChange({ residenceUnits })} /><NumberField label="Retail Units" value={form.retailUnits} onChange={(retailUnits) => onChange({ retailUnits })} /><NumberField label="Vacant Units" value={form.vacantUnits} onChange={(vacantUnits) => onChange({ vacantUnits })} /><NumberField label="Reserved Units" value={form.reservedUnits} onChange={(reservedUnits) => onChange({ reservedUnits })} /><SelectField label="Status" value={form.status} onChange={(status) => onChange({ status })} options={activeStatusOptions} /></>;
  return <><SelectField label="Floor" value={form.parentId} onChange={(parentId) => onChange({ parentId })} options={floorOptions(structure)} /><Field label="Unit Number" required value={form.code} onChange={(code) => onChange({ code })} /><SelectField label="Unit Type" value={form.type} onChange={(value) => onChange({ type: value, name: optionLabel(unitTypeOptions, value) || value })} options={unitTypeOptions} /><Field label="Area" value={form.area} onChange={(area) => onChange({ area })} /><NumberField label="Bedrooms" value={form.bedrooms} onChange={(bedrooms) => onChange({ bedrooms })} /><NumberField label="Base Rent" value={form.baseRent} onChange={(baseRent) => onChange({ baseRent })} /><NumberField label="Service Charge" value={form.serviceCharge} onChange={(serviceCharge) => onChange({ serviceCharge })} /><SelectField label="Status" value={form.status} onChange={(status) => onChange({ status })} options={unitStatusOptions} /></>;
}

function Field({ label, value, onChange, required = false }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return <label className="block min-w-0"><span className="mb-1.5 block text-xs font-bold text-[color:var(--foreground-muted)]">{label}{required ? " *" : ""}</span><input className="field h-10 w-full rounded-lg px-3 text-sm outline-none" required={required} value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

function NumberField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block min-w-0"><span className="mb-1.5 block text-xs font-bold text-[color:var(--foreground-muted)]">{label}</span><input className="field h-10 w-full rounded-lg px-3 text-sm outline-none" min="0" type="number" value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<string | { label: string; value: string }> }) {
  return <label className="block min-w-0"><span className="mb-1.5 block text-xs font-bold text-[color:var(--foreground-muted)]">{label}</span><Select ariaLabel={label} value={value} onChange={onChange} options={options.map((option) => typeof option === "string" ? { label: labelize(option), value: option } : option)} /></label>;
}

function Select({ ariaLabel, value, onChange, options }: { ariaLabel: string; value: string; onChange: (value: string) => void; options: Array<{ label: string; value: string }> }) {
  return <select aria-label={ariaLabel} className="field h-10 w-full rounded-lg px-3 text-sm outline-none" value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>;
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-[color:var(--line)] bg-[color:var(--surface-muted)] px-4 py-3"><p className="text-xs font-bold text-[color:var(--foreground-muted)]">{label}</p><p className="mt-1.5 text-sm font-semibold text-[color:var(--brand-strong)]">{value}</p></div>;
}

function Metric({ hint, label, tone = "success", value }: { hint?: string; label: string; tone?: "success" | "warning"; value: string }) {
  const hintClass = tone === "warning" ? "text-[color:var(--warning)]" : "text-[color:var(--success)]";
  return <div className="rounded-lg border border-[color:var(--line)] bg-[color:var(--surface-raised)] p-4"><p className="text-xs font-bold text-[color:var(--foreground-muted)]">{label}</p><p className="mt-2 text-2xl font-semibold text-[color:var(--brand-strong)]">{value}</p>{hint ? <p className={`mt-2 text-xs font-bold ${hintClass}`}>{hint}</p> : null}</div>;
}

function MenuButton({ label, onClick, disabled = false }: { label: string; onClick: () => void; disabled?: boolean }) {
  return <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold hover:bg-[color:var(--surface-muted)] disabled:cursor-not-allowed disabled:opacity-50" disabled={disabled} onClick={onClick} type="button"><Plus className="h-4 w-4" /> {label}</button>;
}

function Notice({ tone, label }: { tone: "success" | "danger"; label: string }) {
  return <div className={`mb-4 rounded-lg px-4 py-3 text-sm font-semibold ${tone === "success" ? "pill-success" : "pill-danger"}`}>{label}</div>;
}

function flattenStructure(structure: StructureState): StructureNode[] {
  const nodes: StructureNode[] = [];
  structure.blocks.forEach((block) => {
    nodes.push({ type: "BLOCK", record: block, block });
    (structure.floorsByBlock[block.id ?? 0] ?? []).forEach((floor) => {
      nodes.push({ type: "FLOOR", record: floor, block, floor });
      (structure.unitsByFloor[floor.id ?? 0] ?? []).forEach((unit) => nodes.push({ type: "UNIT", record: unit, block, floor }));
    });
  });
  return nodes;
}

function nodeKey(node: StructureNode) {
  return `${node.type}-${node.record.id}`;
}

function nodeDepth(node: StructureNode): TreeDepth {
  return node.type === "BLOCK" ? 1 : node.type === "FLOOR" ? 2 : 3;
}

function newForm(type: NodeType, selectedNode?: StructureNode | null, structure: StructureState = emptyStructure): StructureForm {
  const selectedBlock = selectedNode?.type === "BLOCK" ? selectedNode.record : selectedNode?.block ?? structure.blocks[0];
  const selectedFloor = selectedNode?.type === "FLOOR" ? selectedNode.record : selectedNode?.floor ?? firstFloor(structure);
  return { code: "", name: "", type: type === "UNIT" ? "2 Bed" : "Residence", parentId: type === "FLOOR" ? String(selectedBlock?.id ?? "") : type === "UNIT" ? String(selectedFloor?.id ?? "") : "", floors: "", units: "", residenceUnits: "", retailUnits: "", parkingBays: "", vacantUnits: "", reservedUnits: "", area: "", bedrooms: "", baseRent: "", serviceCharge: "", status: type === "UNIT" ? "VACANT" : "Y" };
}

function formFromNode(node: StructureNode): StructureForm {
  const attrs = parseAttributes(node.record.attributes);
  return { code: node.record.code ?? "", name: node.record.name ?? "", type: node.type === "UNIT" ? attrs.unitType || node.record.name || "2 Bed" : attrs.type || "Residence", parentId: String(node.record.parentId ?? ""), floors: attrs.floors || "", units: attrs.units || "", residenceUnits: attrs.residenceUnits || "", retailUnits: attrs.retailUnits || "", parkingBays: attrs.parkingBays || "", vacantUnits: attrs.vacantUnits || "", reservedUnits: attrs.reservedUnits || "", area: attrs.area || "", bedrooms: attrs.bedrooms || "", baseRent: attrs.baseRent || "", serviceCharge: attrs.serviceCharge || "", status: node.type === "UNIT" ? node.record.status || "VACANT" : normalizeActiveStatus(node.record.activeStatus) };
}

function formToRecord(type: NodeType, form: StructureForm, existing?: MasterRecord): MasterRecord {
  if (type === "BLOCK") return baseRecord(form, existing, { type: form.type, floors: form.floors, units: form.units, residenceUnits: form.residenceUnits, retailUnits: form.retailUnits, parkingBays: form.parkingBays, vacantUnits: form.vacantUnits, reservedUnits: form.reservedUnits });
  if (type === "FLOOR") return baseRecord(form, existing, { type: form.type, units: form.units, residenceUnits: form.residenceUnits, retailUnits: form.retailUnits, vacantUnits: form.vacantUnits, reservedUnits: form.reservedUnits });
  return { ...baseRecord({ ...form, name: form.type }, existing, { unitType: form.type, area: form.area, bedrooms: form.bedrooms, baseRent: form.baseRent, serviceCharge: form.serviceCharge }), status: form.status };
}

function baseRecord(form: StructureForm, existing: MasterRecord | undefined, attrs: Record<string, string>): MasterRecord {
  const name = required(form.name, "Name is required.");
  return { ...existing, code: required(form.code || codeFromName(name, "REC"), "Code is required.").toUpperCase(), name, parentId: form.parentId ? Number(form.parentId) : existing?.parentId, sortOrder: existing?.sortOrder ?? 0, activeStatus: normalizeActiveStatus(form.status), attributes: JSON.stringify(attrs) };
}

function newTabRow(tabCode: TabCode, index: number): TabDraftRow {
  const data = Object.fromEntries(columnsByTab[tabCode].map((column) => [column.key, column.key === "status" ? "Active" : column.inputType === "date" ? todayIsoDate() : ""]));
  return { draftKey: clientId(), rowType: tabCode, rowData: JSON.stringify(data), data, sortOrder: (index + 1) * 10, activeStatus: "Y" };
}

function toDraftRow(row: PropertyViewTabRow): TabDraftRow {
  return { ...row, draftKey: `saved-${row.id ?? clientId()}`, data: parseAttributes(row.rowData) };
}

function fromDraftRow(row: TabDraftRow): PropertyViewTabRow {
  return {
    id: row.id,
    companyId: row.companyId,
    propertyId: row.propertyId,
    entityType: row.entityType,
    entityId: row.entityId,
    tabCode: row.tabCode,
    rowType: row.rowType ?? row.tabCode,
    rowData: JSON.stringify(row.data),
    sortOrder: row.sortOrder,
    activeStatus: normalizeActiveStatus(row.activeStatus),
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

function validateRows(tabCode: TabCode, rows: TabDraftRow[]) {
  const requiredColumns = columnsByTab[tabCode].filter((column) => column.required);
  rows.forEach((row) => requiredColumns.forEach((column) => required(row.data[column.key] ?? "", `${column.label} is required.`)));
}

function parseAttributes(raw?: string): Record<string, string> {
  if (!raw) return {};
  try {
    const value = JSON.parse(raw) as Record<string, unknown>;
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, item == null ? "" : String(item)]));
  } catch {
    return {};
  }
}

function floorOptions(structure: StructureState) {
  return structure.blocks.flatMap((block) => (structure.floorsByBlock[block.id ?? 0] ?? []).map((floor) => ({ label: `${block.name} / ${floor.name}`, value: String(floor.id ?? "") })));
}

function firstFloor(structure: StructureState) {
  return Object.values(structure.floorsByBlock).flat()[0];
}

function hasFloors(structure: StructureState) {
  return Object.values(structure.floorsByBlock).some((floors) => floors.length > 0);
}

function numericText(value?: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && value !== "" ? parsed : 0;
}

function unitCounts(units: MasterRecord[]) {
  return units.reduce((counts, unit) => {
    const attrs = parseAttributes(unit.attributes);
    const status = String(unit.status ?? "").toUpperCase();
    const type = String(attrs.unitType || unit.name || "").toUpperCase();
    if (status === "OCCUPIED") counts.occupied += 1;
    if (status === "VACANT" || status === "AVAILABLE") counts.vacant += 1;
    if (status === "RESERVED") counts.reserved += 1;
    if (type.includes("RETAIL")) counts.retail += 1;
    else counts.residential += 1;
    return counts;
  }, { occupied: 0, reserved: 0, residential: 0, retail: 0, vacant: 0 });
}

function pathFor(node: StructureNode, property: PropertyMaster) {
  return [property.name, node.block?.name, node.floor?.name, node.type === "UNIT" ? node.record.code : node.type === "FLOOR" ? node.record.name : undefined].filter(Boolean).join("/");
}

function subtitleFor(node: StructureNode, attrs: Record<string, string>) {
  if (node.type === "UNIT") return [attrs.unitType || node.record.name, attrs.area, labelize(node.record.status)].filter(Boolean).join(" / ");
  if (node.type === "FLOOR") return [attrs.type || "Floor", `${attrs.units || "0"} units`, activeStatusLabel(node.record.activeStatus)].join(" / ");
  return [attrs.type || "Block", `${attrs.floors || "0"} floors`, `${attrs.units || "0"} units`].join(" / ");
}

function titleFor(type: NodeType) {
  return type === "BLOCK" ? "Block" : type === "FLOOR" ? "Floor" : "Unit";
}

function selectedPropertyIdFromLocation() {
  if (typeof window === "undefined") return null;
  const value = Number(new URLSearchParams(window.location.search).get("propertyId"));
  return Number.isFinite(value) && value > 0 ? value : null;
}

function required(value: string, message: string) {
  const text = value.trim();
  if (!text) throw new Error(message);
  return text;
}

function requireId(value?: number) {
  if (!value) throw new Error("Selected record id is missing.");
  return value;
}

function codeFromName(value: string, fallback: string) {
  const code = value.trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toUpperCase();
  return code || fallback;
}

function optionLabel(options: Option[], value?: string) {
  if (!value) return "";
  return options.find((option) => option.value === value || option.label === value)?.label ?? value;
}

function clientId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function labelize(value?: string) {
  return String(value ?? "ACTIVE").replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function activeStatusLabel(value?: string) {
  return normalizeActiveStatus(value) === "Y" ? "Active" : "Inactive";
}

function statusTone(value?: string) {
  return normalizeActiveStatus(value) === "Y" ? "pill-success" : "pill-warning";
}

function normalizeActiveStatus(value?: string) {
  const normalized = String(value ?? "Y").toUpperCase();
  return normalized === "N" || normalized === "INACTIVE" ? "N" : "Y";
}

function formatCurrencyValue(value?: string) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && value !== "" ? new Intl.NumberFormat("en-AE", { currency: "AED", maximumFractionDigits: 0, style: "currency" }).format(numeric) : value || "Not captured";
}

function formatRentShort(value?: string) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || value === "") return "Not captured";
  return numeric >= 1000 ? `AED ${Math.round(numeric / 1000)}K` : `AED ${numeric}`;
}

function formatArea(value?: string) {
  if (!value) return "Not captured";
  return value.toLowerCase().includes("sq") ? value : `${value} sqft`;
}

function dateInputValue(value?: string) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? "" : new Date(parsed).toISOString().slice(0, 10);
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}
