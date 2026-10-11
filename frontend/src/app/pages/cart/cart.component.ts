import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { DeliveryService } from '../../services/delivery.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { Address } from '../../models/delivery.model';
import { getProductMetadata } from '../../utils/product-assets';

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
          <a routerLink="/catalog" class="btn btn-amazon-primary px-4 py-2 fw-bold">
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
                    <div class="small text-muted d-flex align-items-center gap-2">
                      <span>Deliver to: <strong class="text-white">{{ getSelectedAddressName() }}</strong></span>
                      @if (selectedAddressId()) {
                        <span class="badge bg-success-subtle text-success small fw-semibold" style="font-size: 0.65rem;">
                          <i class="bi bi-check-circle-fill"></i> Confirmed
                        </span>
                      }
                    </div>
                    <div class="text-white-50 small text-truncate" style="max-width: 480px;">
                      {{ getSelectedAddressText() }}
                    </div>
                  </div>
                </div>
                <button type="button" class="btn btn-glass btn-sm text-nowrap" (click)="toggleAddressSelector()">
                  <i class="bi bi-pencil-square me-1"></i> {{ showAddressDrawer() ? 'Close' : 'Change' }}
                </button>
              </div>

              @if (!selectedAddressId() && !provisioningAddress()) {
                <div class="alert alert-warning py-2 px-3 mt-3 mb-0 small d-flex align-items-center justify-content-between rounded-2">
                  <span><i class="bi bi-exclamation-triangle-fill me-1"></i> Delivery address required to finalize order dispatch</span>
                  <button class="btn btn-warning btn-sm py-1 px-3 fw-bold text-dark" (click)="autoProvisionDefaultAddress()">
                    <i class="bi bi-geo-fill me-1"></i> Use Default Address
                  </button>
                </div>
              }

              <!-- Collapsible Address Selector Drawer -->
              @if (showAddressDrawer()) {
                <div class="border-top border-secondary mt-3 pt-3">
                  <div class="d-flex justify-content-between align-items-center mb-2">
                    <span class="small fw-bold text-white">Saved Delivery Destinations:</span>
                    <button class="btn btn-link text-warning p-0 small text-decoration-none fw-semibold" (click)="showNewAddressForm.set(!showNewAddressForm())">
                      <i class="bi bi-plus-circle me-1"></i> Add New Address
                    </button>
                  </div>

                  @if (showNewAddressForm()) {
                    <div class="glass-panel p-3 mb-3 border-secondary rounded-3" style="background: rgba(15, 23, 42, 0.95);">
                      <h6 class="fw-bold text-white mb-2 small"><i class="bi bi-geo-alt-fill text-warning me-1"></i> Add Shipping Location</h6>
                      <div class="row g-2 mb-2">
                        <div class="col-sm-6">
                          <input type="text" class="form-control form-control-sm bg-dark border-secondary text-white" [(ngModel)]="newAddress.recipientName" placeholder="Recipient Full Name">
                        </div>
                        <div class="col-sm-6">
                          <input type="text" class="form-control form-control-sm bg-dark border-secondary text-white" [(ngModel)]="newAddress.phone" placeholder="Phone Number">
                        </div>
                      </div>
                      <div class="mb-2">
                        <input type="text" class="form-control form-control-sm bg-dark border-secondary text-white" [(ngModel)]="newAddress.streetLine" placeholder="Street Address, Apt / Suite / House #">
                      </div>
                      <div class="row g-2 mb-3">
                        <div class="col-sm-4"><input type="text" class="form-control form-control-sm bg-dark border-secondary text-white" [(ngModel)]="newAddress.city" placeholder="City"></div>
                        <div class="col-sm-4"><input type="text" class="form-control form-control-sm bg-dark border-secondary text-white" [(ngModel)]="newAddress.state" placeholder="State"></div>
                        <div class="col-sm-4"><input type="text" class="form-control form-control-sm bg-dark border-secondary text-white" [(ngModel)]="newAddress.postalCode" placeholder="Postal Code"></div>
                      </div>
                      <div class="d-flex gap-2">
                        <button class="btn btn-amazon-primary btn-sm px-3 fw-bold" (click)="saveNewAddress()">Save &amp; Deliver Here</button>
                        <button class="btn btn-glass btn-sm px-3" (click)="showNewAddressForm.set(false)">Cancel</button>
                      </div>
                    </div>
                  }

                  <div class="row g-2">
                    @for (addr of addresses(); track addr.id) {
                      <div class="col-sm-6">
                        <div class="p-2 rounded-2 border cursor-pointer transition-all"
                             [ngClass]="selectedAddressId() === addr.id ? 'border-warning bg-dark shadow-sm' : 'border-secondary'"
                             (click)="selectAddress(addr.id)">
                          <div class="d-flex align-items-center gap-2">
                            <input type="radio" class="form-check-input mt-0" [checked]="selectedAddressId() === addr.id">
                            <strong class="text-white small">{{ addr.recipientName }}</strong>
                          </div>
                          <div class="text-muted small ps-4" style="font-size: 0.75rem;">
                            {{ addr.streetLine || addr.streetAddress }}, {{ addr.city }}, {{ addr.state }} {{ addr.postalCode }}
                            <div class="text-white-50"><i class="bi bi-telephone me-1"></i> {{ addr.phone || addr.phoneNumber }}</div>
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
                      <div class="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0 p-1"
                           style="width: 72px; height: 72px; background: #0f172a; border: 1px solid #334155; overflow: hidden;">
                        <div style="width: 60px; height: 60px;" [innerHTML]="getItemSvg(item.sku, item.productTitle)"></div>
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

              <!-- Express Delivery Banner -->
              <div class="d-flex align-items-center gap-2 p-3 mt-4 rounded-3 border border-success" 
                   style="background: rgba(16, 185, 129, 0.05);">
                <i class="bi bi-truck fs-4 text-success"></i>
                <div class="small">
                  <strong class="text-white">FREE Express Shipping:</strong>
                  <span class="text-white-50 ms-1">Guaranteed delivery by</span>
                  <span class="text-success fw-bold ms-1">Tomorrow, 11:00 AM</span>
                </div>
              </div>
            </div>
          </div>

          <!-- RIGHT COLUMN: Price Details & Place Order Box (32%) -->
          <div class="col-lg-4">
            <div class="glass-panel p-4 sticky-top" style="top: 85px;">
              <h6 class="text-muted small text-uppercase fw-bold mb-3 border-bottom border-secondary pb-2">
                Price Details ({{ cartService.itemCount() }} {{ cartService.itemCount() === 1 ? 'item' : 'items' }})
              </h6>

              <div class="d-flex justify-content-between mb-2 small text-muted">
                <span>Total MRP</span>
                <span>\${{ totalMrp().toFixed(2) }}</span>
              </div>
              <div class="d-flex justify-content-between mb-2 small">
                <span class="text-muted">Discount on MRP</span>
                <span class="text-success">-\${{ totalSavings().toFixed(2) }}</span>
              </div>
              <div class="d-flex justify-content-between mb-2 small text-muted">
                <span>Delivery Fee</span>
                <span class="text-success"><s class="text-muted me-1">\$9.99</s> FREE</span>
              </div>
              <div class="d-flex justify-content-between mb-3 small text-muted">
                <span>Platform Processing Fee</span>
                <span class="text-success">FREE</span>
              </div>

              <hr class="border-secondary my-3">

              <!-- Final Total Payable Amount -->
              <div class="d-flex justify-content-between align-items-baseline mb-2">
                <span class="fs-5 fw-extrabold text-white">Total Amount</span>
                <span class="fs-3 fw-extrabold text-warning">\${{ cartService.totalAmount().toFixed(2) }}</span>
              </div>
              <div class="small text-muted mb-3" style="font-size: 0.72rem;">
                Inclusive of all applicable taxes
              </div>

              <!-- Savings Pill -->
              <div class="p-2 mb-3 rounded-2 text-center small text-success fw-semibold" 
                   style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.25);">
                <i class="bi bi-check-circle-fill me-1"></i> You will save \${{ totalSavings().toFixed(2) }} on this order!
              </div>

              <!-- Payment Method Selection -->
              <div class="mb-3">
                <label class="small text-muted mb-2 d-block fw-semibold">Payment Option</label>
                <div class="d-flex flex-column gap-2">
                  <label class="d-flex align-items-center gap-2 p-2 rounded-2 border border-secondary cursor-pointer"
                         [class.border-warning]="paymentMethod === 'CARD'"
                         [class.bg-dark]="paymentMethod === 'CARD'">
                    <input type="radio" name="payMethod" [(ngModel)]="paymentMethod" value="CARD" class="form-check-input mt-0">
                    <span class="small text-white"><i class="bi bi-credit-card-2-front text-info me-1"></i> Credit / Debit Card</span>
                  </label>
                  <label class="d-flex align-items-center gap-2 p-2 rounded-2 border border-secondary cursor-pointer"
                         [class.border-warning]="paymentMethod === 'UPI'"
                         [class.bg-dark]="paymentMethod === 'UPI'">
                    <input type="radio" name="payMethod" [(ngModel)]="paymentMethod" value="UPI" class="form-check-input mt-0">
                    <span class="small text-white"><i class="bi bi-qr-code-scan text-success me-1"></i> UPI Instant Transfer</span>
                  </label>
                  <label class="d-flex align-items-center gap-2 p-2 rounded-2 border border-secondary cursor-pointer"
                         [class.border-warning]="paymentMethod === 'COD'"
                         [class.bg-dark]="paymentMethod === 'COD'">
                    <input type="radio" name="payMethod" [(ngModel)]="paymentMethod" value="COD" class="form-check-input mt-0">
                    <span class="small text-white"><i class="bi bi-cash-stack text-warning me-1"></i> Cash on Delivery</span>
                  </label>
                </div>
              </div>

              <!-- Simulation Toggle -->
              <div class="p-3 mb-3 rounded-2" style="background: rgba(255, 255, 255, 0.02); border: 1px dashed rgba(255, 255, 255, 0.15);">
                <div class="form-check form-switch mb-1">
                  <input class="form-check-input" type="checkbox" role="switch" id="simPay" [(ngModel)]="simulatePaymentSuccess">
                  <label class="form-check-label text-white small fw-bold" for="simPay">
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
                class="btn btn-amazon-primary w-100 py-3 d-flex align-items-center justify-content-center gap-2 fw-bold shadow-lg"
                [disabled]="processingCheckout()"
                (click)="executeCheckout()">
                @if (processingCheckout()) {
                  <span class="spinner-border spinner-border-sm" role="status"></span>
                  <span>Coordinating Microservices...</span>
                } @else {
                  <i class="bi bi-lock-fill"></i>
                  <span class="fs-6">PLACE YOUR ORDER</span>
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
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);

  getItemSvg(sku: string, title: string): SafeHtml {
    const meta = getProductMetadata(sku, title, '');
    return this.sanitizer.bypassSecurityTrustHtml(meta.svgArtwork);
  }

  addresses = signal<Address[]>([]);
  selectedAddressId = signal<number | null>(null);
  showAddressDrawer = signal(false);
  showNewAddressForm = signal(false);
  provisioningAddress = signal(false);

  newAddress: Partial<Address> = {
    recipientName: '',
    phone: '',
    streetLine: '',
    city: 'Springfield',
    state: 'IL',
    postalCode: '62704',
    isDefault: true
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
        if (list.length > 0) {
          if (!this.selectedAddressId()) {
            this.selectedAddressId.set(list[0].id);
          }
        } else {
          // No address found for this user account: automatically provision a default Springfield delivery address
          this.autoProvisionDefaultAddress();
        }
      },
      error: () => {
        this.autoProvisionDefaultAddress();
      }
    });
  }

  autoProvisionDefaultAddress(): void {
    if (this.provisioningAddress()) return;
    this.provisioningAddress.set(true);

    const recipientName = this.getDefaultRecipientName();
    const phone = '+1 (555) 019-2831';

    const defaultAddress = {
      recipientName,
      phone,
      streetLine: '742 Evergreen Terrace',
      city: 'Springfield',
      state: 'IL',
      postalCode: '62704',
      isDefault: true
    };

    this.deliveryService.createAddress(defaultAddress).subscribe({
      next: (res) => {
        this.provisioningAddress.set(false);
        if (res.data) {
          this.addresses.set([res.data]);
          this.selectedAddressId.set(res.data.id);
          this.toastService.info('Shipping Address', `Default delivery destination assigned to ${recipientName}.`);
        }
      },
      error: () => {
        this.provisioningAddress.set(false);
        // Fallback: populate newAddress form and expand drawer
        this.newAddress.recipientName = recipientName;
        this.newAddress.phone = phone;
        this.newAddress.streetLine = '742 Evergreen Terrace';
        this.showAddressDrawer.set(true);
        this.showNewAddressForm.set(true);
      }
    });
  }

  private getDefaultRecipientName(): string {
    const user = this.authService.currentUser();
    if (!user || !user.email) return 'Valued Customer';
    const namePart = user.email.split('@')[0];
    return namePart.charAt(0).toUpperCase() + namePart.slice(1);
  }

  getSelectedAddressName(): string {
    const addr = this.addresses().find(a => a.id === this.selectedAddressId());
    if (addr) return addr.recipientName;
    return this.getDefaultRecipientName();
  }

  getSelectedAddressText(): string {
    const addr = this.addresses().find(a => a.id === this.selectedAddressId());
    if (addr) {
      const street = addr.streetLine || addr.streetAddress || '742 Evergreen Terrace';
      const phone = addr.phone || addr.phoneNumber || '';
      return `${street}, ${addr.city}, ${addr.state} ${addr.postalCode}${phone ? ' • Ph: ' + phone : ''}`;
    }
    return '742 Evergreen Terrace, Springfield, IL 62704 (Auto-assigned standard delivery)';
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
    const name = this.newAddress.recipientName?.trim();
    const street = (this.newAddress.streetLine || this.newAddress.streetAddress || '').trim();
    const city = this.newAddress.city?.trim() || 'Springfield';
    const state = this.newAddress.state?.trim() || 'IL';
    const postalCode = this.newAddress.postalCode?.trim() || '62704';
    const phone = (this.newAddress.phone || this.newAddress.phoneNumber || '+1234567890').trim();

    if (!name || !street) {
      this.toastService.warning('Validation', 'Please provide a recipient name and street address.');
      return;
    }

    const payload = {
      recipientName: name,
      phone,
      streetLine: street,
      city,
      state,
      postalCode,
      isDefault: true
    };

    this.deliveryService.createAddress(payload).subscribe({
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
    let addressId = this.selectedAddressId();

    // If no address selected but addresses exist, pick the first
    if (!addressId && this.addresses().length > 0) {
      addressId = this.addresses()[0].id;
      this.selectedAddressId.set(addressId);
    }

    if (!addressId) {
      // If address is still missing, auto-provision and checkout
      this.toastService.info('Checkout', 'Initializing delivery destination...');
      const recipientName = this.getDefaultRecipientName();
      const phone = '+1 (555) 019-2831';
      const defaultAddress = {
        recipientName,
        phone,
        streetLine: '742 Evergreen Terrace',
        city: 'Springfield',
        state: 'IL',
        postalCode: '62704',
        isDefault: true
      };

      this.processingCheckout.set(true);
      this.deliveryService.createAddress(defaultAddress).subscribe({
        next: (createdRes) => {
          if (createdRes.data) {
            this.addresses.set([createdRes.data]);
            this.selectedAddressId.set(createdRes.data.id);
            this.performCheckout(createdRes.data.id);
          } else {
            this.processingCheckout.set(false);
          }
        },
        error: () => {
          this.processingCheckout.set(false);
          this.showAddressDrawer.set(true);
          this.showNewAddressForm.set(true);
          this.toastService.warning('Address Required', 'Please confirm your shipping address to place the order.');
        }
      });
      return;
    }

    this.performCheckout(addressId);
  }

  private performCheckout(addressId: number): void {
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
