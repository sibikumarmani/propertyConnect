"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { BadgeCheck, Edit3, Home, Loader2, Plus, RefreshCcw, Save, Search, Send, UserCheck, UserPlus, UsersRound, type LucideIcon } from "lucide-react";

import { WorkspaceDrawer } from "@/components/layout/workspace-drawer";
import { convertLeadToProspect, createLead, listLeads, qualifyLead, updateLead, type Lead, type LeadStageTarget } from "@/lib/lead";
import { listProspects, listReservations, type Prospect, type Reservation } from "@/lib/prospect";

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
  customerName: string;
  mobileNo: string;
  email: string;
};

const initialLead: Lead = { customerName: "", mobileNo: "", email: "", source: "", purpose: "RENT" };
const initialLeadStageTarget: LeadStageTarget = "QUALIFIED";

const leadScreenMeta: Record<LeadScreen, { title: string; subtitle: string; icon: typeof UserPlus }> = {
  leads: { title: "Lead List", subtitle: "Track leasing enquiries and their conversion status.", icon: UsersRound },
  "lead-entry": { title: "Lead Entry", subtitle: "Capture a new leasing enquiry with source and contact details.", icon: UserPlus },
};

export function LeadWorkspace({ screen }: { screen: LeadScreen }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [leadForm, setLeadForm] = useState<Lead>(initialLead);
  const [leadDrawerMode, setLeadDrawerMode] = useState<LeadDrawerMode>(null);
  const [stageLead, setStageLead] = useState<Lead | null>(null);
  const [stageTarget, setStageTarget] = useState<LeadStageTarget>(initialLeadStageTarget);
  const [stageScore, setStageScore] = useState("80");
  const [stageNotes, setStageNotes] = useState("");
  const [stageProspectDetails, setStageProspectDetails] = useState<ProspectDetails>({ customerName: "", mobileNo: "", email: "" });
  const [leadSearch, setLeadSearch] = useState("");
  const [leadStatusFilter, setLeadStatusFilter] = useState("ALL");
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
        [lead.leadNo, lead.customerName, lead.mobileNo, lead.email, lead.source, lead.purpose, lead.status].some((value) => String(value ?? "").toLowerCase().includes(query));

      return matchesStatus && matchesQuery;
    });
  }, [leadSearch, leadStatusFilter, leads]);
  const leadStageCards = useMemo<LeadStageCard[]>(
    () => [
      { label: "New leads", value: leads.filter((lead) => !lead.status || lead.status === "NEW").length, caption: "Fresh enquiries", icon: UserPlus },
      { label: "Qualified", value: leads.filter((lead) => lead.status === "QUALIFIED").length, caption: "Ready to convert", icon: BadgeCheck },
      { label: "Prospects", value: prospects.length, caption: "Converted pipeline", icon: UserCheck },
      { label: "Reserved", value: reservations.length, caption: "Active requests", icon: Home },
    ],
    [leads, prospects.length, reservations.length],
  );
  const meta = leadScreenMeta[screen];
  const Icon = meta.icon;

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [loadedLeads, loadedProspects, loadedReservations] = await Promise.all([listLeads(), listProspects(), listReservations()]);
      setLeads(loadedLeads);
      setProspects(loadedProspects);
      setReservations(loadedReservations);
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
      setLeadDrawerMode(null);
    }, leadDrawerMode === "edit" ? "Lead updated." : "Lead created.");
  }

  function openCreateLead() {
    setLeadForm(initialLead);
    setLeadDrawerMode("create");
  }

  function openEditLead(lead: Lead) {
    setLeadForm({ ...lead, purpose: lead.purpose ?? "RENT" });
    setLeadDrawerMode("edit");
  }

  function openMoveStage(lead: Lead) {
    setStageLead(lead);
    setStageTarget(lead.status === "QUALIFIED" ? "CONVERTED_TO_PROSPECT" : "QUALIFIED");
    setStageScore(String(lead.qualificationScore ?? 80));
    setStageNotes(lead.qualificationNotes ?? "");
    setStageProspectDetails({ customerName: lead.customerName ?? "", mobileNo: lead.mobileNo ?? "", email: lead.email ?? "" });
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
        await updateLead(stageLead.id!, {
          ...stageLead,
          customerName: stageProspectDetails.customerName,
          mobileNo: stageProspectDetails.mobileNo,
          email: stageProspectDetails.email,
        });
        await convertLeadToProspect(stageLead.id!);
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
            <Field label="Customer name" value={leadForm.customerName} onChange={(value) => setLeadForm({ ...leadForm, customerName: value })} required />
            <Field label="Mobile no" value={leadForm.mobileNo} onChange={(value) => setLeadForm({ ...leadForm, mobileNo: value })} required />
            <Field label="Email" type="email" value={leadForm.email ?? ""} onChange={(value) => setLeadForm({ ...leadForm, email: value })} />
            <Field label="Source" value={leadForm.source ?? ""} onChange={(value) => setLeadForm({ ...leadForm, source: value })} />
            <Select label="Purpose" value={leadForm.purpose ?? "RENT"} options={["RENT", "BUY", "INVEST"]} onChange={(value) => setLeadForm({ ...leadForm, purpose: value })} />
            <div className="flex items-end">
              <SubmitButton saving={saving} label="Save Lead" />
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
      <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-4 xl:p-6">
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
                  className="rounded-lg border p-4 text-left transition hover:border-[color:var(--brand-border)] hover:bg-[color:var(--brand-tint)]"
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
                        <p className="mt-1 text-xs font-medium text-[color:var(--foreground-muted)]">{lead.leadNo ?? "Lead number pending"}</p>
                      </div>
                      <StatusPill status={lead.status} />
                    </div>
                    <div className="mt-4 grid gap-2 text-sm text-[color:var(--foreground-muted)]">
                      <p>{lead.mobileNo || "-"}</p>
                      <p>{lead.email || "Email not captured"}</p>
                    </div>
                  </button>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <SmallPill label={lead.purpose ?? "Purpose pending"} />
                    <SmallPill label={lead.source ?? "Source pending"} />
                    <button className="btn-secondary ml-auto inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold" onClick={() => onMoveStage(lead)} type="button">
                      <Send className="h-3.5 w-3.5" />
                      Stage
                    </button>
                    <button className="btn-secondary inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold" onClick={() => onEditLead(lead)} type="button">
                      <Edit3 className="h-3.5 w-3.5" />
                      Edit
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <LeadDetailPanel lead={selectedLead} prospect={selectedLeadProspect} onEditLead={onEditLead} onMoveStage={onMoveStage} />
      </div>

      <WorkspaceDrawer eyebrow="Lead" open={leadDrawerMode !== null} title={leadDrawerMode === "edit" ? "Edit lead" : "Create lead"} onClose={onCloseLeadDrawer}>
        <form className="grid gap-4" onSubmit={onSubmitLead}>
          <Field label="Customer name" value={leadForm.customerName} onChange={(value) => onLeadFormChange({ ...leadForm, customerName: value })} required />
          <Field label="Mobile no" value={leadForm.mobileNo} onChange={(value) => onLeadFormChange({ ...leadForm, mobileNo: value })} required />
          <Field label="Email" type="email" value={leadForm.email ?? ""} onChange={(value) => onLeadFormChange({ ...leadForm, email: value })} />
          <Field label="Source" value={leadForm.source ?? ""} onChange={(value) => onLeadFormChange({ ...leadForm, source: value })} />
          <Select label="Purpose" value={leadForm.purpose ?? "RENT"} options={["RENT", "BUY", "INVEST"]} onChange={(value) => onLeadFormChange({ ...leadForm, purpose: value })} />
          <div className="flex items-center justify-end gap-3 pt-2">
            <button className="btn-secondary rounded-lg px-4 py-3 text-sm font-semibold" onClick={onCloseLeadDrawer} type="button">
              Cancel
            </button>
            <SubmitButton saving={saving} label={leadDrawerMode === "edit" ? "Update Lead" : "Save Lead"} />
          </div>
        </form>
      </WorkspaceDrawer>

      <StageMoveDialog
        lead={stageLead}
        notes={stageNotes}
        prospectDetails={stageProspectDetails}
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
              <button className="btn-secondary inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold" onClick={() => onMoveStage(lead)} type="button">
                <Send className="h-4 w-4" />
                Move Stage
              </button>
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
        <DetailItem label="Email" value={lead.email} />
        <DetailItem label="Source" value={lead.source} />
        <DetailItem label="Purpose" value={lead.purpose} />
        <DetailItem label="Qualification score" value={lead.qualificationScore === undefined ? undefined : String(lead.qualificationScore)} />
        <DetailItem label="Prospect no" value={prospect?.prospectNo} />
        <DetailItem label="Company id" value={lead.companyId === undefined ? undefined : String(lead.companyId)} />
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
          {["Lead", "Qualified", "Prospect", "Reservation"].map((stage) => {
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

function StageMoveDialog({
  lead,
  notes,
  prospectDetails,
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
  const cannotConvert = target === "CONVERTED_TO_PROSPECT" && lead.status !== "QUALIFIED";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button aria-label="Close stage popup" className="overlay-scrim absolute inset-0 h-full w-full" onClick={onClose} type="button" />
      <form className="page-surface relative w-full max-w-lg rounded-lg border border-[color:var(--line-strong)] p-5 shadow-[0_28px_80px_rgba(15,23,42,0.24)] sm:p-6" onSubmit={onSubmit}>
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

          {needsProspectDetails ? (
            <div className="grid gap-4 rounded-lg border border-[color:var(--line)] bg-[color:var(--surface-muted)] p-4">
              <p className="text-sm font-semibold text-[color:var(--brand-strong)]">Prospect details</p>
              <Field
                label="Customer name"
                value={prospectDetails.customerName}
                onChange={(value) => onProspectDetailsChange({ ...prospectDetails, customerName: value })}
                required
              />
              <Field label="Mobile no" value={prospectDetails.mobileNo} onChange={(value) => onProspectDetailsChange({ ...prospectDetails, mobileNo: value })} required />
              <Field label="Email" type="email" value={prospectDetails.email} onChange={(value) => onProspectDetailsChange({ ...prospectDetails, email: value })} />
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

function Field({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[color:var(--brand-strong)]">
      {label}
      <input className="field rounded-lg px-3 py-3 text-sm" required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[color:var(--brand-strong)]">
      {label}
      <select className="field rounded-lg px-3 py-3 text-sm" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function SubmitButton({ saving, label }: { saving: boolean; label: string }) {
  return (
    <button className="btn-primary inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold disabled:opacity-50" disabled={saving} type="submit">
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
