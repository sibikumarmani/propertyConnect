package com.eba.propertyconnect.propertymanagement.leasing.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Param;
import org.mybatis.cdi.Mapper;

import com.eba.propertyconnect.propertymanagement.leasing.domain.Offer;

@Mapper
public interface OfferMapper {

	public int createOffer(Offer offer);

	public Offer getOffer(Long id);

	public List<Offer> listOffers(@Param("companyId") Long companyId);

	public List<Offer> listOffersByProspect(Long prospectId);

	public int updateOffer(Offer offer);

	public int updateOfferStatus(@Param("id") Long id, @Param("status") Integer status, @Param("updatedBy") Long updatedBy);
}
