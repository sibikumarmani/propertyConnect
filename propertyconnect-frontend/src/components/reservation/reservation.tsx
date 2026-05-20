"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Edit3, Loader2, Plus, RefreshCcw, Save, Search, UserCheck } from "lucide-react";

import { WorkspaceDrawer } from "@/components/layout/workspace-drawer";
import { listCodeValues, type ErpCodeValue } from "@/lib/lead";
import {
  approveReservation,
  cancelReservation,
  confirmReservation,
  expireReservation,
  listReservationOffers,
  listReservationProspects,
  listReservations,
  moveReservationToLease,
  recordReservationPayment,
  saveReservation,
  updateReservation,
  updateReservationStatus,
  type Reservation,
  type ReservationOffer,
  type ReservationPaymentReceipt,
  type ReservationProspect,
} from "@/lib/reservation";

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

type PaymentForm = {
  reservationId?: number;
  amount: string;
  paymentMethod: string;
  paidAt: string;
};

const initialReservationForm: ReservationForm = {
  prospectId: "",
  offerId: "",
  reservationFee: "",
  paymentWaived: false,
  expiresAt: "",
  status: "",
};

const initialPaymentForm: PaymentForm = {
	amount: "",
	paymentMethod: "CARD",
	paidAt: "",
};

export function ReservationWorkspace() {
  const [prospects, setProspects] = useState<ReservationProspect[]>([]);
  const [offers, setOffers] = useState<ReservationOffer[]>([]);
  const [offerStatusOptions, setOfferStatusOptions] = useState<ErpCodeValue[]>([]);
  const [reservationStatusOptions, setReservationStatusOptions] = useState<ErpCodeValue[]>([]);
  const [decisionOptions, setDecisionOptions] = useState<ErpCodeValue[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [reservationForm, setReservationForm] = useState<ReservationForm>(initialReservationForm);
  const [reservationView, setReservationView] = useState<Reservation | null>(null);
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
      const key = reservationStatusKeyFromText(status.value);
      return status.id && key ? [key] : [];
    });
    for (const reservation of reservations) {
      const key = reservationStatusKey(reservationStatusOptions, reservation.status);
      if (key && !options.includes(key)) {
        options.push(key);
      }
    }
    return ["ALL", ...options];
  }, [reservationStatusOptions, reservations]);
  const filteredReservations = useMemo(() => {
    const query = reservationSearch.trim().toLowerCase();
    return reservations.filter((reservation) => {
      const prospect = reservation.prospectId === undefined ? undefined : prospectById.get(reservation.prospectId);
      const matchesStatus = reservationStatusFilter === "ALL" || reservationStatusKey(reservationStatusOptions, reservation.status) === reservationStatusFilter;
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
      { label: "Active Reservations", value: reservations.filter((reservation) => ["DRAFT", "PENDING_APPROVAL", "PAYMENT_PENDING", "PAID"].includes(reservationStatusKey(reservationStatusOptions, reservation.status) ?? "")).length, caption: "Need follow-up", captionTone: "warning" as const },
      { label: "Pending Approval", value: reservations.filter((reservation) => reservationStatusKey(reservationStatusOptions, reservation.status) === "PENDING_APPROVAL").length, caption: "Approval queue", captionTone: "warning" as const },
      { label: "Payment Pending", value: reservations.filter((reservation) => reservationStatusKey(reservationStatusOptions, reservation.status) === "PAYMENT_PENDING").length, caption: "Awaiting receipt", captionTone: "warning" as const },
      { label: "Confirmed", value: reservations.filter((reservation) => reservationStatusKey(reservationStatusOptions, reservation.status) === "CONFIRMED").length, caption: "Ready for lease", captionTone: "success" as const },
    ],
    [reservationStatusOptions, reservations],
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [loadedProspects, loadedOffers, loadedReservations, loadedOfferStatuses, loadedReservationStatuses, loadedDecisions] = await Promise.all([
        listReservationProspects(),
        listReservationOffers(),
        listReservations(),
        listCodeValues("pa_offer_status"),
        listCodeValues("pa_reservation_status"),
        listCodeValues("cf_decision"),
      ]);
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
      status: String(reservationStatusIdByKey(reservationStatusOptions, "DRAFT") ?? ""),
      reservationFee: "5000",
    });
    setReservationDrawerOpen(true);
  }

  function openEditReservation(reservation: Reservation) {
    if (reservationStatusKey(reservationStatusOptions, reservation.status) !== "DRAFT") {
      return;
    }
    setReservationForm(reservationToForm(reservation));
    setReservationDrawerOpen(true);
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
      const statusKey = action === "submit" ? "PENDING_APPROVAL" : "DRAFT";
      const status = reservationStatusIdByKey(reservationStatusOptions, statusKey);
      if (status === undefined) {
        throw new Error(`Reservation status code value not found for ${formatLabel(statusKey)}.`);
      }
      const payload = { ...formToReservation(reservationForm, prospectId), status };
      if (reservationForm.id) {
        await updateReservation(reservationForm.id, payload);
        setMessage(action === "submit" ? "Reservation submitted." : "Reservation draft updated.");
      } else {
        await saveReservation(payload);
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
      await recordReservationPayment(paymentForm.reservationId, formToPayment(paymentForm));
      setMessage("Reservation payment recorded.");
      await refresh();
      setPaymentDrawerOpen(false);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to record payment.");
    } finally {
      setSavingPayment(false);
    }
  }

  async function runReservationAction(reservation: Reservation, action: ReservationAction) {
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
        await updateReservationStatus(reservation.id, { status: "PENDING_APPROVAL", comments: "Reservation submitted." });
        setMessage("Reservation submitted.");
      } else if (action === "approve") {
        await approveReservation(reservation.id, { approved: true, comments: "Approved." });
        setMessage("Reservation approved.");
      } else if (action === "reject") {
        await approveReservation(reservation.id, { approved: false, comments: "Rejected." });
        setMessage("Reservation rejected.");
      } else if (action === "confirm") {
        await confirmReservation(reservation.id);
        setMessage("Reservation confirmed.");
      } else if (action === "cancel") {
        await cancelReservation(reservation.id);
        setMessage("Reservation cancelled.");
      } else if (action === "expire") {
        await expireReservation(reservation.id);
        setMessage("Reservation expired.");
      } else if (action === "move") {
        await moveReservationToLease(reservation.id);
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
            <p className="mt-3 max-w-4xl text-sm leading-7 text-[color:var(--foreground-muted)]">Manage accepted offers through submission, approval, payment, confirmation, and lease handoff.</p>
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
                    {status === "ALL" ? "All status" : reservationStatusLabelByKey(reservationStatusOptions, status) ?? formatLabel(status)}
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
            {filteredReservations.map((reservation) => (
              <ReservationCard
                key={reservation.id ?? reservation.reservationNo}
                prospect={reservation.prospectId === undefined ? undefined : prospectById.get(reservation.prospectId)}
                reservation={reservation}
                decisionOptions={decisionOptions}
                reservationStatusOptions={reservationStatusOptions}
                saving={savingReservation}
                onAction={runReservationAction}
                onEdit={openEditReservation}
                onView={setReservationView}
              />
            ))}
          </div>
        </div>
      </section>

      <WorkspaceDrawer eyebrow="Reservation" open={reservationDrawerOpen} title={reservationForm.id ? "Edit reservation" : "Request reservation"} onClose={() => setReservationDrawerOpen(false)}>
        <ReservationFormPanel approvedOffers={reservableOffers} form={reservationForm} saving={savingReservation} onCancel={() => setReservationDrawerOpen(false)} onChange={setReservationForm} onSubmit={submitReservation} />
      </WorkspaceDrawer>

      <WorkspaceDrawer eyebrow="Reservation" open={Boolean(reservationView)} title="View reservation" onClose={() => setReservationView(null)}>
        {reservationView ? <ReservationViewPanel decisionOptions={decisionOptions} reservation={reservationView} reservationStatusOptions={reservationStatusOptions} prospect={reservationView.prospectId === undefined ? undefined : prospectById.get(reservationView.prospectId)} /> : null}
      </WorkspaceDrawer>

      <WorkspaceDrawer eyebrow="Payment" open={paymentDrawerOpen} title="Record reservation payment" onClose={() => setPaymentDrawerOpen(false)}>
        <PaymentFormPanel form={paymentForm} saving={savingPayment} onCancel={() => setPaymentDrawerOpen(false)} onChange={setPaymentForm} onSubmit={submitPayment} />
      </WorkspaceDrawer>
    </section>
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
  prospect?: ReservationProspect;
  reservation: Reservation;
  decisionOptions: ErpCodeValue[];
  reservationStatusOptions: ErpCodeValue[];
  saving: boolean;
  onAction: (reservation: Reservation, action: ReservationAction) => void;
  onEdit: (reservation: Reservation) => void;
  onView: (reservation: Reservation) => void;
}) {
  const reservationStatus = reservationStatusKey(reservationStatusOptions, reservation.status);

  return (
    <div className="rounded-lg border border-[color:var(--line)] bg-[color:var(--surface-raised)] p-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-[color:var(--brand-strong)]">{reservation.reservationNo || "Reservation"}</p>
            <span className="rounded-full border border-[color:var(--line)] bg-[color:var(--surface-muted)] px-3 py-1 text-xs font-semibold text-[color:var(--brand-strong)]">
              {reservationStatusLabel(reservationStatusOptions, reservation.status) ?? "Draft"}
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

function ReservationViewPanel({ decisionOptions, prospect, reservation, reservationStatusOptions }: { decisionOptions: ErpCodeValue[]; prospect?: ReservationProspect; reservation: Reservation; reservationStatusOptions: ErpCodeValue[] }) {
  return (
    <div className="grid gap-4">
      <DetailItem label="Reservation no" value={reservation.reservationNo} />
      <DetailItem label="Status" value={reservationStatusLabel(reservationStatusOptions, reservation.status)} />
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

function ReservationFormPanel({ approvedOffers, form, saving, onCancel, onChange, onSubmit }: { approvedOffers: ReservationOffer[]; form: ReservationForm; saving: boolean; onCancel: () => void; onChange: (form: ReservationForm) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
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
      <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
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

function PaymentFormPanel({ form, saving, onCancel, onChange, onSubmit }: { form: PaymentForm; saving: boolean; onCancel: () => void; onChange: (form: PaymentForm) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
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

function reservationToForm(reservation: Reservation): ReservationForm {
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

function formToReservation(form: ReservationForm, prospectId: number): Reservation {
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

function formToPayment(form: PaymentForm): ReservationPaymentReceipt {
  return {
    amount: numberValue(form.amount),
    paymentMethod: emptyToUndefined(form.paymentMethod),
    paidAt: emptyToUndefined(form.paidAt),
  };
}

function formatOfferLookupLabel(offer: ReservationOffer) {
  const amount = offer.finalAmount ?? offer.baseAmount;
  const location = formatOfferLocation(offer);
  return [offer.offerNo || `Offer ${offer.id ?? "-"}`, location || "Location pending", amount === undefined ? undefined : `Final ${amount}`].filter(Boolean).join(" | ");
}

function formatOfferLocation(offer: ReservationOffer) {
  return [propertyDisplayName(offer.propertyName), offer.blockName, offer.floorName, offer.unitId === undefined ? undefined : `Unit ${offer.unitId}`].filter(Boolean).join(" / ");
}

function propertyDisplayName(value?: string) {
  return value?.replace(/\s+\(\d+\)$/, "");
}

function formatReservationSummary(reservation: Reservation, reservationStatusOptions: ErpCodeValue[], decisionOptions: ErpCodeValue[]) {
  return [
    `Offer ${reservation.offerId ?? "-"}`,
    `Property ${reservation.propertyId ?? "-"}`,
    reservation.blockId === undefined ? undefined : `Block ${reservation.blockId}`,
    reservation.floorId === undefined ? undefined : `Floor ${reservation.floorId}`,
    reservation.unitId === undefined ? undefined : `Unit ${reservation.unitId}`,
    reservationStatusLabel(reservationStatusOptions, reservation.status),
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

function emptyToUndefined(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
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
  if (value === undefined) {
    return undefined;
  }
  const option = options.find((item) => item.id === value);
  return codeValueKeyFromText(option?.value ?? String(value));
}

function codeValueKeyFromText(value?: string) {
  return value?.trim().replaceAll(" ", "_").replaceAll("-", "_").toUpperCase();
}

function reservationStatusKey(options: ErpCodeValue[], value?: number) {
  if (value === undefined) {
    return undefined;
  }
  const option = options.find((item) => item.id === value);
  return reservationStatusKeyFromText(option?.value ?? String(value));
}

function reservationStatusKeyFromText(value?: string) {
  return codeValueKeyFromText(value);
}

function reservationStatusIdByKey(options: ErpCodeValue[], key: string) {
  return options.find((option) => reservationStatusKeyFromText(option.value) === key)?.id;
}

function reservationStatusLabel(options: ErpCodeValue[], value?: number) {
  return codeValueLabel(options, value);
}

function reservationStatusLabelByKey(options: ErpCodeValue[], key: string) {
  const status = options.find((option) => reservationStatusKeyFromText(option.value) === key);
  return status?.value;
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

function formatLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
