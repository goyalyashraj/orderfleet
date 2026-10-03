import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CatalogService } from '../../services/catalog.service';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { Category, Product } from '../../models/catalog.model';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container py-4">
      <!-- Hero Banner -->
      <div class="glass-panel p-4 p-md-5 mb-5 text-center position-relative overflow-hidden">
        <div class="position-relative z-1">
          <span class="badge bg-primary px-3 py-2 rounded-pill mb-3" style="background: var(--primary-gradient) !important;">
            <i class="bi bi-stars me-1"></i> Microservices Distributed Catalog
          </span>
          <h1 class="display-5 fw-extrabold text-white mb-2">High-Performance E-Commerce & Fleet</h1>
          <p class="text-muted mx-auto" style="max-width: 650px;">
            Dynamic catalog served from <code>catalog-inventory-service</code> with distributed stock reservation and optimistic locking.
          </p>
        </div>
      </div>

      <!-- Controls: Search & Category Tabs -->
      <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <!-- Category Pills -->
        <div class="d-flex gap-2 overflow-auto pb-2 pb-md-0">
          <button 
            type="button" 
            class="btn btn-sm" 
            [ngClass]="selectedCategoryId() === null ? 'btn-gradient-primary' : 'btn-glass'"
            (click)="selectCategory(null)">
            All Products
          </button>
          @for (cat of categories(); track cat.id) {
            <button 
              type="button" 
              class="btn btn-sm" 
              [ngClass]="selectedCategoryId() === cat.id ? 'btn-gradient-primary' : 'btn-glass'"
              (click)="selectCategory(cat.id)">
              {{ cat.name }}
            </button>
          }
        </div>

        <!-- Search Bar -->
        <div class="input-group" style="max-width: 320px;">
          <span class="input-group-text bg-dark border-secondary text-muted"><i class="bi bi-search"></i></span>
          <input 
            type="text" 
            class="form-control form-control-sm" 
            placeholder="Search products..." 
            [(ngModel)]="searchQuery">
        </div>
      </div>

      <!-- Product Cards Grid -->
      @if (loading()) {
        <div class="text-center py-5">
          <div class="spinner-border text-primary" role="status"></div>
          <p class="text-muted mt-2">Loading products from catalog service...</p>
        </div>
      } @else if (filteredProducts().length === 0) {
        <div class="glass-panel text-center py-5 p-4">
          <i class="bi bi-inbox fs-1 text-muted"></i>
          <h4 class="text-white mt-3">No Products Found</h4>
          <p class="text-muted">No items matched your search criteria or category filter.</p>
        </div>
      } @else {
        <div class="row g-4">
          @for (product of filteredProducts(); track product.id) {
            <div class="col-sm-6 col-lg-4 col-xl-3">
              <div class="glass-panel glass-panel-interactive h-100 d-flex flex-column p-4">
                <!-- Category & SKU -->
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <span class="badge bg-dark border border-secondary text-secondary small">{{ product.categoryName }}</span>
                  <span class="text-muted font-monospace" style="font-size: 0.75rem;">{{ product.sku }}</span>
                </div>

                <!-- Product Icon Placeholder Graphic -->
                <div class="d-flex align-items-center justify-content-center rounded-3 my-3 p-4" 
                     style="background: rgba(255, 255, 255, 0.03); min-height: 140px;">
                  <i class="bi bi-laptop fs-1" style="color: #818cf8;"></i>
                </div>

                <!-- Title & Description -->
                <h5 class="fw-bold text-white mb-1 text-truncate" [title]="product.title">{{ product.title }}</h5>
                <p class="text-muted small flex-grow-1" style="line-height: 1.4;">{{ product.description }}</p>

                <!-- Stock & Price -->
                <div class="d-flex justify-content-between align-items-center pt-3 border-top border-secondary mb-3">
                  <div>
                    <div class="text-muted" style="font-size: 0.75rem;">Price</div>
                    <div class="fs-5 fw-bold text-white">\${{ product.price.toFixed(2) }}</div>
                  </div>
                  <div class="text-end">
                    @if (product.availableStock > 0) {
                      <span class="badge badge-pill-status badge-status-available">
                        <i class="bi bi-check-circle-fill me-1"></i> {{ product.availableStock }} In Stock
                      </span>
                    } @else {
                      <span class="badge badge-pill-status badge-status-cancelled">
                        <i class="bi bi-x-circle-fill me-1"></i> Sold Out
                      </span>
                    }
                  </div>
                </div>

                <!-- Add to Cart Action -->
                <button 
                  type="button" 
                  class="btn w-100 d-flex align-items-center justify-content-center gap-2"
                  [ngClass]="product.availableStock > 0 ? 'btn-gradient-primary' : 'btn-glass text-muted'"
                  [disabled]="product.availableStock <= 0 || addingProductId() === product.id"
                  (click)="addToCart(product)">
                  @if (addingProductId() === product.id) {
                    <span class="spinner-border spinner-border-sm" role="status"></span>
                    <span>Adding...</span>
                  } @else if (addedProductId() === product.id) {
                    <i class="bi bi-check2"></i>
                    <span>Added to Cart!</span>
                  } @else {
                    <i class="bi bi-cart-plus"></i>
                    <span>Add to Cart</span>
                  }
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class CatalogComponent implements OnInit {
  private catalogService = inject(CatalogService);
  private cartService = inject(CartService);
  private authService = inject(AuthService);
  private router = inject(Router);

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  loading = signal(true);
  selectedCategoryId = signal<number | null>(null);
  searchQuery = '';
  addingProductId = signal<number | null>(null);
  addedProductId = signal<number | null>(null);

  ngOnInit(): void {
    this.loadCatalog();
  }

  loadCatalog(): void {
    this.loading.set(true);
    this.catalogService.getCategories().subscribe({
      next: (res) => this.categories.set(res.data || []),
      error: () => {}
    });

    this.catalogService.getProducts().subscribe({
      next: (res) => {
        this.products.set(res.data || []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  selectCategory(categoryId: number | null): void {
    this.selectedCategoryId.set(categoryId);
  }

  filteredProducts(): Product[] {
    let list = this.products();
    const catId = this.selectedCategoryId();
    if (catId !== null) {
      list = list.filter(p => p.categoryId === catId);
    }
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(p => p.title.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
    }
    return list;
  }

  addToCart(product: Product): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/catalog' } });
      return;
    }

    this.addingProductId.set(product.id);
    this.cartService.addItem(product.id, 1).subscribe({
      next: () => {
        this.addingProductId.set(null);
        this.addedProductId.set(product.id);
        setTimeout(() => this.addedProductId.set(null), 2000);
      },
      error: () => {
        this.addingProductId.set(null);
      }
    });
  }
}
