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

	public int updateReservationApproval(@Param("id") Long id, @Param("status") String status, @Param("approvalStatus") String approvalStatus,
			@Param("updatedBy") Long updatedBy);

	public int updateReservationStatus(@Param("id") Long id, @Param("status") String status, @Param("updatedBy") Long updatedBy);

	public int addReservationPayment(@Param("id") Long id, @Param("amount") BigDecimal amount, @Param("updatedBy") Long updatedBy);

	public boolean hasActiveReservation(Long unitId);
}
