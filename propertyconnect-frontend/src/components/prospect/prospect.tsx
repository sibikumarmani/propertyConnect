"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Edit3, Loader2, Plus, RefreshCcw, Save, Search, UserCheck } from "lucide-react";

import { WorkspaceDrawer } from "@/components/layout/workspace-drawer";
import { listCodeValues, type ErpCodeValue } from "@/lib/lead";
import { listBlocks, listFloors, listProperties, listUnits, type MasterRecord, type PropertyMaster } from "@/lib/property-management";
import {
  approveProspectOffer,
  approveProspectReservation,
  cancelProspectReservation,
  confirmProspectReservation,
  expireProspectReservation,
  listOffers,
  listProspectRequirements,
  listProspectOffers,
  listProspectSiteVisits,
  listProspects,
  listReservations,
  moveProspectReservationToLease,
  recordProspectReservationPayment,
  saveProspectNegotiation,
  saveProspectOffer,
  saveProspectReservation,
  saveProspectRequirement,
  saveProspectSiteVisit,
  updateProspect,
  updateProspectOffer,
  updateProspectOfferStatus,
  updateProspectRequirement,
  updateProspectReservation,
  updateProspectReservationStatus,
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
  captionTone: "success" | "warning";
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
  preferredContactOptions: ErpCodeValue[];
  leadSourceOptions: ErpCodeValue[];
  leadPurposeOptions: ErpCodeValue[];
  offerStatusOptions: ErpCodeValue[];
  prospectStatusOptions: ErpCodeValue[];
  requirementLevelOptions: ErpCodeValue[];
  siteVisitStatusOptions: ErpCodeValue[];
  unitTypeOptions: ErpCodeValue[];
  selectedProspect: Prospect | null;
  siteVisits: ProspectSiteVisit[];
  onProspectSearchChange: (value: string) => void;
  onProspectStatusFilterChange: (value: string) => void;
  onCreateRequirement: () => void;
  onCreateOffer: () => void;
  onCreateSiteVisit: () => void;
  onOfferAction: (offer: ProspectOffer, action: OfferAction) => void;
  onEditProspect: (prospect: Prospect) => void;
  onViewOffer: (offer: ProspectOffer) => void;
  onSelectOffer: (offer: ProspectOffer) => void;
  onSelectProspect: (prospect: Prospect) => void;
  onSelectRequirement: (requirement: ProspectRequirement) => void;
  onSelectSiteVisit: (siteVisit: ProspectSiteVisit) => void;
};

type RequirementForm = {
  id?: number;
  propertyId: string;
  propertyName: string;
  requirementLevel: string;
  blockName: string;
  floorName: string;
  preferredUnitId: string;
  unitType: string;
  bedrooms: string;
  areaFrom: string;
  areaTo: string;
  budgetFrom: string;
  budgetTo: string;
  moveInDate: string;
  leaseTermMonths: string;
  usageType: string;
  parkingRequired: boolean;
  fitOutRequired: boolean;
  specialRequirements: string;
  notes: string;
};

const initialRequirementForm: RequirementForm = {
  propertyId: "",
  propertyName: "",
  requirementLevel: "",
  blockName: "",
  floorName: "",
  preferredUnitId: "",
  unitType: "",
  bedrooms: "",
  areaFrom: "",
  areaTo: "",
  budgetFrom: "",
  budgetTo: "",
  moveInDate: "",
  leaseTermMonths: "",
  usageType: "",
  parkingRequired: false,
  fitOutRequired: false,
  specialRequirements: "",
  notes: "",
};

type SiteVisitForm = {
  id?: number;
  propertyId: string;
  propertyName: string;
  requirementLevel: string;
  blockId: string;
  blockName: string;
  floorId: string;
  floorName: string;
  unitId: string;
  visitAt: string;
  status: string;
  notes: string;
};

type SelectOption = {
  value: string;
  label: string;
};

const initialSiteVisitForm: SiteVisitForm = {
  propertyId: "",
  propertyName: "",
  requirementLevel: "",
  blockId: "",
  blockName: "",
  floorId: "",
  floorName: "",
  unitId: "",
  visitAt: "",
  status: "",
  notes: "",
};

type OfferForm = {
  id?: number;
  propertyId: string;
  propertyName: string;
  requirementLevel: string;
  blockId: string;
  blockName: string;
  floorId: string;
  floorName: string;
  unitId: string;
  baseAmount: string;
  discountAmount: string;
  finalAmount: string;
  specialTerms: string;
  status: string;
};

const initialOfferForm: OfferForm = {
  propertyId: "",
  propertyName: "",
  requirementLevel: "",
  blockId: "",
  blockName: "",
  floorId: "",
  floorName: "",
  unitId: "",
  baseAmount: "",
  discountAmount: "",
  finalAmount: "",
  specialTerms: "",
  status: "",
};

type NegotiationForm = {
  offerId?: number;
  proposedAmount: string;
  notes: string;
};

type OfferAction = "approve" | "reject" | "send" | "negotiate" | "accept";
type ReservationAction = "submit" | "approve" | "reject" | "payment" | "confirm" | "cancel" | "expire" | "move";

type ReservationForm = {
  id?: number;
  prospectId: string;
  offerId: string;
  reservationFee: string;
  paymentWaived: boolean;
  expiresAt: string;
  status: string;
};

