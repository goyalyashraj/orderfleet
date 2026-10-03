package com.platform.orderfleet.gateway.filter;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.platform.orderfleet.common.constants.SecurityConstants;
import com.platform.orderfleet.common.dto.ErrorResponse;
import com.platform.orderfleet.gateway.config.GatewayJwtProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

@Component
public class JwtAuthenticationFilter implements GlobalFilter, Ordered {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final RouteValidator routeValidator;
    private final GatewayJwtProperties jwtProperties;
    private final ObjectMapper objectMapper;
    private SecretKey secretKey;

    public JwtAuthenticationFilter(RouteValidator routeValidator,
                                   GatewayJwtProperties jwtProperties,
                                   ObjectMapper objectMapper) {
        this.routeValidator = routeValidator;
        this.jwtProperties = jwtProperties;
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    public void init() {
        byte[] keyBytes = jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8);
        this.secretKey = Keys.hmacShaKeyFor(keyBytes);
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getURI().getPath();

        // 1. Generate or forward correlation ID for distributed tracing
        String correlationId = request.getHeaders().getFirst(SecurityConstants.HEADER_CORRELATION_ID);
        if (!StringUtils.hasText(correlationId)) {
            correlationId = UUID.randomUUID().toString();
        }

        // 2. Check if route is public
        if (!routeValidator.isSecured(request)) {
            ServerHttpRequest mutatedRequest = request.mutate()
                    .header(SecurityConstants.HEADER_CORRELATION_ID, correlationId)
                    .build();
            return chain.filter(exchange.mutate().request(mutatedRequest).build());
        }

        // 3. Protected route: inspect Authorization header
        String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (!StringUtils.hasText(authHeader) || !authHeader.startsWith(SecurityConstants.TOKEN_PREFIX)) {
            log.warn("Unauthorized perimeter access attempt to {}: Missing or malformed Bearer token", path);
            return onError(exchange, "Full authentication is required to access: " + path, HttpStatus.UNAUTHORIZED);
        }

        String token = authHeader.substring(SecurityConstants.TOKEN_PREFIX.length()).trim();

        // 4. Validate JWT signature and claims
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(secretKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            Object userIdObj = claims.get(SecurityConstants.CLAIM_USER_ID);
            String userId = userIdObj != null ? userIdObj.toString() : "";
            String email = claims.getSubject();

            @SuppressWarnings("unchecked")
            List<String> rolesList = claims.get(SecurityConstants.CLAIM_ROLES, List.class);
            String roles = rolesList != null ? String.join(",", rolesList) : "";

            log.debug("Perimeter authenticated user {} (ID: {}) for path {}", email, userId, path);

            // 5. Mutate downstream request with trusted user context headers
            ServerHttpRequest mutatedRequest = request.mutate()
                    .header(SecurityConstants.HEADER_USER_ID, userId)
                    .header(SecurityConstants.HEADER_USER_EMAIL, email)
                    .header(SecurityConstants.HEADER_USER_ROLES, roles)
                    .header(SecurityConstants.HEADER_CORRELATION_ID, correlationId)
                    .build();

            return chain.filter(exchange.mutate().request(mutatedRequest).build());

        } catch (Exception ex) {
            log.error("JWT validation failed at perimeter: {}", ex.getMessage());
            return onError(exchange, "Invalid or expired JWT token: " + ex.getMessage(), HttpStatus.UNAUTHORIZED);
        }
    }

    private Mono<Void> onError(ServerWebExchange exchange, String message, HttpStatus status) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(status);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);

        ErrorResponse errorResponse = ErrorResponse.of(
                status.value(),
                status.getReasonPhrase(),
                message,
                exchange.getRequest().getURI().getPath()
        );

        byte[] bytes;
        try {
            bytes = objectMapper.writeValueAsBytes(errorResponse);
        } catch (JsonProcessingException e) {
            bytes = "{\"error\":\"Unauthorized\"}".getBytes(StandardCharsets.UTF_8);
        }

        DataBuffer buffer = response.bufferFactory().wrap(bytes);
        return response.writeWith(Mono.just(buffer));
    }

    @Override
    public int getOrder() {
        return -1; // Execute before default routing filters
    }
}
