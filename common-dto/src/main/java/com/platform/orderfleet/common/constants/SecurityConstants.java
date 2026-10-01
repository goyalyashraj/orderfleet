package com.platform.orderfleet.common.constants;

public final class SecurityConstants {

    private SecurityConstants() {
        // Prevent instantiation
    }

    public static final String HEADER_AUTHORIZATION = "Authorization";
    public static final String TOKEN_PREFIX = "Bearer ";
    
    // Gateway Context Headers propagated to downstream services
    public static final String HEADER_USER_ID = "X-User-Id";
    public static final String HEADER_USER_EMAIL = "X-User-Email";
    public static final String HEADER_USER_ROLES = "X-User-Roles";
    public static final String HEADER_CORRELATION_ID = "X-Correlation-Id";

    // JWT Claims Keys
    public static final String CLAIM_ROLES = "roles";
    public static final String CLAIM_USER_ID = "userId";
    public static final String CLAIM_EMAIL = "email";
}
