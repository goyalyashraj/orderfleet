package com.platform.orderfleet.order.client;

public record StockReservationResultDto(
    String reservationCode,
    Long orderId,
    Long productId,
    int quantity,
    String status
) {}
