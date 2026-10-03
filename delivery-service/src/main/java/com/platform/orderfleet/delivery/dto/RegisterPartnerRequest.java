package com.platform.orderfleet.delivery.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterPartnerRequest(
    @NotBlank(message = "Partner name is required")
    @Size(max = 100, message = "Name cannot exceed 100 characters")
    String partnerName,

    @NotBlank(message = "Phone number is required")
    @Size(max = 20, message = "Phone cannot exceed 20 characters")
    String phone,

    @NotBlank(message = "Vehicle type is required")
    @Size(max = 30, message = "Vehicle type cannot exceed 30 characters")
    String vehicleType,

    Double latitude,

    Double longitude
) {}
