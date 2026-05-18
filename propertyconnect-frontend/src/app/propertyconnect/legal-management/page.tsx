"use client";

import {
  ArrowLeft,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Edit3,
  FileText,
  Filter,
  Gavel,
  GitBranch,
  ShieldCheck,
  Paperclip,
  Plus,
  RefreshCcw,
  Save,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  applyLegalWorkflow,
  createLegalCard,
  getLegalDashboard,
  getLegalLookups,
  searchLegalCards,
  updateLegalCard,
  type LegalCard,
  type LegalCardAttachment,
  type LegalCardSearch,
  type LegalLookup,
  type LegalLookups,
} from "@/lib/legal";

type ViewMode = "dashboard" | "history" | "card";
type CardMode = "create" | "view" | "edit";
type ToastType = "success" | "error" | "warning" | "info";

type SearchCriteria = LegalCardSearch & {
  columnFilter: string;
};

type LegalManagementPageProps = {
  initialCardMode?: CardMode;
  initialView?: ViewMode;
};

const today = new Date();
const isoToday = toIsoDate(today);
const defaultFrom = toIsoDate(addMonths(today, -1));
const emptyLookups: LegalLookups = {
  legalTypes: [],
  stages: [],
  reasons: [],
  documentStatuses: [],
  approvalStatuses: [],
  documentTypes: [],
};
const emptyEntityOptions: LegalLookup[] = [];
const workflowByType: Record<number, Record<number, number[]>> = {
  1: { 1: [2], 2: [3], 3: [4], 4: [5], 5: [6], 6: [7], 7: [8] },
  2: { 1: [9], 9: [10], 10: [11, 12], 11: [13], 12: [13] },
};

