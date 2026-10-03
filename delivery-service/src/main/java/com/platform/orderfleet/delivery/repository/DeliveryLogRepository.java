package com.platform.orderfleet.delivery.repository;

import com.platform.orderfleet.delivery.entity.DeliveryLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DeliveryLogRepository extends JpaRepository<DeliveryLog, Long> {
    List<DeliveryLog> findByDeliveryIdOrderByTimestampAsc(Long deliveryId);
}
