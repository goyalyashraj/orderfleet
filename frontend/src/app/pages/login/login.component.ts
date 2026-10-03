import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="container py-5">
      <div class="row justify-content-center">
        <div class="col-md-6 col-lg-5">
          <div class="glass-panel p-4 p-md-5">
            <div class="text-center mb-4">
              <div class="d-inline-flex p-3 rounded-circle mb-3" style="background: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.3);">
                <i class="bi bi-shield-lock-fill fs-2" style="color: #818cf8;"></i>
              </div>
              <h2 class="fw-bold text-white mb-1">Welcome Back</h2>
              <p class="text-muted small">Sign in to access your cart, orders, and delivery fleet</p>
            </div>

            <!-- Error Banner -->
            @if (errorMessage()) {
              <div class="alert alert-danger glass-panel border-danger text-danger py-2 px-3 small d-flex align-items-center gap-2 mb-3">
                <i class="bi bi-exclamation-triangle-fill"></i>
                <span>{{ errorMessage() }}</span>
              </div>
            }

            <form (ngSubmit)="onSubmit()">
              <div class="mb-3">
                <label class="form-label text-muted small fw-semibold">Email Address</label>
                <div class="input-group">
                  <span class="input-group-text bg-dark border-secondary text-muted"><i class="bi bi-envelope"></i></span>
                  <input type="email" class="form-control" [(ngModel)]="email" name="email" required placeholder="alice@example.com">
                </div>
              </div>

              <div class="mb-4">
                <label class="form-label text-muted small fw-semibold">Password</label>
                <div class="input-group">
                  <span class="input-group-text bg-dark border-secondary text-muted"><i class="bi bi-key"></i></span>
                  <input type="password" class="form-control" [(ngModel)]="password" name="password" required placeholder="••••••••">
                </div>
              </div>

              <button type="submit" class="btn btn-gradient-primary w-100 py-2 d-flex align-items-center justify-content-center gap-2" [disabled]="loading()">
                @if (loading()) {
                  <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  <span>Signing In...</span>
                } @else {
                  <span>Sign In</span>
                  <i class="bi bi-arrow-right"></i>
                }
              </button>
            </form>

            <!-- Quick Demo Credentials -->
            <div class="mt-4 pt-3 border-top border-secondary">
              <div class="text-muted small text-center mb-2 fw-semibold">Quick Test Profiles</div>
              <div class="d-flex gap-2">
                <button type="button" class="btn btn-glass btn-sm flex-fill" (click)="fillCustomer()">
                  <i class="bi bi-person-fill text-primary"></i> Customer Alice
                </button>
                <button type="button" class="btn btn-glass btn-sm flex-fill" (click)="fillRider()">
                  <i class="bi bi-bicycle text-warning"></i> Rider Bob
                </button>
                <button type="button" class="btn btn-glass btn-sm flex-fill" (click)="fillAdmin()">
                  <i class="bi bi-shield-lock-fill text-danger"></i> Admin
                </button>
              </div>
            </div>

            <div class="text-center mt-4">
              <span class="text-muted small">Don't have an account? </span>
              <a routerLink="/register" class="text-decoration-none fw-semibold" style="color: #818cf8;">Create Account</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  private authService = inject(AuthService);
  private cartService = inject(CartService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  email = '';
  password = '';
  loading = signal(false);
  errorMessage = signal<string | null>(null);

  fillCustomer(): void {
    this.email = 'customer.alice@orderfleet.com';
    this.password = 'StrongPassword123';
  }

  fillRider(): void {
    this.email = 'rider.bob@orderfleet.com';
    this.password = 'StrongPassword123';
  }

  fillAdmin(): void {
    this.email = 'admin@orderfleet.com';
    this.password = 'AdminPassword123!';
  }

  onSubmit(): void {
    if (!this.email || !this.password) {
      this.errorMessage.set('Please provide both email and password.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        this.loading.set(false);
        this.cartService.refreshCart().subscribe({ error: () => {} });
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/catalog';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err.error?.message || 'Authentication failed. Please check credentials.';
        this.errorMessage.set(msg);
      }
    });
  }
}
