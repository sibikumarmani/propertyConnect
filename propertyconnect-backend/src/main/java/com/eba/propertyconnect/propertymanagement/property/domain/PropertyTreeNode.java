package com.eba.propertyconnect.propertymanagement.property.domain;

import java.util.ArrayList;
import java.util.List;

public class PropertyTreeNode {

	public Long id;
	public String type;
	public String code;
	public String name;
	public String status;
	public Long parentId;
	public List<PropertyTreeNode> children = new ArrayList<>();
}
