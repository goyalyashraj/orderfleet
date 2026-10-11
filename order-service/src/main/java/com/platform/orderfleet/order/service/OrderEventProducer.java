package com.platform.orderfleet.order.service;

import com.platform.orderfleet.common.dto.event.OrderCreatedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;

@Service
public class OrderEventProducer {

    private static final Logger log = LoggerFactory.getLogger(OrderEventProducer.class);
    public static final String ORDER_CREATED_TOPIC = "order.created";

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public OrderEventProducer(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void publishOrderCreated(OrderCreatedEvent event) {
        log.info("Publishing OrderCreatedEvent to Kafka topic '{}' for Order ID: {}, Order Number: {}",
                ORDER_CREATED_TOPIC, event.orderId(), event.orderNumber());

        CompletableFuture<SendResult<String, Object>> future =
                kafkaTemplate.send(ORDER_CREATED_TOPIC, String.valueOf(event.orderId()), event);

        future.whenComplete((result, ex) -> {
            if (ex != null) {
                log.error("Failed to publish OrderCreatedEvent for Order ID: {} due to: {}",
                        event.orderId(), ex.getMessage(), ex);
            } else {
                log.info("Successfully published OrderCreatedEvent for Order ID: {} at partition: {}, offset: {}",
                        event.orderId(),
                        result.getRecordMetadata().partition(),
                        result.getRecordMetadata().offset());
            }
        });
    }
}
