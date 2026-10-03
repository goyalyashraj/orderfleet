package com.platform.orderfleet.catalog.dto;

import java.time.Instant;

public record InventoryResponse(
    Long productId,
    int availableQuantity,
    int reservedQuantity,
    int totalQuantity,
    Long version,
    Instant updatedAt
) {}
