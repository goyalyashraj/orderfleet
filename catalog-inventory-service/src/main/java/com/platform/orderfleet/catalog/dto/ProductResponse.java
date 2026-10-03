package com.platform.orderfleet.catalog.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record ProductResponse(
    Long id,
    String sku,
    String title,
    String description,
    BigDecimal price,
    Long categoryId,
    String categoryName,
    int availableStock,
    boolean active,
    Instant createdAt
) {}
