package com.eba.propertyconnect.propertymanagement.legal.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

import org.mybatis.cdi.Transactional;

import com.eba.propertyconnect.propertymanagement.integration.coreconnect.service.ErpCodeValueService;
import com.eba.propertyconnect.propertymanagement.legal.domain.LegalCard;
import com.eba.propertyconnect.propertymanagement.legal.domain.LegalCardAttachment;
import com.eba.propertyconnect.propertymanagement.legal.domain.LegalCardSearch;
import com.eba.propertyconnect.propertymanagement.legal.domain.LegalCardTimeline;
import com.eba.propertyconnect.propertymanagement.legal.domain.LegalDashboard;
import com.eba.propertyconnect.propertymanagement.legal.domain.LegalDashboard.LegalTypeCount;
import com.eba.propertyconnect.propertymanagement.legal.domain.LegalLookups;
import com.eba.propertyconnect.propertymanagement.legal.domain.LegalLookup;
import com.eba.propertyconnect.propertymanagement.legal.domain.LegalWorkflowRequest;
import com.eba.propertyconnect.propertymanagement.legal.mapper.LegalCardMapper;
import com.eba.propertyconnect.propertymanagement.leasing.domain.ErpCodeValue;
import com.eba.propertyconnect.propertymanagement.leasing.service.LeasingService;
import com.eba.propertyconnect.propertymanagement.property.domain.PropertySearch;
import com.eba.propertyconnect.propertymanagement.property.service.PropertyService;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class LegalService {

	private static final Map<String, String> ALLOWED_APPROVAL_STATUSES = Map.of(
			"APPROVE", "Approved",
			"APPROVED", "Approved",
			"SUBMIT", "Submitted",
			"SUBMITTED", "Submitted",
			"RETURN", "Returned",
			"RETURNED", "Returned",
			"REJECT", "Rejected",
			"REJECTED", "Rejected",
			"CANCEL", "Cancelled",
			"CANCELLED", "Cancelled");
	private static final Map<String, List<String>> LEGAL_WORKFLOW_BY_LABEL = Map.ofEntries(
			Map.entry(workflowLabelKey("Financial Claim", "Initiated"), List.of("Sent To Collection Team")),
			Map.entry(workflowLabelKey("Financial Claim", "Sent To Collection Team"), List.of("Sent To AAM")),
			Map.entry(workflowLabelKey("Financial Claim", "Sent To AAM"), List.of("Sent To HOA")),
			Map.entry(workflowLabelKey("Financial Claim", "Sent To HOA"), List.of("Sent To RDC Team")),
			Map.entry(workflowLabelKey("Financial Claim", "Sent To RDC Team"), List.of("Prepare Legal Notice")),
			Map.entry(workflowLabelKey("Financial Claim", "Prepare Legal Notice"), List.of("Notice Sent Via Aramax")),
			Map.entry(workflowLabelKey("Financial Claim", "Notice Sent Via Aramax"), List.of("Acknowledgment of Notice Received")),
			Map.entry(workflowLabelKey("Financial Claim", "Acknowledgment of Notice Received"), List.of("Completed")),
			Map.entry(workflowLabelKey("Police Case", "Initiated"), List.of("Sent To Asset Team")),
			Map.entry(workflowLabelKey("Police Case", "Sent To Asset Team"), List.of("Sent To HOA")),
			Map.entry(workflowLabelKey("Police Case", "Sent To HOA"), List.of("Approved To Hold The Police Case", "Sent To Collection Manager For Police Case")),
			Map.entry(workflowLabelKey("Police Case", "Approved To Hold The Police Case"), List.of("Police Case Filed")),
			Map.entry(workflowLabelKey("Police Case", "Sent To Collection Manager For Police Case"), List.of("Police Case Filed")),
			Map.entry(workflowLabelKey("Police Case", "Police Case Filed"), List.of("Completed")));
	private static final Map<String, List<String>> LEGAL_WORKFLOW_BY_STATUS = Map.ofEntries(
			Map.entry(normalizeWorkflowText("Initiated"), List.of("Sent To Collection Team", "Sent To Asset Team")),
			Map.entry(normalizeWorkflowText("Sent To Collection Team"), List.of("Sent To AAM")),
			Map.entry(normalizeWorkflowText("Sent To AAM"), List.of("Sent To HOA")),
			Map.entry(normalizeWorkflowText("Sent To Asset Team"), List.of("Sent To HOA")),
			Map.entry(normalizeWorkflowText("Sent To HOA"), List.of("Sent To RDC Team", "Approved To Hold The Police Case", "Sent To Collection Manager For Police Case")),
			Map.entry(normalizeWorkflowText("Sent To RDC Team"), List.of("Prepare Legal Notice")),
			Map.entry(normalizeWorkflowText("Prepare Legal Notice"), List.of("Notice Sent Via Aramax")),
			Map.entry(normalizeWorkflowText("Notice Sent Via Aramax"), List.of("Acknowledgment of Notice Received")),
			Map.entry(normalizeWorkflowText("Acknowledgment of Notice Received"), List.of("Completed")),
			Map.entry(normalizeWorkflowText("Approved To Hold The Police Case"), List.of("Police Case Filed")),
			Map.entry(normalizeWorkflowText("Sent To Collection Manager For Police Case"), List.of("Police Case Filed")),
			Map.entry(normalizeWorkflowText("Police Case Filed"), List.of("Completed")));

	@Inject
	private LegalCardMapper mapper;

	@Inject
	private LeasingService leasingService;

	@Inject
	private PropertyService propertyService;

	@Inject
	private ErpCodeValueService erpCodeValueService;

	public LegalLookups lookups(Long companyId, Long clientId) {
		LegalLookups lookups = emptyLookups();
		lookups.legalTypes = erpLookup("pa_legal_card_type", clientId, companyId);
		lookups.stages = erpLookup("pa_legal_card_stage", clientId, companyId);
		lookups.reasons = erpLookup("pa_legal_card_reason", clientId, companyId);
		lookups.tenants = tenantLookups(companyId);
		lookups.properties = propertyLookups(companyId);
		lookups.units = unitLookups(companyId);
		lookups.documentStatuses = erpLookup("pa_legal_document_flow", clientId, companyId);
		lookups.cardFlows = erpLookup("pa_legal_card_flow", clientId, companyId);
		lookups.approvalStatuses = filterApprovalStatuses(erpLookup("cf_decision", clientId, companyId));
		lookups.documentTypes = erpLookup("pa_legal_document_type", clientId, companyId);
		return lookups;
	}

	public LegalDashboard dashboard(Long companyId) {
		return dashboard(companyId, null);
	}

	public LegalDashboard dashboard(Long companyId, Long clientId) {
		LegalCardSearch search = new LegalCardSearch();
		search.companyId = companyId;
		List<LegalCard> cards = enrich(mapper.searchLegalCards(search), clientId);
		LegalDashboard dashboard = new LegalDashboard();
		dashboard.cards = cards;
		dashboard.totalCount = cards.size();
		List<Long> completedStatusIds = completedStatusIds(companyId, clientId);
		dashboard.completedCount = (int) cards.stream().filter(card -> completedStatusIds.contains(card.documentStatusId)).count();
		dashboard.inProgressCount = dashboard.totalCount - dashboard.completedCount;
		Map<Long, String> legalTypes = lookupMap(lookups(companyId, clientId).legalTypes);
		Map<Long, Long> typeCounts = cards.stream().collect(Collectors.groupingBy(card -> card.legalTypeId, Collectors.counting()));
		dashboard.legalTypeCounts = typeCounts.entrySet().stream()
				.map(entry -> {
					LegalTypeCount count = new LegalTypeCount();
					count.legalTypeId = entry.getKey();
					count.legalType = labelFor(legalTypes, entry.getKey(), "Legal Type");
					count.count = entry.getValue().intValue();
					return count;
				})
				.toList();
		return dashboard;
	}

	public List<LegalCard> searchLegalCards(LegalCardSearch search) {
		return searchLegalCards(search, null);
	}

	public List<LegalCard> searchLegalCards(LegalCardSearch search, Long clientId) {
		if (search == null) {
			search = new LegalCardSearch();
		}
		return enrich(mapper.searchLegalCards(search), clientId);
	}

	public LegalCard getLegalCard(Long id) {
		return getLegalCard(id, null);
	}

	public LegalCard getLegalCard(Long id, Long companyId) {
		return getLegalCard(id, companyId, null);
	}

	public LegalCard getLegalCard(Long id, Long companyId, Long clientId) {
		LegalCard card = mapper.getLegalCard(id);
		if (card == null) {
			throw new IllegalArgumentException("Legal Card not found");
		}
		requireSameCompany(card, companyId);
		return enrich(card, clientId);
	}

	@Transactional(rollbackFor = Exception.class)
	public LegalCard createLegalCard(LegalCard request) {
		return createLegalCard(request, null);
	}

	@Transactional(rollbackFor = Exception.class)
	public LegalCard createLegalCard(LegalCard request, Long clientId) {
		if (request != null) {
			LegalLookups lookups = lookups(request.companyId, clientId);
			request.currentStageId = defaultId(request.currentStageId, lookupId(lookups.stages, "INITIATED"));
			request.documentStatusId = defaultId(request.documentStatusId, lookupId(lookups.cardFlows, "INITIATED"));
			request.approvalStatusId = defaultId(request.approvalStatusId, lookupId(lookups.approvalStatuses, "APPROVED"));
		}
		validate(request, true);
		LegalCard card = request;
		card.legalCardNo = card.legalCardNo == null || card.legalCardNo.isBlank() ? nextLegalCardNo() : card.legalCardNo;
		card.priority = defaultString(card.priority, "M");
		card.comments = requiredComments(card.comments);
		if (mapper.countByLegalCardNo(card.legalCardNo, null) > 0) {
			throw new IllegalArgumentException("Legal Card No must be unique");
		}
		mapper.insertLegalCard(card);
		saveAttachments(card);
		insertTimeline(card.id, card.companyId, clientId, card.documentStatusId, "Created", card.comments, card.createdBy);
		return getLegalCard(card.id, card.companyId, clientId);
	}

	@Transactional(rollbackFor = Exception.class)
	public LegalCard updateLegalCard(Long id, LegalCard request) {
		return updateLegalCard(id, request == null ? null : request.companyId, request);
	}

	@Transactional(rollbackFor = Exception.class)
	public LegalCard updateLegalCard(Long id, Long companyId, LegalCard request) {
		return updateLegalCard(id, companyId, request, null);
	}

	@Transactional(rollbackFor = Exception.class)
	public LegalCard updateLegalCard(Long id, Long companyId, LegalCard request, Long clientId) {
		LegalCard existing = mapper.getLegalCard(id);
		if (existing == null) {
			throw new IllegalArgumentException("Legal Card not found");
		}
		requireSameCompany(existing, companyId);
		requireId(request == null ? null : request.currentStageId, "Current Stage is required");
		LegalCard card = request;
		card.id = id;
		card.legalCardNo = existing.legalCardNo;
		card.companyId = existing.companyId;
		card.documentStatusId = existing.documentStatusId;
		card.approvalStatusId = existing.approvalStatusId;
		card.comments = requiredComments(card.comments);
		mapper.updateLegalCardEditableFields(card);
		insertTimeline(id, existing.companyId, clientId, card.documentStatusId, "Updated", card.comments, card.updatedBy);
		return getLegalCard(id, existing.companyId, clientId);
	}

	@Transactional(rollbackFor = Exception.class)
	public LegalCard workflow(Long id, LegalWorkflowRequest request) {
		return workflow(id, null, request);
	}

	@Transactional(rollbackFor = Exception.class)
	public LegalCard workflow(Long id, Long companyId, LegalWorkflowRequest request) {
		return workflow(id, companyId, request, null);
	}

	@Transactional(rollbackFor = Exception.class)
	public LegalCard workflow(Long id, Long companyId, LegalWorkflowRequest request, Long clientId) {
		LegalCard card = mapper.getLegalCard(id);
		if (card == null) {
			throw new IllegalArgumentException("Legal Card not found");
		}
		requireSameCompany(card, companyId);
		if (!isApprovalStatus(card.approvalStatusId, card.companyId, clientId, "APPROVED")) {
			throw new IllegalArgumentException("Approval status is not approved");
		}
		if (request == null || request.statusId == null) {
			throw new IllegalArgumentException("Workflow action is required");
		}
		if (!isValidWorkflowAction(card, request.statusId, clientId)) {
			throw new IllegalArgumentException("Workflow is not allowed for this status");
		}
		String comments = requiredComments(request.comments);
		mapper.updateLegalCardStatus(id, request.statusId, request.updatedBy);
		insertTimeline(id, card.companyId, clientId, request.statusId, "Status Changed", comments, request.updatedBy);
		return getLegalCard(id, card.companyId, clientId);
	}

	@Transactional(rollbackFor = Exception.class)
	public LegalCard cancel(Long id, Long companyId, LegalWorkflowRequest request, Long clientId) {
		LegalCard card = mapper.getLegalCard(id);
		if (card == null) {
			throw new IllegalArgumentException("Legal Card not found");
		}
		requireSameCompany(card, companyId);
		LegalLookups lookups = lookups(card.companyId, clientId);
		if (!isStatus(card.documentStatusId, card.companyId, clientId, "INITIATED")) {
			throw new IllegalArgumentException("Cancel is available only when Document Status is Initiated");
		}
		Long cancelledDocumentStatusId = lookupId(lookups.cardFlows, "CANCELLED");
		if (cancelledDocumentStatusId == null) {
			throw new IllegalArgumentException("Cancelled document status is not configured in pa_legal_card_flow");
		}
		Long cancelledApprovalStatusId = lookupId(lookups.approvalStatuses, "CANCELLED");
		if (cancelledApprovalStatusId == null) {
			throw new IllegalArgumentException("Cancelled approval status is not configured in cf_decision");
		}
		String comments = requiredComments(request == null ? null : request.comments);
		Long updatedBy = request == null ? null : request.updatedBy;
		mapper.updateLegalCardCancelStatus(id, cancelledDocumentStatusId, cancelledApprovalStatusId, updatedBy);
		insertTimeline(id, card.companyId, clientId, cancelledDocumentStatusId, "Status Changed", comments, updatedBy);
		return getLegalCard(id, card.companyId, clientId);
	}

	private void saveAttachments(LegalCard card) {
		if (card.attachments == null) {
			return;
		}
		for (LegalCardAttachment attachment : card.attachments) {
			requireId(attachment.documentTypeId, "Attachment Document Type is required");
			requireText(attachment.fileName, "Attachment file name is required");
			attachment.documentName = emptyToNull(attachment.documentName);
			attachment.companyId = card.companyId;
			attachment.legalCardId = card.id;
			attachment.createdBy = card.createdBy == null ? card.updatedBy : card.createdBy;
			mapper.insertAttachment(attachment);
		}
	}

	private void insertTimeline(Long legalCardId, Long companyId, Long clientId, Long statusId, String action, String remarks, Long userId) {
		LegalCardTimeline timeline = new LegalCardTimeline();
		timeline.companyId = companyId;
		timeline.legalCardId = legalCardId;
		timeline.statusId = statusId;
		timeline.step = statusLabel(companyId, clientId, statusId);
		timeline.action = action;
		timeline.remarks = remarks;
		timeline.createdBy = userId;
		mapper.insertTimeline(timeline);
	}

	private boolean isValidWorkflowAction(LegalCard card, Long nextStatusId, Long clientId) {
		if (nextStatusId == null) {
			return false;
		}
		LegalLookups lookups = lookups(card.companyId, clientId);
		String legalType = lookupLabel(lookups.legalTypes, card.legalTypeId);
		String currentStatus = firstText(lookupLabel(lookups.documentStatuses, card.documentStatusId), lookupLabel(lookups.cardFlows, card.documentStatusId), lookupLabel(lookups.stages, card.documentStatusId));
		String nextStatus = firstText(lookupLabel(lookups.documentStatuses, nextStatusId), lookupLabel(lookups.cardFlows, nextStatusId), lookupLabel(lookups.stages, nextStatusId));
		return transitionAllowed(LEGAL_WORKFLOW_BY_LABEL.getOrDefault(workflowLabelKey(legalType, currentStatus), List.of()), nextStatus)
				|| transitionAllowed(LEGAL_WORKFLOW_BY_STATUS.getOrDefault(normalizeWorkflowText(currentStatus), List.of()), nextStatus);
	}

	private boolean transitionAllowed(List<String> allowedStatuses, String nextStatus) {
		String normalizedNextStatus = normalizeWorkflowText(nextStatus);
		return allowedStatuses.stream().anyMatch(status -> normalizeWorkflowText(status).equals(normalizedNextStatus));
	}

	private List<LegalLookup> tenantLookups(Long companyId) {
		return leasingService.searchCustomers(companyId, null).stream()
				.filter(customer -> customer.id != null)
				.map(customer -> new LegalLookup(customer.id, customer.externalId, firstText(customer.name, customer.legalName, "Customer #" + customer.id)))
				.sorted(Comparator.comparing(lookup -> safeText(lookup.label), String.CASE_INSENSITIVE_ORDER))
				.toList();
	}

	private List<LegalLookup> propertyLookups(Long companyId) {
		if (companyId == null || companyId <= 0) {
			return List.of();
		}
		PropertySearch search = new PropertySearch();
		search.companyId = companyId;
		search.page = 1;
		search.pageSize = 1000;
		return propertyService.list(search).stream()
				.filter(property -> property.id != null)
				.map(property -> new LegalLookup(property.id, property.code, firstText(property.name, property.code, "Property #" + property.id)))
				.sorted(Comparator.comparing(lookup -> safeText(lookup.label), String.CASE_INSENSITIVE_ORDER))
				.toList();
	}

	private List<LegalLookup> unitLookups(Long companyId) {
		return propertyService.companyUnits(companyId).stream()
				.filter(unit -> unit.id != null)
				.map(unit -> new LegalLookup(unit.id, unit.code, firstText(unit.name, unit.code, "Unit #" + unit.id), unit.propertyId))
				.sorted(Comparator.comparing(lookup -> safeText(lookup.label), String.CASE_INSENSITIVE_ORDER))
				.toList();
	}

	private List<LegalLookup> erpLookup(String codeType, Long clientId, Long companyId) {
		try {
			return erpCodeValueService.listCodeValues(codeType, clientId, companyId).stream()
					.filter(value -> value.id != null)
					.sorted(Comparator
							.comparing((ErpCodeValue value) -> value.sort == null ? Integer.MAX_VALUE : value.sort)
							.thenComparing(value -> safeText(value.value), String.CASE_INSENSITIVE_ORDER))
					.map(value -> new LegalLookup(value.id, value.externalId, firstText(value.value, value.externalId, "Code Value #" + value.id)))
					.toList();
		}
		catch (IllegalArgumentException | IllegalStateException ex) {
			return List.of();
		}
	}

	private LegalLookups emptyLookups() {
		LegalLookups lookups = new LegalLookups();
		lookups.legalTypes = List.of();
		lookups.stages = List.of();
		lookups.reasons = List.of();
		lookups.tenants = List.of();
		lookups.properties = List.of();
		lookups.units = List.of();
		lookups.documentStatuses = List.of();
		lookups.cardFlows = List.of();
		lookups.approvalStatuses = List.of();
		lookups.documentTypes = List.of();
		return lookups;
	}

	private List<LegalLookup> filterApprovalStatuses(List<LegalLookup> approvalStatuses) {
		return (approvalStatuses == null ? List.<LegalLookup>of() : approvalStatuses).stream()
				.filter(status -> ALLOWED_APPROVAL_STATUSES.containsKey(normalizedStatus(status.label)) || ALLOWED_APPROVAL_STATUSES.containsKey(normalizedStatus(status.code)))
				.peek(status -> {
					String label = ALLOWED_APPROVAL_STATUSES.get(normalizedStatus(status.label));
					status.label = label == null ? ALLOWED_APPROVAL_STATUSES.get(normalizedStatus(status.code)) : label;
				})
				.toList();
	}

	private String normalizedStatus(String value) {
		return value == null ? "" : value.trim().toUpperCase().replaceAll("[^A-Z0-9]+", "_").replaceAll("^_+|_+$", "");
	}

	private static String workflowLabelKey(String legalType, String status) {
		return normalizeWorkflowText(legalType) + ":" + normalizeWorkflowText(status);
	}

	private static String normalizeWorkflowText(String value) {
		return value == null ? "" : value.trim().toUpperCase().replaceAll("[^A-Z0-9]+", "_").replaceAll("^_+|_+$", "");
	}

	private List<LegalCard> enrich(List<LegalCard> cards) {
		return enrich(cards, null);
	}

	private List<LegalCard> enrich(List<LegalCard> cards, Long clientId) {
		if (cards.isEmpty()) {
			return cards;
		}
		Long companyId = cards.stream().map(card -> card.companyId).filter(id -> id != null && id > 0).findFirst().orElse(null);
		LegalLookups lookups = lookups(companyId, clientId);
		Map<Long, String> tenants = lookupMap(lookups.tenants);
		Map<Long, String> properties = lookupMap(lookups.properties);
		Map<Long, String> units = lookupMap(lookups.units);
		Map<Long, String> legalTypes = lookupMap(lookups.legalTypes);
		Map<Long, String> stages = lookupMap(lookups.stages);
		Map<Long, String> reasons = lookupMap(lookups.reasons);
		Map<Long, String> documentStatuses = lookupMap(lookups.documentStatuses);
		Map<Long, String> cardFlows = lookupMap(lookups.cardFlows);
		Map<Long, String> approvalStatuses = lookupMap(lookups.approvalStatuses);
		Map<Long, String> documentTypes = lookupMap(lookups.documentTypes);
		return cards.stream().map(card -> enrich(card, tenants, properties, units, legalTypes, stages, reasons, documentStatuses, cardFlows, approvalStatuses, documentTypes)).toList();
	}

	private LegalCard enrich(LegalCard card) {
		return enrich(card, null);
	}

	private LegalCard enrich(LegalCard card, Long clientId) {
		LegalLookups lookups = lookups(card.companyId, clientId);
		return enrich(card, lookupMap(lookups.tenants), lookupMap(lookups.properties), lookupMap(lookups.units),
				lookupMap(lookups.legalTypes), lookupMap(lookups.stages), lookupMap(lookups.reasons),
				lookupMap(lookups.documentStatuses), lookupMap(lookups.cardFlows), lookupMap(lookups.approvalStatuses), lookupMap(lookups.documentTypes));
	}

	private LegalCard enrich(LegalCard card, Map<Long, String> tenants, Map<Long, String> properties, Map<Long, String> units,
			Map<Long, String> legalTypes, Map<Long, String> stages, Map<Long, String> reasons,
			Map<Long, String> documentStatuses, Map<Long, String> cardFlows, Map<Long, String> approvalStatuses, Map<Long, String> documentTypes) {
		card.legalType = labelFor(legalTypes, card.legalTypeId, "Legal Type");
		card.currentStage = firstText(stages.get(card.currentStageId), "");
		card.reason = labelFor(reasons, card.reasonId, "Reason");
		card.tenant = labelFor(tenants, card.tenantId, "Tenant");
		card.property = labelFor(properties, card.propertyId, "Property");
		card.unit = labelFor(units, card.unitId, "Unit");
		card.advocate = card.advocateId == null ? "" : "Advocate #" + card.advocateId;
		card.priorityLabel = switch (card.priority == null ? "M" : card.priority) {
			case "H" -> "High";
			case "L" -> "Low";
			default -> "Medium";
		};
		card.documentStatus = firstText(documentStatuses.get(card.documentStatusId), cardFlows.get(card.documentStatusId), labelForId(card.documentStatusId, "Status"));
		card.approvalStatus = firstText(approvalStatuses.get(card.approvalStatusId), labelForId(card.approvalStatusId, "Approval Status"));
		card.attachments = mapper.listAttachments(card.id, card.companyId);
		card.attachments.forEach(attachment -> attachment.documentType = labelFor(documentTypes, attachment.documentTypeId, "Document Type"));
		card.timeline = mapper.listTimeline(card.id, card.companyId);
		card.timeline.forEach(entry -> {
			entry.status = firstText(documentStatuses.get(entry.statusId), cardFlows.get(entry.statusId), labelForId(entry.statusId, "Status"));
			entry.actor = entry.createdBy == null ? "" : "User #" + entry.createdBy;
			entry.timestamp = entry.createdOn == null ? "" : entry.createdOn.toString();
		});
		return card;
	}

	private Map<Long, String> lookupMap(List<LegalLookup> lookups) {
		return (lookups == null ? List.<LegalLookup>of() : lookups).stream()
				.filter(lookup -> lookup.id != null)
				.collect(Collectors.toMap(lookup -> lookup.id, lookup -> defaultString(lookup.label, "#" + lookup.id), (left, right) -> left));
	}

	private String lookupLabel(List<LegalLookup> lookups, Long id) {
		if (id == null) {
			return "";
		}
		return (lookups == null ? List.<LegalLookup>of() : lookups).stream()
				.filter(lookup -> id.equals(lookup.id))
				.map(lookup -> firstText(lookup.label, lookup.code))
				.findFirst()
				.orElse("");
	}

	private Long lookupId(List<LegalLookup> lookups, String status) {
		return (lookups == null ? List.<LegalLookup>of() : lookups).stream()
				.filter(lookup -> statusMatches(lookup, status))
				.map(lookup -> lookup.id)
				.findFirst()
				.orElse(null);
	}

	private String labelFor(Map<Long, String> values, Long id, String prefix) {
		if (id == null) {
			return "";
		}
		return values.getOrDefault(id, prefix + " #" + id);
	}

	private String labelForId(Long id, String prefix) {
		return id == null ? "" : prefix + " #" + id;
	}

	private String statusLabel(Long companyId, Long clientId, Long statusId) {
		LegalLookups lookups = lookups(companyId, clientId);
		return firstText(lookupLabel(lookups.cardFlows, statusId), lookupLabel(lookups.documentStatuses, statusId), lookupLabel(lookups.stages, statusId), labelForId(statusId, "Status"));
	}

	private List<Long> completedStatusIds(Long companyId, Long clientId) {
		LegalLookups lookups = lookups(companyId, clientId);
		return List.of(lookups.documentStatuses, lookups.cardFlows).stream()
				.flatMap(List::stream)
				.filter(status -> statusMatches(status, "COMPLETED"))
				.map(status -> status.id)
				.toList();
	}

	private boolean isStatus(Long id, Long companyId, Long clientId, String expectedStatus) {
		LegalLookups lookups = lookups(companyId, clientId);
		return lookups.documentStatuses.stream()
				.anyMatch(status -> id != null && id.equals(status.id) && statusMatches(status, expectedStatus))
				|| lookups.cardFlows.stream()
				.anyMatch(status -> id != null && id.equals(status.id) && statusMatches(status, expectedStatus))
				|| lookups.stages.stream()
				.anyMatch(status -> id != null && id.equals(status.id) && statusMatches(status, expectedStatus));
	}

	private boolean isApprovalStatus(Long id, Long companyId, Long clientId, String expectedStatus) {
		return lookups(companyId, clientId).approvalStatuses.stream()
				.anyMatch(status -> id != null && id.equals(status.id) && statusMatches(status, expectedStatus));
	}

	private boolean statusMatches(LegalLookup status, String expectedStatus) {
		return expectedStatus.equals(normalizedStatus(status.label)) || expectedStatus.equals(normalizedStatus(status.code));
	}

	private void validate(LegalCard card, boolean create) {
		if (card == null) {
			throw new IllegalArgumentException("Legal Card is required");
		}
		requireId(card.companyId, "Company is required");
		requireId(card.legalTypeId, "Legal Type is required");
		requireId(card.currentStageId, "Current Stage is required");
		requireId(card.reasonId, "Reason is required");
		requireId(card.tenantId, "Tenant is required");
		requireId(card.propertyId, "Property is required");
		requireId(card.unitId, "Unit is required");
		requireText(card.documentDate, "Document Date is required");
		requireText(card.dueDate, "Due Date is required");
		if (card.dueAmount == null || card.dueAmount.compareTo(BigDecimal.ZERO) < 0) {
			throw new IllegalArgumentException("Due Amount must be numeric and greater than or equal to 0");
		}
		if (LocalDate.parse(card.dueDate).isBefore(LocalDate.parse(card.documentDate))) {
			throw new IllegalArgumentException("Due Date must be greater than or equal to Document Date");
		}
		if (!List.of("H", "M", "L").contains(defaultString(card.priority, "M"))) {
			throw new IllegalArgumentException("Priority is invalid");
		}
		if (create) {
			requireId(card.documentStatusId, "Document Status is required");
			requireId(card.approvalStatusId, "Approval Status is required");
		}
		requireId(card.documentStatusId, "Document Status is required");
		requireId(card.approvalStatusId, "Approval Status is required");
	}

	private String requiredComments(String comments) {
		requireText(comments, "Comments are mandatory");
		return comments.trim();
	}

	private void requireId(Long value, String message) {
		if (value == null || value <= 0) {
			throw new IllegalArgumentException(message);
		}
	}

	private void requireSameCompany(LegalCard card, Long companyId) {
		if (companyId == null) {
			return;
		}
		if (card.companyId == null || !companyId.equals(card.companyId)) {
			throw new IllegalArgumentException("Legal Card not found for selected company");
		}
	}

	private void requireText(String value, String message) {
		if (value == null || value.trim().isEmpty()) {
			throw new IllegalArgumentException(message);
		}
	}

	private String firstText(String... values) {
		for (String value : values) {
			if (value != null && !value.trim().isEmpty()) {
				return value.trim();
			}
		}
		return "";
	}

	private String safeText(String value) {
		return value == null ? "" : value;
	}

	private String defaultString(String value, String defaultValue) {
		return value == null || value.isBlank() ? defaultValue : value;
	}

	private String emptyToNull(String value) {
		return value == null || value.isBlank() ? null : value.trim();
	}

	private Long defaultId(Long value, Long defaultValue) {
		return value == null || value <= 0 ? defaultValue : value;
	}

	private Long firstId(Long... values) {
		for (Long value : values) {
			if (value != null && value > 0) {
				return value;
			}
		}
		return null;
	}

	private String nextLegalCardNo() {
		for (int attempt = 0; attempt < 20; attempt++) {
			String legalCardNo = "LC-" + ThreadLocalRandom.current().nextLong(1_000_000_000L, 10_000_000_000L);
			if (mapper.countByLegalCardNo(legalCardNo, null) == 0) {
				return legalCardNo;
			}
		}
		throw new IllegalStateException("Unable to generate Legal Card No");
	}
}
