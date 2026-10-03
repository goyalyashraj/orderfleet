package com.platform.orderfleet.gateway.filter;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RouteValidatorTest {

    private RouteValidator routeValidator;

    @BeforeEach
    void setUp() {
        routeValidator = new RouteValidator();
    }

    @Test
    @DisplayName("Should treat auth registration and login as open routes")
    void testOpenAuthRoutes() {
        MockServerHttpRequest req1 = MockServerHttpRequest.post("/api/v1/auth/register").build();
        MockServerHttpRequest req2 = MockServerHttpRequest.post("/api/v1/auth/login").build();

        assertFalse(routeValidator.isSecured(req1));
        assertFalse(routeValidator.isSecured(req2));
    }

    @Test
    @DisplayName("Should treat GET /api/v1/products as open route but POST as secured")
    void testProductRoutes() {
        MockServerHttpRequest getReq = MockServerHttpRequest.get("/api/v1/products").build();
        MockServerHttpRequest postReq = MockServerHttpRequest.post("/api/v1/products").build();

        assertFalse(routeValidator.isSecured(getReq));
        assertTrue(routeValidator.isSecured(postReq));
    }

    @Test
    @DisplayName("Should treat cart and orders as secured routes")
    void testOrderAndCartRoutes() {
        MockServerHttpRequest cartReq = MockServerHttpRequest.get("/api/v1/cart").build();
        MockServerHttpRequest orderReq = MockServerHttpRequest.post("/api/v1/orders/checkout").build();

        assertTrue(routeValidator.isSecured(cartReq));
        assertTrue(routeValidator.isSecured(orderReq));
    }
}
