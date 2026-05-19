"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { BadgeCheck, Edit3, Loader2, Plus, RefreshCcw, Save, Search, Send, UserCheck, UserPlus, UsersRound, X, type LucideIcon } from "lucide-react";

import { WorkspaceDrawer } from "@/components/layout/workspace-drawer";
import { convertLeadToProspect, createLead, listCodeValues, listLeads, qualifyLead, searchCustomers, updateLead, type BusinessParty, type ErpCodeValue, type Lead, type LeadStageTarget } from "@/lib/lead";
import { listProspects, type Prospect } from "@/lib/prospect";

export type LeadScreen = "leads" | "lead-entry";

export type LeadDrawerMode = "create" | "edit" | null;

type LeadStageCard = {
  label: string;
  value: number;
  caption: string;
  icon: LucideIcon;
};

type LeadBoardProps = {
  filteredLeads: Lead[];
  leadDrawerMode: LeadDrawerMode;
  leadForm: Lead;
  leadSearch: string;
  leadStageCards: LeadStageCard[];
  leadStatusFilter: string;
  leadStatuses: string[];
  customerTypeOptions: ErpCodeValue[];
  customers: BusinessParty[];
  customerLookupLoading: boolean;
  customerLookupOpen: boolean;
  customerSearch: string;
  canSubmitLead: boolean;
  loading: boolean;
  saving: boolean;
  selectedLead: Lead | null;
  selectedLeadProspect: Prospect | null;
  stageLead: Lead | null;
  stageNotes: string;
  stageProspectDetails: ProspectDetails;
  stageScore: string;
  stageTarget: LeadStageTarget;
  onCloseLeadDrawer: () => void;
  onCloseStage: () => void;
  onCreateLead: () => void;
  onEditLead: (lead: Lead) => void;
  onLeadFormChange: (lead: Lead) => void;
  onLeadSearchChange: (value: string) => void;
  onLeadStatusFilterChange: (value: string) => void;
  onCustomerClear: () => void;
  onCustomerLookup: (search?: string) => void;
  onCustomerSearchChange: (value: string) => void;
  onCustomerSelect: (customer: BusinessParty) => void;
  onMoveStage: (lead: Lead) => void;
  onNotesChange: (value: string) => void;
  onProspectDetailsChange: (details: ProspectDetails) => void;
  onScoreChange: (value: string) => void;
  onSelectLead: (lead: Lead) => void;
  onSubmitLead: (event: FormEvent<HTMLFormElement>) => void;
  onSubmitStage: (event: FormEvent<HTMLFormElement>) => void;
  onTargetChange: (value: LeadStageTarget) => void;
};

type ProspectDetails = {
  customerType?: number;
  customerTypeName?: string;
  customerName: string;
  tradeLicenseNo: string;
  crNumber: string;
  vatRegistrationNo: string;
  contactPerson: string;
  contactRole: string;
  contactTitle: string;
  mobileNo: string;
  phoneNo: string;
  email: string;
  preferredContactMethod: string;
  faxNo: string;
  address: string;
  source: string;
  purpose: string;
  commercialNeed: string;
  documentNotes: string;
};

const initialLead: Lead = {
  customerId: undefined,
  customerType: undefined,
  customerName: "",
  contactPerson: "",
  mobileNo: "",
  email: "",
  preferredContactMethod: "WhatsApp",
  purpose: "RENT",
};
const initialLeadStageTarget: LeadStageTarget = "QUALIFIED";
const preferredContactOptions = ["WhatsApp", "Email", "Phone Call", "SMS"];

function initialProspectDetails(lead?: Lead): ProspectDetails {
  return {
    customerType: lead?.customerType,
    customerTypeName: lead?.customerTypeName,
    customerName: lead?.customerName ?? "",
    tradeLicenseNo: "",
    crNumber: "",
    vatRegistrationNo: "",
    contactPerson: lead?.contactPerson ?? "",
    contactRole: "",
    contactTitle: "",
    mobileNo: lead?.mobileNo ?? "",
    phoneNo: "",
    email: lead?.email ?? "",
    preferredContactMethod: lead?.preferredContactMethod ?? "WhatsApp",
    faxNo: "",
    address: "",
    source: "",
    purpose: lead?.purpose ?? "RENT",
    commercialNeed: "",
    documentNotes: "",
  };
}

const leadScreenMeta: Record<LeadScreen, { title: string; subtitle: string; icon: typeof UserPlus }> = {
  leads: { title: "Lead List", subtitle: "Track leasing enquiries and their conversion status.", icon: UsersRound },
  "lead-entry": { title: "Lead Entry", subtitle: "Capture a new leasing enquiry with source and contact details.", icon: UserPlus },
};

