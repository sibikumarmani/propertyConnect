package com.eba.propertyconnect.propertymanagement.leasing.mapper;

import java.math.BigDecimal;
import java.util.List;

import org.apache.ibatis.annotations.Param;
import org.mybatis.cdi.Mapper;

import com.eba.propertyconnect.propertymanagement.leasing.domain.Reservation;

@Mapper
public interface ReservationMapper {

	public int createReservation(Reservation reservation);

	public Reservation getReservation(Long id);

	public int updateReservation(Reservation reservation);

	public List<Reservation> listReservations(@Param("companyId") Long companyId);

	public List<Reservation> listReservationsByProspect(Long prospectId);

	public int updateReservationApproval(@Param("id") Long id, @Param("status") Integer status, @Param("approvalStatus") Integer approvalStatus,
			@Param("updatedBy") Long updatedBy);

	public int updateReservationStatus(@Param("id") Long id, @Param("status") Integer status, @Param("updatedBy") Long updatedBy);

	public int addReservationPayment(@Param("id") Long id, @Param("amount") BigDecimal amount, @Param("status") Integer status, @Param("updatedBy") Long updatedBy);

	public boolean hasActiveReservation(@Param("unitId") Long unitId, @Param("statuses") List<Integer> statuses);
}
