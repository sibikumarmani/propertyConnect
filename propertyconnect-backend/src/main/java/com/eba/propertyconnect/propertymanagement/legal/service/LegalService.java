package com.eba.propertyconnect.propertymanagement.legal.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.mybatis.cdi.Transactional;

import com.eba.propertyconnect.propertymanagement.legal.domain.LegalCard;
import com.eba.propertyconnect.propertymanagement.legal.domain.LegalCardAttachment;
import com.eba.propertyconnect.propertymanagement.legal.domain.LegalCardSearch;
import com.eba.propertyconnect.propertymanagement.legal.domain.LegalCardTimeline;
import com.eba.propertyconnect.propertymanagement.legal.domain.LegalDashboard;
import com.eba.propertyconnect.propertymanagement.legal.domain.LegalDashboard.LegalTypeCount;
import com.eba.propertyconnect.propertymanagement.legal.domain.LegalLookups;
import com.eba.propertyconnect.propertymanagement.legal.domain.LegalWorkflowRequest;
import com.eba.propertyconnect.propertymanagement.legal.mapper.LegalCardMapper;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class LegalService {

	@Inject
	private LegalCardMapper mapper;

	public LegalLookups lookups() {
		return LegalReferenceData.lookups();
	}

	public LegalDashboard dashboard(Long companyId) {
		LegalCardSearch search = new LegalCardSearch();
		search.companyId = companyId;
		List<LegalCard> cards = enrich(mapper.searchLegalCards(search));
		LegalDashboard dashboard = new LegalDashboard();
		dashboard.cards = cards;
		dashboard.totalCount = cards.size();
		dashboard.completedCount = (int) cards.stream().filter(card -> LegalReferenceData.STATUS_COMPLETED.equals(card.documentStatusId)).count();
		dashboard.inProgressCount = dashboard.totalCount - dashboard.completedCount;
		Map<Long, Long> typeCounts = cards.stream().collect(Collectors.groupingBy(card -> card.legalTypeId, Collectors.counting()));
		dashboard.legalTypeCounts = typeCounts.entrySet().stream()
				.map(entry -> {
					LegalTypeCount count = new LegalTypeCount();
					count.legalTypeId = entry.getKey();
					count.legalType = LegalReferenceData.legalType(entry.getKey());
					count.count = entry.getValue().intValue();
					return count;
				})
				.toList();
		return dashboard;
	}

	public List<LegalCard> searchLegalCards(LegalCardSearch search) {
		if (search == null) {
			search = new LegalCardSearch();
		}
		return enrich(mapper.searchLegalCards(search));
	}

	public LegalCard getLegalCard(Long id) {
		LegalCard card = mapper.getLegalCard(id);
		if (card == null) {
			throw new IllegalArgumentException("Legal Card not found");
		}
		return enrich(card);
	}

	@Transactional(rollbackFor = Exception.class)
	public LegalCard createLegalCard(LegalCard request) {
		validate(request, true);
		LegalCard card = request;
		card.legalCardNo = defaultString(card.legalCardNo, nextLegalCardNo());
		card.currentStageId = defaultId(card.currentStageId, LegalReferenceData.STATUS_INITIATED);
		card.documentStatusId = defaultId(card.documentStatusId, LegalReferenceData.STATUS_INITIATED);
		card.approvalStatusId = defaultId(card.approvalStatusId, LegalReferenceData.APPROVAL_APPROVED);
		card.priority = defaultString(card.priority, "M");
		card.comments = requiredComments(card.comments);
		if (mapper.countByLegalCardNo(card.legalCardNo, null) > 0) {
			throw new IllegalArgumentException("Legal Card No must be unique");
		}
		mapper.insertLegalCard(card);
		saveAttachments(card);
		insertTimeline(card.id, card.documentStatusId, "Created", card.comments, card.createdBy);
		return getLegalCard(card.id);
	}

	@Transactional(rollbackFor = Exception.class)
	public LegalCard updateLegalCard(Long id, LegalCard request) {
		LegalCard existing = mapper.getLegalCard(id);
		if (existing == null) {
			throw new IllegalArgumentException("Legal Card not found");
		}
		if (!LegalReferenceData.STATUS_INITIATED.equals(existing.documentStatusId)) {
			throw new IllegalArgumentException("Edit is available only when Document Status is Initiated");
		}
		validate(request, false);
		LegalCard card = request;
		card.id = id;
		card.legalCardNo = existing.legalCardNo;
		card.comments = requiredComments(card.comments);
		if (mapper.countByLegalCardNo(card.legalCardNo, id) > 0) {
			throw new IllegalArgumentException("Legal Card No must be unique");
		}
		mapper.updateLegalCard(card);
		mapper.deleteAttachments(id);
		saveAttachments(card);
		insertTimeline(id, card.documentStatusId, "Updated", card.comments, card.updatedBy);
		return getLegalCard(id);
	}

	@Transactional(rollbackFor = Exception.class)
	public LegalCard workflow(Long id, LegalWorkflowRequest request) {
		LegalCard card = mapper.getLegalCard(id);
		if (card == null) {
			throw new IllegalArgumentException("Legal Card not found");
		}
		if (!LegalReferenceData.APPROVAL_APPROVED.equals(card.approvalStatusId)) {
			throw new IllegalArgumentException("Approval status is not approved");
		}
		if (request == null || request.statusId == null) {
			throw new IllegalArgumentException("Workflow action is required");
		}
		if (!LegalReferenceData.isValidWorkflow(card.legalTypeId, card.documentStatusId, request.statusId)) {
			throw new IllegalArgumentException("Workflow is not allowed for this status");
		}
		String comments = requiredComments(request.comments);
		mapper.updateLegalCardStatus(id, request.statusId, request.updatedBy);
		insertTimeline(id, request.statusId, "Workflow", comments, request.updatedBy);
		return getLegalCard(id);
	}

	private void saveAttachments(LegalCard card) {
		if (card.attachments == null) {
			return;
		}
		for (LegalCardAttachment attachment : card.attachments) {
			requireId(attachment.documentTypeId, "Attachment Document Type is required");
			requireText(attachment.fileName, "Attachment file name is required");
			attachment.legalCardId = card.id;
			attachment.createdBy = card.createdBy == null ? card.updatedBy : card.createdBy;
			mapper.insertAttachment(attachment);
		}
	}

	private void insertTimeline(Long legalCardId, Long statusId, String action, String remarks, Long userId) {
		LegalCardTimeline timeline = new LegalCardTimeline();
		timeline.legalCardId = legalCardId;
		timeline.statusId = statusId;
		timeline.step = LegalReferenceData.status(statusId);
		timeline.action = action;
		timeline.remarks = remarks;
		timeline.createdBy = userId;
		mapper.insertTimeline(timeline);
	}

	private List<LegalCard> enrich(List<LegalCard> cards) {
		return cards.stream().map(this::enrich).toList();
	}

	private LegalCard enrich(LegalCard card) {
		card.legalType = LegalReferenceData.legalType(card.legalTypeId);
		card.currentStage = LegalReferenceData.status(card.currentStageId);
		card.reason = LegalReferenceData.reason(card.reasonId);
		card.tenant = card.tenantId == null ? "" : "Tenant #" + card.tenantId;
		card.property = card.propertyId == null ? "" : "Property #" + card.propertyId;
		card.unit = card.unitId == null ? "" : "Unit #" + card.unitId;
		card.advocate = card.advocateId == null ? "" : "Advocate #" + card.advocateId;
		card.priorityLabel = switch (card.priority == null ? "M" : card.priority) {
			case "H" -> "High";
			case "L" -> "Low";
			default -> "Medium";
		};
		card.documentStatus = LegalReferenceData.status(card.documentStatusId);
		card.approvalStatus = LegalReferenceData.approvalStatus(card.approvalStatusId);
		card.attachments = mapper.listAttachments(card.id);
		card.attachments.forEach(attachment -> attachment.documentType = LegalReferenceData.documentType(attachment.documentTypeId));
		card.timeline = mapper.listTimeline(card.id);
		card.timeline.forEach(entry -> {
			entry.status = LegalReferenceData.status(entry.statusId);
			entry.actor = entry.createdBy == null ? "" : "User #" + entry.createdBy;
			entry.timestamp = entry.createdOn == null ? "" : entry.createdOn.toString();
		});
		return card;
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
			card.documentStatusId = defaultId(card.documentStatusId, LegalReferenceData.STATUS_INITIATED);
			card.approvalStatusId = defaultId(card.approvalStatusId, LegalReferenceData.APPROVAL_APPROVED);
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

	private void requireText(String value, String message) {
		if (value == null || value.trim().isEmpty()) {
			throw new IllegalArgumentException(message);
		}
	}

	private Long defaultId(Long value, Long defaultValue) {
		return value == null ? defaultValue : value;
	}

	private String defaultString(String value, String defaultValue) {
		return value == null || value.isBlank() ? defaultValue : value;
	}

	private String nextLegalCardNo() {
		return "LC-" + System.currentTimeMillis();
	}
}