export function LeadWorkspace({ screen }: { screen: LeadScreen }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [customerTypeOptions, setCustomerTypeOptions] = useState<ErpCodeValue[]>([]);
  const [customers, setCustomers] = useState<BusinessParty[]>([]);
  const [customerLookupLoading, setCustomerLookupLoading] = useState(false);
  const [customerLookupOpen, setCustomerLookupOpen] = useState(false);
  const [leadForm, setLeadForm] = useState<Lead>(initialLead);
  const [leadDrawerMode, setLeadDrawerMode] = useState<LeadDrawerMode>(null);
  const [stageLead, setStageLead] = useState<Lead | null>(null);
  const [stageTarget, setStageTarget] = useState<LeadStageTarget>(initialLeadStageTarget);
  const [stageScore, setStageScore] = useState("80");
  const [stageNotes, setStageNotes] = useState("");
  const [stageProspectDetails, setStageProspectDetails] = useState<ProspectDetails>(initialProspectDetails());
  const [leadSearch, setLeadSearch] = useState("");
  const [leadStatusFilter, setLeadStatusFilter] = useState("ALL");
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const selectedLead = useMemo(() => leads.find((lead) => (selectedLeadId ? lead.id === selectedLeadId : lead.id)) ?? null, [leads, selectedLeadId]);
  const selectedLeadProspect = useMemo(() => prospects.find((prospect) => prospect.leadId === selectedLead?.id) ?? null, [prospects, selectedLead]);
  const leadStatuses = useMemo(() => ["ALL", ...Array.from(new Set(leads.flatMap((lead) => (lead.status ? [lead.status] : []))))], [leads]);
  const filteredLeads = useMemo(() => {
    const query = leadSearch.trim().toLowerCase();

    return leads.filter((lead) => {
      const matchesStatus = leadStatusFilter === "ALL" || lead.status === leadStatusFilter;
      const matchesQuery =
        !query ||
        [
          lead.leadNo,
          lead.customerCode,
          lead.customerTypeName,
          lead.customerName,
          lead.contactPerson,
          lead.mobileNo,
          lead.email,
          lead.preferredContactMethod,
          lead.purpose,
          lead.status,
        ].some((value) => String(value ?? "").toLowerCase().includes(query));

      return matchesStatus && matchesQuery;
    });
  }, [leadSearch, leadStatusFilter, leads]);
  const leadStageCards = useMemo<LeadStageCard[]>(
    () => [
      { label: "New leads", value: leads.filter((lead) => !lead.status || lead.status === "NEW").length, caption: "Fresh enquiries", icon: UserPlus },
      { label: "Qualified", value: leads.filter((lead) => lead.status === "QUALIFIED").length, caption: "Ready to convert", icon: BadgeCheck },
      { label: "Prospects", value: prospects.length, caption: "Converted pipeline", icon: UserCheck },
    ],
    [leads, prospects.length],
  );
  const meta = leadScreenMeta[screen];
  const Icon = meta.icon;
  const canSubmitLead = Boolean(leadForm.customerId || (leadForm.customerName?.trim() && leadForm.mobileNo?.trim()));

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [loadedLeads, loadedProspects, loadedCustomerTypes] = await Promise.all([listLeads(), listProspects(), listCodeValues("cf_firm_type")]);
      setLeads(loadedLeads);
      setProspects(loadedProspects);
      setCustomerTypeOptions(loadedCustomerTypes);
      setSelectedLeadId((currentId) => {
        if (currentId && loadedLeads.some((lead) => lead.id === currentId)) {
          return currentId;
        }
        return loadedLeads.find((lead) => lead.id)?.id ?? null;
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load lead data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  async function run(action: () => Promise<unknown>, success: string) {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await action();
      setMessage(success);
      await refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to complete action.");
    } finally {
      setSaving(false);
    }
  }

  async function submitLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await run(async () => {
      if (leadDrawerMode === "edit" && leadForm.id) {
        await updateLead(leadForm.id, leadForm);
      } else {
        await createLead(leadForm);
      }
      setLeadForm(initialLead);
      setCustomerSearch("");
      setCustomerLookupOpen(false);
      setLeadDrawerMode(null);
    }, leadDrawerMode === "edit" ? "Lead updated." : "Lead created.");
  }

  function openCreateLead() {
    setLeadForm(initialLead);
    setCustomerSearch("");
    setCustomerLookupOpen(false);
    setLeadDrawerMode("create");
  }

  function openEditLead(lead: Lead) {
    setLeadForm({ ...lead, purpose: lead.purpose ?? "RENT" });
    setCustomerSearch(lead.customerCode ?? "");
    setCustomerLookupOpen(false);
    setLeadDrawerMode("edit");
  }

  async function lookupCustomers(search = customerSearch) {
    const filter = search.trim();
    setCustomerSearch(filter);
    setCustomerLookupOpen(true);
    setCustomerLookupLoading(true);
    setError("");
    try {
      setCustomers(await searchCustomers(filter));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load customers.");
    } finally {
      setCustomerLookupLoading(false);
    }
  }

  function selectCustomer(businessParty: BusinessParty) {
    const customerType = customerTypeIdFromBusinessParty(businessParty, customerTypeOptions);
    const selectedCustomerType = customerTypeOptions.find((option) => option.id === customerType);
    setLeadForm((currentLead) => ({
      ...currentLead,
      customerId: businessParty.id,
      customerCode: businessParty.externalId,
      customerType,
      customerTypeName: selectedCustomerType?.value ?? businessParty.typeOfBusinessName,
      customerName: businessParty.name ?? businessParty.legalName ?? "",
      contactPerson: businessParty.legalName,
      mobileNo: businessParty.contactNumber ?? "",
      email: businessParty.email,
      preferredContactMethod: currentLead.preferredContactMethod,
    }));
    setCustomerSearch(businessParty.name ?? businessParty.legalName ?? "");
    setCustomerLookupOpen(false);
  }

  function clearCustomerSelection() {
    setLeadForm((currentLead) => ({
      ...currentLead,
      customerId: undefined,
      customerCode: "",
      customerType: currentLead.customerType,
      customerTypeName: currentLead.customerTypeName,
      customerName: "",
      contactPerson: "",
      mobileNo: "",
      email: "",
      preferredContactMethod: currentLead.preferredContactMethod || "WhatsApp",
    }));
    setCustomerSearch("");
    setCustomers([]);
    setCustomerLookupOpen(false);
  }

  function openMoveStage(lead: Lead) {
    if (isLeadConvertedToProspect(lead)) {
      return;
    }
    setStageLead(lead);
    setStageTarget(lead.status === "QUALIFIED" ? "CONVERTED_TO_PROSPECT" : "QUALIFIED");
    setStageScore(String(lead.qualificationScore ?? 80));
    setStageNotes(lead.qualificationNotes ?? "");
    setStageProspectDetails(initialProspectDetails(lead));
  }

  async function submitStageMove(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!stageLead?.id) {
      return;
    }

    await run(async () => {
      if (stageTarget === "QUALIFIED") {
        await qualifyLead(stageLead.id!, { score: Number(stageScore), notes: stageNotes });
      } else {
        await convertLeadToProspect(stageLead.id!, undefined, stageLead.customerId ? undefined : stageProspectDetails);
      }
      setStageLead(null);
    }, stageTarget === "QUALIFIED" ? "Lead moved to qualified." : "Lead converted to prospect.");
  }

  return (
    <section className="page-surface min-h-[calc(100vh-6rem)] rounded-none border border-[color:var(--line-strong)] shadow-[0_28px_80px_rgba(24,50,71,0.12)]">
      <div className="border-b border-[color:var(--line)] px-5 py-5 sm:px-6 sm:py-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--brand)]">Lead management</p>
        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[color:var(--brand-tint)] text-[color:var(--brand)]">
                <Icon className="h-5 w-5" />
              </span>
              <h1 className="display-font text-3xl font-semibold text-[color:var(--brand-strong)]">{meta.title}</h1>
            </div>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-[color:var(--foreground-muted)]">{meta.subtitle}</p>
          </div>
          <button className="btn-secondary inline-flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold" onClick={refresh} type="button">
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {error ? <Notice tone="danger" text={error} /> : null}
      {message ? <Notice tone="success" text={message} /> : null}

      {screen === "leads" ? (
        <LeadBoard
          filteredLeads={filteredLeads}
          leadDrawerMode={leadDrawerMode}
          leadForm={leadForm}
          leadSearch={leadSearch}
          leadStageCards={leadStageCards}
          leadStatusFilter={leadStatusFilter}
          leadStatuses={leadStatuses}
          customerTypeOptions={customerTypeOptions}
          customers={customers}
          customerLookupLoading={customerLookupLoading}
          customerLookupOpen={customerLookupOpen}
          customerSearch={customerSearch}
          canSubmitLead={canSubmitLead}
          loading={loading}
          saving={saving}
          selectedLead={selectedLead}
          selectedLeadProspect={selectedLeadProspect}
          stageLead={stageLead}
          stageNotes={stageNotes}
          stageProspectDetails={stageProspectDetails}
          stageScore={stageScore}
          stageTarget={stageTarget}
          onCloseLeadDrawer={() => setLeadDrawerMode(null)}
          onCloseStage={() => setStageLead(null)}
          onCreateLead={openCreateLead}
          onEditLead={openEditLead}
          onLeadFormChange={setLeadForm}
          onLeadSearchChange={setLeadSearch}
          onLeadStatusFilterChange={setLeadStatusFilter}
          onCustomerClear={clearCustomerSelection}
          onCustomerLookup={lookupCustomers}
          onCustomerSearchChange={setCustomerSearch}
          onCustomerSelect={selectCustomer}
          onMoveStage={openMoveStage}
          onNotesChange={setStageNotes}
          onProspectDetailsChange={setStageProspectDetails}
          onScoreChange={setStageScore}
          onSelectLead={(lead) => setSelectedLeadId(lead.id ?? null)}
          onSubmitLead={submitLead}
          onSubmitStage={submitStageMove}
          onTargetChange={setStageTarget}
        />
      ) : null}

      {screen === "lead-entry" ? (
        <div className="p-4 xl:p-6">
          <form className="panel grid gap-4 rounded-lg p-5 md:grid-cols-2" onSubmit={submitLead}>
            <LeadCustomerEntryFields
              customers={customers}
              customerLookupLoading={customerLookupLoading}
              customerLookupOpen={customerLookupOpen}
              customerSearch={customerSearch}
              customerTypeOptions={customerTypeOptions}
              leadForm={leadForm}
              wide
              onCustomerSearchChange={setCustomerSearch}
              onCustomerLookup={lookupCustomers}
              onCustomerSelect={selectCustomer}
              onCustomerClear={clearCustomerSelection}
              onLeadFormChange={setLeadForm}
            />
            <div className="flex items-end">
              <SubmitButton disabled={!canSubmitLead} saving={saving} label="Save Lead" />
            </div>
          </form>
        </div>
      ) : null}

    </section>
  );
}

