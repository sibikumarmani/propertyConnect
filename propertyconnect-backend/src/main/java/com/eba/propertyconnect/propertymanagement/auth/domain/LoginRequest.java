package com.eba.propertyconnect.propertymanagement.auth.domain;

public class LoginRequest {

	private String loginId;
	private String password;
	private boolean rememberMe;
	private String impersonateLoginId;
	private String superUserPassword;

	public String getLoginId() {
		return loginId;
	}

	public String getPassword() {
		return password;
	}

	public boolean isRememberMe() {
		return rememberMe;
	}

	public String getImpersonateLoginId() {
		return impersonateLoginId;
	}

	public String getSuperUserPassword() {
		return superUserPassword;
	}

	public void setLoginId(String loginId) {
		this.loginId = loginId;
	}

	public void setPassword(String password) {
		this.password = password;
	}

	public void setRememberMe(boolean rememberMe) {
		this.rememberMe = rememberMe;
	}

	public void setImpersonateLoginId(String impersonateLoginId) {
		this.impersonateLoginId = impersonateLoginId;
	}

	public void setSuperUserPassword(String superUserPassword) {
		this.superUserPassword = superUserPassword;
	}
}
