package com.platform.orderfleet.catalog.service;

import com.platform.orderfleet.catalog.dto.*;
import com.platform.orderfleet.catalog.entity.InventoryItem;
import com.platform.orderfleet.catalog.entity.InventoryReservation;
import com.platform.orderfleet.catalog.entity.ReservationStatus;
import com.platform.orderfleet.catalog.exception.InsufficientStockException;
import com.platform.orderfleet.catalog.exception.InvalidReservationStateException;
import com.platform.orderfleet.catalog.exception.ResourceNotFoundException;
import com.platform.orderfleet.catalog.repository.InventoryItemRepository;
import com.platform.orderfleet.catalog.repository.InventoryReservationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class InventoryService {

    private static final Logger log = LoggerFactory.getLogger(InventoryService.class);

    private final InventoryItemRepository inventoryItemRepository;
    private final InventoryReservationRepository reservationRepository;

    public InventoryService(InventoryItemRepository inventoryItemRepository,
                            InventoryReservationRepository reservationRepository) {
        this.inventoryItemRepository = inventoryItemRepository;
        this.reservationRepository = reservationRepository;
    }

    @Transactional(readOnly = true)
    public InventoryResponse getInventoryByProductId(Long productId) {
        InventoryItem item = inventoryItemRepository.findByProductId(productId)
                .orElseThrow(() -> new ResourceNotFoundException("No inventory record found for product ID: " + productId));

        int total = item.getAvailableQuantity() + item.getReservedQuantity();
        return new InventoryResponse(
                item.getProductId(),
                item.getAvailableQuantity(),
                item.getReservedQuantity(),
                total,
                item.getVersion(),
                item.getUpdatedAt()
        );
    }

    @Transactional
    public StockReservationResponse reserveStock(StockReservationRequest request) {
        log.info("Processing atomic stock reservation for Order ID: {}, Product ID: {}, Qty: {}",
                request.orderId(), request.productId(), request.quantity());

        InventoryItem item = inventoryItemRepository.findByProductId(request.productId())
                .orElseThrow(() -> new ResourceNotFoundException("Product ID not found in inventory: " + request.productId()));

        if (item.getAvailableQuantity() < request.quantity()) {
            log.warn("Stock reservation rejected: requested {}, but only {} available for product ID {}",
                    request.quantity(), item.getAvailableQuantity(), request.productId());
            throw new InsufficientStockException(String.format(
                    "Insufficient stock for product ID %d. Requested: %d, Available: %d",
                    request.productId(), request.quantity(), item.getAvailableQuantity()));
        }

        // Atomically transfer units from available to reserved
        item.setAvailableQuantity(item.getAvailableQuantity() - request.quantity());
        item.setReservedQuantity(item.getReservedQuantity() + request.quantity());
        inventoryItemRepository.save(item);

        String reservationCode = "RES-" + UUID.randomUUID().toString().substring(0, 13).toUpperCase();
        InventoryReservation reservation = new InventoryReservation(
                reservationCode,
                request.orderId(),
                request.productId(),
                request.quantity(),
                ReservationStatus.RESERVED
        );
        reservationRepository.save(reservation);

        log.info("Stock reserved successfully. Code: {}, New Available Qty: {}",
                reservationCode, item.getAvailableQuantity());

        return new StockReservationResponse(
                reservationCode,
                request.orderId(),
                request.productId(),
                request.quantity(),
                ReservationStatus.RESERVED,
                Instant.now()
        );
    }

    @Transactional
    public void releaseStock(StockReleaseRequest request) {
        log.info("Releasing stock reservation: {}", request.reservationCode());

        InventoryReservation reservation = reservationRepository.findByReservationCode(request.reservationCode())
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found: " + request.reservationCode()));

        if (reservation.getStatus() != ReservationStatus.RESERVED) {
            throw new InvalidReservationStateException("Cannot release reservation in status: " + reservation.getStatus());
        }

        InventoryItem item = inventoryItemRepository.findByProductId(reservation.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Inventory item not found for product: " + reservation.getProductId()));

        // Return reserved units back to available pool
        item.setAvailableQuantity(item.getAvailableQuantity() + reservation.getQuantity());
        item.setReservedQuantity(Math.max(0, item.getReservedQuantity() - reservation.getQuantity()));
        inventoryItemRepository.save(item);

        reservation.setStatus(ReservationStatus.RELEASED);
        reservationRepository.save(reservation);

        log.info("Stock released successfully for code: {}. Restored available qty: {}",
                request.reservationCode(), item.getAvailableQuantity());
    }

    @Transactional
    public void confirmReservation(String reservationCode) {
        log.info("Confirming stock deduction for reservation: {}", reservationCode);

        InventoryReservation reservation = reservationRepository.findByReservationCode(reservationCode)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found: " + reservationCode));

        if (reservation.getStatus() != ReservationStatus.RESERVED) {
            throw new InvalidReservationStateException("Cannot confirm reservation in status: " + reservation.getStatus());
        }

        InventoryItem item = inventoryItemRepository.findByProductId(reservation.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Inventory item not found for product: " + reservation.getProductId()));

        // Units have officially shipped/sold: decrement reserved pool
        item.setReservedQuantity(Math.max(0, item.getReservedQuantity() - reservation.getQuantity()));
        inventoryItemRepository.save(item);

        reservation.setStatus(ReservationStatus.CONFIRMED);
        reservationRepository.save(reservation);

        log.info("Stock reservation confirmed permanently for code: {}", reservationCode);
    }

    @Transactional
    public InventoryResponse updateStock(StockUpdateRequest request) {
        log.info("Admin adjusting stock for product ID: {}, Delta: {}", request.productId(), request.quantityDelta());

        InventoryItem item = inventoryItemRepository.findByProductId(request.productId())
                .orElseThrow(() -> new ResourceNotFoundException("Inventory item not found for product: " + request.productId()));

        int newAvailable = item.getAvailableQuantity() + request.quantityDelta();
        if (newAvailable < 0) {
            throw new InsufficientStockException("Cannot reduce available stock below 0. Current available: " + item.getAvailableQuantity());
        }

        item.setAvailableQuantity(newAvailable);
        InventoryItem saved = inventoryItemRepository.save(item);

        int total = saved.getAvailableQuantity() + saved.getReservedQuantity();
        return new InventoryResponse(
                saved.getProductId(),
                saved.getAvailableQuantity(),
                saved.getReservedQuantity(),
                total,
                saved.getVersion(),
                saved.getUpdatedAt()
        );
    }
}
