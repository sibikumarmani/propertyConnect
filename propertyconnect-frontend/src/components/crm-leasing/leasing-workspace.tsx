"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Banknote,
  ClipboardCheck,
  FileText,
  HandCoins,
  Home,
  ListChecks,
  Loader2,
  MapPinned,
  RefreshCcw,
  Save,
  Search,
  Send,
  ShieldCheck,
  UserCheck,
  UserPlus,
  UsersRound,
} from "lucide-react";

import {
  approveReservation,
  confirmReservation,
  convertLeadToProspect,
  createLead,
  createNegotiation,
  createOffer,
  createReservation,
  createSiteVisit,
  createUnit,
  listLeads,
  listOffers,
  listProspects,
  listReservations,
  moveReservationToLease,
  qualifyLead,
  recordReservationPayment,
  reportSummary,
  saveRequirement,
  searchUnits,
  type Lead,
  type Offer,
  type Prospect,
  type ReportSummary,
  type Reservation,
  type Unit,
} from "@/lib/crm-leasing";

type Screen =
  | "leads"
  | "lead-entry"
  | "qualification"
  | "convert-prospect"
  | "prospect-profile"
  | "requirements"
  | "unit-search"
  | "site-visit"
  | "offers"
  | "negotiation"
  | "reservation-request"
  | "reservation-approval"
  | "reservation-payment"
  | "reservation-confirmation"
  | "reports";

type Props = {
  screen: Screen;
};

const screenMeta: Record<Screen, { title: string; subtitle: string; icon: typeof UserPlus }> = {
  leads: { title: "Lead List", subtitle: "Track leasing enquiries and their conversion status.", icon: UsersRound },
  "lead-entry": { title: "Lead Entry", subtitle: "Capture a new leasing enquiry with source and contact details.", icon: UserPlus },
  qualification: { title: "Lead Qualification", subtitle: "Score and qualify leads before prospect conversion.", icon: BadgeCheck },
  "convert-prospect": { title: "Convert to Prospect", subtitle: "Move qualified leads into the prospect pipeline.", icon: UserCheck },
  "prospect-profile": { title: "Prospect Profile", subtitle: "Review converted prospects and current CRM status.", icon: UsersRound },
  requirements: { title: "Requirement Capture", subtitle: "Record property, unit, budget, and move-in requirements.", icon: ClipboardCheck },
  "unit-search": { title: "Unit Search", subtitle: "Find available units and seed sample units for search.", icon: Search },
  "site-visit": { title: "Site Visit", subtitle: "Schedule unit showing and site visit appointments.", icon: MapPinned },
  offers: { title: "Quotation / Offer", subtitle: "Create offers; discounts and special terms trigger approval.", icon: FileText },
  negotiation: { title: "Negotiation", subtitle: "Record revised offer amounts and negotiation notes.", icon: HandCoins },
  "reservation-request": { title: "Reservation Request", subtitle: "Request reservation against prospect, offer, property, and unit.", icon: Home },
  "reservation-approval": { title: "Reservation Approval", subtitle: "Approve or reject reservations that require management review.", icon: ShieldCheck },
  "reservation-payment": { title: "Reservation Payment", subtitle: "Record reservation fee receipts or payment references.", icon: Banknote },
  "reservation-confirmation": { title: "Reservation Confirmation", subtitle: "Confirm reservation and move confirmed bookings to lease.", icon: ListChecks },
  reports: { title: "Reports", subtitle: "View leasing CRM summary and latest status history.", icon: FileText },
};

const initialLead: Lead = { customerName: "", mobileNo: "", email: "", source: "", purpose: "RENT" };

