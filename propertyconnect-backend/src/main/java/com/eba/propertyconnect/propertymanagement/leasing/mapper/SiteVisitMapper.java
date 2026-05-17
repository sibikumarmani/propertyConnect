package com.eba.propertyconnect.propertymanagement.leasing.mapper;

import java.util.List;

import org.mybatis.cdi.Mapper;

import com.eba.propertyconnect.propertymanagement.leasing.domain.SiteVisit;

@Mapper
public interface SiteVisitMapper {

	public int createSiteVisit(SiteVisit siteVisit);

	public SiteVisit getSiteVisit(Long id);

	public List<SiteVisit> listSiteVisitsByProspect(Long prospectId);

	public int updateSiteVisit(SiteVisit siteVisit);
}
