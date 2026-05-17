"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Edit3, Loader2, Plus, RefreshCcw, Save, Search, Send, UserCheck, UsersRound, type LucideIcon } from "lucide-react";

import { WorkspaceDrawer } from "@/components/layout/workspace-drawer";
import {
  approveProspectReservation,
  cancelProspectReservation,
  confirmProspectReservation,
  expireProspectReservation,
  listProspectRequirements,
  listProspectOffers,
  listProspectReservations,
  listProspectSiteVisits,
  listProspects,
  moveProspectReservationToLease,
  recordProspectReservationPayment,
  saveProspectNegotiation,
  saveProspectOffer,
  saveProspectReservation,
  saveProspectRequirement,
  saveProspectSiteVisit,
  updateProspectOffer,
  updateProspectRequirement,
  updateProspectSiteVisit,
  type Prospect,
  type ProspectNegotiation,
  type ProspectOffer,
  type ProspectReservation,
  type ProspectRequirement,
  type ProspectSiteVisit,
} from "@/lib/prospect";

export type ProspectScreen = "prospects";

type ProspectStageCard = {
  label: string;
  value: number;
  caption: string;
  icon: LucideIcon;
};

type ProspectBoardProps = {
  filteredProspects: Prospect[];
  loading: boolean;
  prospectSearch: string;
  prospectStageCards: ProspectStageCard[];
  prospectStatusFilter: string;
  prospectStatuses: string[];
  requirements: ProspectRequirement[];
  offers: ProspectOffer[];
  reservations: ProspectReservation[];
  selectedProspect: Prospect | null;
  siteVisits: ProspectSiteVisit[];
  onProspectSearchChange: (value: string) => void;
  onProspectStatusFilterChange: (value: string) => void;
  onCreateRequirement: () => void;
  onCreateOffer: () => void;
  onCreateSiteVisit: () => void;
  onCreateNegotiation: (offer: ProspectOffer) => void;
  onCreateReservation: (offer?: ProspectOffer) => void;
  onReservationAction: (reservation: ProspectReservation, action: ReservationAction) => void;
  onSelectOffer: (offer: ProspectOffer) => void;
  onSelectProspect: (prospect: Prospect) => void;
  onSelectRequirement: (requirement: ProspectRequirement) => void;
  onSelectSiteVisit: (siteVisit: ProspectSiteVisit) => void;
};

type RequirementForm = {
  id?: number;
  propertyId: string;
  propertyName: string;
  unitType: string;
  bedrooms: string;
  budgetFrom: string;
  budgetTo: string;
  moveInDate: string;
  notes: string;
};

const initialRequirementForm: RequirementForm = {
  propertyId: "",
  propertyName: "",
  unitType: "Apartment",
  bedrooms: "",
  budgetFrom: "",
  budgetTo: "",
  moveInDate: "",
  notes: "",
};

type SiteVisitForm = {
  id?: number;
  unitId: string;
  visitAt: string;
  status: string;
  notes: string;
};

const initialSiteVisitForm: SiteVisitForm = {
  unitId: "",
  visitAt: "",
  status: "SCHEDULED",
  notes: "",
};

type OfferForm = {
  id?: number;
  unitId: string;
  baseAmount: string;
  discountAmount: string;
  finalAmount: string;
  specialTerms: string;
  status: string;
};

const initialOfferForm: OfferForm = {
  unitId: "",
  baseAmount: "",
  discountAmount: "",
  finalAmount: "",
  specialTerms: "",
  status: "SENT",
};

type NegotiationForm = {
  offerId?: number;
  proposedAmount: string;
  notes: string;
};

type ReservationAction = "approve" | "reject" | "payment" | "confirm" | "cancel" | "expire" | "move";

type ReservationForm = {
  offerId: string;
  reservationFee: string;
  paymentWaived: boolean;
  expiresAt: string;
};

const initialReservationForm: ReservationForm = {
  offerId: "",
  reservationFee: "",
  paymentWaived: false,
  expiresAt: "",
};

type PaymentForm = {
  reservationId?: number;
  amount: string;
  paymentMethod: string;
  paidAt: string;
};

const initialPaymentForm: PaymentForm = {
  amount: "",
  paymentMethod: "CARD",
  paidAt: "",
};

const initialNegotiationForm: NegotiationForm = {
  proposedAmount: "",
  notes: "",
};

const prospectScreenMeta: Record<ProspectScreen, { title: string; subtitle: string; icon: typeof UserCheck }> = {
  prospects: { title: "Prospect List", subtitle: "Review converted prospects and move them through the leasing stages.", icon: UserCheck },
};

