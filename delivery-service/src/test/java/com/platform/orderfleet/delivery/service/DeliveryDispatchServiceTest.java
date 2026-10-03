package com.platform.orderfleet.delivery.service;

import com.platform.orderfleet.delivery.dto.DeliveryResponse;
import com.platform.orderfleet.delivery.dto.UpdateDeliveryStatusRequest;
import com.platform.orderfleet.delivery.entity.*;
import com.platform.orderfleet.delivery.exception.PartnerNotAvailableException;
import com.platform.orderfleet.delivery.repository.AddressRepository;
import com.platform.orderfleet.delivery.repository.DeliveryLogRepository;
import com.platform.orderfleet.delivery.repository.DeliveryPartnerRepository;
import com.platform.orderfleet.delivery.repository.DeliveryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DeliveryDispatchServiceTest {

    @Mock
    private DeliveryRepository deliveryRepository;

    @Mock
    private DeliveryLogRepository logRepository;

    @Mock
    private DeliveryPartnerRepository partnerRepository;

    @Mock
    private AddressRepository addressRepository;

    private DeliveryDispatchService dispatchService;

    @BeforeEach
    void setUp() {
        dispatchService = new DeliveryDispatchService(deliveryRepository, logRepository, partnerRepository, addressRepository);
    }

    @Test
    @DisplayName("Should assign delivery and mark partner as BUSY")
    void testAssignDeliverySuccess() {
        Delivery delivery = new Delivery(2001L, 1L, 101L, "Hub", "123 Main St");
        delivery.setId(10L);

        DeliveryPartner partner = new DeliveryPartner(2L, "Bob Rider", "+123456", "BIKE", 40.7128, -74.0060);
        partner.setId(5L);
        partner.setStatus(PartnerStatus.AVAILABLE);

        when(deliveryRepository.findById(10L)).thenReturn(Optional.of(delivery));
        when(partnerRepository.findById(5L)).thenReturn(Optional.of(partner));
        when(deliveryRepository.save(any(Delivery.class))).thenAnswer(i -> i.getArgument(0));
        when(logRepository.findByDeliveryIdOrderByTimestampAsc(10L)).thenReturn(Collections.emptyList());

        DeliveryResponse response = dispatchService.assignDelivery(10L, 5L);

        assertNotNull(response);
        assertEquals(DeliveryStatus.ASSIGNED, response.status());
        assertEquals(5L, response.deliveryPartnerId());
        assertEquals(PartnerStatus.BUSY, partner.getStatus());

        verify(partnerRepository, times(1)).save(partner);
        verify(deliveryRepository, times(1)).save(delivery);
    }

    @Test
    @DisplayName("Should throw PartnerNotAvailableException when partner is BUSY")
    void testAssignDeliveryPartnerBusy() {
        Delivery delivery = new Delivery(2002L, 1L, 101L, "Hub", "123 Main St");
        delivery.setId(11L);

        DeliveryPartner partner = new DeliveryPartner(2L, "Bob Rider", "+123456", "BIKE", 40.7128, -74.0060);
        partner.setId(5L);
        partner.setStatus(PartnerStatus.BUSY);

        when(deliveryRepository.findById(11L)).thenReturn(Optional.of(delivery));
        when(partnerRepository.findById(5L)).thenReturn(Optional.of(partner));

        assertThrows(PartnerNotAvailableException.class, () -> dispatchService.assignDelivery(11L, 5L));
        verify(deliveryRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should release partner back to AVAILABLE when delivery is completed")
    void testDeliveryCompletionFreesPartner() {
        Delivery delivery = new Delivery(2001L, 1L, 101L, "Hub", "123 Main St");
        delivery.setId(10L);
        delivery.setStatus(DeliveryStatus.IN_TRANSIT);
        delivery.setDeliveryPartnerId(5L);

        DeliveryPartner partner = new DeliveryPartner(2L, "Bob Rider", "+123456", "BIKE", 40.7128, -74.0060);
        partner.setId(5L);
        partner.setStatus(PartnerStatus.BUSY);

        when(deliveryRepository.findById(10L)).thenReturn(Optional.of(delivery));
        when(partnerRepository.findById(5L)).thenReturn(Optional.of(partner));
        when(deliveryRepository.save(any(Delivery.class))).thenAnswer(i -> i.getArgument(0));
        when(logRepository.findByDeliveryIdOrderByTimestampAsc(10L)).thenReturn(Collections.emptyList());

        UpdateDeliveryStatusRequest request = new UpdateDeliveryStatusRequest(DeliveryStatus.DELIVERED, "Handed to customer");
        DeliveryResponse response = dispatchService.updateDeliveryStatus(10L, 5L, request);

        assertEquals(DeliveryStatus.DELIVERED, response.status());
        assertEquals(PartnerStatus.AVAILABLE, partner.getStatus());
        verify(partnerRepository, times(1)).save(partner);
    }
}
