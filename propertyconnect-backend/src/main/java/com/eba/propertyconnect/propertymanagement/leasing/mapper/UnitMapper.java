package com.eba.propertyconnect.propertymanagement.leasing.mapper;

import java.math.BigDecimal;
import java.util.List;

import org.apache.ibatis.annotations.Param;
import org.mybatis.cdi.Mapper;

import com.eba.propertyconnect.propertymanagement.leasing.domain.Unit;

@Mapper
public interface UnitMapper {

	public int createUnit(Unit unit);

	public Unit getUnit(Long id);

	public List<Unit> searchAvailableUnits(@Param("propertyId") Long propertyId, @Param("unitType") String unitType, @Param("bedrooms") Integer bedrooms,
			@Param("budgetTo") BigDecimal budgetTo);

	public int updateUnitStatus(@Param("id") Long id, @Param("status") String status, @Param("updatedBy") Long updatedBy);
}