export function ProspectWorkspace({ screen }: { screen: ProspectScreen }) {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [prospectSearch, setProspectSearch] = useState("");
  const [prospectStatusFilter, setProspectStatusFilter] = useState("ALL");
  const [selectedProspectId, setSelectedProspectId] = useState<number | null>(null);
  const [requirements, setRequirements] = useState<ProspectRequirement[]>([]);
  const [siteVisits, setSiteVisits] = useState<ProspectSiteVisit[]>([]);
  const [offers, setOffers] = useState<ProspectOffer[]>([]);
  const [reservations, setReservations] = useState<ProspectReservation[]>([]);
  const [requirementForm, setRequirementForm] = useState<RequirementForm>(initialRequirementForm);
  const [siteVisitForm, setSiteVisitForm] = useState<SiteVisitForm>(initialSiteVisitForm);
  const [offerForm, setOfferForm] = useState<OfferForm>(initialOfferForm);
  const [negotiationForm, setNegotiationForm] = useState<NegotiationForm>(initialNegotiationForm);
  const [reservationForm, setReservationForm] = useState<ReservationForm>(initialReservationForm);
  const [paymentForm, setPaymentForm] = useState<PaymentForm>(initialPaymentForm);
  const [requirementDrawerOpen, setRequirementDrawerOpen] = useState(false);
  const [siteVisitDrawerOpen, setSiteVisitDrawerOpen] = useState(false);
  const [offerDrawerOpen, setOfferDrawerOpen] = useState(false);
  const [negotiationDrawerOpen, setNegotiationDrawerOpen] = useState(false);
  const [reservationDrawerOpen, setReservationDrawerOpen] = useState(false);
  const [paymentDrawerOpen, setPaymentDrawerOpen] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingRequirement, setSavingRequirement] = useState(false);
  const [savingSiteVisit, setSavingSiteVisit] = useState(false);
  const [savingOffer, setSavingOffer] = useState(false);
  const [savingNegotiation, setSavingNegotiation] = useState(false);
  const [savingReservation, setSavingReservation] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);

  const selectedProspect = useMemo(
    () => prospects.find((prospect) => (selectedProspectId ? prospect.id === selectedProspectId : prospect.id)) ?? null,
    [prospects, selectedProspectId],
  );
  const prospectStatuses = useMemo(() => ["ALL", ...Array.from(new Set(prospects.flatMap((prospect) => (prospect.status ? [prospect.status] : []))))], [prospects]);
  const approvedOffers = useMemo(() => offers.filter((offer) => offer.status === "APPROVED"), [offers]);
  const filteredProspects = useMemo(() => {
    const query = prospectSearch.trim().toLowerCase();

    return prospects.filter((prospect) => {
      const matchesStatus = prospectStatusFilter === "ALL" || prospect.status === prospectStatusFilter;
      const matchesQuery =
        !query ||
        [prospect.prospectNo, prospect.customerName, prospect.mobileNo, prospect.email, prospect.status].some((value) => String(value ?? "").toLowerCase().includes(query));

      return matchesStatus && matchesQuery;
    });
  }, [prospectSearch, prospectStatusFilter, prospects]);
  const prospectStageCards = useMemo<ProspectStageCard[]>(
    () => [
      { label: "Prospects", value: prospects.length, caption: "Converted pipeline", icon: UserCheck },
      { label: "Active", value: prospects.filter((prospect) => prospect.status === "ACTIVE").length, caption: "Ready for requirements", icon: UsersRound },
      { label: "Reserved", value: prospects.filter((prospect) => prospect.status === "RESERVED").length, caption: "Reservation in progress", icon: Send },
      { label: "Lease process", value: prospects.filter((prospect) => prospect.status === "LEASE_PROCESS").length, caption: "Moved to contract", icon: Send },
    ],
    [prospects],
  );
  const meta = prospectScreenMeta[screen];
  const Icon = meta.icon;

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const loadedProspects = await listProspects();
      setProspects(loadedProspects);
      setSelectedProspectId((currentId) => {
        if (currentId && loadedProspects.some((prospect) => prospect.id === currentId)) {
          return currentId;
        }
        return loadedProspects.find((prospect) => prospect.id)?.id ?? null;
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load prospect data.");
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

  const loadRequirements = useCallback(async (prospectId?: number) => {
    if (!prospectId) {
      setRequirements([]);
      setSiteVisits([]);
      setOffers([]);
      setReservations([]);
      setRequirementForm(initialRequirementForm);
      setSiteVisitForm(initialSiteVisitForm);
      setOfferForm(initialOfferForm);
      setNegotiationForm(initialNegotiationForm);
      setReservationForm(initialReservationForm);
      setPaymentForm(initialPaymentForm);
      setRequirementDrawerOpen(false);
      setSiteVisitDrawerOpen(false);
      setOfferDrawerOpen(false);
      setNegotiationDrawerOpen(false);
      setReservationDrawerOpen(false);
      setPaymentDrawerOpen(false);
      return;
    }
    try {
      const [loadedRequirements, loadedSiteVisits, loadedOffers, loadedReservations] = await Promise.all([
        listProspectRequirements(prospectId),
        listProspectSiteVisits(prospectId),
        listProspectOffers(prospectId),
        listProspectReservations(prospectId),
      ]);
      setRequirements(loadedRequirements);
      setSiteVisits(loadedSiteVisits);
      setOffers(loadedOffers);
      setReservations(loadedReservations);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load prospect activity.");
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadRequirements(selectedProspect?.id);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadRequirements, selectedProspect?.id]);

  async function submitRequirement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProspect?.id) {
      return;
    }

    setSavingRequirement(true);
    setError("");
    setMessage("");
    try {
      const payload = formToRequirement(requirementForm, selectedProspect.id);
      if (requirementForm.id) {
        await updateProspectRequirement(requirementForm.id, payload);
        setMessage("Requirement updated.");
      } else {
        await saveProspectRequirement(payload);
        setMessage("Requirement added.");
      }
      await loadRequirements(selectedProspect.id);
      setRequirementDrawerOpen(false);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to save requirement.");
    } finally {
      setSavingRequirement(false);
    }
  }

  async function submitSiteVisit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProspect?.id) {
      return;
    }

    setSavingSiteVisit(true);
    setError("");
    setMessage("");
    try {
      const payload = formToSiteVisit(siteVisitForm, selectedProspect.id);
      if (siteVisitForm.id) {
        await updateProspectSiteVisit(siteVisitForm.id, payload);
        setMessage("Site visit updated.");
      } else {
        await saveProspectSiteVisit(payload);
        setMessage("Site visit added.");
      }
      await loadRequirements(selectedProspect.id);
      setSiteVisitDrawerOpen(false);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to save site visit.");
    } finally {
      setSavingSiteVisit(false);
    }
  }

  async function submitOffer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProspect?.id) {
      return;
    }

    setSavingOffer(true);
    setError("");
    setMessage("");
    try {
      const payload = formToOffer(offerForm, selectedProspect.id);
      if (offerForm.id) {
        await updateProspectOffer(offerForm.id, payload);
        setMessage("Offer updated.");
      } else {
        await saveProspectOffer(payload);
        setMessage("Offer added.");
      }
      await loadRequirements(selectedProspect.id);
      setOfferDrawerOpen(false);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to save offer.");
    } finally {
      setSavingOffer(false);
    }
  }

  async function submitNegotiation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!negotiationForm.offerId) {
      return;
    }

    setSavingNegotiation(true);
    setError("");
    setMessage("");
    try {
      await saveProspectNegotiation(formToNegotiation(negotiationForm));
      setMessage("Negotiation recorded.");
      await loadRequirements(selectedProspect?.id);
      setNegotiationDrawerOpen(false);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to save negotiation.");
    } finally {
      setSavingNegotiation(false);
    }
  }

  async function submitReservation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProspect?.id) {
      return;
    }

    setSavingReservation(true);
    setError("");
    setMessage("");
    try {
      await saveProspectReservation(formToReservation(reservationForm, selectedProspect.id));
      setMessage("Reservation requested.");
      await loadRequirements(selectedProspect.id);
      await refresh();
      setReservationDrawerOpen(false);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to request reservation.");
    } finally {
      setSavingReservation(false);
    }
  }

  async function submitPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!paymentForm.reservationId || !selectedProspect?.id) {
      return;
    }

    setSavingPayment(true);
    setError("");
    setMessage("");
    try {
      await recordProspectReservationPayment(paymentForm.reservationId, formToPayment(paymentForm));
      setMessage("Reservation payment recorded.");
      await loadRequirements(selectedProspect.id);
      setPaymentDrawerOpen(false);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to record payment.");
    } finally {
      setSavingPayment(false);
    }
  }

  function openNewRequirement() {
    setRequirementForm(initialRequirementForm);
    setRequirementDrawerOpen(true);
  }

  function openEditRequirement(requirement: ProspectRequirement) {
    setRequirementForm(requirementToForm(requirement) ?? initialRequirementForm);
    setRequirementDrawerOpen(true);
  }

  function openNewSiteVisit() {
    setSiteVisitForm(initialSiteVisitForm);
    setSiteVisitDrawerOpen(true);
  }

  function openEditSiteVisit(siteVisit: ProspectSiteVisit) {
    setSiteVisitForm(siteVisitToForm(siteVisit) ?? initialSiteVisitForm);
    setSiteVisitDrawerOpen(true);
  }

  function openNewOffer() {
    setOfferForm(initialOfferForm);
    setOfferDrawerOpen(true);
  }

  function openEditOffer(offer: ProspectOffer) {
    setOfferForm(offerToForm(offer) ?? initialOfferForm);
    setOfferDrawerOpen(true);
  }

  function openNewNegotiation(offer: ProspectOffer) {
    setNegotiationForm({
      offerId: offer.id,
      proposedAmount: offer.finalAmount === undefined ? "" : String(offer.finalAmount),
      notes: "",
    });
    setNegotiationDrawerOpen(true);
  }

  function openNewReservation(offer?: ProspectOffer) {
    const approvedOffer = offer?.status === "APPROVED" ? offer : undefined;
    setReservationForm({
      ...initialReservationForm,
      offerId: approvedOffer?.id === undefined ? "" : String(approvedOffer.id),
      reservationFee: "5000",
    });
    setReservationDrawerOpen(true);
  }

  async function runReservationAction(reservation: ProspectReservation, action: ReservationAction) {
    if (!reservation.id || !selectedProspect?.id) {
      return;
    }
    if (action === "payment") {
      setPaymentForm({
        reservationId: reservation.id,
        amount: reservation.reservationFee === undefined ? "" : String(reservation.reservationFee),
        paymentMethod: "CARD",
        paidAt: new Date().toISOString().slice(0, 16),
      });
      setPaymentDrawerOpen(true);
      return;
    }
    setSavingReservation(true);
    setError("");
    setMessage("");
    try {
      if (action === "approve") {
        await approveProspectReservation(reservation.id, { approved: true, comments: "Approved." });
        setMessage("Reservation approved.");
      } else if (action === "reject") {
        await approveProspectReservation(reservation.id, { approved: false, comments: "Rejected." });
        setMessage("Reservation rejected.");
      } else if (action === "confirm") {
        await confirmProspectReservation(reservation.id);
        setMessage("Reservation confirmed.");
      } else if (action === "cancel") {
        await cancelProspectReservation(reservation.id);
        setMessage("Reservation cancelled.");
      } else if (action === "expire") {
        await expireProspectReservation(reservation.id);
        setMessage("Reservation expired.");
      } else if (action === "move") {
        await moveProspectReservationToLease(reservation.id);
        setMessage("Reservation moved to lease.");
      }
      await loadRequirements(selectedProspect.id);
      await refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to update reservation.");
    } finally {
      setSavingReservation(false);
    }
  }

  return (
    <section className="page-surface min-h-[calc(100vh-6rem)] rounded-none border border-[color:var(--line-strong)] shadow-[0_28px_80px_rgba(24,50,71,0.12)]">
      <div className="border-b border-[color:var(--line)] px-5 py-5 sm:px-6 sm:py-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--brand)]">Prospect management</p>
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

      <ProspectBoard
        filteredProspects={filteredProspects}
        loading={loading}
        prospectSearch={prospectSearch}
        prospectStageCards={prospectStageCards}
        prospectStatusFilter={prospectStatusFilter}
        prospectStatuses={prospectStatuses}
        requirements={requirements}
        offers={offers}
        reservations={reservations}
        selectedProspect={selectedProspect}
        siteVisits={siteVisits}
        onProspectSearchChange={setProspectSearch}
        onProspectStatusFilterChange={setProspectStatusFilter}
        onCreateRequirement={openNewRequirement}
        onCreateOffer={openNewOffer}
        onCreateSiteVisit={openNewSiteVisit}
        onCreateNegotiation={openNewNegotiation}
        onCreateReservation={openNewReservation}
        onReservationAction={runReservationAction}
        onSelectOffer={openEditOffer}
        onSelectProspect={(prospect) => setSelectedProspectId(prospect.id ?? null)}
        onSelectRequirement={openEditRequirement}
        onSelectSiteVisit={openEditSiteVisit}
      />

      <WorkspaceDrawer
        eyebrow="Requirement"
        open={requirementDrawerOpen}
        title={requirementForm.id ? "Edit requirement" : "Add requirement"}
        onClose={() => setRequirementDrawerOpen(false)}
      >
        <RequirementFormPanel
          form={requirementForm}
          saving={savingRequirement}
          onCancel={() => setRequirementDrawerOpen(false)}
          onChange={setRequirementForm}
          onSubmit={submitRequirement}
        />
      </WorkspaceDrawer>

      <WorkspaceDrawer
        eyebrow="Negotiation"
        open={negotiationDrawerOpen}
        title="Enter negotiation"
        onClose={() => setNegotiationDrawerOpen(false)}
      >
        <NegotiationFormPanel
          form={negotiationForm}
          saving={savingNegotiation}
          onCancel={() => setNegotiationDrawerOpen(false)}
          onChange={setNegotiationForm}
          onSubmit={submitNegotiation}
        />
      </WorkspaceDrawer>

      <WorkspaceDrawer
        eyebrow="Reservation"
        open={reservationDrawerOpen}
        title="Request reservation"
        onClose={() => setReservationDrawerOpen(false)}
      >
        <ReservationFormPanel
          approvedOffers={approvedOffers}
          form={reservationForm}
          saving={savingReservation}
          onCancel={() => setReservationDrawerOpen(false)}
          onChange={setReservationForm}
          onSubmit={submitReservation}
        />
      </WorkspaceDrawer>

      <WorkspaceDrawer
        eyebrow="Payment"
        open={paymentDrawerOpen}
        title="Record reservation payment"
        onClose={() => setPaymentDrawerOpen(false)}
      >
        <PaymentFormPanel
          form={paymentForm}
          saving={savingPayment}
          onCancel={() => setPaymentDrawerOpen(false)}
          onChange={setPaymentForm}
          onSubmit={submitPayment}
        />
      </WorkspaceDrawer>

      <WorkspaceDrawer
        eyebrow="Site visit"
        open={siteVisitDrawerOpen}
        title={siteVisitForm.id ? "Edit site visit" : "Add site visit"}
        onClose={() => setSiteVisitDrawerOpen(false)}
      >
        <SiteVisitFormPanel
          form={siteVisitForm}
          saving={savingSiteVisit}
          onCancel={() => setSiteVisitDrawerOpen(false)}
          onChange={setSiteVisitForm}
          onSubmit={submitSiteVisit}
        />
      </WorkspaceDrawer>

      <WorkspaceDrawer
        eyebrow="Offer"
        open={offerDrawerOpen}
        title={offerForm.id ? "Edit offer" : "Add offer"}
        onClose={() => setOfferDrawerOpen(false)}
      >
        <OfferFormPanel
          form={offerForm}
          saving={savingOffer}
          onCancel={() => setOfferDrawerOpen(false)}
          onChange={setOfferForm}
          onSubmit={submitOffer}
        />
      </WorkspaceDrawer>
    </section>
  );
}

