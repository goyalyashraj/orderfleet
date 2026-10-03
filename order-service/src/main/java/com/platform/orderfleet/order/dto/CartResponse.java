package com.platform.orderfleet.order.dto;

import java.math.BigDecimal;
import java.util.List;

public record CartResponse(
    Long cartId,
    Long userId,
    List<CartItemResponse> items,
    BigDecimal totalAmount,
    int totalItemCount
) {}
