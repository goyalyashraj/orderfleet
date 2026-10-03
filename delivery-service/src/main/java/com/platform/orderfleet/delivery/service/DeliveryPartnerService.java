package com.platform.orderfleet.delivery.service;

import com.platform.orderfleet.delivery.dto.PartnerResponse;
import com.platform.orderfleet.delivery.dto.RegisterPartnerRequest;
import com.platform.orderfleet.delivery.entity.DeliveryPartner;
import com.platform.orderfleet.delivery.entity.PartnerStatus;
import com.platform.orderfleet.delivery.exception.ResourceNotFoundException;
import com.platform.orderfleet.delivery.repository.DeliveryPartnerRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class DeliveryPartnerService {

    private static final Logger log = LoggerFactory.getLogger(DeliveryPartnerService.class);

    private final DeliveryPartnerRepository partnerRepository;

    public DeliveryPartnerService(DeliveryPartnerRepository partnerRepository) {
        this.partnerRepository = partnerRepository;
    }

    @Transactional
    public PartnerResponse registerPartner(Long userId, RegisterPartnerRequest request) {
        log.info("Onboarding delivery partner for user: {}", userId);

        if (partnerRepository.findByUserId(userId).isPresent()) {
            throw new IllegalArgumentException("Partner already registered with user ID: " + userId);
        }

        DeliveryPartner partner = new DeliveryPartner(
                userId,
                request.partnerName().trim(),
                request.phone().trim(),
                request.vehicleType().trim().toUpperCase(),
                request.latitude(),
                request.longitude()
        );

        DeliveryPartner saved = partnerRepository.save(partner);
        log.info("Delivery partner registered with ID: {}", saved.getId());
        return mapToResponse(saved);
    }

    @Transactional
    public PartnerResponse updateStatus(Long partnerId, PartnerStatus status) {
        DeliveryPartner partner = partnerRepository.findById(partnerId)
                .orElseThrow(() -> new ResourceNotFoundException("Partner not found with ID: " + partnerId));

        partner.setStatus(status);
        DeliveryPartner saved = partnerRepository.save(partner);
        log.info("Partner ID: {} transitioned status to: {}", partnerId, status);
        return mapToResponse(saved);
    }

    @Transactional
    public PartnerResponse updateLocation(Long partnerId, Double lat, Double lng) {
        DeliveryPartner partner = partnerRepository.findById(partnerId)
                .orElseThrow(() -> new ResourceNotFoundException("Partner not found with ID: " + partnerId));

        partner.setCurrentLatitude(lat);
        partner.setCurrentLongitude(lng);
        DeliveryPartner saved = partnerRepository.save(partner);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<PartnerResponse> getAvailablePartners() {
        return partnerRepository.findByStatusAndActiveTrue(PartnerStatus.AVAILABLE).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PartnerResponse getPartnerById(Long id) {
        DeliveryPartner partner = partnerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Partner not found with ID: " + id));
        return mapToResponse(partner);
    }

    @Transactional(readOnly = true)
    public DeliveryPartner getPartnerEntityById(Long id) {
        return partnerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Partner not found with ID: " + id));
    }

    private PartnerResponse mapToResponse(DeliveryPartner p) {
        return new PartnerResponse(
                p.getId(),
                p.getUserId(),
                p.getPartnerName(),
                p.getPhone(),
                p.getVehicleType(),
                p.getStatus(),
                p.getCurrentLatitude(),
                p.getCurrentLongitude(),
                p.isActive(),
                p.getCreatedAt()
        );
    }
}