export function LeasingWorkspace({ screen }: Props) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [leadForm, setLeadForm] = useState<Lead>(initialLead);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const selectedLead = useMemo(() => leads.find((lead) => lead.id) ?? null, [leads]);
  const qualifiedLead = useMemo(() => leads.find((lead) => lead.status === "QUALIFIED") ?? selectedLead, [leads, selectedLead]);
  const selectedProspect = useMemo(() => prospects.find((prospect) => prospect.id) ?? null, [prospects]);
  const selectedOffer = useMemo(() => offers.find((offer) => offer.id) ?? null, [offers]);
  const selectedUnit = useMemo(() => units.find((unit) => unit.id) ?? null, [units]);
  const selectedReservation = useMemo(() => reservations.find((reservation) => reservation.id) ?? null, [reservations]);
  const meta = screenMeta[screen];
  const Icon = meta.icon;

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [loadedLeads, loadedProspects, loadedReservations, loadedOffers] = await Promise.all([listLeads(), listProspects(), listReservations(), listOffers()]);
      setLeads(loadedLeads);
      setProspects(loadedProspects);
      setReservations(loadedReservations);
      setOffers(loadedOffers);
      if (screen === "reports") {
        setSummary(await reportSummary());
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load CRM leasing data.");
    } finally {
      setLoading(false);
    }
  }, [screen]);

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
      await createLead(leadForm);
      setLeadForm(initialLead);
    }, "Lead created.");
  }

  return (
    <section className="page-surface min-h-[calc(100vh-6rem)] rounded-none border border-[color:var(--line-strong)] shadow-[0_28px_80px_rgba(24,50,71,0.12)]">
      <div className="border-b border-[color:var(--line)] px-5 py-5 sm:px-6 sm:py-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--brand)]">CRM leasing</p>
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

      <div className="grid gap-4 p-4 md:grid-cols-4 xl:p-6">
        <Metric label="Leads" value={String(leads.length)} caption="Captured enquiries" />
        <Metric label="Qualified" value={String(leads.filter((lead) => lead.status === "QUALIFIED").length)} caption="Ready to convert" />
        <Metric label="Prospects" value={String(prospects.length)} caption="Active pipeline" />
        <Metric label="Reservations" value={String(reservations.length)} caption="Requests and bookings" />
      </div>

      <div className="grid gap-4 px-4 pb-6 xl:grid-cols-[minmax(0,1fr)_380px] xl:px-6">
        <main className="grid gap-4">
          {loading ? (
            <div className="panel flex items-center gap-2 rounded-lg p-5 text-sm text-[color:var(--foreground-muted)]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading leasing workspace...
            </div>
          ) : null}

          {screen === "lead-entry" ? (
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
          ) : null}

          {screen === "qualification" ? (
            <ActionPanel
              title="Qualify selected lead"
              description={qualifiedLead ? `${qualifiedLead.customerName} (${qualifiedLead.leadNo})` : "Create a lead first."}
              actionLabel="Qualify Lead"
              disabled={!qualifiedLead?.id || saving}
              onClick={() =>
                qualifiedLead?.id &&
                run(() => qualifyLead(qualifiedLead.id!, { score: 80, notes: "Budget, timeline, and contact verified." }), "Lead qualified.")
              }
            />
          ) : null}

          {screen === "convert-prospect" ? (
            <ActionPanel
              title="Convert qualified lead"
              description={qualifiedLead ? `${qualifiedLead.customerName} is ${qualifiedLead.status}` : "No qualified lead found."}
              actionLabel="Convert to Prospect"
              disabled={!qualifiedLead?.id || qualifiedLead.status !== "QUALIFIED" || saving}
              onClick={() => qualifiedLead?.id && run(() => convertLeadToProspect(qualifiedLead.id!), "Lead converted to prospect.")}
            />
          ) : null}

          {screen === "requirements" ? (
            <ActionPanel
              title="Capture requirement"
              description={selectedProspect ? `${selectedProspect.customerName} needs an Apartment unit.` : "Convert a lead to prospect first."}
              actionLabel="Save Requirement"
              disabled={!selectedProspect?.id || saving}
              onClick={() =>
                selectedProspect?.id &&
                run(
                  () =>
                    saveRequirement({
                      prospectId: selectedProspect.id,
                      propertyId: 1001,
                      propertyName: "Downtown Residences",
                      unitType: "Apartment",
                      bedrooms: 2,
                      budgetFrom: 90000,
                      budgetTo: 140000,
                      moveInDate: new Date().toISOString().slice(0, 10),
                      notes: "Prefers high floor and covered parking.",
                    }),
                  "Requirement captured.",
                )
              }
            />
          ) : null}

          {screen === "unit-search" ? (
            <div className="grid gap-4">
              <ActionPanel
                title="Seed available sample unit"
                description="Creates a sample AVAILABLE unit for search and reservation testing."
                actionLabel="Create Sample Unit"
                disabled={saving}
                onClick={() =>
                  run(
                    () =>
                      createUnit({
                        propertyId: 1001,
                        propertyName: "Downtown Residences",
                        unitCode: `A-${Math.floor(Math.random() * 900 + 100)}`,
                        unitType: "Apartment",
                        bedrooms: 2,
                        askingRent: 125000,
                        status: "AVAILABLE",
                      }),
                    "Sample unit created.",
                  )
                }
              />
              <ActionPanel
                title="Search available units"
                description="Only units with AVAILABLE status are returned by the backend."
                actionLabel="Search Units"
                disabled={saving}
                onClick={() =>
                  run(async () => {
                    setUnits(await searchUnits({ propertyId: 1001, unitType: "Apartment", bedrooms: 2, budgetTo: 140000 }));
                  }, "Available units loaded.")
                }
              />
            </div>
          ) : null}

          {screen === "site-visit" ? (
            <ActionPanel
              title="Schedule site visit"
              description={selectedProspect && selectedUnit ? `${selectedProspect.customerName} visiting ${selectedUnit.unitCode}` : "Search an available unit first."}
              actionLabel="Schedule Visit"
              disabled={!selectedProspect?.id || !selectedUnit?.id || saving}
              onClick={() =>
                selectedProspect?.id &&
                selectedUnit?.id &&
                run(
                  () =>
                    createSiteVisit({
                      prospectId: selectedProspect.id,
                      unitId: selectedUnit.id,
                      visitAt: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
                      notes: "Client requested evening viewing.",
                    }),
                  "Site visit scheduled.",
                )
              }
            />
          ) : null}

          {screen === "offers" ? (
            <ActionPanel
              title="Create quotation"
              description={selectedProspect && selectedUnit ? "Discounts or special terms trigger approval." : "Need prospect and available unit."}
              actionLabel="Create Offer"
              disabled={!selectedProspect?.id || !selectedUnit?.id || saving}
              onClick={() =>
                selectedProspect?.id &&
                selectedUnit?.id &&
                run(
                  () =>
                    createOffer({
                      prospectId: selectedProspect.id,
                      unitId: selectedUnit.id,
                      baseAmount: 125000,
                      discountAmount: 5000,
                      specialTerms: "Two cheque payment plan.",
                    }),
                  "Offer created.",
                )
              }
            />
          ) : null}

          {screen === "negotiation" ? (
            <ActionPanel
              title="Record negotiation"
              description={selectedOffer ? `Negotiating ${selectedOffer.offerNo}` : "Create an offer first."}
              actionLabel="Record Negotiation"
              disabled={!selectedOffer?.id || saving}
              onClick={() => selectedOffer?.id && run(() => createNegotiation({ offerId: selectedOffer.id, proposedAmount: 118000, notes: "Customer counter-offer." }), "Negotiation recorded.")}
            />
          ) : null}

          {screen === "reservation-request" ? (
            <ActionPanel
              title="Create reservation request"
              description={selectedProspect && selectedOffer ? "Prevents duplicate active unit reservations." : "Need prospect and offer."}
              actionLabel="Request Reservation"
              disabled={!selectedProspect?.id || !selectedOffer?.id || saving}
              onClick={() =>
                selectedProspect?.id &&
                selectedOffer?.id &&
                run(
                  () =>
                    createReservation({
                      prospectId: selectedProspect.id,
                      offerId: selectedOffer.id,
                      reservationFee: 5000,
                      paymentWaived: false,
                      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
                    }),
                  "Reservation requested.",
                )
              }
            />
          ) : null}

          {screen === "reservation-approval" ? (
            <ActionPanel
              title="Approve reservation"
              description={selectedReservation ? `${selectedReservation.reservationNo} is ${selectedReservation.status}` : "No reservation selected."}
              actionLabel="Approve"
              disabled={!selectedReservation?.id || selectedReservation.status !== "PENDING_APPROVAL" || saving}
              onClick={() => selectedReservation?.id && run(() => approveReservation(selectedReservation.id!, { approved: true, comments: "Approved." }), "Reservation approved.")}
            />
          ) : null}

          {screen === "reservation-payment" ? (
            <ActionPanel
              title="Record reservation fee"
              description={selectedReservation ? `${selectedReservation.reservationNo} balance ${selectedReservation.reservationFee ?? 0}` : "No reservation selected."}
              actionLabel="Record Payment"
              disabled={!selectedReservation?.id || saving}
              onClick={() =>
                selectedReservation?.id &&
                run(
                  () =>
                    recordReservationPayment(selectedReservation.id!, {
                      amount: selectedReservation.reservationFee ?? 5000,
                      paymentMethod: "CARD",
                      paidAt: new Date().toISOString().slice(0, 16),
                    }),
                  "Payment recorded.",
                )
              }
            />
          ) : null}

          {screen === "reservation-confirmation" ? (
            <div className="grid gap-4">
              <ActionPanel
                title="Confirm reservation"
                description="Confirmation sets the unit status to RESERVED."
                actionLabel="Confirm"
                disabled={!selectedReservation?.id || saving}
                onClick={() => selectedReservation?.id && run(() => confirmReservation(selectedReservation.id!), "Reservation confirmed.")}
              />
              <ActionPanel
                title="Move to lease / booking / contract"
                description="Moves a confirmed reservation to the contract process."
                actionLabel="Move to Lease"
                disabled={!selectedReservation?.id || selectedReservation.status !== "CONFIRMED" || saving}
                onClick={() => selectedReservation?.id && run(() => moveReservationToLease(selectedReservation.id!), "Reservation moved to lease process.")}
              />
            </div>
          ) : null}

          {screen === "reports" ? <ReportsPanel summary={summary} /> : null}

          {screen === "leads" || screen === "prospect-profile" ? null : null}

          <DataTable title="Leads" rows={leads} columns={["leadNo", "customerName", "mobileNo", "purpose", "status"]} />
          <DataTable title="Prospects" rows={prospects} columns={["prospectNo", "customerName", "mobileNo", "status"]} />
          <DataTable title="Available Units" rows={units} columns={["propertyName", "unitCode", "unitType", "askingRent", "status"]} />
          <DataTable title="Offers" rows={offers} columns={["offerNo", "prospectId", "unitId", "finalAmount", "approvalRequired", "status"]} />
          <DataTable title="Reservations" rows={reservations} columns={["reservationNo", "status", "approvalStatus", "reservationFee", "paidAmount"]} />
        </main>

        <aside className="grid content-start gap-4">
          <RuleCard />
          <ProcessCard />
        </aside>
      </div>
    </section>
  );
}

