"use client";

import {
  ArrowLeft,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Edit3,
  FileText,
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
  Download,
  Eye,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  applyLegalWorkflow,
  cancelLegalCard,
  createLegalCard,
  getLegalDashboard,
  getLegalLookups,
  legalApprovalStatusOptions,
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
  tenants: [],
  properties: [],
  units: [],
  documentStatuses: [],
  cardFlows: [],
  approvalStatuses: [],
  documentTypes: [],
};
const emptyEntityOptions: LegalLookup[] = [];
const actionButtonBase = "inline-flex items-center justify-center gap-2 rounded-lg font-semibold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md";
const navButtonClass = `${actionButtonBase} border border-slate-200 bg-slate-700 text-white hover:bg-slate-800`;
const newButtonClass = `${actionButtonBase} border border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700`;
const editButtonClass = `${actionButtonBase} border border-amber-500 bg-amber-500 text-white hover:bg-amber-600`;
const workflowButtonClass = `${actionButtonBase} border border-teal-700 bg-teal-700 text-white hover:bg-teal-800`;
const saveButtonClass = `${actionButtonBase} border border-blue-700 bg-blue-700 text-white hover:bg-blue-800`;
const refreshButtonClass = `${actionButtonBase} border border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700`;
const cancelButtonClass = `${actionButtonBase} border border-red-600 bg-red-600 text-white hover:bg-red-700`;
const searchButtonClass = `${actionButtonBase} border border-cyan-700 bg-cyan-700 text-white hover:bg-cyan-800`;
const neutralButtonClass = `${actionButtonBase} border border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200`;
const uploadButtonClass = `${actionButtonBase} border border-violet-700 bg-violet-700 text-white hover:bg-violet-800`;
const dangerIconButtonClass = "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-700 transition hover:bg-red-100";
const workflowMenuItemClasses = [
  "border-teal-600 bg-teal-50 text-teal-900 hover:bg-teal-100",
  "border-sky-600 bg-sky-50 text-sky-900 hover:bg-sky-100",
  "border-amber-600 bg-amber-50 text-amber-900 hover:bg-amber-100",
  "border-violet-600 bg-violet-50 text-violet-900 hover:bg-violet-100",
  "border-rose-600 bg-rose-50 text-rose-900 hover:bg-rose-100",
];
const fallbackWorkflowActionsByLabel: Record<string, string[]> = {
  "FINANCIAL_CLAIM:INITIATED": ["Sent To Collection Team"],
  "FINANCIAL_CLAIM:SENT_TO_COLLECTION_TEAM": ["Sent To AAM"],
  "FINANCIAL_CLAIM:SENT_TO_AAM": ["Sent To HOA"],
  "FINANCIAL_CLAIM:SENT_TO_HOA": ["Sent To RDC Team"],
  "FINANCIAL_CLAIM:SENT_TO_RDC_TEAM": ["Prepare Legal Notice"],
  "FINANCIAL_CLAIM:PREPARE_LEGAL_NOTICE": ["Notice Sent Via Aramax"],
  "FINANCIAL_CLAIM:NOTICE_SENT_VIA_ARAMAX": ["Acknowledgment of Notice Received"],
  "FINANCIAL_CLAIM:ACKNOWLEDGMENT_OF_NOTICE_RECEIVED": ["Completed"],
  "POLICE_CASE:INITIATED": ["Sent To Asset Team"],
  "POLICE_CASE:SENT_TO_ASSET_TEAM": ["Sent To HOA"],
  "POLICE_CASE:SENT_TO_HOA": ["Approved To Hold The Police Case", "Sent To Collection Manager For Police Case"],
  "POLICE_CASE:APPROVED_TO_HOLD_THE_POLICE_CASE": ["Police Case Filed"],
  "POLICE_CASE:SENT_TO_COLLECTION_MANAGER_FOR_POLICE_CASE": ["Police Case Filed"],
  "POLICE_CASE:POLICE_CASE_FILED": ["Completed"],
};

