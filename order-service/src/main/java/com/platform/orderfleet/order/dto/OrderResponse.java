package com.platform.orderfleet.order.dto;

import com.platform.orderfleet.order.entity.OrderStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record OrderResponse(
    Long orderId,
    String orderNumber,
    Long userId,
    Long addressId,
    BigDecimal totalAmount,
    OrderStatus status,
    String paymentStatus,
    String reservationCode,
    List<OrderItemResponse> items,
    Instant createdAt
) {}
