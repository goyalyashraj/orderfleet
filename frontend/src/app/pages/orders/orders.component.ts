import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { DeliveryService } from '../../services/delivery.service';
import { ToastService } from '../../services/toast.service';
import { Order } from '../../models/order.model';
import { Delivery, DeliveryPartner } from '../../models/delivery.model';

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

      <!-- Search & Lookup Header -->
      <div class="glass-panel p-4 mb-4">
        <div class="row align-items-center g-3">
          <div class="col-md-7">
            <h3 class="fw-extrabold text-white mb-1">
              <i class="bi bi-box2-heart text-warning me-2"></i> Track Your Shipment
            </h3>
            <p class="text-muted small mb-0">
              Real-time shipment telemetry synchronized across Order, Inventory, and Delivery fleets.
            </p>
          </div>
          <div class="col-md-5">
            <div class="input-group">
              <span class="input-group-text bg-dark border-secondary text-muted">Order ID</span>
              <input 
                type="number" 
                class="form-control" 
                [(ngModel)]="searchOrderId" 
                placeholder="Enter Order # (e.g. 1, 2, 3)"
                (keyup.enter)="loadOrder(searchOrderId)">
              <button class="btn btn-amazon-primary px-3" (click)="loadOrder(searchOrderId)">
                <i class="bi bi-search me-1"></i> Track
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- SKELETON / LOADING STATE -->
      @if (loading()) {
        <div class="glass-panel p-4 mb-4">
          <div class="skeleton-shimmer mb-3" style="height: 28px; width: 35%;"></div>
          <div class="skeleton-shimmer mb-4" style="height: 60px; width: 100%;"></div>
          <div class="row g-3">
            <div class="col-md-6"><div class="skeleton-shimmer" style="height: 120px; width: 100%;"></div></div>
            <div class="col-md-6"><div class="skeleton-shimmer" style="height: 120px; width: 100%;"></div></div>
          </div>
        </div>
      } @else if (order()) {
        <!-- LIVE SHIPMENT TRACKING STEPPER (Myntra/Amazon style) -->
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
          <div class="stepper-container px-2 px-md-5 my-4">
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
                <div class="small fw-bold text-white">Ordered</div>
                <div class="text-muted" style="font-size: 0.7rem;">Verified</div>
              </div>

              <!-- Step 2: Confirmed -->
              <div class="step-node text-center position-relative z-3">
                <div class="step-circle rounded-circle d-flex align-items-center justify-content-center mx-auto mb-2"
                     [ngClass]="isStepActive('CONFIRMED') ? 'step-circle-active' : 'step-circle-inactive'">
                  <i class="bi bi-shield-check fs-5"></i>
                </div>
                <div class="small fw-bold text-white">Confirmed</div>
                <div class="text-muted" style="font-size: 0.7rem;">Stock Locked</div>
              </div>

              <!-- Step 3: Shipped (Assigned / Picked Up) -->
              <div class="step-node text-center position-relative z-3">
                <div class="step-circle rounded-circle d-flex align-items-center justify-content-center mx-auto mb-2"
                     [ngClass]="isStepActive('SHIPPED') ? 'step-circle-active' : 'step-circle-inactive'">
                  <i class="bi bi-box-seam-fill fs-5"></i>
                </div>
                <div class="small fw-bold text-white">Shipped</div>
                <div class="text-muted" style="font-size: 0.7rem;">Hub Dispatched</div>
              </div>

              <!-- Step 4: Out for Delivery -->
              <div class="step-node text-center position-relative z-3">
                <div class="step-circle rounded-circle d-flex align-items-center justify-content-center mx-auto mb-2"
                     [ngClass]="isStepActive('IN_TRANSIT') ? 'step-circle-active' : 'step-circle-inactive'">
                  <i class="bi bi-bicycle fs-5"></i>
                </div>
                <div class="small fw-bold text-white">Out for Delivery</div>
                <div class="text-muted" style="font-size: 0.7rem;">Courier on Way</div>
              </div>

              <!-- Step 5: Delivered -->
              <div class="step-node text-center position-relative z-3">
                <div class="step-circle rounded-circle d-flex align-items-center justify-content-center mx-auto mb-2"
                     [ngClass]="isStepActive('DELIVERED') ? 'step-circle-completed' : 'step-circle-inactive'">
                  <i class="bi bi-house-check-fill fs-5"></i>
                </div>
                <div class="small fw-bold text-white">Delivered</div>
                <div class="text-muted" style="font-size: 0.7rem;">Package Handover</div>
              </div>
            </div>
          </div>

          <!-- Courier Partner Info Card (Amazon/Swiggy delivery partner strip) -->
          @if (delivery()) {
            <div class="p-3 rounded-3 mt-4 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3"
                 style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);">
              <div class="d-flex align-items-center gap-3">
                <div class="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                     style="width: 50px; height: 50px; background: rgba(99, 102, 241, 0.2); border: 1px solid rgba(99, 102, 241, 0.4);">
                  <i class="bi bi-person-fill-gear fs-4 text-primary"></i>
                </div>
                <div>
                  <div class="small text-muted">Assigned Delivery Partner</div>
                  <h6 class="fw-bold text-white m-0">
                    {{ partner() ? partner()!.fullName : 'Fleet Courier #1' }} 
                    <span class="badge bg-dark border border-secondary text-warning small ms-1">
                      <i class="bi bi-bicycle"></i> {{ partner() ? partner()!.vehicleType : 'Motorcycle' }}
                    </span>
                  </h6>
                  <div class="text-muted small" style="font-size: 0.72rem;">
                    Status: <span class="text-success fw-bold">{{ delivery()!.status }}</span> &bull; Origin: {{ delivery()!.pickupLocation }}
                  </div>
                </div>
              </div>

              <div class="d-flex align-items-center gap-2">
                <a routerLink="/fleet" class="btn btn-glass btn-sm text-nowrap">
                  <i class="bi bi-broadcast me-1"></i> Open Courier Fleet Console
                </a>
              </div>
            </div>
          }
        </div>

        <!-- 2-COLUMN DETAILS: Items & Audit History -->
        <div class="row g-4">
          <!-- Left: Order Items & Payment -->
          <div class="col-lg-6">
            <div class="glass-panel p-4 h-100">
              <h5 class="fw-bold text-white mb-3 border-bottom border-secondary pb-2">
                <i class="bi bi-receipt text-warning me-2"></i> Items in this Order
              </h5>

              <div class="list-group list-group-flush border-0">
                @for (item of order()!.items; track item.id) {
                  <div class="list-group-item bg-transparent text-white px-0 py-3 border-secondary d-flex justify-content-between align-items-center">
                    <div class="d-flex align-items-center gap-3">
                      <div class="rounded-2 d-flex align-items-center justify-content-center"
                           style="width: 48px; height: 48px; background: #1e293b; border: 1px solid #334155;">
                        <i class="bi bi-box-seam text-warning"></i>
                      </div>
                      <div>
                        <div class="fw-semibold text-white small">{{ item.productTitle }}</div>
                        <div class="text-muted font-monospace" style="font-size: 0.72rem;">SKU: {{ item.sku }}</div>
                        <div class="text-muted small" style="font-size: 0.75rem;">Qty: {{ item.quantity }} &times; \${{ item.unitPrice.toFixed(2) }}</div>
                      </div>
                    </div>
                    <div class="fw-bold text-white">\${{ item.subtotal.toFixed(2) }}</div>
                  </div>
                }
              </div>

              <!-- Price & Payment Summary -->
              <div class="border-top border-secondary pt-3 mt-3">
                <div class="d-flex justify-content-between text-muted small py-1">
                  <span>Stock Lock Code</span>
                  <span class="font-monospace text-info">{{ order()!.reservationCode }}</span>
                </div>
                <div class="d-flex justify-content-between text-muted small py-1">
                  <span>Payment Gateway Status</span>
                  <span class="badge bg-success">{{ order()!.paymentStatus }}</span>
                </div>
                <div class="d-flex justify-content-between text-white fw-bold fs-5 pt-2 border-top border-secondary mt-2">
                  <span>Total Paid</span>
                  <span style="color: #ffa41c;">\${{ order()!.totalAmount.toFixed(2) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Right: Delivery Destination & Audit Trail -->
          <div class="col-lg-6">
            <div class="glass-panel p-4 h-100">
              <h5 class="fw-bold text-white mb-3 border-bottom border-secondary pb-2">
                <i class="bi bi-clock-history text-info me-2"></i> Shipment Event Trail
              </h5>

              @if (delivery()) {
                <div class="p-3 rounded-2 mb-3" style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06);">
                  <div class="small text-muted mb-1"><i class="bi bi-geo-alt-fill text-danger me-1"></i> Delivery Address:</div>
                  <div class="text-white small fw-semibold">{{ delivery()!.deliveryAddressSnapshot }}</div>
                </div>

                <!-- Event Timeline -->
                <div class="timeline ps-3 border-start border-secondary mt-3">
                  @for (log of delivery()!.logs; track log.timestamp) {
                    <div class="position-relative mb-3 ps-3">
                      <div class="position-absolute start-0 top-0 translate-middle-x rounded-circle" 
                           style="width: 10px; height: 10px; left: -1px !important; background: #10b981;"></div>
                      <div class="d-flex justify-content-between align-items-center">
                        <span class="badge bg-dark border border-secondary text-info small">{{ log.status }}</span>
                        <span class="text-muted small" style="font-size: 0.72rem;">{{ log.timestamp | date:'mediumTime' }}</span>
                      </div>
                      <div class="text-white-50 small mt-1">{{ log.note }}</div>
                    </div>
                  }
                </div>
              } @else {
                <div class="text-center py-5 text-muted">
                  <i class="bi bi-hourglass fs-2 mb-2 d-block"></i>
                  <span>No delivery dispatch record created yet for this order.</span>
                </div>
              }
            </div>
          </div>
        </div>
      } @else {
        <!-- Empty Order Selection -->
        <div class="glass-panel text-center py-5 p-4">
          <div class="d-inline-flex p-4 rounded-circle mb-3" style="background: rgba(99, 102, 241, 0.1);">
            <i class="bi bi-box2 fs-1 text-primary"></i>
          </div>
          <h4 class="text-white fw-bold">Order Not Found</h4>
          <p class="text-muted mb-4 mx-auto" style="max-width: 440px;">
            We couldn't locate an order with ID {{ searchOrderId }}. Try entering another order number or explore your shopping cart.
          </p>
          <a routerLink="/catalog" class="btn btn-amazon-primary">
            <i class="bi bi-grid-fill me-1"></i> Browse Catalog
          </a>
        </div>
      }
    </div>
  `,
  styles: [`
    .step-circle {
      width: 44px;
      height: 44px;
      border: 2px solid #334155;
      background: #0f172a;
      transition: all 0.3s ease;
    }
    .step-circle-active {
      border-color: #10b981 !important;
      background: #10b981 !important;
      color: #ffffff !important;
      box-shadow: 0 0 16px rgba(16, 185, 129, 0.5);
    }
    .step-circle-completed {
      border-color: #10b981 !important;
      background: #10b981 !important;
      color: #ffffff !important;
    }
    .step-circle-inactive {
      color: #64748b;
    }
  `]
})
export class OrdersComponent implements OnInit {
  private orderService = inject(OrderService);
  private deliveryService = inject(DeliveryService);
  private toastService = inject(ToastService);
  private route = inject(ActivatedRoute);

  searchOrderId = 2;
  order = signal<Order | null>(null);
  delivery = signal<Delivery | null>(null);
  partner = signal<DeliveryPartner | null>(null);
  loading = signal(false);

  ngOnInit(): void {
    const paramId = this.route.snapshot.queryParams['orderId'];
    if (paramId) {
      this.searchOrderId = Number(paramId);
      this.loadOrder(this.searchOrderId);
    } else {
      this.loadOrder(2);
    }
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
