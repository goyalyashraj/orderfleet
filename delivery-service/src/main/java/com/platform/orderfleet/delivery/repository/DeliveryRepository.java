package com.platform.orderfleet.delivery.repository;

import com.platform.orderfleet.delivery.entity.Delivery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeliveryRepository extends JpaRepository<Delivery, Long> {
    Optional<Delivery> findByOrderId(Long orderId);
    List<Delivery> findByDeliveryPartnerIdOrderByCreatedAtDesc(Long deliveryPartnerId);
    List<Delivery> findByCustomerUserIdOrderByCreatedAtDesc(Long customerUserId);
}
