package com.eba.propertyconnect.propertymanagement.db;

import java.io.InputStream;

import org.apache.ibatis.io.Resources;
import org.apache.ibatis.session.SqlSessionFactory;
import org.apache.ibatis.session.SqlSessionFactoryBuilder;
import org.mybatis.cdi.SessionFactoryProvider;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Produces;

@ApplicationScoped
public class PropertyConnectMyBatisSupport {

	@Produces
	@ApplicationScoped
	@SessionFactoryProvider
	public SqlSessionFactory produceFactory() throws Exception {
		try (InputStream inputStream = Resources.getResourceAsStream("mybatis-config.xml")) {
			return new SqlSessionFactoryBuilder().build(inputStream);
		}
	}
}
