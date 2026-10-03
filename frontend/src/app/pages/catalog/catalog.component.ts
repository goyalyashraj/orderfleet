import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CatalogService } from '../../services/catalog.service';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { Category, Product } from '../../models/catalog.model';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="container py-3">
      <!-- Promotional Hero Strip (Amazon/Myntra style deal banner) -->
      <div class="glass-panel p-4 mb-4 position-relative overflow-hidden" 
           style="background: linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%); border-left: 4px solid #f59e0b;">
        <div class="row align-items-center g-3">
          <div class="col-md-8">
            <div class="d-inline-flex align-items-center gap-2 px-2 py-1 rounded bg-dark border border-secondary text-warning small mb-2">
              <i class="bi bi-tag-fill"></i>
              <span class="fw-bold">PRIME DEALS • UP TO 25% OFF</span>
            </div>
            <h2 class="fw-extrabold text-white mb-1">Premium Electronics, Audio &amp; Smart Gear</h2>
            <p class="text-white-50 small mb-0">
              Discover verified bestsellers and top-rated essentials with guaranteed real-time stock and express doorstep delivery.
            </p>
          </div>
          <div class="col-md-4 text-md-end">
            <div class="d-inline-flex flex-column align-items-md-end">
              <span class="badge bg-success text-white px-3 py-2 rounded-pill fw-bold shadow-sm">
                <i class="bi bi-truck me-1"></i> FREE Express Delivery
              </span>
              <span class="text-white-50 small mt-1" style="font-size: 0.75rem;">Dispatches within 10 minutes</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Search, Categories & Quick Filters -->
      <div class="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
        <!-- Category Filter Pills -->
        <div class="d-flex gap-2 overflow-auto pb-2 pb-lg-0 scrollbar-none">
          <button 
            type="button" 
            class="btn btn-sm text-nowrap px-3 py-2 rounded-pill fw-bold" 
            [ngClass]="selectedCategoryId() === null ? 'btn-amazon-primary' : 'btn-glass text-white'"
            (click)="selectCategory(null)">
            <i class="bi bi-grid-fill me-1"></i> All Products
          </button>
          @for (cat of categories(); track cat.id) {
            <button 
              type="button" 
              class="btn btn-sm text-nowrap px-3 py-2 rounded-pill fw-bold" 
              [ngClass]="selectedCategoryId() === cat.id ? 'btn-amazon-primary' : 'btn-glass text-white'"
              (click)="selectCategory(cat.id)">
              {{ cat.name }}
            </button>
          }
        </div>

        <!-- Prominent High-Contrast Search Bar -->
        <div class="d-flex align-items-center gap-2 flex-grow-1" style="max-width: 440px;">
          <div class="input-group shadow-sm w-100">
            <span class="input-group-text bg-dark border-secondary text-warning"><i class="bi bi-search"></i></span>
            <input 
              type="text" 
              class="form-control" 
              placeholder="Search products, brands, categories..." 
              [(ngModel)]="searchQuery">
            @if (searchQuery) {
              <button class="btn btn-dark border-secondary text-white-50" (click)="searchQuery = ''">
                <i class="bi bi-x-lg"></i>
              </button>
            }
          </div>
        </div>
      </div>

      <!-- High-Contrast Results Count Bar -->
      <div class="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom border-secondary text-white-50 small">
        <div class="fs-6">
          Showing <strong class="text-white">{{ filteredProducts().length }}</strong> products
          @if (selectedCategoryName()) {
            in <span class="text-warning fw-bold">{{ selectedCategoryName() }}</span>
          }
        </div>
        <div class="d-flex align-items-center gap-2">
          <span class="d-none d-sm-inline text-white-50">Sort by:</span>
          <select class="form-select form-select-sm py-1 px-3 bg-dark border-secondary text-white fw-semibold" style="width: auto; font-size: 0.82rem;" [(ngModel)]="sortBy">
            <option value="featured">Featured Deals</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>
      </div>

      <!-- SKELETON LOADERS (Myntra/Amazon style shimmering cards) -->
      @if (loading()) {
        <div class="row g-3 g-md-4">
          @for (i of [1,2,3,4,5,6,7,8]; track i) {
            <div class="col-6 col-md-4 col-xl-3">
              <div class="glass-panel p-3 h-100">
                <div class="skeleton-shimmer mb-3" style="height: 180px; width: 100%;"></div>
                <div class="skeleton-shimmer mb-2" style="height: 16px; width: 40%;"></div>
                <div class="skeleton-shimmer mb-2" style="height: 20px; width: 85%;"></div>
                <div class="skeleton-shimmer mb-3" style="height: 14px; width: 60%;"></div>
                <div class="skeleton-shimmer mt-auto" style="height: 38px; width: 100%;"></div>
              </div>
            </div>
          }
        </div>
      } @else if (filteredProducts().length === 0) {
        <!-- Clean Empty State -->
        <div class="glass-panel text-center py-5 p-4 my-4">
          <div class="d-inline-flex p-4 rounded-circle mb-3" style="background: rgba(245, 158, 11, 0.1);">
            <i class="bi bi-search fs-1 text-warning"></i>
          </div>
          <h4 class="text-white fw-bold">No Products Found</h4>
          <p class="text-muted mb-4 mx-auto" style="max-width: 420px;">
            We couldn't find any products matching "{{ searchQuery }}". Try checking your spelling or selecting another category.
          </p>
          <button class="btn btn-amazon-primary" (click)="resetFilters()">
            <i class="bi bi-arrow-counterclockwise me-1"></i> Clear Filters
          </button>
        </div>
      } @else {
        <!-- Product Grid (Amazon/Myntra cards) -->
        <div class="row g-3 g-md-4">
          @for (product of sortedProducts(); track product.id) {
            <div class="col-6 col-md-4 col-xl-3">
              <div class="glass-panel glass-panel-interactive product-card h-100 d-flex flex-column p-3 position-relative">
                <!-- Top Badges: Category & Wishlist -->
                <div class="position-absolute top-0 start-0 m-3 z-2 d-flex flex-column gap-1">
                  <span class="badge bg-dark border border-secondary text-white-50 px-2 py-1" style="font-size: 0.65rem;">
                    {{ product.categoryName }}
                  </span>
                  @if (product.availableStock > 0) {
                    <span class="badge-discount">
                      20% OFF
                    </span>
                  }
                </div>

                <div class="position-absolute top-0 end-0 m-3 z-2">
                  <button 
                    type="button" 
                    class="btn btn-sm btn-dark rounded-circle p-1 d-flex align-items-center justify-content-center border-0"
                    style="width: 32px; height: 32px; background: rgba(0, 0, 0, 0.6);"
                    (click)="toggleWishlist(product)">
                    <i class="bi" [ngClass]="isWishlisted(product.id) ? 'bi-heart-fill text-danger' : 'bi-heart text-white'"></i>
                  </button>
                </div>

                <!-- Product Thumbnail Graphic -->
                <div class="product-card-thumbnail d-flex align-items-center justify-content-center my-2 p-4" 
                     style="min-height: 180px;">
                  <i [class]="getProductIcon(product)" class="fs-1" style="color: #60a5fa;"></i>
                </div>

                <!-- Star Ratings (Amazon style) -->
                <div class="d-flex align-items-center gap-2 mb-1">
                  <span class="rating-badge">
                    <i class="bi bi-star-fill text-warning"></i> 4.7
                  </span>
                  <span class="text-muted" style="font-size: 0.72rem;">(142 ratings)</span>
                </div>

                <!-- Title & SKU -->
                <h6 class="fw-bold text-white mb-1 text-truncate" [title]="product.title">
                  {{ product.title }}
                </h6>
                <p class="text-muted small mb-2 text-truncate-2 flex-grow-1" style="font-size: 0.8rem; line-height: 1.35;">
                  {{ product.description }}
                </p>

                <!-- Stock Urgency Alert (Amazon style: "Only X left in stock") -->
                <div class="mb-2">
                  @if (product.availableStock <= 0) {
                    <span class="badge bg-secondary text-dark fw-bold px-2 py-1 small">
                      Sold Out
                    </span>
                  } @else if (product.availableStock <= 3) {
                    <span class="badge-stock-urgency">
                      <span class="pulse-dot"></span>
                      Only {{ product.availableStock }} left in stock - order soon!
                    </span>
                  } @else {
                    <span class="badge-stock-available">
                      <i class="bi bi-check-circle-fill"></i> In Stock ({{ product.availableStock }} units)
                    </span>
                  }
                </div>

                <!-- Pricing Block (Selling Price vs Strike-through MRP) -->
                <div class="d-flex align-items-baseline mb-3 pt-2 border-top border-secondary">
                  <span class="price-selling">\${{ product.price.toFixed(2) }}</span>
                  <span class="price-mrp">\${{ (product.price * 1.25).toFixed(2) }}</span>
                </div>

                <!-- Action CTAs (Amazon "Add to Cart" + "Buy Now") -->
                <div class="d-flex gap-2 mt-auto">
                  <button 
                    type="button" 
                    class="btn btn-amazon-primary flex-grow-1 d-flex align-items-center justify-content-center gap-1 py-2"
                    [disabled]="product.availableStock <= 0 || addingProductId() === product.id"
                    (click)="addToCart(product)">
                    @if (addingProductId() === product.id) {
                      <span class="spinner-border spinner-border-sm" role="status"></span>
                    } @else {
                      <i class="bi bi-cart-plus-fill"></i>
                      <span>Add to Cart</span>
                    }
                  </button>

                  <button 
                    type="button" 
                    class="btn btn-myntra-primary px-3 d-none d-sm-flex align-items-center justify-content-center"
                    [disabled]="product.availableStock <= 0"
                    title="Quick Buy Now"
                    (click)="buyNow(product)">
                    <i class="bi bi-lightning-fill"></i>
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .text-truncate-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .scrollbar-none::-webkit-scrollbar {
      display: none;
    }
  `]
})
export class CatalogComponent implements OnInit {
  private catalogService = inject(CatalogService);
  private cartService = inject(CartService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  loading = signal(true);
  selectedCategoryId = signal<number | null>(null);
  searchQuery = '';
  sortBy = 'featured';
  addingProductId = signal<number | null>(null);
  wishlistedIds = signal<Set<number>>(new Set());

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
        this.toastService.error('Catalog Error', 'Could not load products from catalog service.');
      }
    });
  }

  selectCategory(categoryId: number | null): void {
    this.selectedCategoryId.set(categoryId);
  }

  selectedCategoryName(): string | null {
    const id = this.selectedCategoryId();
    if (id === null) return null;
    return this.categories().find(c => c.id === id)?.name || null;
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedCategoryId.set(null);
  }

  filteredProducts(): Product[] {
    let list = this.products();
    const catId = this.selectedCategoryId();
    if (catId !== null) {
      list = list.filter(p => p.categoryId === catId);
    }
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(p => 
        p.title.toLowerCase().includes(q) || 
        p.sku.toLowerCase().includes(q) ||
        p.categoryName?.toLowerCase().includes(q)
      );
    }
    return list;
  }

  sortedProducts(): Product[] {
    const items = [...this.filteredProducts()];
    if (this.sortBy === 'price-low') {
      return items.sort((a, b) => a.price - b.price);
    } else if (this.sortBy === 'price-high') {
      return items.sort((a, b) => b.price - a.price);
    }
    return items;
  }

  getProductIcon(product: Product): string {
    const title = product.title.toLowerCase();
    const cat = (product.categoryName || '').toLowerCase();
    if (title.includes('mouse')) return 'bi-mouse2-fill';
    if (title.includes('keyboard')) return 'bi-keyboard-fill';
    if (title.includes('headphone')) return 'bi-headphones';
    if (title.includes('earbud')) return 'bi-soundwave';
    if (title.includes('watch') || title.includes('band') || title.includes('fitness') || cat.includes('wearable')) return 'bi-smartwatch';
    if (title.includes('webcam') || title.includes('camera')) return 'bi-camera-video-fill';
    if (title.includes('hub') || title.includes('usb')) return 'bi-usb-symbol';
    if (title.includes('laptop') || cat.includes('electron')) return 'bi-laptop';
    return 'bi-box-seam';
  }

  isWishlisted(productId: number): boolean {
    return this.wishlistedIds().has(productId);
  }

  toggleWishlist(product: Product): void {
    const current = new Set(this.wishlistedIds());
    if (current.has(product.id)) {
      current.delete(product.id);
      this.toastService.info('Wishlist', `Removed "${product.title}" from your wishlist.`);
    } else {
      current.add(product.id);
      this.toastService.success('Wishlist', `Added "${product.title}" to your wishlist!`);
    }
    this.wishlistedIds.set(current);
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
        this.toastService.success(
          'Added to Cart',
          `"${product.title}" was added to your shopping cart.`,
          'View Cart',
          '/cart'
        );
      },
      error: (err) => {
        this.addingProductId.set(null);
        this.toastService.error('Stock Reservation Notice', err.error?.message || 'Could not add item to cart.');
      }
    });
  }

  buyNow(product: Product): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/cart' } });
      return;
    }

    this.cartService.addItem(product.id, 1).subscribe({
      next: () => {
        this.router.navigate(['/cart']);
      },
      error: (err) => {
        this.toastService.error('Checkout Error', err.error?.message || 'Item unavailable.');
      }
    });
  }
}
