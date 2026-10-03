package com.platform.orderfleet.order.dto;

import jakarta.validation.constraints.NotNull;

public record CheckoutRequest(
    @NotNull(message = "Address ID is required")
    Long addressId,

    String paymentMethod,

    boolean simulatePaymentSuccess
) {
    public CheckoutRequest {
        if (paymentMethod == null || paymentMethod.isBlank()) {
            paymentMethod = "CARD";
        }
    }
}
