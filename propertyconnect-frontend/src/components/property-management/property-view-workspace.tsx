"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronsDownUp, ChevronsUpDown, Edit3, Loader2, Plus, RefreshCcw, Save, X } from "lucide-react";

import {
  getPropertySummary,
  listBlocks,
  listFloors,
  listProperties,
  listUnits,
  saveBlock,
  saveFloor,
  saveUnit,
  updateBlock,
  updateFloor,
  updateUnit,
  type MasterRecord,
  type PropertyMaster,
  type PropertySummary,
} from "@/lib/property-management";

type NodeType = "BLOCK" | "FLOOR" | "UNIT";
type DialogMode = "create" | "edit";
type StructureNode = {
  type: NodeType;
  record: MasterRecord;
  block?: MasterRecord;
  floor?: MasterRecord;
};

type StructureState = {
  blocks: MasterRecord[];
  floorsByBlock: Record<number, MasterRecord[]>;
  unitsByFloor: Record<number, MasterRecord[]>;
};

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

const emptySummary: PropertySummary = {
  propertyId: 0,
  blockCount: 0,
  floorCount: 0,
  unitCount: 0,
  occupiedUnits: 0,
  vacantUnits: 0,
  reservedUnits: 0,
  maintenanceUnits: 0,
  amenityCount: 0,
};

const emptyStructure: StructureState = { blocks: [], floorsByBlock: {}, unitsByFloor: {} };
const typeOptions = ["Residence", "Commercial", "Mixed Use", "Retail"];
const unitTypeOptions = ["Studio", "1 Bed", "2 Bed", "3 Bed", "Retail", "Office"];
const unitStatusOptions = ["VACANT", "OCCUPIED", "RESERVED", "UNDER_MAINTENANCE"];
const activeStatusOptions = [
  { label: "Active", value: "Y" },
  { label: "Inactive", value: "N" },
];

