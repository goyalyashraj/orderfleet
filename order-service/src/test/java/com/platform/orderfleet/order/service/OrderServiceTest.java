package com.platform.orderfleet.order.service;

import com.platform.orderfleet.order.client.CatalogClient;
import com.platform.orderfleet.order.client.StockReservationResultDto;
import com.platform.orderfleet.order.dto.CheckoutRequest;
import com.platform.orderfleet.order.dto.OrderResponse;
import com.platform.orderfleet.order.entity.Cart;
import com.platform.orderfleet.order.entity.CartItem;
import com.platform.orderfleet.order.entity.Order;
import com.platform.orderfleet.order.entity.OrderStatus;
import com.platform.orderfleet.order.exception.EmptyCartException;
import com.platform.orderfleet.order.exception.PaymentSimulationException;
import com.platform.orderfleet.order.repository.CartRepository;
import com.platform.orderfleet.order.repository.OrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private CartRepository cartRepository;

    @Mock
    private CatalogClient catalogClient;

    @Mock
    private CartService cartService;

    @Mock
    private OrderEventProducer orderEventProducer;

    private OrderService orderService;

    @BeforeEach
    void setUp() {
        orderService = new OrderService(orderRepository, cartRepository, catalogClient, cartService, orderEventProducer);
    }

    @Test
    @DisplayName("Should successfully orchestrate checkout when payment and stock succeed")
    void testCheckoutSuccess() {
        Cart cart = new Cart(1L);
        CartItem item = new CartItem(cart, 10L, "SKU-1", "Mouse", new BigDecimal("50.00"), 2);
        cart.addItem(item);

        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(cart));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> {
            Order o = i.getArgument(0);
            o.setId(99L);
            return o;
        });

        StockReservationResultDto resDto = new StockReservationResultDto("RES-123", 99L, 10L, 2, "RESERVED");
        when(catalogClient.reserveStock(anyLong(), eq(10L), eq(2))).thenReturn(resDto);

        CheckoutRequest request = new CheckoutRequest(501L, "CARD", true);
        OrderResponse response = orderService.checkout(1L, request);

        assertNotNull(response);
        assertEquals(OrderStatus.CONFIRMED, response.status());
        assertEquals("SUCCESS", response.paymentStatus());
        assertEquals(new BigDecimal("100.00"), response.totalAmount());

        verify(catalogClient, times(1)).confirmReservation("RES-123");
        verify(cartService, times(1)).clearCart(1L);
    }

    @Test
    @DisplayName("Should execute compensating stock release when payment fails")
    void testCheckoutCompensatingTransactionOnPaymentFailure() {
        Cart cart = new Cart(1L);
        CartItem item = new CartItem(cart, 10L, "SKU-1", "Mouse", new BigDecimal("50.00"), 2);
        cart.addItem(item);

        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(cart));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> {
            Order o = i.getArgument(0);
            o.setId(99L);
            return o;
        });

        StockReservationResultDto resDto = new StockReservationResultDto("RES-FAIL-1", 99L, 10L, 2, "RESERVED");
        when(catalogClient.reserveStock(anyLong(), eq(10L), eq(2))).thenReturn(resDto);

        // Payment simulated as failed
        CheckoutRequest request = new CheckoutRequest(501L, "CARD", false);

        assertThrows(PaymentSimulationException.class, () -> orderService.checkout(1L, request));

        // Verify compensation: stock reservation was released!
        verify(catalogClient, times(1)).releaseStock("RES-FAIL-1");
        verify(catalogClient, never()).confirmReservation(anyString());
        verify(cartService, never()).clearCart(anyLong());
    }

    @Test
    @DisplayName("Should throw EmptyCartException when attempting checkout on empty cart")
    void testEmptyCartCheckout() {
        Cart emptyCart = new Cart(1L);
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(emptyCart));

        CheckoutRequest request = new CheckoutRequest(501L, "CARD", true);

        assertThrows(EmptyCartException.class, () -> orderService.checkout(1L, request));
        verify(catalogClient, never()).reserveStock(anyLong(), anyLong(), anyInt());
    }
}
