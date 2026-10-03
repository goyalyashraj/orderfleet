import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { DeliveryService } from '../../services/delivery.service';
import { Order } from '../../models/order.model';
import { Delivery } from '../../models/delivery.model';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="container py-4">
      <!-- Page Header & Lookup Input -->
      <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h2 class="fw-bold text-white mb-1">Order & Shipment Tracking</h2>
          <p class="text-muted small">Live distributed tracking across Order and Delivery microservices</p>
        </div>

        <div class="input-group" style="max-width: 320px;">
          <span class="input-group-text bg-dark border-secondary text-muted">Order #</span>
          <input 
            type="number" 
            class="form-control form-control-sm" 
            [(ngModel)]="searchOrderId" 
            placeholder="Enter Order ID (e.g. 1, 2, 3)"
            (keyup.enter)="loadOrder(searchOrderId)">
          <button class="btn btn-gradient-primary btn-sm" (click)="loadOrder(searchOrderId)">
            Track
          </button>
        </div>
      </div>

      @if (loading()) {
        <div class="text-center py-5">
          <div class="spinner-border text-primary" role="status"></div>
          <p class="text-muted mt-2">Retrieving order details and tracking telemetry...</p>
        </div>
      } @else if (order()) {
        <div class="row g-4">
          <!-- Order Overview Card -->
          <div class="col-lg-5">
            <div class="glass-panel p-4 h-100">
              <div class="d-flex justify-content-between align-items-center mb-3 border-bottom border-secondary pb-2">
                <div>
                  <div class="text-muted small">Order Number</div>
                  <div class="fw-bold text-white fs-5">{{ order()!.orderNumber }}</div>
                </div>
                <span class="badge badge-pill-status" [ngClass]="getStatusBadgeClass(order()!.status)">
                  {{ order()!.status }}
                </span>
              </div>

              <!-- Metadata Summary -->
              <div class="mb-3">
                <div class="d-flex justify-content-between text-muted small py-1">
                  <span>Order Placed</span>
                  <span class="text-white">{{ order()!.createdAt | date:'medium' }}</span>
                </div>
                <div class="d-flex justify-content-between text-muted small py-1">
                  <span>Payment Status</span>
                  <span class="badge bg-success small">{{ order()!.paymentStatus }}</span>
                </div>
                <div class="d-flex justify-content-between text-muted small py-1">
                  <span>Stock Lock Code</span>
                  <span class="font-monospace text-info small">{{ order()!.reservationCode }}</span>
                </div>
                <div class="d-flex justify-content-between text-muted small py-1">
                  <span>Total Billed</span>
                  <span class="fw-bold text-white fs-6">\${{ order()!.totalAmount.toFixed(2) }}</span>
                </div>
              </div>

              <!-- Purchased Items List -->
              <h6 class="fw-bold text-white mt-4 mb-2">Purchased Items</h6>
              <div class="list-group list-group-flush border-0">
                @for (item of order()!.items; track item.id) {
                  <div class="list-group-item bg-transparent text-white px-0 py-2 border-secondary d-flex justify-content-between align-items-center">
                    <div>
                      <div class="small fw-semibold">{{ item.productTitle }}</div>
                      <div class="text-muted small" style="font-size: 0.75rem;">Qty: {{ item.quantity }} × \${{ item.unitPrice.toFixed(2) }}</div>
                    </div>
                    <div class="fw-bold small">\${{ item.subtotal.toFixed(2) }}</div>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Shipment Telemetry & Timeline Card -->
          <div class="col-lg-7">
            <div class="glass-panel p-4 h-100">
              <div class="d-flex justify-content-between align-items-center mb-4 border-bottom border-secondary pb-2">
                <h5 class="fw-bold text-white m-0">
                  <i class="bi bi-truck text-primary me-2"></i> Delivery Telemetry
                </h5>
                @if (delivery()) {
                  <span class="badge badge-pill-status" [ngClass]="getDeliveryBadgeClass(delivery()!.status)">
                    {{ delivery()!.status }}
                  </span>
                }
              </div>

              @if (delivery()) {
                <!-- Pickup & Destination -->
                <div class="row g-3 mb-4">
                  <div class="col-sm-6">
                    <div class="glass-panel p-3">
                      <div class="text-muted small"><i class="bi bi-building me-1"></i> Origin Hub</div>
                      <div class="text-white small fw-bold mt-1">{{ delivery()!.pickupLocation }}</div>
                    </div>
                  </div>
                  <div class="col-sm-6">
                    <div class="glass-panel p-3">
                      <div class="text-muted small"><i class="bi bi-geo-alt-fill text-danger me-1"></i> Destination</div>
                      <div class="text-white small fw-bold mt-1 text-truncate" [title]="delivery()!.deliveryAddressSnapshot">
                        {{ delivery()!.deliveryAddressSnapshot }}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Visual Step Progress Tracker -->
                <div class="px-2 mb-4">
                  <div class="d-flex justify-content-between position-relative">
                    <div class="text-center" [class.opacity-50]="!isStepCompleted('PENDING')">
                      <div class="rounded-circle d-inline-flex p-2 mb-1" 
                           [ngClass]="isStepCompleted('PENDING') ? 'bg-primary text-white' : 'bg-dark text-muted border border-secondary'">
                        <i class="bi bi-clipboard-check"></i>
                      </div>
                      <div class="small fw-bold text-white" style="font-size: 0.75rem;">Created</div>
                    </div>

                    <div class="text-center" [class.opacity-50]="!isStepCompleted('ASSIGNED')">
                      <div class="rounded-circle d-inline-flex p-2 mb-1"
                           [ngClass]="isStepCompleted('ASSIGNED') ? 'bg-primary text-white' : 'bg-dark text-muted border border-secondary'">
                        <i class="bi bi-person-check"></i>
                      </div>
                      <div class="small fw-bold text-white" style="font-size: 0.75rem;">Assigned</div>
                    </div>

                    <div class="text-center" [class.opacity-50]="!isStepCompleted('PICKED_UP')">
                      <div class="rounded-circle d-inline-flex p-2 mb-1"
                           [ngClass]="isStepCompleted('PICKED_UP') ? 'bg-primary text-white' : 'bg-dark text-muted border border-secondary'">
                        <i class="bi bi-box-seam"></i>
                      </div>
                      <div class="small fw-bold text-white" style="font-size: 0.75rem;">Picked Up</div>
                    </div>

                    <div class="text-center" [class.opacity-50]="!isStepCompleted('IN_TRANSIT')">
                      <div class="rounded-circle d-inline-flex p-2 mb-1"
                           [ngClass]="isStepCompleted('IN_TRANSIT') ? 'bg-primary text-white' : 'bg-dark text-muted border border-secondary'">
                        <i class="bi bi-bicycle"></i>
                      </div>
                      <div class="small fw-bold text-white" style="font-size: 0.75rem;">In Transit</div>
                    </div>

                    <div class="text-center" [class.opacity-50]="!isStepCompleted('DELIVERED')">
                      <div class="rounded-circle d-inline-flex p-2 mb-1"
                           [ngClass]="isStepCompleted('DELIVERED') ? 'bg-success text-white' : 'bg-dark text-muted border border-secondary'">
                        <i class="bi bi-check2-circle"></i>
                      </div>
                      <div class="small fw-bold text-white" style="font-size: 0.75rem;">Delivered</div>
                    </div>
                  </div>
                </div>

                <!-- Chronological Audit Log Trail -->
                <h6 class="fw-bold text-white mb-2">Shipment Milestone Events</h6>
                <div class="timeline ps-3 border-start border-secondary">
                  @for (log of delivery()!.logs; track log.timestamp) {
                    <div class="position-relative mb-3 ps-3">
                      <div class="position-absolute start-0 top-0 translate-middle-x rounded-circle bg-primary" 
                           style="width: 10px; height: 10px; left: -1px !important;"></div>
                      <div class="d-flex justify-content-between align-items-center">
                        <span class="badge bg-dark border border-secondary text-info small">{{ log.status }}</span>
                        <span class="text-muted small" style="font-size: 0.75rem;">{{ log.timestamp | date:'shortTime' }}</span>
                      </div>
                      <div class="text-white-50 small mt-1">{{ log.note }}</div>
                    </div>
                  }
                </div>
              } @else {
                <div class="text-center py-4 text-muted">
                  <i class="bi bi-hourglass-split fs-2 mb-2 d-block"></i>
                  <span>No delivery dispatch record created yet for this order.</span>
                </div>
              }
            </div>
          </div>
        </div>
      } @else {
        <div class="glass-panel text-center py-5 p-4">
          <i class="bi bi-search fs-1 text-muted"></i>
          <h4 class="text-white mt-3">No Order Selected</h4>
          <p class="text-muted">Enter an Order ID above (e.g., 1, 2, or 3) to view order status and courier delivery tracking.</p>
        </div>
      }
    </div>
  `
})
export class OrdersComponent implements OnInit {
  private orderService = inject(OrderService);
  private deliveryService = inject(DeliveryService);
  private route = inject(ActivatedRoute);

  searchOrderId = 2;
  order = signal<Order | null>(null);
  delivery = signal<Delivery | null>(null);
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
      }
    });
  }

  loadDelivery(orderId: number): void {
    this.deliveryService.getDeliveryByOrderId(orderId).subscribe({
      next: (delRes) => {
        this.delivery.set(delRes.data);
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

  getDeliveryBadgeClass(status: string): string {
    switch (status) {
      case 'DELIVERED': return 'badge-status-delivered';
      case 'IN_TRANSIT': return 'badge-status-intransit';
      case 'PICKED_UP': return 'badge-status-pickedup';
      case 'ASSIGNED': return 'badge-status-assigned';
      case 'PENDING': return 'badge-status-pending';
      default: return 'badge-status-pending';
    }
  }

  isStepCompleted(step: string): boolean {
    const current = this.delivery()?.status;
    if (!current) return false;
    const steps = ['PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'];
    return steps.indexOf(current) >= steps.indexOf(step);
  }
}
