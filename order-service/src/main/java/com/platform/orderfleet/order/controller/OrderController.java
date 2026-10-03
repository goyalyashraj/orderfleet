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

import java.util.List;

@RestController
@RequestMapping("/api/v1/orders")
@Tag(name = "Order Processing & Checkout", description = "Endpoints for checkout orchestration, payment simulation, and order tracking")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping("/checkout")
    @Operation(summary = "Execute order checkout", description = "Synchronously reserves stock with catalog service and simulates payment")
    public ResponseEntity<ApiResponse<OrderResponse>> checkout(
            @RequestHeader(value = SecurityConstants.HEADER_USER_ID, defaultValue = "1") Long userId,
            @Valid @RequestBody CheckoutRequest request) {
        OrderResponse response = orderService.checkout(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(response, "Order placed and confirmed successfully"));
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
}
