package com.eba.propertyconnect.propertymanagement.leasing.domain;

public final class LeasingStatuses {

	private LeasingStatuses() {
	}

	public enum LeadStatus {
		NEW,
		QUALIFIED,
		CONVERTED_TO_PROSPECT,
		LOST
	}

	public enum ProspectStatus {
		ACTIVE,
		RESERVED,
		LEASE_PROCESS,
		CANCELLED
	}

	public enum UnitStatus {
		AVAILABLE,
		HOLD,
		RESERVED,
		LEASED,
		MAINTENANCE
	}

	public enum VisitStatus {
		SCHEDULED,
		COMPLETED,
		CANCELLED
	}

	public enum OfferStatus {
		DRAFT,
		SENT,
		NEGOTIATION,
		ACCEPTED,
		REJECTED
	}

	public enum ReservationStatus {
		REQUESTED,
		PENDING_APPROVAL,
		APPROVED,
		REJECTED,
		PAYMENT_PENDING,
		CONFIRMED,
		CANCELLED,
		EXPIRED,
		MOVED_TO_LEASE
	}

	public enum ApprovalStatus {
		NOT_REQUIRED,
		PENDING,
		APPROVED,
		REJECTED
	}
}
