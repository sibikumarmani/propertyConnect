package com.eba.propertyconnect.propertymanagement.legal.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Param;
import org.mybatis.cdi.Mapper;

import com.eba.propertyconnect.propertymanagement.legal.domain.LegalCard;
import com.eba.propertyconnect.propertymanagement.legal.domain.LegalCardAttachment;
import com.eba.propertyconnect.propertymanagement.legal.domain.LegalCardSearch;
import com.eba.propertyconnect.propertymanagement.legal.domain.LegalCardTimeline;

@Mapper
public interface LegalCardMapper {

	public List<LegalCard> searchLegalCards(LegalCardSearch search);

	public LegalCard getLegalCard(Long id);

	public int countByLegalCardNo(@Param("legalCardNo") String legalCardNo, @Param("excludeId") Long excludeId);

	public int insertLegalCard(LegalCard card);

	public int updateLegalCard(LegalCard card);

	public int updateLegalCardEditableFields(LegalCard card);

	public int updateLegalCardStatus(@Param("id") Long id, @Param("statusId") Long statusId, @Param("updatedBy") Long updatedBy);

	public int updateLegalCardCancelStatus(@Param("id") Long id, @Param("documentStatusId") Long documentStatusId, @Param("approvalStatusId") Long approvalStatusId, @Param("updatedBy") Long updatedBy);

	public int deleteAttachments(@Param("legalCardId") Long legalCardId, @Param("companyId") Long companyId);

	public int insertAttachment(LegalCardAttachment attachment);

	public List<LegalCardAttachment> listAttachments(@Param("legalCardId") Long legalCardId, @Param("companyId") Long companyId);

	public int insertTimeline(LegalCardTimeline timeline);

	public List<LegalCardTimeline> listTimeline(@Param("legalCardId") Long legalCardId, @Param("companyId") Long companyId);
}
