package com.eba.propertyconnect.propertymanagement.leasing.service;

import java.math.BigDecimal;
import java.util.Date;
import java.util.List;
import java.util.function.Supplier;

import org.mybatis.cdi.Transactional;

import com.eba.propertyconnect.propertymanagement.leasing.domain.ApprovalRequest;
import com.eba.propertyconnect.propertymanagement.leasing.domain.Lead;
import com.eba.propertyconnect.propertymanagement.leasing.domain.Negotiation;
import com.eba.propertyconnect.propertymanagement.leasing.domain.Offer;
import com.eba.propertyconnect.propertymanagement.leasing.domain.PaymentReceipt;
import com.eba.propertyconnect.propertymanagement.leasing.domain.Prospect;
import com.eba.propertyconnect.propertymanagement.leasing.domain.QualificationRequest;
import com.eba.propertyconnect.propertymanagement.leasing.domain.ReportSummary;
import com.eba.propertyconnect.propertymanagement.leasing.domain.Requirement;
import com.eba.propertyconnect.propertymanagement.leasing.domain.Reservation;
import com.eba.propertyconnect.propertymanagement.leasing.domain.SiteVisit;
import com.eba.propertyconnect.propertymanagement.leasing.domain.Unit;
import com.eba.propertyconnect.propertymanagement.leasing.domain.UnitSearch;
import com.eba.propertyconnect.propertymanagement.leasing.mapper.LeadMapper;
import com.eba.propertyconnect.propertymanagement.leasing.mapper.NegotiationMapper;
import com.eba.propertyconnect.propertymanagement.leasing.mapper.OfferMapper;
import com.eba.propertyconnect.propertymanagement.leasing.mapper.PaymentReceiptMapper;
import com.eba.propertyconnect.propertymanagement.leasing.mapper.ProspectMapper;
import com.eba.propertyconnect.propertymanagement.leasing.mapper.RequirementMapper;
import com.eba.propertyconnect.propertymanagement.leasing.mapper.ReservationMapper;
import com.eba.propertyconnect.propertymanagement.leasing.mapper.SiteVisitMapper;
import com.eba.propertyconnect.propertymanagement.leasing.mapper.StatusHistoryMapper;
import com.eba.propertyconnect.propertymanagement.leasing.mapper.UnitMapper;
import com.eba.propertyconnect.propertymanagement.util.CacheHelper;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class LeasingService {

	private static final String LEASING_CACHE_SCOPE = "leasing";

	@Inject
	private LeadMapper leadMapper;

	@Inject
	private ProspectMapper prospectMapper;

	@Inject
	private RequirementMapper requirementMapper;

	@Inject
	private UnitMapper unitMapper;

	@Inject
	private SiteVisitMapper siteVisitMapper;

	@Inject
	private OfferMapper offerMapper;

	@Inject
	private NegotiationMapper negotiationMapper;

	@Inject
	private ReservationMapper reservationMapper;

	@Inject
	private PaymentReceiptMapper paymentReceiptMapper;

	@Inject
	private StatusHistoryMapper statusHistoryMapper;

	public List<Lead> listLeads(Long companyId) {
		if (companyId != null) {
			return leadMapper.listLeads(companyId);
		}
		return getCompanyCache(CacheHelper.GET_LEASING_LEADS, () -> leadMapper.listLeads(null));
	}

	public Lead createLead(Lead request) {
		requireText(request.customerName, "Customer name is required");
		requireText(request.mobileNo, "Mobile number is required");
		requireId(request.companyId, "Company is required");
		Lead lead = request;
		lead.leadNo = defaultString(lead.leadNo, nextNumber("LD"));
		lead.status = defaultString(lead.status, "NEW");
		leadMapper.createLead(lead);
		statusHistoryMapper.insertHistory("LEAD", lead.id, null, lead.status, "Lead created", lead.createdBy);
		clearLeasingCache();
		return leadMapper.getLead(lead.id);
	}

	public Lead updateLead(Long leadId, Lead request) {
		requireId(leadId, "Lead is required");
		requireText(request.customerName, "Customer name is required");
		requireText(request.mobileNo, "Mobile number is required");
		requireId(request.companyId, "Company is required");
		Lead existingLead = leadMapper.getLead(leadId);
		if (existingLead == null) {
			throw new IllegalArgumentException("Lead not found");
		}
		Lead lead = request;
		lead.id = leadId;
		leadMapper.updateLead(lead);
		clearLeasingCache();
		return leadMapper.getLead(leadId);
	}

	public Lead qualifyLead(Long leadId, QualificationRequest request) {
		if (request == null || request.score == null || request.score < 60) {
			throw new IllegalArgumentException("Lead qualification score must be at least 60");
		}
		Lead lead = leadMapper.getLead(leadId);
		leadMapper.qualifyLead(leadId, request.score, request.notes, request.updatedBy);
		statusHistoryMapper.insertHistory("LEAD", leadId, lead.status, "QUALIFIED", "Lead qualified", request.updatedBy);
		clearLeasingCache();
		return leadMapper.getLead(leadId);
	}

	@Transactional(rollbackFor = Exception.class)
	public Prospect convertLeadToProspect(Long leadId, Long createdBy) {
		Lead lead = leadMapper.getLead(leadId);
		// Business rule: only qualified leads can enter the prospect/reservation pipeline.
		if (!"QUALIFIED".equals(lead.status)) {
			throw new IllegalArgumentException("Only qualified leads can be converted to prospects");
		}
		Prospect prospect = new Prospect();
		prospect.companyId = lead.companyId;
		prospect.leadId = leadId;
		prospect.prospectNo = nextNumber("PR");
		prospect.customerName = lead.customerName;
		prospect.mobileNo = lead.mobileNo;
		prospect.email = lead.email;
		prospect.status = "ACTIVE";
		prospect.createdBy = createdBy;
		prospectMapper.createProspect(prospect);
		leadMapper.updateLeadStatus(leadId, "CONVERTED_TO_PROSPECT", createdBy);
		statusHistoryMapper.insertHistory("LEAD", leadId, lead.status, "CONVERTED_TO_PROSPECT", "Converted to prospect", createdBy);
		statusHistoryMapper.insertHistory("PROSPECT", prospect.id, null, "ACTIVE", "Prospect created", createdBy);
		clearLeasingCache();
		return prospectMapper.getProspect(prospect.id);
	}

	public List<Prospect> listProspects(Long companyId) {
		if (companyId != null) {
			return prospectMapper.listProspects(companyId);
		}
		return getCompanyCache(CacheHelper.GET_LEASING_PROSPECTS, () -> prospectMapper.listProspects(null));
	}

	public Prospect getProspect(Long prospectId) {
		return prospectMapper.getProspect(prospectId);
	}

	public Requirement saveRequirement(Requirement request) {
		requireId(request.prospectId, "Prospect is required");
		if (request.budgetFrom != null && request.budgetTo != null && request.budgetFrom.compareTo(request.budgetTo) > 0) {
			throw new IllegalArgumentException("Budget from cannot be greater than budget to");
		}
		Prospect prospect = prospectMapper.getProspect(request.prospectId);
		if (prospect == null) {
			throw new IllegalArgumentException("Prospect not found");
		}
		Requirement requirement = request;
		requirement.companyId = prospect.companyId;
		requirementMapper.saveRequirement(requirement);
		statusHistoryMapper.insertHistory("PROSPECT", requirement.prospectId, null, "REQUIREMENT_CAPTURED", "Requirement captured", requirement.createdBy);
		clearLeasingCache();
		return requirementMapper.getRequirement(requirement.id);
	}

	public List<Requirement> listRequirementsByProspect(Long prospectId) {
		requireId(prospectId, "Prospect is required");
		return requirementMapper.listRequirementsByProspect(prospectId);
	}

	public Requirement updateRequirement(Long requirementId, Requirement request) {
		requireId(requirementId, "Requirement is required");
		requireId(request.prospectId, "Prospect is required");
		if (request.budgetFrom != null && request.budgetTo != null && request.budgetFrom.compareTo(request.budgetTo) > 0) {
			throw new IllegalArgumentException("Budget from cannot be greater than budget to");
		}
		Requirement existingRequirement = requirementMapper.getRequirement(requirementId);
		if (existingRequirement == null) {
			throw new IllegalArgumentException("Requirement not found");
		}
		if (!request.prospectId.equals(existingRequirement.prospectId)) {
			throw new IllegalArgumentException("Requirement does not belong to selected prospect");
		}
		Prospect prospect = prospectMapper.getProspect(request.prospectId);
		if (prospect == null) {
			throw new IllegalArgumentException("Prospect not found");
		}
		Requirement requirement = request;
		requirement.id = requirementId;
		requirement.companyId = prospect.companyId;
		requirementMapper.updateRequirement(requirement);
		statusHistoryMapper.insertHistory("PROSPECT", requirement.prospectId, null, "REQUIREMENT_UPDATED", "Requirement updated", requirement.updatedBy);
		clearLeasingCache();
		return requirementMapper.getRequirement(requirementId);
	}

	public Unit createUnit(Unit request) {
		requireId(request.propertyId, "Property is required");
		requireText(request.propertyName, "Property name is required");
		requireText(request.unitCode, "Unit code is required");
		requireText(request.unitType, "Unit type is required");
		Unit unit = request;
		unit.status = defaultString(unit.status, "AVAILABLE");
		unitMapper.createUnit(unit);
		clearLeasingCache();
		return unitMapper.getUnit(unit.id);
	}

	public List<Unit> searchAvailableUnits(UnitSearch request) {
		if (request == null) {
			request = new UnitSearch();
		}
		UnitSearch search = request;
		return getShortCache(availableUnitCacheKey(search),
				() -> unitMapper.searchAvailableUnits(search.propertyId, search.unitType, search.bedrooms, search.budgetTo));
	}

	public SiteVisit createSiteVisit(SiteVisit request) {
		requireId(request.prospectId, "Prospect is required");
		requireId(request.unitId, "Unit is required");
		Prospect prospect = prospectMapper.getProspect(request.prospectId);
		if (prospect == null) {
			throw new IllegalArgumentException("Prospect not found");
		}
		Unit unit = unitMapper.getUnit(request.unitId);
		// Business rule: only available units can be shown and selected.
		if (!"AVAILABLE".equals(unit.status)) {
			throw new IllegalArgumentException("Only available units can be selected for a site visit");
		}
		if (request.visitAt == null) {
			throw new IllegalArgumentException("Visit date and time is required");
		}
		SiteVisit visit = request;
		visit.companyId = prospect.companyId;
		visit.status = defaultString(visit.status, "SCHEDULED");
		siteVisitMapper.createSiteVisit(visit);
		statusHistoryMapper.insertHistory("PROSPECT", visit.prospectId, null, "SITE_VISIT_SCHEDULED", "Site visit scheduled", visit.createdBy);
		clearLeasingCache();
		return siteVisitMapper.getSiteVisit(visit.id);
	}

	public List<SiteVisit> listSiteVisitsByProspect(Long prospectId) {
		requireId(prospectId, "Prospect is required");
		return siteVisitMapper.listSiteVisitsByProspect(prospectId);
	}

	public SiteVisit updateSiteVisit(Long siteVisitId, SiteVisit request) {
		requireId(siteVisitId, "Site visit is required");
		requireId(request.prospectId, "Prospect is required");
		requireId(request.unitId, "Unit is required");
		if (request.visitAt == null) {
			throw new IllegalArgumentException("Visit date and time is required");
		}
		SiteVisit existingVisit = siteVisitMapper.getSiteVisit(siteVisitId);
		if (existingVisit == null) {
			throw new IllegalArgumentException("Site visit not found");
		}
		if (!request.prospectId.equals(existingVisit.prospectId)) {
			throw new IllegalArgumentException("Site visit does not belong to selected prospect");
		}
		Prospect prospect = prospectMapper.getProspect(request.prospectId);
		if (prospect == null) {
			throw new IllegalArgumentException("Prospect not found");
		}
		Unit unit = unitMapper.getUnit(request.unitId);
		if (!"AVAILABLE".equals(unit.status)) {
			throw new IllegalArgumentException("Only available units can be selected for a site visit");
		}
		SiteVisit visit = request;
		visit.id = siteVisitId;
		visit.companyId = prospect.companyId;
		visit.status = defaultString(visit.status, existingVisit.status);
		siteVisitMapper.updateSiteVisit(visit);
		statusHistoryMapper.insertHistory("PROSPECT", visit.prospectId, existingVisit.status, visit.status, "Site visit updated", visit.updatedBy);
		clearLeasingCache();
		return siteVisitMapper.getSiteVisit(siteVisitId);
	}

	public Offer createOffer(Offer request) {
		requireId(request.prospectId, "Prospect is required");
		requireId(request.unitId, "Unit is required");
		if (request.baseAmount == null || request.baseAmount.signum() <= 0) {
			throw new IllegalArgumentException("Offer base amount is required");
		}
		BigDecimal discount = request.discountAmount == null ? BigDecimal.ZERO : request.discountAmount;
		request.finalAmount = request.finalAmount == null ? request.baseAmount.subtract(discount) : request.finalAmount;
		// Business rule: discount or special terms should trigger approval.
		request.approvalRequired = discount.signum() > 0 || hasText(request.specialTerms);
		request.status = "SENT";
		Prospect prospect = prospectMapper.getProspect(request.prospectId);
		if (prospect == null) {
			throw new IllegalArgumentException("Prospect not found");
		}
		Offer offer = request;
		offer.companyId = prospect.companyId;
		offer.offerNo = defaultString(offer.offerNo, nextNumber("OF"));
		offerMapper.createOffer(offer);
		statusHistoryMapper.insertHistory("OFFER", offer.id, null, offer.status, "Offer created", offer.createdBy);
		clearLeasingCache();
		return offerMapper.getOffer(offer.id);
	}

	public List<Offer> listOffersByProspect(Long prospectId) {
		requireId(prospectId, "Prospect is required");
		return offerMapper.listOffersByProspect(prospectId);
	}

	public Offer updateOffer(Long offerId, Offer request) {
		requireId(offerId, "Offer is required");
		requireId(request.prospectId, "Prospect is required");
		requireId(request.unitId, "Unit is required");
		if (request.baseAmount == null || request.baseAmount.signum() <= 0) {
			throw new IllegalArgumentException("Offer base amount is required");
		}
		Offer existingOffer = offerMapper.getOffer(offerId);
		if (existingOffer == null) {
			throw new IllegalArgumentException("Offer not found");
		}
		if (!request.prospectId.equals(existingOffer.prospectId)) {
			throw new IllegalArgumentException("Offer does not belong to selected prospect");
		}
		Prospect prospect = prospectMapper.getProspect(request.prospectId);
		if (prospect == null) {
			throw new IllegalArgumentException("Prospect not found");
		}
		BigDecimal discount = request.discountAmount == null ? BigDecimal.ZERO : request.discountAmount;
		request.discountAmount = discount;
		request.finalAmount = request.finalAmount == null ? request.baseAmount.subtract(discount) : request.finalAmount;
		request.approvalRequired = discount.signum() > 0 || hasText(request.specialTerms);
		Offer offer = request;
		offer.id = offerId;
		offer.companyId = prospect.companyId;
		offer.status = defaultString(offer.status, existingOffer.status);
		offerMapper.updateOffer(offer);
		statusHistoryMapper.insertHistory("OFFER", offer.id, existingOffer.status, offer.status, "Offer updated", offer.updatedBy);
		clearLeasingCache();
		return offerMapper.getOffer(offer.id);
	}

	@Transactional(rollbackFor = Exception.class)
	public Negotiation createNegotiation(Negotiation request) {
		requireId(request.offerId, "Offer is required");
		if (request.proposedAmount == null || request.proposedAmount.signum() <= 0) {
			throw new IllegalArgumentException("Proposed amount is required");
		}
		Offer offer = offerMapper.getOffer(request.offerId);
		if (offer == null) {
			throw new IllegalArgumentException("Offer not found");
		}
		Negotiation negotiation = request;
		negotiation.companyId = offer.companyId;
		negotiation.status = defaultString(negotiation.status, "OPEN");
		negotiationMapper.createNegotiation(negotiation);
		offerMapper.updateOfferStatus(negotiation.offerId, "NEGOTIATION", negotiation.createdBy);
		statusHistoryMapper.insertHistory("OFFER", negotiation.offerId, null, "NEGOTIATION", "Negotiation recorded", negotiation.createdBy);
		clearLeasingCache();
		return negotiationMapper.getNegotiation(negotiation.id);
	}

	public List<Offer> listOffers(Long companyId) {
		if (companyId != null) {
			return offerMapper.listOffers(companyId);
		}
		return getCompanyCache(CacheHelper.GET_LEASING_OFFERS, () -> offerMapper.listOffers(null));
	}

	@Transactional(rollbackFor = Exception.class)
	public Reservation createReservationRequest(Reservation request) {
		requireId(request.prospectId, "Prospect is required");
		requireId(request.offerId, "Offer is required");
		Offer offer = offerMapper.getOffer(request.offerId);
		if (offer == null) {
			throw new IllegalArgumentException("Offer not found");
		}
		if (!request.prospectId.equals(offer.prospectId)) {
			throw new IllegalArgumentException("Offer does not belong to selected prospect");
		}
		if (!"APPROVED".equals(offer.status)) {
			throw new IllegalArgumentException("Only approved offers can be reserved");
		}
		Prospect prospect = prospectMapper.getProspect(request.prospectId);
		if (prospect == null) {
			throw new IllegalArgumentException("Prospect not found");
		}
		Unit unit = unitMapper.getUnit(offer.unitId);
		// Business rule: only available units can be selected.
		if (!"AVAILABLE".equals(unit.status)) {
			throw new IllegalArgumentException("Selected unit is not available");
		}
		// Business rule: same unit cannot have more than one active reservation.
		if (reservationMapper.hasActiveReservation(unit.id)) {
			throw new IllegalArgumentException("Selected unit already has an active reservation");
		}
		Reservation reservation = request;
		reservation.reservationFee = request.reservationFee == null ? BigDecimal.ZERO : request.reservationFee;
		reservation.paymentWaived = Boolean.TRUE.equals(request.paymentWaived);
		reservation.reservationNo = nextNumber("RS");
		reservation.companyId = prospect.companyId;
		reservation.leadId = prospect.leadId;
		reservation.propertyId = unit.propertyId;
		reservation.unitId = unit.id;
		boolean approvalRequired = Boolean.TRUE.equals(offer.approvalRequired);
		reservation.status = approvalRequired ? "PENDING_APPROVAL" : "PAYMENT_PENDING";
		reservation.approvalStatus = approvalRequired ? "PENDING" : "NOT_REQUIRED";
		reservation.paidAmount = BigDecimal.ZERO;
		reservationMapper.createReservation(reservation);
		prospectMapper.updateProspectStatus(reservation.prospectId, "RESERVED", reservation.createdBy);
		statusHistoryMapper.insertHistory("RESERVATION", reservation.id, null, reservation.status, "Reservation requested", reservation.createdBy);
		statusHistoryMapper.insertHistory("PROSPECT", reservation.prospectId, prospect.status, "RESERVED", "Reservation requested", reservation.createdBy);
		clearLeasingCache();
		return reservationMapper.getReservation(reservation.id);
	}

	public List<Reservation> listReservationsByProspect(Long prospectId) {
		requireId(prospectId, "Prospect is required");
		return reservationMapper.listReservationsByProspect(prospectId);
	}

	public Reservation approveReservation(Long reservationId, ApprovalRequest request) {
		if (request == null || request.approved == null) {
			throw new IllegalArgumentException("Approval decision is required");
		}
		Reservation reservation = reservationMapper.getReservation(reservationId);
		if (!"PENDING_APPROVAL".equals(reservation.status)) {
			throw new IllegalArgumentException("Reservation is not pending approval");
		}
		String nextStatus = request.approved ? "PAYMENT_PENDING" : "REJECTED";
		String nextApprovalStatus = request.approved ? "APPROVED" : "REJECTED";
		reservationMapper.updateReservationApproval(reservationId, nextStatus, nextApprovalStatus, request.approvedBy);
		statusHistoryMapper.insertHistory("RESERVATION", reservationId, reservation.status, nextStatus, request.comments, request.approvedBy);
		clearLeasingCache();
		return reservationMapper.getReservation(reservationId);
	}

	@Transactional(rollbackFor = Exception.class)
	public PaymentReceipt recordPayment(PaymentReceipt request) {
		requireId(request.reservationId, "Reservation is required");
		if (request.amount == null || request.amount.signum() <= 0) {
			throw new IllegalArgumentException("Payment amount is required");
		}
		requireText(request.paymentMethod, "Payment method is required");
		Reservation reservation = reservationMapper.getReservation(request.reservationId);
		if (!"PAYMENT_PENDING".equals(reservation.status) && !"APPROVED".equals(reservation.status)) {
			throw new IllegalArgumentException("Reservation is not ready for payment");
		}
		PaymentReceipt receipt = request;
		receipt.receiptNo = defaultString(receipt.receiptNo, nextNumber("RC"));
		receipt.paidAt = receipt.paidAt == null ? new Date() : receipt.paidAt;
		paymentReceiptMapper.createPaymentReceipt(receipt);
		reservationMapper.addReservationPayment(receipt.reservationId, receipt.amount, receipt.createdBy);
		statusHistoryMapper.insertHistory("RESERVATION", receipt.reservationId, null, "PAYMENT_RECORDED", "Reservation fee receipt recorded", receipt.createdBy);
		clearLeasingCache();
		return paymentReceiptMapper.getPaymentReceipt(receipt.id);
	}

	@Transactional(rollbackFor = Exception.class)
	public Reservation confirmReservation(Long reservationId, Long updatedBy) {
		Reservation reservation = reservationMapper.getReservation(reservationId);
		boolean approved = "APPROVED".equals(reservation.approvalStatus) || "NOT_REQUIRED".equals(reservation.approvalStatus);
		boolean paidOrWaived = Boolean.TRUE.equals(reservation.paymentWaived)
				|| (reservation.paidAmount != null && reservation.reservationFee != null && reservation.paidAmount.compareTo(reservation.reservationFee) >= 0);
		// Business rule: reservation cannot be confirmed unless approved and paid or payment is waived.
		if (!approved) {
			throw new IllegalArgumentException("Reservation must be approved before confirmation");
		}
		if (!paidOrWaived) {
			throw new IllegalArgumentException("Reservation fee must be paid or waived before confirmation");
		}
		// Business rule: confirmed reservations set unit status to RESERVED in the mapper transaction.
		reservationMapper.updateReservationStatus(reservationId, "CONFIRMED", updatedBy);
		unitMapper.updateUnitStatus(reservation.unitId, "RESERVED", updatedBy);
		prospectMapper.updateProspectStatus(reservation.prospectId, "RESERVED", updatedBy);
		statusHistoryMapper.insertHistory("RESERVATION", reservationId, reservation.status, "CONFIRMED", "Reservation confirmed", updatedBy);
		statusHistoryMapper.insertHistory("UNIT", reservation.unitId, null, "RESERVED", "Unit reserved", updatedBy);
		clearLeasingCache();
		return reservationMapper.getReservation(reservationId);
	}

	@Transactional(rollbackFor = Exception.class)
	public Reservation cancelReservation(Long reservationId, Long updatedBy) {
		// Business rule: cancelled reservations release the unit back to AVAILABLE in the mapper transaction.
		return changeReservationStatus(reservationId, "CANCELLED", updatedBy);
	}

	@Transactional(rollbackFor = Exception.class)
	public Reservation expireReservation(Long reservationId, Long updatedBy) {
		// Business rule: expired reservations release the unit back to AVAILABLE in the mapper transaction.
		return changeReservationStatus(reservationId, "EXPIRED", updatedBy);
	}

	@Transactional(rollbackFor = Exception.class)
	public Reservation moveToLease(Long reservationId, Long updatedBy) {
		Reservation reservation = reservationMapper.getReservation(reservationId);
		if (!"CONFIRMED".equals(reservation.status)) {
			throw new IllegalArgumentException("Only confirmed reservations can move to lease or contract");
		}
		return changeReservationStatus(reservationId, "MOVED_TO_LEASE", updatedBy);
	}

	public List<Reservation> listReservations(Long companyId) {
		if (companyId != null) {
			return reservationMapper.listReservations(companyId);
		}
		return getCompanyCache(CacheHelper.GET_LEASING_RESERVATIONS, () -> reservationMapper.listReservations(null));
	}

	public ReportSummary reportSummary() {
		return getCompanyCache(CacheHelper.GET_LEASING_REPORT_SUMMARY, () -> {
			ReportSummary summary = new ReportSummary();
			summary.leads = statusHistoryMapper.count("pa_txn_leasing_lead", null);
			summary.qualifiedLeads = statusHistoryMapper.count("pa_txn_leasing_lead", "status = 'QUALIFIED'");
			summary.prospects = statusHistoryMapper.count("pa_txn_leasing_prospect", null);
			summary.activeReservations = statusHistoryMapper.count("pa_txn_leasing_reservation", "status IN ('REQUESTED', 'PENDING_APPROVAL', 'APPROVED', 'PAYMENT_PENDING')");
			summary.confirmedReservations = statusHistoryMapper.count("pa_txn_leasing_reservation", "status = 'CONFIRMED'");
			summary.latestHistory = statusHistoryMapper.latestHistory();
			return summary;
		});
	}

	private void requireId(Long value, String message) {
		if (value == null || value <= 0) {
			throw new IllegalArgumentException(message);
		}
	}

	private void requireText(String value, String message) {
		if (!hasText(value)) {
			throw new IllegalArgumentException(message);
		}
	}

	private boolean hasText(String value) {
		return value != null && !value.trim().isEmpty();
	}

	private Reservation changeReservationStatus(Long reservationId, String nextStatus, Long updatedBy) {
		Reservation reservation = reservationMapper.getReservation(reservationId);
		reservationMapper.updateReservationStatus(reservationId, nextStatus, updatedBy);
		if ("CANCELLED".equals(nextStatus) || "EXPIRED".equals(nextStatus)) {
			unitMapper.updateUnitStatus(reservation.unitId, "AVAILABLE", updatedBy);
		}
		if ("MOVED_TO_LEASE".equals(nextStatus)) {
			Prospect prospect = prospectMapper.getProspect(reservation.prospectId);
			prospectMapper.updateProspectStatus(reservation.prospectId, "LEASE_PROCESS", updatedBy);
			statusHistoryMapper.insertHistory("PROSPECT", reservation.prospectId, prospect == null ? null : prospect.status, "LEASE_PROCESS", "Reservation moved to lease", updatedBy);
		}
		statusHistoryMapper.insertHistory("RESERVATION", reservationId, reservation.status, nextStatus, "Reservation status changed", updatedBy);
		clearLeasingCache();
		return reservationMapper.getReservation(reservationId);
	}

	@SuppressWarnings("unchecked")
	private <T> T getCompanyCache(String methodName, Supplier<T> supplier) {
		String key = CacheHelper.getCacheKey(methodName, LEASING_CACHE_SCOPE);
		Object cachedValue = CacheHelper.getCompanyCache(key);
		if (cachedValue != null) {
			return (T) cachedValue;
		}
		T value = supplier.get();
		CacheHelper.putCompanyCache(key, value);
		return value;
	}

	@SuppressWarnings("unchecked")
	private <T> T getShortCache(String key, Supplier<T> supplier) {
		Object cachedValue = CacheHelper.getShortLivedCache(key);
		if (cachedValue != null) {
			return (T) cachedValue;
		}
		T value = supplier.get();
		CacheHelper.putShortLivedCache(key, value);
		return value;
	}

	private void clearLeasingCache() {
		CacheHelper.removeCompanyCache(CacheHelper.getCacheKey(CacheHelper.GET_LEASING_LEADS, LEASING_CACHE_SCOPE));
		CacheHelper.removeCompanyCache(CacheHelper.getCacheKey(CacheHelper.GET_LEASING_PROSPECTS, LEASING_CACHE_SCOPE));
		CacheHelper.removeCompanyCache(CacheHelper.getCacheKey(CacheHelper.GET_LEASING_OFFERS, LEASING_CACHE_SCOPE));
		CacheHelper.removeCompanyCache(CacheHelper.getCacheKey(CacheHelper.GET_LEASING_RESERVATIONS, LEASING_CACHE_SCOPE));
		CacheHelper.removeCompanyCache(CacheHelper.getCacheKey(CacheHelper.GET_LEASING_REPORT_SUMMARY, LEASING_CACHE_SCOPE));
		CacheHelper.clearShortLivedCache();
	}

	private String availableUnitCacheKey(UnitSearch search) {
		String value = nullSafe(search.propertyId) + "|" + nullSafe(search.unitType) + "|" + nullSafe(search.bedrooms) + "|" + nullSafe(search.budgetTo);
		return CacheHelper.getCacheKey(CacheHelper.GET_LEASING_AVAILABLE_UNITS, value);
	}

	private String nullSafe(Object value) {
		return value == null ? "all" : value.toString();
	}

	private String nextNumber(String prefix) {
		return prefix + "-" + System.currentTimeMillis();
	}

	private String defaultString(String value, String defaultValue) {
		return value == null || value.isBlank() ? defaultValue : value;
	}
}
