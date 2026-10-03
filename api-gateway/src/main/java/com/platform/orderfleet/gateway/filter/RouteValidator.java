package com.platform.orderfleet.gateway.filter;

import org.springframework.http.HttpMethod;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class RouteValidator {

    private static final List<String> OPEN_API_ENDPOINTS = List.of(
            "/api/v1/auth/register",
            "/api/v1/auth/login",
            "/api/v1/auth/validate",
            "/actuator"
    );

    public boolean isSecured(ServerHttpRequest request) {
        String path = request.getURI().getPath();
        HttpMethod method = request.getMethod();

        // 1. Fully open endpoints
        if (OPEN_API_ENDPOINTS.stream().anyMatch(path::startsWith)) {
            return false;
        }

        // 2. Public read-only browsing for products and categories
        if (method == HttpMethod.GET && (path.startsWith("/api/v1/products") || path.startsWith("/api/v1/categories"))) {
            return false;
        }

        // All other routes require JWT verification
        return true;
    }
}
