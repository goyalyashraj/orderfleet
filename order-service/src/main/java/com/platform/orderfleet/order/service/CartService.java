package com.platform.orderfleet.order.service;

import com.platform.orderfleet.order.client.CatalogClient;
import com.platform.orderfleet.order.client.CatalogProductDto;
import com.platform.orderfleet.order.dto.AddToCartRequest;
import com.platform.orderfleet.order.dto.CartItemResponse;
import com.platform.orderfleet.order.dto.CartResponse;
import com.platform.orderfleet.order.entity.Cart;
import com.platform.orderfleet.order.entity.CartItem;
import com.platform.orderfleet.order.repository.CartItemRepository;
import com.platform.orderfleet.order.repository.CartRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
public class CartService {

    private static final Logger log = LoggerFactory.getLogger(CartService.class);

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final CatalogClient catalogClient;

    public CartService(CartRepository cartRepository,
                       CartItemRepository cartItemRepository,
                       CatalogClient catalogClient) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.catalogClient = catalogClient;
    }

    @Transactional
    public CartResponse addToCart(Long userId, AddToCartRequest request) {
        log.info("Adding product {} (Qty: {}) to cart for user {}", request.productId(), request.quantity(), userId);

        // Synchronous call to catalog-inventory-service to get latest product price and metadata
        CatalogProductDto product = catalogClient.getProductById(request.productId());
        if (!product.active()) {
            throw new IllegalArgumentException("Product is inactive and cannot be purchased: " + product.title());
        }

        Cart cart = cartRepository.findByUserId(userId)
                .orElseGet(() -> cartRepository.save(new Cart(userId)));

        Optional<CartItem> existingItemOpt = cartItemRepository.findByCartIdAndProductId(cart.getId(), product.id());

        if (existingItemOpt.isPresent()) {
            CartItem existingItem = existingItemOpt.get();
            existingItem.setQuantity(existingItem.getQuantity() + request.quantity());
            existingItem.setUnitPrice(product.price()); // sync latest price
            cartItemRepository.save(existingItem);
        } else {
            CartItem newItem = new CartItem(
                    cart,
                    product.id(),
                    product.sku(),
                    product.title(),
                    product.price(),
                    request.quantity()
            );
            cart.addItem(newItem);
            cartRepository.save(cart);
        }

        return getCart(userId);
    }

    @Transactional(readOnly = true)
    public CartResponse getCart(Long userId) {
        Cart cart = cartRepository.findByUserId(userId)
                .orElseGet(() -> new Cart(userId));

        List<CartItemResponse> itemResponses = cart.getItems().stream()
                .map(item -> new CartItemResponse(
                        item.getId(),
                        item.getProductId(),
                        item.getSku(),
                        item.getProductTitle(),
                        item.getUnitPrice(),
                        item.getQuantity(),
                        item.getSubtotal()
                ))
                .toList();

        BigDecimal totalAmount = itemResponses.stream()
                .map(CartItemResponse::subtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        int totalCount = itemResponses.stream()
                .mapToInt(CartItemResponse::quantity)
                .sum();

        return new CartResponse(cart.getId(), userId, itemResponses, totalAmount, totalCount);
    }

    @Transactional
    public void clearCart(Long userId) {
        log.info("Clearing shopping cart for user {}", userId);
        cartRepository.findByUserId(userId).ifPresent(cart -> {
            cart.clear();
            cartRepository.save(cart);
        });
    }
}
