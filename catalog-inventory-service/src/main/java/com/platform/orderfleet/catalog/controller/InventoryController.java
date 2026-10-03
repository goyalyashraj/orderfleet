package com.platform.orderfleet.catalog.controller;

import com.platform.orderfleet.catalog.dto.*;
import com.platform.orderfleet.catalog.service.InventoryService;
import com.platform.orderfleet.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/inventory")
@Tag(name = "Inventory & Reservations", description = "Endpoints for atomic stock reservation, release, confirmation, and inspection")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @GetMapping("/{productId}")
    @Operation(summary = "Get inventory levels for product", description = "Returns available, reserved, total units, and entity version")
    public ResponseEntity<ApiResponse<InventoryResponse>> getInventory(@PathVariable Long productId) {
        InventoryResponse response = inventoryService.getInventoryByProductId(productId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/reserve")
    @Operation(summary = "Atomically reserve stock for an order", description = "Used during checkout to guarantee stock availability")
    public ResponseEntity<ApiResponse<StockReservationResponse>> reserveStock(@Valid @RequestBody StockReservationRequest request) {
        StockReservationResponse response = inventoryService.reserveStock(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Stock reserved successfully"));
    }

    @PostMapping("/release")
    @Operation(summary = "Release a pending reservation", description = "Reverts reserved units back to available pool upon checkout cancellation")
    public ResponseEntity<ApiResponse<Void>> releaseStock(@Valid @RequestBody StockReleaseRequest request) {
        inventoryService.releaseStock(request);
        return ResponseEntity.ok(ApiResponse.success(null, "Stock reservation released successfully"));
    }

    @PostMapping("/confirm/{reservationCode}")
    @Operation(summary = "Confirm reservation permanently", description = "Called when payment succeeds to finalize stock deduction")
    public ResponseEntity<ApiResponse<Void>> confirmReservation(@PathVariable String reservationCode) {
        inventoryService.confirmReservation(reservationCode);
        return ResponseEntity.ok(ApiResponse.success(null, "Stock reservation confirmed permanently"));
    }

    @PatchMapping("/stock")
    @Operation(summary = "Adjust stock quantity", description = "Admin endpoint to restock or deduct units manually")
    public ResponseEntity<ApiResponse<InventoryResponse>> updateStock(@Valid @RequestBody StockUpdateRequest request) {
        InventoryResponse response = inventoryService.updateStock(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Stock updated successfully"));
    }
}
