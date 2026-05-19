package com.eba.propertyconnect.propertymanagement.property.domain;

import java.util.Locale;

public enum MasterType {
	PROPERTY("property", "pa_mst_property", false),
	BLOCK("block", "pa_mst_block", true),
	FLOOR("floor", "pa_mst_floor", true),
	UNIT("unit", "pa_mst_unit", true),
	AMENITY("amenity", "pa_mst_amenity", false);

	private final String code;
	private final String tableName;
	private final boolean parentRequired;

	MasterType(String code, String tableName, boolean parentRequired) {
		this.code = code;
		this.tableName = tableName;
		this.parentRequired = parentRequired;
	}

	public String code() {
		return code;
	}

	public String tableName() {
		return tableName;
	}

	public boolean parentRequired() {
		return parentRequired;
	}

	public static MasterType fromCode(String value) {
		if (value == null || value.isBlank()) {
			throw new IllegalArgumentException("Master type is required");
		}
		String normalized = value.trim().toLowerCase(Locale.ROOT);
		for (MasterType type : values()) {
			if (type.code.equals(normalized)) {
				return type;
			}
		}
		throw new IllegalArgumentException("Unsupported master type: " + value);
	}
}
