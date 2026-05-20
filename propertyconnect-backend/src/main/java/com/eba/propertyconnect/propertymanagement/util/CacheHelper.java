package com.eba.propertyconnect.propertymanagement.util;

import org.apache.commons.jcs3.JCS;
import org.apache.commons.jcs3.access.CacheAccess;
import org.apache.commons.jcs3.access.exception.CacheException;

public class CacheHelper {

	public enum CacheRegion {
		companyCache, globalCache, shortCache
	}

	public static final String APPLICATION_CACHE = "A";

	public static final String COMPANY_CACHE = "C";

	public static final String GET_LEASING_LEADS = "getLeasingLeads";

	public static final String GET_LEASING_PROSPECTS = "getLeasingProspects";

	public static final String GET_LEASING_OFFERS = "getLeasingOffers";

	public static final String GET_LEASING_RESERVATIONS = "getLeasingReservations";

	public static final String GET_LEASING_AVAILABLE_UNITS = "getLeasingAvailableUnits";

	private static CacheAccess<Object, Object> companyCache;

	private static CacheAccess<Object, Object> globalCache;

	private static CacheAccess<Object, Object> shortCache;

	static {
		init();
	}

	private CacheHelper() {
	}

	private static void init() {
		try {
			if (companyCache == null) {
				companyCache = JCS.getInstance(CacheRegion.companyCache.toString());
			}
			if (globalCache == null) {
				globalCache = JCS.getInstance("default");
			}
			if (shortCache == null) {
				shortCache = JCS.getInstance(CacheRegion.shortCache.toString());
			}
		}
		catch (CacheException e) {
			throw new IllegalStateException("Unable to initialize PropertyConnect cache", e);
		}
	}

	public static void clear(CacheRegion region) {
		try {
			cache(region).clear();
		}
		catch (CacheException e) {
			throw new IllegalStateException("Unable to clear cache region " + region, e);
		}
	}

	public static void clearAll() {
		clear(CacheRegion.companyCache);
		clear(CacheRegion.globalCache);
		clear(CacheRegion.shortCache);
	}

	public static void clearCompanyCache() {
		clear(CacheRegion.companyCache);
	}

	public static void clearDefaultCache() {
		clear(CacheRegion.globalCache);
	}

	public static void clearShortLivedCache() {
		clear(CacheRegion.shortCache);
	}

	public static String getCacheKey(String methodName, Long value) {
		return methodName + ":" + value;
	}

	public static String getCacheKey(String key1, String key2) {
		return key1 + ":" + key2;
	}

	public static Object getCompanyCache(String key) {
		return get(CacheRegion.companyCache, key);
	}

	public static Object getGlobalCache(String key) {
		return get(CacheRegion.globalCache, key);
	}

	public static Object getShortLivedCache(String key) {
		return get(CacheRegion.shortCache, key);
	}

	public static void putCompanyCache(String key, Object value) {
		put(CacheRegion.companyCache, key, value);
	}

	public static void putGlobalCache(String key, Object value) {
		put(CacheRegion.globalCache, key, value);
	}

	public static void putShortLivedCache(String key, Object value) {
		put(CacheRegion.shortCache, key, value);
	}

	public static void removeCompanyCache(String key) {
		remove(CacheRegion.companyCache, key);
	}

	public static void removeGlobalCache(String key) {
		remove(CacheRegion.globalCache, key);
	}

	public static void removeShortLivedCache(String key) {
		remove(CacheRegion.shortCache, key);
	}

	private static Object get(CacheRegion region, String key) {
		return cache(region).get(key);
	}

	private static void put(CacheRegion region, String key, Object value) {
		try {
			cache(region).put(key, value);
		}
		catch (CacheException e) {
			throw new IllegalStateException("Unable to put cache key " + key, e);
		}
	}

	private static void remove(CacheRegion region, String key) {
		try {
			cache(region).remove(key);
		}
		catch (CacheException e) {
			throw new IllegalStateException("Unable to remove cache key " + key, e);
		}
	}

	private static CacheAccess<Object, Object> cache(CacheRegion region) {
		init();
		switch (region) {
		case companyCache:
			return companyCache;
		case globalCache:
			return globalCache;
		case shortCache:
			return shortCache;
		default:
			throw new IllegalArgumentException("Unsupported cache region " + region);
		}
	}
}
