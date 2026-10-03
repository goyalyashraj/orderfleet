import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CatalogService, CreateProductDto } from '../../services/catalog.service';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { Category, Product } from '../../models/catalog.model';
import { Order } from '../../models/order.model';
import { User } from '../../models/auth.model';

type AdminTab = 'orders' | 'users' | 'inventory' | 'site-view';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="container py-3">
      <!-- Header -->
      <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <div class="d-flex align-items-center gap-2 mb-1">
            <span class="badge bg-danger px-2 py-1 small fw-bold">ADMIN CONSOLE</span>
            <h2 class="fw-extrabold text-white m-0">Operations &amp; Platform Control</h2>
          </div>
          <p class="text-muted small mb-0">Monitor customer transactions, user accounts, warehouse inventory, and live storefront appearance</p>
        </div>

        <div class="d-flex align-items-center gap-2">
          @if (activeTab() === 'inventory') {
            <button class="btn btn-amazon-primary d-flex align-items-center gap-2" (click)="showAddProductModal.set(true)">
              <i class="bi bi-plus-circle-fill"></i>
              <span>Add New Product SKU</span>
            </button>
          } @else if (activeTab() === 'site-view') {
            <a routerLink="/catalog" class="btn btn-outline-info d-flex align-items-center gap-2" target="_blank">
              <i class="bi bi-box-arrow-up-right"></i>
              <span>Open Customer Storefront</span>
            </a>
          }
          <button class="btn btn-glass d-flex align-items-center gap-2" (click)="refreshAllData()">
            <i class="bi bi-arrow-clockwise"></i>
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

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

      <!-- 4 View Navigation Tabs -->
      <div class="glass-panel p-2 mb-4">
        <ul class="nav nav-pills nav-fill gap-2">
          <!-- View 1: Customer Orders -->
          <li class="nav-item">
            <button class="nav-link text-white py-2 px-3 fw-bold d-flex align-items-center justify-content-center gap-2"
                    [class.active]="activeTab() === 'orders'"
                    (click)="setActiveTab('orders')">
              <i class="bi bi-receipt-cutoff"></i>
              <span>Customer Orders</span>
              <span class="badge bg-secondary rounded-pill small">{{ orders().length }}</span>
            </button>
          </li>

          <!-- View 2: Registered Customers -->
          <li class="nav-item">
            <button class="nav-link text-white py-2 px-3 fw-bold d-flex align-items-center justify-content-center gap-2"
                    [class.active]="activeTab() === 'users'"
                    (click)="setActiveTab('users')">
              <i class="bi bi-people"></i>
              <span>Registered Accounts</span>
              <span class="badge bg-secondary rounded-pill small">{{ users().length }}</span>
            </button>
          </li>

          <!-- View 3: Inventory & Stock Management -->
          <li class="nav-item">
            <button class="nav-link text-white py-2 px-3 fw-bold d-flex align-items-center justify-content-center gap-2"
                    [class.active]="activeTab() === 'inventory'"
                    (click)="setActiveTab('inventory')">
              <i class="bi bi-box-seam"></i>
              <span>Inventory &amp; Stock</span>
              <span class="badge bg-secondary rounded-pill small">{{ products().length }}</span>
            </button>
          </li>

          <!-- View 4: Live Storefront Preview (Site View) -->
          <li class="nav-item">
            <button class="nav-link text-white py-2 px-3 fw-bold d-flex align-items-center justify-content-center gap-2"
                    [class.active]="activeTab() === 'site-view'"
                    (click)="setActiveTab('site-view')">
              <i class="bi bi-eye"></i>
              <span>Live Site Preview</span>
              <span class="badge bg-success bg-opacity-75 rounded-pill small">Customer View</span>
            </button>
          </li>
        </ul>
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
                        <button class="btn btn-link text-danger p-0 border-0" 
                                title="Deactivate / Remove product from catalog"
                                (click)="deleteProduct(product)">
                          <i class="bi bi-trash fs-5"></i>
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

      <!-- ========================================== -->
      <!-- VIEW 4: LIVE STOREFRONT PREVIEW (SITE VIEW) -->
      <!-- ========================================== -->
      @if (activeTab() === 'site-view') {
        <div class="glass-panel p-4">
          <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 border-bottom border-secondary pb-3 mb-4">
            <div>
              <div class="d-flex align-items-center gap-2">
                <span class="badge bg-success small"><i class="bi bi-eye-fill me-1"></i>LIVE SIMULATION</span>
                <h5 class="fw-bold text-white m-0">Storefront Appearance ("Customer View")</h5>
              </div>
              <div class="text-muted small mt-1">This is exactly how items, badges, pricing, and stock urgency appear to customer shoppers</div>
            </div>

            <!-- Preview Search & Category Filter Bar -->
            <div class="d-flex gap-2">
              <input type="text" class="form-control form-control-sm" placeholder="Filter preview items..."
                     [(ngModel)]="previewSearchQuery" style="max-width: 200px;">
              <select class="form-select form-select-sm" [(ngModel)]="selectedPreviewCategory" style="max-width: 160px;">
                <option value="">All Categories</option>
                @for (cat of categories(); track cat.id) {
                  <option [value]="cat.name">{{ cat.name }}</option>
                }
              </select>
            </div>
          </div>

          <!-- Product Card Grid Preview -->
          <div class="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-3">
            @for (p of filteredPreviewProducts(); track p.id) {
              <div class="col">
                <div class="card h-100 product-card border-0 bg-dark text-white shadow-sm" style="border: 1px solid #334155 !important;">
                  <!-- Product Image / Mock Placeholder with Category Theme -->
                  <div class="position-relative overflow-hidden text-center py-4 rounded-top"
                       style="background: linear-gradient(145deg, #1e293b, #0f172a); min-height: 160px;">
                    <i class="bi bi-box-seam text-warning" style="font-size: 3.5rem;"></i>
                    <span class="badge bg-secondary position-absolute top-0 start-0 m-2 small">
                      {{ p.categoryName }}
                    </span>
                    @if (p.availableStock <= 3 && p.availableStock > 0) {
                      <span class="badge bg-danger position-absolute top-0 end-0 m-2 small">
                        Only {{ p.availableStock }} left!
                      </span>
                    }
                  </div>

                  <!-- Card Body -->
                  <div class="card-body p-3 d-flex flex-column">
                    <h6 class="fw-bold text-white text-truncate mb-1" [title]="p.title">{{ p.title }}</h6>
                    <div class="text-muted small mb-2 font-monospace" style="font-size: 0.72rem;">SKU: {{ p.sku }}</div>
                    
                    <p class="text-white-50 small flex-grow-1 line-clamp-2" style="font-size: 0.8rem; min-height: 2.4rem;">
                      {{ p.description || 'Premium e-commerce catalog item ready for instant delivery.' }}
                    </p>

                    <!-- Price & Urgency -->
                    <div class="d-flex justify-content-between align-items-center mt-2 pt-2 border-top border-secondary">
                      <div>
                        <span class="fs-5 fw-extrabold text-white">\${{ p.price.toFixed(2) }}</span>
                        <span class="text-muted text-decoration-line-through small ms-2">\${{ (p.price * 1.25).toFixed(2) }}</span>
                      </div>

                      @if (p.availableStock <= 0) {
                        <span class="badge bg-danger">Out of Stock</span>
                      } @else if (p.availableStock <= 3) {
                        <span class="badge bg-warning text-dark fw-bold">Urgent</span>
                      } @else {
                        <span class="badge bg-success bg-opacity-25 text-success border border-success">In Stock</span>
                      }
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>

          @if (filteredPreviewProducts().length === 0) {
            <div class="text-center py-5">
              <i class="bi bi-search fs-2 text-muted"></i>
              <p class="text-muted mt-2">No products match your preview filter.</p>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class AdminComponent implements OnInit {
  private catalogService = inject(CatalogService);
  private orderService = inject(OrderService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

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

  // Storefront preview filters
  previewSearchQuery = '';
  selectedPreviewCategory = '';

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

  // Filtered products for Tab 4 Preview
  filteredPreviewProducts(): Product[] {
    return this.products().filter(p => {
      const matchesSearch = !this.previewSearchQuery || 
        p.title.toLowerCase().includes(this.previewSearchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(this.previewSearchQuery.toLowerCase());
      const matchesCategory = !this.selectedPreviewCategory || p.categoryName === this.selectedPreviewCategory;
      return matchesSearch && matchesCategory;
    });
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

  deleteProduct(product: Product): void {
    if (!confirm(`Are you sure you want to deactivate "${product.title}" (${product.sku})? It will be removed from the public customer catalog.`)) {
      return;
    }

    this.catalogService.deleteProduct(product.id).subscribe({
      next: () => {
        this.toastService.warning('Product Deactivated', `"${product.title}" has been removed from customer catalog.`);
        this.loadProducts();
      },
      error: (err) => {
        this.toastService.error('Deactivation Failed', err.error?.message || 'Failed to deactivate product.');
      }
    });
  }
}
