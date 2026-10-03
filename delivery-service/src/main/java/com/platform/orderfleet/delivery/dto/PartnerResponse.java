package com.platform.orderfleet.delivery.dto;

import com.platform.orderfleet.delivery.entity.PartnerStatus;

import java.time.Instant;

public record PartnerResponse(
    Long id,
    Long userId,
    String partnerName,
    String phone,
    String vehicleType,
    PartnerStatus status,
    Double latitude,
    Double longitude,
    boolean active,
    Instant createdAt
) {}