export default function LegalManagementPage({ initialCardMode, initialView = "dashboard" }: LegalManagementPageProps) {
  const [view, setView] = useState<ViewMode>(initialView);
  const [cardMode, setCardMode] = useState<CardMode>(initialCardMode ?? "view");
  const [cardBackView, setCardBackView] = useState<ViewMode>(initialView);
  const [cards, setCards] = useState<LegalCard[]>([]);
  const [lookups, setLookups] = useState<LegalLookups>(emptyLookups);
  const [activeCard, setActiveCard] = useState<LegalCard | null>(null);
  const [refreshCard, setRefreshCard] = useState<LegalCard | null>(null);
  const [refreshCardMode, setRefreshCardMode] = useState<CardMode>("view");
  const [criteria, setCriteria] = useState<SearchCriteria>(defaultCriteria());
  const [draftCriteria, setDraftCriteria] = useState<SearchCriteria>(criteria);
  const [searchOpen, setSearchOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: ToastType; text: string } | null>(null);
  const [saveComments, setSaveComments] = useState("");
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [cancelComments, setCancelComments] = useState("");
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [workflowOpen, setWorkflowOpen] = useState(false);
  const [workflowStatusId, setWorkflowStatusId] = useState<number | "">("");
  const [workflowComments, setWorkflowComments] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [dashboardCounts, setDashboardCounts] = useState({ total: 0, completed: 0, inProgress: 0, typeCounts: [] as Array<{ legalTypeId: number; legalType: string; count: number }> });
  const [dashboardListTitle, setDashboardListTitle] = useState("All Legal Cards");
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

  const groupedCards = useMemo(() => groupByLegalType(cards, lookups.legalTypes), [cards, lookups.legalTypes]);
  const workflowOptions = useMemo(() => (activeCard ? workflowOptionsForCard(activeCard, lookups) : []), [activeCard, lookups]);
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
        typeCounts: [],
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
      typeCounts: [],
    });
    if (view === "dashboard") {
      setCards(dashboard.cards ?? []);
    }
  }

  async function loadDashboardDrill(nextCriteria: SearchCriteria, title: string) {
    try {
      setLoading(true);
      const data = await searchLegalCards(searchPayload(nextCriteria));
      setCriteria(nextCriteria);
      setDashboardListTitle(title);
      setCards(data);
    } catch (error) {
      showToast("error", errorMessage(error, "Dashboard drill-down failure."));
    } finally {
      setLoading(false);
    }
  }

  async function loadHistory(nextCriteria: SearchCriteria, title: string) {
    try {
      setLoading(true);
      const data = await searchLegalCards(searchPayload(nextCriteria));
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
      legalTypeId: firstId(sourceLookups.legalTypes),
      currentStageId: defaultStatusId(sourceLookups.stages, "INITIATED"),
      reasonId: firstId(sourceLookups.reasons),
      tenantId: 0,
      propertyId: 0,
      unitId: 0,
      advocateId: undefined,
      caseNumber: "",
      priority: "M",
      documentStatusId: defaultStatusId(sourceLookups.cardFlows, "INITIATED"),
      approvalStatusId: approvedStatusId(sourceLookups.approvalStatuses),
      documentDate: isoToday,
      dueDate: isoToday,
      dueAmount: "0",
      attachments: [],
      timeline: [],
    };
    setActiveCard(card);
    setRefreshCard(cloneCard(card));
    setRefreshCardMode("create");
    setCardMode("create");
    setSaveComments("");
    setCancelComments("");
    setCancelDialogOpen(false);
    setWorkflowComments("");
    setWorkflowStatusId("");
    setView("card");
  }

  function openCard(card: LegalCard) {
    const nextCard = cloneCard(card);
    setCardBackView(view);
    setActiveCard(nextCard);
    setRefreshCard(cloneCard(nextCard));
    setRefreshCardMode("view");
    setSaveComments("");
    setCancelComments("");
    setCancelDialogOpen(false);
    setWorkflowComments("");
    setWorkflowStatusId("");
    setCardMode("view");
    setView("card");
  }

  async function backFromCard() {
    try {
      setLoading(true);
      if (cardBackView === "history") {
        const data = await searchLegalCards(searchPayload(criteria));
        setCards(data);
        setDraftCriteria(criteria);
        setView("history");
        return;
      }
      if (cardBackView === "dashboard") {
        const [dashboard, data] = await Promise.all([
          getLegalDashboard(),
          searchLegalCards(searchPayload(criteria)),
        ]);
        setDashboardCounts({
          total: dashboard.totalCount,
          completed: dashboard.completedCount,
          inProgress: dashboard.inProgressCount,
          typeCounts: [],
        });
        setCards(data);
        setView("dashboard");
        return;
      }
      setView(cardBackView);
    } catch (error) {
      showToast("error", errorMessage(error, "Unable to refresh Legal Card list."));
      setView(cardBackView);
    } finally {
      setLoading(false);
    }
  }

  function refreshCurrentCard() {
    if (cardMode === "create") {
      createBlankCard();
      return;
    }
    if (refreshCard) {
      setActiveCard(cloneCard(refreshCard));
    }
    setCardMode(refreshCardMode);
    setSaveComments("");
    setSaveDialogOpen(false);
    setCancelComments("");
    setCancelDialogOpen(false);
    setWorkflowComments("");
    setWorkflowOpen(false);
    setWorkflowStatusId("");
  }

  function updateActiveCard(patch: Partial<LegalCard>) {
    setActiveCard((card) => (card ? { ...card, ...patch } : card));
  }

  async function saveCard(event: FormEvent) {
    event.preventDefault();
    setSaveDialogOpen(true);
  }

  async function confirmSaveCard() {
    if (!activeCard) {
      return;
    }
    if (!saveComments.trim()) {
      showToast("error", "Comments are mandatory.");
      return;
    }
    const payload = { ...activeCard, ...currentDetailsFormPatch(), comments: saveComments };
    try {
      const saved = activeCard.id ? await updateLegalCard(activeCard.id, payload) : await createLegalCard(payload);
      setActiveCard(saved);
      setRefreshCard(cloneCard(saved));
      setRefreshCardMode("view");
      setCardMode("view");
      setSaveComments("");
      setSaveDialogOpen(false);
      await refreshDashboard();
      showToast("success", activeCard.id ? "Legal Card updated" : "Legal Card Created");
    } catch (error) {
      showToast("error", errorMessage(error, "Validation error."));
    }
  }

  async function addAttachments(event: ChangeEvent<HTMLInputElement>) {
    if (!activeCard || !event.target.files) {
      return;
    }
    const existingNames = new Set((activeCard.attachments ?? []).map((attachment) => attachment.fileName.toLowerCase()));
    const documentTypeId = firstId(lookups.documentTypes);
    if (!documentTypeId) {
      showToast("error", "Attachment document type data is not available.");
      event.target.value = "";
      return;
    }
    const nextAttachments: LegalCardAttachment[] = [];
    for (const file of Array.from(event.target.files)) {
      if (existingNames.has(file.name.toLowerCase()) || nextAttachments.some((item) => item.fileName.toLowerCase() === file.name.toLowerCase())) {
        showToast("warning", `Duplicate attachment skipped: ${file.name}`);
        continue;
      }
      nextAttachments.push({
        documentTypeId,
        documentType: labelFor(lookups.documentTypes, documentTypeId),
        fileName: file.name,
        contentType: file.type || "application/octet-stream",
        contentData: await readFileAsDataUrl(file),
      });
    }
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
    if (!workflowComments.trim()) {
      showToast("error", "Comments are mandatory.");
      return;
    }
    try {
      const saved = await applyLegalWorkflow(activeCard.id, { statusId: Number(workflowStatusId), comments: workflowComments });
      setActiveCard(saved);
      setRefreshCard(cloneCard(saved));
      setRefreshCardMode("view");
      setWorkflowOpen(false);
      setWorkflowComments("");
      setWorkflowStatusId("");
      await refreshDashboard();
      showToast("success", legalCardStatusMessage(saved, lookups));
    } catch (error) {
      showToast("error", errorMessage(error, "Workflow not allowed."));
    }
  }

  async function confirmCancelCard() {
    if (!activeCard?.id) {
      return;
    }
    if (!cancelComments.trim()) {
      showToast("error", "Comments are mandatory.");
      return;
    }
    try {
      const saved = await cancelLegalCard(activeCard.id, { comments: cancelComments });
      setActiveCard(saved);
      setRefreshCard(cloneCard(saved));
      setRefreshCardMode("view");
      setCardMode("view");
      setCancelComments("");
      setCancelDialogOpen(false);
      await refreshDashboard();
      showToast("success", legalCardStatusMessage(saved, lookups));
    } catch (error) {
      showToast("error", errorMessage(error, "Cancel failed."));
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
          completedCount={dashboardCounts.completed}
          expandedGroups={expandedGroups}
          groupedCards={groupedCards}
          inProgressCount={dashboardCounts.inProgress}
          listTitle={dashboardListTitle}
          lookups={lookups}
          loading={loading}
          totalListCount={cards.length}
          totalCount={dashboardCounts.total}
          typeCounts={dashboardCounts.typeCounts}
          onDrillCompleted={() => loadDashboardDrill({ ...defaultCriteria(), documentStatusIds: completedDocumentStatusIds(documentStatusLookups(lookups)), documentDateFrom: "", documentDateTo: "" }, "Completed Legal Cards")}
          onDrillInProgress={() => loadDashboardDrill({ ...defaultCriteria(), documentStatusIds: documentStatusLookups(lookups).filter((status) => !isLookupValue(status, "COMPLETED")).map((status) => status.id), documentDateFrom: "", documentDateTo: "" }, "In Progress Legal Cards")}
          onDrillTotal={() => loadDashboardDrill({ ...defaultCriteria(), documentDateFrom: "", documentDateTo: "" }, "All Legal Cards")}
          onDrillType={(legalTypeId) => loadDashboardDrill({ ...defaultCriteria(), legalTypeId, documentDateFrom: "", documentDateTo: "" }, `${labelFor(lookups.legalTypes, legalTypeId)} Legal Cards`)}
          onOpenCard={openCard}
          onToggleGroup={(legalType) => setExpandedGroups((current) => ({ ...current, [legalType]: !current[legalType] }))}
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
          totalCount={cards.length}
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
          cancelComments={cancelComments}
          cancelDialogOpen={cancelDialogOpen}
          cardMode={cardMode}
          isEditable={isEditable}
          lookups={lookups}
          saveDialogOpen={saveDialogOpen}
          saveComments={saveComments}
          workflowComments={workflowComments}
          workflowOpen={workflowOpen}
          workflowOptions={workflowOptions}
          workflowStatusId={workflowStatusId}
          onAddAttachments={addAttachments}
          onBack={backFromCard}
          onCancel={() => {
            if (!isCardDocumentStatus(activeCard, [...lookups.documentStatuses, ...lookups.cardFlows], "INITIATED")) {
              showToast("warning", "Cancel is available only when Document Status is Initiated.");
              return;
            }
            setCancelDialogOpen(true);
          }}
          onCancelDialogClose={() => {
            setCancelDialogOpen(false);
            setCancelComments("");
          }}
          onCancelDialogSubmit={confirmCancelCard}
          onCreate={() => createBlankCard()}
          onDeleteAttachment={deleteAttachment}
          onEdit={() => setCardMode("edit")}
          onSave={saveCard}
          onRefresh={refreshCurrentCard}
          onSetSaveComments={setSaveComments}
          onSetCancelComments={setCancelComments}
          onSetWorkflowComments={setWorkflowComments}
          onSelectWorkflowAction={(statusId) => {
            if (!isCardApprovalApproved(activeCard, lookups.approvalStatuses)) {
              showToast("warning", "Approval status is not approved.");
              return;
            }
            if (!workflowOptions.length) {
              showToast("warning", "Workflow is not allowed for this status.");
              return;
            }
            setWorkflowStatusId(statusId);
            setWorkflowOpen(true);
          }}
          onUpdateAttachment={updateAttachment}
          onUpdateCard={updateActiveCard}
          onSaveDialogClose={() => setSaveDialogOpen(false)}
          onSaveDialogSubmit={confirmSaveCard}
          onWorkflowClose={() => {
            setWorkflowOpen(false);
            setWorkflowStatusId("");
            setWorkflowComments("");
          }}
          onWorkflowSubmit={applyWorkflowAction}
        />
      ) : null}
    </section>
  );
}

