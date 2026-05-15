package com.eba.propertyconnect.propertymanagement.auth.domain;

import java.util.Map;

public class CompanySelectionRequest {

	private Integer clientId;
	private Integer companyId;
	private String loggedInUserTimeZone;
	private Integer selectedCompanyId;
	private Integer selectedGroupCompanyId;
	private String selectedCompanyTimeZone;
	private Integer userCompanyId;
	private Map<String, Object> userProfile;

	public Integer getClientId() {
		return clientId;
	}

	public Integer getCompanyId() {
		return companyId;
	}

	public String getLoggedInUserTimeZone() {
		return loggedInUserTimeZone;
	}

	public Integer getSelectedCompanyId() {
		return selectedCompanyId;
	}

	public Integer getSelectedGroupCompanyId() {
		return selectedGroupCompanyId;
	}

	public String getSelectedCompanyTimeZone() {
		return selectedCompanyTimeZone;
	}

	public Integer getUserCompanyId() {
		return userCompanyId;
	}

	public Map<String, Object> getUserProfile() {
		return userProfile;
	}

	public void setClientId(Integer clientId) {
		this.clientId = clientId;
	}

	public void setCompanyId(Integer companyId) {
		this.companyId = companyId;
	}

	public void setLoggedInUserTimeZone(String loggedInUserTimeZone) {
		this.loggedInUserTimeZone = loggedInUserTimeZone;
	}

	public void setSelectedCompanyId(Integer selectedCompanyId) {
		this.selectedCompanyId = selectedCompanyId;
	}

	public void setSelectedGroupCompanyId(Integer selectedGroupCompanyId) {
		this.selectedGroupCompanyId = selectedGroupCompanyId;
	}

	public void setSelectedCompanyTimeZone(String selectedCompanyTimeZone) {
		this.selectedCompanyTimeZone = selectedCompanyTimeZone;
	}

	public void setUserCompanyId(Integer userCompanyId) {
		this.userCompanyId = userCompanyId;
	}

	public void setUserProfile(Map<String, Object> userProfile) {
		this.userProfile = userProfile;
	}
}
