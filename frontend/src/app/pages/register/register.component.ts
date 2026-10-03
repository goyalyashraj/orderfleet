import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="container py-5">
      <div class="row justify-content-center">
        <div class="col-md-7 col-lg-6">
          <div class="glass-panel p-4 p-md-5">
            <div class="text-center mb-4">
              <div class="d-inline-flex p-3 rounded-circle mb-3" style="background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3);">
                <i class="bi bi-person-plus-fill fs-2 text-success"></i>
              </div>
              <h2 class="fw-bold text-white mb-1">Create an Account</h2>
              <p class="text-muted small">Join OrderFleet to experience microservices-driven ordering</p>
            </div>

            @if (errorMessage()) {
              <div class="alert alert-danger glass-panel border-danger text-danger py-2 px-3 small d-flex align-items-center gap-2 mb-3">
                <i class="bi bi-exclamation-triangle-fill"></i>
                <span>{{ errorMessage() }}</span>
              </div>
            }

            <form (ngSubmit)="onSubmit()">
              <div class="row g-3 mb-3">
                <div class="col-sm-6">
                  <label class="form-label text-muted small fw-semibold">First Name</label>
                  <input type="text" class="form-control" [(ngModel)]="firstName" name="firstName" required placeholder="John">
                </div>
                <div class="col-sm-6">
                  <label class="form-label text-muted small fw-semibold">Last Name</label>
                  <input type="text" class="form-control" [(ngModel)]="lastName" name="lastName" required placeholder="Doe">
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label text-muted small fw-semibold">Email Address</label>
                <input type="email" class="form-control" [(ngModel)]="email" name="email" required placeholder="john.doe@example.com">
              </div>

              <div class="mb-3">
                <label class="form-label text-muted small fw-semibold">Phone Number</label>
                <input type="tel" class="form-control" [(ngModel)]="phone" name="phone" placeholder="+1234567890">
              </div>

              <div class="mb-3">
                <label class="form-label text-muted small fw-semibold">Account Role</label>
                <select class="form-select" [(ngModel)]="role" name="role">
                  <option value="ROLE_CUSTOMER">Customer (Browse, Order & Track)</option>
                  <option value="ROLE_DELIVERY_PARTNER">Delivery Partner (Accept & Fulfill Shipments)</option>
                </select>
              </div>

              <div class="mb-4">
                <label class="form-label text-muted small fw-semibold">Password</label>
                <input type="password" class="form-control" [(ngModel)]="password" name="password" required placeholder="Minimum 8 characters">
              </div>

              <button type="submit" class="btn btn-gradient-primary w-100 py-2 d-flex align-items-center justify-content-center gap-2" [disabled]="loading()">
                @if (loading()) {
                  <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  <span>Registering...</span>
                } @else {
                  <span>Create Account</span>
                  <i class="bi bi-arrow-right"></i>
                }
              </button>
            </form>

            <div class="text-center mt-4">
              <span class="text-muted small">Already have an account? </span>
              <a routerLink="/login" class="text-decoration-none fw-semibold" style="color: #818cf8;">Sign In</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  firstName = '';
  lastName = '';
  email = '';
  phone = '';
  role = 'ROLE_CUSTOMER';
  password = '';

  loading = signal(false);
  errorMessage = signal<string | null>(null);

  onSubmit(): void {
    if (!this.firstName || !this.lastName || !this.email || !this.password) {
      this.errorMessage.set('Please fill out all required fields.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService.register({
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      phone: this.phone,
      role: this.role,
      password: this.password
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/catalog']);
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err.error?.message || 'Registration failed. Please check the inputs.';
        this.errorMessage.set(msg);
      }
    });
  }
}
