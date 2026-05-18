package com.eba.propertyconnect.propertymanagement.legal.domain;

import java.util.List;

public class LegalCardSearch {

	public Long companyId;
	public Long legalTypeId;
	public Long tenantId;
	public Long propertyId;
	public Long unitId;
	public Long advocateId;
	public String legalCardNo;
	public String documentDateFrom;
	public String documentDateTo;
	public String dueDate;
	public List<Long> documentStatusIds;
	public List<Long> approvalStatusIds;
}
