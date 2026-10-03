package com.platform.orderfleet.order.client;

import java.math.BigDecimal;

public record CatalogProductDto(
    Long id,
    String sku,
    String title,
    BigDecimal price,
    int availableStock,
    boolean active
) {}