const initialReservationForm: ReservationForm = {
  prospectId: "",
  offerId: "",
  reservationFee: "",
  paymentWaived: false,
  expiresAt: "",
  status: "",
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

type ProspectForm = {
  id?: number;
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
  preferredContactMethod?: number;
  faxNo: string;
  address: string;
  source: string;
  purpose: string;
  commercialNeed: string;
  documentNotes: string;
};

const initialProspectForm: ProspectForm = {
  customerType: undefined,
  customerName: "",
  tradeLicenseNo: "",
  crNumber: "",
  vatRegistrationNo: "",
  contactPerson: "",
  contactRole: "",
  contactTitle: "",
  mobileNo: "",
  phoneNo: "",
  email: "",
  faxNo: "",
  address: "",
  source: "",
  purpose: "",
  commercialNeed: "",
  documentNotes: "",
};

const prospectScreenMeta: Record<ProspectScreen, { title: string; subtitle: string; icon: typeof UserCheck }> = {
  prospects: { title: "Prospect List", subtitle: "Review converted prospects and move them through the leasing stages.", icon: UserCheck },
};

const prospectStageStatuses = ["PROSPECT", "REQUIREMENT_CAPTURED", "SITE_VISIT_SCHEDULED", "OFFER_IN_PROGRESS", "NEGOTIATION_IN_PROGRESS", "RESERVATION_IN_PROGRESS"];

export function ProspectWorkspace({ screen }: { screen: ProspectScreen }) {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [customerTypeOptions, setCustomerTypeOptions] = useState<ErpCodeValue[]>([]);
  const [preferredContactOptions, setPreferredContactOptions] = useState<ErpCodeValue[]>([]);
  const [leadSourceOptions, setLeadSourceOptions] = useState<ErpCodeValue[]>([]);
  const [leadPurposeOptions, setLeadPurposeOptions] = useState<ErpCodeValue[]>([]);
  const [offerStatusOptions, setOfferStatusOptions] = useState<ErpCodeValue[]>([]);
  const [prospectStatusOptions, setProspectStatusOptions] = useState<ErpCodeValue[]>([]);
  const [requirementLevelOptions, setRequirementLevelOptions] = useState<ErpCodeValue[]>([]);
  const [siteVisitStatusOptions, setSiteVisitStatusOptions] = useState<ErpCodeValue[]>([]);
  const [unitTypeOptions, setUnitTypeOptions] = useState<ErpCodeValue[]>([]);
  const [prospectSearch, setProspectSearch] = useState("");
  const [prospectStatusFilter, setProspectStatusFilter] = useState("ALL");
  const [selectedProspectId, setSelectedProspectId] = useState<number | null>(null);
  const [requirements, setRequirements] = useState<ProspectRequirement[]>([]);
  const [siteVisits, setSiteVisits] = useState<ProspectSiteVisit[]>([]);
  const [offers, setOffers] = useState<ProspectOffer[]>([]);
  const [requirementForm, setRequirementForm] = useState<RequirementForm>(initialRequirementForm);
  const [siteVisitForm, setSiteVisitForm] = useState<SiteVisitForm>(initialSiteVisitForm);
  const [offerForm, setOfferForm] = useState<OfferForm>(initialOfferForm);
  const [offerView, setOfferView] = useState<ProspectOffer | null>(null);
  const [negotiationForm, setNegotiationForm] = useState<NegotiationForm>(initialNegotiationForm);
  const [prospectForm, setProspectForm] = useState<ProspectForm>(initialProspectForm);
  const [prospectDrawerOpen, setProspectDrawerOpen] = useState(false);
  const [requirementDrawerOpen, setRequirementDrawerOpen] = useState(false);
  const [siteVisitDrawerOpen, setSiteVisitDrawerOpen] = useState(false);
  const [offerDrawerOpen, setOfferDrawerOpen] = useState(false);
  const [negotiationDrawerOpen, setNegotiationDrawerOpen] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingProspect, setSavingProspect] = useState(false);
  const [savingRequirement, setSavingRequirement] = useState(false);
  const [savingSiteVisit, setSavingSiteVisit] = useState(false);
  const [savingOffer, setSavingOffer] = useState(false);
  const [savingNegotiation, setSavingNegotiation] = useState(false);

  const selectedProspect = useMemo(
    () => prospects.find((prospect) => (selectedProspectId ? prospect.id === selectedProspectId : prospect.id)) ?? null,
    [prospects, selectedProspectId],
  );
  const prospectStatuses = useMemo(() => {
    const options = prospectStatusOptions.flatMap((status) => {
      const key = codeValueKeyFromText(status.value);
      return status.id && key && prospectStageStatuses.includes(key) ? [String(status.id)] : [];
    });
    for (const prospect of prospects) {
      const key = codeValueKey(prospectStatusOptions, prospect.status);
      if (prospect.status && key && prospectStageStatuses.includes(key) && !options.includes(String(prospect.status))) {
        options.push(String(prospect.status));
      }
    }
    return ["ALL", ...options];
  }, [prospectStatusOptions, prospects]);
  const filteredProspects = useMemo(() => {
    const query = prospectSearch.trim().toLowerCase();

    return prospects.filter((prospect) => {
      const matchesStatus = prospectStatusFilter === "ALL" || String(prospect.status ?? "") === prospectStatusFilter;
      const matchesQuery =
        !query ||
        [
          prospect.prospectNo,
          prospect.customerCode,
          prospect.customerTypeName,
          prospect.customerName,
          prospect.tradeLicenseNo,
          prospect.crNumber,
          prospect.vatRegistrationNo,
          prospect.contactPerson,
          prospect.mobileNo,
          prospect.phoneNo,
          prospect.email,
          codeValueLabel(leadSourceOptions, prospect.source),
          codeValueLabel(leadPurposeOptions, prospect.purpose),
          prospect.commercialNeed,
          codeValueLabel(prospectStatusOptions, prospect.status),
        ].some((value) => String(value ?? "").toLowerCase().includes(query));

      return matchesStatus && matchesQuery;
    });
  }, [leadPurposeOptions, leadSourceOptions, prospectSearch, prospectStatusFilter, prospectStatusOptions, prospects]);
  const prospectStageCards = useMemo<ProspectStageCard[]>(
    () => {
      const currentMonthProspects = prospects.filter((prospect) => isCurrentMonth(prospect.createdOn)).length;
      const previousMonthProspects = prospects.filter((prospect) => isPreviousMonth(prospect.createdOn)).length;
      const monthlyVariation = formatMonthlyVariation(currentMonthProspects, previousMonthProspects);

      return [
        {
          label: "Total Prospects This Month",
          value: currentMonthProspects,
          caption: monthlyVariation.caption,
          captionTone: monthlyVariation.tone,
        },
        {
          label: "Total Active Prospects",
          value: prospects.filter((prospect) => prospectStageStatuses.includes(codeValueKey(prospectStatusOptions, prospect.status) ?? "")).length,
          caption: "Need follow-up",
          captionTone: "warning",
        },
        {
          label: "Prospect",
          value: prospects.filter((prospect) => codeValueKey(prospectStatusOptions, prospect.status) === "PROSPECT").length,
          caption: "New prospects",
          captionTone: "success",
        },
        {
          label: "Visit",
          value: prospects.filter((prospect) => codeValueKey(prospectStatusOptions, prospect.status) === "SITE_VISIT_SCHEDULED").length,
          caption: "Scheduled / completed",
          captionTone: "warning",
        },
        {
          label: "Negotiation",
          value: prospects.filter((prospect) => ["OFFER_IN_PROGRESS", "NEGOTIATION_IN_PROGRESS"].includes(codeValueKey(prospectStatusOptions, prospect.status) ?? "")).length,
          caption: "Offer in progress",
          captionTone: "warning",
        },
      ];
    },
    [prospectStatusOptions, prospects],
  );
  const meta = prospectScreenMeta[screen];
  const Icon = meta.icon;

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [loadedProspects, loadedCustomerTypes, loadedContactMethods, loadedLeadSources, loadedLeadPurposes, loadedProspectStatuses, loadedOfferStatuses, loadedRequirementLevels, loadedUnitTypes, loadedSiteVisitStatuses] = await Promise.all([listProspects(), listCodeValues("cf_firm_type"), listCodeValues("oc_communicate_through"), listCodeValues("oc_lead_source"), listCodeValues("oc_lead_purpose"), listCodeValues("oc_prospect_status"), listCodeValues("pa_offer_status"), listCodeValues("pa_requirement_level"), listCodeValues("pa_unit_type"), listCodeValues("pa_site_visit_status")]);
      setProspects(loadedProspects);
      setCustomerTypeOptions(loadedCustomerTypes);
      setPreferredContactOptions(loadedContactMethods);
      setLeadSourceOptions(loadedLeadSources);
      setLeadPurposeOptions(loadedLeadPurposes);
      setProspectStatusOptions(loadedProspectStatuses);
      setOfferStatusOptions(loadedOfferStatuses);
      setRequirementLevelOptions(loadedRequirementLevels);
      setUnitTypeOptions(loadedUnitTypes);
      setSiteVisitStatusOptions(loadedSiteVisitStatuses);
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
      setRequirementForm(initialRequirementForm);
      setSiteVisitForm(initialSiteVisitForm);
      setOfferForm(initialOfferForm);
      setNegotiationForm(initialNegotiationForm);
      setProspectForm(initialProspectForm);
      setProspectDrawerOpen(false);
      setRequirementDrawerOpen(false);
      setSiteVisitDrawerOpen(false);
      setOfferDrawerOpen(false);
      setNegotiationDrawerOpen(false);
      return;
    }
    try {
      const [loadedRequirements, loadedSiteVisits, loadedOffers] = await Promise.all([
        listProspectRequirements(prospectId),
        listProspectSiteVisits(prospectId),
        listProspectOffers(prospectId),
      ]);
      setRequirements(loadedRequirements);
      setSiteVisits(loadedSiteVisits);
      setOffers(loadedOffers);
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

  async function submitProspect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!prospectForm.id) {
      return;
    }

    setSavingProspect(true);
    setError("");
    setMessage("");
    try {
      await updateProspect(prospectForm.id, formToProspect(prospectForm));
      setMessage("Prospect updated.");
      await refresh();
      setProspectDrawerOpen(false);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to update prospect.");
    } finally {
      setSavingProspect(false);
    }
  }

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
      await refresh();
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
      await refresh();
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
      const action = event.nativeEvent instanceof SubmitEvent && event.nativeEvent.submitter instanceof HTMLButtonElement ? event.nativeEvent.submitter.value : "draft";
      const status = codeValueIdByKey(offerStatusOptions, action === "submit" ? "PENDING_APPROVAL" : "DRAFT");
      const payload = { ...formToOffer(offerForm, selectedProspect.id), status };
      if (offerForm.id) {
        await updateProspectOffer(offerForm.id, payload);
        setMessage(action === "submit" ? "Offer submitted for approval." : "Offer draft updated.");
      } else {
        await saveProspectOffer(payload);
        setMessage(action === "submit" ? "Offer submitted for approval." : "Offer draft saved.");
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

  function openNewRequirement() {
    setRequirementForm(initialRequirementForm);
    setRequirementDrawerOpen(true);
  }

  function openEditProspect(prospect: Prospect) {
    setProspectForm(prospectToForm(prospect));
    setProspectDrawerOpen(true);
  }

  function openEditRequirement(requirement: ProspectRequirement) {
    setRequirementForm(requirementToForm(requirement) ?? initialRequirementForm);
    setRequirementDrawerOpen(true);
  }

  function openNewSiteVisit() {
    setSiteVisitForm(initialSiteVisitFormForRequirements(requirements));
    setSiteVisitDrawerOpen(true);
  }

  function openEditSiteVisit(siteVisit: ProspectSiteVisit) {
    setSiteVisitForm(siteVisitToForm(siteVisit) ?? initialSiteVisitForm);
    setSiteVisitDrawerOpen(true);
  }

  function openNewOffer() {
    setOfferForm(initialOfferFormForRequirements(requirements));
    setOfferDrawerOpen(true);
  }

  function openEditOffer(offer: ProspectOffer) {
    setOfferForm(offerToForm(offer) ?? initialOfferForm);
    setOfferDrawerOpen(true);
  }

  function openViewOffer(offer: ProspectOffer) {
    setOfferView(offer);
  }

  function openNegotiation(offer: ProspectOffer) {
    setNegotiationForm({
      offerId: offer.id,
      proposedAmount: offer.finalAmount === undefined ? "" : String(offer.finalAmount),
      notes: "",
    });
    setNegotiationDrawerOpen(true);
  }

  async function runOfferAction(offer: ProspectOffer, action: OfferAction) {
    if (!offer.id || !selectedProspect?.id) {
      return;
    }
    if (action === "negotiate") {
      openNegotiation(offer);
      return;
    }
    setSavingOffer(true);
    setError("");
    setMessage("");
    try {
      if (action === "approve") {
        await approveProspectOffer(offer.id, { approved: true, comments: "Approved." });
        setMessage("Offer approved.");
      } else if (action === "reject") {
        if (codeValueKey(offerStatusOptions, offer.status) === "PENDING_APPROVAL") {
          await approveProspectOffer(offer.id, { approved: false, comments: "Rejected." });
        } else {
          await updateProspectOfferStatus(offer.id, { status: "REJECTED", comments: "Offer rejected." });
        }
        setMessage("Offer rejected.");
      } else if (action === "send") {
        await updateProspectOfferStatus(offer.id, { status: "SENT", comments: "Offer sent." });
        setMessage("Offer marked as sent.");
      } else if (action === "accept") {
        await updateProspectOfferStatus(offer.id, { status: "ACCEPTED", comments: "Offer accepted." });
        setMessage("Offer accepted.");
      }
      await loadRequirements(selectedProspect.id);
      await refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to update offer.");
    } finally {
      setSavingOffer(false);
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
        preferredContactOptions={preferredContactOptions}
        leadSourceOptions={leadSourceOptions}
        leadPurposeOptions={leadPurposeOptions}
        offerStatusOptions={offerStatusOptions}
        prospectStatusOptions={prospectStatusOptions}
        requirementLevelOptions={requirementLevelOptions}
        siteVisitStatusOptions={siteVisitStatusOptions}
        unitTypeOptions={unitTypeOptions}
        selectedProspect={selectedProspect}
        siteVisits={siteVisits}
        onProspectSearchChange={setProspectSearch}
        onProspectStatusFilterChange={setProspectStatusFilter}
        onCreateRequirement={openNewRequirement}
        onCreateOffer={openNewOffer}
        onCreateSiteVisit={openNewSiteVisit}
        onOfferAction={runOfferAction}
        onEditProspect={openEditProspect}
        onViewOffer={openViewOffer}
        onSelectOffer={openEditOffer}
        onSelectProspect={(prospect) => setSelectedProspectId(prospect.id ?? null)}
        onSelectRequirement={openEditRequirement}
        onSelectSiteVisit={openEditSiteVisit}
      />

      <WorkspaceDrawer
        eyebrow="Prospect"
        open={prospectDrawerOpen}
        title="Edit prospect"
        onClose={() => setProspectDrawerOpen(false)}
      >
        <ProspectFormPanel
          form={prospectForm}
          customerTypeOptions={customerTypeOptions}
          preferredContactOptions={preferredContactOptions}
          leadSourceOptions={leadSourceOptions}
          leadPurposeOptions={leadPurposeOptions}
          saving={savingProspect}
          onCancel={() => setProspectDrawerOpen(false)}
          onChange={setProspectForm}
          onSubmit={submitProspect}
        />
      </WorkspaceDrawer>

      <WorkspaceDrawer
        eyebrow="Requirement"
        open={requirementDrawerOpen}
        title={requirementForm.id ? "Edit requirement" : "Add requirement"}
        onClose={() => setRequirementDrawerOpen(false)}
      >
        <RequirementFormPanel
          form={requirementForm}
          requirementLevelOptions={requirementLevelOptions}
          saving={savingRequirement}
          unitTypeOptions={unitTypeOptions}
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
        eyebrow="Site visit"
        open={siteVisitDrawerOpen}
        title={siteVisitForm.id ? "Edit site visit" : "Add site visit"}
        onClose={() => setSiteVisitDrawerOpen(false)}
      >
        <SiteVisitFormPanel
          form={siteVisitForm}
          requirementLevelOptions={requirementLevelOptions}
          saving={savingSiteVisit}
          siteVisitStatusOptions={siteVisitStatusOptions}
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
          requirementLevelOptions={requirementLevelOptions}
          saving={savingOffer}
          onCancel={() => setOfferDrawerOpen(false)}
          onChange={setOfferForm}
          onSubmit={submitOffer}
        />
      </WorkspaceDrawer>

      <WorkspaceDrawer
        eyebrow="Offer"
        open={Boolean(offerView)}
        title="View offer"
        onClose={() => setOfferView(null)}
      >
        {offerView ? <OfferViewPanel offer={offerView} offerStatusOptions={offerStatusOptions} /> : null}
      </WorkspaceDrawer>
    </section>
  );
}

export function ReservationWorkspace() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [offers, setOffers] = useState<ProspectOffer[]>([]);
  const [offerStatusOptions, setOfferStatusOptions] = useState<ErpCodeValue[]>([]);
  const [reservationStatusOptions, setReservationStatusOptions] = useState<ErpCodeValue[]>([]);
  const [decisionOptions, setDecisionOptions] = useState<ErpCodeValue[]>([]);
  const [reservations, setReservations] = useState<ProspectReservation[]>([]);
  const [reservationForm, setReservationForm] = useState<ReservationForm>(initialReservationForm);
  const [reservationView, setReservationView] = useState<ProspectReservation | null>(null);
  const [paymentForm, setPaymentForm] = useState<PaymentForm>(initialPaymentForm);
  const [reservationDrawerOpen, setReservationDrawerOpen] = useState(false);
  const [paymentDrawerOpen, setPaymentDrawerOpen] = useState(false);
  const [reservationSearch, setReservationSearch] = useState("");
  const [reservationStatusFilter, setReservationStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [savingReservation, setSavingReservation] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const prospectById = useMemo(() => new Map(prospects.flatMap((prospect) => (prospect.id === undefined ? [] : [[prospect.id, prospect]]))), [prospects]);
  const reservableOffers = useMemo(() => offers.filter((offer) => codeValueKey(offerStatusOptions, offer.status) === "ACCEPTED"), [offerStatusOptions, offers]);
  const reservationStatuses = useMemo(() => {
    const options = reservationStatusOptions.flatMap((status) => {
      const key = codeValueKeyFromText(status.value);
      return status.id && key ? [String(status.id)] : [];
    });
    for (const reservation of reservations) {
      if (reservation.status && !options.includes(String(reservation.status))) {
        options.push(String(reservation.status));
      }
    }
    return ["ALL", ...options];
  }, [reservationStatusOptions, reservations]);
  const filteredReservations = useMemo(() => {
    const query = reservationSearch.trim().toLowerCase();
    return reservations.filter((reservation) => {
      const prospect = reservation.prospectId === undefined ? undefined : prospectById.get(reservation.prospectId);
      const matchesStatus = reservationStatusFilter === "ALL" || String(reservation.status ?? "") === reservationStatusFilter;
      const matchesQuery =
        !query ||
        [
          reservation.reservationNo,
          codeValueLabel(reservationStatusOptions, reservation.status),
          codeValueLabel(decisionOptions, reservation.approvalStatus),
          reservation.offerId,
          reservation.unitId,
          prospect?.prospectNo,
          prospect?.customerName,
          prospect?.mobileNo,
        ].some((value) => String(value ?? "").toLowerCase().includes(query));
      return matchesStatus && matchesQuery;
    });
  }, [decisionOptions, prospectById, reservationSearch, reservationStatusFilter, reservationStatusOptions, reservations]);
  const reservationCards = useMemo(
    () => [
      { label: "Active Reservations", value: reservations.filter((reservation) => ["DRAFT", "PENDING_APPROVAL", "PAYMENT_PENDING", "PAID"].includes(codeValueKey(reservationStatusOptions, reservation.status) ?? "")).length, caption: "Need follow-up", captionTone: "warning" as const },
      { label: "Pending Approval", value: reservations.filter((reservation) => codeValueKey(reservationStatusOptions, reservation.status) === "PENDING_APPROVAL").length, caption: "Approval queue", captionTone: "warning" as const },
      { label: "Payment Pending", value: reservations.filter((reservation) => codeValueKey(reservationStatusOptions, reservation.status) === "PAYMENT_PENDING").length, caption: "Awaiting receipt", captionTone: "warning" as const },
      { label: "Confirmed", value: reservations.filter((reservation) => codeValueKey(reservationStatusOptions, reservation.status) === "CONFIRMED").length, caption: "Ready for lease", captionTone: "success" as const },
    ],
    [reservationStatusOptions, reservations],
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [loadedProspects, loadedOffers, loadedReservations, loadedOfferStatuses, loadedReservationStatuses, loadedDecisions] = await Promise.all([listProspects(), listOffers(), listReservations(), listCodeValues("pa_offer_status"), listCodeValues("pa_reservation_status"), listCodeValues("cf_decision")]);
      setProspects(loadedProspects);
      setOffers(loadedOffers);
      setReservations(loadedReservations);
      setOfferStatusOptions(loadedOfferStatuses);
      setReservationStatusOptions(loadedReservationStatuses);
      setDecisionOptions(loadedDecisions);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load reservations.");
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

  function openNewReservation() {
    setReservationForm({
      ...initialReservationForm,
      status: String(codeValueIdByKey(reservationStatusOptions, "DRAFT") ?? ""),
      reservationFee: "5000",
    });
    setReservationDrawerOpen(true);
  }

  function openEditReservation(reservation: ProspectReservation) {
    if (codeValueKey(reservationStatusOptions, reservation.status) !== "DRAFT") {
      return;
    }
    setReservationForm(reservationToForm(reservation));
    setReservationDrawerOpen(true);
  }

  function openViewReservation(reservation: ProspectReservation) {
    setReservationView(reservation);
  }

  async function submitReservation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const selectedOffer = reservableOffers.find((offer) => offer.id === numberValue(reservationForm.offerId));
    const prospectId = numberValue(reservationForm.prospectId) ?? selectedOffer?.prospectId;
    if (!prospectId) {
      setError("Prospect is required for reservation.");
      return;
    }

    setSavingReservation(true);
    setError("");
    setMessage("");
    try {
      const action = event.nativeEvent instanceof SubmitEvent && event.nativeEvent.submitter instanceof HTMLButtonElement ? event.nativeEvent.submitter.value : "draft";
      const status = codeValueIdByKey(reservationStatusOptions, action === "submit" ? "PENDING_APPROVAL" : "DRAFT");
      const payload = { ...formToReservation(reservationForm, prospectId), status };
      if (reservationForm.id) {
        await updateProspectReservation(reservationForm.id, payload);
        setMessage(action === "submit" ? "Reservation submitted." : "Reservation draft updated.");
      } else {
        await saveProspectReservation(payload);
        setMessage(action === "submit" ? "Reservation submitted." : "Reservation draft saved.");
      }
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
    if (!paymentForm.reservationId) {
      return;
    }

    setSavingPayment(true);
    setError("");
    setMessage("");
    try {
      await recordProspectReservationPayment(paymentForm.reservationId, formToPayment(paymentForm));
      setMessage("Reservation payment recorded.");
      await refresh();
      setPaymentDrawerOpen(false);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to record payment.");
    } finally {
      setSavingPayment(false);
    }
  }

  async function runReservationAction(reservation: ProspectReservation, action: ReservationAction) {
    if (!reservation.id) {
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
      if (action === "submit") {
        await updateProspectReservationStatus(reservation.id, { status: "PENDING_APPROVAL", comments: "Reservation submitted." });
        setMessage("Reservation submitted.");
      } else if (action === "approve") {
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
        setMessage("Lease created and reservation moved to lease.");
      }
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
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--brand)]">Customer management</p>
        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[color:var(--brand-tint)] text-[color:var(--brand)]">
                <UserCheck className="h-5 w-5" />
              </span>
              <h1 className="display-font text-3xl font-semibold text-[color:var(--brand-strong)]">Reservation List</h1>
            </div>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-[color:var(--foreground-muted)]">Manage accepted offers through reservation approval, payment, confirmation, and lease handoff.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="btn-secondary inline-flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold" onClick={refresh} type="button">
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </button>
            <button className="btn-primary inline-flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold" onClick={openNewReservation} type="button">
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>
        </div>
      </div>

      {error ? <Notice tone="danger" text={error} /> : null}
      {message ? <Notice tone="success" text={message} /> : null}

      <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-4 xl:p-6">
        {reservationCards.map((card) => (
          <article className="panel rounded-lg p-5" key={card.label}>
            <p className="text-base font-semibold text-[color:var(--foreground-muted)]">{card.label}</p>
            <p className="display-font mt-3 text-4xl font-semibold text-[color:var(--brand-strong)]">{card.value}</p>
            <p className={`mt-4 text-sm font-semibold ${card.captionTone === "success" ? "text-emerald-700" : "text-amber-700"}`}>{card.caption}</p>
          </article>
        ))}
      </div>

      <section className="px-4 pb-6 xl:px-6">
        <div className="panel overflow-hidden rounded-lg">
          <div className="border-b border-[color:var(--line)] p-5">
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_190px]">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--foreground-subtle)]" />
                <input className="field w-full rounded-lg py-3 pl-10 pr-3 text-sm" onChange={(event) => setReservationSearch(event.target.value)} placeholder="Search reservation" type="search" value={reservationSearch} />
              </label>
              <select className="field rounded-lg px-3 py-3 text-sm" onChange={(event) => setReservationStatusFilter(event.target.value)} value={reservationStatusFilter}>
                {reservationStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status === "ALL" ? "All status" : codeValueLabel(reservationStatusOptions, numberValue(status)) ?? formatLabel(status)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-3 p-4">
            {loading ? (
              <div className="flex items-center gap-2 rounded-lg border border-[color:var(--line)] bg-[color:var(--surface-muted)] p-4 text-sm text-[color:var(--foreground-muted)]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading reservations...
              </div>
            ) : null}
            {!loading && filteredReservations.length === 0 ? <p className="rounded-lg border border-[color:var(--line)] p-4 text-sm text-[color:var(--foreground-muted)]">No reservations match the selected filter.</p> : null}
            {filteredReservations.map((reservation) => {
              const prospect = reservation.prospectId === undefined ? undefined : prospectById.get(reservation.prospectId);
              return (
                <ReservationCard
                  key={reservation.id ?? reservation.reservationNo}
                  prospect={prospect}
                  reservation={reservation}
                  decisionOptions={decisionOptions}
                  reservationStatusOptions={reservationStatusOptions}
                  saving={savingReservation}
                  onAction={runReservationAction}
                  onEdit={openEditReservation}
                  onView={openViewReservation}
                />
              );
            })}
          </div>
        </div>
      </section>

      <WorkspaceDrawer eyebrow="Reservation" open={reservationDrawerOpen} title={reservationForm.id ? "Edit reservation" : "Request reservation"} onClose={() => setReservationDrawerOpen(false)}>
        <ReservationFormPanel
          approvedOffers={reservableOffers}
          form={reservationForm}
          saving={savingReservation}
          onCancel={() => setReservationDrawerOpen(false)}
          onChange={setReservationForm}
          onSubmit={submitReservation}
        />
      </WorkspaceDrawer>

      <WorkspaceDrawer eyebrow="Reservation" open={Boolean(reservationView)} title="View reservation" onClose={() => setReservationView(null)}>
        {reservationView ? <ReservationViewPanel decisionOptions={decisionOptions} reservation={reservationView} reservationStatusOptions={reservationStatusOptions} prospect={reservationView.prospectId === undefined ? undefined : prospectById.get(reservationView.prospectId)} /> : null}
      </WorkspaceDrawer>

      <WorkspaceDrawer eyebrow="Payment" open={paymentDrawerOpen} title="Record reservation payment" onClose={() => setPaymentDrawerOpen(false)}>
        <PaymentFormPanel
          form={paymentForm}
          saving={savingPayment}
          onCancel={() => setPaymentDrawerOpen(false)}
          onChange={setPaymentForm}
          onSubmit={submitPayment}
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
  preferredContactOptions,
  leadSourceOptions,
  leadPurposeOptions,
  offerStatusOptions,
  prospectStatusOptions,
  requirementLevelOptions,
  siteVisitStatusOptions,
  unitTypeOptions,
  selectedProspect,
  siteVisits,
  onProspectSearchChange,
  onProspectStatusFilterChange,
  onCreateRequirement,
  onCreateOffer,
  onCreateSiteVisit,
  onOfferAction,
  onEditProspect,
  onViewOffer,
  onSelectOffer,
  onSelectProspect,
  onSelectRequirement,
  onSelectSiteVisit,
}: ProspectBoardProps) {
  return (
    <>
      <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-5 xl:p-6">
        {prospectStageCards.map((stage) => (
          <article className="panel rounded-lg p-5" key={stage.label}>
            <p className="text-base font-semibold text-[color:var(--foreground-muted)]">{stage.label}</p>
            <p className="display-font mt-3 text-4xl font-semibold text-[color:var(--brand-strong)]">{stage.value}</p>
            <p className={`mt-4 text-sm font-semibold ${stage.captionTone === "success" ? "text-emerald-700" : "text-amber-700"}`}>{stage.caption}</p>
          </article>
        ))}
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
                    {status === "ALL" ? "All status" : codeValueLabel(prospectStatusOptions, numberValue(status)) ?? formatLabel(status)}
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
                  className="rounded-lg border p-3 text-left transition hover:border-[color:var(--brand-border)] hover:bg-[color:var(--brand-tint)]"
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
                      <p className="mt-1 truncate text-xs font-medium text-[color:var(--foreground-muted)]">{prospect.prospectNo ?? "Prospect number pending"}</p>
                    </div>
                    <StatusPill status={codeValueKey(prospectStatusOptions, prospect.status)} label={codeValueLabel(prospectStatusOptions, prospect.status)} />
                  </div>
                  <div className="mt-3 grid gap-1 text-xs text-[color:var(--foreground-muted)]">
                    <p className="truncate">{prospect.mobileNo || "-"}</p>
                    <p className="truncate">{prospect.email || "Email not captured"}</p>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <SmallPill label={codeValueLabel(leadSourceOptions, prospect.source) ?? "Source pending"} />
                    <SmallPill label={codeValueLabel(leadPurposeOptions, prospect.purpose) ?? "Purpose pending"} />
                    <SmallPill label={codeValueLabel(preferredContactOptions, prospect.preferredContactMethod) ?? "Contact pending"} />
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
          siteVisits={siteVisits}
          leadSourceOptions={leadSourceOptions}
          leadPurposeOptions={leadPurposeOptions}
          offerStatusOptions={offerStatusOptions}
          prospectStatusOptions={prospectStatusOptions}
          requirementLevelOptions={requirementLevelOptions}
          siteVisitStatusOptions={siteVisitStatusOptions}
          unitTypeOptions={unitTypeOptions}
          onCreateRequirement={onCreateRequirement}
          onCreateOffer={onCreateOffer}
          onCreateSiteVisit={onCreateSiteVisit}
          onOfferAction={onOfferAction}
          onEditProspect={onEditProspect}
          onViewOffer={onViewOffer}
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
  siteVisits,
  leadPurposeOptions,
  leadSourceOptions,
  offerStatusOptions,
  prospectStatusOptions,
  requirementLevelOptions,
  siteVisitStatusOptions,
  unitTypeOptions,
  onCreateRequirement,
  onCreateOffer,
  onCreateSiteVisit,
  onOfferAction,
  onEditProspect,
  onViewOffer,
  onSelectOffer,
  onSelectRequirement,
  onSelectSiteVisit,
}: {
  prospect: Prospect | null;
  requirements: ProspectRequirement[];
  offers: ProspectOffer[];
  siteVisits: ProspectSiteVisit[];
  leadPurposeOptions: ErpCodeValue[];
  leadSourceOptions: ErpCodeValue[];
  offerStatusOptions: ErpCodeValue[];
  prospectStatusOptions: ErpCodeValue[];
  requirementLevelOptions: ErpCodeValue[];
  siteVisitStatusOptions: ErpCodeValue[];
  unitTypeOptions: ErpCodeValue[];
  onCreateRequirement: () => void;
  onCreateOffer: () => void;
  onCreateSiteVisit: () => void;
  onOfferAction: (offer: ProspectOffer, action: OfferAction) => void;
  onEditProspect: (prospect: Prospect) => void;
  onViewOffer: (offer: ProspectOffer) => void;
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
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <StatusPill status={codeValueKey(prospectStatusOptions, prospect.status)} label={codeValueLabel(prospectStatusOptions, prospect.status)} />
            <button className="btn-secondary inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold" onClick={() => onEditProspect(prospect)} type="button">
              <Edit3 className="h-3.5 w-3.5" />
              Edit
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
        <DetailItem label="Customer code" value={prospect.customerCode} />
        <DetailItem label="Customer type" value={prospect.customerTypeName} />
        <DetailItem label="Trade license no" value={prospect.tradeLicenseNo} />
        <DetailItem label="CR number" value={prospect.crNumber} />
        <DetailItem label="VAT registration no" value={prospect.vatRegistrationNo} />
        <DetailItem label="Contact person" value={prospect.contactPerson} />
        <DetailItem label="Contact role" value={prospect.contactRole} />
        <DetailItem label="Contact title" value={prospect.contactTitle} />
        <DetailItem label="Mobile no" value={prospect.mobileNo} />
        <DetailItem label="Phone no" value={prospect.phoneNo} />
        <DetailItem label="Email" value={prospect.email} />
        <DetailItem label="Fax no" value={prospect.faxNo} />
        <DetailItem label="Address" value={prospect.address} />
        <DetailItem label="Source" value={codeValueLabel(leadSourceOptions, prospect.source)} />
        <DetailItem label="Purpose" value={codeValueLabel(leadPurposeOptions, prospect.purpose)} />
        <DetailItem label="Commercial need" value={prospect.commercialNeed} />
        <DetailItem label="Company id" value={prospect.companyId === undefined ? undefined : String(prospect.companyId)} />
        <DetailItem label="Lead id" value={prospect.leadId === undefined ? undefined : String(prospect.leadId)} />
        <DetailItem label="Status" value={codeValueLabel(prospectStatusOptions, prospect.status)} />
        <DetailItem label="Created by" value={prospect.createdBy === undefined ? undefined : String(prospect.createdBy)} />
      </div>

      <div className="border-t border-[color:var(--line)] p-5 sm:p-6">
        <h3 className="text-sm font-semibold text-[color:var(--brand-strong)]">Document notes</h3>
        <p className="mt-3 min-h-20 rounded-lg border border-[color:var(--line)] bg-[color:var(--surface-muted)] p-4 text-sm leading-6 text-[color:var(--foreground-muted)]">
          {prospect.documentNotes || "No customer document notes captured yet."}
        </p>
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
                  <p className="text-sm font-semibold text-[color:var(--brand-strong)]">{requirement.propertyName || codeValueLabel(unitTypeOptions, requirement.unitType) || "Requirement"}</p>
                  <p className="mt-1 text-sm text-[color:var(--foreground-muted)]">
                    {formatRequirementSummary(requirement, requirementLevelOptions, unitTypeOptions)}
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
                    {formatSiteVisitSummary(siteVisit, requirementLevelOptions, siteVisitStatusOptions)}
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
          {offers.map((offer) => {
            const offerStatus = codeValueKey(offerStatusOptions, offer.status);
            return (
            <div
              className="rounded-lg border border-[color:var(--line)] bg-[color:var(--surface-raised)] p-4 transition hover:border-[color:var(--brand-border)] hover:bg-[color:var(--brand-tint)]"
              key={offer.id ?? `${offer.prospectId}-${offer.unitId}-${offer.finalAmount}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[color:var(--brand-strong)]">{offer.offerNo || "Offer"}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {offerStatus === "DRAFT" ? (
                    <button aria-label="Edit offer" className="btn-secondary inline-flex h-9 w-9 items-center justify-center rounded-lg" onClick={() => onSelectOffer(offer)} title="Edit offer" type="button">
                      <Edit3 className="h-4 w-4" />
                    </button>
                  ) : (
                    <button aria-label="View offer" className="btn-secondary inline-flex h-9 w-9 items-center justify-center rounded-lg" onClick={() => onViewOffer(offer)} title="View offer" type="button">
                      <Search className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              <p className="mt-2 text-sm text-[color:var(--foreground-muted)]">
                {formatOfferSummary(offer)}
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <span className="rounded-full border border-[color:var(--line)] bg-[color:var(--surface-muted)] px-3 py-1 text-xs font-semibold text-[color:var(--brand-strong)]">
                  {codeValueLabel(offerStatusOptions, offer.status) ?? "Draft"}
                </span>
                <div className="flex flex-wrap justify-end gap-2">
                  {offerStatus === "PENDING_APPROVAL" ? (
                    <>
                      <button className="btn-secondary rounded-lg px-3 py-2 text-xs font-semibold" onClick={() => onOfferAction(offer, "approve")} type="button">
                        Approve
                      </button>
                      <button className="btn-secondary rounded-lg px-3 py-2 text-xs font-semibold" onClick={() => onOfferAction(offer, "reject")} type="button">
                        Reject
                      </button>
                    </>
                  ) : null}
                  {offerStatus === "APPROVED" ? (
                    <button className="btn-secondary rounded-lg px-3 py-2 text-xs font-semibold" onClick={() => onOfferAction(offer, "send")} type="button">
                      Send
                    </button>
                  ) : null}
                  {offerStatus === "SENT" || offerStatus === "NEGOTIATION" ? (
                    <>
                      <button className="btn-secondary rounded-lg px-3 py-2 text-xs font-semibold" onClick={() => onOfferAction(offer, "negotiate")} type="button">
                        Negotiation
                      </button>
                      <button className="btn-secondary rounded-lg px-3 py-2 text-xs font-semibold" onClick={() => onOfferAction(offer, "accept")} type="button">
                        Accept
                      </button>
                      <button className="btn-secondary rounded-lg px-3 py-2 text-xs font-semibold" onClick={() => onOfferAction(offer, "reject")} type="button">
                        Reject
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
            );
          })}
        </div>
      </div>

    </section>
  );
}

function ProspectFormPanel({
  form,
  customerTypeOptions,
  preferredContactOptions,
  leadSourceOptions,
  leadPurposeOptions,
  saving,
  onCancel,
  onChange,
  onSubmit,
}: {
  form: ProspectForm;
  customerTypeOptions: ErpCodeValue[];
  preferredContactOptions: ErpCodeValue[];
  leadSourceOptions: ErpCodeValue[];
  leadPurposeOptions: ErpCodeValue[];
  saving: boolean;
  onCancel: () => void;
  onChange: (form: ProspectForm) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const canSave = Boolean(form.customerName.trim() && form.mobileNo.trim());

  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <CodeValueSelect
        label="Customer type"
        value={form.customerType === undefined ? "" : String(form.customerType)}
        options={customerTypeOptions}
        onChange={(value) => {
          const selectedType = customerTypeOptions.find((option) => String(option.id) === value);
          onChange({ ...form, customerType: numberValue(value), customerTypeName: selectedType?.value });
        }}
      />
      <Field label="Customer name" required value={form.customerName} onChange={(value) => onChange({ ...form, customerName: value })} />
      <Field label="Trade license no" value={form.tradeLicenseNo} onChange={(value) => onChange({ ...form, tradeLicenseNo: value })} />
      <Field label="CR number" value={form.crNumber} onChange={(value) => onChange({ ...form, crNumber: value })} />
      <Field label="VAT registration no" value={form.vatRegistrationNo} onChange={(value) => onChange({ ...form, vatRegistrationNo: value })} />
      <Field label="Contact person" value={form.contactPerson} onChange={(value) => onChange({ ...form, contactPerson: value })} />
      <Field label="Contact role" value={form.contactRole} onChange={(value) => onChange({ ...form, contactRole: value })} />
      <Field label="Contact title" value={form.contactTitle} onChange={(value) => onChange({ ...form, contactTitle: value })} />
      <Field label="Mobile no" required value={form.mobileNo} onChange={(value) => onChange({ ...form, mobileNo: value })} />
      <Field label="Phone no" value={form.phoneNo} onChange={(value) => onChange({ ...form, phoneNo: value })} />
      <Field label="Email" type="email" value={form.email} onChange={(value) => onChange({ ...form, email: value })} />
      <CodeValueSelect label="Preferred contact" value={form.preferredContactMethod === undefined ? "" : String(form.preferredContactMethod)} options={preferredContactOptions} onChange={(value) => onChange({ ...form, preferredContactMethod: numberValue(value) })} />
      <Field label="Fax no" value={form.faxNo} onChange={(value) => onChange({ ...form, faxNo: value })} />
      <CodeValueSelect label="Source" value={form.source} options={leadSourceOptions} onChange={(value) => onChange({ ...form, source: value })} />
      <CodeValueSelect label="Purpose" value={form.purpose} options={leadPurposeOptions} onChange={(value) => onChange({ ...form, purpose: value })} />
      <Field label="Commercial need" value={form.commercialNeed} onChange={(value) => onChange({ ...form, commercialNeed: value })} />
      <label className="grid gap-2 text-sm font-semibold text-[color:var(--brand-strong)]">
        Address
        <textarea className="field min-h-20 rounded-lg px-3 py-3 text-sm" value={form.address} onChange={(event) => onChange({ ...form, address: event.target.value })} />
      </label>
      <label className="grid gap-2 text-sm font-semibold text-[color:var(--brand-strong)]">
        Document notes
        <textarea className="field min-h-24 rounded-lg px-3 py-3 text-sm" value={form.documentNotes} onChange={(event) => onChange({ ...form, documentNotes: event.target.value })} />
      </label>
      <div className="flex items-center justify-end gap-3 pt-2">
        <button className="btn-secondary rounded-lg px-4 py-3 text-sm font-semibold" onClick={onCancel} type="button">
          Cancel
        </button>
        <button className="btn-primary inline-flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold disabled:opacity-50" disabled={saving || !canSave} type="submit">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Update Prospect
        </button>
      </div>
    </form>
  );
}

function OfferViewPanel({ offer, offerStatusOptions }: { offer: ProspectOffer; offerStatusOptions: ErpCodeValue[] }) {
  return (
    <div className="grid gap-4">
      <DetailItem label="Offer no" value={offer.offerNo} />
      <DetailItem label="Status" value={codeValueLabel(offerStatusOptions, offer.status)} />
      <DetailItem label="Location" value={formatOfferLocation(offer)} />
      <DetailItem label="Base amount" value={offer.baseAmount === undefined ? undefined : String(offer.baseAmount)} />
      <DetailItem label="Discount amount" value={offer.discountAmount === undefined ? undefined : String(offer.discountAmount)} />
      <DetailItem label="Final amount" value={offer.finalAmount === undefined ? undefined : String(offer.finalAmount)} />
      <DetailItem label="Approval required" value={offer.approvalRequired ? "Yes" : "No"} />
      <div className="rounded-lg border border-[color:var(--line)] bg-[color:var(--surface-raised)] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--foreground-muted)]">Special terms</p>
        <p className="mt-2 whitespace-pre-wrap text-sm font-semibold text-[color:var(--brand-strong)]">{offer.specialTerms || "-"}</p>
      </div>
    </div>
  );
}

function ReservationCard({
  prospect,
  reservation,
  decisionOptions,
  reservationStatusOptions,
  saving,
  onAction,
  onEdit,
  onView,
}: {
  prospect?: Prospect;
  reservation: ProspectReservation;
  decisionOptions: ErpCodeValue[];
  reservationStatusOptions: ErpCodeValue[];
  saving: boolean;
  onAction: (reservation: ProspectReservation, action: ReservationAction) => void;
  onEdit: (reservation: ProspectReservation) => void;
  onView: (reservation: ProspectReservation) => void;
}) {
  const reservationStatus = codeValueKey(reservationStatusOptions, reservation.status);

  return (
    <div className="rounded-lg border border-[color:var(--line)] bg-[color:var(--surface-raised)] p-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-[color:var(--brand-strong)]">{reservation.reservationNo || "Reservation"}</p>
            <span className="rounded-full border border-[color:var(--line)] bg-[color:var(--surface-muted)] px-3 py-1 text-xs font-semibold text-[color:var(--brand-strong)]">
              {codeValueLabel(reservationStatusOptions, reservation.status) ?? "Draft"}
            </span>
          </div>
          <p className="mt-1 text-sm text-[color:var(--foreground-muted)]">{prospect?.customerName || `Prospect ${reservation.prospectId ?? "-"}`}</p>
          <p className="mt-2 text-sm text-[color:var(--foreground-muted)]">{formatReservationSummary(reservation, reservationStatusOptions, decisionOptions)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {reservationStatus === "DRAFT" ? (
            <button className="btn-secondary inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-50" disabled={saving} onClick={() => onEdit(reservation)} type="button">
              <Edit3 className="h-3.5 w-3.5" />
              Edit
            </button>
          ) : (
            <button className="btn-secondary inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-50" disabled={saving} onClick={() => onView(reservation)} type="button">
              <Search className="h-3.5 w-3.5" />
              View
            </button>
          )}
          {reservationStatus === "PENDING_APPROVAL" ? (
            <>
              <button className="btn-secondary rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-50" disabled={saving} onClick={() => onAction(reservation, "approve")} type="button">
                Approve
              </button>
              <button className="btn-secondary rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-50" disabled={saving} onClick={() => onAction(reservation, "reject")} type="button">
                Reject
              </button>
            </>
          ) : null}
          {reservationStatus === "DRAFT" ? (
            <button className="btn-secondary rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-50" disabled={saving} onClick={() => onAction(reservation, "submit")} type="button">
              Submit
            </button>
          ) : null}
          {reservationStatus === "PAYMENT_PENDING" ? (
            <button className="btn-secondary rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-50" disabled={saving} onClick={() => onAction(reservation, "payment")} type="button">
              Payment
            </button>
          ) : null}
          {reservationStatus === "PAID" ? (
            <button className="btn-secondary rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-50" disabled={saving} onClick={() => onAction(reservation, "confirm")} type="button">
              Confirm
            </button>
          ) : null}
          {reservationStatus === "CONFIRMED" ? (
            <button className="btn-secondary rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-50" disabled={saving} onClick={() => onAction(reservation, "move")} type="button">
              Create Lease
            </button>
          ) : null}
          {["REJECTED", "CANCELLED", "EXPIRED", "MOVED_TO_LEASE"].includes(reservationStatus ?? "") ? (
            <span className="rounded-lg border border-[color:var(--line)] px-3 py-2 text-xs font-semibold text-[color:var(--foreground-muted)]">No action</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ReservationViewPanel({
  decisionOptions,
  prospect,
  reservation,
  reservationStatusOptions,
}: {
  decisionOptions: ErpCodeValue[];
  prospect?: Prospect;
  reservation: ProspectReservation;
  reservationStatusOptions: ErpCodeValue[];
}) {
  return (
    <div className="grid gap-4">
      <DetailItem label="Reservation no" value={reservation.reservationNo} />
      <DetailItem label="Status" value={codeValueLabel(reservationStatusOptions, reservation.status)} />
      <DetailItem label="Customer" value={prospect?.customerName} />
      <DetailItem label="Prospect no" value={prospect?.prospectNo} />
      <DetailItem label="Offer id" value={reservation.offerId === undefined ? undefined : String(reservation.offerId)} />
      <DetailItem label="Property id" value={reservation.propertyId === undefined ? undefined : String(reservation.propertyId)} />
      <DetailItem label="Block id" value={reservation.blockId === undefined ? undefined : String(reservation.blockId)} />
      <DetailItem label="Floor id" value={reservation.floorId === undefined ? undefined : String(reservation.floorId)} />
      <DetailItem label="Unit id" value={reservation.unitId === undefined ? undefined : String(reservation.unitId)} />
      <DetailItem label="Approval" value={codeValueLabel(decisionOptions, reservation.approvalStatus)} />
      <DetailItem label="Reservation fee" value={reservation.reservationFee === undefined ? undefined : String(reservation.reservationFee)} />
      <DetailItem label="Paid amount" value={reservation.paidAmount === undefined ? undefined : String(reservation.paidAmount)} />
      <DetailItem label="Payment waived" value={reservation.paymentWaived ? "Yes" : "No"} />
      <DetailItem label="Expires at" value={formatDateTime(reservation.expiresAt)} />
    </div>
  );
}

function RequirementFormPanel({
  form,
  requirementLevelOptions,
  saving,
  unitTypeOptions,
  onCancel,
  onChange,
  onSubmit,
}: {
  form: RequirementForm;
  requirementLevelOptions: ErpCodeValue[];
  saving: boolean;
  unitTypeOptions: ErpCodeValue[];
  onCancel: () => void;
  onChange: (form: RequirementForm) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <CodeValueSelect label="Requirement level" value={form.requirementLevel} options={requirementLevelOptions} onChange={(value) => onChange({ ...form, requirementLevel: value })} />
      <CodeValueSelect label="Unit type" value={form.unitType} options={unitTypeOptions} onChange={(value) => onChange({ ...form, unitType: value })} />
      <Field label="Bedrooms" type="number" value={form.bedrooms} onChange={(value) => onChange({ ...form, bedrooms: value })} />
      <Field label="Area from" type="number" value={form.areaFrom} onChange={(value) => onChange({ ...form, areaFrom: value })} />
      <Field label="Area to" type="number" value={form.areaTo} onChange={(value) => onChange({ ...form, areaTo: value })} />
      <Field label="Budget from" type="number" value={form.budgetFrom} onChange={(value) => onChange({ ...form, budgetFrom: value })} />
      <Field label="Budget to" type="number" value={form.budgetTo} onChange={(value) => onChange({ ...form, budgetTo: value })} />
      <Field label="Move-in date" type="date" value={form.moveInDate} onChange={(value) => onChange({ ...form, moveInDate: value })} />
      <Field label="Lease term months" type="number" value={form.leaseTermMonths} onChange={(value) => onChange({ ...form, leaseTermMonths: value })} />
      <Field label="Usage / permitted activity" value={form.usageType} onChange={(value) => onChange({ ...form, usageType: value })} />
      <label className="flex items-center gap-3 rounded-lg border border-[color:var(--line)] bg-[color:var(--surface-raised)] px-3 py-3 text-sm font-semibold text-[color:var(--brand-strong)]">
        <input checked={form.parkingRequired} className="h-4 w-4" onChange={(event) => onChange({ ...form, parkingRequired: event.target.checked })} type="checkbox" />
        Parking required
      </label>
      <label className="flex items-center gap-3 rounded-lg border border-[color:var(--line)] bg-[color:var(--surface-raised)] px-3 py-3 text-sm font-semibold text-[color:var(--brand-strong)]">
        <input checked={form.fitOutRequired} className="h-4 w-4" onChange={(event) => onChange({ ...form, fitOutRequired: event.target.checked })} type="checkbox" />
        Fit-out required
      </label>
      <label className="grid gap-2 text-sm font-semibold text-[color:var(--brand-strong)]">
        Special requirements
        <textarea className="field min-h-24 rounded-lg px-3 py-3 text-sm" value={form.specialRequirements} onChange={(event) => onChange({ ...form, specialRequirements: event.target.value })} />
      </label>
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
  requirementLevelOptions,
  saving,
  siteVisitStatusOptions,
  onCancel,
  onChange,
  onSubmit,
}: {
  form: SiteVisitForm;
  requirementLevelOptions: ErpCodeValue[];
  saving: boolean;
  siteVisitStatusOptions: ErpCodeValue[];
  onCancel: () => void;
  onChange: (form: SiteVisitForm) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const [properties, setProperties] = useState<PropertyMaster[]>([]);
  const [blocksState, setBlocksState] = useState<{ propertyId: string; items: MasterRecord[] }>({ propertyId: "", items: [] });
  const [floorsState, setFloorsState] = useState<{ blockId: string; items: MasterRecord[] }>({ blockId: "", items: [] });
  const [unitsState, setUnitsState] = useState<{ floorId: string; items: MasterRecord[] }>({ floorId: "", items: [] });
  const blocks = useMemo(() => (blocksState.propertyId === form.propertyId ? blocksState.items : []), [blocksState, form.propertyId]);
  const floors = useMemo(() => (floorsState.blockId === form.blockId ? floorsState.items : []), [floorsState, form.blockId]);
  const units = useMemo(() => (unitsState.floorId === form.floorId ? unitsState.items : []), [unitsState, form.floorId]);
  const propertyOptions = useMemo(
    () => masterPropertyOptions(properties, form.propertyId, form.propertyName),
    [form.propertyId, form.propertyName, properties],
  );
  const blockOptions = useMemo(
    () => masterRecordOptions(blocks, form.blockId, form.blockName),
    [blocks, form.blockId, form.blockName],
  );
  const floorOptions = useMemo(
    () => masterRecordOptions(floors, form.floorId, form.floorName),
    [floors, form.floorId, form.floorName],
  );
  const unitOptions = useMemo(
    () => masterRecordOptions(units, form.unitId, form.unitId ? `Unit ${form.unitId}` : ""),
    [form.unitId, units],
  );
  const requirementLevelKey = codeValueKey(requirementLevelOptions, numberValue(form.requirementLevel));
  const requiresBlock = requirementLevelKey === "BLOCK" || requirementLevelKey === "FLOOR" || requirementLevelKey === "UNIT";
  const requiresFloor = requirementLevelKey === "FLOOR" || requirementLevelKey === "UNIT";
  const requiresUnit = requirementLevelKey === "UNIT";
  const canSave = Boolean(form.propertyId && form.visitAt && (!requiresBlock || form.blockId) && (!requiresFloor || form.floorId) && (!requiresUnit || form.unitId));

  useEffect(() => {
    let active = true;
    listProperties({ pageSize: 100 })
      .then((items) => {
        if (active) {
          setProperties(items);
        }
      })
      .catch(() => {
        if (active) {
          setProperties([]);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!form.propertyId) {
      return;
    }
    let active = true;
    listBlocks(Number(form.propertyId))
      .then((items) => {
        if (active) {
          setBlocksState({ propertyId: form.propertyId, items });
        }
      })
      .catch(() => {
        if (active) {
          setBlocksState({ propertyId: form.propertyId, items: [] });
        }
      });
    return () => {
      active = false;
    };
  }, [form.propertyId]);

  useEffect(() => {
    if (!form.blockId) {
      return;
    }
    let active = true;
    listFloors(Number(form.blockId))
      .then((items) => {
        if (active) {
          setFloorsState({ blockId: form.blockId, items });
        }
      })
      .catch(() => {
        if (active) {
          setFloorsState({ blockId: form.blockId, items: [] });
        }
      });
    return () => {
      active = false;
    };
  }, [form.blockId]);

  useEffect(() => {
    if (!form.floorId) {
      return;
    }
    let active = true;
    listUnits(Number(form.floorId))
      .then((items) => {
        if (active) {
          setUnitsState({ floorId: form.floorId, items });
        }
      })
      .catch(() => {
        if (active) {
          setUnitsState({ floorId: form.floorId, items: [] });
        }
      });
    return () => {
      active = false;
    };
  }, [form.floorId]);

  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <CodeValueSelect
        label="Requirement level"
        value={form.requirementLevel}
        options={requirementLevelOptions}
        onChange={(value) =>
          onChange({
            ...form,
            requirementLevel: value,
            blockId: codeValueKey(requirementLevelOptions, numberValue(value)) === "PROPERTY" ? "" : form.blockId,
            blockName: codeValueKey(requirementLevelOptions, numberValue(value)) === "PROPERTY" ? "" : form.blockName,
            floorId: ["FLOOR", "UNIT"].includes(codeValueKey(requirementLevelOptions, numberValue(value)) ?? "") ? form.floorId : "",
            floorName: ["FLOOR", "UNIT"].includes(codeValueKey(requirementLevelOptions, numberValue(value)) ?? "") ? form.floorName : "",
            unitId: codeValueKey(requirementLevelOptions, numberValue(value)) === "UNIT" ? form.unitId : "",
          })
        }
      />
      <OptionSelect
        label="Property"
        options={propertyOptions}
        required
        value={form.propertyId}
        onChange={(value) => {
          const property = properties.find((item) => item.id !== undefined && String(item.id) === value);
          onChange({
            ...form,
            propertyId: value,
            propertyName: property?.name ?? "",
            blockId: "",
            blockName: "",
            floorId: "",
            floorName: "",
            unitId: "",
          });
        }}
      />
      {requiresBlock ? (
        <OptionSelect
          label="Block / building"
          options={blockOptions}
          required
          value={form.blockId}
          onChange={(value) => {
            const block = blocks.find((item) => item.id !== undefined && String(item.id) === value);
            onChange({ ...form, blockId: value, blockName: block?.name ?? "", floorId: "", floorName: "", unitId: "" });
          }}
        />
      ) : null}
      {requiresFloor ? (
        <OptionSelect
          label="Floor"
          options={floorOptions}
          required
          value={form.floorId}
          onChange={(value) => {
            const floor = floors.find((item) => item.id !== undefined && String(item.id) === value);
            onChange({ ...form, floorId: value, floorName: floor?.name ?? "", unitId: "" });
          }}
        />
      ) : null}
      {requiresUnit ? <OptionSelect label="Unit" options={unitOptions} required value={form.unitId} onChange={(value) => onChange({ ...form, unitId: value })} /> : null}
      <Field label="Visit date and time" required type="datetime-local" value={form.visitAt} onChange={(value) => onChange({ ...form, visitAt: value })} />
      <CodeValueSelect label="Status" value={form.status} options={siteVisitStatusOptions} onChange={(value) => onChange({ ...form, status: value })} />
      <label className="grid gap-2 text-sm font-semibold text-[color:var(--brand-strong)]">
        Notes
        <textarea className="field min-h-28 rounded-lg px-3 py-3 text-sm" value={form.notes} onChange={(event) => onChange({ ...form, notes: event.target.value })} />
      </label>
      <div className="flex items-center justify-end gap-3 pt-2">
        <button className="btn-secondary rounded-lg px-4 py-3 text-sm font-semibold" onClick={onCancel} type="button">
          Cancel
        </button>
        <button className="btn-primary inline-flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold disabled:opacity-50" disabled={saving || !canSave} type="submit">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {form.id ? "Update Site Visit" : "Add Site Visit"}
        </button>
      </div>
    </form>
  );
}

function OfferFormPanel({
  form,
  requirementLevelOptions,
  saving,
  onCancel,
  onChange,
  onSubmit,
}: {
  form: OfferForm;
  requirementLevelOptions: ErpCodeValue[];
  saving: boolean;
  onCancel: () => void;
  onChange: (form: OfferForm) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const [properties, setProperties] = useState<PropertyMaster[]>([]);
  const [blocksState, setBlocksState] = useState<{ propertyId: string; items: MasterRecord[] }>({ propertyId: "", items: [] });
  const [floorsState, setFloorsState] = useState<{ blockId: string; items: MasterRecord[] }>({ blockId: "", items: [] });
  const [unitsState, setUnitsState] = useState<{ floorId: string; items: MasterRecord[] }>({ floorId: "", items: [] });
  const blocks = useMemo(() => (blocksState.propertyId === form.propertyId ? blocksState.items : []), [blocksState, form.propertyId]);
  const floors = useMemo(() => (floorsState.blockId === form.blockId ? floorsState.items : []), [floorsState, form.blockId]);
  const units = useMemo(() => (unitsState.floorId === form.floorId ? unitsState.items : []), [unitsState, form.floorId]);
  const propertyOptions = useMemo(
    () => masterPropertyOptions(properties, form.propertyId, form.propertyName),
    [form.propertyId, form.propertyName, properties],
  );
  const blockOptions = useMemo(
    () => masterRecordOptions(blocks, form.blockId, form.blockName),
    [blocks, form.blockId, form.blockName],
  );
  const floorOptions = useMemo(
    () => masterRecordOptions(floors, form.floorId, form.floorName),
    [floors, form.floorId, form.floorName],
  );
  const unitOptions = useMemo(
    () => masterRecordOptions(units, form.unitId, form.unitId ? `Unit ${form.unitId}` : ""),
    [form.unitId, units],
  );
  const requirementLevelKey = codeValueKey(requirementLevelOptions, numberValue(form.requirementLevel));
  const requiresBlock = requirementLevelKey === "BLOCK" || requirementLevelKey === "FLOOR" || requirementLevelKey === "UNIT";
  const requiresFloor = requirementLevelKey === "FLOOR" || requirementLevelKey === "UNIT";
  const requiresUnit = requirementLevelKey === "UNIT";
  const canSave = Boolean(form.propertyId && form.baseAmount && (!requiresBlock || form.blockId) && (!requiresFloor || form.floorId) && (!requiresUnit || form.unitId));

  useEffect(() => {
    let active = true;
    listProperties({ pageSize: 100 })
      .then((items) => {
        if (active) {
          setProperties(items);
        }
      })
      .catch(() => {
        if (active) {
          setProperties([]);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!form.propertyId) {
      return;
    }
    let active = true;
    listBlocks(Number(form.propertyId))
      .then((items) => {
        if (active) {
          setBlocksState({ propertyId: form.propertyId, items });
        }
      })
      .catch(() => {
        if (active) {
          setBlocksState({ propertyId: form.propertyId, items: [] });
        }
      });
    return () => {
      active = false;
    };
  }, [form.propertyId]);

  useEffect(() => {
    if (!form.blockId) {
      return;
    }
    let active = true;
    listFloors(Number(form.blockId))
      .then((items) => {
        if (active) {
          setFloorsState({ blockId: form.blockId, items });
        }
      })
      .catch(() => {
        if (active) {
          setFloorsState({ blockId: form.blockId, items: [] });
        }
      });
    return () => {
      active = false;
    };
  }, [form.blockId]);

  useEffect(() => {
    if (!form.floorId) {
      return;
    }
    let active = true;
    listUnits(Number(form.floorId))
      .then((items) => {
        if (active) {
          setUnitsState({ floorId: form.floorId, items });
        }
      })
      .catch(() => {
        if (active) {
          setUnitsState({ floorId: form.floorId, items: [] });
        }
      });
    return () => {
      active = false;
    };
  }, [form.floorId]);

  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <CodeValueSelect
        label="Requirement level"
        value={form.requirementLevel}
        options={requirementLevelOptions}
        onChange={(value) =>
          onChange({
            ...form,
            requirementLevel: value,
            blockId: codeValueKey(requirementLevelOptions, numberValue(value)) === "PROPERTY" ? "" : form.blockId,
            blockName: codeValueKey(requirementLevelOptions, numberValue(value)) === "PROPERTY" ? "" : form.blockName,
            floorId: ["FLOOR", "UNIT"].includes(codeValueKey(requirementLevelOptions, numberValue(value)) ?? "") ? form.floorId : "",
            floorName: ["FLOOR", "UNIT"].includes(codeValueKey(requirementLevelOptions, numberValue(value)) ?? "") ? form.floorName : "",
            unitId: codeValueKey(requirementLevelOptions, numberValue(value)) === "UNIT" ? form.unitId : "",
          })
        }
      />
      <OptionSelect
        label="Property"
        options={propertyOptions}
        required
        value={form.propertyId}
        onChange={(value) => {
          const property = properties.find((item) => item.id !== undefined && String(item.id) === value);
          onChange({
            ...form,
            propertyId: value,
            propertyName: property?.name ?? "",
            blockId: "",
            blockName: "",
            floorId: "",
            floorName: "",
            unitId: "",
          });
        }}
      />
      {requiresBlock ? (
        <OptionSelect
          label="Block / building"
          options={blockOptions}
          required
          value={form.blockId}
          onChange={(value) => {
            const block = blocks.find((item) => item.id !== undefined && String(item.id) === value);
            onChange({ ...form, blockId: value, blockName: block?.name ?? "", floorId: "", floorName: "", unitId: "" });
          }}
        />
      ) : null}
      {requiresFloor ? (
        <OptionSelect
          label="Floor"
          options={floorOptions}
          required
          value={form.floorId}
          onChange={(value) => {
            const floor = floors.find((item) => item.id !== undefined && String(item.id) === value);
            onChange({ ...form, floorId: value, floorName: floor?.name ?? "", unitId: "" });
          }}
        />
      ) : null}
      {requiresUnit ? <OptionSelect label="Unit" options={unitOptions} required value={form.unitId} onChange={(value) => onChange({ ...form, unitId: value })} /> : null}
      <Field label="Base amount" type="number" value={form.baseAmount} onChange={(value) => onChange({ ...form, baseAmount: value })} />
      <Field label="Discount amount" type="number" value={form.discountAmount} onChange={(value) => onChange({ ...form, discountAmount: value })} />
      <Field label="Final amount" type="number" value={form.finalAmount} onChange={(value) => onChange({ ...form, finalAmount: value })} />
      <label className="grid gap-2 text-sm font-semibold text-[color:var(--brand-strong)]">
        Special terms
        <textarea className="field min-h-28 rounded-lg px-3 py-3 text-sm" value={form.specialTerms} onChange={(event) => onChange({ ...form, specialTerms: event.target.value })} />
      </label>
      <div className="flex items-center justify-end gap-3 pt-2">
        <button className="btn-secondary rounded-lg px-4 py-3 text-sm font-semibold" onClick={onCancel} type="button">
          Cancel
        </button>
        <button className="btn-secondary inline-flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold disabled:opacity-50" disabled={saving || !canSave} type="submit" value="draft">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Draft
        </button>
        <button className="btn-primary inline-flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold disabled:opacity-50" disabled={saving || !canSave} type="submit" value="submit">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Submit
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
  const selectedOffer = approvedOffers.find((offer) => offer.id === numberValue(form.offerId));

  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <label className="grid gap-2 text-sm font-semibold text-[color:var(--brand-strong)]">
        Offer
        <select
          className="field rounded-lg px-3 py-3 text-sm"
          value={form.offerId}
          onChange={(event) => {
            const offer = approvedOffers.find((item) => item.id === numberValue(event.target.value));
            onChange({ ...form, offerId: event.target.value, prospectId: offer?.prospectId === undefined ? "" : String(offer.prospectId) });
          }}
        >
          <option value="">Select accepted offer</option>
          {approvedOffers.map((offer) => (
            <option key={offer.id ?? offer.offerNo} value={offer.id}>
              {formatOfferLookupLabel(offer)}
            </option>
          ))}
        </select>
      </label>
      {selectedOffer?.prospectId !== undefined ? <DetailItem label="Prospect id" value={String(selectedOffer.prospectId)} /> : null}
      {approvedOffers.length === 0 ? <p className="rounded-lg border border-[color:var(--line)] p-3 text-sm text-[color:var(--foreground-muted)]">No accepted offers available for reservation.</p> : null}
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
        <button className="btn-secondary inline-flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold disabled:opacity-50" disabled={saving || !form.offerId} type="submit" value="draft">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Draft
        </button>
        <button className="btn-primary inline-flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold disabled:opacity-50" disabled={saving || !form.offerId} type="submit" value="submit">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Submit
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

function OptionSelect({ label, value, options, onChange, required = false }: { label: string; value: string; options: SelectOption[]; onChange: (value: string) => void; required?: boolean }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[color:var(--brand-strong)]">
      {label}
      <select className="field rounded-lg px-3 py-3 text-sm" required={required} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Select {label.toLowerCase()}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function CodeValueSelect({ label, value, options, onChange }: { label: string; value: string; options: ErpCodeValue[]; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[color:var(--brand-strong)]">
      {label}
      <select className="field rounded-lg px-3 py-3 text-sm" value={value} onChange={(event) => onChange(event.target.value)}>
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

function prospectToForm(prospect: Prospect): ProspectForm {
  return {
    id: prospect.id,
    customerType: prospect.customerType,
    customerTypeName: prospect.customerTypeName,
    customerName: prospect.customerName ?? "",
    tradeLicenseNo: prospect.tradeLicenseNo ?? "",
    crNumber: prospect.crNumber ?? "",
    vatRegistrationNo: prospect.vatRegistrationNo ?? "",
    contactPerson: prospect.contactPerson ?? "",
    contactRole: prospect.contactRole ?? "",
    contactTitle: prospect.contactTitle ?? "",
    mobileNo: prospect.mobileNo ?? "",
    phoneNo: prospect.phoneNo ?? "",
    email: prospect.email ?? "",
    preferredContactMethod: prospect.preferredContactMethod,
    faxNo: prospect.faxNo ?? "",
    address: prospect.address ?? "",
    source: prospect.source === undefined ? "" : String(prospect.source),
    purpose: prospect.purpose === undefined ? "" : String(prospect.purpose),
    commercialNeed: prospect.commercialNeed ?? "",
    documentNotes: prospect.documentNotes ?? "",
  };
}

function formToProspect(form: ProspectForm): Prospect {
  return {
    id: form.id,
    customerType: form.customerType,
    customerTypeName: form.customerTypeName,
    customerName: form.customerName.trim(),
    tradeLicenseNo: emptyToUndefined(form.tradeLicenseNo),
    crNumber: emptyToUndefined(form.crNumber),
    vatRegistrationNo: emptyToUndefined(form.vatRegistrationNo),
    contactPerson: emptyToUndefined(form.contactPerson),
    contactRole: emptyToUndefined(form.contactRole),
    contactTitle: emptyToUndefined(form.contactTitle),
    mobileNo: form.mobileNo.trim(),
    phoneNo: emptyToUndefined(form.phoneNo),
    email: emptyToUndefined(form.email),
    preferredContactMethod: form.preferredContactMethod,
    faxNo: emptyToUndefined(form.faxNo),
    address: emptyToUndefined(form.address),
    source: numberValue(form.source),
    purpose: numberValue(form.purpose),
    commercialNeed: emptyToUndefined(form.commercialNeed),
    documentNotes: emptyToUndefined(form.documentNotes),
  };
}

function requirementToForm(requirement?: ProspectRequirement): RequirementForm | null {
  if (!requirement) {
    return null;
  }
  return {
    id: requirement.id,
    propertyId: requirement.propertyId === undefined ? "" : String(requirement.propertyId),
    propertyName: requirement.propertyName ?? "",
    requirementLevel: requirement.requirementLevel === undefined ? "" : String(requirement.requirementLevel),
    blockName: requirement.blockName ?? "",
    floorName: requirement.floorName ?? "",
    preferredUnitId: requirement.preferredUnitId === undefined ? "" : String(requirement.preferredUnitId),
    unitType: requirement.unitType === undefined ? "" : String(requirement.unitType),
    bedrooms: requirement.bedrooms === undefined ? "" : String(requirement.bedrooms),
    areaFrom: requirement.areaFrom === undefined ? "" : String(requirement.areaFrom),
    areaTo: requirement.areaTo === undefined ? "" : String(requirement.areaTo),
    budgetFrom: requirement.budgetFrom === undefined ? "" : String(requirement.budgetFrom),
    budgetTo: requirement.budgetTo === undefined ? "" : String(requirement.budgetTo),
    moveInDate: requirement.moveInDate ?? "",
    leaseTermMonths: requirement.leaseTermMonths === undefined ? "" : String(requirement.leaseTermMonths),
    usageType: requirement.usageType ?? "",
    parkingRequired: Boolean(requirement.parkingRequired),
    fitOutRequired: Boolean(requirement.fitOutRequired),
    specialRequirements: requirement.specialRequirements ?? "",
    notes: requirement.notes ?? "",
  };
}

function formToRequirement(form: RequirementForm, prospectId: number): ProspectRequirement {
  return {
    id: form.id,
    prospectId,
    requirementLevel: numberValue(form.requirementLevel),
    unitType: numberValue(form.unitType),
    bedrooms: numberValue(form.bedrooms),
    areaFrom: numberValue(form.areaFrom),
    areaTo: numberValue(form.areaTo),
    budgetFrom: numberValue(form.budgetFrom),
    budgetTo: numberValue(form.budgetTo),
    moveInDate: emptyToUndefined(form.moveInDate),
    leaseTermMonths: numberValue(form.leaseTermMonths),
    usageType: emptyToUndefined(form.usageType),
    parkingRequired: form.parkingRequired,
    fitOutRequired: form.fitOutRequired,
    specialRequirements: emptyToUndefined(form.specialRequirements),
    notes: emptyToUndefined(form.notes),
  };
}

function initialSiteVisitFormForRequirements(requirements: ProspectRequirement[]): SiteVisitForm {
  const requirement = requirements.find((item) => item.requirementLevel) ?? requirements[0];
  return {
    ...initialSiteVisitForm,
    propertyId: requirement?.propertyId === undefined ? "" : String(requirement.propertyId),
    propertyName: requirement?.propertyName ?? "",
    requirementLevel: requirement?.requirementLevel === undefined ? "" : String(requirement.requirementLevel),
    blockId: "",
    blockName: requirement?.blockName ?? "",
    floorId: "",
    floorName: requirement?.floorName ?? "",
    unitId: requirement?.preferredUnitId === undefined ? "" : String(requirement.preferredUnitId),
  };
}

function initialOfferFormForRequirements(requirements: ProspectRequirement[]): OfferForm {
  const requirement = requirements.find((item) => item.requirementLevel) ?? requirements[0];
  return {
    ...initialOfferForm,
    propertyId: requirement?.propertyId === undefined ? "" : String(requirement.propertyId),
    propertyName: requirement?.propertyName ?? "",
    requirementLevel: requirement?.requirementLevel === undefined ? "" : String(requirement.requirementLevel),
    blockId: "",
    blockName: requirement?.blockName ?? "",
    floorId: "",
    floorName: requirement?.floorName ?? "",
    unitId: requirement?.preferredUnitId === undefined ? "" : String(requirement.preferredUnitId),
  };
}

function masterPropertyOptions(properties: PropertyMaster[], currentId: string, currentName: string): SelectOption[] {
  const options = properties.flatMap((property) =>
    property.id === undefined
      ? []
      : [
          {
            value: String(property.id),
            label: property.name ? `${property.name} (${property.id})` : `Property ${property.id}`,
          },
        ],
  );
  if (currentId && !options.some((option) => option.value === currentId)) {
    options.push({ value: currentId, label: currentName ? `${currentName} (${currentId})` : `Property ${currentId}` });
  }
  return uniqueOptions(options);
}

function masterRecordOptions(records: MasterRecord[], currentId: string, currentName: string): SelectOption[] {
  const options = records.flatMap((record) =>
    record.id === undefined
      ? []
      : [
          {
            value: String(record.id),
            label: record.code ? `${record.code} - ${record.name}` : record.name || `Record ${record.id}`,
          },
        ],
  );
  if (currentId && !options.some((option) => option.value === currentId)) {
    options.push({ value: currentId, label: currentName || `Record ${currentId}` });
  }
  return uniqueOptions(options);
}

function uniqueOptions(options: SelectOption[]) {
  const seen = new Set<string>();
  return options.filter((option) => {
    if (seen.has(option.value)) {
      return false;
    }
    seen.add(option.value);
    return true;
  });
}

function siteVisitToForm(siteVisit?: ProspectSiteVisit): SiteVisitForm | null {
  if (!siteVisit) {
    return null;
  }
  return {
    id: siteVisit.id,
    propertyId: siteVisit.propertyId === undefined ? "" : String(siteVisit.propertyId),
    propertyName: siteVisit.propertyName ?? "",
    requirementLevel: siteVisit.requirementLevel === undefined ? "" : String(siteVisit.requirementLevel),
    blockId: siteVisit.blockId === undefined ? "" : String(siteVisit.blockId),
    blockName: siteVisit.blockName ?? "",
    floorId: siteVisit.floorId === undefined ? "" : String(siteVisit.floorId),
    floorName: siteVisit.floorName ?? "",
    unitId: siteVisit.unitId === undefined ? "" : String(siteVisit.unitId),
    visitAt: toDateTimeLocal(siteVisit.visitAt),
    status: siteVisit.status === undefined ? "" : String(siteVisit.status),
    notes: siteVisit.notes ?? "",
  };
}

function formToSiteVisit(form: SiteVisitForm, prospectId: number): ProspectSiteVisit {
  return {
    id: form.id,
    prospectId,
    propertyId: numberValue(form.propertyId),
    propertyName: emptyToUndefined(form.propertyName),
    requirementLevel: numberValue(form.requirementLevel),
    blockId: numberValue(form.blockId),
    blockName: emptyToUndefined(form.blockName),
    floorId: numberValue(form.floorId),
    floorName: emptyToUndefined(form.floorName),
    unitId: numberValue(form.unitId),
    visitAt: emptyToUndefined(form.visitAt),
    status: numberValue(form.status),
    notes: emptyToUndefined(form.notes),
  };
}

function offerToForm(offer?: ProspectOffer): OfferForm | null {
  if (!offer) {
    return null;
  }
  return {
    id: offer.id,
    propertyId: offer.propertyId === undefined ? "" : String(offer.propertyId),
    propertyName: offer.propertyName ?? "",
    requirementLevel: offer.requirementLevel === undefined ? "" : String(offer.requirementLevel),
    blockId: offer.blockId === undefined ? "" : String(offer.blockId),
    blockName: offer.blockName ?? "",
    floorId: offer.floorId === undefined ? "" : String(offer.floorId),
    floorName: offer.floorName ?? "",
    unitId: offer.unitId === undefined ? "" : String(offer.unitId),
    baseAmount: offer.baseAmount === undefined ? "" : String(offer.baseAmount),
    discountAmount: offer.discountAmount === undefined ? "" : String(offer.discountAmount),
    finalAmount: offer.finalAmount === undefined ? "" : String(offer.finalAmount),
    specialTerms: offer.specialTerms ?? "",
    status: offer.status === undefined ? "" : String(offer.status),
  };
}

function formToOffer(form: OfferForm, prospectId: number): ProspectOffer {
  return {
    id: form.id,
    prospectId,
    propertyId: numberValue(form.propertyId),
    propertyName: emptyToUndefined(form.propertyName),
    requirementLevel: numberValue(form.requirementLevel),
    blockId: numberValue(form.blockId),
    blockName: emptyToUndefined(form.blockName),
    floorId: numberValue(form.floorId),
    floorName: emptyToUndefined(form.floorName),
    unitId: numberValue(form.unitId),
    baseAmount: numberValue(form.baseAmount),
    discountAmount: numberValue(form.discountAmount),
    finalAmount: numberValue(form.finalAmount),
    specialTerms: emptyToUndefined(form.specialTerms),
    status: numberValue(form.status),
  };
}

function formToNegotiation(form: NegotiationForm): ProspectNegotiation {
  return {
    offerId: form.offerId,
    proposedAmount: numberValue(form.proposedAmount),
    notes: emptyToUndefined(form.notes),
  };
}

function reservationToForm(reservation: ProspectReservation): ReservationForm {
  return {
    id: reservation.id,
    prospectId: reservation.prospectId === undefined ? "" : String(reservation.prospectId),
    offerId: reservation.offerId === undefined ? "" : String(reservation.offerId),
    reservationFee: reservation.reservationFee === undefined ? "" : String(reservation.reservationFee),
    paymentWaived: Boolean(reservation.paymentWaived),
    expiresAt: toDateTimeLocal(reservation.expiresAt),
    status: reservation.status === undefined ? "" : String(reservation.status),
  };
}

function formToReservation(form: ReservationForm, prospectId: number): ProspectReservation {
  return {
    id: form.id,
    prospectId,
    offerId: numberValue(form.offerId),
    reservationFee: numberValue(form.reservationFee),
    paymentWaived: form.paymentWaived,
    expiresAt: emptyToUndefined(form.expiresAt),
    status: numberValue(form.status),
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

function codeValueLabel(options: ErpCodeValue[], value?: number) {
  if (value === undefined) {
    return undefined;
  }
  return options.find((option) => option.id === value)?.value ?? String(value);
}

function codeValueKey(options: ErpCodeValue[], value?: number) {
  return codeValueKeyFromText(codeValueLabel(options, value));
}

function codeValueIdByKey(options: ErpCodeValue[], key: string) {
  return options.find((option) => codeValueKeyFromText(option.value) === key)?.id;
}

function codeValueKeyFromText(value?: string) {
  return value?.trim().replaceAll(" ", "_").replaceAll("-", "_").toUpperCase();
}

function emptyToUndefined(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function formatRequirementSummary(requirement: ProspectRequirement, requirementLevelOptions: ErpCodeValue[], unitTypeOptions: ErpCodeValue[]) {
  const budget = requirement.budgetFrom || requirement.budgetTo ? `${requirement.budgetFrom ?? "-"} to ${requirement.budgetTo ?? "-"}` : "Budget pending";
  const area = requirement.areaFrom || requirement.areaTo ? `Area ${requirement.areaFrom ?? "-"} to ${requirement.areaTo ?? "-"}` : undefined;
  return [codeValueLabel(requirementLevelOptions, requirement.requirementLevel), codeValueLabel(unitTypeOptions, requirement.unitType), area, budget, requirement.moveInDate].filter(Boolean).join(" | ");
}

function formatSiteVisitSummary(siteVisit: ProspectSiteVisit, requirementLevelOptions: ErpCodeValue[], siteVisitStatusOptions: ErpCodeValue[]) {
  const location = [propertyDisplayName(siteVisit.propertyName), siteVisit.blockName, siteVisit.floorName, siteVisit.unitId === undefined ? undefined : `Unit ${siteVisit.unitId}`].filter(Boolean).join(" / ");
  return [codeValueLabel(requirementLevelOptions, siteVisit.requirementLevel), location || "Location pending", codeValueLabel(siteVisitStatusOptions, siteVisit.status), siteVisit.notes].filter(Boolean).join(" | ");
}

function formatOfferSummary(offer: ProspectOffer) {
  const amount = offer.finalAmount ?? offer.baseAmount;
  const location = formatOfferLocation(offer);
  return [location || "Location pending", amount === undefined ? "Amount pending" : `Final ${amount}`].filter(Boolean).join(" | ");
}

function formatOfferLookupLabel(offer: ProspectOffer) {
  const amount = offer.finalAmount ?? offer.baseAmount;
  const location = formatOfferLocation(offer);
  return [offer.offerNo || `Offer ${offer.id ?? "-"}`, location || "Location pending", amount === undefined ? undefined : `Final ${amount}`].filter(Boolean).join(" | ");
}

function formatOfferLocation(offer: ProspectOffer) {
  return [propertyDisplayName(offer.propertyName), offer.blockName, offer.floorName, offer.unitId === undefined ? undefined : `Unit ${offer.unitId}`].filter(Boolean).join(" / ");
}

function propertyDisplayName(value?: string) {
  return value?.replace(/\s+\(\d+\)$/, "");
}

function formatReservationSummary(reservation: ProspectReservation, reservationStatusOptions: ErpCodeValue[], decisionOptions: ErpCodeValue[]) {
  return [
    `Offer ${reservation.offerId ?? "-"}`,
    `Property ${reservation.propertyId ?? "-"}`,
    reservation.blockId === undefined ? undefined : `Block ${reservation.blockId}`,
    reservation.floorId === undefined ? undefined : `Floor ${reservation.floorId}`,
    reservation.unitId === undefined ? undefined : `Unit ${reservation.unitId}`,
    codeValueLabel(reservationStatusOptions, reservation.status),
    `Approval ${codeValueLabel(decisionOptions, reservation.approvalStatus) ?? "-"}`,
    `Fee ${reservation.reservationFee ?? 0}`,
    `Paid ${reservation.paidAmount ?? 0}`,
  ].filter(Boolean).join(" | ");
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

function isCurrentMonth(value?: string) {
  return isSameMonth(value, new Date());
}

function isPreviousMonth(value?: string) {
  const previousMonth = new Date();
  previousMonth.setMonth(previousMonth.getMonth() - 1);
  return isSameMonth(value, previousMonth);
}

function isSameMonth(value: string | undefined, month: Date) {
  if (!value) {
    return false;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return false;
  }
  return date.getFullYear() === month.getFullYear() && date.getMonth() === month.getMonth();
}

function formatMonthlyVariation(currentCount: number, previousCount: number): { caption: string; tone: "success" | "warning" } {
  if (previousCount === 0) {
    return {
      caption: currentCount > 0 ? "New this month" : "No change vs last month",
      tone: currentCount > 0 ? "success" : "warning",
    };
  }

  const variation = Math.round(((currentCount - previousCount) / previousCount) * 100);
  const sign = variation > 0 ? "+" : "";

  return {
    caption: `${sign}${variation}% vs last month`,
    tone: variation >= 0 ? "success" : "warning",
  };
}

function matchesStatus(status: string | undefined, expectedStatuses: string[]) {
  const normalizedStatus = normalizeStatus(status);
  return normalizedStatus ? expectedStatuses.some((expectedStatus) => normalizeStatus(expectedStatus) === normalizedStatus) : false;
}

function normalizeStatus(status?: string) {
  return status?.trim().replaceAll(" ", "_").toUpperCase();
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

function StatusPill({ status, label }: { status?: string; label?: string }) {
  const displayLabel = label ?? (status ? formatLabel(status) : "New");
  const normalizedStatus = normalizeStatus(status);
  const tone = matchesStatus(normalizedStatus, [...prospectStageStatuses, "PROSPECT", "REQUIREMENT", "SITE_VISIT", "OFFER", "NEGOTIATION", "RESERVATION", "RESERVED", "LEASE_PROCESS"])
    ? "pill-success"
    : normalizedStatus === "LOST"
      ? "pill-danger"
      : "pill-brand";

  return <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>{displayLabel}</span>;
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
