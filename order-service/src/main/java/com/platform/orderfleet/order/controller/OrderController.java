package com.platform.orderfleet.order.controller;

import com.platform.orderfleet.common.constants.SecurityConstants;
import com.platform.orderfleet.common.dto.ApiResponse;
import com.platform.orderfleet.order.dto.CheckoutRequest;
import com.platform.orderfleet.order.dto.OrderResponse;
import com.platform.orderfleet.order.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/orders")
@Tag(name = "Order Processing & Checkout", description = "Endpoints for checkout orchestration, payment simulation, and order tracking")
public class OrderController {

    private final OrderService orderService;
    private final com.platform.orderfleet.order.service.IdempotencyService idempotencyService;

    public OrderController(OrderService orderService,
                           com.platform.orderfleet.order.service.IdempotencyService idempotencyService) {
        this.orderService = orderService;
        this.idempotencyService = idempotencyService;
    }

    @PostMapping("/checkout")
    @Operation(summary = "Execute order checkout", description = "Synchronously reserves stock with catalog service and simulates payment with Redis distributed idempotency")
    public ResponseEntity<ApiResponse<OrderResponse>> checkout(
            @RequestHeader(value = SecurityConstants.HEADER_USER_ID, defaultValue = "1") Long userId,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @Valid @RequestBody CheckoutRequest request) {

        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            Optional<OrderResponse> cached = idempotencyService.getCachedResponse(idempotencyKey);
            if (cached.isPresent()) {
                return ResponseEntity.ok(ApiResponse.success(cached.get(), "Order retrieved from idempotent cache"));
            }

            boolean lockAcquired = idempotencyService.acquireProcessingLock(idempotencyKey, Duration.ofSeconds(30));
            if (!lockAcquired) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(ApiResponse.error("Concurrent checkout with this Idempotency-Key is currently in progress"));
            }
        }

        try {
            OrderResponse response = orderService.checkout(userId, request);
            if (idempotencyKey != null && !idempotencyKey.isBlank()) {
                idempotencyService.saveResponse(idempotencyKey, response, Duration.ofHours(24));
            }
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.created(response, "Order placed and confirmed successfully"));
        } catch (RuntimeException ex) {
            if (idempotencyKey != null && !idempotencyKey.isBlank()) {
                idempotencyService.releaseProcessingLock(idempotencyKey);
            }
            throw ex;
        }
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get order by ID", description = "Returns full order details including line items and current status")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderById(
            @PathVariable Long id,
            @RequestHeader(value = SecurityConstants.HEADER_USER_ID, defaultValue = "1") Long userId) {
        OrderResponse response = orderService.getOrderById(id, userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/my-orders")
    @Operation(summary = "List customer order history", description = "Returns all historical orders for current user ordered by date")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getMyOrders(
            @RequestHeader(value = SecurityConstants.HEADER_USER_ID, defaultValue = "1") Long userId) {
        List<OrderResponse> orders = orderService.getUserOrders(userId);
        return ResponseEntity.ok(ApiResponse.success(orders));
    }

    @GetMapping("/admin/all")
    @Operation(summary = "List all customer orders", description = "Admin view of all customer orders across the platform")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getAllOrders() {
        List<OrderResponse> orders = orderService.getAllOrders();
        return ResponseEntity.ok(ApiResponse.success(orders, "All platform orders retrieved successfully"));
    }
}
