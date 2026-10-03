import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { DeliveryService } from '../../services/delivery.service';
import { ToastService } from '../../services/toast.service';
import { Address } from '../../models/delivery.model';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="container py-3">
      <!-- Breadcrumb Navigation -->
      <nav aria-label="breadcrumb" class="mb-3">
        <ol class="breadcrumb small">
          <li class="breadcrumb-item"><a routerLink="/catalog" class="text-muted text-decoration-none">Home</a></li>
          <li class="breadcrumb-item active text-white" aria-current="page">Shopping Cart &amp; Checkout</li>
        </ol>
      </nav>

      <!-- EMPTY STATE (Myntra/Amazon style) -->
      @if (!cartService.cart() || cartService.cart()!.items.length === 0) {
        <div class="glass-panel text-center py-5 px-4 my-4" style="max-width: 600px; margin: 0 auto;">
          <div class="d-inline-flex p-4 rounded-circle mb-3" style="background: rgba(245, 158, 11, 0.1);">
            <i class="bi bi-cart-x fs-1 text-warning"></i>
          </div>
          <h3 class="text-white fw-bold mb-2">Hey, your cart feels so light!</h3>
          <p class="text-muted mb-4">
            There is nothing in your cart. Let's add some high-speed distributed items from our catalog!
          </p>
          <a routerLink="/catalog" class="btn btn-amazon-primary px-4 py-2">
            <i class="bi bi-bag-plus-fill me-1"></i> Start Shopping
          </a>
        </div>
      } @else {
        <!-- 2-COLUMN E-COMMERCE CHECKOUT LAYOUT -->
        <div class="row g-4">
          <!-- LEFT COLUMN: Address Card + Cart Line Items (68%) -->
          <div class="col-lg-8">
            <!-- 1. Delivery Address Bar (Amazon style: Deliver to ...) -->
            <div class="glass-panel p-3 mb-3 border-start border-4 border-warning">
              <div class="d-flex justify-content-between align-items-center">
                <div class="d-flex align-items-center gap-2">
                  <i class="bi bi-geo-alt-fill text-warning fs-5"></i>
                  <div>
                    <div class="small text-muted">Deliver to: <strong class="text-white">{{ getSelectedAddressName() }}</strong></div>
                    <div class="text-white-50 small text-truncate" style="max-width: 480px;">
                      {{ getSelectedAddressText() }}
                    </div>
                  </div>
                </div>
                <button type="button" class="btn btn-glass btn-sm text-nowrap" (click)="toggleAddressSelector()">
                  <i class="bi bi-pencil-square me-1"></i> Change
                </button>
              </div>

              <!-- Collapsible Address Selector Drawer -->
              @if (showAddressDrawer()) {
                <div class="border-top border-secondary mt-3 pt-3">
                  <div class="d-flex justify-content-between align-items-center mb-2">
                    <span class="small fw-bold text-white">Select Saved Address:</span>
                    <button class="btn btn-link text-warning p-0 small text-decoration-none" (click)="showNewAddressForm.set(!showNewAddressForm())">
                      + Add New Address
                    </button>
                  </div>

                  @if (showNewAddressForm()) {
                    <div class="glass-panel p-3 mb-3 border-secondary">
                      <div class="row g-2 mb-2">
                        <div class="col-sm-6">
                          <input type="text" class="form-control form-control-sm" [(ngModel)]="newAddress.recipientName" placeholder="Full Name">
                        </div>
                        <div class="col-sm-6">
                          <input type="text" class="form-control form-control-sm" [(ngModel)]="newAddress.phoneNumber" placeholder="Phone Number">
                        </div>
                      </div>
                      <div class="mb-2">
                        <input type="text" class="form-control form-control-sm" [(ngModel)]="newAddress.streetAddress" placeholder="Street Address, Apt / Suite">
                      </div>
                      <div class="row g-2 mb-3">
                        <div class="col-sm-4"><input type="text" class="form-control form-control-sm" [(ngModel)]="newAddress.city" placeholder="City"></div>
                        <div class="col-sm-4"><input type="text" class="form-control form-control-sm" [(ngModel)]="newAddress.state" placeholder="State"></div>
                        <div class="col-sm-4"><input type="text" class="form-control form-control-sm" [(ngModel)]="newAddress.postalCode" placeholder="Postal Code"></div>
                      </div>
                      <button class="btn btn-amazon-primary btn-sm me-2" (click)="saveNewAddress()">Save &amp; Deliver Here</button>
                      <button class="btn btn-glass btn-sm" (click)="showNewAddressForm.set(false)">Cancel</button>
                    </div>
                  }

                  <div class="row g-2">
                    @for (addr of addresses(); track addr.id) {
                      <div class="col-sm-6">
                        <div class="p-2 rounded-2 border cursor-pointer"
                             [ngClass]="selectedAddressId() === addr.id ? 'border-warning bg-dark' : 'border-secondary'"
                             (click)="selectAddress(addr.id)">
                          <div class="d-flex align-items-center gap-2">
                            <input type="radio" class="form-check-input mt-0" [checked]="selectedAddressId() === addr.id">
                            <strong class="text-white small">{{ addr.recipientName }}</strong>
                          </div>
                          <div class="text-muted small ps-4" style="font-size: 0.75rem;">
                            {{ addr.streetAddress }}, {{ addr.city }} {{ addr.postalCode }}
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>

            <!-- 2. Cart Items Container -->
            <div class="glass-panel p-4 mb-3">
              <div class="d-flex justify-content-between align-items-center border-bottom border-secondary pb-3 mb-3">
                <h5 class="fw-extrabold text-white m-0">
                  Shopping Cart ({{ cartService.itemCount() }} {{ cartService.itemCount() === 1 ? 'item' : 'items' }})
                </h5>
                <button type="button" class="btn btn-link text-danger p-0 small text-decoration-none" (click)="clearAllItems()">
                  <i class="bi bi-trash3 me-1"></i> Deselect / Clear All
                </button>
              </div>

              <!-- Cart Line Item Rows -->
              <div class="d-flex flex-column gap-3">
                @for (item of cartService.cart()!.items; track item.id) {
                  <div class="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 p-3 rounded-3"
                       style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06);">
                    
                    <!-- Thumbnail & Title -->
                    <div class="d-flex align-items-center gap-3">
                      <div class="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                           style="width: 72px; height: 72px; background: #1e293b; border: 1px solid #334155;">
                        <i class="bi bi-box-seam fs-3 text-warning"></i>
                      </div>
                      <div>
                        <h6 class="text-white fw-bold mb-1">{{ item.productTitle }}</h6>
                        <div class="text-muted font-monospace small mb-1" style="font-size: 0.75rem;">SKU: {{ item.sku }}</div>
                        <div class="d-flex align-items-center gap-2">
                          <span class="badge bg-success-subtle text-success small fw-semibold" style="font-size: 0.7rem;">
                            <i class="bi bi-check-circle-fill"></i> In Stock
                          </span>
                          <span class="text-muted small" style="font-size: 0.72rem;">Eligible for FREE Shipping</span>
                        </div>
                      </div>
                    </div>

                    <!-- Price & Quantity Controls -->
                    <div class="d-flex align-items-center justify-content-between justify-content-sm-end gap-4 mt-2 mt-sm-0">
                      <!-- Quantity Stepper -->
                      <div class="d-flex align-items-center border border-secondary rounded-2 bg-dark">
                        <button type="button" class="btn btn-sm btn-dark text-muted px-2 py-0 border-0" 
                                (click)="decreaseQty(item.productId, item.quantity)">
                          <i class="bi bi-dash"></i>
                        </button>
                        <span class="px-2 small fw-bold text-white">{{ item.quantity }}</span>
                        <button type="button" class="btn btn-sm btn-dark text-muted px-2 py-0 border-0" 
                                (click)="increaseQty(item.productId, item.quantity)">
                          <i class="bi bi-plus"></i>
                        </button>
                      </div>

                      <!-- Subtotal Price -->
                      <div class="text-end" style="min-width: 80px;">
                        <div class="fw-extrabold text-white fs-6">\${{ item.subtotal.toFixed(2) }}</div>
                        <div class="price-mrp" style="font-size: 0.75rem;">\${{ (item.subtotal * 1.25).toFixed(2) }}</div>
                      </div>

                      <!-- Remove Button -->
                      <button type="button" class="btn btn-link text-muted hover-danger p-0 border-0" 
                              title="Delete item"
                              (click)="removeItem(item.productId, item.productTitle)">
                        <i class="bi bi-trash fs-5"></i>
                      </button>
                    </div>
                  </div>
                }
              </div>

              <!-- Estimated Delivery Banner (Amazon style) -->
              <div class="mt-4 p-3 rounded-2 d-flex align-items-center gap-2" 
                   style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.2);">
                <i class="bi bi-truck text-success fs-5"></i>
                <div class="small">
                  <strong class="text-white">FREE Express Shipping</strong>: Guaranteed delivery by 
                  <span class="text-success fw-bold">Tomorrow, 11:00 AM</span>
                </div>
              </div>
            </div>
          </div>

          <!-- RIGHT COLUMN: Sticky Order Summary & Price Breakdown (32%) -->
          <div class="col-lg-4">
            <div class="glass-panel p-4 sticky-top" style="top: 85px;">
              <h6 class="fw-bold text-white text-uppercase tracking-wider small mb-3 border-bottom border-secondary pb-2">
                Price Details ({{ cartService.itemCount() }} Items)
              </h6>

              <!-- Price Breakdown Items -->
              <div class="d-flex justify-content-between text-muted small mb-2">
                <span>Total MRP</span>
                <span>\${{ totalMrp().toFixed(2) }}</span>
              </div>
              <div class="d-flex justify-content-between text-muted small mb-2">
                <span>Discount on MRP</span>
                <span class="text-success">- \${{ totalSavings().toFixed(2) }}</span>
              </div>
              <div class="d-flex justify-content-between text-muted small mb-2">
                <span>Delivery Fee</span>
                <span class="text-success">
                  <span class="price-mrp" style="font-size: 0.75rem;">\$9.99</span> FREE
                </span>
              </div>
              <div class="d-flex justify-content-between text-muted small mb-3">
                <span>Platform Processing Fee</span>
                <span class="text-success">FREE</span>
              </div>

              <!-- Total Amount Highlight -->
              <div class="d-flex justify-content-between align-items-center border-top border-secondary pt-3 mb-2">
                <div>
                  <div class="fw-bold text-white fs-5">Total Amount</div>
                  <div class="text-muted" style="font-size: 0.72rem;">Inclusive of all applicable taxes</div>
                </div>
                <div class="fs-4 fw-extrabold" style="color: #ffa41c;">
                  \${{ cartService.totalAmount().toFixed(2) }}
                </div>
              </div>

              <!-- Green Savings Banner (Myntra/Amazon style) -->
              <div class="p-2 rounded-2 mb-3 d-flex align-items-center gap-2 small text-success fw-bold"
                   style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.25);">
                <i class="bi bi-patch-check-fill"></i>
                <span>You will save \${{ totalSavings().toFixed(2) }} on this order!</span>
              </div>

              <!-- Payment Method Selection -->
              <div class="mb-3">
                <label class="form-label text-muted small fw-semibold">Payment Option</label>
                <div class="d-flex flex-column gap-1">
                  <label class="d-flex align-items-center gap-2 p-2 rounded-2 border border-secondary cursor-pointer"
                         [ngClass]="paymentMethod === 'CARD' ? 'bg-dark border-warning' : ''">
                    <input type="radio" name="payOption" [(ngModel)]="paymentMethod" value="CARD">
                    <span class="small text-white"><i class="bi bi-credit-card-2-front text-info me-1"></i> Credit / Debit Card</span>
                  </label>
                  <label class="d-flex align-items-center gap-2 p-2 rounded-2 border border-secondary cursor-pointer"
                         [ngClass]="paymentMethod === 'UPI' ? 'bg-dark border-warning' : ''">
                    <input type="radio" name="payOption" [(ngModel)]="paymentMethod" value="UPI">
                    <span class="small text-white"><i class="bi bi-qr-code-scan text-success me-1"></i> UPI Instant Transfer</span>
                  </label>
                  <label class="d-flex align-items-center gap-2 p-2 rounded-2 border border-secondary cursor-pointer"
                         [ngClass]="paymentMethod === 'COD' ? 'bg-dark border-warning' : ''">
                    <input type="radio" name="payOption" [(ngModel)]="paymentMethod" value="COD">
                    <span class="small text-white"><i class="bi bi-cash-stack text-warning me-1"></i> Cash on Delivery</span>
                  </label>
                </div>
              </div>

              <!-- Distributed Transaction Rollback Simulation Toggle -->
              <div class="p-3 mb-3 rounded-2" style="background: rgba(99, 102, 241, 0.08); border: 1px dashed rgba(99, 102, 241, 0.3);">
                <div class="form-check form-switch mb-1">
                  <input class="form-check-input" type="checkbox" id="simPayment" [(ngModel)]="simulatePaymentSuccess">
                  <label class="form-check-label text-white small fw-bold" for="simPayment">
                    Simulate Payment Success
                  </label>
                </div>
                <div class="text-muted" style="font-size: 0.72rem; line-height: 1.3;">
                  @if (simulatePaymentSuccess) {
                    <span class="text-success"><i class="bi bi-shield-check"></i> Standard Atomic Confirmation.</span>
                  } @else {
                    <span class="text-danger"><i class="bi bi-arrow-counterclockwise"></i> Compensating Rollback: Simulates payment failure and releases stock back to catalog!</span>
                  }
                </div>
              </div>

              <!-- Big Frictionless CTA (Amazon style golden primary button) -->
              <button 
                type="button" 
                class="btn btn-amazon-primary w-100 py-3 d-flex align-items-center justify-content-center gap-2"
                [disabled]="processingCheckout() || !selectedAddressId()"
                (click)="executeCheckout()">
                @if (processingCheckout()) {
                  <span class="spinner-border spinner-border-sm" role="status"></span>
                  <span>Coordinating Microservices...</span>
                } @else {
                  <i class="bi bi-lock-fill"></i>
                  <span class="fs-6 fw-bold">PLACE YOUR ORDER</span>
                }
              </button>

              <div class="text-center text-muted small mt-2" style="font-size: 0.72rem;">
                <i class="bi bi-shield-lock me-1"></i> Safe and secure 256-bit SSL encrypted checkout
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .hover-danger:hover {
      color: #ef4444 !important;
    }
    .cursor-pointer {
      cursor: pointer;
    }
  `]
})
export class CartComponent implements OnInit {
  cartService = inject(CartService);
  private orderService = inject(OrderService);
  private deliveryService = inject(DeliveryService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  addresses = signal<Address[]>([]);
  selectedAddressId = signal<number | null>(null);
  showAddressDrawer = signal(false);
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

  // Derived price breakdown
  totalMrp = computed(() => this.cartService.totalAmount() * 1.25);
  totalSavings = computed(() => this.totalMrp() - this.cartService.totalAmount());

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

  getSelectedAddressName(): string {
    const addr = this.addresses().find(a => a.id === this.selectedAddressId());
    return addr ? addr.recipientName : 'Default Address';
  }

  getSelectedAddressText(): string {
    const addr = this.addresses().find(a => a.id === this.selectedAddressId());
    return addr ? `${addr.streetAddress}, ${addr.city}, ${addr.state} ${addr.postalCode}` : 'Select a shipping location';
  }

  toggleAddressSelector(): void {
    this.showAddressDrawer.set(!this.showAddressDrawer());
  }

  selectAddress(id: number): void {
    this.selectedAddressId.set(id);
    this.showAddressDrawer.set(false);
    this.toastService.info('Shipping Address', 'Delivery destination updated.');
  }

  saveNewAddress(): void {
    if (!this.newAddress.recipientName || !this.newAddress.streetAddress || !this.newAddress.city) {
      this.toastService.warning('Validation', 'Please fill in required address fields.');
      return;
    }

    this.deliveryService.createAddress(this.newAddress).subscribe({
      next: (res) => {
        if (res.data) {
          this.addresses.update(old => [...old, res.data]);
          this.selectedAddressId.set(res.data.id);
          this.showNewAddressForm.set(false);
          this.showAddressDrawer.set(false);
          this.toastService.success('Address Saved', 'New delivery address added successfully.');
        }
      },
      error: (err) => {
        this.toastService.error('Address Error', err.error?.message || 'Could not save address.');
      }
    });
  }

  increaseQty(productId: number, currentQty: number): void {
    this.cartService.addItem(productId, 1).subscribe({
      next: () => this.toastService.info('Cart Updated', 'Quantity increased.'),
      error: (err) => this.toastService.error('Stock Notice', err.error?.message || 'Insufficient stock.')
    });
  }

  decreaseQty(productId: number, currentQty: number): void {
    if (currentQty <= 1) {
      this.removeItem(productId, 'Item');
    } else {
      this.cartService.addItem(productId, -1).subscribe({
        next: () => this.toastService.info('Cart Updated', 'Quantity decreased.')
      });
    }
  }

  removeItem(productId: number, title: string): void {
    this.cartService.removeItem(productId).subscribe({
      next: () => this.toastService.warning('Item Removed', `Removed ${title} from your cart.`),
      error: () => {}
    });
  }

  clearAllItems(): void {
    this.cartService.clearCart().subscribe({
      next: () => this.toastService.info('Cart Cleared', 'All items removed from cart.'),
      error: () => {}
    });
  }

  executeCheckout(): void {
    const addressId = this.selectedAddressId();
    if (!addressId) {
      this.toastService.warning('Address Required', 'Please select a delivery address to proceed.');
      return;
    }

    this.processingCheckout.set(true);

    this.orderService.checkout({
      addressId,
      paymentMethod: this.paymentMethod,
      simulatePaymentSuccess: this.simulatePaymentSuccess
    }).subscribe({
      next: (res) => {
        this.processingCheckout.set(false);
        this.cartService.resetLocalState();
        this.toastService.success('Order Placed!', 'Your order has been confirmed successfully.');
        if (res.data) {
          this.router.navigate(['/orders'], { queryParams: { orderId: res.data.orderId } });
        }
      },
      error: (err) => {
        this.processingCheckout.set(false);
        const msg = err.error?.message || 'Checkout failed. Stock reservation or payment rejected.';
        this.toastService.error('Checkout Reversal', msg);
        this.cartService.refreshCart().subscribe({ error: () => {} });
      }
    });
  }
}
