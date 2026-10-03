package com.platform.orderfleet.catalog.service;

import com.platform.orderfleet.catalog.dto.StockReleaseRequest;
import com.platform.orderfleet.catalog.dto.StockReservationRequest;
import com.platform.orderfleet.catalog.dto.StockReservationResponse;
import com.platform.orderfleet.catalog.entity.InventoryItem;
import com.platform.orderfleet.catalog.entity.InventoryReservation;
import com.platform.orderfleet.catalog.entity.ReservationStatus;
import com.platform.orderfleet.catalog.exception.InsufficientStockException;
import com.platform.orderfleet.catalog.repository.InventoryItemRepository;
import com.platform.orderfleet.catalog.repository.InventoryReservationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InventoryServiceTest {

    @Mock
    private InventoryItemRepository inventoryItemRepository;

    @Mock
    private InventoryReservationRepository reservationRepository;

    private InventoryService inventoryService;

    @BeforeEach
    void setUp() {
        inventoryService = new InventoryService(inventoryItemRepository, reservationRepository);
    }

    @Test
    @DisplayName("Should reserve stock atomically when requested quantity is available")
    void testReserveStockSuccess() {
        InventoryItem item = new InventoryItem(10L, 15, 0);
        when(inventoryItemRepository.findByProductId(10L)).thenReturn(Optional.of(item));
        when(reservationRepository.save(any(InventoryReservation.class))).thenAnswer(i -> i.getArgument(0));

        StockReservationRequest request = new StockReservationRequest(1001L, 10L, 5);
        StockReservationResponse response = inventoryService.reserveStock(request);

        assertNotNull(response);
        assertEquals(10L, response.productId());
        assertEquals(5, response.quantity());
        assertEquals(ReservationStatus.RESERVED, response.status());

        // Verify state changes on item
        assertEquals(10, item.getAvailableQuantity());
        assertEquals(5, item.getReservedQuantity());
        verify(inventoryItemRepository, times(1)).save(item);
    }

    @Test
    @DisplayName("Should throw InsufficientStockException when stock is short")
    void testReserveStockInsufficient() {
        InventoryItem item = new InventoryItem(10L, 2, 0);
        when(inventoryItemRepository.findByProductId(10L)).thenReturn(Optional.of(item));

        StockReservationRequest request = new StockReservationRequest(1002L, 10L, 5);

        assertThrows(InsufficientStockException.class, () -> inventoryService.reserveStock(request));
        verify(inventoryItemRepository, never()).save(any());
        verify(reservationRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should restore stock when releasing reservation")
    void testReleaseStockSuccess() {
        InventoryItem item = new InventoryItem(10L, 10, 5);
        InventoryReservation reservation = new InventoryReservation("RES-CODE-123", 1001L, 10L, 5, ReservationStatus.RESERVED);

        when(reservationRepository.findByReservationCode("RES-CODE-123")).thenReturn(Optional.of(reservation));
        when(inventoryItemRepository.findByProductId(10L)).thenReturn(Optional.of(item));

        inventoryService.releaseStock(new StockReleaseRequest("RES-CODE-123"));

        assertEquals(15, item.getAvailableQuantity());
        assertEquals(0, item.getReservedQuantity());
        assertEquals(ReservationStatus.RELEASED, reservation.getStatus());

        verify(inventoryItemRepository, times(1)).save(item);
        verify(reservationRepository, times(1)).save(reservation);
    }
}