export function PropertyViewWorkspace() {
  const [properties, setProperties] = useState<PropertyMaster[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [structure, setStructure] = useState<StructureState>(emptyStructure);
  const [summary, setSummary] = useState<PropertySummary>(emptySummary);
  const [selectedKey, setSelectedKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [dialog, setDialog] = useState<{ mode: DialogMode; type: NodeType; record?: MasterRecord } | null>(null);
  const [form, setForm] = useState<StructureForm>(() => newForm("BLOCK"));

  const selectedProperty = useMemo(() => properties.find((property) => property.id === selectedId) ?? properties[0] ?? null, [properties, selectedId]);
  const nodes = useMemo(() => flattenStructure(structure), [structure]);
  const selectedNode = useMemo(() => nodes.find((node) => nodeKey(node) === selectedKey) ?? nodes[0] ?? null, [nodes, selectedKey]);
  const occupancyRate = summary.unitCount ? Math.round((summary.occupiedUnits / summary.unitCount) * 100) : 0;

  const refreshProperties = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const loaded = await listProperties({ pageSize: 100 });
      const requestedId = selectedPropertyIdFromLocation();
      setProperties(loaded);
      setSelectedId((current) => {
        if (requestedId && loaded.some((property) => property.id === requestedId)) return requestedId;
        return current && loaded.some((property) => property.id === current) ? current : loaded[0]?.id ?? null;
      });
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

      await Promise.all(
        loadedBlocks.map(async (block) => {
          if (!block.id) return;
          const floors = await listFloors(block.id);
          floorsByBlock[block.id] = floors;
          await Promise.all(
            floors.map(async (floor) => {
              if (!floor.id) return;
              unitsByFloor[floor.id] = await listUnits(floor.id);
            }),
          );
        }),
      );

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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refreshProperties();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refreshProperties]);

  useEffect(() => {
    if (selectedId) {
      const timer = window.setTimeout(() => {
        void refreshStructure(selectedId);
      }, 0);
      return () => window.clearTimeout(timer);
    }
    else {
      const timer = window.setTimeout(() => {
        setStructure(emptyStructure);
        setSummary(emptySummary);
      }, 0);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [refreshStructure, selectedId]);

  function openCreate(type: NodeType) {
    setCreateOpen(false);
    setDialog({ mode: "create", type });
    setForm(newForm(type, selectedNode, structure));
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

  return (
    <main className="page-surface min-h-screen px-5 py-6 lg:px-8">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-[color:var(--foreground-muted)]">Property Management / Property View</p>
          <h1 className="display-font text-3xl font-semibold text-[color:var(--brand-strong)]">Property View</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold" onClick={() => selectedId && void refreshStructure(selectedId)} type="button">
            <RefreshCcw className="h-4 w-4" /> Refresh
          </button>
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

      <div className="grid gap-5 xl:grid-cols-[280px_1fr]">
        <aside className="panel h-fit rounded-lg">
          <div className="border-b border-[color:var(--line)] p-4">
            <Select
              ariaLabel="Property"
              value={String(selectedProperty?.id ?? "")}
              onChange={(value) => {
                setSelectedId(Number(value) || null);
                setSelectedKey("");
              }}
              options={properties.map((property) => ({ label: property.name, value: String(property.id ?? "") }))}
            />
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button className="btn-secondary inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold" type="button">
                <ChevronsUpDown className="h-4 w-4" /> Expand
              </button>
              <button className="btn-secondary inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold" type="button">
                <ChevronsDownUp className="h-4 w-4" /> Collapse
              </button>
            </div>
          </div>
          <div className="max-h-[680px] overflow-auto p-4">
            {loading ? <div className="flex items-center gap-2 rounded-lg bg-[color:var(--surface-muted)] p-3 text-sm font-semibold"><Loader2 className="h-4 w-4 animate-spin" /> Loading</div> : null}
            {!loading && structure.blocks.length === 0 ? <div className="rounded-lg bg-[color:var(--surface-muted)] p-3 text-sm text-[color:var(--foreground-muted)]">No block, floor or unit records found.</div> : null}
            <TreeMenu structure={structure} selectedKey={selectedKey} onSelect={setSelectedKey} />
          </div>
        </aside>

        <section className="panel rounded-lg">
          {selectedNode ? (
            <NodeDetails node={selectedNode} property={selectedProperty} summary={summary} occupancyRate={occupancyRate} onEdit={() => openEdit(selectedNode)} />
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
              <button className="btn-secondary inline-flex h-10 w-10 items-center justify-center rounded-lg" onClick={() => setDialog(null)} type="button">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-4 p-4 lg:grid-cols-2">
              <StructureFields type={dialog.type} form={form} structure={structure} onChange={(next) => setForm((current) => ({ ...current, ...next }))} />
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

function TreeMenu({ structure, selectedKey, onSelect }: { structure: StructureState; selectedKey: string; onSelect: (key: string) => void }) {
  return (
    <div className="space-y-2">
      {structure.blocks.map((block) => {
        const blockKey = `BLOCK-${block.id}`;
        return (
          <div key={blockKey}>
            <TreeButton depth={0} label={block.name} selected={selectedKey === blockKey} onClick={() => onSelect(blockKey)} />
            {(structure.floorsByBlock[block.id ?? 0] ?? []).map((floor) => {
              const floorKey = `FLOOR-${floor.id}`;
              return (
                <div key={floorKey}>
                  <TreeButton depth={1} label={floor.name} selected={selectedKey === floorKey} onClick={() => onSelect(floorKey)} />
                  {(structure.unitsByFloor[floor.id ?? 0] ?? []).map((unit) => {
                    const unitKey = `UNIT-${unit.id}`;
                    return <TreeButton depth={2} key={unitKey} label={unit.code || unit.name} selected={selectedKey === unitKey} onClick={() => onSelect(unitKey)} />;
                  })}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function TreeButton({ depth, label, selected, onClick }: { depth: number; label?: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      className="mb-1 flex h-10 w-full items-center gap-2 rounded-lg border px-3 text-left text-sm font-bold transition"
      onClick={onClick}
      style={{ background: selected ? "var(--brand-tint)" : "var(--surface-muted)", borderColor: selected ? "var(--brand-border)" : "var(--line)", paddingLeft: `${12 + depth * 18}px` }}
      type="button"
    >
      <span className="h-3 w-3 border-b border-l border-[color:var(--brand-border)]" />
      <span className="truncate">{label || "Unnamed"}</span>
    </button>
  );
}

function NodeDetails({ node, property, summary, occupancyRate, onEdit }: { node: StructureNode; property: PropertyMaster | null; summary: PropertySummary; occupancyRate: number; onEdit: () => void }) {
  const attrs = parseAttributes(node.record.attributes);
  const title = pathFor(node, property);
  const tabs = node.type === "BLOCK" ? ["Profile", "Ownership", "Documents", "Floors", "Facilities", "Activity"] : node.type === "FLOOR" ? ["Profile", "Documents", "Units", "Activity"] : ["Profile", "Ownership", "Documents", "Lease", "Charges", "Activity"];
  const metrics = node.type === "BLOCK"
    ? [
        ["No. of Floors", attrs.floors || countFloors(node.record, summary)],
        ["Total Units", attrs.units || "0"],
        ["Occupancy %", `${occupancyRate}%`],
        ["Vacant", attrs.vacantUnits || String(summary.vacantUnits)],
        ["Reserved", attrs.reservedUnits || String(summary.reservedUnits)],
      ]
    : node.type === "FLOOR"
      ? [
          ["Total Units", attrs.units || attrs.unitCount || "0"],
          ["Occupancy %", `${occupancyRate}%`],
          ["Vacant", attrs.vacantUnits || "0"],
          ["Reserved", attrs.reservedUnits || "0"],
        ]
      : [];

  return (
    <div>
      <div className="flex items-start justify-between border-b border-[color:var(--line)] p-4">
        <div>
          <h2 className="text-lg font-bold text-[color:var(--brand-strong)]">{title}</h2>
          {node.type === "UNIT" ? <p className="mt-1 text-sm font-semibold text-[color:var(--foreground-muted)]">{[attrs.unitType || node.record.name, attrs.area, labelize(node.record.status)].filter(Boolean).join(" / ")}</p> : null}
        </div>
        <div className="flex items-center gap-2">
          <span className="pill-brand rounded-full px-3 py-1 text-xs font-bold">{node.type === "UNIT" ? labelize(node.record.status) : activeStatusLabel(node.record.activeStatus)}</span>
          <button className="btn-secondary inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold" onClick={onEdit} type="button">
            <Edit3 className="h-4 w-4" /> Edit
          </button>
        </div>
      </div>

      {metrics.length ? (
        <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-5">
          {metrics.map(([label, value]) => <Metric key={label} label={label} value={value} />)}
        </div>
      ) : null}

      <div className="mx-4 flex gap-1 overflow-x-auto rounded-lg bg-[color:var(--surface-muted)] p-1">
        {tabs.map((tab, index) => (
          <button className={`shrink-0 rounded-md px-3 py-2 text-sm font-bold ${index === 0 ? "bg-[color:var(--surface-raised)] text-[color:var(--brand)] shadow-sm" : "text-[color:var(--foreground-muted)]"}`} key={tab} type="button">
            {tab}
          </button>
        ))}
      </div>

      <ReadOnlyGrid node={node} />
    </div>
  );
}

function ReadOnlyGrid({ node }: { node: StructureNode }) {
  const attrs = parseAttributes(node.record.attributes);
  const rows: Array<[string, string | undefined]> = node.type === "BLOCK"
    ? [
        ["Building", node.record.name],
        ["Type", attrs.type],
        ["Floors", attrs.floors],
        ["Units", attrs.units],
        ["Residence Units", attrs.residenceUnits],
        ["Retail Units", attrs.retailUnits],
        ["Parking Bays", attrs.parkingBays],
        ["Status", activeStatusLabel(node.record.activeStatus)],
      ]
    : node.type === "FLOOR"
      ? [
          ["Floor", node.record.name],
          ["Type", attrs.type],
          ["Building", node.block?.name],
          ["Unit Count", attrs.units],
          ["Residence Units", attrs.residenceUnits],
          ["Retail Units", attrs.retailUnits],
          ["Vacant Units", attrs.vacantUnits],
          ["Reserved Units", attrs.reservedUnits],
          ["Status", activeStatusLabel(node.record.activeStatus)],
        ]
      : [
          ["Unit Number", node.record.code],
          ["Building", node.block?.name],
          ["Floor", node.floor?.name],
          ["Unit Type", attrs.unitType || node.record.name],
          ["Area", attrs.area],
          ["Bedrooms", attrs.bedrooms],
          ["Base Rent", formatCurrencyValue(attrs.baseRent)],
          ["Service Charge", formatCurrencyValue(attrs.serviceCharge)],
          ["Status", labelize(node.record.status)],
        ];

  return (
    <div className="grid gap-4 p-4 lg:grid-cols-2">
      {rows.map(([label, value]) => (
        <ReadOnlyField key={label} label={label} value={value || "Not captured"} />
      ))}
    </div>
  );
}

function StructureFields({ type, form, structure, onChange }: { type: NodeType; form: StructureForm; structure: StructureState; onChange: (value: Partial<StructureForm>) => void }) {
  if (type === "BLOCK") {
    return (
      <>
        <Field label="Building" required value={form.name} onChange={(name) => onChange({ name, code: form.code || codeFromName(name, "BLK") })} />
        <SelectField label="Type" value={form.type} onChange={(value) => onChange({ type: value })} options={typeOptions} />
        <NumberField label="Floors" value={form.floors} onChange={(floors) => onChange({ floors })} />
        <NumberField label="Units" value={form.units} onChange={(units) => onChange({ units })} />
        <NumberField label="Residence Units" value={form.residenceUnits} onChange={(residenceUnits) => onChange({ residenceUnits })} />
        <NumberField label="Retail Units" value={form.retailUnits} onChange={(retailUnits) => onChange({ retailUnits })} />
        <NumberField label="Parking Bays" value={form.parkingBays} onChange={(parkingBays) => onChange({ parkingBays })} />
        <SelectField label="Status" value={form.status} onChange={(status) => onChange({ status })} options={activeStatusOptions} />
      </>
    );
  }
  if (type === "FLOOR") {
    return (
      <>
        <SelectField label="Building" value={form.parentId} onChange={(parentId) => onChange({ parentId })} options={structure.blocks.map((block) => ({ label: block.name, value: String(block.id ?? "") }))} />
        <Field label="Floor" required value={form.name} onChange={(name) => onChange({ name, code: form.code || `FLR-${name}` })} />
        <SelectField label="Type" value={form.type} onChange={(value) => onChange({ type: value })} options={typeOptions} />
        <NumberField label="Unit Count" value={form.units} onChange={(units) => onChange({ units })} />
        <NumberField label="Residence Units" value={form.residenceUnits} onChange={(residenceUnits) => onChange({ residenceUnits })} />
        <NumberField label="Retail Units" value={form.retailUnits} onChange={(retailUnits) => onChange({ retailUnits })} />
        <NumberField label="Vacant Units" value={form.vacantUnits} onChange={(vacantUnits) => onChange({ vacantUnits })} />
        <NumberField label="Reserved Units" value={form.reservedUnits} onChange={(reservedUnits) => onChange({ reservedUnits })} />
        <SelectField label="Status" value={form.status} onChange={(status) => onChange({ status })} options={activeStatusOptions} />
      </>
    );
  }
  return (
    <>
      <SelectField label="Floor" value={form.parentId} onChange={(parentId) => onChange({ parentId })} options={floorOptions(structure)} />
      <Field label="Unit Number" required value={form.code} onChange={(code) => onChange({ code })} />
      <SelectField label="Unit Type" value={form.type} onChange={(value) => onChange({ type: value, name: value })} options={unitTypeOptions} />
      <Field label="Area" value={form.area} onChange={(area) => onChange({ area })} />
      <NumberField label="Bedrooms" value={form.bedrooms} onChange={(bedrooms) => onChange({ bedrooms })} />
      <NumberField label="Base Rent" value={form.baseRent} onChange={(baseRent) => onChange({ baseRent })} />
      <NumberField label="Service Charge" value={form.serviceCharge} onChange={(serviceCharge) => onChange({ serviceCharge })} />
      <SelectField label="Status" value={form.status} onChange={(status) => onChange({ status })} options={unitStatusOptions} />
    </>
  );
}

function Field({ label, value, onChange, required = false }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-[color:var(--foreground-muted)]">{label}{required ? " *" : ""}</span>
      <input className="field mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none" required={required} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-[color:var(--foreground-muted)]">{label}</span>
      <input className="field mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none" min="0" type="number" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<string | { label: string; value: string }> }) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-[color:var(--foreground-muted)]">{label}</span>
      <Select ariaLabel={label} value={value} onChange={onChange} options={options.map((option) => (typeof option === "string" ? { label: labelize(option), value: option } : option))} />
    </label>
  );
}

function Select({ ariaLabel, value, onChange, options }: { ariaLabel: string; value: string; onChange: (value: string) => void; options: Array<{ label: string; value: string }> }) {
  return (
    <select aria-label={ariaLabel} className="field mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none" value={value} onChange={(event) => onChange(event.target.value)}>
      {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold text-[color:var(--foreground-muted)]">{label}</p>
      <div className="field mt-1 rounded-lg px-3 py-2 text-sm font-semibold text-[color:var(--brand-strong)]">{value}</div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-[color:var(--line)] bg-[color:var(--surface-raised)] p-4">
      <p className="text-xs font-bold text-[color:var(--foreground-muted)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[color:var(--brand-strong)]">{value}</p>
    </div>
  );
}

function MenuButton({ label, onClick, disabled = false }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold hover:bg-[color:var(--surface-muted)] disabled:cursor-not-allowed disabled:opacity-50" disabled={disabled} onClick={onClick} type="button">
      <Plus className="h-4 w-4" /> {label}
    </button>
  );
}

function Notice({ tone, label }: { tone: "success" | "danger"; label: string }) {
  return <div className={`mb-4 rounded-lg px-4 py-3 text-sm font-semibold ${tone === "success" ? "bg-[color:var(--success-soft)] text-[color:var(--success)]" : "bg-[color:var(--danger-soft)] text-[color:var(--danger)]"}`}>{label}</div>;
}

function flattenStructure(structure: StructureState): StructureNode[] {
  const nodes: StructureNode[] = [];
  structure.blocks.forEach((block) => {
    nodes.push({ type: "BLOCK", record: block, block });
    (structure.floorsByBlock[block.id ?? 0] ?? []).forEach((floor) => {
      nodes.push({ type: "FLOOR", record: floor, block, floor });
      (structure.unitsByFloor[floor.id ?? 0] ?? []).forEach((unit) => {
        nodes.push({ type: "UNIT", record: unit, block, floor });
      });
    });
  });
  return nodes;
}

function nodeKey(node: StructureNode) {
  return `${node.type}-${node.record.id}`;
}

function newForm(type: NodeType, selectedNode?: StructureNode | null, structure: StructureState = emptyStructure): StructureForm {
  const selectedBlock = selectedNode?.type === "BLOCK" ? selectedNode.record : selectedNode?.block ?? structure.blocks[0];
  const selectedFloor = selectedNode?.type === "FLOOR" ? selectedNode.record : selectedNode?.floor ?? firstFloor(structure);
  return {
    code: "",
    name: "",
    type: type === "UNIT" ? "2 Bed" : "Residence",
    parentId: type === "FLOOR" ? String(selectedBlock?.id ?? "") : type === "UNIT" ? String(selectedFloor?.id ?? "") : "",
    floors: "",
    units: "",
    residenceUnits: "",
    retailUnits: "",
    parkingBays: "",
    vacantUnits: "",
    reservedUnits: "",
    area: "",
    bedrooms: "",
    baseRent: "",
    serviceCharge: "",
    status: type === "UNIT" ? "VACANT" : "Y",
  };
}

function formFromNode(node: StructureNode): StructureForm {
  const attrs = parseAttributes(node.record.attributes);
  return {
    code: node.record.code ?? "",
    name: node.record.name ?? "",
    type: node.type === "UNIT" ? attrs.unitType || node.record.name || "2 Bed" : attrs.type || "Residence",
    parentId: String(node.record.parentId ?? ""),
    floors: attrs.floors || "",
    units: attrs.units || attrs.unitCount || "",
    residenceUnits: attrs.residenceUnits || "",
    retailUnits: attrs.retailUnits || "",
    parkingBays: attrs.parkingBays || "",
    vacantUnits: attrs.vacantUnits || "",
    reservedUnits: attrs.reservedUnits || "",
    area: attrs.area || "",
    bedrooms: attrs.bedrooms || "",
    baseRent: attrs.baseRent || "",
    serviceCharge: attrs.serviceCharge || "",
    status: node.type === "UNIT" ? node.record.status || "VACANT" : normalizeActiveStatus(node.record.activeStatus),
  };
}

function formToRecord(type: NodeType, form: StructureForm, existing?: MasterRecord): MasterRecord {
  if (type === "BLOCK") {
    return baseRecord(form, existing, {
      type: form.type,
      floors: form.floors,
      units: form.units,
      residenceUnits: form.residenceUnits,
      retailUnits: form.retailUnits,
      parkingBays: form.parkingBays,
      vacantUnits: form.vacantUnits,
      reservedUnits: form.reservedUnits,
    });
  }
  if (type === "FLOOR") {
    return baseRecord(form, existing, {
      type: form.type,
      units: form.units,
      residenceUnits: form.residenceUnits,
      retailUnits: form.retailUnits,
      vacantUnits: form.vacantUnits,
      reservedUnits: form.reservedUnits,
    });
  }
  return {
    ...baseRecord({ ...form, name: form.type }, existing, {
      unitType: form.type,
      area: form.area,
      bedrooms: form.bedrooms,
      baseRent: form.baseRent,
      serviceCharge: form.serviceCharge,
    }),
    status: form.status,
  };
}

function baseRecord(form: StructureForm, existing: MasterRecord | undefined, attrs: Record<string, string>): MasterRecord {
  const name = required(form.name, "Name is required.");
  return {
    ...existing,
    code: required(form.code || codeFromName(name, "REC"), "Code is required.").toUpperCase(),
    name,
    parentId: form.parentId ? Number(form.parentId) : existing?.parentId,
    sortOrder: existing?.sortOrder ?? 0,
    activeStatus: normalizeActiveStatus(form.status),
    attributes: JSON.stringify(attrs),
  };
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

function pathFor(node: StructureNode, property: PropertyMaster | null) {
  const parts = [property?.name, node.block?.name, node.floor?.name, node.type === "UNIT" ? node.record.code : node.type === "FLOOR" ? node.record.name : undefined].filter(Boolean);
  return parts.join("/");
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

function codeFromName(value: string, fallback: string) {
  const code = value.trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toUpperCase();
  return code || fallback;
}

function labelize(value?: string) {
  return String(value ?? "ACTIVE").replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function activeStatusLabel(value?: string) {
  return normalizeActiveStatus(value) === "Y" ? "Active" : "Inactive";
}

function normalizeActiveStatus(value?: string) {
  const normalized = String(value ?? "Y").toUpperCase();
  return normalized === "N" || normalized === "INACTIVE" ? "N" : "Y";
}

function formatCurrencyValue(value?: string) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && value !== "" ? new Intl.NumberFormat("en-AE", { currency: "AED", maximumFractionDigits: 0, style: "currency" }).format(numeric) : value || "Not captured";
}

function countFloors(_record: MasterRecord, summary: PropertySummary) {
  return summary.floorCount ? String(summary.floorCount) : "0";
}
