package com.platform.orderfleet.order.dto;

import java.math.BigDecimal;

public record CartItemResponse(
    Long id,
    Long productId,
    String sku,
    String productTitle,
    BigDecimal unitPrice,
    int quantity,
    BigDecimal subtotal
) {}
