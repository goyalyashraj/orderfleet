package com.platform.orderfleet.catalog.dto;

import com.platform.orderfleet.catalog.entity.ReservationStatus;

import java.time.Instant;

public record StockReservationResponse(
    String reservationCode,
    Long orderId,
    Long productId,
    int quantity,
    ReservationStatus status,
    Instant timestamp
) {}
