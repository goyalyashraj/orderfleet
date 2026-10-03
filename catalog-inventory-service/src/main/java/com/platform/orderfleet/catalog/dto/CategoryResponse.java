package com.platform.orderfleet.catalog.dto;

import java.time.Instant;

public record CategoryResponse(
    Long id,
    String name,
    String slug,
    String description,
    Instant createdAt
) {}
