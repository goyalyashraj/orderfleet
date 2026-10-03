package com.platform.orderfleet.catalog.dto;

import jakarta.validation.constraints.NotNull;

public record StockUpdateRequest(
    @NotNull(message = "Product ID is required")
    Long productId,

    int quantityDelta
) {}
