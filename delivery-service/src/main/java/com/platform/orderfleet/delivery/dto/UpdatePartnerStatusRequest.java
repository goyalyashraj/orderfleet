package com.platform.orderfleet.delivery.dto;

import com.platform.orderfleet.delivery.entity.PartnerStatus;
import jakarta.validation.constraints.NotNull;

public record UpdatePartnerStatusRequest(
    @NotNull(message = "Status is required")
    PartnerStatus status
) {}
