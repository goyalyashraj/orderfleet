package com.platform.orderfleet.order.service;

import com.platform.orderfleet.order.client.CatalogClient;
import com.platform.orderfleet.order.client.StockReservationResultDto;
import com.platform.orderfleet.order.dto.CheckoutRequest;
import com.platform.orderfleet.order.dto.OrderItemResponse;
import com.platform.orderfleet.order.dto.OrderResponse;
import com.platform.orderfleet.order.entity.Cart;
import com.platform.orderfleet.order.entity.Order;
import com.platform.orderfleet.order.entity.OrderItem;
import com.platform.orderfleet.order.entity.OrderStatus;
import com.platform.orderfleet.order.exception.EmptyCartException;
import com.platform.orderfleet.order.exception.PaymentSimulationException;
import com.platform.orderfleet.order.exception.ResourceNotFoundException;
import com.platform.orderfleet.order.repository.CartRepository;
import com.platform.orderfleet.order.repository.OrderRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final CatalogClient catalogClient;
    private final CartService cartService;

    public OrderService(OrderRepository orderRepository,
                        CartRepository cartRepository,
                        CatalogClient catalogClient,
                        CartService cartService) {
        this.orderRepository = orderRepository;
        this.cartRepository = cartRepository;
        this.catalogClient = catalogClient;
        this.cartService = cartService;
    }

    @Transactional(noRollbackFor = PaymentSimulationException.class)
    public OrderResponse checkout(Long userId, CheckoutRequest request) {
        log.info("Initiating checkout orchestration for user: {}", userId);

        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new EmptyCartException("Cannot checkout: cart not found for user " + userId));

        if (cart.getItems().isEmpty()) {
            throw new EmptyCartException("Cannot checkout: shopping cart is empty");
        }

        BigDecimal totalAmount = cart.getItems().stream()
                .map(item -> item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        String orderNumber = "ORD-" + UUID.randomUUID().toString().substring(0, 10).toUpperCase();

        Order order = new Order(
                orderNumber,
                userId,
                request.addressId(),
                totalAmount,
                OrderStatus.PENDING
        );

        cart.getItems().forEach(cartItem -> {
            OrderItem orderItem = new OrderItem(
                    order,
                    cartItem.getProductId(),
                    cartItem.getSku(),
                    cartItem.getProductTitle(),
                    cartItem.getUnitPrice(),
                    cartItem.getQuantity(),
                    cartItem.getSubtotal()
            );
            order.addItem(orderItem);
        });

        Order savedOrder = orderRepository.save(order);
        log.info("Draft order created with ID: {}, Number: {}", savedOrder.getId(), orderNumber);

        // Step 1: Inter-service stock reservation across all order items
        List<String> reservationCodes = new ArrayList<>();
        try {
            for (OrderItem item : savedOrder.getItems()) {
                StockReservationResultDto res = catalogClient.reserveStock(
                        savedOrder.getId(), item.getProductId(), item.getQuantity());
                reservationCodes.add(res.reservationCode());
            }
            savedOrder.setReservationCode(String.join(",", reservationCodes));
        } catch (Exception ex) {
            log.error("Stock reservation failed during checkout. Triggering compensation rollback: {}", ex.getMessage());
            // Compensating action: release any previously locked stock
            reservationCodes.forEach(catalogClient::releaseStock);
            savedOrder.setStatus(OrderStatus.CANCELLED);
            savedOrder.setPaymentStatus("ABORTED_INSUFFICIENT_STOCK");
            orderRepository.save(savedOrder);
            throw ex;
        }

        // Step 2: Payment Simulation
        log.info("Processing simulated payment for Order: {}, Amount: {}", orderNumber, totalAmount);
        boolean paymentApproved = request.simulatePaymentSuccess();

        if (!paymentApproved) {
            log.warn("Payment declined for Order: {}. Executing compensating stock release.", orderNumber);
            // Compensating transaction: release all reserved stock
            reservationCodes.forEach(catalogClient::releaseStock);

            savedOrder.setStatus(OrderStatus.CANCELLED);
            savedOrder.setPaymentStatus("FAILED");
            orderRepository.save(savedOrder);

            throw new PaymentSimulationException("Payment failed or declined by payment provider. Stock has been restored.");
        }

        // Step 3: Payment Success Confirmation
        log.info("Payment approved for Order: {}. Confirming inventory deductions permanently.", orderNumber);
        reservationCodes.forEach(catalogClient::confirmReservation);

        savedOrder.setStatus(OrderStatus.CONFIRMED);
        savedOrder.setPaymentStatus("SUCCESS");
        orderRepository.save(savedOrder);

        // Clear user cart upon successful confirmation
        cartService.clearCart(userId);

        log.info("Order successfully confirmed: {}", orderNumber);
        return mapToOrderResponse(savedOrder);
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderById(Long orderId, Long userId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with ID: " + orderId));

        if (!order.getUserId().equals(userId)) {
            throw new ResourceNotFoundException("Order not found for user: " + userId);
        }

        return mapToOrderResponse(order);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getUserOrders(Long userId) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::mapToOrderResponse)
                .toList();
    }

    private OrderResponse mapToOrderResponse(Order order) {
        List<OrderItemResponse> itemResponses = order.getItems().stream()
                .map(item -> new OrderItemResponse(
                        item.getId(),
                        item.getProductId(),
                        item.getSku(),
                        item.getProductTitle(),
                        item.getUnitPrice(),
                        item.getQuantity(),
                        item.getSubtotal()
                ))
                .toList();

        return new OrderResponse(
                order.getId(),
                order.getOrderNumber(),
                order.getUserId(),
                order.getAddressId(),
                order.getTotalAmount(),
                order.getStatus(),
                order.getPaymentStatus(),
                order.getReservationCode(),
                itemResponses,
                order.getCreatedAt()
        );
    }
}
