package com.platform.orderfleet.delivery.controller;

import com.platform.orderfleet.common.constants.SecurityConstants;
import com.platform.orderfleet.common.dto.ApiResponse;
import com.platform.orderfleet.delivery.dto.PartnerResponse;
import com.platform.orderfleet.delivery.dto.RegisterPartnerRequest;
import com.platform.orderfleet.delivery.dto.UpdatePartnerLocationRequest;
import com.platform.orderfleet.delivery.dto.UpdatePartnerStatusRequest;
import com.platform.orderfleet.delivery.service.DeliveryPartnerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/delivery-partners")
@Tag(name = "Delivery Fleet Management", description = "Endpoints for onboarding, status toggles, and partner locations")
public class DeliveryPartnerController {

    private final DeliveryPartnerService partnerService;

    public DeliveryPartnerController(DeliveryPartnerService partnerService) {
        this.partnerService = partnerService;
    }

    @PostMapping
    @Operation(summary = "Onboard delivery partner", description = "Registers partner fleet profile for authenticated user")
    public ResponseEntity<ApiResponse<PartnerResponse>> registerPartner(
            @RequestHeader(value = SecurityConstants.HEADER_USER_ID, defaultValue = "2") Long userId,
            @Valid @RequestBody RegisterPartnerRequest request) {
        PartnerResponse response = partnerService.registerPartner(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(response, "Delivery partner onboarded successfully"));
    }

    @GetMapping("/available")
    @Operation(summary = "List currently available partners", description = "Returns active fleet personnel ready for dispatch")
    public ResponseEntity<ApiResponse<List<PartnerResponse>>> getAvailablePartners() {
        List<PartnerResponse> partners = partnerService.getAvailablePartners();
        return ResponseEntity.ok(ApiResponse.success(partners));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Update partner status", description = "Toggle status between AVAILABLE, BUSY, and OFFLINE")
    public ResponseEntity<ApiResponse<PartnerResponse>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePartnerStatusRequest request) {
        PartnerResponse response = partnerService.updateStatus(id, request.status());
        return ResponseEntity.ok(ApiResponse.success(response, "Partner status updated successfully"));
    }

    @PatchMapping("/{id}/location")
    @Operation(summary = "Update partner live location", description = "Updates latitude and longitude coordinates")
    public ResponseEntity<ApiResponse<PartnerResponse>> updateLocation(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePartnerLocationRequest request) {
        PartnerResponse response = partnerService.updateLocation(id, request.latitude(), request.longitude());
        return ResponseEntity.ok(ApiResponse.success(response, "Location updated successfully"));
    }
}
