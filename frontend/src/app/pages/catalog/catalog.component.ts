import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CatalogService } from '../../services/catalog.service';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { Category, Product } from '../../models/catalog.model';
import { getProductMetadata, ProductMetadata } from '../../utils/product-assets';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="container py-3">
      <!-- 1. LIVE FLASH SALE HEADLINER BANNER -->
      @if (flashSaleProduct()) {
        <div class="glass-panel p-4 mb-4 position-relative overflow-hidden flash-banner shadow-lg border border-danger">
          <div class="position-absolute top-0 end-0 p-3 opacity-25 d-none d-lg-block">
            <i class="bi bi-lightning-charge-fill" style="font-size: 10rem; color: #ec4899;"></i>
          </div>

          <div class="row align-items-center g-3 position-relative z-2">
            <div class="col-lg-7">
              <div class="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill bg-danger text-white small fw-extrabold mb-2 shadow-sm">
                <i class="bi bi-lightning-fill"></i>
                <span>LIMITED TIME FLASH SALE &bull; 40% OFF</span>
              </div>
              <h2 class="fw-extrabold text-white mb-2">{{ flashSaleProduct()!.title }}</h2>
              <p class="text-white-50 small mb-3" style="max-width: 580px;">
                {{ flashSaleProduct()!.description }}. High-performance mechanical key switches, per-key RGB diffuser, and gasket mount architecture.
              </p>

              <!-- Live Flash Sale Telemetry Meter -->
              <div class="p-3 rounded-3 mb-3" style="background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(236, 72, 153, 0.3); max-width: 520px;">
                <div class="d-flex justify-content-between align-items-center mb-1">
                  <span class="small fw-bold text-white d-flex align-items-center gap-1">
                    <span class="pulse-dot-pink"></span> Real-Time Warehouse Stock:
                  </span>
                  <span class="small fw-extrabold text-warning">
                    Only {{ flashSaleProduct()!.availableStock }} Units Remaining!
                  </span>
                </div>
                <div class="progress" style="height: 8px; background: rgba(255,255,255,0.1);">
                  <div class="progress-bar progress-bar-striped progress-bar-animated bg-gradient-pink" 
                       role="progressbar" 
                       [style.width.%]="getStockPercentage(flashSaleProduct()!.availableStock, 25)"></div>
                </div>
              </div>

              <!-- Price & Claim CTA -->
              <div class="d-flex flex-wrap align-items-center gap-3">
                <div class="d-flex align-items-baseline gap-2">
                  <span class="fs-2 fw-extrabold text-white">\${{ flashSaleProduct()!.price.toFixed(2) }}</span>
                  <span class="text-muted text-decoration-line-through fs-5">\${{ (flashSaleProduct()!.price * 1.4).toFixed(2) }}</span>
                  <span class="badge bg-danger text-white fw-bold">SAVE 40%</span>
                </div>
                <button 
                  type="button" 
                  class="btn btn-danger btn-lg px-4 d-flex align-items-center gap-2 fw-bold shadow-lg"
                  [disabled]="flashSaleProduct()!.availableStock <= 0 || addingProductId() === flashSaleProduct()!.id"
                  (click)="addToCart(flashSaleProduct()!)">
                  <i class="bi bi-cart-plus-fill"></i>
                  <span>Claim Flash Deal</span>
                </button>
                <button 
                  type="button" 
                  class="btn btn-glass btn-lg px-3 text-white" 
                  (click)="openQuickView(flashSaleProduct()!)">
                  <i class="bi bi-eye me-1"></i> Specs &amp; Details
                </button>
              </div>
            </div>

            <!-- Product Showcase Visual on Right -->
            <div class="col-lg-5 text-center">
              <div class="flash-graphic-card p-3 mx-auto" style="max-width: 280px; cursor: pointer;" (click)="openQuickView(flashSaleProduct()!)">
                <div class="product-svg-wrapper mb-2" [innerHTML]="getSvg(flashSaleProduct()!)"></div>
                <span class="badge bg-dark border border-secondary text-info small">Click for 360° Specs</span>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- 2. SEARCH, CATEGORIES & FILTER BAR -->
      <div class="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
        <!-- Category Filter Pills -->
        <div class="d-flex gap-2 overflow-auto pb-2 pb-lg-0 scrollbar-none">
          <button 
            type="button" 
            class="btn btn-sm text-nowrap px-3 py-2 rounded-pill fw-bold" 
            [ngClass]="selectedCategoryId() === null ? 'btn-amazon-primary' : 'btn-glass text-white'"
            (click)="selectCategory(null)">
            <i class="bi bi-grid-fill me-1"></i> All Catalog ({{ products().length }})
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

        <!-- Search Input -->
        <div class="d-flex align-items-center gap-2 flex-grow-1" style="max-width: 440px;">
          <div class="input-group shadow-sm w-100">
            <span class="input-group-text bg-dark border-secondary text-warning"><i class="bi bi-search"></i></span>
            <input 
              type="text" 
              class="form-control" 
              placeholder="Search gadgets, watches, audio, hubs..." 
              [(ngModel)]="searchQuery">
            @if (searchQuery) {
              <button class="btn btn-dark border-secondary text-white-50" (click)="searchQuery = ''">
                <i class="bi bi-x-lg"></i>
              </button>
            }
          </div>
        </div>
      </div>

      <!-- 3. SORT & RESULT BAR -->
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

      <!-- 4. PRODUCT GRID (Amazon/Apple Storefront Cards) -->
      @if (loading()) {
        <div class="row g-3 g-md-4">
          @for (i of [1,2,3,4,5,6]; track i) {
            <div class="col-12 col-sm-6 col-lg-4 col-xl-4">
              <div class="glass-panel p-3 h-100">
                <div class="skeleton-shimmer mb-3" style="height: 200px; width: 100%;"></div>
                <div class="skeleton-shimmer mb-2" style="height: 16px; width: 40%;"></div>
                <div class="skeleton-shimmer mb-2" style="height: 20px; width: 85%;"></div>
                <div class="skeleton-shimmer mb-3" style="height: 14px; width: 60%;"></div>
                <div class="skeleton-shimmer mt-auto" style="height: 42px; width: 100%;"></div>
              </div>
            </div>
          }
        </div>
      } @else if (filteredProducts().length === 0) {
        <div class="glass-panel text-center py-5 p-4 my-4">
          <div class="d-inline-flex p-4 rounded-circle mb-3" style="background: rgba(245, 158, 11, 0.1);">
            <i class="bi bi-search fs-1 text-warning"></i>
          </div>
          <h4 class="text-white fw-bold">No Products Found</h4>
          <p class="text-muted mb-4 mx-auto" style="max-width: 420px;">
            We couldn't find any products matching "{{ searchQuery }}". Try selecting another category or resetting filters.
          </p>
          <button class="btn btn-amazon-primary" (click)="resetFilters()">
            <i class="bi bi-arrow-counterclockwise me-1"></i> Clear Filters
          </button>
        </div>
      } @else {
        <div class="row g-3 g-md-4">
          @for (product of sortedProducts(); track product.id) {
            <div class="col-12 col-sm-6 col-lg-4 col-xl-4">
              <div class="glass-panel glass-panel-interactive product-card h-100 d-flex flex-column p-3 position-relative">
                
                <!-- Category & Brand Badge Top Left -->
                <div class="position-absolute top-0 start-0 m-3 z-2 d-flex flex-column gap-1">
                  <span class="badge bg-dark border border-secondary text-white-50 px-2 py-1" style="font-size: 0.65rem;">
                    {{ product.categoryName }}
                  </span>
                  @if (getMetadata(product).badge) {
                    <span class="badge px-2 py-1 fw-bold shadow-sm" style="font-size: 0.68rem; background: #ea580c; color: white;">
                      {{ getMetadata(product).badge }}
                    </span>
                  }
                </div>

                <!-- Wishlist Button Top Right -->
                <div class="position-absolute top-0 end-0 m-3 z-2">
                  <button 
                    type="button" 
                    class="btn btn-sm btn-dark rounded-circle p-1 d-flex align-items-center justify-content-center border-0 shadow-sm"
                    style="width: 34px; height: 34px; background: rgba(0, 0, 0, 0.65);"
                    title="Save to Wishlist"
                    (click)="toggleWishlist(product)">
                    <i class="bi" [ngClass]="isWishlisted(product.id) ? 'bi-heart-fill text-danger' : 'bi-heart text-white'"></i>
                  </button>
                </div>

                <!-- Visual Product Illustration Card Container (Click to Quick View) -->
                <div class="product-visual-box d-flex align-items-center justify-content-center my-2 p-3 rounded-3 position-relative"
                     style="min-height: 190px; cursor: pointer;"
                     (click)="openQuickView(product)">
                  <div class="product-svg-container" [innerHTML]="getSvg(product)"></div>
                  <div class="quick-view-hover-pill">
                    <i class="bi bi-arrows-fullscreen me-1"></i> Quick View &amp; Specs
                  </div>
                </div>

                <!-- Brand Name & Star Ratings -->
                <div class="d-flex justify-content-between align-items-center mb-1">
                  <span class="text-white-50 small fw-bold text-uppercase" style="font-size: 0.72rem; letter-spacing: 0.05em;">
                    {{ getMetadata(product).brand }}
                  </span>
                  <div class="d-flex align-items-center gap-1">
                    <span class="rating-badge">
                      <i class="bi bi-star-fill text-warning"></i> {{ getMetadata(product).rating }}
                    </span>
                    <span class="text-muted" style="font-size: 0.72rem;">({{ getMetadata(product).reviewCount }})</span>
                  </div>
                </div>

                <!-- Product Title & Description -->
                <h5 class="fw-bold text-white mb-1 product-title-clickable" (click)="openQuickView(product)" [title]="product.title">
                  {{ product.title }}
                </h5>
                <p class="text-muted small mb-2 text-truncate-2 flex-grow-1" style="font-size: 0.8rem; line-height: 1.4;">
                  {{ product.description }}
                </p>

                <!-- Stock & Fast Dispatch Indicator -->
                <div class="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    @if (product.availableStock <= 0) {
                      <span class="badge bg-secondary text-dark fw-bold px-2 py-1 small">
                        Sold Out
                      </span>
                    } @else if (product.availableStock <= 4) {
                      <span class="badge-stock-urgency">
                        <span class="pulse-dot"></span>
                        Only {{ product.availableStock }} left in stock!
                      </span>
                    } @else {
                      <span class="badge-stock-available">
                        <i class="bi bi-check-circle-fill"></i> In Stock ({{ product.availableStock }} units)
                      </span>
                    }
                  </div>
                  <span class="text-white-50 small" style="font-size: 0.72rem;">
                    <i class="bi bi-truck text-warning me-1"></i> Express 2-Day
                  </span>
                </div>

                <!-- Pricing Block (Selling Price vs Strike-through MRP) -->
                <div class="d-flex align-items-baseline gap-2 mb-3 pt-2 border-top border-secondary">
                  <span class="price-selling fs-4 fw-extrabold text-white">\${{ product.price.toFixed(2) }}</span>
                  <span class="price-mrp">\${{ (product.price * 1.25).toFixed(2) }}</span>
                  <span class="badge bg-success-subtle text-success small fw-bold">20% OFF</span>
                </div>

                <!-- Action CTAs: Add to Cart + Quick Buy -->
                <div class="d-flex gap-2 mt-auto">
                  <button 
                    type="button" 
                    class="btn btn-amazon-primary flex-grow-1 d-flex align-items-center justify-content-center gap-1 py-2 fw-bold"
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
                    class="btn btn-myntra-primary px-3 d-flex align-items-center justify-content-center fw-bold"
                    [disabled]="product.availableStock <= 0"
                    title="Instant Buy & Checkout"
                    (click)="buyNow(product)">
                    <i class="bi bi-lightning-fill"></i>
                  </button>
                </div>

              </div>
            </div>
          }
        </div>
      }

      <!-- 5. INTERACTIVE PRODUCT QUICK VIEW & SPECS MODAL -->
      @if (selectedProductForModal()) {
        <div class="modal-backdrop-custom d-flex align-items-center justify-content-center p-3">
          <div class="modal-dialog-custom glass-panel border border-secondary shadow-lg rounded-4 p-4 position-relative overflow-hidden" 
               style="max-width: 900px; width: 100%; max-height: 90vh; overflow-y: auto;">
            
            <!-- Close Modal Button -->
            <button 
              type="button" 
              class="btn btn-sm btn-dark rounded-circle position-absolute top-0 end-0 m-3 z-3 text-white border border-secondary"
              style="width: 36px; height: 36px;"
              (click)="closeQuickView()">
              <i class="bi bi-x-lg"></i>
            </button>

            <div class="row g-4 align-items-start">
              <!-- Left Column: Visual Showcase Artwork -->
              <div class="col-md-5 text-center">
                <div class="p-4 rounded-4 position-relative" style="background: #0b1120; border: 1px solid rgba(255,255,255,0.08);">
                  <div class="modal-product-svg mb-3" [innerHTML]="getSvg(selectedProductForModal()!)"></div>
                  
                  <div class="d-flex justify-content-center align-items-center gap-2 mt-2">
                    <span class="badge bg-dark border border-secondary text-white-50 px-3 py-1 small">
                      <i class="bi bi-shield-check text-success me-1"></i> Guaranteed Genuine
                    </span>
                    <span class="badge bg-dark border border-secondary text-white-50 px-3 py-1 small">
                      <i class="bi bi-arrow-repeat text-info me-1"></i> 7-Day Returns
                    </span>
                  </div>
                </div>

                <!-- Warranty Info -->
                <div class="mt-3 p-3 rounded-3 text-start small" style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);">
                  <div class="fw-bold text-white mb-1"><i class="bi bi-patch-check-fill text-primary me-1"></i> OrderFleet Warranty Protection</div>
                  <div class="text-white-50">Includes official 2-year manufacturer parts replacement and 24/7 dedicated hardware concierge.</div>
                </div>
              </div>

              <!-- Right Column: Product Specs, Ratings & Purchase Form -->
              <div class="col-md-7">
                <div class="d-flex align-items-center gap-2 mb-2">
                  <span class="badge bg-primary text-white fw-bold">{{ getMetadata(selectedProductForModal()!).brand }}</span>
                  <span class="badge bg-secondary text-white-50">{{ selectedProductForModal()!.categoryName }}</span>
                  <span class="text-muted font-monospace small">SKU: {{ selectedProductForModal()!.sku }}</span>
                </div>

                <h3 class="fw-extrabold text-white mb-2">{{ selectedProductForModal()!.title }}</h3>

                <!-- Ratings Bar -->
                <div class="d-flex align-items-center gap-2 mb-3">
                  <span class="rating-badge fs-6">
                    <i class="bi bi-star-fill text-warning"></i> {{ getMetadata(selectedProductForModal()!).rating }}
                  </span>
                  <span class="text-white-50 small">based on {{ getMetadata(selectedProductForModal()!).reviewCount }} customer ratings</span>
                  <span class="text-muted small">&bull;</span>
                  <span class="text-success small fw-semibold"><i class="bi bi-bag-check-fill me-1"></i>98% would recommend</span>
                </div>

                <!-- Price Block -->
                <div class="d-flex align-items-baseline gap-3 p-3 rounded-3 mb-3" style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08);">
                  <div>
                    <span class="fs-2 fw-extrabold text-white">\${{ selectedProductForModal()!.price.toFixed(2) }}</span>
                    <span class="text-muted text-decoration-line-through ms-2 fs-6">\${{ (selectedProductForModal()!.price * 1.25).toFixed(2) }}</span>
                  </div>
                  <span class="badge bg-danger text-white fw-bold px-2 py-1">20% OFF TODAY</span>
                  <div class="ms-auto text-end small">
                    <div class="text-success fw-bold"><i class="bi bi-truck me-1"></i> FREE Express Delivery</div>
                    <div class="text-white-50" style="font-size: 0.72rem;">Arrives in 1-2 business days</div>
                  </div>
                </div>

                <!-- Description -->
                <p class="text-white-50 small mb-3 leading-relaxed">
                  {{ selectedProductForModal()!.description }}
                </p>

                <!-- Technical Specifications Table -->
                <h6 class="fw-bold text-white mb-2 border-bottom border-secondary pb-1">
                  <i class="bi bi-sliders text-warning me-1"></i> Technical Specifications
                </h6>
                <div class="specs-grid mb-3">
                  @for (spec of getMetadata(selectedProductForModal()!).specs; track spec.label) {
                    <div class="spec-row d-flex justify-content-between py-1 border-bottom border-dark small">
                      <span class="text-muted">{{ spec.label }}:</span>
                      <strong class="text-white">{{ spec.value }}</strong>
                    </div>
                  }
                </div>

                <!-- Key Highlights -->
                <h6 class="fw-bold text-white mb-2 border-bottom border-secondary pb-1">
                  <i class="bi bi-stars text-info me-1"></i> Key Features
                </h6>
                <ul class="text-white-50 small ps-3 mb-3">
                  @for (highlight of getMetadata(selectedProductForModal()!).highlights; track highlight) {
                    <li class="mb-1">{{ highlight }}</li>
                  }
                </ul>

                <!-- Purchase Buttons -->
                <div class="d-flex align-items-center gap-3 pt-3 border-top border-secondary">
                  <!-- Quantity Selector -->
                  <div class="d-flex align-items-center border border-secondary rounded-2 bg-dark">
                    <button type="button" class="btn btn-sm btn-dark text-muted px-3 py-1 border-0" (click)="decreaseModalQty()">
                      <i class="bi bi-dash"></i>
                    </button>
                    <span class="px-2 small fw-bold text-white">{{ modalQuantity() }}</span>
                    <button type="button" class="btn btn-sm btn-dark text-muted px-3 py-1 border-0" (click)="increaseModalQty()">
                      <i class="bi bi-plus"></i>
                    </button>
                  </div>

                  <!-- Add To Cart -->
                  <button 
                    type="button" 
                    class="btn btn-amazon-primary flex-grow-1 py-2 fw-bold d-flex align-items-center justify-content-center gap-2"
                    [disabled]="selectedProductForModal()!.availableStock <= 0 || addingProductId() === selectedProductForModal()!.id"
                    (click)="addModalProductToCart()">
                    @if (addingProductId() === selectedProductForModal()!.id) {
                      <span class="spinner-border spinner-border-sm" role="status"></span>
                    } @else {
                      <i class="bi bi-cart-plus-fill"></i>
                      <span>Add {{ modalQuantity() }} to Cart &bull; \${{ (selectedProductForModal()!.price * modalQuantity()).toFixed(2) }}</span>
                    }
                  </button>

                  <!-- Direct Buy -->
                  <button 
                    type="button" 
                    class="btn btn-myntra-primary px-4 py-2 fw-bold d-flex align-items-center gap-2"
                    [disabled]="selectedProductForModal()!.availableStock <= 0"
                    (click)="buyNow(selectedProductForModal()!)">
                    <i class="bi bi-lightning-fill"></i>
                    <span>Buy Now</span>
                  </button>
                </div>

              </div>
            </div>

          </div>
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
    .flash-banner {
      background: linear-gradient(135deg, rgba(24, 18, 43, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%);
      border-radius: 16px;
    }
    .flash-graphic-card {
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(236, 72, 153, 0.3);
      border-radius: 16px;
      transition: transform 0.2s ease, border-color 0.2s ease;
    }
    .flash-graphic-card:hover {
      transform: scale(1.03);
      border-color: #ec4899;
    }
    .bg-gradient-pink {
      background: linear-gradient(90deg, #ec4899 0%, #f43f5e 100%);
    }
    .pulse-dot-pink {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #ec4899;
      animation: pulse 1.5s infinite;
    }
    .product-visual-box {
      background: radial-gradient(circle at center, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.9) 100%);
      border: 1px solid rgba(255, 255, 255, 0.05);
      transition: all 0.3s ease;
    }
    .product-visual-box:hover {
      border-color: rgba(96, 165, 250, 0.4);
      background: radial-gradient(circle at center, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%);
    }
    .product-svg-container {
      width: 150px;
      height: 150px;
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .product-visual-box:hover .product-svg-container {
      transform: scale(1.08) translateY(-4px);
    }
    .quick-view-hover-pill {
      position: absolute;
      bottom: 12px;
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #ffffff;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 4px 12px;
      border-radius: 20px;
      opacity: 0;
      transform: translateY(6px);
      transition: all 0.2s ease;
      pointer-events: none;
    }
    .product-visual-box:hover .quick-view-hover-pill {
      opacity: 1;
      transform: translateY(0);
    }
    .product-title-clickable {
      cursor: pointer;
      transition: color 0.15s ease;
    }
    .product-title-clickable:hover {
      color: #ffa41c !important;
    }
    .modal-backdrop-custom {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.82);
      backdrop-filter: blur(8px);
      z-index: 1050;
    }
    .modal-dialog-custom {
      background: #0f172a;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7);
      animation: modalFadeIn 0.25s ease-out;
    }
    @keyframes modalFadeIn {
      from { opacity: 0; transform: scale(0.96); }
      to { opacity: 1; transform: scale(1); }
    }
    .modal-product-svg {
      width: 220px;
      height: 220px;
      margin: 0 auto;
    }
  `]
})
export class CatalogComponent implements OnInit {
  private catalogService = inject(CatalogService);
  private cartService = inject(CartService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  loading = signal(true);
  selectedCategoryId = signal<number | null>(null);
  searchQuery = '';
  sortBy = 'featured';
  addingProductId = signal<number | null>(null);
  wishlistedIds = signal<Set<number>>(new Set());

  // Modal State
  selectedProductForModal = signal<Product | null>(null);
  modalQuantity = signal(1);

  // Flash Sale product (Product #12 or first product with "FLASH")
  flashSaleProduct = computed(() => {
    return this.products().find(p => p.sku === 'FLASH-KB-PRO' || p.title.toLowerCase().includes('flash')) || null;
  });

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

  getMetadata(product: Product): ProductMetadata {
    return getProductMetadata(product.sku, product.title, product.categoryName || '');
  }

  getSvg(product: Product): SafeHtml {
    const meta = this.getMetadata(product);
    return this.sanitizer.bypassSecurityTrustHtml(meta.svgArtwork);
  }

  getStockPercentage(available: number, total: number): number {
    return Math.min(100, Math.max(10, Math.round((available / total) * 100)));
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

  openQuickView(product: Product): void {
    this.selectedProductForModal.set(product);
    this.modalQuantity.set(1);
  }

  closeQuickView(): void {
    this.selectedProductForModal.set(null);
  }

  increaseModalQty(): void {
    const prod = this.selectedProductForModal();
    if (prod && this.modalQuantity() < Math.min(10, prod.availableStock)) {
      this.modalQuantity.update(q => q + 1);
    }
  }

  decreaseModalQty(): void {
    if (this.modalQuantity() > 1) {
      this.modalQuantity.update(q => q - 1);
    }
  }

  addModalProductToCart(): void {
    const prod = this.selectedProductForModal();
    if (!prod) return;

    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/catalog' } });
      return;
    }

    const qty = this.modalQuantity();
    this.addingProductId.set(prod.id);
    this.cartService.addItem(prod.id, qty).subscribe({
      next: () => {
        this.addingProductId.set(null);
        this.closeQuickView();
        this.toastService.success(
          'Added to Cart',
          `Added ${qty}x "${prod.title}" to your shopping cart.`,
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
        if (this.selectedProductForModal()) {
          this.closeQuickView();
        }
        this.router.navigate(['/cart']);
      },
      error: (err) => {
        this.toastService.error('Checkout Error', err.error?.message || 'Item unavailable.');
      }
    });
  }
}
