package com.platform.orderfleet.delivery.dto;

import java.time.Instant;

public record AddressResponse(
    Long id,
    Long userId,
    String recipientName,
    String phone,
    String streetLine,
    String city,
    String state,
    String postalCode,
    Double latitude,
    Double longitude,
    boolean isDefault,
    Instant createdAt
) {}
