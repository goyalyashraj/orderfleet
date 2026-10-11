import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CatalogService, CreateProductDto } from '../../services/catalog.service';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { Category, Product } from '../../models/catalog.model';
import { Order } from '../../models/order.model';
import { User } from '../../models/auth.model';

type AdminTab = 'orders' | 'users' | 'inventory';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <!-- Dedicated Premium Admin Top Header: Brand, 3 Core Operational Views, and Quick Actions -->
    <header class="admin-top-header sticky-top py-2 px-3 px-xl-4 mb-4 border shadow-lg mx-2 mx-md-3 mt-2 rounded-3"
            style="background: #0b1120 !important; backdrop-filter: blur(16px); z-index: 1040; border-color: rgba(255, 255, 255, 0.12) !important; box-shadow: 0 8px 30px rgba(0, 0, 0, 0.6) !important;">
      <div class="container-fluid d-flex justify-content-between align-items-center gap-3 p-0">
        
        <!-- Left: Brand & Admin Console Badge -->
        <div class="d-flex align-items-center gap-2 flex-shrink-0">
          <div class="d-flex align-items-center justify-content-center rounded-2 shadow-sm" 
               style="width: 36px; height: 36px; background: linear-gradient(135deg, #ef4444, #b91c1c);">
            <i class="bi bi-shield-lock-fill fs-5 text-white"></i>
          </div>
          <div class="d-flex flex-column" style="line-height: 1.1;">
            <div class="d-flex align-items-center gap-2">
              <span class="fw-extrabold fs-5 text-white tracking-tight">Order<span style="color: #ffa41c;">Fleet</span></span>
              <span class="badge bg-danger px-2 py-0 small fw-bold" style="font-size: 0.62rem;">ADMIN CONSOLE</span>
            </div>
            <span class="text-muted fw-bold" style="font-size: 0.62rem; letter-spacing: 0.08em; text-transform: uppercase;">
              Platform Operations
            </span>
          </div>
        </div>

        <!-- Center: The 3 Operational Views Tabs -->
        <div class="d-flex align-items-center gap-1 p-1 rounded-3 flex-shrink-0" style="background: rgba(15, 23, 42, 0.95); border: 1px solid rgba(255, 255, 255, 0.08);">
          <!-- Tab 1: Customer Orders -->
          <button class="btn btn-sm py-1 px-3 d-flex align-items-center gap-2 rounded-2 border-0 transition-all"
                  [class.btn-primary]="activeTab() === 'orders'"
                  [class.text-white]="activeTab() === 'orders'"
                  [class.text-white-50]="activeTab() !== 'orders'"
                  (click)="setActiveTab('orders')">
            <i class="bi bi-receipt-cutoff"></i>
            <span class="fw-bold">Customer Orders</span>
            <span class="badge rounded-pill small" 
                  [class.bg-white]="activeTab() === 'orders'" 
                  [class.text-dark]="activeTab() === 'orders'" 
                  [class.bg-secondary]="activeTab() !== 'orders'">{{ orders().length }}</span>
          </button>

          <!-- Tab 2: Registered Accounts -->
          <button class="btn btn-sm py-1 px-3 d-flex align-items-center gap-2 rounded-2 border-0 transition-all"
                  [class.btn-primary]="activeTab() === 'users'"
                  [class.text-white]="activeTab() === 'users'"
                  [class.text-white-50]="activeTab() !== 'users'"
                  (click)="setActiveTab('users')">
            <i class="bi bi-people"></i>
            <span class="fw-bold">Registered Accounts</span>
            <span class="badge rounded-pill small"
                  [class.bg-white]="activeTab() === 'users'" 
                  [class.text-dark]="activeTab() === 'users'" 
                  [class.bg-secondary]="activeTab() !== 'users'">{{ users().length }}</span>
          </button>

          <!-- Tab 3: Inventory & Stock -->
          <button class="btn btn-sm py-1 px-3 d-flex align-items-center gap-2 rounded-2 border-0 transition-all"
                  [class.btn-primary]="activeTab() === 'inventory'"
                  [class.text-white]="activeTab() === 'inventory'"
                  [class.text-white-50]="activeTab() !== 'inventory'"
                  (click)="setActiveTab('inventory')">
            <i class="bi bi-box-seam"></i>
            <span class="fw-bold">Inventory &amp; Stock</span>
            <span class="badge rounded-pill small"
                  [class.bg-white]="activeTab() === 'inventory'" 
                  [class.text-dark]="activeTab() === 'inventory'" 
                  [class.bg-secondary]="activeTab() !== 'inventory'">{{ products().length }}</span>
          </button>
        </div>

        <!-- Right: Operational Actions -->
        <div class="d-flex align-items-center gap-2 flex-shrink-0">
          <a routerLink="/catalog" class="btn btn-outline-warning btn-sm d-flex align-items-center gap-1 py-1 px-3">
            <i class="bi bi-shop"></i>
            <span class="d-none d-sm-inline">Storefront</span>
          </a>
          @if (activeTab() === 'inventory') {
            <button class="btn btn-amazon-primary btn-sm d-flex align-items-center gap-1 py-1 px-3 shadow-sm" (click)="showAddProductModal.set(true)">
              <i class="bi bi-plus-circle-fill"></i>
              <span>Add SKU</span>
            </button>
          }
          <button class="btn btn-glass btn-sm py-1 px-3 d-flex align-items-center gap-1 text-white-50" (click)="refreshAllData()" title="Refresh All Data">
            <i class="bi bi-arrow-clockwise"></i>
            <span class="d-none d-lg-inline">Refresh</span>
          </button>
          <div class="d-none d-md-flex align-items-center gap-2 px-2 py-1 rounded-pill" style="background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.25);">
            <div class="rounded-circle bg-danger text-white d-flex align-items-center justify-content-center fw-bold" style="width: 22px; height: 22px; font-size: 0.7rem;">A</div>
            <span class="text-white small fw-semibold" style="font-size: 0.78rem;">Admin</span>
          </div>
          <button class="btn btn-outline-danger btn-sm d-flex align-items-center gap-1 py-1 px-3" (click)="logout()">
            <i class="bi bi-box-arrow-right"></i>
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </header>

    <div class="container-fluid px-3 px-md-4 py-2">
      <!-- Real-time KPI Metric Cards (Always Visible) -->
      <div class="row g-3 mb-4">
        <!-- 1. Gross Platform Revenue -->
        <div class="col-sm-6 col-lg-3">
          <div class="glass-panel p-3 h-100 border-start border-4 border-success">
            <div class="d-flex justify-content-between align-items-start">
              <div class="text-muted small text-uppercase fw-semibold">Gross Sales</div>
              <div class="rounded-circle p-2 bg-success bg-opacity-10 text-success">
                <i class="bi bi-currency-dollar fs-5"></i>
              </div>
            </div>
            <div class="fs-3 fw-extrabold text-white mt-1">\${{ totalRevenue().toFixed(2) }}</div>
            <div class="text-success small mt-1">
              <i class="bi bi-graph-up-arrow me-1"></i> From {{ orders().length }} customer orders
            </div>
          </div>
        </div>

        <!-- 2. Total Orders Placed -->
        <div class="col-sm-6 col-lg-3">
          <div class="glass-panel p-3 h-100 border-start border-4 border-primary">
            <div class="d-flex justify-content-between align-items-start">
              <div class="text-muted small text-uppercase fw-semibold">Customer Orders</div>
              <div class="rounded-circle p-2 bg-primary bg-opacity-10 text-primary">
                <i class="bi bi-bag-check-fill fs-5"></i>
              </div>
            </div>
            <div class="fs-3 fw-extrabold text-white mt-1">{{ orders().length }}</div>
            <div class="text-muted small mt-1">
              <span class="text-info">{{ confirmedOrdersCount() }} Confirmed</span> &bull; 
              <span class="text-danger">{{ cancelledOrdersCount() }} Cancelled</span>
            </div>
          </div>
        </div>

        <!-- 3. Total Registered Accounts -->
        <div class="col-sm-6 col-lg-3">
          <div class="glass-panel p-3 h-100 border-start border-4 border-warning">
            <div class="d-flex justify-content-between align-items-start">
              <div class="text-muted small text-uppercase fw-semibold">Registered Users</div>
              <div class="rounded-circle p-2 bg-warning bg-opacity-10 text-warning">
                <i class="bi bi-people-fill fs-5"></i>
              </div>
            </div>
            <div class="fs-3 fw-extrabold text-white mt-1">{{ users().length }}</div>
            <div class="text-muted small mt-1">
              <span class="text-warning">{{ customerCount() }} Customers</span> &bull; 
              <span class="text-info">{{ riderCount() }} Couriers</span>
            </div>
          </div>
        </div>

        <!-- 4. Warehouse Stock Level -->
        <div class="col-sm-6 col-lg-3">
          <div class="glass-panel p-3 h-100 border-start border-4 border-danger">
            <div class="d-flex justify-content-between align-items-start">
              <div class="text-muted small text-uppercase fw-semibold">Catalog SKUs</div>
              <div class="rounded-circle p-2 bg-danger bg-opacity-10 text-danger">
                <i class="bi bi-boxes fs-5"></i>
              </div>
            </div>
            <div class="fs-3 fw-extrabold text-white mt-1">{{ products().length }}</div>
            <div class="small mt-1" [class.text-danger]="lowStockCount() > 0" [class.text-muted]="lowStockCount() === 0">
              @if (lowStockCount() > 0) {
                <i class="bi bi-exclamation-triangle-fill text-danger me-1"></i> {{ lowStockCount() }} low stock items
              } @else {
                <i class="bi bi-check-circle-fill text-success me-1"></i> Stock healthy ({{ totalStockUnits() }} units)
              }
            </div>
          </div>
        </div>
      </div>

      <!-- ========================================== -->
      <!-- VIEW 1: CUSTOMER ORDERS & SALES FEED       -->
      <!-- ========================================== -->
      @if (activeTab() === 'orders') {
        <div class="glass-panel p-4">
          <div class="d-flex justify-content-between align-items-center border-bottom border-secondary pb-3 mb-3">
            <div>
              <h5 class="fw-bold text-white m-0"><i class="bi bi-bag-check text-primary me-2"></i>Platform Orders Feed (order_db)</h5>
              <div class="text-muted small">Real-time log of purchases made by customers across the platform</div>
            </div>
            <button class="btn btn-glass btn-sm" (click)="loadOrders()">
              <i class="bi bi-arrow-clockwise me-1"></i> Refresh Orders
            </button>
          </div>

          @if (loadingOrders()) {
            <div class="text-center py-5">
              <div class="spinner-border text-primary" role="status"></div>
              <p class="text-muted mt-2">Loading orders from order-service...</p>
            </div>
          } @else if (orders().length === 0) {
            <div class="text-center py-5">
              <i class="bi bi-inbox fs-1 text-muted"></i>
              <h6 class="text-white mt-2">No Customer Orders Yet</h6>
              <p class="text-muted small">Orders placed on the storefront will automatically appear in this real-time ledger.</p>
            </div>
          } @else {
            <div class="table-responsive">
              <table class="table table-dark table-borderless align-middle mb-0" style="background: transparent;">
                <thead>
                  <tr class="text-muted small border-bottom border-secondary">
                    <th>Order # &amp; Date</th>
                    <th>Customer ID</th>
                    <th>Items Purchased</th>
                    <th class="text-center">Order Status</th>
                    <th class="text-center">Payment</th>
                    <th class="text-end">Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  @for (order of orders(); track order.orderId) {
                    <tr class="border-bottom border-secondary">
                      <td>
                        <div class="fw-bold text-white font-monospace">{{ order.orderNumber }}</div>
                        <div class="text-muted small" style="font-size: 0.75rem;">
                          {{ order.createdAt ? (order.createdAt | date:'medium') : 'Recent' }}
                        </div>
                      </td>
                      <td>
                        <span class="badge bg-dark border border-secondary text-info">
                          <i class="bi bi-person me-1"></i>User #{{ order.userId }}
                        </span>
                      </td>
                      <td>
                        <div class="d-flex flex-wrap gap-1">
                          @for (item of order.items; track item.id) {
                            <span class="badge bg-dark border border-secondary text-white py-1 px-2" style="font-size: 0.75rem;">
                              <span class="text-warning fw-bold">{{ item.quantity }}x</span> {{ item.productTitle }}
                              <span class="text-muted">(\${{ item.unitPrice }})</span>
                            </span>
                          }
                        </div>
                      </td>
                      <td class="text-center">
                        <span class="badge" 
                              [class.bg-success]="order.status === 'CONFIRMED' || order.status === 'DELIVERED'"
                              [class.bg-warning]="order.status === 'PENDING'"
                              [class.bg-danger]="order.status === 'CANCELLED'">
                          {{ order.status }}
                        </span>
                      </td>
                      <td class="text-center">
                        <span class="badge" 
                              [class.bg-success]="order.paymentStatus === 'SUCCESS'"
                              [class.bg-danger]="order.paymentStatus === 'FAILED' || order.paymentStatus === 'ABORTED_INSUFFICIENT_STOCK'"
                              [class.bg-secondary]="order.paymentStatus === 'PENDING'">
                          {{ order.paymentStatus }}
                        </span>
                      </td>
                      <td class="text-end fw-extrabold text-warning fs-6">
                        \${{ order.totalAmount.toFixed(2) }}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      }

      <!-- ========================================== -->
      <!-- VIEW 2: REGISTERED USERS & CUSTOMERS       -->
      <!-- ========================================== -->
      @if (activeTab() === 'users') {
        <div class="glass-panel p-4">
          <div class="d-flex justify-content-between align-items-center border-bottom border-secondary pb-3 mb-3">
            <div>
              <h5 class="fw-bold text-white m-0"><i class="bi bi-people-fill text-warning me-2"></i>Registered User Directory (identity_db)</h5>
              <div class="text-muted small">Complete list of registered customers, delivery riders, and administrators</div>
            </div>
            <button class="btn btn-glass btn-sm" (click)="loadUsers()">
              <i class="bi bi-arrow-clockwise me-1"></i> Refresh Users
            </button>
          </div>

          @if (loadingUsers()) {
            <div class="text-center py-5">
              <div class="spinner-border text-warning" role="status"></div>
              <p class="text-muted mt-2">Loading user records from identity-service...</p>
            </div>
          } @else if (users().length === 0) {
            <div class="text-center py-5">
              <i class="bi bi-person-x fs-1 text-muted"></i>
              <h6 class="text-white mt-2">No Registered Users Found</h6>
            </div>
          } @else {
            <div class="table-responsive">
              <table class="table table-dark table-borderless align-middle mb-0" style="background: transparent;">
                <thead>
                  <tr class="text-muted small border-bottom border-secondary">
                    <th>User ID</th>
                    <th>Full Name</th>
                    <th>Email Address</th>
                    <th>Phone</th>
                    <th>Assigned Roles</th>
                    <th>Account Status</th>
                    <th class="text-end">Registered Date</th>
                  </tr>
                </thead>
                <tbody>
                  @for (user of users(); track user.id) {
                    <tr class="border-bottom border-secondary">
                      <td>
                        <span class="font-monospace text-muted">#{{ user.id }}</span>
                      </td>
                      <td>
                        <div class="fw-bold text-white">{{ user.firstName }} {{ user.lastName }}</div>
                      </td>
                      <td>
                        <span class="text-info">{{ user.email }}</span>
                      </td>
                      <td>
                        <span class="text-muted">{{ user.phone || 'N/A' }}</span>
                      </td>
                      <td>
                        <div class="d-flex flex-wrap gap-1">
                          @for (role of user.roles; track role) {
                            <span class="badge" 
                                  [class.bg-danger]="role === 'ROLE_ADMIN'"
                                  [class.bg-primary]="role === 'ROLE_CUSTOMER'"
                                  [class.bg-success]="role === 'ROLE_DELIVERY_PARTNER'">
                              {{ role.replace('ROLE_', '') }}
                            </span>
                          }
                        </div>
                      </td>
                      <td>
                        <span class="badge bg-success bg-opacity-25 text-success border border-success">
                          {{ user.status }}
                        </span>
                      </td>
                      <td class="text-end text-muted small">
                        {{ user.createdAt ? (user.createdAt | date:'mediumDate') : 'Active' }}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      }

      <!-- ========================================== -->
      <!-- VIEW 3: INVENTORY & STOCK MANAGEMENT       -->
      <!-- ========================================== -->
      @if (activeTab() === 'inventory') {
        <!-- Add Product Drawer / Modal Form -->
        @if (showAddProductModal()) {
          <div class="glass-panel p-4 mb-4 border-warning shadow-lg">
            <div class="d-flex justify-content-between align-items-center border-bottom border-secondary pb-3 mb-3">
              <h5 class="fw-bold text-white m-0"><i class="bi bi-box-seam text-warning me-2"></i>Create New Catalog Item</h5>
              <button type="button" class="btn-close btn-close-white" (click)="showAddProductModal.set(false)"></button>
            </div>

            <form (ngSubmit)="submitNewProduct()">
              <div class="row g-3 mb-3">
                <div class="col-md-4">
                  <label class="form-label text-muted small fw-semibold">SKU Identifier</label>
                  <input type="text" class="form-control" [(ngModel)]="newProduct.sku" name="sku" required placeholder="e.g. KB-RGB-99">
                </div>
                <div class="col-md-5">
                  <label class="form-label text-muted small fw-semibold">Product Title</label>
                  <input type="text" class="form-control" [(ngModel)]="newProduct.title" name="title" required placeholder="e.g. Premium Mechanical Keyboard">
                </div>
                <div class="col-md-3">
                  <label class="form-label text-muted small fw-semibold">Category</label>
                  <select class="form-select" [(ngModel)]="newProduct.categoryId" name="categoryId" required>
                    @for (cat of categories(); track cat.id) {
                      <option [value]="cat.id">{{ cat.name }}</option>
                    }
                  </select>
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label text-muted small fw-semibold">Description</label>
                <textarea class="form-control" rows="2" [(ngModel)]="newProduct.description" name="description" placeholder="Product details, specs, features..."></textarea>
              </div>

              <div class="row g-3 mb-4">
                <div class="col-md-6">
                  <label class="form-label text-muted small fw-semibold">Selling Price ($)</label>
                  <input type="number" step="0.01" class="form-control" [(ngModel)]="newProduct.price" name="price" required placeholder="49.99">
                </div>
                <div class="col-md-6">
                  <label class="form-label text-muted small fw-semibold">Initial Inventory Stock (Units)</label>
                  <input type="number" class="form-control" [(ngModel)]="newProduct.initialStock" name="initialStock" required placeholder="25">
                </div>
              </div>

              <div class="d-flex justify-content-end gap-2">
                <button type="button" class="btn btn-glass" (click)="showAddProductModal.set(false)">Cancel</button>
                <button type="submit" class="btn btn-amazon-primary px-4" [disabled]="submittingProduct()">
                  @if (submittingProduct()) {
                    <span class="spinner-border spinner-border-sm me-1"></span> Creating...
                  } @else {
                    <i class="bi bi-check-lg me-1"></i> Save &amp; Initialize Stock
                  }
                </button>
              </div>
            </form>
          </div>
        }

        <!-- Inventory Table -->
        <div class="glass-panel p-4">
          <div class="d-flex justify-content-between align-items-center border-bottom border-secondary pb-3 mb-3">
            <div>
              <h5 class="fw-bold text-white m-0">Live Inventory Database (catalog_db)</h5>
              <div class="text-muted small">Warehouse quantities, optimistic locking version controls, and restock triggers</div>
            </div>
            <button class="btn btn-glass btn-sm" (click)="loadProducts()">
              <i class="bi bi-arrow-clockwise me-1"></i> Refresh Stock
            </button>
          </div>

          @if (loadingProducts()) {
            <div class="text-center py-5">
              <div class="spinner-border text-primary" role="status"></div>
              <p class="text-muted mt-2">Loading products and inventory...</p>
            </div>
          } @else {
            <div class="table-responsive">
              <table class="table table-dark table-borderless align-middle mb-0" style="background: transparent;">
                <thead>
                  <tr class="text-muted small border-bottom border-secondary">
                    <th>Product Details</th>
                    <th>Category</th>
                    <th class="text-center">Price</th>
                    <th class="text-center">Available Stock</th>
                    <th class="text-center">Restock (+Qty)</th>
                    <th class="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (product of products(); track product.id) {
                    <tr class="border-bottom border-secondary">
                      <td>
                        <div class="d-flex align-items-center gap-2">
                          <div class="rounded-2 d-flex align-items-center justify-content-center"
                               style="width: 36px; height: 36px; background: #1e293b; border: 1px solid #334155;">
                            <i class="bi bi-box-seam text-warning"></i>
                          </div>
                          <div>
                            <div class="fw-bold text-white small">{{ product.title }}</div>
                            <span class="text-muted font-monospace small" style="font-size: 0.72rem;">{{ product.sku }}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span class="badge bg-dark border border-secondary text-white-50">{{ product.categoryName }}</span>
                      </td>
                      <td class="text-center fw-bold text-white">\${{ product.price.toFixed(2) }}</td>
                      <td class="text-center">
                        @if (product.availableStock <= 0) {
                          <span class="badge bg-danger text-white">0 (Sold Out)</span>
                        } @else if (product.availableStock <= 3) {
                          <span class="badge-stock-urgency">
                            <span class="pulse-dot"></span> {{ product.availableStock }} Left
                          </span>
                        } @else {
                          <span class="badge-stock-available">
                            {{ product.availableStock }} Units
                          </span>
                        }
                      </td>
                      <!-- Inline Restock Controls -->
                      <td class="text-center">
                        <div class="d-inline-flex gap-1">
                          <button class="btn btn-glass btn-sm py-0 px-2 small" (click)="addStock(product.id, 10)">
                            +10
                          </button>
                          <button class="btn btn-glass btn-sm py-0 px-2 small" (click)="addStock(product.id, 25)">
                            +25
                          </button>
                          <button class="btn btn-glass btn-sm py-0 px-2 small" (click)="addStock(product.id, 50)">
                            +50
                          </button>
                        </div>
                      </td>
                      <!-- Delete / Deactivate Button -->
                      <td class="text-end">
                        <button class="btn btn-outline-danger btn-sm px-2 py-1 rounded-2 d-inline-flex align-items-center gap-1 shadow-sm" 
                                title="Deactivate / Remove product from catalog"
                                (click)="openDeleteConfirm(product)">
                          <i class="bi bi-trash3"></i>
                          <span class="small fw-semibold">Delete</span>
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      }

      <!-- In-App Deactivate Product Confirmation Modal -->
      @if (productToDelete(); as p) {
        <div class="modal-backdrop-custom" (click)="cancelDelete()">
          <div class="glass-panel p-4 shadow-lg border border-danger border-opacity-50" 
               style="max-width: 480px; width: 92%; background: rgba(17, 24, 39, 0.96); border-radius: 16px;"
               (click)="$event.stopPropagation()">
            
            <div class="d-flex align-items-start gap-3 mb-3">
              <div class="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                   style="width: 48px; height: 48px; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3);">
                <i class="bi bi-exclamation-triangle-fill text-danger fs-4"></i>
              </div>
              <div class="flex-grow-1">
                <h5 class="fw-bold text-white mb-1">Deactivate Product?</h5>
                <p class="text-muted small mb-0">
                  This item will be deactivated and immediately removed from the public customer storefront.
                </p>
              </div>
            </div>

            <!-- Product Summary Card -->
            <div class="p-3 rounded-3 mb-4" style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08);">
              <div class="d-flex align-items-center justify-content-between">
                <div>
                  <div class="fw-bold text-white mb-1">{{ p.title }}</div>
                  <div class="text-muted small font-monospace">SKU: <span class="text-info">{{ p.sku }}</span></div>
                </div>
                <div class="text-end">
                  <div class="fw-bold text-warning">\${{ p.price.toFixed(2) }}</div>
                  <span class="badge bg-secondary small">{{ p.categoryName || 'Product' }}</span>
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="d-flex justify-content-end gap-2">
              <button type="button" class="btn btn-glass px-3" [disabled]="deletingProduct()" (click)="cancelDelete()">
                Cancel
              </button>
              <button type="button" class="btn btn-danger px-4 d-inline-flex align-items-center gap-2 fw-semibold shadow"
                      [disabled]="deletingProduct()" 
                      (click)="confirmDelete()">
                @if (deletingProduct()) {
                  <span class="spinner-border spinner-border-sm"></span> Deactivating...
                } @else {
                  <i class="bi bi-trash3-fill"></i> Deactivate Product
                }
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class AdminComponent implements OnInit {
  private catalogService = inject(CatalogService);
  private orderService = inject(OrderService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  // Active Tab
  activeTab = signal<AdminTab>('orders');

  // Data signals
  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  orders = signal<Order[]>([]);
  users = signal<User[]>([]);

  // Loading states
  loadingProducts = signal(false);
  loadingOrders = signal(false);
  loadingUsers = signal(false);
  showAddProductModal = signal(false);
  submittingProduct = signal(false);
  productToDelete = signal<Product | null>(null);
  deletingProduct = signal(false);

  // New product form model
  newProduct: CreateProductDto = {
    sku: '',
    title: '',
    description: '',
    price: 49.99,
    categoryId: 1,
    initialStock: 20
  };

  ngOnInit(): void {
    this.refreshAllData();
  }

  refreshAllData(): void {
    this.loadCategories();
    this.loadProducts();
    this.loadOrders();
    this.loadUsers();
  }

  setActiveTab(tab: AdminTab): void {
    this.activeTab.set(tab);
    if (tab === 'orders' && this.orders().length === 0) {
      this.loadOrders();
    } else if (tab === 'users' && this.users().length === 0) {
      this.loadUsers();
    } else if (tab === 'inventory' && this.products().length === 0) {
      this.loadProducts();
    }
  }

  loadCategories(): void {
    this.catalogService.getCategories().subscribe({
      next: (res) => this.categories.set(res.data || [])
    });
  }

  loadProducts(): void {
    this.loadingProducts.set(true);
    this.catalogService.getProducts().subscribe({
      next: (res) => {
        this.products.set(res.data || []);
        this.loadingProducts.set(false);
      },
      error: () => {
        this.loadingProducts.set(false);
        this.toastService.error('Catalog Error', 'Could not load products.');
      }
    });
  }

  loadOrders(): void {
    this.loadingOrders.set(true);
    this.orderService.getAllOrdersAdmin().subscribe({
      next: (res) => {
        this.orders.set(res.data || []);
        this.loadingOrders.set(false);
      },
      error: () => {
        this.loadingOrders.set(false);
        this.toastService.error('Order Error', 'Could not retrieve platform orders.');
      }
    });
  }

  loadUsers(): void {
    this.loadingUsers.set(true);
    this.authService.getAllUsersAdmin().subscribe({
      next: (res) => {
        this.users.set(res.data || []);
        this.loadingUsers.set(false);
      },
      error: () => {
        this.loadingUsers.set(false);
        this.toastService.error('Identity Error', 'Could not load registered users.');
      }
    });
  }

  // Analytics Computed Getters
  totalRevenue(): number {
    return this.orders()
      .filter(o => o.status === 'CONFIRMED' || o.status === 'DELIVERED')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  }

  confirmedOrdersCount(): number {
    return this.orders().filter(o => o.status === 'CONFIRMED' || o.status === 'DELIVERED').length;
  }

  cancelledOrdersCount(): number {
    return this.orders().filter(o => o.status === 'CANCELLED').length;
  }

  customerCount(): number {
    return this.users().filter(u => u.roles?.includes('ROLE_CUSTOMER')).length;
  }

  riderCount(): number {
    return this.users().filter(u => u.roles?.includes('ROLE_DELIVERY_PARTNER')).length;
  }

  totalStockUnits(): number {
    return this.products().reduce((sum, p) => sum + (p.availableStock || 0), 0);
  }

  lowStockCount(): number {
    return this.products().filter(p => (p.availableStock || 0) <= 3).length;
  }

  // Inventory actions
  submitNewProduct(): void {
    if (!this.newProduct.sku || !this.newProduct.title || !this.newProduct.price) {
      this.toastService.warning('Validation', 'Please provide SKU, title, and price.');
      return;
    }

    this.submittingProduct.set(true);
    this.catalogService.createProduct(this.newProduct).subscribe({
      next: () => {
        this.submittingProduct.set(false);
        this.showAddProductModal.set(false);
        this.toastService.success('Product Added', `Created SKU "${this.newProduct.sku}" with ${this.newProduct.initialStock} units!`);
        this.newProduct = {
          sku: '',
          title: '',
          description: '',
          price: 49.99,
          categoryId: this.categories()[0]?.id || 1,
          initialStock: 20
        };
        this.loadProducts();
      },
      error: (err) => {
        this.submittingProduct.set(false);
        this.toastService.error('Creation Failed', err.error?.message || 'Could not create product.');
      }
    });
  }

  addStock(productId: number, delta: number): void {
    this.catalogService.updateStock(productId, delta).subscribe({
      next: (res) => {
        this.toastService.success('Inventory Restocked', `Added +${delta} units! New available: ${res.data.availableQuantity}`);
        this.loadProducts();
      },
      error: (err) => {
        this.toastService.error('Stock Update Failed', err.error?.message || 'Failed to update stock.');
      }
    });
  }

  openDeleteConfirm(product: Product): void {
    this.productToDelete.set(product);
  }

  cancelDelete(): void {
    if (!this.deletingProduct()) {
      this.productToDelete.set(null);
    }
  }

  confirmDelete(): void {
    const product = this.productToDelete();
    if (!product) return;

    this.deletingProduct.set(true);

    // Optimistic UI update: instantly hide from UI
    const originalList = this.products();
    this.products.update(list => list.filter(p => p.id !== product.id));

    this.catalogService.deleteProduct(product.id).subscribe({
      next: () => {
        this.toastService.warning('Product Deactivated', `"${product.title}" (${product.sku}) removed from catalog.`);
        this.productToDelete.set(null);
        this.deletingProduct.set(false);
        this.loadProducts();
      },
      error: (err) => {
        // Rollback list if delete failed
        this.products.set(originalList);
        this.toastService.error('Deactivation Failed', err.error?.message || 'Failed to deactivate product.');
        this.productToDelete.set(null);
        this.deletingProduct.set(false);
      }
    });
  }

  deleteProduct(product: Product): void {
    this.openDeleteConfirm(product);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
