package com.eba.propertyconnect.propertymanagement.leasing.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Param;
import org.mybatis.cdi.Mapper;

import com.eba.propertyconnect.propertymanagement.leasing.domain.Customer;

@Mapper
public interface CustomerMapper {

	public Customer getCustomer(Long id);

	public int createCustomer(Customer customer);

	public List<Customer> searchCustomers(@Param("companyId") Long companyId, @Param("search") String search);
}
