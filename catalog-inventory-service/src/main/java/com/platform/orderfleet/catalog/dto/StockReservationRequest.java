package com.platform.orderfleet.catalog.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record StockReservationRequest(
    @NotNull(message = "Order ID is required")
    Long orderId,

    @NotNull(message = "Product ID is required")
    Long productId,

    @Min(value = 1, message = "Reservation quantity must be at least 1")
    int quantity
) {}
