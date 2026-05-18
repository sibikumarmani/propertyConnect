package com.eba.propertyconnect.propertymanagement.leasing.service;

import java.math.BigDecimal;
import java.util.Date;
import java.util.List;
import java.util.function.Supplier;

import org.mybatis.cdi.Transactional;

import com.eba.propertyconnect.propertymanagement.leasing.domain.ApprovalRequest;
import com.eba.propertyconnect.propertymanagement.leasing.domain.Customer;
import com.eba.propertyconnect.propertymanagement.leasing.domain.Lead;
import com.eba.propertyconnect.propertymanagement.leasing.domain.Negotiation;
import com.eba.propertyconnect.propertymanagement.leasing.domain.Offer;
import com.eba.propertyconnect.propertymanagement.leasing.domain.OfferStatusRequest;
import com.eba.propertyconnect.propertymanagement.leasing.domain.PaymentReceipt;
import com.eba.propertyconnect.propertymanagement.leasing.domain.Prospect;
import com.eba.propertyconnect.propertymanagement.leasing.domain.QualificationRequest;
import com.eba.propertyconnect.propertymanagement.leasing.domain.ReportSummary;
import com.eba.propertyconnect.propertymanagement.leasing.domain.Requirement;
import com.eba.propertyconnect.propertymanagement.leasing.domain.Reservation;
import com.eba.propertyconnect.propertymanagement.leasing.domain.ReservationStatusRequest;
import com.eba.propertyconnect.propertymanagement.leasing.domain.SiteVisit;
import com.eba.propertyconnect.propertymanagement.leasing.domain.Unit;
import com.eba.propertyconnect.propertymanagement.leasing.domain.UnitSearch;
import com.eba.propertyconnect.propertymanagement.leasing.mapper.CustomerMapper;
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
	private CustomerMapper customerMapper;

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

	public List<Customer> searchCustomers(Long companyId, String search) {
		return customerMapper.searchCustomers(companyId, search == null ? null : search.trim());
	}

	public Lead createLead(Lead request) {
		requireId(request.companyId, "Company is required");
		applyCustomerMaster(request);
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
		requireId(request.companyId, "Company is required");
		Lead existingLead = leadMapper.getLead(leadId);
		if (existingLead == null) {
			throw new IllegalArgumentException("Lead not found");
		}
		Lead lead = request;
		lead.id = leadId;
		applyCustomerMaster(lead);
		leadMapper.updateLead(lead);
		clearLeasingCache();
		return leadMapper.getLead(leadId);
	}

	@Transactional(rollbackFor = Exception.class)
	public Lead qualifyLead(Long leadId, QualificationRequest request) {
		if (request == null || request.score == null || request.score < 60) {
			throw new IllegalArgumentException("Lead qualification score must be at least 60");
		}
		Lead lead = leadMapper.getLead(leadId);
		if (lead == null) {
			throw new IllegalArgumentException("Lead not found");
		}
		leadMapper.qualifyLead(leadId, request.score, request.notes, request.updatedBy);
		statusHistoryMapper.insertHistory("LEAD", leadId, lead.status, "QUALIFIED", "Lead qualified", request.updatedBy);
		clearLeasingCache();
		return leadMapper.getLead(leadId);
	}

	@Transactional(rollbackFor = Exception.class)
	public Prospect convertLeadToProspect(Long leadId, Long createdBy) {
		return convertLeadToProspect(leadId, createdBy, null);
	}

	@Transactional(rollbackFor = Exception.class)
	public Prospect convertLeadToProspect(Long leadId, Long createdBy, Prospect request) {
		Lead lead = leadMapper.getLead(leadId);
		if (lead == null) {
			throw new IllegalArgumentException("Lead not found");
		}
		if (!"QUALIFIED".equals(lead.status) && !"CONVERTED_TO_PROSPECT".equals(lead.status)) {
			throw new IllegalArgumentException("Only qualified leads can be converted to prospects");
		}
		Prospect prospect = ensureProspectForLead(leadId, createdBy, true, request);
		clearLeasingCache();
		return prospect;
	}

	private Prospect ensureProspectForLead(Long leadId, Long createdBy, boolean markLeadConverted) {
		return ensureProspectForLead(leadId, createdBy, markLeadConverted, null);
	}

	private Prospect ensureProspectForLead(Long leadId, Long createdBy, boolean markLeadConverted, Prospect request) {
		Prospect existingProspect = prospectMapper.getProspectByLead(leadId);
		if (existingProspect != null) {
			return existingProspect;
		}
		Lead lead = leadMapper.getLead(leadId);
		if (lead == null) {
			throw new IllegalArgumentException("Lead not found");
		}
		if (lead.customerId == null && request == null) {
			throw new IllegalArgumentException("Customer details are required before converting this lead to prospect");
		}
		if (lead.customerId == null) {
			applyCustomerDetailsForConversion(lead, request, createdBy);
		}
		Customer customer = lead.customerId == null ? null : customerMapper.getCustomer(lead.customerId);
		Prospect prospect = new Prospect();
		prospect.companyId = lead.companyId;
		prospect.leadId = leadId;
		prospect.prospectNo = nextNumber("PR");
		prospect.customerId = lead.customerId;
		prospect.customerCode = lead.customerCode;
		prospect.customerType = firstText(request == null ? null : request.customerType, lead.customerType);
		prospect.customerName = firstText(request == null ? null : request.customerName, lead.customerName);
		prospect.tradeLicenseNo = firstText(request == null ? null : request.tradeLicenseNo, customer == null ? null : customer.tradeLicenseNo);
		prospect.crNumber = firstText(request == null ? null : request.crNumber, customer == null ? null : customer.crNumber);
		prospect.vatRegistrationNo = firstText(request == null ? null : request.vatRegistrationNo, customer == null ? null : customer.vatRegistrationNo);
		prospect.contactPerson = firstText(request == null ? null : request.contactPerson, lead.contactPerson);
		prospect.contactRole = firstText(request == null ? null : request.contactRole, customer == null ? null : customer.contactRole);
		prospect.contactTitle = firstText(request == null ? null : request.contactTitle, customer == null ? null : customer.contactTitle);
		prospect.mobileNo = firstText(request == null ? null : request.mobileNo, lead.mobileNo);
		prospect.phoneNo = firstText(request == null ? null : request.phoneNo, customer == null ? null : customer.phoneNo);
		prospect.email = firstText(request == null ? null : request.email, lead.email);
		prospect.preferredContactMethod = firstText(request == null ? null : request.preferredContactMethod, lead.preferredContactMethod);
		prospect.faxNo = firstText(request == null ? null : request.faxNo, customer == null ? null : customer.faxNo);
		prospect.address = firstText(request == null ? null : request.address, customer == null ? null : customer.address);
		prospect.source = request == null ? null : request.source;
		prospect.purpose = firstText(request == null ? null : request.purpose, lead.purpose);
		prospect.commercialNeed = request == null ? null : request.commercialNeed;
		prospect.documentNotes = request == null ? null : request.documentNotes;
		prospect.status = "PROSPECT";
		prospect.createdBy = createdBy;
		prospectMapper.createProspect(prospect);
		if (markLeadConverted) {
			leadMapper.updateLeadStatus(leadId, "CONVERTED_TO_PROSPECT", createdBy);
			statusHistoryMapper.insertHistory("LEAD", leadId, lead.status, "CONVERTED_TO_PROSPECT", "Converted to prospect", createdBy);
		}
		statusHistoryMapper.insertHistory("PROSPECT", prospect.id, null, "PROSPECT", "Prospect created", createdBy);
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

	@Transactional(rollbackFor = Exception.class)
	public Prospect updateProspect(Long prospectId, Prospect request) {
		requireId(prospectId, "Prospect is required");
		if (request == null) {
			throw new IllegalArgumentException("Prospect details are required");
		}
		Prospect existingProspect = prospectMapper.getProspect(prospectId);
		if (existingProspect == null) {
			throw new IllegalArgumentException("Prospect not found");
		}
		requireText(request.customerName, "Customer name is required");
		requireText(request.mobileNo, "Mobile number is required");
		request.id = prospectId;
		prospectMapper.updateProspect(request);
		clearLeasingCache();
		return prospectMapper.getProspect(prospectId);
	}

	public Requirement saveRequirement(Requirement request) {
		requireId(request.prospectId, "Prospect is required");
		if (request.budgetFrom != null && request.budgetTo != null && request.budgetFrom.compareTo(request.budgetTo) > 0) {
			throw new IllegalArgumentException("Budget from cannot be greater than budget to");
		}
		if (request.areaFrom != null && request.areaTo != null && request.areaFrom.compareTo(request.areaTo) > 0) {
			throw new IllegalArgumentException("Area from cannot be greater than area to");
		}
		Prospect prospect = prospectMapper.getProspect(request.prospectId);
		if (prospect == null) {
			throw new IllegalArgumentException("Prospect not found");
		}
		Requirement requirement = request;
		requirement.companyId = prospect.companyId;
		requirementMapper.saveRequirement(requirement);
		updateProspectStage(prospect, "REQUIREMENT_CAPTURED", "Requirement captured", requirement.createdBy);
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
		if (request.areaFrom != null && request.areaTo != null && request.areaFrom.compareTo(request.areaTo) > 0) {
			throw new IllegalArgumentException("Area from cannot be greater than area to");
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
		updateProspectStage(prospect, "REQUIREMENT_CAPTURED", "Requirement updated", requirement.updatedBy);
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
		Prospect prospect = prospectMapper.getProspect(request.prospectId);
		if (prospect == null) {
			throw new IllegalArgumentException("Prospect not found");
		}
		if (request.visitAt == null) {
			throw new IllegalArgumentException("Visit date and time is required");
		}
		SiteVisit visit = request;
		validateSiteVisitLocation(visit, null);
		visit.companyId = prospect.companyId;
		visit.status = defaultString(visit.status, "SCHEDULED");
		siteVisitMapper.createSiteVisit(visit);
		updateProspectStage(prospect, "SITE_VISIT_SCHEDULED", "Site visit scheduled", visit.createdBy);
		clearLeasingCache();
		return siteVisitMapper.getSiteVisit(visit.id);
	}

	public List<SiteVisit> listSiteVisitsByProspect(Long prospectId) {
		requireId(prospectId, "Prospect is required");
		return siteVisitMapper.listSiteVisitsByProspect(prospectId);
	}

	private void validateSiteVisitLocation(SiteVisit visit, Long existingUnitId) {
		visit.requirementLevel = defaultString(visit.requirementLevel, "PROPERTY");
		requireId(visit.propertyId, "Property is required");
		if ("BLOCK".equals(visit.requirementLevel) || "FLOOR".equals(visit.requirementLevel) || "UNIT".equals(visit.requirementLevel)) {
			requireText(visit.blockName, "Block / building is required");
		}
		if ("FLOOR".equals(visit.requirementLevel) || "UNIT".equals(visit.requirementLevel)) {
			requireText(visit.floorName, "Floor is required");
		}
		if ("UNIT".equals(visit.requirementLevel)) {
			requireId(visit.unitId, "Unit is required");
		}
		if (visit.unitId == null) {
			return;
		}
		Unit unit = unitMapper.getUnit(visit.unitId);
		if (unit == null) {
			throw new IllegalArgumentException("Unit not found");
		}
		if (unit.propertyId != null && !unit.propertyId.equals(visit.propertyId)) {
			throw new IllegalArgumentException("Unit does not belong to selected property");
		}
		if (!visit.unitId.equals(existingUnitId) && !"AVAILABLE".equals(unit.status)) {
			throw new IllegalArgumentException("Only available units can be selected for a site visit");
		}
		visit.propertyName = firstText(visit.propertyName, unit.propertyName);
	}

	public SiteVisit updateSiteVisit(Long siteVisitId, SiteVisit request) {
		requireId(siteVisitId, "Site visit is required");
		requireId(request.prospectId, "Prospect is required");
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
		SiteVisit visit = request;
		validateSiteVisitLocation(visit, existingVisit.unitId);
		visit.id = siteVisitId;
		visit.companyId = prospect.companyId;
		visit.status = defaultString(visit.status, existingVisit.status);
		siteVisitMapper.updateSiteVisit(visit);
		updateProspectStage(prospect, "SITE_VISIT_SCHEDULED", "Site visit updated", visit.updatedBy);
		clearLeasingCache();
		return siteVisitMapper.getSiteVisit(siteVisitId);
	}

	public Offer createOffer(Offer request) {
		requireId(request.prospectId, "Prospect is required");
		if (request.baseAmount == null || request.baseAmount.signum() <= 0) {
			throw new IllegalArgumentException("Offer base amount is required");
		}
		BigDecimal discount = request.discountAmount == null ? BigDecimal.ZERO : request.discountAmount;
		request.finalAmount = request.finalAmount == null ? request.baseAmount.subtract(discount) : request.finalAmount;
		request.approvalRequired = discount.signum() > 0 || hasText(request.specialTerms);
		request.status = defaultString(request.status, "DRAFT");
		if (!"DRAFT".equals(request.status) && !"PENDING_APPROVAL".equals(request.status)) {
			throw new IllegalArgumentException("Offer must be saved as draft or submitted for approval");
		}
		Prospect prospect = prospectMapper.getProspect(request.prospectId);
		if (prospect == null) {
			throw new IllegalArgumentException("Prospect not found");
		}
		Offer offer = request;
		validateOfferLocation(offer);
		offer.companyId = prospect.companyId;
		offer.offerNo = defaultString(offer.offerNo, nextNumber("OF"));
		offerMapper.createOffer(offer);
		updateProspectStage(prospect, "OFFER_IN_PROGRESS", "Offer created", offer.createdBy);
		statusHistoryMapper.insertHistory("OFFER", offer.id, null, offer.status, "Offer created", offer.createdBy);
		clearLeasingCache();
		return offerMapper.getOffer(offer.id);
	}

	public Offer approveOffer(Long offerId, ApprovalRequest request) {
		if (request == null || request.approved == null) {
			throw new IllegalArgumentException("Approval decision is required");
		}
		Offer offer = offerMapper.getOffer(offerId);
		if (offer == null) {
			throw new IllegalArgumentException("Offer not found");
		}
		if (!"PENDING_APPROVAL".equals(offer.status)) {
			throw new IllegalArgumentException("Offer is not pending approval");
		}
		String nextStatus = request.approved ? "APPROVED" : "REJECTED";
		offerMapper.updateOfferStatus(offerId, nextStatus, request.approvedBy);
		statusHistoryMapper.insertHistory("OFFER", offerId, offer.status, nextStatus, request.comments, request.approvedBy);
		clearLeasingCache();
		return offerMapper.getOffer(offerId);
	}

	public List<Offer> listOffersByProspect(Long prospectId) {
		requireId(prospectId, "Prospect is required");
		return offerMapper.listOffersByProspect(prospectId);
	}

	private void validateOfferLocation(Offer offer) {
		offer.requirementLevel = defaultString(offer.requirementLevel, "PROPERTY");
		requireId(offer.propertyId, "Property is required");
		if ("BLOCK".equals(offer.requirementLevel) || "FLOOR".equals(offer.requirementLevel) || "UNIT".equals(offer.requirementLevel)) {
			requireText(offer.blockName, "Block / building is required");
		}
		if ("FLOOR".equals(offer.requirementLevel) || "UNIT".equals(offer.requirementLevel)) {
			requireText(offer.floorName, "Floor is required");
		}
		if ("UNIT".equals(offer.requirementLevel)) {
			requireId(offer.unitId, "Unit is required");
		}
		if (offer.unitId == null) {
			return;
		}
		Unit unit = unitMapper.getUnit(offer.unitId);
		if (unit == null) {
			throw new IllegalArgumentException("Unit not found");
		}
		if (unit.propertyId != null && !unit.propertyId.equals(offer.propertyId)) {
			throw new IllegalArgumentException("Unit does not belong to selected property");
		}
		offer.propertyName = firstText(offer.propertyName, unit.propertyName);
	}

	public Offer updateOffer(Long offerId, Offer request) {
		requireId(offerId, "Offer is required");
		requireId(request.prospectId, "Prospect is required");
		if (request.baseAmount == null || request.baseAmount.signum() <= 0) {
			throw new IllegalArgumentException("Offer base amount is required");
		}
		Offer existingOffer = offerMapper.getOffer(offerId);
		if (existingOffer == null) {
			throw new IllegalArgumentException("Offer not found");
		}
		if (!"DRAFT".equals(existingOffer.status)) {
			throw new IllegalArgumentException("Only draft offers can be edited");
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
		validateOfferLocation(offer);
		offer.id = offerId;
		offer.companyId = prospect.companyId;
		offer.status = defaultString(offer.status, existingOffer.status);
		if (!"DRAFT".equals(offer.status) && !"PENDING_APPROVAL".equals(offer.status)) {
			throw new IllegalArgumentException("Offer must be saved as draft or submitted for approval");
		}
		offerMapper.updateOffer(offer);
		updateProspectStage(prospect, "OFFER_IN_PROGRESS", "Offer updated", offer.updatedBy);
		statusHistoryMapper.insertHistory("OFFER", offer.id, existingOffer.status, offer.status, "Offer updated", offer.updatedBy);
		clearLeasingCache();
		return offerMapper.getOffer(offer.id);
	}

	public Offer updateOfferStatus(Long offerId, OfferStatusRequest request) {
		if (request == null || !hasText(request.status)) {
			throw new IllegalArgumentException("Offer status is required");
		}
		Offer offer = offerMapper.getOffer(offerId);
		if (offer == null) {
			throw new IllegalArgumentException("Offer not found");
		}
		String nextStatus = request.status.trim().toUpperCase();
		if (!isAllowedOfferTransition(offer.status, nextStatus)) {
			throw new IllegalArgumentException("Offer cannot be moved from " + offer.status + " to " + nextStatus);
		}
		offerMapper.updateOfferStatus(offerId, nextStatus, request.updatedBy);
		statusHistoryMapper.insertHistory("OFFER", offerId, offer.status, nextStatus, request.comments, request.updatedBy);
		clearLeasingCache();
		return offerMapper.getOffer(offerId);
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
		if (!"SENT".equals(offer.status) && !"NEGOTIATION".equals(offer.status)) {
			throw new IllegalArgumentException("Only sent offers can be negotiated");
		}
		Negotiation negotiation = request;
		negotiation.companyId = offer.companyId;
		negotiation.status = defaultString(negotiation.status, "OPEN");
		negotiationMapper.createNegotiation(negotiation);
		offerMapper.updateOfferStatus(negotiation.offerId, "NEGOTIATION", negotiation.createdBy);
		Prospect prospect = prospectMapper.getProspect(offer.prospectId);
		updateProspectStage(prospect, "NEGOTIATION_IN_PROGRESS", "Negotiation recorded", negotiation.createdBy);
		statusHistoryMapper.insertHistory("OFFER", negotiation.offerId, offer.status, "NEGOTIATION", "Negotiation recorded", negotiation.createdBy);
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
		Reservation reservation = request;
		Prospect prospect = applyReservationOfferDetails(reservation);
		reservation.reservationNo = nextNumber("RS");
		reservation.paidAmount = BigDecimal.ZERO;
		reservationMapper.createReservation(reservation);
		updateProspectStage(prospect, "RESERVATION_IN_PROGRESS", "Reservation requested", reservation.createdBy);
		statusHistoryMapper.insertHistory("RESERVATION", reservation.id, null, reservation.status, "Reservation requested", reservation.createdBy);
		clearLeasingCache();
		return reservationMapper.getReservation(reservation.id);
	}

	public Reservation updateReservation(Long reservationId, Reservation request) {
		requireId(reservationId, "Reservation is required");
		Reservation existingReservation = reservationMapper.getReservation(reservationId);
		if (existingReservation == null) {
			throw new IllegalArgumentException("Reservation not found");
		}
		if (!"DRAFT".equals(existingReservation.status)) {
			throw new IllegalArgumentException("Only draft reservations can be edited");
		}
		Reservation reservation = request;
		reservation.id = reservationId;
		Prospect prospect = applyReservationOfferDetails(reservation);
		reservation.paidAmount = existingReservation.paidAmount;
		reservationMapper.updateReservation(reservation);
		updateProspectStage(prospect, "RESERVATION_IN_PROGRESS", "Reservation updated", reservation.updatedBy);
		statusHistoryMapper.insertHistory("RESERVATION", reservation.id, existingReservation.status, reservation.status, "Reservation updated", reservation.updatedBy);
		clearLeasingCache();
		return reservationMapper.getReservation(reservation.id);
	}

	private Prospect applyReservationOfferDetails(Reservation reservation) {
		requireId(reservation.prospectId, "Prospect is required");
		requireId(reservation.offerId, "Offer is required");
		Offer offer = offerMapper.getOffer(reservation.offerId);
		if (offer == null) {
			throw new IllegalArgumentException("Offer not found");
		}
		if (!reservation.prospectId.equals(offer.prospectId)) {
			throw new IllegalArgumentException("Offer does not belong to selected prospect");
		}
		if (!"ACCEPTED".equals(offer.status)) {
			throw new IllegalArgumentException("Only accepted offers can be reserved");
		}
		Prospect prospect = prospectMapper.getProspect(reservation.prospectId);
		if (prospect == null) {
			throw new IllegalArgumentException("Prospect not found");
		}
		Unit unit = null;
		if (offer.unitId != null) {
			unit = unitMapper.getUnit(offer.unitId);
			if (unit == null) {
				throw new IllegalArgumentException("Unit not found");
			}
			if (!"AVAILABLE".equals(unit.status)) {
				throw new IllegalArgumentException("Selected unit is not available");
			}
			if (reservationMapper.hasActiveReservation(unit.id)) {
				throw new IllegalArgumentException("Selected unit already has an active reservation");
			}
		}
		reservation.reservationFee = reservation.reservationFee == null ? BigDecimal.ZERO : reservation.reservationFee;
		reservation.paymentWaived = Boolean.TRUE.equals(reservation.paymentWaived);
		reservation.companyId = prospect.companyId;
		reservation.leadId = prospect.leadId;
		reservation.propertyId = unit == null ? offer.propertyId : unit.propertyId;
		reservation.unitId = unit == null ? null : unit.id;
		reservation.status = defaultString(reservation.status, "DRAFT");
		if (!"DRAFT".equals(reservation.status) && !"PENDING_APPROVAL".equals(reservation.status)) {
			throw new IllegalArgumentException("Reservation must be saved as draft or submitted for approval");
		}
		reservation.approvalStatus = "PENDING_APPROVAL".equals(reservation.status) ? "PENDING" : "NOT_REQUIRED";
		return prospect;
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
		String nextStatus = request.approved ? (Boolean.TRUE.equals(reservation.paymentWaived) ? "PAID" : "PAYMENT_PENDING") : "REJECTED";
		String nextApprovalStatus = request.approved ? "APPROVED" : "REJECTED";
		reservationMapper.updateReservationApproval(reservationId, nextStatus, nextApprovalStatus, request.approvedBy);
		statusHistoryMapper.insertHistory("RESERVATION", reservationId, reservation.status, nextStatus, request.comments, request.approvedBy);
		clearLeasingCache();
		return reservationMapper.getReservation(reservationId);
	}

	public Reservation updateReservationStatus(Long reservationId, ReservationStatusRequest request) {
		if (request == null || !hasText(request.status)) {
			throw new IllegalArgumentException("Reservation status is required");
		}
		Reservation reservation = reservationMapper.getReservation(reservationId);
		if (reservation == null) {
			throw new IllegalArgumentException("Reservation not found");
		}
		String nextStatus = request.status.trim().toUpperCase();
		if (!isAllowedReservationTransition(reservation.status, nextStatus)) {
			throw new IllegalArgumentException("Reservation cannot be moved from " + reservation.status + " to " + nextStatus);
		}
		String nextApprovalStatus = "PENDING_APPROVAL".equals(nextStatus) ? "PENDING" : reservation.approvalStatus;
		reservationMapper.updateReservationApproval(reservationId, nextStatus, nextApprovalStatus, request.updatedBy);
		statusHistoryMapper.insertHistory("RESERVATION", reservationId, reservation.status, nextStatus, request.comments, request.updatedBy);
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
		if (!"PAYMENT_PENDING".equals(reservation.status)) {
			throw new IllegalArgumentException("Reservation is not ready for payment");
		}
		PaymentReceipt receipt = request;
		receipt.receiptNo = defaultString(receipt.receiptNo, nextNumber("RC"));
		receipt.paidAt = receipt.paidAt == null ? new Date() : receipt.paidAt;
		paymentReceiptMapper.createPaymentReceipt(receipt);
		reservationMapper.addReservationPayment(receipt.reservationId, receipt.amount, receipt.createdBy);
		statusHistoryMapper.insertHistory("RESERVATION", receipt.reservationId, reservation.status, "PAID", "Reservation fee receipt recorded", receipt.createdBy);
		clearLeasingCache();
		return paymentReceiptMapper.getPaymentReceipt(receipt.id);
	}

	@Transactional(rollbackFor = Exception.class)
	public Reservation confirmReservation(Long reservationId, Long updatedBy) {
		Reservation reservation = reservationMapper.getReservation(reservationId);
		if (!"PAID".equals(reservation.status)) {
			throw new IllegalArgumentException("Reservation must be paid before confirmation");
		}
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
		if (reservation.unitId != null) {
			unitMapper.updateUnitStatus(reservation.unitId, "RESERVED", updatedBy);
		}
		Prospect prospect = prospectMapper.getProspect(reservation.prospectId);
		updateProspectStage(prospect, "RESERVATION_IN_PROGRESS", "Reservation confirmed", updatedBy);
		statusHistoryMapper.insertHistory("RESERVATION", reservationId, reservation.status, "CONFIRMED", "Reservation confirmed", updatedBy);
		if (reservation.unitId != null) {
			statusHistoryMapper.insertHistory("UNIT", reservation.unitId, null, "RESERVED", "Unit reserved", updatedBy);
		}
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
			summary.activeReservations = statusHistoryMapper.count("pa_txn_leasing_reservation", "status IN ('DRAFT', 'PENDING_APPROVAL', 'PAYMENT_PENDING', 'PAID')");
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

	private void updateProspectStage(Prospect prospect, String nextStatus, String comments, Long updatedBy) {
		if (prospect == null || prospect.id == null || !isForwardProspectStage(prospect.status, nextStatus)) {
			return;
		}
		prospectMapper.updateProspectStatus(prospect.id, nextStatus, updatedBy);
		statusHistoryMapper.insertHistory("PROSPECT", prospect.id, prospect.status, nextStatus, comments, updatedBy);
		prospect.status = nextStatus;
	}

	private boolean isForwardProspectStage(String currentStatus, String nextStatus) {
		return prospectStageRank(nextStatus) >= prospectStageRank(currentStatus);
	}

	private boolean isAllowedOfferTransition(String currentStatus, String nextStatus) {
		if ("APPROVED".equals(currentStatus)) {
			return "SENT".equals(nextStatus);
		}
		if ("SENT".equals(currentStatus) || "NEGOTIATION".equals(currentStatus)) {
			return "ACCEPTED".equals(nextStatus) || "REJECTED".equals(nextStatus);
		}
		return false;
	}

	private boolean isAllowedReservationTransition(String currentStatus, String nextStatus) {
		return "DRAFT".equals(currentStatus) && "PENDING_APPROVAL".equals(nextStatus);
	}

	private int prospectStageRank(String status) {
		if ("REQUIREMENT_CAPTURED".equals(status) || "REQUIREMENT".equals(status)) {
			return 1;
		}
		if ("SITE_VISIT_SCHEDULED".equals(status) || "SITE_VISIT".equals(status)) {
			return 2;
		}
		if ("OFFER_IN_PROGRESS".equals(status) || "OFFER".equals(status)) {
			return 3;
		}
		if ("NEGOTIATION_IN_PROGRESS".equals(status) || "NEGOTIATION".equals(status)) {
			return 4;
		}
		if ("RESERVATION_IN_PROGRESS".equals(status) || "RESERVATION".equals(status) || "RESERVED".equals(status) || "LEASE_PROCESS".equals(status)) {
			return 5;
		}
		return 0;
	}

	private void applyCustomerMaster(Lead lead) {
		if (lead.customerId == null) {
			requireText(lead.customerName, "Customer name is required");
			requireText(lead.mobileNo, "Mobile number is required");
			lead.customerCode = null;
			return;
		}
		requireId(lead.customerId, "Customer is required");
		Customer customer = customerMapper.getCustomer(lead.customerId);
		if (customer == null) {
			throw new IllegalArgumentException("Customer not found");
		}
		if (customer.companyId != null && lead.companyId != null && !customer.companyId.equals(lead.companyId)) {
			throw new IllegalArgumentException("Customer does not belong to selected company");
		}
		lead.customerCode = customer.customerCode;
		lead.customerType = customer.customerType;
		lead.customerName = customer.customerName;
		lead.contactPerson = customer.contactPerson;
		lead.mobileNo = customer.mobileNo;
		lead.email = customer.email;
		lead.preferredContactMethod = customer.preferredContactMethod;
	}

	private void applyCustomerDetailsForConversion(Lead lead, Prospect request, Long createdBy) {
		requireText(request.customerName, "Customer name is required");
		requireText(request.mobileNo, "Mobile number is required");
		Customer customer = new Customer();
		customer.companyId = lead.companyId;
		customer.customerCode = nextNumber("CU");
		customer.customerType = defaultString(request.customerType, defaultString(lead.customerType, "Commercial"));
		customer.customerName = request.customerName;
		customer.tradeLicenseNo = request.tradeLicenseNo;
		customer.crNumber = request.crNumber;
		customer.vatRegistrationNo = request.vatRegistrationNo;
		customer.contactPerson = firstText(request.contactPerson, lead.contactPerson);
		customer.contactRole = request.contactRole;
		customer.contactTitle = request.contactTitle;
		customer.mobileNo = request.mobileNo;
		customer.phoneNo = request.phoneNo;
		customer.email = firstText(request.email, lead.email);
		customer.preferredContactMethod = firstText(request.preferredContactMethod, lead.preferredContactMethod);
		customer.faxNo = request.faxNo;
		customer.address = request.address;
		customer.status = "ACTIVE";
		customer.createdBy = createdBy;
		customerMapper.createCustomer(customer);
		lead.customerId = customer.id;
		lead.customerCode = customer.customerCode;
		lead.customerType = customer.customerType;
		lead.customerName = customer.customerName;
		lead.contactPerson = customer.contactPerson;
		lead.mobileNo = customer.mobileNo;
		lead.email = customer.email;
		lead.preferredContactMethod = customer.preferredContactMethod;
		lead.updatedBy = createdBy;
		leadMapper.updateLead(lead);
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
		if (reservation.unitId != null && ("CANCELLED".equals(nextStatus) || "EXPIRED".equals(nextStatus))) {
			unitMapper.updateUnitStatus(reservation.unitId, "AVAILABLE", updatedBy);
		}
		if ("MOVED_TO_LEASE".equals(nextStatus)) {
			Prospect prospect = prospectMapper.getProspect(reservation.prospectId);
			updateProspectStage(prospect, "RESERVATION_IN_PROGRESS", "Reservation moved to lease", updatedBy);
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

	private String firstText(String preferred, String fallback) {
		return hasText(preferred) ? preferred : fallback;
	}
}
