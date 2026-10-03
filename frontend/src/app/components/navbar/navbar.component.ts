import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="navbar navbar-expand-lg navbar-dark glass-panel sticky-top mx-3 mt-3 mb-4 px-4 py-2 border">
      <div class="container-fluid p-0">
        <!-- Brand -->
        <a class="navbar-brand d-flex align-items-center gap-2 fw-bold fs-4 text-white" routerLink="/">
          <div class="d-flex align-items-center justify-content-center rounded-3 bg-primary text-white" 
               style="width: 38px; height: 38px; background: var(--primary-gradient) !important;">
            <i class="bi bi-box-seam-fill fs-5"></i>
          </div>
          <span>Order<span style="color: #818cf8;">Fleet</span></span>
          <span class="badge bg-dark border border-secondary text-secondary ms-1 fs-6 fw-normal px-2 py-1">Microservices</span>
        </a>

        <!-- Hamburger for Mobile -->
        <button class="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navContent">
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" id="navContent">
          <!-- Navigation Links -->
          <ul class="navbar-nav me-auto mb-2 mb-lg-0 ms-lg-4 gap-1">
            <li class="nav-item">
              <a class="nav-link text-white-50 px-3 py-2 rounded-2" routerLink="/catalog" routerLinkActive="active text-white bg-dark">
                <i class="bi bi-grid-fill me-1 text-primary"></i> Catalog
              </a>
            </li>
            @if (authService.isAuthenticated()) {
              <li class="nav-item">
                <a class="nav-link text-white-50 px-3 py-2 rounded-2" routerLink="/orders" routerLinkActive="active text-white bg-dark">
                  <i class="bi bi-receipt me-1 text-success"></i> My Orders
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link text-white-50 px-3 py-2 rounded-2" routerLink="/fleet" routerLinkActive="active text-white bg-dark">
                  <i class="bi bi-bicycle me-1 text-warning"></i> Fleet Console
                </a>
              </li>
            }
          </ul>

          <!-- Right Action Controls -->
          <div class="d-flex align-items-center gap-3">
            <!-- Cart Button -->
            <a routerLink="/cart" class="btn btn-glass position-relative d-flex align-items-center gap-2 px-3 py-2">
              <i class="bi bi-cart3 fs-5 text-indigo"></i>
              <span class="d-none d-md-inline">Cart</span>
              @if (cartService.itemCount() > 0) {
                <span class="badge rounded-pill bg-danger ms-1">
                  {{ cartService.itemCount() }}
                </span>
              }
            </a>

            <!-- Authentication State -->
            @if (authService.isAuthenticated()) {
              <div class="dropdown">
                <button class="btn btn-glass dropdown-toggle d-flex align-items-center gap-2" type="button" id="userMenu" data-bs-toggle="dropdown" aria-expanded="false">
                  <i class="bi bi-person-circle fs-5 text-primary"></i>
                  <span class="text-truncate d-none d-sm-inline" style="max-width: 140px;">{{ authService.currentUser()?.email }}</span>
                </button>
                <ul class="dropdown-menu dropdown-menu-dark dropdown-menu-end glass-panel border p-2 mt-2" aria-labelledby="userMenu">
                  <li class="px-3 py-2 border-bottom border-secondary mb-1">
                    <div class="fw-bold text-white small">{{ authService.currentUser()?.email }}</div>
                    <div class="text-muted" style="font-size: 0.75rem;">
                      {{ authService.userRoles().join(', ') }}
                    </div>
                  </li>
                  <li>
                    <button class="dropdown-item text-danger rounded-2 d-flex align-items-center gap-2" (click)="logout()">
                      <i class="bi bi-box-arrow-right"></i> Sign Out
                    </button>
                  </li>
                </ul>
              </div>
            } @else {
              <div class="d-flex gap-2">
                <a routerLink="/login" class="btn btn-glass px-3 py-2">Sign In</a>
                <a routerLink="/register" class="btn btn-gradient-primary px-3 py-2">Register</a>
              </div>
            }
          </div>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .nav-link.active {
      background: rgba(99, 102, 241, 0.15) !important;
      color: #ffffff !important;
      border: 1px solid rgba(99, 102, 241, 0.3);
    }
  `]
})
export class NavbarComponent {
  authService = inject(AuthService);
  cartService = inject(CartService);
  private router = inject(Router);

  logout(): void {
    this.authService.logout();
    this.cartService.resetLocalState();
    this.router.navigate(['/login']);
  }
}