function DashboardView(props: {
  completedCount: number;
  expandedGroups: Record<string, boolean>;
  groupedCards: Record<string, LegalCard[]>;
  inProgressCount: number;
  listTitle: string;
  lookups: LegalLookups;
  loading: boolean;
  totalListCount: number;
  totalCount: number;
  typeCounts: Array<{ legalTypeId: number; legalType: string; count: number }>;
  onDrillCompleted: () => void;
  onDrillInProgress: () => void;
  onDrillTotal: () => void;
  onDrillType: (legalTypeId: number) => void;
  onOpenCard: (card: LegalCard) => void;
  onToggleGroup: (legalType: string) => void;
}) {
  return (
    <>
      <PageHeader title="Legal Dashboard" />
      <div className="grid gap-4 p-4 md:grid-cols-3 md:p-6">
        <Metric label="Total" value={props.totalCount} icon={FileText} onClick={props.onDrillTotal} />
        <Metric label="Completed" value={props.completedCount} icon={Gavel} onClick={props.onDrillCompleted} tone="success" />
        <Metric label="In Progress" value={props.inProgressCount} icon={RefreshCcw} onClick={props.onDrillInProgress} tone="warning" />
      </div>
      <div className="grid gap-4 px-4 pb-4 lg:grid-cols-[0.9fr_1.1fr] md:px-6">
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
        <section className="panel rounded-lg p-5">
          <div className="mb-5 flex items-center gap-3">
            <FileText className="h-5 w-5 text-[color:var(--brand)]" />
            <h2 className="text-lg font-semibold text-[color:var(--brand-strong)]">Dashboard Drill Down</h2>
          </div>
        </section>
      </div>
      <div className="px-4 pb-6 md:px-6">
        <LegalCardListPanel
          expandedGroups={props.expandedGroups}
          groupedCards={props.groupedCards}
          loading={props.loading}
          lookups={props.lookups}
          title={props.listTitle}
          totalCount={props.totalListCount}
          onOpenCard={props.onOpenCard}
          onToggleGroup={props.onToggleGroup}
        />
      </div>
    </>
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
      <PageHeader title={props.title}>
        <button className={`${searchButtonClass} h-10 px-4 text-sm`} onClick={props.onSearchOpen} type="button">
          <Search size={17} /> Search
        </button>
        <button className={`${newButtonClass} h-10 px-4 text-sm`} onClick={props.onCreate} type="button">
          <Plus size={17} /> Create
        </button>
      </PageHeader>
      <div className="p-4 md:p-6">
        <LegalCardListPanel
          expandedGroups={props.expandedGroups}
          groupedCards={props.groupedCards}
          loading={props.loading}
          lookups={props.lookups}
          totalCount={props.totalCount}
          onOpenCard={props.onOpenCard}
          onToggleGroup={props.onToggleGroup}
        />
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

function LegalCardListPanel(props: {
  expandedGroups: Record<string, boolean>;
  groupedCards: Record<string, LegalCard[]>;
  lookups: LegalLookups;
  loading: boolean;
  title?: string;
  totalCount: number;
  onOpenCard: (card: LegalCard) => void;
  onToggleGroup: (legalType: string) => void;
}) {
  return (
    <section className="panel overflow-hidden rounded-xl border border-[color:var(--line-strong)] bg-[color:var(--surface-strong)] p-5">
      {props.title ? <h2 className="mb-4 text-xl font-semibold text-[color:var(--brand-strong)]">{props.title}</h2> : null}
      <div className="overflow-hidden rounded-lg border border-[color:var(--line)]">
        <TableShell className="min-w-[1120px] table-fixed">
          <colgroup>
            <col className="w-[180px]" />
            <col className="w-[280px]" />
            <col className="w-[220px]" />
            <col className="w-[120px]" />
            <col className="w-[150px]" />
            <col className="w-[120px]" />
            <col className="w-[150px]" />
          </colgroup>
          <thead className="bg-[color:var(--surface-muted)] text-xs text-[color:var(--foreground-muted)]">
            <tr>{["Legal Card No", "Tenant", "Property", "Unit", "Advocate", "Priority", "Status"].map((header) => <th className="whitespace-nowrap px-4 py-3 font-bold" key={header}>{header}</th>)}</tr>
          </thead>
          {Object.entries(props.groupedCards).map(([legalType, cards], groupIndex) => (
            <tbody className="divide-y divide-[color:var(--line)]" key={legalType}>
              <tr className={groupIndex % 2 === 0 ? "bg-emerald-50" : "bg-blue-50"}>
                <td className="px-4 py-3 text-sm font-bold text-[color:var(--brand-strong)]" colSpan={7}>
                  <button className="flex items-center gap-3" onClick={() => props.onToggleGroup(legalType)} type="button">
                    {props.expandedGroups[legalType] ?? true ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    {legalType}
                  </button>
                </td>
              </tr>
              {props.expandedGroups[legalType] ?? true ? (
                <>
                  {cards.map((card) => <CardRow card={card} key={card.id ?? card.legalCardNo} lookups={props.lookups} onOpenCard={props.onOpenCard} />)}
                  <tr className={groupIndex % 2 === 0 ? "bg-emerald-50 text-sm font-bold text-[color:var(--brand-strong)]" : "bg-blue-50 text-sm font-bold text-[color:var(--brand-strong)]"}>
                    <td className="border-l-4 border-blue-500 px-4 py-3">Total Count : {cards.length}</td>
                    <td colSpan={6} />
                  </tr>
                </>
              ) : null}
            </tbody>
          ))}
          {!Object.keys(props.groupedCards).length ? (
            <tbody><EmptyRow colSpan={7} text={props.loading ? "Loading Legal Cards..." : "No Legal Cards found in database."} /></tbody>
          ) : null}
          <tfoot className="border-t-2 border-[color:var(--line-strong)] bg-blue-50 text-sm font-bold text-[color:var(--brand-strong)]">
            <tr><td className="px-4 py-3">Total Count : {props.totalCount}</td><td colSpan={6} /></tr>
          </tfoot>
        </TableShell>
      </div>
    </section>
  );
}

function CardRow({ card, lookups, onOpenCard }: { card: LegalCard; lookups: LegalLookups; onOpenCard: (card: LegalCard) => void }) {
  return (
    <tr className="text-sm text-[color:var(--foreground)]">
      <td className="whitespace-nowrap px-4 py-3"><button className="font-semibold text-blue-700" onClick={() => onOpenCard(card)} type="button">{card.legalCardNo}</button></td>
      <td className="px-4 py-3"><span className="block truncate" title={card.tenant}>{card.tenant}</span></td>
      <td className="px-4 py-3"><span className="block truncate" title={card.property}>{card.property}</span></td>
      <td className="whitespace-nowrap px-4 py-3">{card.unit}</td>
      <td className="px-4 py-3"><span className="block truncate" title={card.advocate}>{card.advocate}</span></td>
      <td className="whitespace-nowrap px-4 py-3">{card.priorityLabel ?? priorityLabel(card.priority)}</td>
      <td className="whitespace-nowrap px-4 py-3"><Badge value={displayDocumentStatus(card, lookups)} /></td>
    </tr>
  );
}

function CardView(props: {
  activeCard: LegalCard;
  cancelComments: string;
  cancelDialogOpen: boolean;
  cardMode: CardMode;
  isEditable: boolean;
  lookups: LegalLookups;
  saveDialogOpen: boolean;
  saveComments: string;
  workflowComments: string;
  workflowOpen: boolean;
  workflowOptions: LegalLookup[];
  workflowStatusId: number | "";
  onAddAttachments: (event: ChangeEvent<HTMLInputElement>) => void;
  onBack: () => void;
  onCancel: () => void;
  onCancelDialogClose: () => void;
  onCancelDialogSubmit: () => void;
  onCreate: () => void;
  onDeleteAttachment: (index: number) => void;
  onEdit: () => void;
  onRefresh: () => void;
  onSave: (event: FormEvent) => void;
  onSaveDialogClose: () => void;
  onSaveDialogSubmit: () => void;
  onSetCancelComments: (value: string) => void;
  onSetSaveComments: (value: string) => void;
  onSetWorkflowComments: (value: string) => void;
  onSelectWorkflowAction: (statusId: number) => void;
  onUpdateAttachment: (index: number, patch: Partial<LegalCardAttachment>) => void;
  onUpdateCard: (patch: Partial<LegalCard>) => void;
  onWorkflowClose: () => void;
  onWorkflowSubmit: () => void;
}) {
  const card = props.activeCard;
  const [activeTab, setActiveTab] = useState<"details" | "attachments" | "timeline">("details");
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const actionMenuRef = useRef<HTMLDivElement | null>(null);
  const title = `Legal Card (#: ${card.legalCardNo ?? "New"})`;
  const selectedWorkflowOption = props.workflowOptions.find((option) => option.id === props.workflowStatusId);

  useEffect(() => {
    if (!actionMenuOpen) {
      return;
    }
    function closeOnOutsideClick(event: MouseEvent) {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setActionMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [actionMenuOpen]);

  return (
    <>
      <div className="relative z-40 flex items-center justify-between gap-4 overflow-visible px-5 py-5 sm:px-6">
        <h1 className="display-font min-w-0 truncate text-2xl font-semibold text-[color:var(--brand-strong)] xl:text-3xl">{title}</h1>
        <div className="flex shrink-0 flex-nowrap items-center gap-2">
          <button className={`${navButtonClass} h-10 whitespace-nowrap px-3 text-sm`} onClick={props.onBack} type="button">
            <ArrowLeft size={18} /> Back
          </button>
          {props.cardMode === "view" ? <button className={`${newButtonClass} h-10 whitespace-nowrap px-3 text-sm`} onClick={props.onCreate} type="button"><Plus size={17} /> Create</button> : null}
          {props.cardMode === "view" && canEditLegalCard(card, props.lookups) ? <button className={`${editButtonClass} h-10 whitespace-nowrap px-3 text-sm`} onClick={props.onEdit} type="button"><Edit3 size={18} /> Edit</button> : null}
          {props.cardMode === "view" && isCardDocumentStatus(card, [...props.lookups.documentStatuses, ...props.lookups.cardFlows], "INITIATED") ? <button className={`${cancelButtonClass} h-10 whitespace-nowrap px-3 text-sm`} onClick={props.onCancel} type="button"><X size={18} /> Cancel</button> : null}
          {props.cardMode === "view" && isCardApprovalApproved(card, props.lookups.approvalStatuses) && props.workflowOptions.length ? (
            <div className="relative" ref={actionMenuRef}>
              <button className={`${workflowButtonClass} h-10 whitespace-nowrap px-3 text-sm`} onClick={() => setActionMenuOpen((open) => !open)} type="button">
                <Gavel size={18} /> Action <ChevronDown size={16} />
              </button>
              {actionMenuOpen ? (
                <div className="absolute right-0 z-[80] mt-2 min-w-64 rounded-lg border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-2 shadow-[var(--shadow-panel)]">
                  {props.workflowOptions.map((option, index) => (
                    <button
                      className={`flex w-full items-center justify-between rounded-md border-l-4 px-3 py-2 text-left text-sm font-semibold transition ${workflowMenuItemClasses[index % workflowMenuItemClasses.length]}`}
                      key={option.id}
                      onClick={() => {
                        setActionMenuOpen(false);
                        props.onSelectWorkflowAction(option.id);
                      }}
                      type="button"
                    >
                      <span>{option.label}</span>
                      <ChevronRight className="text-[color:var(--foreground-muted)]" size={16} />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
          {props.isEditable ? <button className={`${refreshButtonClass} h-10 whitespace-nowrap px-3 text-sm`} onClick={props.onRefresh} type="button"><RefreshCcw size={18} /> Refresh</button> : null}
          {props.isEditable ? <button className={`${saveButtonClass} h-10 whitespace-nowrap px-3 text-sm`} form="legal-card-form" type="submit"><Save size={18} /> Save</button> : null}
        </div>
      </div>

      <div className="px-4 pb-6 sm:px-6">
        <section className="panel rounded-lg bg-[color:var(--surface-strong)] p-5">
          <div className="flex flex-col gap-3 border-b border-[color:var(--line-strong)] xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 flex-nowrap gap-2 overflow-x-auto">
              <LegalCardTab active={activeTab === "details"} icon={FileText} label="Details" onClick={() => setActiveTab("details")} tone="blue" />
              <LegalCardTab active={activeTab === "attachments"} icon={Paperclip} label="Attachments" onClick={() => setActiveTab("attachments")} tone="brown" />
              <LegalCardTab active={activeTab === "timeline"} icon={GitBranch} label="Timeline" onClick={() => setActiveTab("timeline")} tone="green" />
            </div>
            {props.cardMode === "create" ? null : (
              <div className="mb-2 flex shrink-0 flex-nowrap items-center gap-2 overflow-x-auto xl:mb-0">
                <LegalStatusPill label="Document" value={displayDocumentStatus(card, props.lookups)} variant="document" />
                <LegalStatusPill label="Approval" value={card.approvalStatus ?? labelFor(props.lookups.approvalStatuses, card.approvalStatusId)} variant="approval" />
              </div>
            )}
          </div>

          {activeTab === "details" ? (
            <form className="grid gap-6 pt-4 xl:grid-cols-[1fr_340px]" id="legal-card-form" onSubmit={props.onSave}>
              <div>
                <div className="grid gap-x-5 md:grid-cols-2">
                  <LookupSelect allowAny disabled={props.cardMode !== "create"} label="Legal Type *" lookups={props.lookups.legalTypes} value={props.lookups.legalTypes.length ? card.legalTypeId : 0} onChange={(value) => props.onUpdateCard({ legalTypeId: value })} />
                  <LookupSelect allowAny disabled={!props.isEditable} label="Current Stage *" lookups={props.lookups.stages} value={lookupValueFor(props.lookups.stages, card.currentStageId)} onChange={(value) => props.onUpdateCard({ currentStageId: value })} />
                  <LookupSelect allowAny disabled={props.cardMode !== "create"} label="Reason *" lookups={props.lookups.reasons} value={props.lookups.reasons.length ? card.reasonId : 0} onChange={(value) => props.onUpdateCard({ reasonId: value })} />
                  <LookupSelect allowAny disabled={props.cardMode !== "create"} label="Tenant *" lookups={props.lookups.tenants} value={card.tenantId || 0} onChange={(value) => props.onUpdateCard({ tenantId: value })} />
                  <LookupSelect allowAny disabled={props.cardMode !== "create"} label="Property *" lookups={props.lookups.properties} value={card.propertyId || 0} onChange={(value) => props.onUpdateCard({ propertyId: value, unitId: 0 })} />
                  <LookupSelect allowAny disabled={props.cardMode !== "create"} label="Unit *" lookups={unitsForProperty(props.lookups.units, card.propertyId)} value={lookupValueFor(unitsForProperty(props.lookups.units, card.propertyId), card.unitId)} onChange={(value) => props.onUpdateCard({ unitId: value })} />
                  <InputField disabled={!props.isEditable} label="Case Number" name="caseNumber" value={card.caseNumber ?? ""} onChange={(value) => props.onUpdateCard({ caseNumber: value })} />
                  <LookupSelect allowAny disabled={!props.isEditable} label="Advocate" lookups={emptyEntityOptions} value={card.advocateId ?? 0} onChange={(value) => props.onUpdateCard({ advocateId: value || undefined })} />
                </div>
              </div>
              <aside className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-4">
                <InputField disabled={props.cardMode !== "create"} label="Document Date *" type="date" value={card.documentDate} onChange={(value) => props.onUpdateCard({ documentDate: value })} />
                <InputField disabled={props.cardMode !== "create"} label="Due Date *" type="date" value={card.dueDate} onChange={(value) => props.onUpdateCard({ dueDate: value })} />
                <InputField disabled={props.cardMode !== "create"} label="Due Amount *" type="number" value={String(card.dueAmount ?? "")} onChange={(value) => props.onUpdateCard({ dueAmount: value })} />
                <SelectField disabled={props.cardMode !== "create"} label="Priority *" value={card.priority} values={[["H", "High"], ["M", "Medium"], ["L", "Low"]]} onChange={(value) => props.onUpdateCard({ priority: value as "H" | "M" | "L" })} />
              </aside>
            </form>
          ) : null}

          {activeTab === "attachments" ? (
            <div className="pt-5">
              <AttachmentsPanel activeCard={card} isEditable={props.cardMode === "create"} lookups={props.lookups} onAddAttachments={props.onAddAttachments} onDeleteAttachment={props.onDeleteAttachment} onUpdateAttachment={props.onUpdateAttachment} />
            </div>
          ) : null}

          {activeTab === "timeline" ? (
            <div className="pt-5">
              <TimelinePanel entries={card.timeline ?? []} lookups={props.lookups} />
            </div>
          ) : null}
        </section>
      </div>

      {props.saveDialogOpen ? (
        <Dialog title="Save Comments" onClose={props.onSaveDialogClose}>
          <div className="space-y-4">
            <Field label="Comments *">
              <textarea autoFocus className="field min-h-28 w-full rounded-lg px-3 py-2 text-sm" onChange={(event) => props.onSetSaveComments(event.target.value)} value={props.saveComments} />
            </Field>
            <div className="flex justify-end gap-3">
              <button className={`${neutralButtonClass} h-10 px-4 text-sm`} onClick={props.onSaveDialogClose} type="button">Cancel</button>
              <button className={`${saveButtonClass} h-10 px-4 text-sm`} onClick={props.onSaveDialogSubmit} type="button">Save</button>
            </div>
          </div>
        </Dialog>
      ) : null}

      {props.cancelDialogOpen ? (
        <Dialog title="Cancel Legal Card" onClose={props.onCancelDialogClose}>
          <div className="space-y-4">
            <Field label="Comments *">
              <textarea autoFocus className="field min-h-28 w-full rounded-lg px-3 py-2 text-sm" onChange={(event) => props.onSetCancelComments(event.target.value)} value={props.cancelComments} />
            </Field>
            <div className="flex justify-end gap-3">
              <button className={`${neutralButtonClass} h-10 px-4 text-sm`} onClick={props.onCancelDialogClose} type="button">Close</button>
              <button className={`${cancelButtonClass} h-10 px-4 text-sm`} onClick={props.onCancelDialogSubmit} type="button">Cancel</button>
            </div>
          </div>
        </Dialog>
      ) : null}

      {props.workflowOpen ? (
        <Dialog title="Workflow Action" onClose={props.onWorkflowClose}>
          <div className="space-y-4">
            <Field label="Action">
              <div className="field flex h-10 w-full items-center rounded-lg px-3 text-sm font-semibold">{selectedWorkflowOption?.label ?? labelFor(documentStatusLookups(props.lookups), Number(props.workflowStatusId))}</div>
            </Field>
            <Field label="Comments *">
              <textarea className="field min-h-28 w-full rounded-lg px-3 py-2 text-sm" onChange={(event) => props.onSetWorkflowComments(event.target.value)} value={props.workflowComments} />
            </Field>
            <div className="flex justify-end gap-3">
              <button className={`${neutralButtonClass} h-10 px-4 text-sm`} onClick={props.onWorkflowClose} type="button">Cancel</button>
              <button className={`${workflowButtonClass} h-10 px-4 text-sm`} onClick={props.onWorkflowSubmit} type="button">Confirm</button>
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
      className={`flex h-12 shrink-0 items-center gap-2 border-b-4 px-3 text-sm font-bold transition ${colorClass} ${active ? "border-blue-700 bg-[color:var(--surface-muted)]" : "border-transparent hover:bg-[color:var(--surface-muted)]"}`}
      onClick={onClick}
      type="button"
    >
      <Icon size={18} />
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
    <div className={`flex h-10 max-w-[420px] shrink-0 items-center gap-2 rounded-full border px-3 text-sm font-bold ${styles}`}>
      <span className="text-[11px] font-extrabold opacity-80">{label}</span>
      <Icon className="shrink-0" size={18} />
      <span className="truncate whitespace-nowrap">{value}</span>
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
          <label className={`${uploadButtonClass} h-10 cursor-pointer px-4 text-sm`}>
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
              <th className="px-4 py-3 font-semibold">Document Name</th>
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
                  <input
                    className="field h-10 w-full min-w-48 rounded-lg px-3 text-sm disabled:opacity-70"
                    disabled={!props.isEditable}
                    onChange={(event) => props.onUpdateAttachment(index, { documentName: event.target.value })}
                    placeholder="Document name"
                    value={attachment.documentName ?? ""}
                  />
                </td>
                <td className="px-4 py-3 align-top">
                  <div className="flex items-center gap-2 font-semibold text-[color:var(--brand-strong)]">
                    <Paperclip size={15} />
                    <span className="max-w-64 truncate" title={attachment.fileName}>{attachment.fileName}</span>
                  </div>
                </td>
                <td className="px-4 py-3 align-top">
                  <div className="flex justify-end gap-2">
                    <button aria-label={`Preview ${attachment.fileName}`} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700 transition hover:bg-blue-100" onClick={() => previewAttachment(attachment)} title="Preview" type="button">
                      <Eye size={16} />
                    </button>
                    <button aria-label={`Download ${attachment.fileName}`} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100" onClick={() => downloadAttachment(attachment)} title="Download" type="button">
                      <Download size={16} />
                    </button>
                    {props.isEditable && !attachment.id ? (
                      <button aria-label={`Delete ${attachment.fileName}`} className={dangerIconButtonClass} onClick={() => props.onDeleteAttachment(index)} title="Delete" type="button">
                        <Trash2 size={16} />
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            )) : <EmptyRow colSpan={4} text="No attachments added." />}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function TimelinePanel({ entries, lookups }: { entries: NonNullable<LegalCard["timeline"]>; lookups: LegalLookups }) {
  return (
    <section className="rounded-lg">
      <h2 className="mb-5 text-lg font-bold text-slate-900">Legal Card Timeline</h2>
      <div className="space-y-4">
        {entries.length ? entries.map((entry, index) => {
          const status = timelineStatus(entry, lookups, index);
          return (
            <div className="relative grid grid-cols-[44px_minmax(0,1fr)] gap-4" key={entry.id ?? `${entry.statusId}-${index}`}>
              {index < entries.length - 1 ? <div className="absolute left-5 top-10 h-[calc(100%+1rem)] w-px bg-slate-200" /> : null}
              <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-teal-700 text-sm font-bold text-white shadow-sm">
                {index + 1}
              </div>
              <div className="rounded-md border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <h3 className="text-base font-bold text-slate-900">{status}</h3>
                <p className="mt-1.5 text-sm leading-6 text-slate-800">{timelineMessage(entry, status)}</p>
                <p className="mt-2 text-xs font-semibold text-slate-500">
                  {timelineActor(entry)} <span className="mx-2 font-normal">{formatTimelineDateTime(entry.createdOn ?? entry.timestamp)}</span>
                </p>
              </div>
            </div>
          );
        }) : <EmptyText text="Timeline entries appear after save or workflow action." />}
      </div>
    </section>
  );
}

function timelineStatus(entry: NonNullable<LegalCard["timeline"]>[number], lookups: LegalLookups, index: number) {
  if (entry.action === "Updated") {
    return "Updated";
  }
  const lookupLabel = labelFor(documentStatusLookups(lookups), entry.statusId);
  const entryStatus = entry.status?.trim();
  const entryStep = entry.step?.trim();
  if (entryStatus && !isPlaceholderStatusLabel(entryStatus)) {
    return entryStatus;
  }
  if (!isPlaceholderStatusLabel(lookupLabel)) {
    return lookupLabel;
  }
  return entryStep && !isPlaceholderStatusLabel(entryStep) ? entryStep : `Step ${index + 1}`;
}

function timelineActor(entry: NonNullable<LegalCard["timeline"]>[number]) {
  if (!entry.createdBy) {
    return entry.actor?.trim() || "System";
  }
  const currentUser = loggedInUserDisplay();
  if (currentUser.id && currentUser.id === entry.createdBy && currentUser.name) {
    return currentUser.name;
  }
  const actor = entry.actor?.trim();
  return actor && !/^user\s*#\d+$/i.test(actor) ? actor : `User ${entry.createdBy}`;
}

function timelineMessage(entry: NonNullable<LegalCard["timeline"]>[number], status: string) {
  if (entry.remarks?.trim()) {
    return entry.remarks.trim();
  }
  if (entry.action === "Created") {
    return "Legal Card created.";
  }
  if (entry.action === "Updated") {
    return "Legal Card updated.";
  }
  if (entry.action === "Status Changed" || entry.action === "Workflow") {
    return `Status moved to ${status}.`;
  }
  return "Timeline updated.";
}

function previewAttachment(attachment: LegalCardAttachment) {
  const blob = attachmentToBlob(attachment);
  if (!blob) {
    window.alert("Preview is not available because this attachment has no stored file content.");
    return;
  }
  const fileUrl = URL.createObjectURL(blob);
  const safeTitle = escapeHtml(attachment.documentName || attachment.fileName);
  const html = attachment.contentType?.startsWith("image/")
    ? `<!doctype html><html><head><title>${safeTitle}</title><style>body{margin:0;padding:24px;background:#f8fafc;color:#0f172a;font-family:Arial,sans-serif}img{display:block;max-width:100%;height:auto;margin:0 auto;box-shadow:0 8px 24px rgba(15,23,42,.12)}</style></head><body><img src="${fileUrl}" alt="${safeTitle}" /></body></html>`
    : `<!doctype html><html><head><title>${safeTitle}</title><style>body{margin:0;background:#f8fafc}iframe{border:0;width:100vw;height:100vh;display:block}</style></head><body><iframe src="${fileUrl}" title="${safeTitle}"></iframe></body></html>`;
  const htmlUrl = URL.createObjectURL(new Blob([html], { type: "text/html" }));
  const previewWindow = window.open(htmlUrl, "_blank");
  if (!previewWindow) {
    URL.revokeObjectURL(fileUrl);
    URL.revokeObjectURL(htmlUrl);
    window.alert("Popup blocked. Please allow popups to preview this attachment.");
    return;
  }
  setTimeout(() => {
    URL.revokeObjectURL(fileUrl);
    URL.revokeObjectURL(htmlUrl);
  }, 60000);
}

function downloadAttachment(attachment: LegalCardAttachment) {
  const blob = attachmentToBlob(attachment);
  if (!blob) {
    window.alert("Download is not available because this attachment has no stored file content.");
    return;
  }
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = attachment.fileName || attachment.documentName || "attachment";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
}

function attachmentToBlob(attachment: LegalCardAttachment) {
  if (!attachment.contentData) {
    return null;
  }
  if (attachment.contentData.startsWith("data:")) {
    return dataUrlToBlob(attachment.contentData, attachment.contentType);
  }
  const contentType = attachment.contentType || "application/octet-stream";
  return new Blob([attachment.contentData], { type: contentType });
}

function dataUrlToBlob(dataUrl: string, fallbackContentType?: string) {
  const match = dataUrl.match(/^data:([^;,]+)?(;base64)?,(.*)$/);
  if (!match) {
    return new Blob([dataUrl], { type: fallbackContentType || "application/octet-stream" });
  }
  const contentType = match[1] || fallbackContentType || "application/octet-stream";
  const isBase64 = Boolean(match[2]);
  const data = match[3] || "";
  if (!isBase64) {
    return new Blob([decodeURIComponent(data)], { type: contentType });
  }
  const binary = window.atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Blob([bytes], { type: contentType });
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[char] ?? char);
}

function SearchDialog({ criteria, lookups, onClose, onReset, onSubmit, setCriteria }: { criteria: SearchCriteria; lookups: LegalLookups; onClose: () => void; onReset: () => void; onSubmit: () => void; setCriteria: (criteria: SearchCriteria) => void }) {
  const approvalStatuses = legalApprovalStatusOptions(lookups.approvalStatuses);

  return (
    <Dialog title="Search" onClose={onClose} size="wide">
      <div className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2 xl:grid-cols-3">
        <SearchControl><InputField label="Legal Card No." value={criteria.legalCardNo ?? ""} onChange={(value) => setCriteria({ ...criteria, legalCardNo: value })} /></SearchControl>
        <SearchControl><LookupSelect allowAny label="Legal Type" lookups={lookups.legalTypes} value={criteria.legalTypeId ?? 0} onChange={(value) => setCriteria({ ...criteria, legalTypeId: value || undefined })} /></SearchControl>
        <SearchControl><LookupSelect allowAny label="Tenant" lookups={lookups.tenants} value={criteria.tenantId ?? 0} onChange={(value) => setCriteria({ ...criteria, tenantId: value || undefined })} /></SearchControl>
        <SearchControl><LookupSelect allowAny label="Property" lookups={lookups.properties} value={criteria.propertyId ?? 0} onChange={(value) => setCriteria({ ...criteria, propertyId: value || undefined, unitId: undefined })} /></SearchControl>
        <SearchControl><LookupSelect allowAny label="Unit" lookups={unitsForProperty(lookups.units, criteria.propertyId)} value={lookupValueFor(unitsForProperty(lookups.units, criteria.propertyId), criteria.unitId)} onChange={(value) => setCriteria({ ...criteria, unitId: value || undefined })} /></SearchControl>
        <SearchControl><LookupSelect allowAny label="Advocate" lookups={emptyEntityOptions} value={criteria.advocateId ?? 0} onChange={(value) => setCriteria({ ...criteria, advocateId: value || undefined })} /></SearchControl>
        <SearchControl><InputField label="Document Date From" type="date" value={criteria.documentDateFrom ?? ""} onChange={(value) => setCriteria({ ...criteria, documentDateFrom: value })} /></SearchControl>
        <SearchControl><InputField label="Document Date To" type="date" value={criteria.documentDateTo ?? ""} onChange={(value) => setCriteria({ ...criteria, documentDateTo: value })} /></SearchControl>
        <SearchControl><InputField label="Due Date" type="date" value={criteria.dueDate ?? ""} onChange={(value) => setCriteria({ ...criteria, dueDate: value })} /></SearchControl>
        <SearchControl><MultiSelect dropUp label="Document Status" options={documentStatusLookups(lookups)} selected={criteria.documentStatusIds ?? []} onChange={(values) => setCriteria({ ...criteria, documentStatusIds: values })} /></SearchControl>
        <SearchControl><MultiSelect dropUp label="Approval Status" options={approvalStatuses} selected={criteria.approvalStatusIds ?? []} onChange={(values) => setCriteria({ ...criteria, approvalStatusIds: values })} /></SearchControl>
      </div>
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button className={`${neutralButtonClass} h-10 px-4 text-sm`} onClick={onReset} type="button">Reset</button>
        <button className={`${searchButtonClass} h-10 px-4 text-sm`} onClick={onSubmit} type="button">Search</button>
      </div>
    </Dialog>
  );
}

function SearchControl({ children }: { children: ReactNode }) {
  return <div className="min-w-0">{children}</div>;
}

function MultiSelect({ dropUp = false, label, onChange, options, selected }: { dropUp?: boolean; label: string; onChange: (values: number[]) => void; options: LegalLookup[]; selected: number[] }) {
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
          <div className={`absolute z-40 w-full rounded-lg border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-3 shadow-[var(--shadow-panel)] ${dropUp ? "bottom-full mb-2" : "mt-2"}`}>
            <input className="field mb-2 h-9 w-full rounded-lg px-3 text-sm" onChange={(event) => setFilter(event.target.value)} placeholder="Filter options" value={filter} />
            <label className="flex items-center gap-2 border-b border-[color:var(--line)] py-2 text-sm font-semibold">
              <input checked={visibleSelected} onChange={(event) => onChange(event.target.checked ? unique([...selected, ...visibleIds]) : selected.filter((value) => !visibleIds.includes(value)))} type="checkbox" />
              Select All
            </label>
            <div className="max-h-36 overflow-y-auto py-1">
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

function PageHeader({ children, title }: { children?: ReactNode; title: string }) {
  return (
    <div className="border-b border-[color:var(--line)] px-5 py-5 sm:px-6 sm:py-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="display-font text-3xl font-semibold text-[color:var(--brand-strong)]">{title}</h1>
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

function TableShell({ children, className = "min-w-[900px]" }: { children: ReactNode; className?: string }) {
  return <div className="overflow-x-auto"><table className={`w-full text-left text-sm ${className}`}>{children}</table></div>;
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return <label className="mt-4 block text-sm font-semibold text-[color:var(--brand-strong)]"><span className="mb-2 block">{label}</span>{children}</label>;
}

function InputField({ disabled, label, name, onChange, type = "text", value }: { disabled?: boolean; label: string; name?: string; onChange: (value: string) => void; type?: string; value: string }) {
  return <Field label={label}><input className="field h-10 w-full rounded-lg px-3 text-sm disabled:opacity-70" disabled={disabled} name={name} onChange={(event) => onChange(event.target.value)} type={type} value={value} /></Field>;
}

function SelectField({ disabled, label, onChange, value, values }: { disabled?: boolean; label: string; onChange: (value: string) => void; value: string; values: string[][] }) {
  const options = values.map(([id, labelText]) => ({ id, label: labelText }));
  return <SearchableSelect disabled={disabled} label={label} options={options} value={value} onChange={onChange} />;
}

function LookupSelect({ allowAny = false, disabled, label, lookups, onChange, value }: { allowAny?: boolean; disabled?: boolean; label: string; lookups: LegalLookup[]; onChange: (value: number) => void; value: number }) {
  const options = [
    ...(allowAny ? [{ id: "0", label: "Any" }] : []),
    ...lookups.map((item) => ({ id: String(item.id), label: item.label, code: item.code })),
  ];
  return <SearchableSelect disabled={disabled} label={label} options={options} value={String(value || 0)} onChange={(nextValue) => onChange(Number(nextValue))} />;
}

function SearchableSelect({ disabled, label, onChange, options, value }: { disabled?: boolean; label: string; onChange: (value: string) => void; options: Array<{ id: string; label: string; code?: string }>; value: string }) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const selected = options.find((option) => option.id === value);
  const visible = options.filter((option) => option.label.toLowerCase().includes(filter.toLowerCase()) || (option.code ?? "").toLowerCase().includes(filter.toLowerCase()));

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

  function selectOption(nextValue: string) {
    onChange(nextValue);
    setOpen(false);
    setFilter("");
  }

  return (
    <Field label={label}>
      <div className="relative" ref={dropdownRef}>
        <button
          className="field flex h-10 w-full items-center justify-between rounded-lg px-3 text-left text-sm disabled:opacity-70"
          disabled={disabled}
          onClick={() => {
            setOpen((current) => !current);
            setFilter("");
          }}
          type="button"
        >
          <span className="truncate">{selected?.label ?? "Any"}</span>
          <ChevronDown size={16} />
        </button>
        {open ? (
          <div className="absolute z-30 mt-2 w-full rounded-lg border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-3 shadow-[var(--shadow-panel)]">
            <input autoFocus className="field mb-2 h-9 w-full rounded-lg px-3 text-sm" onChange={(event) => setFilter(event.target.value)} placeholder="Filter options" value={filter} />
            <div className="max-h-52 overflow-y-auto py-1">
              {visible.length ? visible.map((option) => (
                <button
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-[color:var(--surface-muted)] ${option.id === value ? "font-semibold text-[color:var(--brand)]" : "text-[color:var(--foreground)]"}`}
                  key={option.id}
                  onClick={() => selectOption(option.id)}
                  type="button"
                >
                  <span className="truncate">{option.label}</span>
                  {option.code ? <span className="ml-3 shrink-0 text-xs text-[color:var(--foreground-muted)]">{option.code}</span> : null}
                </button>
              )) : <p className="px-3 py-2 text-sm text-[color:var(--foreground-muted)]">No options found.</p>}
            </div>
          </div>
        ) : null}
      </div>
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

function currentDetailsFormPatch(): Partial<LegalCard> {
  if (typeof document === "undefined") {
    return {};
  }
  const form = document.getElementById("legal-card-form");
  if (!(form instanceof HTMLFormElement)) {
    return {};
  }
  const caseNumber = form.elements.namedItem("caseNumber");
  return caseNumber instanceof HTMLInputElement ? { caseNumber: caseNumber.value } : {};
}

function searchPayload(criteria: SearchCriteria): LegalCardSearch {
  const { columnFilter: _ignoredColumnFilter, ...search } = criteria;
  void _ignoredColumnFilter;
  return search;
}

function groupByLegalType(cards: LegalCard[], legalTypes: LegalLookup[]) {
  return cards.reduce<Record<string, LegalCard[]>>((groups, card) => {
    const key = legalTypeGroupLabel(card, legalTypes);
    groups[key] = [...(groups[key] ?? []), card];
    return groups;
  }, {});
}

function legalTypeGroupLabel(card: LegalCard, legalTypes: LegalLookup[]) {
  const lookupLabel = legalTypes.find((item) => item.id === card.legalTypeId)?.label?.trim();
  if (lookupLabel) {
    return lookupLabel;
  }
  const cardLabel = card.legalType?.trim();
  return cardLabel || "Unassigned Legal Type";
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

function documentStatusLookups(lookups: LegalLookups) {
  return mergeLookups(lookups.cardFlows, lookups.documentStatuses, lookups.stages);
}

function mergeLookups(...sources: LegalLookup[][]) {
  const merged = new Map<number, LegalLookup>();
  sources.flat().forEach((lookup) => {
    if (!merged.has(lookup.id)) {
      merged.set(lookup.id, lookup);
    }
  });
  return Array.from(merged.values());
}

function displayDocumentStatus(card: LegalCard, lookups: LegalLookups) {
  const lookupLabel = labelFor(documentStatusLookups(lookups), card.documentStatusId);
  const cardLabel = card.documentStatus?.trim();
  return cardLabel && !isPlaceholderStatusLabel(cardLabel) ? cardLabel : lookupLabel;
}

function canEditLegalCard(card: LegalCard, lookups: LegalLookups) {
  if (!card.id) {
    return false;
  }
  const documentStatus = normalizedLookupText(displayDocumentStatus(card, lookups));
  return documentStatus !== "CANCELLED" && documentStatus !== "COMPLETED";
}

function legalCardStatusMessage(card: LegalCard, lookups: LegalLookups) {
  const status = displayDocumentStatus(card, lookups);
  return status ? `Legal Card ${status}` : "Legal Card Updated";
}

function formatTimelineDateTime(value?: string) {
  if (!value) {
    return "";
  }
  const normalizedValue = value.includes("T") ? value : value.replace(" ", "T");
  const date = new Date(normalizedValue);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function loggedInUserDisplay() {
  if (typeof window === "undefined") {
    return { id: undefined as number | undefined, name: "" };
  }
  const user = storedObject("propertyConnect.user");
  const profile = storedObject("propertyConnect.userProfile");
  const nestedProfile = objectValue(profile?.userProfile) ?? objectValue(profile?.loggedUserProfile) ?? objectValue(profile?.loggedUser) ?? objectValue(profile?.user);
  const id = numericValue(nestedProfile?.id ?? nestedProfile?.userId ?? profile?.id ?? profile?.userId ?? user?.id);
  const name = stringValue(nestedProfile?.name ?? nestedProfile?.userName ?? nestedProfile?.loginId ?? profile?.name ?? profile?.userName ?? profile?.loginId ?? user?.name);
  return { id, name };
}

function storedObject(key: string): Record<string, unknown> | null {
  const rawValue = localStorage.getItem(key) ?? sessionStorage.getItem(key);
  if (!rawValue) {
    return null;
  }
  try {
    return objectValue(JSON.parse(rawValue));
  } catch {
    return null;
  }
}

function objectValue(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function numericValue(value: unknown): number | undefined {
  const numeric = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(numeric) && numeric > 0 ? numeric : undefined;
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function workflowOptionsForCard(card: LegalCard, lookups: LegalLookups) {
  const legalType = normalizedLookupText(legalTypeGroupLabel(card, lookups.legalTypes));
  const documentStatus = normalizedLookupText(displayDocumentStatus(card, lookups));
  const nextStatusLabels = fallbackWorkflowActionsByLabel[`${legalType}:${documentStatus}`] ?? [];
  return nextStatusLabels.flatMap((label) => {
    const lookup = findWorkflowStatusLookup(label, lookups);
    return lookup ? [{ id: lookup.id, code: lookup.code, label: lookup.label }] : [];
  });
}

function isPlaceholderStatusLabel(value: string) {
  return /^status\s*#\d+$/i.test(value.trim()) || /^#\d+$/.test(value.trim());
}

function findWorkflowStatusLookup(label: string, lookups: LegalLookups) {
  const expectedLabel = normalizedLookupText(label);
  return documentStatusLookups(lookups).find((lookup) => isLookupValue(lookup, expectedLabel));
}

function unitsForProperty(units: LegalLookup[], propertyId?: number) {
  if (!propertyId) {
    return units;
  }
  return units.filter((unit) => unit.parentId === propertyId);
}

function lookupValueFor(lookups: LegalLookup[], value?: number) {
  if (!value) {
    return 0;
  }
  return lookups.some((lookup) => lookup.id === value) ? value : 0;
}

function firstId(lookups: LegalLookup[]) {
  return lookups[0]?.id ?? 0;
}

function approvedStatusId(lookups: LegalLookup[]) {
  return defaultStatusId(lookups, "APPROVED");
}

function defaultStatusId(lookups: LegalLookup[], status: string) {
  return lookups.find((lookup) => isLookupValue(lookup, status))?.id ?? 0;
}

function completedDocumentStatusIds(lookups: LegalLookup[]) {
  return lookups.filter((lookup) => isLookupValue(lookup, "COMPLETED")).map((lookup) => lookup.id);
}

function isDocumentStatus(id: number | undefined, lookups: LegalLookup[], status: string) {
  return lookups.some((lookup) => lookup.id === id && isLookupValue(lookup, status));
}

function isApprovalApproved(id: number | undefined, lookups: LegalLookup[]) {
  return isDocumentStatus(id, lookups, "APPROVED");
}

function isCardDocumentStatus(card: LegalCard, lookups: LegalLookup[], status: string) {
  return normalizedLookupText(card.documentStatus) === status || isDocumentStatus(card.documentStatusId, lookups, status);
}

function isCardApprovalApproved(card: LegalCard, lookups: LegalLookup[]) {
  return normalizedLookupText(card.approvalStatus) === "APPROVED" || isApprovalApproved(card.approvalStatusId, lookups);
}

function isLookupValue(lookup: LegalLookup, status: string) {
  return normalizedLookupText(lookup.label) === status || normalizedLookupText(lookup.code) === status;
}

function normalizedLookupText(value?: string) {
  return (value ?? "").trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
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
