package com.eba.propertyconnect.propertymanagement.leasing.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Param;
import org.mybatis.cdi.Mapper;

import com.eba.propertyconnect.propertymanagement.leasing.domain.StatusHistory;

@Mapper
public interface StatusHistoryMapper {

	public int insertHistory(@Param("entityType") String entityType, @Param("entityId") Long entityId, @Param("fromStatus") String fromStatus,
			@Param("toStatus") String toStatus, @Param("comments") String comments, @Param("changedBy") Long changedBy);

	public List<StatusHistory> listEntityHistory(@Param("entityType") String entityType, @Param("entityId") Long entityId);
}
