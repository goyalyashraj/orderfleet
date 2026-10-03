package com.platform.orderfleet.delivery.controller;

import com.platform.orderfleet.common.constants.SecurityConstants;
import com.platform.orderfleet.common.dto.ApiResponse;
import com.platform.orderfleet.delivery.dto.CreateDeliveryRequest;
import com.platform.orderfleet.delivery.dto.DeliveryResponse;
import com.platform.orderfleet.delivery.dto.UpdateDeliveryStatusRequest;
import com.platform.orderfleet.delivery.service.DeliveryDispatchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/deliveries")
@Tag(name = "Delivery Dispatch & Tracking", description = "Endpoints for order dispatching, driver assignment, and progress tracking")
public class DeliveryController {

    private final DeliveryDispatchService dispatchService;

    public DeliveryController(DeliveryDispatchService dispatchService) {
        this.dispatchService = dispatchService;
    }

    @PostMapping
    @Operation(summary = "Create delivery task for order", description = "Initializes a PENDING delivery task with customer address snapshot")
    public ResponseEntity<ApiResponse<DeliveryResponse>> createDelivery(
            @RequestHeader(value = SecurityConstants.HEADER_USER_ID, defaultValue = "1") Long customerUserId,
            @Valid @RequestBody CreateDeliveryRequest request) {
        DeliveryResponse response = dispatchService.createDelivery(customerUserId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(response, "Delivery task created successfully"));
    }

    @PostMapping("/{deliveryId}/assign/{partnerId}")
    @Operation(summary = "Assign delivery to partner", description = "Validates partner availability, sets partner to BUSY, and advances status to ASSIGNED")
    public ResponseEntity<ApiResponse<DeliveryResponse>> assignDelivery(
            @PathVariable Long deliveryId,
            @PathVariable Long partnerId) {
        DeliveryResponse response = dispatchService.assignDelivery(deliveryId, partnerId);
        return ResponseEntity.ok(ApiResponse.success(response, "Delivery assigned successfully"));
    }

    @PatchMapping("/{deliveryId}/status")
    @Operation(summary = "Advance delivery status", description = "Used by delivery partner to progress status: PICKED_UP -> IN_TRANSIT -> DELIVERED")
    public ResponseEntity<ApiResponse<DeliveryResponse>> updateStatus(
            @PathVariable Long deliveryId,
            @RequestHeader(value = SecurityConstants.HEADER_USER_ID, defaultValue = "2") Long partnerId,
            @Valid @RequestBody UpdateDeliveryStatusRequest request) {
        DeliveryResponse response = dispatchService.updateDeliveryStatus(deliveryId, partnerId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Delivery status updated successfully"));
    }

    @GetMapping("/order/{orderId}")
    @Operation(summary = "Track delivery by order ID", description = "Returns live delivery status, partner details, and historical audit logs")
    public ResponseEntity<ApiResponse<DeliveryResponse>> getDeliveryByOrderId(@PathVariable Long orderId) {
        DeliveryResponse response = dispatchService.getDeliveryByOrderId(orderId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/partner/{partnerId}")
    @Operation(summary = "List deliveries assigned to partner", description = "Returns active and completed delivery jobs for partner")
    public ResponseEntity<ApiResponse<List<DeliveryResponse>>> getPartnerDeliveries(@PathVariable Long partnerId) {
        List<DeliveryResponse> deliveries = dispatchService.getPartnerDeliveries(partnerId);
        return ResponseEntity.ok(ApiResponse.success(deliveries));
    }
}
