package com.platform.orderfleet.order.controller;

import com.platform.orderfleet.common.constants.SecurityConstants;
import com.platform.orderfleet.common.dto.ApiResponse;
import com.platform.orderfleet.order.dto.AddToCartRequest;
import com.platform.orderfleet.order.dto.CartResponse;
import com.platform.orderfleet.order.service.CartService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/cart")
@Tag(name = "Shopping Cart", description = "Endpoints for managing user shopping cart sessions")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @PostMapping("/items")
    @Operation(summary = "Add product to cart", description = "Syncs with catalog-inventory-service for live metadata and persists cart item")
    public ResponseEntity<ApiResponse<CartResponse>> addToCart(
            @RequestHeader(value = SecurityConstants.HEADER_USER_ID, defaultValue = "1") Long userId,
            @Valid @RequestBody AddToCartRequest request) {
        CartResponse cart = cartService.addToCart(userId, request);
        return ResponseEntity.ok(ApiResponse.success(cart, "Item added to cart"));
    }

    @GetMapping
    @Operation(summary = "Get user shopping cart", description = "Returns active cart line items and computed total")
    public ResponseEntity<ApiResponse<CartResponse>> getCart(
            @RequestHeader(value = SecurityConstants.HEADER_USER_ID, defaultValue = "1") Long userId) {
        CartResponse cart = cartService.getCart(userId);
        return ResponseEntity.ok(ApiResponse.success(cart));
    }

    @DeleteMapping
    @Operation(summary = "Clear shopping cart", description = "Empties all items in the user cart")
    public ResponseEntity<ApiResponse<Void>> clearCart(
            @RequestHeader(value = SecurityConstants.HEADER_USER_ID, defaultValue = "1") Long userId) {
        cartService.clearCart(userId);
        return ResponseEntity.ok(ApiResponse.success(null, "Shopping cart cleared successfully"));
    }
}
