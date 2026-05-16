package com.eba.propertyconnect.propertymanagement.leasing.domain;

import java.util.Date;

public class StatusHistory {

	public Long id;
	public String entityType;
	public Long entityId;
	public String fromStatus;
	public String toStatus;
	public String comments;
	public Long changedBy;
	public Date changedAt;
}
