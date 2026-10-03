package com.platform.orderfleet.delivery.dto;

import com.platform.orderfleet.delivery.entity.DeliveryStatus;

import java.time.Instant;
import java.util.List;

public record DeliveryResponse(
    Long id,
    Long orderId,
    Long deliveryPartnerId,
    Long customerUserId,
    Long addressId,
    String pickupLocation,
    String deliveryAddressSnapshot,
    DeliveryStatus status,
    Instant assignedAt,
    Instant pickedUpAt,
    Instant deliveredAt,
    Instant createdAt,
    List<DeliveryLogResponse> logs
) {}
