package com.platform.orderfleet.delivery.dto;

import com.platform.orderfleet.delivery.entity.DeliveryStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateDeliveryStatusRequest(
    @NotNull(message = "Target delivery status is required")
    DeliveryStatus status,

    String note
) {}
