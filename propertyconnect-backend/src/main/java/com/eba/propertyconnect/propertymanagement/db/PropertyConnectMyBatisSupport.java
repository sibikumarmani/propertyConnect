package com.eba.propertyconnect.propertymanagement.db;

import java.io.InputStream;

import org.apache.ibatis.io.Resources;
import org.apache.ibatis.mapping.Environment;
import org.apache.ibatis.session.SqlSessionFactory;
import org.apache.ibatis.session.SqlSessionFactoryBuilder;
import org.apache.ibatis.transaction.jdbc.JdbcTransactionFactory;
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
			SqlSessionFactory factory = new SqlSessionFactoryBuilder().build(inputStream);
			factory.getConfiguration().setEnvironment(new Environment(
					"propertyconnect",
					new JdbcTransactionFactory(),
					PropertyConnectDataSource.dataSource()));
			return factory;
		}
	}
}
