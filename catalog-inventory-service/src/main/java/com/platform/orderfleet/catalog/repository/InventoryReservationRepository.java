package com.platform.orderfleet.catalog.repository;

import com.platform.orderfleet.catalog.entity.InventoryReservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryReservationRepository extends JpaRepository<InventoryReservation, Long> {
    Optional<InventoryReservation> findByReservationCode(String reservationCode);
    List<InventoryReservation> findByOrderId(Long orderId);
}
