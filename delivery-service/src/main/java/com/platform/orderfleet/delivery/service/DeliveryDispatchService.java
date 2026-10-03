package com.platform.orderfleet.delivery.service;

import com.platform.orderfleet.delivery.dto.CreateDeliveryRequest;
import com.platform.orderfleet.delivery.dto.DeliveryLogResponse;
import com.platform.orderfleet.delivery.dto.DeliveryResponse;
import com.platform.orderfleet.delivery.dto.UpdateDeliveryStatusRequest;
import com.platform.orderfleet.delivery.entity.*;
import com.platform.orderfleet.delivery.exception.InvalidDeliveryStateException;
import com.platform.orderfleet.delivery.exception.PartnerNotAvailableException;
import com.platform.orderfleet.delivery.exception.ResourceNotFoundException;
import com.platform.orderfleet.delivery.repository.AddressRepository;
import com.platform.orderfleet.delivery.repository.DeliveryLogRepository;
import com.platform.orderfleet.delivery.repository.DeliveryPartnerRepository;
import com.platform.orderfleet.delivery.repository.DeliveryRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class DeliveryDispatchService {

    private static final Logger log = LoggerFactory.getLogger(DeliveryDispatchService.class);

    private final DeliveryRepository deliveryRepository;
    private final DeliveryLogRepository logRepository;
    private final DeliveryPartnerRepository partnerRepository;
    private final AddressRepository addressRepository;

    public DeliveryDispatchService(DeliveryRepository deliveryRepository,
                                   DeliveryLogRepository logRepository,
                                   DeliveryPartnerRepository partnerRepository,
                                   AddressRepository addressRepository) {
        this.deliveryRepository = deliveryRepository;
        this.logRepository = logRepository;
        this.partnerRepository = partnerRepository;
        this.addressRepository = addressRepository;
    }

    @Transactional
    public DeliveryResponse createDelivery(Long customerUserId, CreateDeliveryRequest request) {
        log.info("Creating dispatch task for Order ID: {} by customer: {}", request.orderId(), customerUserId);

        if (deliveryRepository.findByOrderId(request.orderId()).isPresent()) {
            throw new IllegalArgumentException("Delivery already exists for Order ID: " + request.orderId());
        }

        Address address = addressRepository.findById(request.addressId())
                .orElseThrow(() -> new ResourceNotFoundException("Address not found with ID: " + request.addressId()));

        String addressSnapshot = address.toFormattedAddress();

        Delivery delivery = new Delivery(
                request.orderId(),
                customerUserId,
                request.addressId(),
                request.pickupLocation(),
                addressSnapshot
        );

        Delivery saved = deliveryRepository.save(delivery);
        logRepository.save(new DeliveryLog(saved.getId(), DeliveryStatus.PENDING, "Delivery order created and awaiting assignment"));

        log.info("Delivery task initialized with ID: {}", saved.getId());
        return mapToResponse(saved);
    }

    @Transactional
    public DeliveryResponse assignDelivery(Long deliveryId, Long partnerId) {
        log.info("Assigning Delivery ID: {} to Partner ID: {}", deliveryId, partnerId);

        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery not found with ID: " + deliveryId));

        if (delivery.getStatus() != DeliveryStatus.PENDING) {
            throw new InvalidDeliveryStateException("Cannot assign delivery in status: " + delivery.getStatus());
        }

        DeliveryPartner partner = partnerRepository.findById(partnerId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery partner not found with ID: " + partnerId));

        if (partner.getStatus() != PartnerStatus.AVAILABLE) {
            throw new PartnerNotAvailableException(String.format(
                    "Partner %s is currently %s and cannot accept new deliveries",
                    partner.getPartnerName(), partner.getStatus()));
        }

        // Atomically lock partner to BUSY
        partner.setStatus(PartnerStatus.BUSY);
        partnerRepository.save(partner);

        delivery.setDeliveryPartnerId(partnerId);
        delivery.setStatus(DeliveryStatus.ASSIGNED);
        delivery.setAssignedAt(Instant.now());
        Delivery saved = deliveryRepository.save(delivery);

        logRepository.save(new DeliveryLog(
                saved.getId(),
                DeliveryStatus.ASSIGNED,
                "Assigned to partner " + partner.getPartnerName() + " (Vehicle: " + partner.getVehicleType() + ")"
        ));

        log.info("Delivery ID: {} assigned successfully to partner: {}", deliveryId, partner.getPartnerName());
        return mapToResponse(saved);
    }

    @Transactional
    public DeliveryResponse updateDeliveryStatus(Long deliveryId, Long partnerId, UpdateDeliveryStatusRequest request) {
        log.info("Updating Delivery ID: {} to status: {} by partner: {}", deliveryId, request.status(), partnerId);

        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery not found with ID: " + deliveryId));

        if (delivery.getDeliveryPartnerId() == null || !delivery.getDeliveryPartnerId().equals(partnerId)) {
            throw new IllegalArgumentException("Delivery is not assigned to partner ID: " + partnerId);
        }

        validateStateTransition(delivery.getStatus(), request.status());

        delivery.setStatus(request.status());

        if (request.status() == DeliveryStatus.PICKED_UP) {
            delivery.setPickedUpAt(Instant.now());
        } else if (request.status() == DeliveryStatus.DELIVERED) {
            delivery.setDeliveredAt(Instant.now());

            // Release partner back to AVAILABLE pool
            partnerRepository.findById(partnerId).ifPresent(p -> {
                p.setStatus(PartnerStatus.AVAILABLE);
                partnerRepository.save(p);
                log.info("Partner ID: {} returned to AVAILABLE status", partnerId);
            });
        }

        Delivery saved = deliveryRepository.save(delivery);
        String note = request.note() != null ? request.note() : "Status updated to " + request.status();
        logRepository.save(new DeliveryLog(saved.getId(), request.status(), note));

        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public DeliveryResponse getDeliveryByOrderId(Long orderId) {
        Delivery delivery = deliveryRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("No delivery task found for order ID: " + orderId));
        return mapToResponse(delivery);
    }

    @Transactional(readOnly = true)
    public List<DeliveryResponse> getPartnerDeliveries(Long partnerId) {
        return deliveryRepository.findByDeliveryPartnerIdOrderByCreatedAtDesc(partnerId).stream()
                .map(this::mapToResponse)
                .toList();
    }

    private void validateStateTransition(DeliveryStatus current, DeliveryStatus target) {
        boolean valid = switch (current) {
            case PENDING -> target == DeliveryStatus.ASSIGNED || target == DeliveryStatus.CANCELLED;
            case ASSIGNED -> target == DeliveryStatus.PICKED_UP || target == DeliveryStatus.CANCELLED;
            case PICKED_UP -> target == DeliveryStatus.IN_TRANSIT || target == DeliveryStatus.DELIVERED;
            case IN_TRANSIT -> target == DeliveryStatus.DELIVERED || target == DeliveryStatus.CANCELLED;
            case DELIVERED, CANCELLED -> false; // Terminal states
        };

        if (!valid) {
            throw new InvalidDeliveryStateException(String.format(
                    "Illegal state transition from %s to %s", current, target));
        }
    }

    private DeliveryResponse mapToResponse(Delivery d) {
        List<DeliveryLogResponse> logs = logRepository.findByDeliveryIdOrderByTimestampAsc(d.getId()).stream()
                .map(l -> new DeliveryLogResponse(l.getStatus(), l.getNote(), l.getTimestamp()))
                .toList();

        return new DeliveryResponse(
                d.getId(),
                d.getOrderId(),
                d.getDeliveryPartnerId(),
                d.getCustomerUserId(),
                d.getAddressId(),
                d.getPickupLocation(),
                d.getDeliveryAddressSnapshot(),
                d.getStatus(),
                d.getAssignedAt(),
                d.getPickedUpAt(),
                d.getDeliveredAt(),
                d.getCreatedAt(),
                logs
        );
    }
}
