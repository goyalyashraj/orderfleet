package com.platform.orderfleet.delivery.dto;

import com.platform.orderfleet.delivery.entity.DeliveryStatus;

import java.time.Instant;

public record DeliveryLogResponse(
    DeliveryStatus status,
    String note,
    Instant timestamp
) {}
