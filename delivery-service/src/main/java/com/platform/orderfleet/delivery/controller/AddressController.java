package com.platform.orderfleet.delivery.controller;

import com.platform.orderfleet.common.constants.SecurityConstants;
import com.platform.orderfleet.common.dto.ApiResponse;
import com.platform.orderfleet.delivery.dto.AddressResponse;
import com.platform.orderfleet.delivery.dto.CreateAddressRequest;
import com.platform.orderfleet.delivery.service.AddressService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/addresses")
@Tag(name = "Customer Addresses", description = "Endpoints for managing saved customer delivery locations")
public class AddressController {

    private final AddressService addressService;

    public AddressController(AddressService addressService) {
        this.addressService = addressService;
    }

    @PostMapping
    @Operation(summary = "Create customer delivery address", description = "Persists address and geo-coordinates in delivery_db")
    public ResponseEntity<ApiResponse<AddressResponse>> createAddress(
            @RequestHeader(value = SecurityConstants.HEADER_USER_ID, defaultValue = "1") Long userId,
            @Valid @RequestBody CreateAddressRequest request) {
        AddressResponse response = addressService.createAddress(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(response, "Address saved successfully"));
    }

    @GetMapping
    @Operation(summary = "Get user delivery addresses", description = "Lists all saved locations for the authenticated user")
    public ResponseEntity<ApiResponse<List<AddressResponse>>> getAddresses(
            @RequestHeader(value = SecurityConstants.HEADER_USER_ID, defaultValue = "1") Long userId) {
        List<AddressResponse> addresses = addressService.getUserAddresses(userId);
        return ResponseEntity.ok(ApiResponse.success(addresses));
    }
}
