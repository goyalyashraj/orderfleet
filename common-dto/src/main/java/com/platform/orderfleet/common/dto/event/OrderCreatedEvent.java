package com.platform.orderfleet.common.dto.event;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record OrderCreatedEvent(
    Long orderId,
    String orderNumber,
    Long userId,
    Long addressId,
    BigDecimal totalAmount,
    String paymentStatus,
    List<OrderItemEventPayload> items,
    Instant createdAt
) {
    public record OrderItemEventPayload(
        Long productId,
        String sku,
        String productTitle,
        BigDecimal unitPrice,
        Integer quantity,
        BigDecimal subtotal
    ) {}
}
