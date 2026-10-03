import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { DeliveryService } from '../../services/delivery.service';
import { Address } from '../../models/delivery.model';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="container py-4">
      <div class="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h2 class="fw-bold text-white mb-1">Shopping Cart</h2>
          <p class="text-muted small">Review your selected items and configure fulfillment</p>
        </div>
        @if (cartService.cart() && cartService.cart()!.items.length > 0) {
          <button type="button" class="btn btn-glass btn-sm text-danger" (click)="clearCart()">
            <i class="bi bi-trash me-1"></i> Clear Cart
          </button>
        }
      </div>

      <!-- Notification Alerts -->
      @if (errorMessage()) {
        <div class="alert alert-danger glass-panel border-danger text-danger py-2 px-3 small d-flex align-items-center gap-2 mb-4">
          <i class="bi bi-exclamation-triangle-fill"></i>
          <span>{{ errorMessage() }}</span>
        </div>
      }
      @if (successMessage()) {
        <div class="alert alert-success glass-panel border-success text-success py-2 px-3 small d-flex align-items-center gap-2 mb-4">
          <i class="bi bi-check-circle-fill"></i>
          <span>{{ successMessage() }}</span>
        </div>
      }

      @if (!cartService.cart() || cartService.cart()!.items.length === 0) {
        <div class="glass-panel text-center py-5 p-4">
          <div class="d-inline-flex p-4 rounded-circle mb-3" style="background: rgba(99, 102, 241, 0.1);">
            <i class="bi bi-cart-x fs-1" style="color: #818cf8;"></i>
          </div>
          <h4 class="text-white">Your Cart is Empty</h4>
          <p class="text-muted mb-4">Explore our catalog and add items to your shopping cart.</p>
          <a routerLink="/catalog" class="btn btn-gradient-primary">
            <i class="bi bi-grid-fill me-1"></i> Browse Catalog
          </a>
        </div>
      } @else {
        <div class="row g-4">
          <!-- Cart Items Column -->
          <div class="col-lg-8">
            <div class="glass-panel p-4 mb-4">
              <h5 class="fw-bold text-white mb-3 border-bottom border-secondary pb-2">
                Order Items ({{ cartService.itemCount() }})
              </h5>

              <div class="table-responsive">
                <table class="table table-dark table-borderless align-middle mb-0" style="background: transparent;">
                  <thead>
                    <tr class="text-muted small border-bottom border-secondary">
                      <th>Product</th>
                      <th class="text-center">Price</th>
                      <th class="text-center">Quantity</th>
                      <th class="text-end">Subtotal</th>
                      <th class="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of cartService.cart()!.items; track item.id) {
                      <tr class="border-bottom border-secondary">
                        <td>
                          <div class="fw-semibold text-white">{{ item.productTitle }}</div>
                          <div class="text-muted font-monospace small" style="font-size: 0.75rem;">SKU: {{ item.sku }}</div>
                        </td>
                        <td class="text-center">\${{ item.unitPrice.toFixed(2) }}</td>
                        <td class="text-center">
                          <div class="d-inline-flex align-items-center border border-secondary rounded-2">
                            <button class="btn btn-sm btn-dark px-2 py-0 border-0" (click)="decreaseQty(item.productId, item.quantity)">-</button>
                            <span class="px-2 small fw-bold">{{ item.quantity }}</span>
                            <button class="btn btn-sm btn-dark px-2 py-0 border-0" (click)="increaseQty(item.productId, item.quantity)">+</button>
                          </div>
                        </td>
                        <td class="text-end fw-bold text-white">\${{ item.subtotal.toFixed(2) }}</td>
                        <td class="text-end">
                          <button class="btn btn-link text-danger p-0 border-0" (click)="removeItem(item.productId)">
                            <i class="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Delivery Address Card -->
            <div class="glass-panel p-4">
              <div class="d-flex justify-content-between align-items-center mb-3 border-bottom border-secondary pb-2">
                <h5 class="fw-bold text-white m-0">
                  <i class="bi bi-geo-alt-fill text-danger me-1"></i> Delivery Address
                </h5>
                @if (!showNewAddressForm()) {
                  <button type="button" class="btn btn-glass btn-sm" (click)="showNewAddressForm.set(true)">
                    <i class="bi bi-plus"></i> New Address
                  </button>
                }
              </div>

              @if (showNewAddressForm()) {
                <div class="glass-panel p-3 mb-3 border-primary">
                  <div class="row g-2 mb-2">
                    <div class="col-sm-6">
                      <input type="text" class="form-control form-control-sm" [(ngModel)]="newAddress.recipientName" placeholder="Recipient Name">
                    </div>
                    <div class="col-sm-6">
                      <input type="text" class="form-control form-control-sm" [(ngModel)]="newAddress.phoneNumber" placeholder="Phone Number">
                    </div>
                  </div>
                  <div class="mb-2">
                    <input type="text" class="form-control form-control-sm" [(ngModel)]="newAddress.streetAddress" placeholder="Street Address">
                  </div>
                  <div class="row g-2 mb-3">
                    <div class="col-sm-4">
                      <input type="text" class="form-control form-control-sm" [(ngModel)]="newAddress.city" placeholder="City">
                    </div>
                    <div class="col-sm-4">
                      <input type="text" class="form-control form-control-sm" [(ngModel)]="newAddress.state" placeholder="State">
                    </div>
                    <div class="col-sm-4">
                      <input type="text" class="form-control form-control-sm" [(ngModel)]="newAddress.postalCode" placeholder="Postal Code">
                    </div>
                  </div>
                  <div class="d-flex gap-2">
                    <button class="btn btn-gradient-primary btn-sm" (click)="saveAddress()">Save Address</button>
                    <button class="btn btn-glass btn-sm" (click)="showNewAddressForm.set(false)">Cancel</button>
                  </div>
                </div>
              }

              <!-- Address Selection Options -->
              <div class="row g-3">
                @for (addr of addresses(); track addr.id) {
                  <div class="col-sm-6">
                    <div class="glass-panel p-3 cursor-pointer h-100 position-relative" 
                         [style.border-color]="selectedAddressId() === addr.id ? '#6366f1' : 'rgba(255,255,255,0.1)'"
                         (click)="selectedAddressId.set(addr.id)">
                      <div class="d-flex align-items-center justify-content-between mb-1">
                        <span class="fw-bold text-white small">{{ addr.recipientName }}</span>
                        @if (selectedAddressId() === addr.id) {
                          <span class="badge bg-primary small">Selected</span>
                        }
                      </div>
                      <div class="text-muted small">{{ addr.streetAddress }}, {{ addr.city }}, {{ addr.state }} {{ addr.postalCode }}</div>
                      <div class="text-muted small mt-1 font-monospace">{{ addr.phoneNumber }}</div>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Checkout Summary Column -->
          <div class="col-lg-4">
            <div class="glass-panel p-4 sticky-top" style="top: 100px;">
              <h5 class="fw-bold text-white mb-3 border-bottom border-secondary pb-2">Order Summary</h5>

              <div class="d-flex justify-content-between text-muted small mb-2">
                <span>Items Subtotal</span>
                <span>\${{ cartService.totalAmount().toFixed(2) }}</span>
              </div>
              <div class="d-flex justify-content-between text-muted small mb-2">
                <span>Shipping Fee</span>
                <span class="text-success">FREE</span>
              </div>
              <div class="d-flex justify-content-between text-muted small mb-3">
                <span>Platform Tax</span>
                <span>\$0.00</span>
              </div>

              <div class="d-flex justify-content-between text-white fw-bold fs-5 border-top border-secondary pt-3 mb-4">
                <span>Total Amount</span>
                <span style="color: #818cf8;">\${{ cartService.totalAmount().toFixed(2) }}</span>
              </div>

              <!-- Payment Method Selection -->
              <div class="mb-3">
                <label class="form-label text-muted small fw-semibold">Payment Method</label>
                <select class="form-select form-select-sm" [(ngModel)]="paymentMethod">
                  <option value="CARD">Credit / Debit Card</option>
                  <option value="UPI">UPI Instant Payment</option>
                  <option value="COD">Cash on Delivery</option>
                </select>
              </div>

              <!-- Distributed Transaction Simulation Switch -->
              <div class="glass-panel p-3 mb-4" style="background: rgba(99, 102, 241, 0.08); border-color: rgba(99, 102, 241, 0.25);">
                <div class="form-check form-switch mb-1">
                  <input class="form-check-input" type="checkbox" id="simPayment" [(ngModel)]="simulatePaymentSuccess">
                  <label class="form-check-label text-white small fw-bold" for="simPayment">
                    Simulate Payment Success
                  </label>
                </div>
                <div class="text-muted" style="font-size: 0.75rem; line-height: 1.3;">
                  @if (simulatePaymentSuccess) {
                    <span class="text-success"><i class="bi bi-shield-check"></i> Standard Flow: Locks stock, executes payment, confirms order.</span>
                  } @else {
                    <span class="text-warning"><i class="bi bi-arrow-counterclockwise"></i> Compensating Rollback: Simulates payment failure, releases reserved inventory back to catalog!</span>
                  }
                </div>
              </div>

              <!-- Checkout Submit Button -->
              <button 
                type="button" 
                class="btn btn-gradient-primary w-100 py-2 d-flex align-items-center justify-content-center gap-2"
                [disabled]="processingCheckout() || !selectedAddressId()"
                (click)="executeCheckout()">
                @if (processingCheckout()) {
                  <span class="spinner-border spinner-border-sm" role="status"></span>
                  <span>Coordinating Services...</span>
                } @else {
                  <i class="bi bi-lock-fill"></i>
                  <span>Place Order (\${{ cartService.totalAmount().toFixed(2) }})</span>
                }
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class CartComponent implements OnInit {
  cartService = inject(CartService);
  private orderService = inject(OrderService);
  private deliveryService = inject(DeliveryService);
  private router = inject(Router);

  addresses = signal<Address[]>([]);
  selectedAddressId = signal<number | null>(null);
  showNewAddressForm = signal(false);

  newAddress: Partial<Address> = {
    recipientName: 'Alice Smith',
    phoneNumber: '+1234567890',
    streetAddress: '742 Evergreen Terrace',
    city: 'Springfield',
    state: 'IL',
    postalCode: '62704'
  };

  paymentMethod: 'CARD' | 'UPI' | 'COD' = 'CARD';
  simulatePaymentSuccess = true;
  processingCheckout = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.cartService.refreshCart().subscribe({ error: () => {} });
    this.loadAddresses();
  }

  loadAddresses(): void {
    this.deliveryService.getAddresses().subscribe({
      next: (res) => {
        const list = res.data || [];
        this.addresses.set(list);
        if (list.length > 0 && !this.selectedAddressId()) {
          this.selectedAddressId.set(list[0].id);
        }
      },
      error: () => {}
    });
  }

  saveAddress(): void {
    this.deliveryService.createAddress(this.newAddress).subscribe({
      next: (res) => {
        if (res.data) {
          this.addresses.update(old => [...old, res.data]);
          this.selectedAddressId.set(res.data.id);
          this.showNewAddressForm.set(false);
        }
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Failed to save address.');
      }
    });
  }

  increaseQty(productId: number, currentQty: number): void {
    this.cartService.addItem(productId, 1).subscribe({ error: () => {} });
  }

  decreaseQty(productId: number, currentQty: number): void {
    if (currentQty <= 1) {
      this.removeItem(productId);
    } else {
      this.cartService.addItem(productId, -1).subscribe({ error: () => {} });
    }
  }

  removeItem(productId: number): void {
    this.cartService.removeItem(productId).subscribe({ error: () => {} });
  }

  clearCart(): void {
    this.cartService.clearCart().subscribe({ error: () => {} });
  }

  executeCheckout(): void {
    const addressId = this.selectedAddressId();
    if (!addressId) {
      this.errorMessage.set('Please select or add a delivery address.');
      return;
    }

    this.processingCheckout.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.orderService.checkout({
      addressId,
      paymentMethod: this.paymentMethod,
      simulatePaymentSuccess: this.simulatePaymentSuccess
    }).subscribe({
      next: (res) => {
        this.processingCheckout.set(false);
        this.cartService.resetLocalState();
        if (res.data) {
          this.router.navigate(['/orders'], { queryParams: { orderId: res.data.orderId } });
        }
      },
      error: (err) => {
        this.processingCheckout.set(false);
        const msg = err.error?.message || 'Checkout failed. Stock reservation or payment was unsuccessful.';
        this.errorMessage.set(msg);
        this.cartService.refreshCart().subscribe({ error: () => {} });
      }
    });
  }
}