function Metric({ label, value, caption }: { label: string; value: string; caption: string }) {
  return (
    <article className="panel rounded-lg p-5">
      <p className="text-sm font-medium text-[color:var(--foreground-muted)]">{label}</p>
      <p className="display-font mt-2 text-3xl font-semibold text-[color:var(--brand-strong)]">{value}</p>
      <p className="mt-3 text-sm text-[color:var(--foreground-muted)]">{caption}</p>
    </article>
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

function ActionPanel({ title, description, actionLabel, disabled, onClick }: { title: string; description: string; actionLabel: string; disabled: boolean; onClick: () => void }) {
  return (
    <section className="panel rounded-lg p-5">
      <h2 className="display-font text-xl font-semibold text-[color:var(--brand-strong)]">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[color:var(--foreground-muted)]">{description}</p>
      <button className="btn-primary mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold disabled:opacity-50" disabled={disabled} onClick={onClick} type="button">
        <Send className="h-4 w-4" />
        {actionLabel}
      </button>
    </section>
  );
}

function DataTable({ title, rows, columns }: { title: string; rows: unknown[]; columns: string[] }) {
  return (
    <section className="panel overflow-hidden rounded-lg">
      <div className="border-b border-[color:var(--line)] p-5">
        <h2 className="display-font text-xl font-semibold text-[color:var(--brand-strong)]">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-[color:var(--surface-muted)] text-xs uppercase tracking-[0.16em] text-[color:var(--foreground-muted)]">
            <tr>
              {columns.map((column) => (
                <th className="px-5 py-3 font-semibold" key={column}>
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--line)]">
            {rows.length === 0 ? (
              <tr>
                <td className="px-5 py-4 text-[color:var(--foreground-muted)]" colSpan={columns.length}>
                  No records yet.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => {
                const record = row as Record<string, unknown>;
                return (
                <tr key={`${title}-${index}`}>
                  {columns.map((column) => (
                    <td className="px-5 py-4 text-[color:var(--foreground)]" key={column}>
                      {String(record[column] ?? "-")}
                    </td>
                  ))}
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ReportsPanel({ summary }: { summary: ReportSummary | null }) {
  if (!summary) {
    return <ActionPanel title="Reports list" description="Refresh the page to load report data." actionLabel="Waiting" disabled onClick={() => undefined} />;
  }
  return (
    <section className="panel rounded-lg p-5">
      <h2 className="display-font text-xl font-semibold text-[color:var(--brand-strong)]">Reports list</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Metric label="Lead pipeline report" value={String(summary.leads)} caption="Total leasing leads" />
        <Metric label="Qualified leads report" value={String(summary.qualifiedLeads)} caption="Ready for prospect conversion" />
        <Metric label="Reservation report" value={String(summary.activeReservations)} caption="Active approvals and payments" />
        <Metric label="Confirmed reservation report" value={String(summary.confirmedReservations)} caption="Units reserved" />
      </div>
    </section>
  );
}

function RuleCard() {
  const rules = [
    "Only qualified leads convert to prospects.",
    "Only AVAILABLE units can be selected.",
    "One active reservation per unit.",
    "Discounts and special terms trigger approval.",
    "Confirmation requires approval and payment or waiver.",
  ];
  return (
    <section className="panel rounded-lg p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--brand)]">Business rules</p>
      <div className="mt-4 grid gap-3">
        {rules.map((rule) => (
          <div className="flex gap-2 text-sm text-[color:var(--foreground-muted)]" key={rule}>
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[color:var(--brand)]" />
            {rule}
          </div>
        ))}
      </div>
    </section>
  );
}

function ProcessCard() {
  return (
    <section className="panel rounded-lg p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--brand)]">Process</p>
      <p className="mt-3 text-sm leading-7 text-[color:var(--foreground-muted)]">
        Lead, qualify, convert, capture requirements, search unit, visit, offer, negotiate, reserve, approve, collect fee, confirm, then move to lease.
      </p>
    </section>
  );
}