export default function LegalManagementPage({ initialCardMode, initialView = "dashboard" }: LegalManagementPageProps) {
  const [view, setView] = useState<ViewMode>(initialView);
  const [cardMode, setCardMode] = useState<CardMode>(initialCardMode ?? "view");
  const [cards, setCards] = useState<LegalCard[]>([]);
  const [lookups, setLookups] = useState<LegalLookups>(emptyLookups);
  const [activeCard, setActiveCard] = useState<LegalCard | null>(null);
  const [criteria, setCriteria] = useState<SearchCriteria>(defaultCriteria());
  const [draftCriteria, setDraftCriteria] = useState<SearchCriteria>(criteria);
  const [searchOpen, setSearchOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: ToastType; text: string } | null>(null);
  const [saveComments, setSaveComments] = useState("");
  const [workflowOpen, setWorkflowOpen] = useState(false);
  const [workflowStatusId, setWorkflowStatusId] = useState<number | "">("");
  const [workflowComments, setWorkflowComments] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [dashboardCounts, setDashboardCounts] = useState({ total: 0, completed: 0, inProgress: 0, typeCounts: [] as Array<{ legalTypeId: number; legalType: string; count: number }> });
  const [historyTitle, setHistoryTitle] = useState("Legal Card History");

  useEffect(() => {
    void loadInitial();
    // loadInitial is intentionally run once when the Legal Management shell mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (initialView === "history") {
      void loadHistory(defaultCriteria(), "Legal Card History");
    }
    // This initializes the Legal Card menu route as history once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialView]);

  const filteredCards = useMemo(() => {
    const filter = criteria.columnFilter.trim().toLowerCase();
    if (!filter) {
      return cards;
    }
    return cards.filter((card) => [card.legalCardNo, card.legalType, card.tenant, card.property, card.unit, card.advocate, card.priority, card.documentStatus].join(" ").toLowerCase().includes(filter));
  }, [cards, criteria.columnFilter]);
  const groupedCards = useMemo(() => groupByLegalType(filteredCards), [filteredCards]);
  const workflowOptions = activeCard ? workflowByType[activeCard.legalTypeId]?.[activeCard.documentStatusId] ?? [] : [];
  const isEditable = cardMode === "create" || cardMode === "edit";

  async function loadInitial() {
    try {
      setLoading(true);
      const [lookupData, dashboard] = await Promise.all([getLegalLookups(), getLegalDashboard()]);
      setLookups(lookupData);
      setDashboardCounts({
        total: dashboard.totalCount,
        completed: dashboard.completedCount,
        inProgress: dashboard.inProgressCount,
        typeCounts: dashboard.legalTypeCounts,
      });
      setCards(dashboard.cards ?? []);
      if (initialView === "card") {
        createBlankCard(lookupData);
      }
    } catch (error) {
      showToast("error", errorMessage(error, "Unable to load Legal Management."));
    } finally {
      setLoading(false);
    }
  }

  async function refreshDashboard() {
    const dashboard = await getLegalDashboard();
    setDashboardCounts({
      total: dashboard.totalCount,
      completed: dashboard.completedCount,
      inProgress: dashboard.inProgressCount,
      typeCounts: dashboard.legalTypeCounts,
    });
    if (view === "dashboard") {
      setCards(dashboard.cards ?? []);
    }
  }

  async function loadHistory(nextCriteria: SearchCriteria, title: string) {
    try {
      setLoading(true);
      const { columnFilter: _ignoredColumnFilter, ...search } = nextCriteria;
      void _ignoredColumnFilter;
      const data = await searchLegalCards(search);
      setCriteria(nextCriteria);
      setDraftCriteria(nextCriteria);
      setHistoryTitle(title);
      setCards(data);
      setView("history");
    } catch (error) {
      showToast("error", errorMessage(error, "Search/load failure."));
    } finally {
      setLoading(false);
    }
  }

  function createBlankCard(sourceLookups = lookups) {
    const card: LegalCard = {
      legalTypeId: firstId(sourceLookups.legalTypes, 1),
      currentStageId: firstId(sourceLookups.stages, 1),
      reasonId: firstId(sourceLookups.reasons, 1),
      tenantId: 0,
      propertyId: 0,
      unitId: 0,
      advocateId: undefined,
      caseNumber: "",
      priority: "M",
      documentStatusId: firstId(sourceLookups.documentStatuses, 1),
      approvalStatusId: firstId(sourceLookups.approvalStatuses, 1),
      documentDate: isoToday,
      dueDate: isoToday,
      dueAmount: "0",
      attachments: [],
      timeline: [],
    };
    setActiveCard(card);
    setCardMode("create");
    setSaveComments("");
    setView("card");
  }

  function openCard(card: LegalCard) {
    setActiveCard(cloneCard(card));
    setSaveComments("");
    setCardMode("view");
    setView("card");
  }

  function updateActiveCard(patch: Partial<LegalCard>) {
    setActiveCard((card) => (card ? { ...card, ...patch } : card));
  }

  async function saveCard(event: FormEvent) {
    event.preventDefault();
    if (!activeCard) {
      return;
    }
    const payload = { ...activeCard, comments: saveComments };
    try {
      const saved = activeCard.id ? await updateLegalCard(activeCard.id, payload) : await createLegalCard(payload);
      setActiveCard(saved);
      setCardMode("view");
      setSaveComments("");
      await refreshDashboard();
      showToast("success", activeCard.id ? "Legal Card updated." : `Legal Card ${saved.legalCardNo} created.`);
    } catch (error) {
      showToast("error", errorMessage(error, "Validation error."));
    }
  }

  function addAttachments(event: ChangeEvent<HTMLInputElement>) {
    if (!activeCard || !event.target.files) {
      return;
    }
    const existingNames = new Set((activeCard.attachments ?? []).map((attachment) => attachment.fileName.toLowerCase()));
    const documentTypeId = firstId(lookups.documentTypes, 1);
    const nextAttachments = Array.from(event.target.files).reduce<LegalCardAttachment[]>((items, file) => {
      if (existingNames.has(file.name.toLowerCase()) || items.some((item) => item.fileName.toLowerCase() === file.name.toLowerCase())) {
        showToast("warning", `Duplicate attachment skipped: ${file.name}`);
        return items;
      }
      items.push({
        documentTypeId,
        documentType: labelFor(lookups.documentTypes, documentTypeId),
        fileName: file.name,
      });
      return items;
    }, []);
    updateActiveCard({ attachments: [...(activeCard.attachments ?? []), ...nextAttachments] });
    event.target.value = "";
  }

  function updateAttachment(index: number, patch: Partial<LegalCardAttachment>) {
    if (!activeCard) {
      return;
    }
    const attachments = [...(activeCard.attachments ?? [])];
    attachments[index] = { ...attachments[index], ...patch };
    updateActiveCard({ attachments });
  }

  function deleteAttachment(index: number) {
    if (!activeCard) {
      return;
    }
    updateActiveCard({ attachments: (activeCard.attachments ?? []).filter((_, itemIndex) => itemIndex !== index) });
  }

  async function applyWorkflowAction() {
    if (!activeCard?.id || !workflowStatusId) {
      showToast("error", "Workflow action is required.");
      return;
    }
    try {
      const saved = await applyLegalWorkflow(activeCard.id, { statusId: Number(workflowStatusId), comments: workflowComments });
      setActiveCard(saved);
      setWorkflowOpen(false);
      setWorkflowComments("");
      setWorkflowStatusId("");
      await refreshDashboard();
      showToast("success", "Workflow action completed.");
    } catch (error) {
      showToast("error", errorMessage(error, "Workflow not allowed."));
    }
  }

  function showToast(type: ToastType, text: string) {
    setToast({ type, text });
    window.setTimeout(() => setToast(null), 3600);
  }

  return (
    <section className="page-surface min-h-[calc(100vh-6rem)] overflow-hidden rounded-none border border-[color:var(--line-strong)] shadow-[var(--shadow-panel)]">
      {toast ? <Toast message={toast.text} type={toast.type} onClose={() => setToast(null)} /> : null}
      {view === "dashboard" ? (
        <DashboardView
          cards={cards}
          completedCount={dashboardCounts.completed}
          inProgressCount={dashboardCounts.inProgress}
          loading={loading}
          totalCount={dashboardCounts.total}
          typeCounts={dashboardCounts.typeCounts}
          onDrillCompleted={() => loadHistory({ ...defaultCriteria(), documentStatusIds: [14], documentDateFrom: "", documentDateTo: "" }, "Completed Legal Cards")}
          onDrillInProgress={() => loadHistory({ ...defaultCriteria(), documentStatusIds: lookups.documentStatuses.filter((status) => status.id !== 14).map((status) => status.id), documentDateFrom: "", documentDateTo: "" }, "In Progress Legal Cards")}
          onDrillTotal={() => loadHistory({ ...defaultCriteria(), documentDateFrom: "", documentDateTo: "" }, "All Legal Cards")}
          onDrillType={(legalTypeId) => loadHistory({ ...defaultCriteria(), legalTypeId, documentDateFrom: "", documentDateTo: "" }, `${labelFor(lookups.legalTypes, legalTypeId)} Legal Cards`)}
          onOpenCard={openCard}
        />
      ) : null}
      {view === "history" ? (
        <HistoryView
          criteria={criteria}
          draftCriteria={draftCriteria}
          expandedGroups={expandedGroups}
          groupedCards={groupedCards}
          loading={loading}
          lookups={lookups}
          searchOpen={searchOpen}
          title={historyTitle}
          totalCount={filteredCards.length}
          onColumnFilter={(value) => setCriteria((current) => ({ ...current, columnFilter: value }))}
          onCreate={() => createBlankCard()}
          onOpenCard={openCard}
          onResetSearch={() => setDraftCriteria(defaultCriteria())}
          onSearchClose={() => setSearchOpen(false)}
          onSearchOpen={() => {
            setDraftCriteria(criteria);
            setSearchOpen(true);
          }}
          onSearchSubmit={() => {
            void loadHistory(draftCriteria, "Legal Card History");
            setSearchOpen(false);
          }}
          onToggleGroup={(legalType) => setExpandedGroups((current) => ({ ...current, [legalType]: !current[legalType] }))}
          setDraftCriteria={setDraftCriteria}
        />
      ) : null}
      {view === "card" && activeCard ? (
        <CardView
          activeCard={activeCard}
          cardMode={cardMode}
          isEditable={isEditable}
          lookups={lookups}
          saveComments={saveComments}
          workflowComments={workflowComments}
          workflowOpen={workflowOpen}
          workflowOptions={workflowOptions}
          workflowStatusId={workflowStatusId}
          onAddAttachments={addAttachments}
          onBack={() => setView("history")}
          onCreate={() => createBlankCard()}
          onDeleteAttachment={deleteAttachment}
          onEdit={() => {
            if (activeCard.documentStatusId !== 1) {
              showToast("warning", "Edit is available only when Document Status is Initiated.");
              return;
            }
            setCardMode("edit");
          }}
          onSave={saveCard}
          onSetSaveComments={setSaveComments}
          onSetWorkflowComments={setWorkflowComments}
          onSetWorkflowStatusId={setWorkflowStatusId}
          onShowWorkflow={() => {
            if (activeCard.approvalStatusId !== 1) {
              showToast("warning", "Approval status is not approved.");
              return;
            }
            if (!workflowOptions.length) {
              showToast("warning", "Workflow is not allowed for this status.");
              return;
            }
            setWorkflowStatusId(workflowOptions[0]);
            setWorkflowOpen(true);
          }}
          onUpdateAttachment={updateAttachment}
          onUpdateCard={updateActiveCard}
          onWorkflowClose={() => setWorkflowOpen(false)}
          onWorkflowSubmit={applyWorkflowAction}
        />
      ) : null}
    </section>
  );
}

function DashboardView(props: {
  cards: LegalCard[];
  completedCount: number;
  inProgressCount: number;
  loading: boolean;
  totalCount: number;
  typeCounts: Array<{ legalTypeId: number; legalType: string; count: number }>;
  onDrillCompleted: () => void;
  onDrillInProgress: () => void;
  onDrillTotal: () => void;
  onDrillType: (legalTypeId: number) => void;
  onOpenCard: (card: LegalCard) => void;
}) {
  return (
    <>
      <PageHeader eyebrow="Legal management" title="Legal Dashboard" description="Summary and drill-down data for Legal Cards from the PropertyConnect database." />
      <div className="grid gap-4 p-4 md:grid-cols-3 md:p-6">
        <Metric label="Legal Card Total Count" value={props.totalCount} icon={FileText} onClick={props.onDrillTotal} />
        <Metric label="Completed Count" value={props.completedCount} icon={Gavel} onClick={props.onDrillCompleted} tone="success" />
        <Metric label="In Progress Count" value={props.inProgressCount} icon={RefreshCcw} onClick={props.onDrillInProgress} tone="warning" />
      </div>
      <div className="grid gap-4 px-4 pb-6 lg:grid-cols-[0.9fr_1.1fr] md:px-6">
        <section className="panel rounded-lg p-5">
          <div className="mb-5 flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-[color:var(--brand)]" />
            <h2 className="text-lg font-semibold text-[color:var(--brand-strong)]">Legal Type-wise Counts</h2>
          </div>
          <div className="space-y-4">
            {props.typeCounts.length ? props.typeCounts.map((item) => (
              <button className="w-full text-left" key={item.legalTypeId} onClick={() => props.onDrillType(item.legalTypeId)} type="button">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-semibold text-[color:var(--brand-strong)]">{item.legalType}</span>
                  <span className="text-[color:var(--foreground-muted)]">{item.count}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-[color:var(--surface-muted)]">
                  <div className="h-full rounded-full bg-[color:var(--brand)]" style={{ width: `${props.totalCount ? (item.count / props.totalCount) * 100 : 0}%` }} />
                </div>
              </button>
            )) : <EmptyText text={props.loading ? "Loading legal type counts..." : "No Legal Cards available."} />}
          </div>
        </section>
        <DashboardList cards={props.cards} loading={props.loading} onOpenCard={props.onOpenCard} />
      </div>
    </>
  );
}

function DashboardList({ cards, loading, onOpenCard }: { cards: LegalCard[]; loading: boolean; onOpenCard: (card: LegalCard) => void }) {
  return (
    <section className="panel overflow-hidden rounded-lg">
      <div className="border-b border-[color:var(--line)] p-5">
        <h2 className="text-lg font-semibold text-[color:var(--brand-strong)]">Dashboard Drill Down</h2>
      </div>
      <TableShell>
        <thead className="bg-[color:var(--surface-muted)] text-xs text-[color:var(--foreground-muted)]">
          <tr>{["Legal Card No.", "Legal Type", "Tenant", "Property", "Unit", "Advocate", "Priority", "Status"].map((header) => <th className="px-4 py-3 font-semibold" key={header}>{header}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-[color:var(--line)]">
          {cards.map((card) => <CardRow card={card} includeLegalType key={card.id ?? card.legalCardNo} onOpenCard={onOpenCard} />)}
          {!cards.length ? <EmptyRow colSpan={8} text={loading ? "Loading Legal Cards..." : "No Legal Cards found in database."} /> : null}
        </tbody>
      </TableShell>
    </section>
  );
}

function HistoryView(props: {
  criteria: SearchCriteria;
  draftCriteria: SearchCriteria;
  expandedGroups: Record<string, boolean>;
  groupedCards: Record<string, LegalCard[]>;
  loading: boolean;
  lookups: LegalLookups;
  searchOpen: boolean;
  title: string;
  totalCount: number;
  onColumnFilter: (value: string) => void;
  onCreate: () => void;
  onOpenCard: (card: LegalCard) => void;
  onResetSearch: () => void;
  onSearchClose: () => void;
  onSearchOpen: () => void;
  onSearchSubmit: () => void;
  onToggleGroup: (legalType: string) => void;
  setDraftCriteria: (criteria: SearchCriteria) => void;
}) {
  return (
    <>
      <PageHeader eyebrow="Legal card history" title={props.title} description="Searchable Legal Card list grouped by Legal Type with live table counts.">
        <button className="btn-secondary flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold" onClick={props.onSearchOpen} type="button">
          <Filter size={17} /> Search
        </button>
        <button className="btn-primary flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold" onClick={props.onCreate} type="button">
          <Plus size={17} /> New
        </button>
      </PageHeader>
      <div className="p-4 md:p-6">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-[color:var(--foreground-muted)]">
            Document Date: <span className="font-semibold text-[color:var(--brand-strong)]">{props.criteria.documentDateFrom || "Any"} to {props.criteria.documentDateTo || "Any"}</span>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--foreground-subtle)]" />
            <input className="field h-10 w-full rounded-lg pl-10 pr-3 text-sm" onChange={(event) => props.onColumnFilter(event.target.value)} placeholder="Filter table columns" value={props.criteria.columnFilter} />
          </div>
        </div>
        <section className="panel overflow-hidden rounded-lg">
          <TableShell>
            <thead className="bg-[color:var(--surface-muted)] text-xs text-[color:var(--foreground-muted)]">
              <tr>{["Legal Card No.", "Tenant", "Property", "Unit", "Advocate", "Priority", "Status"].map((header) => <th className="px-4 py-3 font-semibold" key={header}>{header}</th>)}</tr>
            </thead>
            {Object.entries(props.groupedCards).map(([legalType, cards]) => (
              <tbody className="divide-y divide-[color:var(--line)]" key={legalType}>
                <tr className="bg-[color:var(--brand-tint)]">
                  <td className="px-4 py-3 font-semibold text-[color:var(--brand-strong)]" colSpan={7}>
                    <button className="flex items-center gap-2" onClick={() => props.onToggleGroup(legalType)} type="button">
                      {props.expandedGroups[legalType] ?? true ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      {legalType}
                    </button>
                  </td>
                </tr>
                {props.expandedGroups[legalType] ?? true ? cards.map((card) => <CardRow card={card} key={card.id ?? card.legalCardNo} onOpenCard={props.onOpenCard} />) : null}
                <tr className="bg-[color:var(--brand-tint)] text-sm font-semibold text-[color:var(--brand-strong)]">
                  <td className="px-4 py-3">Total Count : {cards.length}</td>
                  <td colSpan={6} />
                </tr>
              </tbody>
            ))}
            {!Object.keys(props.groupedCards).length ? (
              <tbody><EmptyRow colSpan={7} text={props.loading ? "Loading Legal Cards..." : "No Legal Cards found in database."} /></tbody>
            ) : null}
            <tfoot className="bg-[color:var(--surface-muted)] text-sm font-semibold text-[color:var(--brand-strong)]">
              <tr><td className="px-4 py-4">Total Count : {props.totalCount}</td><td colSpan={6} /></tr>
            </tfoot>
          </TableShell>
        </section>
      </div>
      {props.searchOpen ? (
        <SearchDialog
          criteria={props.draftCriteria}
          lookups={props.lookups}
          onClose={props.onSearchClose}
          onReset={props.onResetSearch}
          onSubmit={props.onSearchSubmit}
          setCriteria={props.setDraftCriteria}
        />
      ) : null}
    </>
  );
}

function CardRow({ card, includeLegalType = false, onOpenCard }: { card: LegalCard; includeLegalType?: boolean; onOpenCard: (card: LegalCard) => void }) {
  return (
    <tr>
      <td className="px-4 py-3"><button className="font-semibold text-[color:var(--brand)]" onClick={() => onOpenCard(card)} type="button">{card.legalCardNo}</button></td>
      {includeLegalType ? <td className="px-4 py-3">{card.legalType}</td> : null}
      <td className="px-4 py-3">{card.tenant}</td>
      <td className="px-4 py-3">{card.property}</td>
      <td className="px-4 py-3">{card.unit}</td>
      <td className="px-4 py-3">{card.advocate}</td>
      <td className="px-4 py-3"><Badge value={card.priorityLabel ?? priorityLabel(card.priority)} /></td>
      <td className="px-4 py-3"><Badge value={card.documentStatus ?? ""} /></td>
    </tr>
  );
}

function CardView(props: {
  activeCard: LegalCard;
  cardMode: CardMode;
  isEditable: boolean;
  lookups: LegalLookups;
  saveComments: string;
  workflowComments: string;
  workflowOpen: boolean;
  workflowOptions: number[];
  workflowStatusId: number | "";
  onAddAttachments: (event: ChangeEvent<HTMLInputElement>) => void;
  onBack: () => void;
  onCreate: () => void;
  onDeleteAttachment: (index: number) => void;
  onEdit: () => void;
  onSave: (event: FormEvent) => void;
  onSetSaveComments: (value: string) => void;
  onSetWorkflowComments: (value: string) => void;
  onSetWorkflowStatusId: (value: number | "") => void;
  onShowWorkflow: () => void;
  onUpdateAttachment: (index: number, patch: Partial<LegalCardAttachment>) => void;
  onUpdateCard: (patch: Partial<LegalCard>) => void;
  onWorkflowClose: () => void;
  onWorkflowSubmit: () => void;
}) {
  const card = props.activeCard;
  const [activeTab, setActiveTab] = useState<"details" | "attachments" | "timeline">("details");
  const title = `Legal Card (#: ${card.legalCardNo ?? "New"})`;
  return (
    <>
      <div className="flex flex-col gap-4 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="display-font text-4xl font-semibold text-[color:var(--brand-strong)]">{title}</h1>
        <div className="flex flex-wrap gap-3">
          <button className="btn-secondary flex h-12 items-center gap-2 rounded-lg px-5 text-lg font-semibold" onClick={props.onBack} type="button">
            <ArrowLeft size={22} /> Back
          </button>
          {props.cardMode === "view" ? <button className="btn-secondary flex h-12 items-center gap-2 rounded-lg px-5 text-lg font-semibold" onClick={props.onCreate} type="button"><Plus size={20} /> New</button> : null}
          {props.cardMode === "view" && card.documentStatusId === 1 ? <button className="btn-secondary flex h-12 items-center gap-2 rounded-lg px-5 text-lg font-semibold" onClick={props.onEdit} type="button"><Edit3 size={20} /> Edit</button> : null}
          {props.cardMode === "view" && card.approvalStatusId === 1 && props.workflowOptions.length ? <button className="btn-primary flex h-12 items-center gap-2 rounded-lg px-5 text-lg font-semibold" onClick={props.onShowWorkflow} type="button"><Gavel size={20} /> Action</button> : null}
          {props.isEditable ? <button className="btn-primary flex h-12 items-center gap-2 rounded-lg px-5 text-lg font-semibold" form="legal-card-form" type="submit"><Save size={20} /> Save</button> : null}
        </div>
      </div>

      <div className="px-4 pb-6 sm:px-6">
        <section className="panel rounded-lg bg-[color:var(--surface-strong)] p-5">
          <div className="flex flex-col gap-4 border-b border-[color:var(--line-strong)] lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-4">
              <LegalCardTab active={activeTab === "details"} icon={FileText} label="Details" onClick={() => setActiveTab("details")} tone="blue" />
              <LegalCardTab active={activeTab === "attachments"} icon={Paperclip} label="Attachments" onClick={() => setActiveTab("attachments")} tone="brown" />
              <LegalCardTab active={activeTab === "timeline"} icon={GitBranch} label="Timeline" onClick={() => setActiveTab("timeline")} tone="green" />
            </div>
            <div className="mb-3 flex flex-wrap gap-3 lg:mb-0">
              <LegalStatusPill label="Document" value={card.documentStatus ?? labelFor(props.lookups.documentStatuses, card.documentStatusId)} variant="document" />
              <LegalStatusPill label="Approval" value={card.approvalStatus ?? labelFor(props.lookups.approvalStatuses, card.approvalStatusId)} variant="approval" />
            </div>
          </div>

          {activeTab === "details" ? (
            <form className="grid gap-6 pt-4 xl:grid-cols-[1fr_340px]" id="legal-card-form" onSubmit={props.onSave}>
              <div>
                <div className="grid gap-x-5 md:grid-cols-2">
                  <LookupSelect disabled={!props.isEditable} label="Legal Type *" lookups={props.lookups.legalTypes} value={card.legalTypeId} onChange={(value) => props.onUpdateCard({ legalTypeId: value })} />
                  <LookupSelect disabled={!props.isEditable} label="Current Stage *" lookups={props.lookups.stages} value={card.currentStageId} onChange={(value) => props.onUpdateCard({ currentStageId: value, documentStatusId: value })} />
                  <LookupSelect disabled={!props.isEditable} label="Reason *" lookups={props.lookups.reasons} value={card.reasonId} onChange={(value) => props.onUpdateCard({ reasonId: value })} />
                  <LookupSelect allowAny disabled={!props.isEditable} label="Tenant *" lookups={emptyEntityOptions} value={card.tenantId || 0} onChange={(value) => props.onUpdateCard({ tenantId: value })} />
                  <LookupSelect allowAny disabled={!props.isEditable} label="Property *" lookups={emptyEntityOptions} value={card.propertyId || 0} onChange={(value) => props.onUpdateCard({ propertyId: value })} />
                  <LookupSelect allowAny disabled={!props.isEditable} label="Unit *" lookups={emptyEntityOptions} value={card.unitId || 0} onChange={(value) => props.onUpdateCard({ unitId: value })} />
                  <InputField disabled={!props.isEditable} label="Case Number" value={card.caseNumber ?? ""} onChange={(value) => props.onUpdateCard({ caseNumber: value })} />
                  <LookupSelect allowAny disabled={!props.isEditable} label="Advocate" lookups={emptyEntityOptions} value={card.advocateId ?? 0} onChange={(value) => props.onUpdateCard({ advocateId: value || undefined })} />
                </div>
                {props.isEditable ? (
                  <Field label="Save Comments *">
                    <textarea className="field min-h-24 w-full rounded-lg px-3 py-2 text-sm" onChange={(event) => props.onSetSaveComments(event.target.value)} value={props.saveComments} />
                  </Field>
                ) : null}
              </div>
              <aside className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-4">
                <InputField disabled={!props.isEditable} label="Document Date *" type="date" value={card.documentDate} onChange={(value) => props.onUpdateCard({ documentDate: value })} />
                <InputField disabled={!props.isEditable} label="Due Date *" type="date" value={card.dueDate} onChange={(value) => props.onUpdateCard({ dueDate: value })} />
                <InputField disabled={!props.isEditable} label="Due Amount *" type="number" value={String(card.dueAmount ?? "")} onChange={(value) => props.onUpdateCard({ dueAmount: value })} />
                <SelectField disabled={!props.isEditable} label="Priority *" value={card.priority} values={[["H", "High"], ["M", "Medium"], ["L", "Low"]]} onChange={(value) => props.onUpdateCard({ priority: value as "H" | "M" | "L" })} />
              </aside>
            </form>
          ) : null}

          {activeTab === "attachments" ? (
            <div className="pt-5">
              <AttachmentsPanel activeCard={card} isEditable={props.isEditable} lookups={props.lookups} onAddAttachments={props.onAddAttachments} onDeleteAttachment={props.onDeleteAttachment} onUpdateAttachment={props.onUpdateAttachment} />
            </div>
          ) : null}

          {activeTab === "timeline" ? (
            <div className="pt-5">
              <TimelinePanel entries={card.timeline ?? []} />
            </div>
          ) : null}
        </section>
      </div>

      {props.workflowOpen ? (
        <Dialog title="Workflow Action" onClose={props.onWorkflowClose}>
          <div className="space-y-4">
            <SelectField label="Action" value={String(props.workflowStatusId)} values={props.workflowOptions.map((id) => [String(id), labelFor(props.lookups.documentStatuses, id)])} onChange={(value) => props.onSetWorkflowStatusId(value ? Number(value) : "")} />
            <Field label="Comments">
              <textarea className="field min-h-28 w-full rounded-lg px-3 py-2 text-sm" onChange={(event) => props.onSetWorkflowComments(event.target.value)} value={props.workflowComments} />
            </Field>
            <div className="flex justify-end gap-3">
              <button className="btn-secondary h-10 rounded-lg px-4 text-sm font-semibold" onClick={props.onWorkflowClose} type="button">Cancel</button>
              <button className="btn-primary h-10 rounded-lg px-4 text-sm font-semibold" onClick={props.onWorkflowSubmit} type="button">Confirm</button>
            </div>
          </div>
        </Dialog>
      ) : null}
    </>
  );
}

function LegalCardTab({ active, icon: Icon, label, onClick, tone }: { active: boolean; icon: LucideIcon; label: string; onClick: () => void; tone: "blue" | "brown" | "green" }) {
  const colorClass = tone === "blue" ? "text-blue-700" : tone === "brown" ? "text-amber-900" : "text-teal-800";
  return (
    <button
      className={`flex h-16 items-center gap-3 border-b-4 px-5 text-lg font-bold transition ${colorClass} ${active ? "border-blue-700 bg-[color:var(--surface-muted)]" : "border-transparent hover:bg-[color:var(--surface-muted)]"}`}
      onClick={onClick}
      type="button"
    >
      <Icon size={22} />
      {label}
    </button>
  );
}

function LegalStatusPill({ label, value, variant }: { label: string; value: string; variant: "document" | "approval" }) {
  const styles = variant === "document"
    ? "border-amber-200 bg-amber-50 text-amber-800"
    : "border-emerald-200 bg-emerald-50 text-emerald-800";
  const Icon = variant === "document" ? GitBranch : ShieldCheck;
  return (
    <div className={`flex min-h-12 items-center gap-3 rounded-full border px-5 text-lg font-bold ${styles}`}>
      <span className="text-xs font-extrabold opacity-80">{label}</span>
      <Icon size={22} />
      <span>{value}</span>
    </div>
  );
}

function AttachmentsPanel(props: {
  activeCard: LegalCard;
  isEditable: boolean;
  lookups: LegalLookups;
  onAddAttachments: (event: ChangeEvent<HTMLInputElement>) => void;
  onDeleteAttachment: (index: number) => void;
  onUpdateAttachment: (index: number, patch: Partial<LegalCardAttachment>) => void;
}) {
  const attachments = props.activeCard.attachments ?? [];
  return (
    <section className="rounded-lg">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[color:var(--brand-strong)]">Attachments</h2>
        </div>
        {props.isEditable ? (
          <label className="btn-primary flex h-10 cursor-pointer items-center gap-2 rounded-lg px-4 text-sm font-semibold">
            <Upload size={16} /> Add
            <input className="hidden" multiple onChange={props.onAddAttachments} type="file" />
          </label>
        ) : null}
      </div>
      <div className="overflow-x-auto rounded-lg border border-[color:var(--line)]">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-[color:var(--surface-muted)] text-xs text-[color:var(--foreground-muted)]">
            <tr>
              <th className="px-4 py-3 font-semibold">Document Type</th>
              <th className="px-4 py-3 font-semibold">File Name</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--line)]">
            {attachments.length ? attachments.map((attachment, index) => (
              <tr key={`${attachment.id ?? index}-${attachment.fileName}`}>
                <td className="px-4 py-3 align-top">
                  <select
                    className="field h-10 w-full min-w-48 rounded-lg px-3 text-sm disabled:opacity-70"
                    disabled={!props.isEditable}
                    onChange={(event) => props.onUpdateAttachment(index, { documentTypeId: Number(event.target.value) })}
                    value={attachment.documentTypeId}
                  >
                    {props.lookups.documentTypes.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 align-top">
                  <div className="flex items-center gap-2 font-semibold text-[color:var(--brand-strong)]">
                    <Paperclip size={15} />
                    <span className="max-w-64 truncate" title={attachment.fileName}>{attachment.fileName}</span>
                  </div>
                </td>
                <td className="px-4 py-3 align-top">
                  <div className="flex justify-end gap-2">
                    {props.isEditable ? (
                      <button aria-label={`Delete ${attachment.fileName}`} className="btn-secondary flex h-9 w-9 items-center justify-center rounded-lg text-[color:var(--danger)]" onClick={() => props.onDeleteAttachment(index)} title="Delete" type="button">
                        <Trash2 size={16} />
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            )) : <EmptyRow colSpan={3} text="No attachments added." />}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function TimelinePanel({ entries }: { entries: NonNullable<LegalCard["timeline"]> }) {
  return (
    <section className="rounded-lg">
      <h2 className="mb-4 text-lg font-semibold text-[color:var(--brand-strong)]">Timeline</h2>
      <div className="space-y-3">
        {entries.length ? entries.map((entry) => (
          <div className="border-l-2 border-[color:var(--brand-border)] pl-3" key={entry.id}>
            <p className="text-sm font-semibold text-[color:var(--brand-strong)]">{entry.action} · {entry.status}</p>
            <p className="text-xs text-[color:var(--foreground-muted)]">{entry.actor} · {entry.timestamp}</p>
            <p className="mt-1 text-sm text-[color:var(--foreground)]">{entry.remarks}</p>
          </div>
        )) : <EmptyText text="Timeline entries appear after save or workflow action." />}
      </div>
    </section>
  );
}

function SearchDialog({ criteria, lookups, onClose, onReset, onSubmit, setCriteria }: { criteria: SearchCriteria; lookups: LegalLookups; onClose: () => void; onReset: () => void; onSubmit: () => void; setCriteria: (criteria: SearchCriteria) => void }) {
  return (
    <Dialog title="Search" onClose={onClose} size="wide">
      <div className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2 xl:grid-cols-3">
        <SearchControl><InputField label="Legal Card No." value={criteria.legalCardNo ?? ""} onChange={(value) => setCriteria({ ...criteria, legalCardNo: value })} /></SearchControl>
        <SearchControl><LookupSelect allowAny label="Legal Type" lookups={lookups.legalTypes} value={criteria.legalTypeId ?? 0} onChange={(value) => setCriteria({ ...criteria, legalTypeId: value || undefined })} /></SearchControl>
        <SearchControl><LookupSelect allowAny label="Tenant" lookups={emptyEntityOptions} value={criteria.tenantId ?? 0} onChange={(value) => setCriteria({ ...criteria, tenantId: value || undefined })} /></SearchControl>
        <SearchControl><LookupSelect allowAny label="Property" lookups={emptyEntityOptions} value={criteria.propertyId ?? 0} onChange={(value) => setCriteria({ ...criteria, propertyId: value || undefined })} /></SearchControl>
        <SearchControl><LookupSelect allowAny label="Unit" lookups={emptyEntityOptions} value={criteria.unitId ?? 0} onChange={(value) => setCriteria({ ...criteria, unitId: value || undefined })} /></SearchControl>
        <SearchControl><LookupSelect allowAny label="Advocate" lookups={emptyEntityOptions} value={criteria.advocateId ?? 0} onChange={(value) => setCriteria({ ...criteria, advocateId: value || undefined })} /></SearchControl>
        <SearchControl><InputField label="Document Date From" type="date" value={criteria.documentDateFrom ?? ""} onChange={(value) => setCriteria({ ...criteria, documentDateFrom: value })} /></SearchControl>
        <SearchControl><InputField label="Document Date To" type="date" value={criteria.documentDateTo ?? ""} onChange={(value) => setCriteria({ ...criteria, documentDateTo: value })} /></SearchControl>
        <SearchControl><InputField label="Due Date" type="date" value={criteria.dueDate ?? ""} onChange={(value) => setCriteria({ ...criteria, dueDate: value })} /></SearchControl>
        <SearchControl><MultiSelect label="Document Status" options={lookups.documentStatuses} selected={criteria.documentStatusIds ?? []} onChange={(values) => setCriteria({ ...criteria, documentStatusIds: values })} /></SearchControl>
        <SearchControl><MultiSelect label="Approval Status" options={lookups.approvalStatuses} selected={criteria.approvalStatusIds ?? []} onChange={(values) => setCriteria({ ...criteria, approvalStatusIds: values })} /></SearchControl>
      </div>
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button className="btn-secondary h-10 rounded-lg px-4 text-sm font-semibold" onClick={onReset} type="button">Reset</button>
        <button className="btn-primary h-10 rounded-lg px-4 text-sm font-semibold" onClick={onSubmit} type="button">Search</button>
      </div>
    </Dialog>
  );
}

function SearchControl({ children }: { children: ReactNode }) {
  return <div className="min-w-0">{children}</div>;
}

function MultiSelect({ label, onChange, options, selected }: { label: string; onChange: (values: number[]) => void; options: LegalLookup[]; selected: number[] }) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const visible = options.filter((option) => option.label.toLowerCase().includes(filter.toLowerCase()));
  const visibleIds = visible.map((option) => option.id);
  const visibleSelected = visible.length > 0 && visibleIds.every((id) => selected.includes(id));

  useEffect(() => {
    if (!open) {
      return;
    }
    function closeOnOutsideClick(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [open]);

  return (
    <Field label={label}>
      <div className="relative" ref={dropdownRef}>
        <button className="field flex h-10 w-full items-center justify-between rounded-lg px-3 text-left text-sm" onClick={() => setOpen((value) => !value)} type="button">
          <span>{selected.length ? `${selected.length} selected` : "Any"}</span>
          <ChevronDown size={16} />
        </button>
        {open ? (
          <div className="absolute z-20 mt-2 w-full rounded-lg border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-3 shadow-[var(--shadow-panel)]">
            <input className="field mb-2 h-9 w-full rounded-lg px-3 text-sm" onChange={(event) => setFilter(event.target.value)} placeholder="Filter options" value={filter} />
            <label className="flex items-center gap-2 border-b border-[color:var(--line)] py-2 text-sm font-semibold">
              <input checked={visibleSelected} onChange={(event) => onChange(event.target.checked ? unique([...selected, ...visibleIds]) : selected.filter((value) => !visibleIds.includes(value)))} type="checkbox" />
              Select All
            </label>
            <div className="max-h-44 overflow-y-auto py-1">
              {visible.map((option) => (
                <label className="flex items-center gap-2 py-2 text-sm" key={option.id}>
                  <input checked={selected.includes(option.id)} onChange={(event) => onChange(event.target.checked ? [...selected, option.id] : selected.filter((value) => value !== option.id))} type="checkbox" />
                  {option.label}
                </label>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </Field>
  );
}

function PageHeader({ children, description, eyebrow, title }: { children?: ReactNode; description: string; eyebrow: string; title: string }) {
  return (
    <div className="border-b border-[color:var(--line)] px-5 py-5 sm:px-6 sm:py-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold text-[color:var(--brand)]">{eyebrow}</p>
          <h1 className="display-font mt-2 text-3xl font-semibold text-[color:var(--brand-strong)]">{title}</h1>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-[color:var(--foreground-muted)]">{description}</p>
        </div>
        {children ? <div className="flex flex-wrap gap-2">{children}</div> : null}
      </div>
    </div>
  );
}

function Dialog({ children, onClose, size = "default", title }: { children: ReactNode; onClose: () => void; size?: "default" | "wide"; title: string }) {
  const maxWidth = size === "wide" ? "max-w-5xl" : "max-w-3xl";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[color:var(--overlay)] p-4" onMouseDown={onClose}>
      <section className={`page-surface max-h-[88vh] w-full ${maxWidth} overflow-y-auto overflow-x-hidden rounded-lg border border-[color:var(--line-strong)] p-5 shadow-[var(--shadow-panel)]`} onMouseDown={(event) => event.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-[color:var(--brand-strong)]">{title}</h2>
          <button aria-label="Close" className="btn-secondary flex h-9 w-9 items-center justify-center rounded-lg" onClick={onClose} type="button"><X size={17} /></button>
        </div>
        {children}
      </section>
    </div>
  );
}

function Metric({ icon: Icon, label, onClick, tone, value }: { icon: LucideIcon; label: string; onClick: () => void; tone?: "success" | "warning"; value: number }) {
  const toneClass = tone === "success" ? "text-[color:var(--success)] bg-[color:var(--success-soft)]" : tone === "warning" ? "text-[color:var(--warning)] bg-[color:var(--warning-soft)]" : "text-[color:var(--brand)] bg-[color:var(--brand-tint)]";
  return (
    <button className="panel rounded-lg p-5 text-left transition hover:-translate-y-0.5" onClick={onClick} type="button">
      <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-lg ${toneClass}`}><Icon size={20} /></div>
      <p className="text-sm font-medium text-[color:var(--foreground-muted)]">{label}</p>
      <p className="display-font mt-2 text-3xl font-semibold text-[color:var(--brand-strong)]">{value}</p>
    </button>
  );
}

function TableShell({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm">{children}</table></div>;
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return <label className="mt-4 block text-sm font-semibold text-[color:var(--brand-strong)]"><span className="mb-2 block">{label}</span>{children}</label>;
}

function InputField({ disabled, label, onChange, type = "text", value }: { disabled?: boolean; label: string; onChange: (value: string) => void; type?: string; value: string }) {
  return <Field label={label}><input className="field h-10 w-full rounded-lg px-3 text-sm disabled:opacity-70" disabled={disabled} onChange={(event) => onChange(event.target.value)} type={type} value={value} /></Field>;
}

function SelectField({ disabled, label, onChange, value, values }: { disabled?: boolean; label: string; onChange: (value: string) => void; value: string; values: string[][] }) {
  return (
    <Field label={label}>
      <select className="field h-10 w-full rounded-lg px-3 text-sm disabled:opacity-70" disabled={disabled} onChange={(event) => onChange(event.target.value)} value={value}>
        {values.map(([id, labelText]) => <option key={id} value={id}>{labelText}</option>)}
      </select>
    </Field>
  );
}

function LookupSelect({ allowAny = false, disabled, label, lookups, onChange, value }: { allowAny?: boolean; disabled?: boolean; label: string; lookups: LegalLookup[]; onChange: (value: number) => void; value: number }) {
  return (
    <Field label={label}>
      <select className="field h-10 w-full rounded-lg px-3 text-sm disabled:opacity-70" disabled={disabled} onChange={(event) => onChange(Number(event.target.value))} value={value || 0}>
        {allowAny ? <option value={0}>Any</option> : null}
        {lookups.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
      </select>
    </Field>
  );
}

function Badge({ value }: { value: string }) {
  const className = value === "Completed" || value === "Approved" ? "pill-success" : value === "High" ? "pill-danger" : value === "Medium" || value === "Pending" ? "pill-warning" : "pill-brand";
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${className}`}>{value}</span>;
}

function Toast({ message, onClose, type }: { message: string; onClose: () => void; type: ToastType }) {
  const className = type === "success" ? "border-[color:var(--success)] bg-[color:var(--success-soft)] text-[color:var(--success)]" : type === "error" ? "border-[color:var(--danger)] bg-[color:var(--danger-soft)] text-[color:var(--danger)]" : type === "warning" ? "border-[color:var(--warning)] bg-[color:var(--warning-soft)] text-[color:var(--warning)]" : "border-[color:var(--brand)] bg-[color:var(--brand-tint)] text-[color:var(--brand-strong)]";
  return (
    <div className={`fixed right-5 top-20 z-[60] flex max-w-md items-center gap-3 rounded-lg border px-4 py-3 text-sm font-semibold shadow-[var(--shadow-panel)] ${className}`}>
      <span>{message}</span>
      <button aria-label="Close message" onClick={onClose} type="button"><X size={16} /></button>
    </div>
  );
}

function EmptyRow({ colSpan, text }: { colSpan: number; text: string }) {
  return <tr><td className="px-4 py-8 text-center text-sm text-[color:var(--foreground-muted)]" colSpan={colSpan}>{text}</td></tr>;
}

function EmptyText({ text }: { text: string }) {
  return <p className="text-sm text-[color:var(--foreground-muted)]">{text}</p>;
}

function defaultCriteria(): SearchCriteria {
  return {
    documentDateFrom: defaultFrom,
    documentDateTo: isoToday,
    documentStatusIds: [],
    approvalStatusIds: [],
    columnFilter: "",
  };
}

function groupByLegalType(cards: LegalCard[]) {
  return cards.reduce<Record<string, LegalCard[]>>((groups, card) => {
    const key = card.legalType ?? "Unclassified";
    groups[key] = [...(groups[key] ?? []), card];
    return groups;
  }, {});
}

function cloneCard(card: LegalCard): LegalCard {
  return {
    ...card,
    attachments: (card.attachments ?? []).map((attachment) => ({ ...attachment })),
    timeline: (card.timeline ?? []).map((entry) => ({ ...entry })),
  };
}

function labelFor(lookups: LegalLookup[], id: number) {
  return lookups.find((item) => item.id === id)?.label ?? `#${id}`;
}

function firstId(lookups: LegalLookup[], fallback: number) {
  return lookups[0]?.id ?? fallback;
}

function priorityLabel(code: string) {
  return code === "H" ? "High" : code === "L" ? "Low" : "Medium";
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function unique(values: number[]) {
  return Array.from(new Set(values));
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
