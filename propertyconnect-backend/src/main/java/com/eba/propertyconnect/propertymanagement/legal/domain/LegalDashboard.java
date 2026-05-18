package com.eba.propertyconnect.propertymanagement.legal.domain;

import java.util.ArrayList;
import java.util.List;

public class LegalDashboard {

	public int totalCount;
	public int completedCount;
	public int inProgressCount;
	public List<LegalTypeCount> legalTypeCounts = new ArrayList<>();
	public List<LegalCard> cards = new ArrayList<>();

	public static class LegalTypeCount {
		public Long legalTypeId;
		public String legalType;
		public int count;
	}
}
