import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { OrderService } from '../../services/order.service';
import { DeliveryService } from '../../services/delivery.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { Order } from '../../models/order.model';
import { Delivery, DeliveryPartner } from '../../models/delivery.model';
import { getProductMetadata } from '../../utils/product-assets';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="container py-3">
      <!-- Breadcrumb Navigation -->
      <nav aria-label="breadcrumb" class="mb-3">
        <ol class="breadcrumb small">
          <li class="breadcrumb-item"><a routerLink="/catalog" class="text-muted text-decoration-none">Home</a></li>
          <li class="breadcrumb-item active text-white" aria-current="page">Your Orders &amp; Live Tracking</li>
        </ol>
      </nav>

      <!-- Page Header & Quick Search Bar -->
      <div class="glass-panel p-4 mb-4">
        <div class="row align-items-center g-3">
          <div class="col-md-7">
            <h3 class="fw-extrabold text-white mb-1">
              <i class="bi bi-box2-heart text-warning me-2"></i> Your Orders &amp; Live Telemetry
            </h3>
            <p class="text-muted small mb-0">
              Real-time shipment telemetry synchronized across Order, Inventory, and Delivery fleets via Apache Kafka.
            </p>
          </div>
          <div class="col-md-5">
            <div class="input-group">
              <span class="input-group-text bg-dark border-secondary text-muted">Order #</span>
              <input 
                type="number" 
                class="form-control" 
                [(ngModel)]="searchOrderId" 
                placeholder="Lookup Order ID (e.g. 1, 2, 3)"
                (keyup.enter)="loadOrder(searchOrderId)">
              <button class="btn btn-amazon-primary px-3 fw-bold" (click)="loadOrder(searchOrderId)">
                <i class="bi bi-search me-1"></i> Track
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- MAIN 2-COLUMN VIEW: ORDER HISTORY (LEFT) + LIVE TRACKING & DETAILS (RIGHT) -->
      @if (loadingOrders()) {
        <div class="glass-panel p-5 text-center my-4">
          <div class="spinner-border text-warning mb-3" role="status"></div>
          <div class="text-white fw-bold">Loading Your Order History...</div>
          <div class="text-muted small">Fetching records from distributed order_db</div>
        </div>
      } @else if (userOrders().length === 0 && !order()) {
        <!-- Empty State -->
        <div class="glass-panel text-center py-5 px-4 my-4" style="max-width: 560px; margin: 0 auto;">
          <div class="d-inline-flex p-4 rounded-circle mb-3" style="background: rgba(245, 158, 11, 0.1);">
            <i class="bi bi-bag-x fs-1 text-warning"></i>
          </div>
          <h3 class="text-white fw-bold mb-2">No Orders Found Yet</h3>
          <p class="text-muted mb-4">
            You haven't placed any orders yet. Discover our latest electronics and gadget deals on the storefront!
          </p>
          <a routerLink="/catalog" class="btn btn-amazon-primary px-4 py-2 fw-bold">
            <i class="bi bi-shop me-1"></i> Start Shopping
          </a>
        </div>
      } @else {
        <div class="row g-4">
          
          <!-- LEFT COLUMN: ORDER HISTORY LIST (40%) -->
          <div class="col-lg-4">
            <div class="glass-panel p-3 mb-3">
              <div class="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom border-secondary">
                <span class="fw-bold text-white small text-uppercase" style="letter-spacing: 0.05em;">
                  <i class="bi bi-clock-history me-1 text-warning"></i> Order History ({{ userOrders().length }})
                </span>
                <button class="btn btn-link text-white-50 p-0 small text-decoration-none" (click)="loadUserOrders()">
                  <i class="bi bi-arrow-clockwise"></i> Refresh
                </button>
              </div>

              <!-- Order List Cards -->
              <div class="d-flex flex-column gap-2" style="max-height: 700px; overflow-y: auto;">
                @for (ord of userOrders(); track ord.orderId) {
                  <div class="order-history-card p-3 rounded-3 transition-all cursor-pointer"
                       [class.order-card-selected]="order()?.orderId === ord.orderId"
                       (click)="selectOrder(ord)">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <div class="fw-bold text-white font-monospace small">#{{ ord.orderNumber }}</div>
                        <div class="text-muted" style="font-size: 0.72rem;">{{ ord.createdAt | date:'mediumDate' }}</div>
                      </div>
                      <span class="badge badge-pill-status" [ngClass]="getStatusBadgeClass(ord.status)">
                        {{ ord.status }}
                      </span>
                    </div>

                    <div class="d-flex justify-content-between align-items-center pt-2 border-top border-dark" style="font-size: 0.78rem;">
                      <span class="text-white-50">{{ ord.items.length }} {{ ord.items.length === 1 ? 'item' : 'items' }}</span>
                      <strong class="text-white">\${{ ord.totalAmount.toFixed(2) }}</strong>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- RIGHT COLUMN: ACTIVE ORDER TRACKING & DETAILS (60%) -->
          <div class="col-lg-8">
            @if (loading()) {
              <div class="glass-panel p-4 mb-4">
                <div class="skeleton-shimmer mb-3" style="height: 28px; width: 45%;"></div>
                <div class="skeleton-shimmer mb-4" style="height: 80px; width: 100%;"></div>
                <div class="skeleton-shimmer" style="height: 160px; width: 100%;"></div>
              </div>
            } @else if (order()) {
              <!-- 1. LIVE SHIPMENT STEPPER -->
              <div class="glass-panel p-4 mb-4 position-relative overflow-hidden" 
                   style="background: linear-gradient(180deg, #131b2e 0%, #0d121f 100%);">
                
                <div class="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center border-bottom border-secondary pb-3 mb-4 gap-2">
                  <div>
                    <span class="text-muted small">Tracking Package for Order</span>
                    <h4 class="fw-extrabold text-white m-0 font-monospace">{{ order()!.orderNumber }}</h4>
                  </div>
                  <div class="d-flex align-items-center gap-2">
                    <span class="badge bg-dark border border-secondary text-white-50 px-3 py-2 small">
                      Placed on {{ order()!.createdAt | date:'mediumDate' }}
                    </span>
                    <span class="badge badge-pill-status" [ngClass]="getStatusBadgeClass(order()!.status)">
                      {{ order()!.status }}
                    </span>
                  </div>
                </div>

                <!-- CONNECTED STEPPER COMPONENT -->
                <div class="stepper-container px-2 px-md-4 my-4">
                  <div class="position-relative d-flex justify-content-between align-items-center">
                    <!-- Background Connecting Line -->
                    <div class="stepper-line-bg position-absolute top-50 start-0 w-100 translate-middle-y"
                         style="height: 4px; background: #28334a; z-index: 1;"></div>
                    
                    <!-- Active Progress Fill Line -->
                    <div class="stepper-line-fill position-absolute top-50 start-0 translate-middle-y"
                         [style.width]="getStepProgressPercentage()"
                         style="height: 4px; background: linear-gradient(90deg, #10b981 0%, #34d399 100%); z-index: 2; transition: width 0.5s ease;"></div>

                    <!-- Step 1: Ordered -->
                    <div class="step-node text-center position-relative z-3">
                      <div class="step-circle rounded-circle d-flex align-items-center justify-content-center mx-auto mb-2"
                           [ngClass]="isStepActive('ORDERED') ? 'step-circle-active' : 'step-circle-inactive'">
                        <i class="bi bi-cart-check-fill fs-5"></i>
                      </div>
                      <div class="step-label fw-bold text-white small">Ordered</div>
                      <div class="step-date text-muted" style="font-size: 0.68rem;">Verified</div>
                    </div>

                    <!-- Step 2: Confirmed -->
                    <div class="step-node text-center position-relative z-3">
                      <div class="step-circle rounded-circle d-flex align-items-center justify-content-center mx-auto mb-2"
                           [ngClass]="isStepActive('CONFIRMED') ? 'step-circle-active' : 'step-circle-inactive'">
                        <i class="bi bi-shield-fill-check fs-5"></i>
                      </div>
                      <div class="step-label fw-bold text-white small">Stock Reserved</div>
                      <div class="step-date text-muted" style="font-size: 0.68rem;">Pessimistic Lock</div>
                    </div>

                    <!-- Step 3: Kafka Dispatched -->
                    <div class="step-node text-center position-relative z-3">
                      <div class="step-circle rounded-circle d-flex align-items-center justify-content-center mx-auto mb-2"
                           [ngClass]="isStepActive('SHIPPED') ? 'step-circle-active' : 'step-circle-inactive'">
                        <i class="bi bi-box-seam-fill fs-5"></i>
                      </div>
                      <div class="step-label fw-bold text-white small">Dispatched</div>
                      <div class="step-date text-muted" style="font-size: 0.68rem;">Kafka Event</div>
                    </div>

                    <!-- Step 4: Out for Delivery -->
                    <div class="step-node text-center position-relative z-3">
                      <div class="step-circle rounded-circle d-flex align-items-center justify-content-center mx-auto mb-2"
                           [ngClass]="isStepActive('IN_TRANSIT') ? 'step-circle-active' : 'step-circle-inactive'">
                        <i class="bi bi-truck fs-5"></i>
                      </div>
                      <div class="step-label fw-bold text-white small">Out for Delivery</div>
                      <div class="step-date text-muted" style="font-size: 0.68rem;">Fleet Courier</div>
                    </div>

                    <!-- Step 5: Delivered -->
                    <div class="step-node text-center position-relative z-3">
                      <div class="step-circle rounded-circle d-flex align-items-center justify-content-center mx-auto mb-2"
                           [ngClass]="isStepActive('DELIVERED') ? 'step-circle-active' : 'step-circle-inactive'">
                        <i class="bi bi-house-door-fill fs-5"></i>
                      </div>
                      <div class="step-label fw-bold text-white small">Delivered</div>
                      <div class="step-date text-muted" style="font-size: 0.68rem;">Package Handed</div>
                    </div>
                  </div>
                </div>

                <!-- LIVE COURIER / DELIVERY STATUS CARD -->
                @if (delivery()) {
                  <div class="p-3 rounded-3 mt-4" style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25);">
                    <div class="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2">
                      <div class="d-flex align-items-center gap-2">
                        <div class="rounded-circle p-2 bg-success text-white d-flex align-items-center justify-content-center" style="width: 36px; height: 36px;">
                          <i class="bi bi-bicycle fs-5"></i>
                        </div>
                        <div>
                          <div class="fw-bold text-white small">Delivery Dispatch Partner: {{ partner()?.fullName || 'OrderFleet Express Carrier' }}</div>
                          <div class="text-white-50" style="font-size: 0.72rem;">Vehicle: {{ partner()?.vehicleType || 'Electric Scooter' }} &bull; Contact: {{ partner()?.phone || '+1 (555) 019-2831' }}</div>
                        </div>
                      </div>
                      <span class="badge bg-success text-white px-3 py-1 fw-bold small">
                        Status: {{ delivery()!.status }}
                      </span>
                    </div>
                  </div>
                }
              </div>

              <!-- 2. PACKAGE ITEMS & DESTINATION SUMMARY -->
              <div class="row g-3">
                <!-- Package Items Breakdown -->
                <div class="col-md-7">
                  <div class="glass-panel p-3 h-100">
                    <h6 class="fw-bold text-white mb-3 border-bottom border-secondary pb-2">
                      <i class="bi bi-box me-1 text-primary"></i> Package Items ({{ order()!.items.length }})
                    </h6>

                    <div class="d-flex flex-column gap-2">
                      @for (item of order()!.items; track item.id) {
                        <div class="d-flex align-items-center justify-content-between p-2 rounded-2"
                             style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05);">
                          <div class="d-flex align-items-center gap-2">
                            <div class="rounded-2 p-1 d-flex align-items-center justify-content-center flex-shrink-0"
                                 style="width: 44px; height: 44px; background: #0f172a; border: 1px solid #334155;">
                              <div style="width: 38px; height: 38px;" [innerHTML]="getItemSvg(item.sku, item.productTitle)"></div>
                            </div>
                            <div>
                              <div class="text-white small fw-bold text-truncate" style="max-width: 220px;">{{ item.productTitle }}</div>
                              <div class="text-muted" style="font-size: 0.72rem;">Qty: {{ item.quantity }} &bull; \${{ item.unitPrice.toFixed(2) }} each</div>
                            </div>
                          </div>
                          <div class="text-white fw-bold small">\${{ item.subtotal.toFixed(2) }}</div>
                        </div>
                      }
                    </div>

                    <div class="d-flex justify-content-between align-items-center pt-3 mt-3 border-top border-secondary">
                      <span class="text-white-50 small">Order Total:</span>
                      <span class="fs-5 fw-extrabold text-white">\${{ order()!.totalAmount.toFixed(2) }}</span>
                    </div>
                  </div>
                </div>

                <!-- Destination Address & Kafka Telemetry -->
                <div class="col-md-5">
                  <div class="glass-panel p-3 h-100">
                    <h6 class="fw-bold text-white mb-3 border-bottom border-secondary pb-2">
                      <i class="bi bi-geo-alt me-1 text-danger"></i> Shipping Snapshot
                    </h6>
                    <div class="text-white small fw-bold mb-1">
                      {{ delivery()?.deliveryAddressSnapshot || 'Express Registered Address' }}
                    </div>
                    <div class="text-white-50 small mb-3">
                      Order ID Reference: #{{ order()!.orderNumber }}
                    </div>

                    <div class="mt-4 pt-3 border-top border-secondary">
                      <div class="small fw-bold text-white mb-1">
                        <i class="bi bi-activity text-info me-1"></i> Distributed Event Log
                      </div>
                      <div class="text-muted" style="font-size: 0.7rem; line-height: 1.4;">
                        Topic: <code class="text-info">order.created</code><br>
                        Idempotency Key: <code class="text-warning">redis:idemp:{{ order()!.orderId }}</code><br>
                        Lock: MySQL InnoDB Pessimistic Write Lock
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            } @else {
              <div class="glass-panel text-center py-5">
                <i class="bi bi-search fs-2 text-white-50 mb-2"></i>
                <div class="text-white fw-bold">Select an order from history or enter an Order ID above.</div>
              </div>
            }
          </div>

        </div>
      }
    </div>
  `,
  styles: [`
    .order-history-card {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.06);
    }
    .order-history-card:hover {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(245, 158, 11, 0.3);
    }
    .order-card-selected {
      background: rgba(245, 158, 11, 0.08) !important;
      border-color: #f59e0b !important;
    }
    .cursor-pointer {
      cursor: pointer;
    }
    .badge-pill-status {
      font-size: 0.72rem;
      padding: 3px 8px;
      border-radius: 12px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .badge-status-confirmed {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
    .badge-status-pending {
      background: rgba(245, 158, 11, 0.15);
      color: #fbbf24;
      border: 1px solid rgba(245, 158, 11, 0.3);
    }
    .badge-status-cancelled {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }
    .badge-status-delivered {
      background: rgba(59, 130, 246, 0.15);
      color: #60a5fa;
      border: 1px solid rgba(59, 130, 246, 0.3);
    }
    .step-circle {
      width: 44px;
      height: 44px;
      transition: all 0.3s ease;
    }
    .step-circle-active {
      background: linear-gradient(135deg, #10b981, #059669);
      color: #ffffff;
      box-shadow: 0 0 14px rgba(16, 185, 129, 0.4);
    }
    .step-circle-inactive {
      background: #1e293b;
      color: #475569;
      border: 1px solid #334155;
    }
  `]
})
export class OrdersComponent implements OnInit {
  private orderService = inject(OrderService);
  private deliveryService = inject(DeliveryService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private route = inject(ActivatedRoute);
  private sanitizer = inject(DomSanitizer);

  searchOrderId = 1;
  userOrders = signal<Order[]>([]);
  loadingOrders = signal(true);
  order = signal<Order | null>(null);
  delivery = signal<Delivery | null>(null);
  partner = signal<DeliveryPartner | null>(null);
  loading = signal(false);

  ngOnInit(): void {
    const paramId = this.route.snapshot.queryParams['orderId'];
    if (paramId) {
      this.searchOrderId = Number(paramId);
      this.loadOrder(this.searchOrderId);
    }
    this.loadUserOrders();
  }

  isAdminUser(): boolean {
    return this.authService.isAdmin();
  }

  loadUserOrders(): void {
    this.loadingOrders.set(true);

    if (this.authService.isAdmin()) {
      this.orderService.getAllOrdersAdmin().subscribe({
        next: (res) => {
          const list = res.data || [];
          this.userOrders.set(list);
          this.loadingOrders.set(false);
          if (!this.order() && list.length > 0) {
            this.selectOrder(list[0]);
          }
        },
        error: () => {
          this.fetchCustomerOrders();
        }
      });
    } else {
      this.fetchCustomerOrders();
    }
  }

  private fetchCustomerOrders(): void {
    this.orderService.getMyOrders().subscribe({
      next: (res) => {
        const list = res.data || [];
        this.userOrders.set(list);
        this.loadingOrders.set(false);
        if (!this.order() && list.length > 0) {
          this.selectOrder(list[0]);
        } else if (!this.order()) {
          this.loadOrder(10);
        }
      },
      error: () => {
        this.loadingOrders.set(false);
        if (!this.order()) {
          this.loadOrder(10);
        }
      }
    });
  }

  selectOrder(order: Order): void {
    this.searchOrderId = order.orderId;
    this.order.set(order);
    this.loadDelivery(order.orderId);
  }

  loadOrder(orderId: number): void {
    if (!orderId) return;
    this.loading.set(true);

    this.orderService.getOrderById(orderId).subscribe({
      next: (orderRes) => {
        this.order.set(orderRes.data);
        this.loadDelivery(orderId);
      },
      error: () => {
        this.order.set(null);
        this.delivery.set(null);
        this.loading.set(false);
        this.toastService.warning('Order Lookup', `Order #${orderId} was not found.`);
      }
    });
  }

  loadDelivery(orderId: number): void {
    this.deliveryService.getDeliveryByOrderId(orderId).subscribe({
      next: (delRes) => {
        this.delivery.set(delRes.data);
        if (delRes.data && delRes.data.deliveryPartnerId) {
          this.deliveryService.getPartnerById(delRes.data.deliveryPartnerId).subscribe({
            next: (pRes) => this.partner.set(pRes.data),
            error: () => {}
          });
        }
        this.loading.set(false);
      },
      error: () => {
        this.delivery.set(null);
        this.loading.set(false);
      }
    });
  }

  getItemSvg(sku: string, title: string): SafeHtml {
    const meta = getProductMetadata(sku, title, '');
    return this.sanitizer.bypassSecurityTrustHtml(meta.svgArtwork);
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'CONFIRMED': return 'badge-status-confirmed';
      case 'PENDING': return 'badge-status-pending';
      case 'CANCELLED': return 'badge-status-cancelled';
      case 'DELIVERED': return 'badge-status-delivered';
      default: return 'badge-status-pending';
    }
  }

  isStepActive(step: string): boolean {
    const delStatus = this.delivery()?.status;
    const ordStatus = this.order()?.status;

    if (step === 'ORDERED') return true;
    if (step === 'CONFIRMED') return ordStatus === 'CONFIRMED' || ordStatus === 'DELIVERED';
    if (step === 'SHIPPED') return delStatus === 'ASSIGNED' || delStatus === 'PICKED_UP' || delStatus === 'IN_TRANSIT' || delStatus === 'DELIVERED';
    if (step === 'IN_TRANSIT') return delStatus === 'IN_TRANSIT' || delStatus === 'DELIVERED';
    if (step === 'DELIVERED') return delStatus === 'DELIVERED';
    return false;
  }

  getStepProgressPercentage(): string {
    const delStatus = this.delivery()?.status;
    if (delStatus === 'DELIVERED') return '100%';
    if (delStatus === 'IN_TRANSIT') return '75%';
    if (delStatus === 'PICKED_UP' || delStatus === 'ASSIGNED') return '50%';
    if (this.order()?.status === 'CONFIRMED') return '25%';
    return '0%';
  }
}