function LeadBoard({
  filteredLeads,
  leadDrawerMode,
  leadForm,
  leadSearch,
  leadStageCards,
  leadStatusFilter,
  leadStatuses,
  customerTypeOptions,
  customers,
  customerLookupLoading,
  customerLookupOpen,
  customerSearch,
  canSubmitLead,
  loading,
  saving,
  selectedLead,
  selectedLeadProspect,
  stageLead,
  stageNotes,
  stageProspectDetails,
  stageScore,
  stageTarget,
  onCloseLeadDrawer,
  onCloseStage,
  onCreateLead,
  onEditLead,
  onLeadFormChange,
  onLeadSearchChange,
  onLeadStatusFilterChange,
  onCustomerClear,
  onCustomerLookup,
  onCustomerSearchChange,
  onCustomerSelect,
  onMoveStage,
  onNotesChange,
  onProspectDetailsChange,
  onScoreChange,
  onSelectLead,
  onSubmitLead,
  onSubmitStage,
  onTargetChange,
}: LeadBoardProps) {
  return (
    <>
      <div className="grid gap-4 p-4 md:grid-cols-3 xl:p-6">
        {leadStageCards.map((stage) => {
          const StageIcon = stage.icon;

          return (
            <article className="panel rounded-lg p-5" key={stage.label}>
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-[color:var(--brand-tint)] text-[color:var(--brand)]">
                <StageIcon className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-[color:var(--foreground-muted)]">{stage.label}</p>
              <p className="display-font mt-2 text-3xl font-semibold text-[color:var(--brand-strong)]">{stage.value}</p>
              <p className="mt-3 text-sm text-[color:var(--foreground-muted)]">{stage.caption}</p>
            </article>
          );
        })}
      </div>

      <div className="grid gap-4 px-4 pb-6 xl:grid-cols-[minmax(360px,0.85fr)_minmax(0,1.15fr)] xl:px-6">
        <section className="panel overflow-hidden rounded-lg">
          <div className="border-b border-[color:var(--line)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--brand)]">Lead options</p>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
              <h2 className="display-font text-xl font-semibold text-[color:var(--brand-strong)]">Lead list</h2>
              <button className="btn-primary inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold" onClick={onCreateLead} type="button">
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_160px]">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--foreground-subtle)]" />
                <input
                  className="field w-full rounded-lg py-3 pl-10 pr-3 text-sm"
                  onChange={(event) => onLeadSearchChange(event.target.value)}
                  placeholder="Search lead"
                  type="search"
                  value={leadSearch}
                />
              </label>
              <select className="field rounded-lg px-3 py-3 text-sm" onChange={(event) => onLeadStatusFilterChange(event.target.value)} value={leadStatusFilter}>
                {leadStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status === "ALL" ? "All status" : formatLabel(status)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid max-h-[720px] gap-3 overflow-y-auto p-4">
            {loading ? (
              <div className="flex items-center gap-2 rounded-lg border border-[color:var(--line)] bg-[color:var(--surface-muted)] p-4 text-sm text-[color:var(--foreground-muted)]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading leads...
              </div>
            ) : null}
            {!loading && filteredLeads.length === 0 ? <p className="rounded-lg border border-[color:var(--line)] p-4 text-sm text-[color:var(--foreground-muted)]">No leads match the selected filter.</p> : null}
            {filteredLeads.map((lead) => {
              const active = selectedLead?.id === lead.id;

              return (
                <article
                  className="rounded-lg border p-3 text-left transition hover:border-[color:var(--brand-border)] hover:bg-[color:var(--brand-tint)]"
                  key={lead.id ?? lead.leadNo ?? lead.customerName}
                  style={{
                    background: active ? "var(--brand-tint)" : "var(--surface-raised)",
                    borderColor: active ? "var(--brand-border)" : "var(--line)",
                  }}
                >
                  <button className="block w-full text-left" onClick={() => onSelectLead(lead)} type="button">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[color:var(--brand-strong)]">{lead.customerName || "Unnamed lead"}</p>
                        <p className="mt-1 truncate text-xs font-medium text-[color:var(--foreground-muted)]">{lead.leadNo ?? "Lead number pending"}</p>
                      </div>
                      <StatusPill status={lead.status} />
                    </div>
                    <div className="mt-3 grid gap-1 text-xs text-[color:var(--foreground-muted)]">
                      <p className="truncate">{lead.mobileNo || "-"}</p>
                      <p className="truncate">{lead.email || "Email not captured"}</p>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <SmallPill label={lead.purpose ?? "Purpose pending"} />
                      <SmallPill label={lead.preferredContactMethod ?? "Contact pending"} />
                    </div>
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        <LeadDetailPanel lead={selectedLead} prospect={selectedLeadProspect} onEditLead={onEditLead} onMoveStage={onMoveStage} />
      </div>

      <WorkspaceDrawer eyebrow="Lead" open={leadDrawerMode !== null} title={leadDrawerMode === "edit" ? "Edit lead" : "Create lead"} onClose={onCloseLeadDrawer}>
        <form className="grid gap-4" onSubmit={onSubmitLead}>
          <LeadCustomerEntryFields
            customers={customers}
            customerLookupLoading={customerLookupLoading}
            customerLookupOpen={customerLookupOpen}
            customerSearch={customerSearch}
            customerTypeOptions={customerTypeOptions}
            leadForm={leadForm}
            onCustomerClear={onCustomerClear}
            onCustomerLookup={onCustomerLookup}
            onCustomerSearchChange={onCustomerSearchChange}
            onCustomerSelect={onCustomerSelect}
            onLeadFormChange={onLeadFormChange}
          />
          <div className="flex items-center justify-end gap-3 pt-2">
            <button className="btn-secondary rounded-lg px-4 py-3 text-sm font-semibold" onClick={onCloseLeadDrawer} type="button">
              Cancel
            </button>
            <SubmitButton disabled={!canSubmitLead} saving={saving} label={leadDrawerMode === "edit" ? "Update Lead" : "Save Lead"} />
          </div>
        </form>
      </WorkspaceDrawer>

      <StageMoveDialog
        lead={stageLead}
        notes={stageNotes}
        prospectDetails={stageProspectDetails}
        customerTypeOptions={customerTypeOptions}
        saving={saving}
        score={stageScore}
        target={stageTarget}
        onClose={onCloseStage}
        onNotesChange={onNotesChange}
        onProspectDetailsChange={onProspectDetailsChange}
        onScoreChange={onScoreChange}
        onSubmit={onSubmitStage}
        onTargetChange={onTargetChange}
      />
    </>
  );
}

function LeadDetailPanel({ lead, prospect, onEditLead, onMoveStage }: { lead: Lead | null; prospect: Prospect | null; onEditLead: (lead: Lead) => void; onMoveStage: (lead: Lead) => void }) {
  if (!lead) {
    return (
      <section className="panel rounded-lg p-6">
        <p className="text-sm text-[color:var(--foreground-muted)]">Select a lead to view the full profile.</p>
      </section>
    );
  }

  const canMoveStage = !isLeadConvertedToProspect(lead);

  return (
    <section className="panel overflow-hidden rounded-lg">
      <div className="border-b border-[color:var(--line)] p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--brand)]">Lead details</p>
            <h2 className="display-font mt-2 text-2xl font-semibold text-[color:var(--brand-strong)]">{lead.customerName || "Unnamed lead"}</h2>
            <p className="mt-2 text-sm text-[color:var(--foreground-muted)]">{lead.leadNo ?? "Lead number pending"}</p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <div className="flex flex-wrap items-center gap-2">
              {canMoveStage ? (
                <button className="btn-secondary inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold" onClick={() => onMoveStage(lead)} type="button">
                  <Send className="h-4 w-4" />
                  Move Stage
                </button>
              ) : null}
              <button className="btn-primary inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold" onClick={() => onEditLead(lead)} type="button">
                <Edit3 className="h-4 w-4" />
                Edit
              </button>
            </div>
            <StatusPill status={lead.status} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
        <DetailItem label="Mobile no" value={lead.mobileNo} />
        <DetailItem label="Customer code" value={lead.customerCode} />
        <DetailItem label="Customer type" value={lead.customerTypeName} />
        <DetailItem label="Contact person name" value={lead.contactPerson} />
        <DetailItem label="Email" value={lead.email} />
        <DetailItem label="Preferred contact" value={lead.preferredContactMethod} />
        <DetailItem label="Purpose" value={lead.purpose} />
        <DetailItem label="Qualification score" value={lead.qualificationScore === undefined ? undefined : String(lead.qualificationScore)} />
        <DetailItem label="Prospect no" value={prospect?.prospectNo} />
      </div>

      <div className="border-t border-[color:var(--line)] p-5 sm:p-6">
        <h3 className="text-sm font-semibold text-[color:var(--brand-strong)]">Qualification notes</h3>
        <p className="mt-3 min-h-24 rounded-lg border border-[color:var(--line)] bg-[color:var(--surface-muted)] p-4 text-sm leading-6 text-[color:var(--foreground-muted)]">
          {lead.qualificationNotes || "No qualification notes captured yet."}
        </p>
      </div>

      <div className="border-t border-[color:var(--line)] p-5 sm:p-6">
        <h3 className="text-sm font-semibold text-[color:var(--brand-strong)]">Pipeline stage</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          {["Lead", "Qualified", "Prospect"].map((stage) => {
            const reached = isStageReached(stage, lead, prospect);

            return (
              <div className="rounded-lg border p-3" key={stage} style={{ borderColor: reached ? "var(--brand-border)" : "var(--line)", background: reached ? "var(--brand-tint)" : "var(--surface-raised)" }}>
                <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: reached ? "var(--brand)" : "var(--foreground-subtle)" }}>
                  {stage}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function LeadCustomerEntryFields({
  customers,
  customerLookupLoading,
  customerLookupOpen,
  customerSearch,
  customerTypeOptions,
  leadForm,
  wide = false,
  onCustomerClear,
  onCustomerLookup,
  onCustomerSearchChange,
  onCustomerSelect,
  onLeadFormChange,
}: {
  customers: BusinessParty[];
  customerLookupLoading: boolean;
  customerLookupOpen: boolean;
  customerSearch: string;
  customerTypeOptions: ErpCodeValue[];
  leadForm: Lead;
  wide?: boolean;
  onCustomerClear: () => void;
  onCustomerLookup: (search?: string) => void;
  onCustomerSearchChange: (value: string) => void;
  onCustomerSelect: (customer: BusinessParty) => void;
  onLeadFormChange: (lead: Lead) => void;
}) {
  const spanClass = wide ? "md:col-span-2" : "";
  const hasSelectedCustomer = Boolean(leadForm.customerId);
  const customerTypeValue = leadForm.customerType === undefined ? "" : String(leadForm.customerType);

  return (
    <>
      <label className="grid gap-2 text-sm font-semibold text-[color:var(--brand-strong)]">
        Customer code
        <span className="flex gap-2">
          <input
            className="field min-w-0 flex-1 rounded-lg px-3 py-3 text-sm disabled:cursor-not-allowed disabled:bg-[color:var(--surface-muted)] disabled:text-[color:var(--foreground-muted)]"
            disabled
            placeholder="Auto generated"
            type="text"
            value={leadForm.customerCode ?? ""}
          />
          <button aria-label="Search customers" className="btn-secondary inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg" onClick={() => onCustomerLookup()} type="button">
            <Search className="h-4 w-4" />
          </button>
          <button aria-label="Clear customer" className="btn-secondary inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg" onClick={onCustomerClear} type="button">
            <X className="h-4 w-4" />
          </button>
        </span>
      </label>
      <Field label="Customer name" value={leadForm.customerName ?? ""} onChange={(value) => onLeadFormChange({ ...leadForm, customerName: value })} disabled={hasSelectedCustomer} required />

      {customerLookupOpen ? (
        <div className={`grid gap-3 rounded-lg border border-[color:var(--line)] bg-[color:var(--surface-muted)] p-4 ${spanClass}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[color:var(--brand-strong)]">Customer list</p>
              <p className="mt-1 text-xs font-medium text-[color:var(--foreground-muted)]">Filter and select an existing customer.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-lg bg-[color:var(--surface-raised)] px-3 py-2 text-xs font-semibold text-[color:var(--foreground-muted)]">
              {hasSelectedCustomer ? <UserCheck className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
              {hasSelectedCustomer ? "Existing customer" : "New customer"}
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--foreground-subtle)]" />
              <input
                className="field w-full rounded-lg py-3 pl-10 pr-3 text-sm"
                onChange={(event) => onCustomerSearchChange(event.target.value)}
                placeholder="Filter by name, phone, email, TRN, license or CR"
                type="search"
                value={customerSearch}
              />
            </label>
            <button className="btn-secondary inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold" onClick={() => onCustomerLookup()} type="button">
              {customerLookupLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Search
            </button>
          </div>
          <div className="grid max-h-60 gap-2 overflow-y-auto">
            {customerLookupLoading ? (
              <div className="flex items-center gap-2 rounded-lg border border-[color:var(--line)] bg-[color:var(--surface-raised)] px-4 py-3 text-sm text-[color:var(--foreground-muted)]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading customers...
              </div>
            ) : null}
            {!customerLookupLoading
              ? customers.map((businessParty) => (
                  <button
                    className="rounded-lg border border-[color:var(--line)] bg-[color:var(--surface-raised)] p-3 text-left text-sm transition hover:border-[color:var(--brand-border)] hover:bg-[color:var(--brand-tint)]"
                    key={businessParty.id}
                    onClick={() => onCustomerSelect(businessParty)}
                    type="button"
                  >
                    <p className="font-semibold text-[color:var(--brand-strong)]">{businessParty.name ?? businessParty.legalName}</p>
                    <p className="mt-1 text-[color:var(--foreground-muted)]">{[businessParty.externalId, businessParty.contactNumber, businessParty.email, businessParty.gstin].filter(Boolean).join(" | ")}</p>
                  </button>
                ))
              : null}
            {!customerLookupLoading && customers.length === 0 ? <p className="rounded-lg border border-dashed border-[color:var(--line-strong)] bg-[color:var(--surface-raised)] px-4 py-3 text-sm text-[color:var(--foreground-muted)]">No customer found for the current filter.</p> : null}
          </div>
        </div>
      ) : null}

      <CodeValueSelect
        label="Customer type"
        value={customerTypeValue}
        options={customerTypeOptions}
        onChange={(value) => {
          const selectedType = customerTypeOptions.find((option) => String(option.id) === value);
          onLeadFormChange({
            ...leadForm,
            customerType: numericOptionValue(value),
            customerTypeName: selectedType?.value,
          });
        }}
        disabled={hasSelectedCustomer}
      />
      <Field label="Mobile no" value={leadForm.mobileNo ?? ""} onChange={(value) => onLeadFormChange({ ...leadForm, mobileNo: value })} disabled={hasSelectedCustomer} required />
      <Field label="Email" type="email" value={leadForm.email ?? ""} onChange={(value) => onLeadFormChange({ ...leadForm, email: value })} disabled={hasSelectedCustomer} />
      <Select label="Preferred contact" value={leadForm.preferredContactMethod ?? "WhatsApp"} options={preferredContactOptions} onChange={(value) => onLeadFormChange({ ...leadForm, preferredContactMethod: value })} />
      <Select label="Purpose" value={leadForm.purpose ?? "RENT"} options={["RENT", "BUY", "INVEST"]} onChange={(value) => onLeadFormChange({ ...leadForm, purpose: value })} />
      <Field label="Contact person name" value={leadForm.contactPerson ?? ""} onChange={(value) => onLeadFormChange({ ...leadForm, contactPerson: value })} disabled={hasSelectedCustomer} />
    </>
  );
}

function StageMoveDialog({
  lead,
  notes,
  prospectDetails,
  customerTypeOptions,
  saving,
  score,
  target,
  onClose,
  onNotesChange,
  onProspectDetailsChange,
  onScoreChange,
  onSubmit,
  onTargetChange,
}: {
  lead: Lead | null;
  notes: string;
  prospectDetails: ProspectDetails;
  customerTypeOptions: ErpCodeValue[];
  saving: boolean;
  score: string;
  target: LeadStageTarget;
  onClose: () => void;
  onNotesChange: (value: string) => void;
  onProspectDetailsChange: (details: ProspectDetails) => void;
  onScoreChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onTargetChange: (value: LeadStageTarget) => void;
}) {
  if (!lead) {
    return null;
  }

  const needsQualification = target === "QUALIFIED";
  const needsProspectDetails = target === "CONVERTED_TO_PROSPECT";
  const needsCustomerDetails = needsProspectDetails && !lead.customerId;
  const cannotConvert = target === "CONVERTED_TO_PROSPECT" && lead.status !== "QUALIFIED";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button aria-label="Close stage popup" className="overlay-scrim absolute inset-0 h-full w-full" onClick={onClose} type="button" />
      <form className="page-surface relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-[color:var(--line-strong)] p-5 shadow-[0_28px_80px_rgba(15,23,42,0.24)] sm:p-6" onSubmit={onSubmit}>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--brand)]">Move stage</p>
        <h2 className="display-font mt-2 text-2xl font-semibold text-[color:var(--brand-strong)]">{lead.customerName}</h2>
        <p className="mt-2 text-sm text-[color:var(--foreground-muted)]">Current stage: {formatLabel(lead.status ?? "NEW")}</p>

        <div className="mt-5 grid gap-4">
          <Select label="Next stage" options={["QUALIFIED", "CONVERTED_TO_PROSPECT"]} value={target} onChange={(value) => onTargetChange(value as LeadStageTarget)} />

          {needsQualification ? (
            <>
              <Field label="Qualification score" type="number" value={score} onChange={onScoreChange} required />
              <label className="grid gap-2 text-sm font-semibold text-[color:var(--brand-strong)]">
                Qualification notes
                <textarea className="field min-h-28 rounded-lg px-3 py-3 text-sm" value={notes} onChange={(event) => onNotesChange(event.target.value)} />
              </label>
            </>
          ) : null}

          {needsCustomerDetails ? (
            <div className="grid gap-4 rounded-lg border border-[color:var(--line)] bg-[color:var(--surface-muted)] p-4 sm:grid-cols-2">
              <p className="text-sm font-semibold text-[color:var(--brand-strong)] sm:col-span-2">Customer details</p>
              <CodeValueSelect
                label="Customer type"
                value={prospectDetails.customerType === undefined ? "" : String(prospectDetails.customerType)}
                options={customerTypeOptions}
                onChange={(value) => {
                  const selectedType = customerTypeOptions.find((option) => String(option.id) === value);
                  onProspectDetailsChange({ ...prospectDetails, customerType: numericOptionValue(value), customerTypeName: selectedType?.value });
                }}
              />
              <Field
                label="Customer name"
                value={prospectDetails.customerName}
                onChange={(value) => onProspectDetailsChange({ ...prospectDetails, customerName: value })}
                required
              />
              <Field label="Trade license no" value={prospectDetails.tradeLicenseNo} onChange={(value) => onProspectDetailsChange({ ...prospectDetails, tradeLicenseNo: value })} />
              <Field label="CR number" value={prospectDetails.crNumber} onChange={(value) => onProspectDetailsChange({ ...prospectDetails, crNumber: value })} />
              <Field label="VAT registration no" value={prospectDetails.vatRegistrationNo} onChange={(value) => onProspectDetailsChange({ ...prospectDetails, vatRegistrationNo: value })} />
              <Field label="Contact person name" value={prospectDetails.contactPerson} onChange={(value) => onProspectDetailsChange({ ...prospectDetails, contactPerson: value })} />
              <Field label="Contact role" value={prospectDetails.contactRole} onChange={(value) => onProspectDetailsChange({ ...prospectDetails, contactRole: value })} />
              <Field label="Contact title" value={prospectDetails.contactTitle} onChange={(value) => onProspectDetailsChange({ ...prospectDetails, contactTitle: value })} />
              <Field label="Mobile no" value={prospectDetails.mobileNo} onChange={(value) => onProspectDetailsChange({ ...prospectDetails, mobileNo: value })} required />
              <Field label="Phone no" value={prospectDetails.phoneNo} onChange={(value) => onProspectDetailsChange({ ...prospectDetails, phoneNo: value })} />
              <Field label="Email" type="email" value={prospectDetails.email} onChange={(value) => onProspectDetailsChange({ ...prospectDetails, email: value })} />
              <Select
                label="Preferred contact"
                value={prospectDetails.preferredContactMethod}
                options={preferredContactOptions}
                onChange={(value) => onProspectDetailsChange({ ...prospectDetails, preferredContactMethod: value })}
              />
              <Field label="Fax no" value={prospectDetails.faxNo} onChange={(value) => onProspectDetailsChange({ ...prospectDetails, faxNo: value })} />
              <Field label="Source" value={prospectDetails.source} onChange={(value) => onProspectDetailsChange({ ...prospectDetails, source: value })} />
              <Select label="Purpose" value={prospectDetails.purpose} options={["RENT", "BUY", "INVEST"]} onChange={(value) => onProspectDetailsChange({ ...prospectDetails, purpose: value })} />
              <Field label="Commercial need" value={prospectDetails.commercialNeed} onChange={(value) => onProspectDetailsChange({ ...prospectDetails, commercialNeed: value })} />
              <label className="grid gap-2 text-sm font-semibold text-[color:var(--brand-strong)] sm:col-span-2">
                Address
                <textarea className="field min-h-20 rounded-lg px-3 py-3 text-sm" value={prospectDetails.address} onChange={(event) => onProspectDetailsChange({ ...prospectDetails, address: event.target.value })} />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-[color:var(--brand-strong)] sm:col-span-2">
                Document notes
                <textarea className="field min-h-24 rounded-lg px-3 py-3 text-sm" value={prospectDetails.documentNotes} onChange={(event) => onProspectDetailsChange({ ...prospectDetails, documentNotes: event.target.value })} />
              </label>
            </div>
          ) : null}

          {cannotConvert ? (
            <p className="rounded-lg bg-[color:var(--warning-soft)] px-4 py-3 text-sm font-semibold text-[color:var(--warning)]">
              This lead must be qualified before it can become a prospect.
            </p>
          ) : null}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button className="btn-secondary rounded-lg px-4 py-3 text-sm font-semibold" onClick={onClose} type="button">
            Cancel
          </button>
          <button className="btn-primary inline-flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold disabled:opacity-50" disabled={saving || cannotConvert} type="submit">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Move Stage
          </button>
        </div>
      </form>
    </div>
  );
}

function Notice({ tone, text }: { tone: "danger" | "success"; text: string }) {
  return <div className={`mx-4 mt-4 rounded-lg px-4 py-3 text-sm font-semibold xl:mx-6 ${tone === "danger" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{text}</div>;
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[color:var(--brand-strong)]">
      {label}
      <input
        className="field rounded-lg px-3 py-3 text-sm disabled:cursor-not-allowed disabled:bg-[color:var(--surface-muted)] disabled:text-[color:var(--foreground-muted)]"
        disabled={disabled}
        required={required}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function Select({ label, value, options, onChange, disabled = false }: { label: string; value: string; options: string[]; onChange: (value: string) => void; disabled?: boolean }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[color:var(--brand-strong)]">
      {label}
      <select className="field rounded-lg px-3 py-3 text-sm disabled:cursor-not-allowed disabled:bg-[color:var(--surface-muted)] disabled:text-[color:var(--foreground-muted)]" disabled={disabled} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {formatLabel(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

function CodeValueSelect({ label, value, options, onChange, disabled = false }: { label: string; value: string; options: ErpCodeValue[]; onChange: (value: string) => void; disabled?: boolean }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[color:var(--brand-strong)]">
      {label}
      <select className="field rounded-lg px-3 py-3 text-sm disabled:cursor-not-allowed disabled:bg-[color:var(--surface-muted)] disabled:text-[color:var(--foreground-muted)]" disabled={disabled} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Select {label.toLowerCase()}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.value}
          </option>
        ))}
      </select>
    </label>
  );
}

function SubmitButton({ saving, label, disabled = false }: { saving: boolean; label: string; disabled?: boolean }) {
  return (
    <button className="btn-primary inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold disabled:opacity-50" disabled={saving || disabled} type="submit">
      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      {label}
    </button>
  );
}

function DetailItem({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-lg border border-[color:var(--line)] bg-[color:var(--surface-raised)] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--foreground-muted)]">{label}</p>
      <p className="mt-2 text-sm font-semibold text-[color:var(--brand-strong)]">{value || "-"}</p>
    </div>
  );
}

function StatusPill({ status }: { status?: string }) {
  const label = status ? formatLabel(status) : "New";
  const tone = status === "QUALIFIED" || status === "CONVERTED" ? "pill-success" : status === "DISQUALIFIED" ? "pill-danger" : "pill-brand";

  return <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>{label}</span>;
}

function SmallPill({ label }: { label: string }) {
  return <span className="pill rounded-full px-3 py-1 text-xs font-semibold">{formatLabel(label)}</span>;
}

function customerTypeIdFromBusinessParty(businessParty: BusinessParty, customerTypes: ErpCodeValue[]) {
  const firmType = numericOptionValue(businessParty.typeOfFirm);
  if (firmType !== undefined) {
    return firmType;
  }
  const numericType = numericOptionValue(businessParty.type);
  if (numericType !== undefined) {
    return numericType;
  }
  const typeName = businessParty.typeOfBusinessName?.trim().toLowerCase();
  if (!typeName) {
    return undefined;
  }
  return customerTypes.find((option) => option.value.trim().toLowerCase() === typeName)?.id;
}

function numericOptionValue(value: unknown) {
  const numeric = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(numeric) && numeric > 0 ? numeric : undefined;
}

function isLeadConvertedToProspect(lead: Lead) {
  return lead.status === "CONVERTED_TO_PROSPECT";
}

function formatLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isStageReached(stage: string, lead: Lead, prospect: Prospect | null) {
  if (stage === "Lead") {
    return true;
  }
  if (stage === "Qualified") {
    return lead.status === "QUALIFIED" || Boolean(prospect);
  }
  if (stage === "Prospect") {
    return Boolean(prospect);
  }
  return false;
}
