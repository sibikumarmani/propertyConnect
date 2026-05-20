package com.eba.propertyconnect.propertymanagement.db;

import java.sql.Connection;
import java.sql.SQLException;

import javax.sql.DataSource;

import org.apache.ibatis.datasource.pooled.PooledDataSourceFactory;

import com.eba.propertyconnect.propertymanagement.util.ApplicationConfig;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

import jakarta.annotation.PreDestroy;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class PropertyConnectDataSource extends PooledDataSourceFactory {

	private static HikariDataSource hikariDataSource;

	public PropertyConnectDataSource() {
		dataSource = getOrCreateDataSource();
	}

	public Connection getConnection() throws SQLException {
		return getOrCreateDataSource().getConnection();
	}

	public static DataSource dataSource() {
		return getOrCreateDataSource();
	}

	@PreDestroy
	public void close() {
		if (hikariDataSource != null) {
			hikariDataSource.close();
		}
	}

	private static synchronized DataSource getOrCreateDataSource() {
		if (hikariDataSource == null) {
			String jdbcUrl = ApplicationConfig.propertyConnectDbJdbcUrl();
			if (ApplicationConfig.isBlank(jdbcUrl)) {
				throw new IllegalStateException("Missing propertyconnect.db.jdbcUrl configuration");
			}

			HikariConfig config = new HikariConfig();
			config.setPoolName("PropertyConnectPool");
			config.setJdbcUrl(jdbcUrl);
			config.setDriverClassName("com.mysql.cj.jdbc.Driver");
			config.setUsername(ApplicationConfig.propertyConnectDbUsername());
			config.setPassword(ApplicationConfig.propertyConnectDbPassword());
			config.setMaximumPoolSize(ApplicationConfig.propertyConnectDbMaxPoolSize());
			config.setMinimumIdle(1);
			config.setAutoCommit(true);
			hikariDataSource = new HikariDataSource(config);
		}
		return hikariDataSource;
	}
}
