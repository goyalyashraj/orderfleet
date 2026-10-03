package com.platform.orderfleet.delivery.dto;

import jakarta.validation.constraints.NotNull;

public record UpdatePartnerLocationRequest(
    @NotNull(message = "Latitude is required")
    Double latitude,

    @NotNull(message = "Longitude is required")
    Double longitude
) {}
