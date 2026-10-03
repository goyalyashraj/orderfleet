import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    @if (!isAdminRoute()) {
      <!-- Top Utility Bar (Amazon/Myntra style delivery & customer care indicator) -->
      <div class="bg-black py-1 px-3 border-bottom border-dark text-muted" style="font-size: 0.75rem;">
        <div class="container-fluid d-flex justify-content-between align-items-center">
          <div class="d-flex align-items-center gap-3">
            <span class="d-none d-sm-inline text-white-50">
              <i class="bi bi-patch-check-fill text-warning me-1"></i> 100% Genuine Products
            </span>
            <span class="d-none d-md-inline text-secondary">|</span>
            <span class="d-none d-md-inline text-white-50">
              <i class="bi bi-truck text-success me-1"></i> Free Express Delivery on Orders Over $35
            </span>
            <span class="d-none d-lg-inline text-secondary">|</span>
            <span class="d-none d-lg-inline text-white-50">
              <i class="bi bi-arrow-repeat text-info me-1"></i> Easy 7-Day Free Returns
            </span>
          </div>
          <div class="d-flex align-items-center gap-2">
            <span class="text-white-50">
              <i class="bi bi-geo-alt-fill text-danger me-1"></i> Deliver to: <span class="text-white fw-bold">Springfield 62704</span>
            </span>
          </div>
        </div>
      </div>

      <!-- Main Navigation Bar -->
      <nav class="navbar navbar-expand-lg navbar-dark glass-panel sticky-top mx-2 mx-md-3 mt-2 mb-4 px-3 px-md-4 py-2 border shadow-sm">
      <div class="container-fluid p-0">
        <!-- Brand Logo -->
        <a class="navbar-brand d-flex align-items-center gap-2 me-4" [routerLink]="isAdminRoute() ? '/admin' : '/'">
          <div class="d-flex align-items-center justify-content-center rounded-2" 
               [style.background]="isAdminRoute() ? 'linear-gradient(135deg, #ef4444, #b91c1c)' : 'var(--amazon-btn-gradient)'"
               style="width: 38px; height: 38px;">
            <i class="bi fs-5 text-dark" [class.bi-shield-lock-fill]="isAdminRoute()" [class.bi-box-seam-fill]="!isAdminRoute()"></i>
          </div>
          <div class="d-flex flex-column" style="line-height: 1.1;">
            <div class="d-flex align-items-center gap-2">
              <span class="fw-extrabold fs-4 text-white tracking-tight">Order<span style="color: #ffa41c;">Fleet</span></span>
              @if (isAdminRoute()) {
                <span class="badge bg-danger px-2 py-0 small fw-bold" style="font-size: 0.65rem;">ADMIN CONSOLE</span>
              }
            </div>
            <span class="text-muted fw-bold" style="font-size: 0.65rem; letter-spacing: 0.1em; text-transform: uppercase;">
              {{ isAdminRoute() ? 'Platform Operations' : 'Enterprise Retail' }}
            </span>
          </div>
        </a>

        <!-- Mobile Toggler -->
        <button class="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navContent">
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" id="navContent">
          <!-- Primary Navigation Links -->
          <ul class="navbar-nav me-auto mb-2 mb-lg-0 gap-1">
            @if (isAdminRoute()) {
              <!-- ADMIN-SPECIFIC CLEAN NAVIGATION -->
              <li class="nav-item">
                <a class="nav-link px-3 py-2 rounded-2 text-white fw-bold active-nav" routerLink="/admin">
                  <i class="bi bi-speedometer2 me-1 text-danger"></i> Admin Operations
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link px-3 py-2 rounded-2 text-white-50" routerLink="/catalog">
                  <i class="bi bi-shop me-1 text-warning"></i> Customer Storefront
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link px-3 py-2 rounded-2 text-white-50" routerLink="/fleet">
                  <i class="bi bi-bicycle me-1 text-success"></i> Fleet Dispatch
                </a>
              </li>
            } @else {
              <!-- CUSTOMER SHOPPING NAVIGATION -->
              <li class="nav-item">
                <a class="nav-link px-3 py-2 rounded-2 text-white-50" routerLink="/catalog" routerLinkActive="active-nav">
                  <i class="bi bi-grid me-1 text-warning"></i> Products
                </a>
              </li>
              @if (authService.isAuthenticated()) {
                <li class="nav-item">
                  <a class="nav-link px-3 py-2 rounded-2 text-white-50" routerLink="/orders" routerLinkActive="active-nav">
                    <i class="bi bi-box2-heart me-1 text-info"></i> Orders & Tracking
                  </a>
                </li>
                <li class="nav-item">
                  <a class="nav-link px-3 py-2 rounded-2 text-white-50" routerLink="/fleet" routerLinkActive="active-nav">
                    <i class="bi bi-bicycle me-1 text-success"></i> Fleet Dispatch
                  </a>
                </li>
                @if (authService.isAdmin()) {
                  <li class="nav-item">
                    <a class="nav-link px-3 py-2 rounded-2 text-danger fw-bold" routerLink="/admin" routerLinkActive="active-nav">
                      <i class="bi bi-shield-lock-fill me-1"></i> Admin Portal
                    </a>
                  </li>
                }
              }
            }
          </ul>

          <!-- Right Action Controls -->
          <div class="d-flex align-items-center gap-3 mt-3 mt-lg-0">
            <!-- SHOPPING CART & RETURNS: ONLY SHOWN ON CUSTOMER SHOPPING SIDE (Hidden in Admin Console) -->
            @if (!isAdminRoute()) {
              <!-- Orders Quick Link (Amazon style: Returns & Orders) -->
              @if (authService.isAuthenticated()) {
                <a routerLink="/orders" class="d-none d-md-flex flex-column text-decoration-none px-2 py-1 rounded-2 text-white-50 hover-light">
                  <span style="font-size: 0.72rem; color: #94a3b8;">Returns</span>
                  <span class="fw-bold text-white small">&amp; Orders</span>
                </a>
              }

              <!-- Shopping Cart Button with count & total -->
              <a routerLink="/cart" class="btn btn-glass d-flex align-items-center gap-2 px-3 py-2 position-relative">
                <div class="position-relative">
                  <i class="bi bi-cart3 fs-5 text-warning"></i>
                  @if (cartService.itemCount() > 0) {
                    <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill" 
                          style="background: #ff3f6c; font-size: 0.7rem; padding: 0.25em 0.55em;">
                      {{ cartService.itemCount() }}
                    </span>
                  }
                </div>
                <div class="d-none d-sm-flex flex-column align-items-start" style="line-height: 1;">
                  <span class="text-muted" style="font-size: 0.7rem;">Cart</span>
                  <span class="fw-bold text-white small">\${{ cartService.totalAmount().toFixed(2) }}</span>
                </div>
              </a>
            }

            <!-- User Authentication Dropdown -->
            @if (authService.isAuthenticated()) {
              <div class="dropdown">
                <button class="btn btn-glass dropdown-toggle d-flex align-items-center gap-2 py-2" type="button" id="userMenu" data-bs-toggle="dropdown" aria-expanded="false">
                  <div class="rounded-circle d-flex align-items-center justify-content-center text-white"
                       [class.bg-danger]="isAdminRoute()"
                       [class.bg-primary]="!isAdminRoute()"
                       style="width: 28px; height: 28px; font-size: 0.8rem; font-weight: bold;">
                    {{ (authService.currentUser()?.email || 'U')[0].toUpperCase() }}
                  </div>
                  <div class="d-none d-sm-flex flex-column align-items-start text-start" style="line-height: 1.1;">
                    <span class="text-muted" style="font-size: 0.68rem;">{{ isAdminRoute() ? 'Admin Operator' : 'Hello, Signed In' }}</span>
                    <span class="fw-bold text-white small text-truncate" style="max-width: 110px;">{{ authService.currentUser()?.email?.split('@')?.[0] }}</span>
                  </div>
                </button>
                <ul class="dropdown-menu dropdown-menu-dark dropdown-menu-end glass-panel border p-2 mt-2 shadow-lg" aria-labelledby="userMenu">
                  <li class="px-3 py-2 border-bottom border-secondary mb-1">
                    <div class="fw-bold text-white small">{{ authService.currentUser()?.email }}</div>
                    <div class="text-muted font-monospace" style="font-size: 0.7rem;">
                      {{ authService.userRoles().join(', ') }}
                    </div>
                  </li>
                  @if (authService.isAdmin() && !isAdminRoute()) {
                    <li>
                      <a routerLink="/admin" class="dropdown-item rounded-2 py-2 d-flex align-items-center gap-2 text-danger fw-bold">
                        <i class="bi bi-shield-lock"></i> Go to Admin Portal
                      </a>
                    </li>
                  }
                  <li>
                    <a routerLink="/catalog" class="dropdown-item rounded-2 py-2 d-flex align-items-center gap-2 text-white-50">
                      <i class="bi bi-shop"></i> Storefront Products
                    </a>
                  </li>
                  <li>
                    <a routerLink="/orders" class="dropdown-item rounded-2 py-2 d-flex align-items-center gap-2 text-white-50">
                      <i class="bi bi-box2"></i> My Order Shipments
                    </a>
                  </li>
                  <li class="border-top border-secondary mt-1 pt-1">
                    <button class="dropdown-item text-danger rounded-2 py-2 d-flex align-items-center gap-2" (click)="logout()">
                      <i class="bi bi-box-arrow-right"></i> Sign Out
                    </button>
                  </li>
                </ul>
              </div>
            } @else {
              <div class="d-flex align-items-center gap-2">
                <a routerLink="/login" class="btn btn-glass px-3 py-2 text-white">Sign In</a>
                <a routerLink="/register" class="btn btn-amazon-primary px-3 py-2">Join Free</a>
              </div>
            }
          </div>
        </div>
      </div>
    </nav>
    }
  `,
  styles: [`
    .active-nav {
      background: rgba(255, 255, 255, 0.08) !important;
      color: #ffffff !important;
      font-weight: 600;
    }
    .hover-light:hover span {
      color: #ffffff !important;
    }
  `]
})
export class NavbarComponent {
  authService = inject(AuthService);
  cartService = inject(CartService);
  private router = inject(Router);

  currentUrl = signal<string>(this.router.url);
  isAdminRoute = computed(() => this.currentUrl().startsWith('/admin'));

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.currentUrl.set(event.urlAfterRedirects || event.url);
    });
  }

  logout(): void {
    this.authService.logout();
    this.cartService.resetLocalState();
    this.router.navigate(['/login']);
  }
}
