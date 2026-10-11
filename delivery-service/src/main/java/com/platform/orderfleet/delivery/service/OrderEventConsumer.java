package com.platform.orderfleet.delivery.service;

import com.platform.orderfleet.common.dto.event.OrderCreatedEvent;
import com.platform.orderfleet.delivery.entity.Address;
import com.platform.orderfleet.delivery.entity.Delivery;
import com.platform.orderfleet.delivery.entity.DeliveryLog;
import com.platform.orderfleet.delivery.entity.DeliveryStatus;
import com.platform.orderfleet.delivery.repository.AddressRepository;
import com.platform.orderfleet.delivery.repository.DeliveryLogRepository;
import com.platform.orderfleet.delivery.repository.DeliveryRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderEventConsumer {

    private static final Logger log = LoggerFactory.getLogger(OrderEventConsumer.class);

    private final DeliveryRepository deliveryRepository;
    private final DeliveryLogRepository logRepository;
    private final AddressRepository addressRepository;

    public OrderEventConsumer(DeliveryRepository deliveryRepository,
                              DeliveryLogRepository logRepository,
                              AddressRepository addressRepository) {
        this.deliveryRepository = deliveryRepository;
        this.logRepository = logRepository;
        this.addressRepository = addressRepository;
    }

    @KafkaListener(topics = "order.created", groupId = "delivery-service-group")
    @Transactional
    public void handleOrderCreated(OrderCreatedEvent event) {
        log.info("Kafka Consumer received OrderCreatedEvent for Order ID: {}, Order Number: {}, Amount: ${}",
                event.orderId(), event.orderNumber(), event.totalAmount());

        // Idempotency guard: prevent duplicate deliveries on Kafka rebalance or redelivery
        if (deliveryRepository.findByOrderId(event.orderId()).isPresent()) {
            log.warn("Delivery already exists for Order ID: {}. Skipping duplicate Kafka event.", event.orderId());
            return;
        }

        String addressSnapshot = "Default Customer Delivery Location";
        if (event.addressId() != null) {
            addressSnapshot = addressRepository.findById(event.addressId())
                    .map(Address::toFormattedAddress)
                    .orElse("Address Record #" + event.addressId() + " (Auto-resolved from Order)");
        }

        String pickupLocation = "OrderFleet Central Distribution Center - Bay 12";

        Delivery delivery = new Delivery(
                event.orderId(),
                event.userId(),
                event.addressId() != null ? event.addressId() : 1L,
                pickupLocation,
                addressSnapshot
        );

        Delivery saved = deliveryRepository.save(delivery);

        DeliveryLog deliveryLog = new DeliveryLog(
                saved.getId(),
                DeliveryStatus.PENDING,
                String.format("Asynchronous dispatch triggered via Kafka event for Order %s. Awaiting rider assignment.",
                        event.orderNumber())
        );
        logRepository.save(deliveryLog);

        log.info("Successfully provisioned Delivery ID: {} for Order ID: {} via Kafka event choreography.",
                saved.getId(), event.orderId());
    }
}
