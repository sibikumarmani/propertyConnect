package com.eba.propertyconnect.propertymanagement.leasing.mapper;

import org.mybatis.cdi.Mapper;

import com.eba.propertyconnect.propertymanagement.leasing.domain.Negotiation;

@Mapper
public interface NegotiationMapper {

	public int createNegotiation(Negotiation negotiation);

	public Negotiation getNegotiation(Long id);
}
