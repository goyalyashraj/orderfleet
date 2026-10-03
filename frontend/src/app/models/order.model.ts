export interface CartItem {
  id: number;
  productId: number;
  sku: string;
  productTitle: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface Cart {
  cartId: number;
  userId: number;
  items: CartItem[];
  totalAmount: number;
  totalItemCount: number;
}

export interface AddToCartRequest {
  productId: number;
  quantity: number;
}

export interface OrderItem {
  id: number;
  productId: number;
  sku: string;
  productTitle: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  orderId: number;
  orderNumber: string;
  userId: number;
  addressId: number;
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'DELIVERED';
  paymentStatus: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED' | 'ABORTED_INSUFFICIENT_STOCK' | string;
  reservationCode: string;
  items: OrderItem[];
  createdAt: string;
}

export interface CheckoutRequest {
  addressId: number;
  paymentMethod: 'CARD' | 'UPI' | 'COD';
  simulatePaymentSuccess: boolean;
}