function ProspectBoard({
  filteredProspects,
  loading,
  prospectSearch,
  prospectStageCards,
  prospectStatusFilter,
  prospectStatuses,
  requirements,
  offers,
  reservations,
  selectedProspect,
  siteVisits,
  onProspectSearchChange,
  onProspectStatusFilterChange,
  onCreateRequirement,
  onCreateOffer,
  onCreateSiteVisit,
  onCreateNegotiation,
  onCreateReservation,
  onReservationAction,
  onSelectOffer,
  onSelectProspect,
  onSelectRequirement,
  onSelectSiteVisit,
}: ProspectBoardProps) {
  return (
    <>
      <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-4 xl:p-6">
        {prospectStageCards.map((stage) => {
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
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--brand)]">Prospect options</p>
            <h2 className="display-font mt-2 text-xl font-semibold text-[color:var(--brand-strong)]">Prospect list</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_160px]">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--foreground-subtle)]" />
                <input
                  className="field w-full rounded-lg py-3 pl-10 pr-3 text-sm"
                  onChange={(event) => onProspectSearchChange(event.target.value)}
                  placeholder="Search prospect"
                  type="search"
                  value={prospectSearch}
                />
              </label>
              <select className="field rounded-lg px-3 py-3 text-sm" onChange={(event) => onProspectStatusFilterChange(event.target.value)} value={prospectStatusFilter}>
                {prospectStatuses.map((status) => (
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
                Loading prospects...
              </div>
            ) : null}
            {!loading && filteredProspects.length === 0 ? <p className="rounded-lg border border-[color:var(--line)] p-4 text-sm text-[color:var(--foreground-muted)]">No prospects match the selected filter.</p> : null}
            {filteredProspects.map((prospect) => {
              const active = selectedProspect?.id === prospect.id;

              return (
                <button
                  className="rounded-lg border p-4 text-left transition hover:border-[color:var(--brand-border)] hover:bg-[color:var(--brand-tint)]"
                  key={prospect.id ?? prospect.prospectNo ?? prospect.customerName}
                  onClick={() => onSelectProspect(prospect)}
                  style={{
                    background: active ? "var(--brand-tint)" : "var(--surface-raised)",
                    borderColor: active ? "var(--brand-border)" : "var(--line)",
                  }}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[color:var(--brand-strong)]">{prospect.customerName || "Unnamed prospect"}</p>
                      <p className="mt-1 text-xs font-medium text-[color:var(--foreground-muted)]">{prospect.prospectNo ?? "Prospect number pending"}</p>
                    </div>
                    <StatusPill status={prospect.status} />
                  </div>
                  <div className="mt-4 grid gap-2 text-sm text-[color:var(--foreground-muted)]">
                    <p>{prospect.mobileNo || "-"}</p>
                    <p>{prospect.email || "Email not captured"}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <ProspectDetailPanel
          prospect={selectedProspect}
          requirements={requirements}
          offers={offers}
          reservations={reservations}
          siteVisits={siteVisits}
          onCreateRequirement={onCreateRequirement}
          onCreateOffer={onCreateOffer}
          onCreateSiteVisit={onCreateSiteVisit}
          onCreateNegotiation={onCreateNegotiation}
          onCreateReservation={onCreateReservation}
          onReservationAction={onReservationAction}
          onSelectOffer={onSelectOffer}
          onSelectRequirement={onSelectRequirement}
          onSelectSiteVisit={onSelectSiteVisit}
        />
      </div>
    </>
  );
}

function ProspectDetailPanel({
  prospect,
  requirements,
  offers,
  reservations,
  siteVisits,
  onCreateRequirement,
  onCreateOffer,
  onCreateSiteVisit,
  onCreateNegotiation,
  onCreateReservation,
  onReservationAction,
  onSelectOffer,
  onSelectRequirement,
  onSelectSiteVisit,
}: {
  prospect: Prospect | null;
  requirements: ProspectRequirement[];
  offers: ProspectOffer[];
  reservations: ProspectReservation[];
  siteVisits: ProspectSiteVisit[];
  onCreateRequirement: () => void;
  onCreateOffer: () => void;
  onCreateSiteVisit: () => void;
  onCreateNegotiation: (offer: ProspectOffer) => void;
  onCreateReservation: (offer?: ProspectOffer) => void;
  onReservationAction: (reservation: ProspectReservation, action: ReservationAction) => void;
  onSelectOffer: (offer: ProspectOffer) => void;
  onSelectRequirement: (requirement: ProspectRequirement) => void;
  onSelectSiteVisit: (siteVisit: ProspectSiteVisit) => void;
}) {
  if (!prospect) {
    return (
      <section className="panel rounded-lg p-6">
        <p className="text-sm text-[color:var(--foreground-muted)]">Select a prospect to view the full profile.</p>
      </section>
    );
  }

  return (
    <section className="panel overflow-hidden rounded-lg">
      <div className="border-b border-[color:var(--line)] p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--brand)]">Prospect details</p>
            <h2 className="display-font mt-2 text-2xl font-semibold text-[color:var(--brand-strong)]">{prospect.customerName || "Unnamed prospect"}</h2>
            <p className="mt-2 text-sm text-[color:var(--foreground-muted)]">{prospect.prospectNo ?? "Prospect number pending"}</p>
          </div>
          <StatusPill status={prospect.status} />
        </div>
      </div>

      <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
        <DetailItem label="Mobile no" value={prospect.mobileNo} />
        <DetailItem label="Email" value={prospect.email} />
        <DetailItem label="Company id" value={prospect.companyId === undefined ? undefined : String(prospect.companyId)} />
        <DetailItem label="Lead id" value={prospect.leadId === undefined ? undefined : String(prospect.leadId)} />
        <DetailItem label="Status" value={prospect.status} />
        <DetailItem label="Created by" value={prospect.createdBy === undefined ? undefined : String(prospect.createdBy)} />
      </div>

      <div className="border-t border-[color:var(--line)] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-[color:var(--brand-strong)]">Requirements</h3>
          <button className="btn-secondary inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold" onClick={onCreateRequirement} type="button">
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
        </div>

        <div className="mt-4 grid gap-3">
          {requirements.length === 0 ? <p className="rounded-lg border border-[color:var(--line)] p-4 text-sm text-[color:var(--foreground-muted)]">No requirements captured yet.</p> : null}
          {requirements.map((requirement) => (
            <button
              className="rounded-lg border border-[color:var(--line)] bg-[color:var(--surface-raised)] p-4 text-left transition hover:border-[color:var(--brand-border)] hover:bg-[color:var(--brand-tint)]"
              key={requirement.id ?? `${requirement.prospectId}-${requirement.propertyName}`}
              onClick={() => onSelectRequirement(requirement)}
              type="button"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[color:var(--brand-strong)]">{requirement.propertyName || requirement.unitType || "Requirement"}</p>
                  <p className="mt-1 text-sm text-[color:var(--foreground-muted)]">
                    {formatRequirementSummary(requirement)}
                  </p>
                </div>
                <Edit3 className="h-4 w-4 shrink-0 text-[color:var(--brand)]" />
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-[color:var(--line)] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-[color:var(--brand-strong)]">Site visits</h3>
          <button className="btn-secondary inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold" onClick={onCreateSiteVisit} type="button">
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
        </div>

        <div className="mt-4 grid gap-3">
          {siteVisits.length === 0 ? <p className="rounded-lg border border-[color:var(--line)] p-4 text-sm text-[color:var(--foreground-muted)]">No site visits scheduled yet.</p> : null}
          {siteVisits.map((siteVisit) => (
            <button
              className="rounded-lg border border-[color:var(--line)] bg-[color:var(--surface-raised)] p-4 text-left transition hover:border-[color:var(--brand-border)] hover:bg-[color:var(--brand-tint)]"
              key={siteVisit.id ?? `${siteVisit.prospectId}-${siteVisit.visitAt}`}
              onClick={() => onSelectSiteVisit(siteVisit)}
              type="button"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[color:var(--brand-strong)]">{formatDateTime(siteVisit.visitAt) || "Site visit"}</p>
                  <p className="mt-1 text-sm text-[color:var(--foreground-muted)]">
                    {formatSiteVisitSummary(siteVisit)}
                  </p>
                </div>
                <Edit3 className="h-4 w-4 shrink-0 text-[color:var(--brand)]" />
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-[color:var(--line)] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-[color:var(--brand-strong)]">Offers</h3>
          <button className="btn-secondary inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold" onClick={onCreateOffer} type="button">
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
        </div>

        <div className="mt-4 grid gap-3">
          {offers.length === 0 ? <p className="rounded-lg border border-[color:var(--line)] p-4 text-sm text-[color:var(--foreground-muted)]">No offers created yet.</p> : null}
          {offers.map((offer) => (
            <div
              className="rounded-lg border border-[color:var(--line)] bg-[color:var(--surface-raised)] p-4 transition hover:border-[color:var(--brand-border)] hover:bg-[color:var(--brand-tint)]"
              key={offer.id ?? `${offer.prospectId}-${offer.unitId}-${offer.finalAmount}`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[color:var(--brand-strong)]">{offer.offerNo || "Offer"}</p>
                  <p className="mt-1 text-sm text-[color:var(--foreground-muted)]">
                    {formatOfferSummary(offer)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button className="btn-secondary inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold" onClick={() => onCreateNegotiation(offer)} type="button">
                    <Send className="h-3.5 w-3.5" />
                    Negotiation
                  </button>
                  <button
                    className="btn-secondary inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-50"
                    disabled={offer.status !== "APPROVED"}
                    onClick={() => onCreateReservation(offer)}
                    type="button"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Reservation
                  </button>
                  <button className="btn-secondary inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold" onClick={() => onSelectOffer(offer)} type="button">
                    <Edit3 className="h-3.5 w-3.5" />
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-[color:var(--line)] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-[color:var(--brand-strong)]">Reservations</h3>
          <button className="btn-secondary inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold" onClick={() => onCreateReservation()} type="button">
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
        </div>

        <div className="mt-4 grid gap-3">
          {reservations.length === 0 ? <p className="rounded-lg border border-[color:var(--line)] p-4 text-sm text-[color:var(--foreground-muted)]">No reservations requested yet.</p> : null}
          {reservations.map((reservation) => (
            <div className="rounded-lg border border-[color:var(--line)] bg-[color:var(--surface-raised)] p-4" key={reservation.id ?? reservation.reservationNo}>
              <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[color:var(--brand-strong)]">{reservation.reservationNo || "Reservation"}</p>
                  <p className="mt-1 text-sm text-[color:var(--foreground-muted)]">{formatReservationSummary(reservation)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {reservation.status === "PENDING_APPROVAL" || reservation.status === "REQUESTED" ? (
                    <>
                      <button className="btn-secondary rounded-lg px-3 py-2 text-xs font-semibold" onClick={() => onReservationAction(reservation, "approve")} type="button">
                        Approve
                      </button>
                      <button className="btn-secondary rounded-lg px-3 py-2 text-xs font-semibold" onClick={() => onReservationAction(reservation, "reject")} type="button">
                        Reject
                      </button>
                    </>
                  ) : null}
                  {reservation.status === "PAYMENT_PENDING" ? (
                    <button className="btn-secondary rounded-lg px-3 py-2 text-xs font-semibold" onClick={() => onReservationAction(reservation, "payment")} type="button">
                      Payment
                    </button>
                  ) : null}
                  {reservation.status === "APPROVED" ? (
                    <button className="btn-secondary rounded-lg px-3 py-2 text-xs font-semibold" onClick={() => onReservationAction(reservation, "confirm")} type="button">
                      Confirm
                    </button>
                  ) : null}
                  {reservation.status === "CONFIRMED" ? (
                    <button className="btn-secondary rounded-lg px-3 py-2 text-xs font-semibold" onClick={() => onReservationAction(reservation, "move")} type="button">
                      Move to Lease
                    </button>
                  ) : null}
                  {["REJECTED", "CANCELLED", "EXPIRED", "MOVED_TO_LEASE"].includes(reservation.status ?? "") ? (
                    <span className="rounded-lg border border-[color:var(--line)] px-3 py-2 text-xs font-semibold text-[color:var(--foreground-muted)]">No action</span>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </section>
  );
}

function RequirementFormPanel({
  form,
  saving,
  onCancel,
  onChange,
  onSubmit,
}: {
  form: RequirementForm;
  saving: boolean;
  onCancel: () => void;
  onChange: (form: RequirementForm) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <Field label="Property id" type="number" value={form.propertyId} onChange={(value) => onChange({ ...form, propertyId: value })} />
      <Field label="Property name" value={form.propertyName} onChange={(value) => onChange({ ...form, propertyName: value })} />
      <Select label="Unit type" value={form.unitType} options={["Apartment", "Villa", "Townhouse", "Office", "Retail"]} onChange={(value) => onChange({ ...form, unitType: value })} />
      <Field label="Bedrooms" type="number" value={form.bedrooms} onChange={(value) => onChange({ ...form, bedrooms: value })} />
      <Field label="Budget from" type="number" value={form.budgetFrom} onChange={(value) => onChange({ ...form, budgetFrom: value })} />
      <Field label="Budget to" type="number" value={form.budgetTo} onChange={(value) => onChange({ ...form, budgetTo: value })} />
      <Field label="Move-in date" type="date" value={form.moveInDate} onChange={(value) => onChange({ ...form, moveInDate: value })} />
      <label className="grid gap-2 text-sm font-semibold text-[color:var(--brand-strong)]">
        Notes
        <textarea className="field min-h-28 rounded-lg px-3 py-3 text-sm" value={form.notes} onChange={(event) => onChange({ ...form, notes: event.target.value })} />
      </label>
      <div className="flex items-center justify-end gap-3 pt-2">
        <button className="btn-secondary rounded-lg px-4 py-3 text-sm font-semibold" onClick={onCancel} type="button">
          Cancel
        </button>
        <button className="btn-primary inline-flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold disabled:opacity-50" disabled={saving} type="submit">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {form.id ? "Update Requirement" : "Add Requirement"}
        </button>
      </div>
    </form>
  );
}

function SiteVisitFormPanel({
  form,
  saving,
  onCancel,
  onChange,
  onSubmit,
}: {
  form: SiteVisitForm;
  saving: boolean;
  onCancel: () => void;
  onChange: (form: SiteVisitForm) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <Field label="Unit id" type="number" value={form.unitId} onChange={(value) => onChange({ ...form, unitId: value })} />
      <Field label="Visit date and time" type="datetime-local" value={form.visitAt} onChange={(value) => onChange({ ...form, visitAt: value })} />
      <Select label="Status" value={form.status} options={["SCHEDULED", "COMPLETED", "CANCELLED"]} onChange={(value) => onChange({ ...form, status: value })} />
      <label className="grid gap-2 text-sm font-semibold text-[color:var(--brand-strong)]">
        Notes
        <textarea className="field min-h-28 rounded-lg px-3 py-3 text-sm" value={form.notes} onChange={(event) => onChange({ ...form, notes: event.target.value })} />
      </label>
      <div className="flex items-center justify-end gap-3 pt-2">
        <button className="btn-secondary rounded-lg px-4 py-3 text-sm font-semibold" onClick={onCancel} type="button">
          Cancel
        </button>
        <button className="btn-primary inline-flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold disabled:opacity-50" disabled={saving} type="submit">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {form.id ? "Update Site Visit" : "Add Site Visit"}
        </button>
      </div>
    </form>
  );
}

function OfferFormPanel({
  form,
  saving,
  onCancel,
  onChange,
  onSubmit,
}: {
  form: OfferForm;
  saving: boolean;
  onCancel: () => void;
  onChange: (form: OfferForm) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <Field label="Unit id" type="number" value={form.unitId} onChange={(value) => onChange({ ...form, unitId: value })} />
      <Field label="Base amount" type="number" value={form.baseAmount} onChange={(value) => onChange({ ...form, baseAmount: value })} />
      <Field label="Discount amount" type="number" value={form.discountAmount} onChange={(value) => onChange({ ...form, discountAmount: value })} />
      <Field label="Final amount" type="number" value={form.finalAmount} onChange={(value) => onChange({ ...form, finalAmount: value })} />
      <Select label="Status" value={form.status} options={["SENT", "NEGOTIATION", "APPROVED", "REJECTED", "EXPIRED"]} onChange={(value) => onChange({ ...form, status: value })} />
      <label className="grid gap-2 text-sm font-semibold text-[color:var(--brand-strong)]">
        Special terms
        <textarea className="field min-h-28 rounded-lg px-3 py-3 text-sm" value={form.specialTerms} onChange={(event) => onChange({ ...form, specialTerms: event.target.value })} />
      </label>
      <div className="flex items-center justify-end gap-3 pt-2">
        <button className="btn-secondary rounded-lg px-4 py-3 text-sm font-semibold" onClick={onCancel} type="button">
          Cancel
        </button>
        <button className="btn-primary inline-flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold disabled:opacity-50" disabled={saving} type="submit">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {form.id ? "Update Offer" : "Add Offer"}
        </button>
      </div>
    </form>
  );
}

function NegotiationFormPanel({
  form,
  saving,
  onCancel,
  onChange,
  onSubmit,
}: {
  form: NegotiationForm;
  saving: boolean;
  onCancel: () => void;
  onChange: (form: NegotiationForm) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <Field label="Proposed amount" type="number" value={form.proposedAmount} onChange={(value) => onChange({ ...form, proposedAmount: value })} />
      <label className="grid gap-2 text-sm font-semibold text-[color:var(--brand-strong)]">
        Notes
        <textarea className="field min-h-28 rounded-lg px-3 py-3 text-sm" value={form.notes} onChange={(event) => onChange({ ...form, notes: event.target.value })} />
      </label>
      <div className="flex items-center justify-end gap-3 pt-2">
        <button className="btn-secondary rounded-lg px-4 py-3 text-sm font-semibold" onClick={onCancel} type="button">
          Cancel
        </button>
        <button className="btn-primary inline-flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold disabled:opacity-50" disabled={saving} type="submit">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Negotiation
        </button>
      </div>
    </form>
  );
}

function ReservationFormPanel({
  approvedOffers,
  form,
  saving,
  onCancel,
  onChange,
  onSubmit,
}: {
  approvedOffers: ProspectOffer[];
  form: ReservationForm;
  saving: boolean;
  onCancel: () => void;
  onChange: (form: ReservationForm) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <label className="grid gap-2 text-sm font-semibold text-[color:var(--brand-strong)]">
        Offer
        <select className="field rounded-lg px-3 py-3 text-sm" value={form.offerId} onChange={(event) => onChange({ ...form, offerId: event.target.value })}>
          <option value="">Select approved offer</option>
          {approvedOffers.map((offer) => (
            <option key={offer.id ?? offer.offerNo} value={offer.id}>
              {formatOfferLookupLabel(offer)}
            </option>
          ))}
        </select>
      </label>
      {approvedOffers.length === 0 ? <p className="rounded-lg border border-[color:var(--line)] p-3 text-sm text-[color:var(--foreground-muted)]">No approved offers available for reservation.</p> : null}
      <Field label="Reservation fee" type="number" value={form.reservationFee} onChange={(value) => onChange({ ...form, reservationFee: value })} />
      <Field label="Expiry date and time" type="datetime-local" value={form.expiresAt} onChange={(value) => onChange({ ...form, expiresAt: value })} />
      <label className="flex items-center gap-3 rounded-lg border border-[color:var(--line)] bg-[color:var(--surface-raised)] px-3 py-3 text-sm font-semibold text-[color:var(--brand-strong)]">
        <input checked={form.paymentWaived} className="h-4 w-4" onChange={(event) => onChange({ ...form, paymentWaived: event.target.checked })} type="checkbox" />
        Payment waived
      </label>
      <div className="flex items-center justify-end gap-3 pt-2">
        <button className="btn-secondary rounded-lg px-4 py-3 text-sm font-semibold" onClick={onCancel} type="button">
          Cancel
        </button>
        <button className="btn-primary inline-flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold disabled:opacity-50" disabled={saving || !form.offerId} type="submit">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Request Reservation
        </button>
      </div>
    </form>
  );
}

function PaymentFormPanel({
  form,
  saving,
  onCancel,
  onChange,
  onSubmit,
}: {
  form: PaymentForm;
  saving: boolean;
  onCancel: () => void;
  onChange: (form: PaymentForm) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <Field label="Amount" type="number" value={form.amount} onChange={(value) => onChange({ ...form, amount: value })} />
      <Select label="Payment method" value={form.paymentMethod} options={["CARD", "CASH", "CHEQUE", "BANK_TRANSFER", "ONLINE"]} onChange={(value) => onChange({ ...form, paymentMethod: value })} />
      <Field label="Paid date and time" type="datetime-local" value={form.paidAt} onChange={(value) => onChange({ ...form, paidAt: value })} />
      <div className="flex items-center justify-end gap-3 pt-2">
        <button className="btn-secondary rounded-lg px-4 py-3 text-sm font-semibold" onClick={onCancel} type="button">
          Cancel
        </button>
        <button className="btn-primary inline-flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold disabled:opacity-50" disabled={saving} type="submit">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Record Payment
        </button>
      </div>
    </form>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[color:var(--brand-strong)]">
      {label}
      <input className="field rounded-lg px-3 py-3 text-sm" type={type} value={value} onChange={(event) => onChange(event.target.value)} />
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

function requirementToForm(requirement?: ProspectRequirement): RequirementForm | null {
  if (!requirement) {
    return null;
  }
  return {
    id: requirement.id,
    propertyId: requirement.propertyId === undefined ? "" : String(requirement.propertyId),
    propertyName: requirement.propertyName ?? "",
    unitType: requirement.unitType ?? "Apartment",
    bedrooms: requirement.bedrooms === undefined ? "" : String(requirement.bedrooms),
    budgetFrom: requirement.budgetFrom === undefined ? "" : String(requirement.budgetFrom),
    budgetTo: requirement.budgetTo === undefined ? "" : String(requirement.budgetTo),
    moveInDate: requirement.moveInDate ?? "",
    notes: requirement.notes ?? "",
  };
}

function formToRequirement(form: RequirementForm, prospectId: number): ProspectRequirement {
  return {
    id: form.id,
    prospectId,
    propertyId: numberValue(form.propertyId),
    propertyName: emptyToUndefined(form.propertyName),
    unitType: emptyToUndefined(form.unitType),
    bedrooms: numberValue(form.bedrooms),
    budgetFrom: numberValue(form.budgetFrom),
    budgetTo: numberValue(form.budgetTo),
    moveInDate: emptyToUndefined(form.moveInDate),
    notes: emptyToUndefined(form.notes),
  };
}

function siteVisitToForm(siteVisit?: ProspectSiteVisit): SiteVisitForm | null {
  if (!siteVisit) {
    return null;
  }
  return {
    id: siteVisit.id,
    unitId: siteVisit.unitId === undefined ? "" : String(siteVisit.unitId),
    visitAt: toDateTimeLocal(siteVisit.visitAt),
    status: siteVisit.status ?? "SCHEDULED",
    notes: siteVisit.notes ?? "",
  };
}

function formToSiteVisit(form: SiteVisitForm, prospectId: number): ProspectSiteVisit {
  return {
    id: form.id,
    prospectId,
    unitId: numberValue(form.unitId),
    visitAt: emptyToUndefined(form.visitAt),
    status: emptyToUndefined(form.status),
    notes: emptyToUndefined(form.notes),
  };
}

function offerToForm(offer?: ProspectOffer): OfferForm | null {
  if (!offer) {
    return null;
  }
  return {
    id: offer.id,
    unitId: offer.unitId === undefined ? "" : String(offer.unitId),
    baseAmount: offer.baseAmount === undefined ? "" : String(offer.baseAmount),
    discountAmount: offer.discountAmount === undefined ? "" : String(offer.discountAmount),
    finalAmount: offer.finalAmount === undefined ? "" : String(offer.finalAmount),
    specialTerms: offer.specialTerms ?? "",
    status: offer.status ?? "SENT",
  };
}

function formToOffer(form: OfferForm, prospectId: number): ProspectOffer {
  return {
    id: form.id,
    prospectId,
    unitId: numberValue(form.unitId),
    baseAmount: numberValue(form.baseAmount),
    discountAmount: numberValue(form.discountAmount),
    finalAmount: numberValue(form.finalAmount),
    specialTerms: emptyToUndefined(form.specialTerms),
    status: emptyToUndefined(form.status),
  };
}

function formToNegotiation(form: NegotiationForm): ProspectNegotiation {
  return {
    offerId: form.offerId,
    proposedAmount: numberValue(form.proposedAmount),
    notes: emptyToUndefined(form.notes),
  };
}

function formToReservation(form: ReservationForm, prospectId: number): ProspectReservation {
  return {
    prospectId,
    offerId: numberValue(form.offerId),
    reservationFee: numberValue(form.reservationFee),
    paymentWaived: form.paymentWaived,
    expiresAt: emptyToUndefined(form.expiresAt),
  };
}

function formToPayment(form: PaymentForm) {
  return {
    amount: numberValue(form.amount),
    paymentMethod: emptyToUndefined(form.paymentMethod),
    paidAt: emptyToUndefined(form.paidAt),
  };
}

function numberValue(value: string): number | undefined {
  const numeric = Number(value);
  return Number.isFinite(numeric) && value.trim() !== "" ? numeric : undefined;
}

function emptyToUndefined(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function formatRequirementSummary(requirement: ProspectRequirement) {
  const budget = requirement.budgetFrom || requirement.budgetTo ? `${requirement.budgetFrom ?? "-"} to ${requirement.budgetTo ?? "-"}` : "Budget pending";
  return [requirement.unitType, requirement.bedrooms === undefined ? undefined : `${requirement.bedrooms} bed`, budget, requirement.moveInDate].filter(Boolean).join(" | ");
}

function formatSiteVisitSummary(siteVisit: ProspectSiteVisit) {
  return [`Unit ${siteVisit.unitId ?? "-"}`, formatLabel(siteVisit.status ?? "SCHEDULED"), siteVisit.notes].filter(Boolean).join(" | ");
}

function formatOfferSummary(offer: ProspectOffer) {
  const amount = offer.finalAmount ?? offer.baseAmount;
  return [`Unit ${offer.unitId ?? "-"}`, amount === undefined ? "Amount pending" : `Final ${amount}`, formatLabel(offer.status ?? "SENT")].filter(Boolean).join(" | ");
}

function formatOfferLookupLabel(offer: ProspectOffer) {
  const amount = offer.finalAmount ?? offer.baseAmount;
  return [offer.offerNo || `Offer ${offer.id ?? "-"}`, `Unit ${offer.unitId ?? "-"}`, amount === undefined ? undefined : `Final ${amount}`].filter(Boolean).join(" | ");
}

function formatReservationSummary(reservation: ProspectReservation) {
  return [
    `Offer ${reservation.offerId ?? "-"}`,
    `Unit ${reservation.unitId ?? "-"}`,
    formatLabel(reservation.status ?? "REQUESTED"),
    `Approval ${formatLabel(reservation.approvalStatus ?? "NOT_REQUIRED")}`,
    `Fee ${reservation.reservationFee ?? 0}`,
    `Paid ${reservation.paidAmount ?? 0}`,
  ].join(" | ");
}

function toDateTimeLocal(value?: string) {
  return value ? value.slice(0, 16) : "";
}

function formatDateTime(value?: string) {
  if (!value) {
    return "";
  }
  return value.replace("T", " ").slice(0, 16);
}

function Notice({ tone, text }: { tone: "danger" | "success"; text: string }) {
  return <div className={`mx-4 mt-4 rounded-lg px-4 py-3 text-sm font-semibold xl:mx-6 ${tone === "danger" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{text}</div>;
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
  const tone = status === "ACTIVE" || status === "RESERVED" || status === "LEASE_PROCESS" ? "pill-success" : status === "LOST" ? "pill-danger" : "pill-brand";

  return <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>{label}</span>;
}

function formatLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
