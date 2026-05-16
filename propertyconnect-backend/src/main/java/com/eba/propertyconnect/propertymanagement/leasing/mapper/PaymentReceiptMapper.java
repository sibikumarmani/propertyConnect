package com.eba.propertyconnect.propertymanagement.leasing.mapper;

import org.mybatis.cdi.Mapper;

import com.eba.propertyconnect.propertymanagement.leasing.domain.PaymentReceipt;

@Mapper
public interface PaymentReceiptMapper {

	public int createPaymentReceipt(PaymentReceipt receipt);

	public PaymentReceipt getPaymentReceipt(Long id);
}
