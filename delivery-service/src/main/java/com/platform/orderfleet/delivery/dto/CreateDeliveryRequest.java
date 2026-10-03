package com.platform.orderfleet.delivery.dto;

import jakarta.validation.constraints.NotNull;

public record CreateDeliveryRequest(
    @NotNull(message = "Order ID is required")
    Long orderId,

    @NotNull(message = "Address ID is required")
    Long addressId,

    String pickupLocation
) {
    public CreateDeliveryRequest {
        if (pickupLocation == null || pickupLocation.isBlank()) {
            pickupLocation = "Central Hub Warehouse, Sector 4";
        }
    }
}
