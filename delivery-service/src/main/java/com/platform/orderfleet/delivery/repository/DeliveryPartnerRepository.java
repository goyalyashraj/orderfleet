package com.platform.orderfleet.delivery.repository;

import com.platform.orderfleet.delivery.entity.DeliveryPartner;
import com.platform.orderfleet.delivery.entity.PartnerStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeliveryPartnerRepository extends JpaRepository<DeliveryPartner, Long> {
    Optional<DeliveryPartner> findByUserId(Long userId);
    List<DeliveryPartner> findByStatusAndActiveTrue(PartnerStatus status);
}
