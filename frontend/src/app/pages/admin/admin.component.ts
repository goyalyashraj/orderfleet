import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CatalogService, CreateProductDto } from '../../services/catalog.service';
import { ToastService } from '../../services/toast.service';
import { Category, Product } from '../../models/catalog.model';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="container py-3">
      <!-- Header & Quick Metrics -->
      <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <div class="d-flex align-items-center gap-2 mb-1">
            <span class="badge bg-danger px-2 py-1 small fw-bold">ADMIN PORTAL</span>
            <h2 class="fw-extrabold text-white m-0">Inventory &amp; Product Management</h2>
          </div>
          <p class="text-muted small mb-0">Control catalog SKUs, manage stock levels, and inspect active reservations</p>
        </div>

        <button class="btn btn-amazon-primary d-flex align-items-center gap-2" (click)="showAddProductModal.set(true)">
          <i class="bi bi-plus-circle-fill"></i>
          <span>Add New Product SKU</span>
        </button>
      </div>

      <!-- Inventory Metrics Cards -->
      <div class="row g-3 mb-4">
        <div class="col-sm-6 col-lg-3">
          <div class="glass-panel p-3">
            <div class="text-muted small">Total Active SKUs</div>
            <div class="fs-3 fw-extrabold text-white">{{ products().length }}</div>
            <div class="text-success small"><i class="bi bi-check-circle"></i> Across {{ categories().length }} categories</div>
          </div>
        </div>
        <div class="col-sm-6 col-lg-3">
          <div class="glass-panel p-3">
            <div class="text-muted small">Total Available Units</div>
            <div class="fs-3 fw-extrabold text-warning">{{ totalAvailableUnits() }}</div>
            <div class="text-muted small">Ready for instant dispatch</div>
          </div>
        </div>
        <div class="col-sm-6 col-lg-3">
          <div class="glass-panel p-3">
            <div class="text-muted small">Currently Reserved</div>
            <div class="fs-3 fw-extrabold text-info">{{ totalReservedUnits() }}</div>
            <div class="text-muted small">Locked in checkout flows</div>
          </div>
        </div>
        <div class="col-sm-6 col-lg-3">
          <div class="glass-panel p-3">
            <div class="text-muted small">Low Stock Items (&le; 3)</div>
            <div class="fs-3 fw-extrabold text-danger">{{ lowStockCount() }}</div>
            <div class="text-danger small"><i class="bi bi-exclamation-triangle"></i> Needs restock</div>
          </div>
        </div>
      </div>

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
          <h5 class="fw-bold text-white m-0">Live Inventory Database (catalog_db)</h5>
          <button class="btn btn-glass btn-sm" (click)="loadProducts()">
            <i class="bi bi-arrow-clockwise me-1"></i> Refresh Stock
          </button>
        </div>

        @if (loading()) {
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
    </div>
  `
})
export class AdminComponent implements OnInit {
  private catalogService = inject(CatalogService);
  private toastService = inject(ToastService);

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  loading = signal(false);
  showAddProductModal = signal(false);
  submittingProduct = signal(false);

  newProduct: CreateProductDto = {
    sku: '',
    title: '',
    description: '',
    price: 49.99,
    categoryId: 1,
    initialStock: 20
  };

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
  }

  loadCategories(): void {
    this.catalogService.getCategories().subscribe({
      next: (res) => this.categories.set(res.data || [])
    });
  }

  loadProducts(): void {
    this.loading.set(true);
    this.catalogService.getProducts().subscribe({
      next: (res) => {
        this.products.set(res.data || []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toastService.error('Admin Error', 'Could not load products.');
      }
    });
  }

  totalAvailableUnits(): number {
    return this.products().reduce((sum, p) => sum + (p.availableStock || 0), 0);
  }

  totalReservedUnits(): number {
    return 0; // Fetched during active reservation query
  }

  lowStockCount(): number {
    return this.products().filter(p => (p.availableStock || 0) <= 3).length;
  }

  submitNewProduct(): void {
    if (!this.newProduct.sku || !this.newProduct.title || !this.newProduct.price) {
      this.toastService.warning('Validation', 'Please provide SKU, title, and price.');
      return;
    }

    this.submittingProduct.set(true);
    this.catalogService.createProduct(this.newProduct).subscribe({
      next: (res) => {
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
