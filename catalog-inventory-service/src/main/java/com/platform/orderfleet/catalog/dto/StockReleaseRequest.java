package com.platform.orderfleet.catalog.dto;

import jakarta.validation.constraints.NotBlank;

public record StockReleaseRequest(
    @NotBlank(message = "Reservation code is required")
    String reservationCode
) {}
