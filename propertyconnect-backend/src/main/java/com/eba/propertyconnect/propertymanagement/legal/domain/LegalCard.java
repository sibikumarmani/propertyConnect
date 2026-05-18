package com.eba.propertyconnect.propertymanagement.legal.domain;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class LegalCard extends LegalAuditModel {

	public Long id;
	public Long companyId;
	public String legalCardNo;
	public Long legalTypeId;
	public String legalType;
	public Long currentStageId;
	public String currentStage;
	public Long reasonId;
	public String reason;
	public Long tenantId;
	public String tenant;
	public Long propertyId;
	public String property;
	public Long unitId;
	public String unit;
	public Long advocateId;
	public String advocate;
	public String caseNumber;
	public String priority;
	public String priorityLabel;
	public Long documentStatusId;
	public String documentStatus;
	public Long approvalStatusId;
	public String approvalStatus;
	public String documentDate;
	public String dueDate;
	public BigDecimal dueAmount;
	public String comments;
	public List<LegalCardAttachment> attachments = new ArrayList<>();
	public List<LegalCardTimeline> timeline = new ArrayList<>();
}
