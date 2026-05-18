package com.eba.propertyconnect.propertymanagement.legal.service;

import java.util.List;
import java.util.Map;

import com.eba.propertyconnect.propertymanagement.legal.domain.LegalLookup;
import com.eba.propertyconnect.propertymanagement.legal.domain.LegalLookups;

final class LegalReferenceData {

	static final Long LEGAL_TYPE_FINANCIAL_CLAIM = 1L;
	static final Long LEGAL_TYPE_POLICE_CASE = 2L;
	static final Long STATUS_INITIATED = 1L;
	static final Long STATUS_COMPLETED = 14L;
	static final Long APPROVAL_APPROVED = 1L;
	static final Long DOCUMENT_TYPE_OTHER = 1L;

	private static final Map<Long, String> LEGAL_TYPES = Map.of(
			LEGAL_TYPE_FINANCIAL_CLAIM, "Financial Claim",
			LEGAL_TYPE_POLICE_CASE, "Police Case");
	private static final Map<Long, String> REASONS = Map.of(
			1L, "Outstanding dues",
			2L, "Contract breach",
			3L, "Unit access dispute",
			4L, "Other");
	private static final Map<Long, String> STATUSES = Map.ofEntries(
			Map.entry(STATUS_INITIATED, "Initiated"),
			Map.entry(2L, "Sent to Collection Team"),
			Map.entry(3L, "AAM Approval"),
			Map.entry(4L, "HOA Approval"),
			Map.entry(5L, "Sent To RDC Team"),
			Map.entry(6L, "Prepare Legal Notice"),
			Map.entry(7L, "Notice Sent Via Aramax"),
			Map.entry(8L, "Acknowledgment of Notice Received"),
			Map.entry(9L, "Sent to Asset Team for Confirmation"),
			Map.entry(10L, "Send to HOA for Approval"),
			Map.entry(11L, "Approved to Hold the Police Case"),
			Map.entry(12L, "Send to Collection Manager for Police Case"),
			Map.entry(13L, "Police Case Filed"),
			Map.entry(STATUS_COMPLETED, "Completed"));
	private static final Map<Long, String> APPROVAL_STATUSES = Map.of(
			APPROVAL_APPROVED, "Approved",
			2L, "Pending");
	private static final Map<Long, String> DOCUMENT_TYPES = Map.of(
			DOCUMENT_TYPE_OTHER, "Other Documents",
			2L, "Legal Notice",
			3L, "Tenant Correspondence",
			4L, "Court Document",
			5L, "Payment Proof");
	private static final Map<String, List<Long>> WORKFLOW = Map.ofEntries(
			Map.entry(key(LEGAL_TYPE_FINANCIAL_CLAIM, STATUS_INITIATED), List.of(2L)),
			Map.entry(key(LEGAL_TYPE_FINANCIAL_CLAIM, 2L), List.of(3L)),
			Map.entry(key(LEGAL_TYPE_FINANCIAL_CLAIM, 3L), List.of(4L)),
			Map.entry(key(LEGAL_TYPE_FINANCIAL_CLAIM, 4L), List.of(5L)),
			Map.entry(key(LEGAL_TYPE_FINANCIAL_CLAIM, 5L), List.of(6L)),
			Map.entry(key(LEGAL_TYPE_FINANCIAL_CLAIM, 6L), List.of(7L)),
			Map.entry(key(LEGAL_TYPE_FINANCIAL_CLAIM, 7L), List.of(8L)),
			Map.entry(key(LEGAL_TYPE_POLICE_CASE, STATUS_INITIATED), List.of(9L)),
			Map.entry(key(LEGAL_TYPE_POLICE_CASE, 9L), List.of(10L)),
			Map.entry(key(LEGAL_TYPE_POLICE_CASE, 10L), List.of(11L, 12L)),
			Map.entry(key(LEGAL_TYPE_POLICE_CASE, 11L), List.of(13L)),
			Map.entry(key(LEGAL_TYPE_POLICE_CASE, 12L), List.of(13L)));

	private LegalReferenceData() {
	}

	static LegalLookups lookups() {
		LegalLookups lookups = new LegalLookups();
		lookups.legalTypes = lookupList(LEGAL_TYPES);
		lookups.stages = lookupList(STATUSES);
		lookups.reasons = lookupList(REASONS);
		lookups.documentStatuses = lookupList(STATUSES);
		lookups.approvalStatuses = lookupList(APPROVAL_STATUSES);
		lookups.documentTypes = lookupList(DOCUMENT_TYPES);
		return lookups;
	}

	static String legalType(Long id) {
		return label(LEGAL_TYPES, id, "Legal Type");
	}

	static String status(Long id) {
		return label(STATUSES, id, "Status");
	}

	static String reason(Long id) {
		return label(REASONS, id, "Reason");
	}

	static String approvalStatus(Long id) {
		return label(APPROVAL_STATUSES, id, "Approval Status");
	}

	static String documentType(Long id) {
		return label(DOCUMENT_TYPES, id, "Document Type");
	}

	static boolean isValidWorkflow(Long legalTypeId, Long currentStatusId, Long nextStatusId) {
		return WORKFLOW.getOrDefault(key(legalTypeId, currentStatusId), List.of()).contains(nextStatusId);
	}

	static List<Long> workflowActions(Long legalTypeId, Long currentStatusId) {
		return WORKFLOW.getOrDefault(key(legalTypeId, currentStatusId), List.of());
	}

	private static List<LegalLookup> lookupList(Map<Long, String> values) {
		return values.entrySet().stream()
				.sorted(Map.Entry.comparingByKey())
				.map(entry -> new LegalLookup(entry.getKey(), String.valueOf(entry.getKey()), entry.getValue()))
				.toList();
	}

	private static String label(Map<Long, String> values, Long id, String fallback) {
		if (id == null) {
			return "";
		}
		return values.getOrDefault(id, fallback + " #" + id);
	}

	private static String key(Long legalTypeId, Long statusId) {
		return legalTypeId + ":" + statusId;
	}
}
