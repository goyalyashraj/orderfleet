import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeliveryService } from '../../services/delivery.service';
import { ToastService } from '../../services/toast.service';
import { DeliveryPartner, Delivery } from '../../models/delivery.model';

@Component({
  selector: 'app-partner',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container py-4">
      <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h2 class="fw-bold text-white mb-1">Delivery Fleet Console</h2>
          <p class="text-muted small">Manage driver availability and simulate package fulfillment workflows</p>
        </div>

        <!-- Status Pill Selector -->
        @if (partner()) {
          <div class="d-flex align-items-center gap-2">
            <span class="text-muted small fw-semibold">Fleet Status:</span>
            <div class="btn-group" role="group">
              <button 
                type="button" 
                class="btn btn-sm"
                [ngClass]="partner()!.status === 'AVAILABLE' ? 'btn-success text-white' : 'btn-glass'"
                (click)="changeStatus('AVAILABLE')">
                Available
              </button>
              <button 
                type="button" 
                class="btn btn-sm"
                [ngClass]="partner()!.status === 'BUSY' ? 'btn-warning text-dark' : 'btn-glass'"
                (click)="changeStatus('BUSY')">
                Busy
              </button>
              <button 
                type="button" 
                class="btn btn-sm"
                [ngClass]="partner()!.status === 'OFFLINE' ? 'btn-danger text-white' : 'btn-glass'"
                (click)="changeStatus('OFFLINE')">
                Offline
              </button>
            </div>
          </div>
        }
      </div>



      <div class="row g-4">
        <!-- Partner Profile Card -->
        <div class="col-lg-4">
          <div class="glass-panel p-4 h-100">
            <h5 class="fw-bold text-white mb-3 border-bottom border-secondary pb-2">
              <i class="bi bi-person-badge text-primary me-2"></i> Courier Profile
            </h5>

            @if (partner()) {
              <div class="text-center my-3">
                <div class="d-inline-flex p-3 rounded-circle mb-2" style="background: rgba(99, 102, 241, 0.15);">
                  <i class="bi bi-bicycle fs-1 text-primary"></i>
                </div>
                <h5 class="fw-bold text-white mb-0">{{ partner()!.fullName }}</h5>
                <span class="badge badge-pill-status mt-2" [ngClass]="getPartnerBadgeClass(partner()!.status)">
                  {{ partner()!.status }}
                </span>
              </div>

              <div class="border-top border-secondary pt-3 mt-3">
                <div class="d-flex justify-content-between text-muted small py-1">
                  <span>Partner ID</span>
                  <span class="text-white font-monospace">#{{ partner()!.id }}</span>
                </div>
                <div class="d-flex justify-content-between text-muted small py-1">
                  <span>Vehicle Type</span>
                  <span class="text-white fw-semibold">{{ partner()!.vehicleType }}</span>
                </div>
                <div class="d-flex justify-content-between text-muted small py-1">
                  <span>Phone</span>
                  <span class="text-white font-monospace">{{ partner()!.phone }}</span>
                </div>
                <div class="d-flex justify-content-between text-muted small py-1">
                  <span>Active Shipments</span>
                  <span class="badge bg-secondary">{{ partner()!.activeOrdersCount }}</span>
                </div>
              </div>
            } @else {
              <div class="text-center py-4 text-muted">
                <div class="spinner-border spinner-border-sm text-primary mb-2"></div>
                <div>Loading partner telemetry...</div>
              </div>
            }
          </div>
        </div>

        <!-- Shipment Simulation Action Card -->
        <div class="col-lg-8">
          <div class="glass-panel p-4 h-100">
            <div class="d-flex justify-content-between align-items-center mb-3 border-bottom border-secondary pb-2">
              <h5 class="fw-bold text-white m-0">
                <i class="bi bi-broadcast text-warning me-2"></i> Live Shipment Progression Simulator
              </h5>
              <div class="input-group input-group-sm" style="max-width: 220px;">
                <span class="input-group-text bg-dark border-secondary text-muted">Order ID</span>
                <input type="number" class="form-control" [(ngModel)]="activeOrderId" (keyup.enter)="loadShipment()">
                <button class="btn btn-glass" (click)="loadShipment()">Load</button>
              </div>
            </div>

            @if (activeDelivery()) {
              <div class="p-3 mb-4 rounded-3" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <div>
                    <span class="text-muted small">Assigned Delivery #{{ activeDelivery()!.id }}</span>
                    <div class="text-white fw-bold">Order Reference #{{ activeDelivery()!.orderId }}</div>
                  </div>
                  <span class="badge badge-pill-status" [ngClass]="getDeliveryBadgeClass(activeDelivery()!.status)">
                    {{ activeDelivery()!.status }}
                  </span>
                </div>
                <div class="text-muted small">
                  <strong>Destination:</strong> {{ activeDelivery()!.deliveryAddressSnapshot }}
                </div>
              </div>

              <!-- State Machine Transition Buttons -->
              <h6 class="fw-bold text-white mb-2">Advance Delivery State</h6>
              <p class="text-muted small mb-3">
                Simulate physical delivery driver actions. Watch the delivery audit log and automatic fleet capacity liberation!
              </p>

              <div class="d-flex flex-wrap gap-2 mb-4">
                <button 
                  type="button" 
                  class="btn btn-glass d-flex align-items-center gap-2"
                  [disabled]="activeDelivery()!.status !== 'ASSIGNED'"
                  (click)="advanceStatus('PICKED_UP', 'Courier picked up parcel from origin warehouse')">
                  <i class="bi bi-box-seam text-info"></i>
                  <span>1. Confirm Pickup</span>
                </button>

                <button 
                  type="button" 
                  class="btn btn-glass d-flex align-items-center gap-2"
                  [disabled]="activeDelivery()!.status !== 'PICKED_UP'"
                  (click)="advanceStatus('IN_TRANSIT', 'Courier is on the road heading to destination')">
                  <i class="bi bi-bicycle text-warning"></i>
                  <span>2. Depart (In Transit)</span>
                </button>

                <button 
                  type="button" 
                  class="btn btn-gradient-primary d-flex align-items-center gap-2"
                  [disabled]="activeDelivery()!.status !== 'IN_TRANSIT'"
                  (click)="advanceStatus('DELIVERED', 'Parcel handed directly to customer at door')">
                  <i class="bi bi-check2-circle text-white"></i>
                  <span>3. Complete Handover (Delivered)</span>
                </button>
              </div>

              <!-- Milestone Logs -->
              <h6 class="fw-bold text-white mb-2">Shipment Milestone History</h6>
              <div class="timeline ps-3 border-start border-secondary">
                @for (log of activeDelivery()!.logs; track log.timestamp) {
                  <div class="position-relative mb-2 ps-3">
                    <div class="position-absolute start-0 top-0 translate-middle-x rounded-circle bg-primary" 
                         style="width: 8px; height: 8px; left: -1px !important;"></div>
                    <div class="d-flex justify-content-between align-items-center">
                      <span class="badge bg-dark border border-secondary text-info small">{{ log.status }}</span>
                      <span class="text-muted" style="font-size: 0.75rem;">{{ log.timestamp | date:'shortTime' }}</span>
                    </div>
                    <div class="text-white-50 small mt-1">{{ log.note }}</div>
                  </div>
                }
              </div>
            } @else {
              <div class="text-center py-5 text-muted">
                <i class="bi bi-truck fs-1 text-muted mb-2 d-block"></i>
                <p>No active delivery loaded. Enter Order ID above (e.g. 2 or 3) and click Load.</p>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `
})
export class PartnerComponent implements OnInit {
  private deliveryService = inject(DeliveryService);
  private toastService = inject(ToastService);

  partner = signal<DeliveryPartner | null>(null);
  activeOrderId = 2;
  activeDelivery = signal<Delivery | null>(null);

  ngOnInit(): void {
    this.loadPartner();
    this.loadShipment();
  }

  loadPartner(): void {
    this.deliveryService.getPartnerById(1).subscribe({
      next: (res) => this.partner.set(res.data),
      error: () => {}
    });
  }

  loadShipment(): void {
    if (!this.activeOrderId) return;
    this.deliveryService.getDeliveryByOrderId(this.activeOrderId).subscribe({
      next: (res) => this.activeDelivery.set(res.data),
      error: () => {
        this.activeDelivery.set(null);
        this.toastService.warning('Shipment Lookup', `No delivery found for Order #${this.activeOrderId}`);
      }
    });
  }

  changeStatus(status: string): void {
    if (!this.partner()) return;
    this.deliveryService.updatePartnerStatus(this.partner()!.id, status).subscribe({
      next: (res) => {
        this.partner.set(res.data);
        this.toastService.success('Courier Status', `Your fleet status is now ${status}`);
      },
      error: (err) => {
        this.toastService.error('Fleet Status Error', err.error?.message || 'Failed to update partner status.');
      }
    });
  }

  advanceStatus(nextStatus: string, note: string): void {
    const del = this.activeDelivery();
    if (!del) return;

    this.deliveryService.updateDeliveryStatus(del.id, nextStatus, note).subscribe({
      next: (res) => {
        this.activeDelivery.set(res.data);
        this.loadPartner(); // Refresh partner active orders and status (auto-liberated on DELIVERED)
        this.toastService.success('Shipment Telemetry', `Order #${del.orderId} advanced to ${nextStatus}!`);
      },
      error: (err) => {
        this.toastService.error('State Machine Error', err.error?.message || 'Failed to advance status.');
      }
    });
  }

  getPartnerBadgeClass(status: string): string {
    switch (status) {
      case 'AVAILABLE': return 'badge-status-available';
      case 'BUSY': return 'badge-status-busy';
      case 'OFFLINE': return 'badge-status-offline';
      default: return 'badge-status-available';
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
}
