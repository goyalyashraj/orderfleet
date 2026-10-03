import { Component, OnInit, inject, signal } from '@angular/core';
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
    <div class="neo-login-viewport py-4 py-md-5">
      <!-- Ambient Background Glows -->
      <div class="neo-ambient-orb orb-1"></div>
      <div class="neo-ambient-orb orb-2"></div>

      <div class="container position-relative" style="z-index: 2;">
        <div class="row justify-content-center">
          <div class="col-11 col-sm-9 col-md-7 col-lg-5 col-xl-4">
            
            <!-- Neomorphic 3D Card (Reference from Pinterest) -->
            <div class="neo-card p-4 p-md-5">
              
              <!-- 3D Glowing Metallic/Glass Helix Logo Bubble -->
              <div class="text-center mb-3">
                <div class="neo-logo-bubble">
                  <svg width="44" height="44" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" class="neo-logo-svg">
                    <defs>
                      <linearGradient id="flameGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#38bdf8" />
                        <stop offset="40%" stop-color="#3b82f6" />
                        <stop offset="100%" stop-color="#1d4ed8" />
                      </linearGradient>
                      <linearGradient id="innerGlow" x1="100%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.8" />
                        <stop offset="100%" stop-color="#60a5fa" stop-opacity="0.2" />
                      </linearGradient>
                      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#2563eb" flood-opacity="0.6"/>
                      </filter>
                    </defs>
                    <!-- 3D Curved Flame / Swirl Shape -->
                    <path d="M24 4C24 4 33 13 33 22C33 28.5 28 34 22 34C20.5 34 19 33.6 17.7 32.8C16.8 32.2 16.5 30.9 17.2 30.1C17.8 29.3 19 29.2 19.8 29.8C20.5 30.3 21.3 30.5 22.2 30.5C26 30.5 29.5 27.2 29.5 22.2C29.5 15.5 23.5 9.5 23.5 9.5C23.5 9.5 15 17 15 26C15 32.6 20.4 38 27 38C34.7 38 41 31.7 41 24C41 14.5 32 6.5 24 4Z" 
                          fill="url(#flameGrad)" filter="url(#glow)"/>
                    <path d="M22 14C22 14 18 19 18 24C18 27.5 20.8 30.2 24.2 30.2C21 28 20.5 24 22 21C22.6 19.8 23 18.2 23 17C23 15.8 22.6 14.8 22 14Z" 
                          fill="url(#innerGlow)"/>
                  </svg>
                </div>

                <h3 class="fw-bold text-white mb-1 tracking-tight">Welcome Back</h3>
                <p class="text-white-50 small mb-0">Sign in to continue</p>
              </div>

              <!-- Error Message Alert -->
              @if (errorMessage()) {
                <div class="neo-alert text-danger py-2 px-3 small d-flex align-items-center gap-2 mb-3">
                  <i class="bi bi-exclamation-circle-fill"></i>
                  <span>{{ errorMessage() }}</span>
                </div>
              }

              <!-- Neomorphic Form -->
              <form (ngSubmit)="onSubmit()">
                <!-- Username / Email Field -->
                <div class="mb-3">
                  <div class="neo-input-wrapper">
                    <span class="neo-input-icon"><i class="bi bi-person"></i></span>
                    <input type="email" class="neo-input" [(ngModel)]="email" name="email" required placeholder="Username or Email" autocomplete="email">
                  </div>
                </div>

                <!-- Password Field with Show/Hide Toggle -->
                <div class="mb-3">
                  <div class="neo-input-wrapper">
                    <span class="neo-input-icon"><i class="bi bi-lock"></i></span>
                    <input [type]="showPassword() ? 'text' : 'password'" class="neo-input" [(ngModel)]="password" name="password" required placeholder="Password" autocomplete="current-password">
                    <button type="button" class="btn btn-link neo-eye-btn p-0" (click)="togglePassword()">
                      <i class="bi" [class.bi-eye]="!showPassword()" [class.bi-eye-slash]="showPassword()"></i>
                    </button>
                  </div>
                </div>

                <!-- Remember Me & Forgot Password Options -->
                <div class="d-flex justify-content-between align-items-center mb-4 px-1" style="font-size: 0.82rem;">
                  <div class="form-check m-0 d-flex align-items-center gap-2">
                    <input class="form-check-input neo-checkbox" type="checkbox" id="rememberMe" [(ngModel)]="rememberMe" name="rememberMe">
                    <label class="form-check-label text-white-50" for="rememberMe" style="cursor: pointer;">Remember Me</label>
                  </div>
                  <a href="javascript:void(0)" class="text-decoration-none neo-link" (click)="onForgotPassword()">Forgot Password?</a>
                </div>

                <!-- Gradient 3D Action Button (Matches Screenshot: Login with Arrow Button) -->
                <button type="submit" class="neo-btn-primary" [disabled]="loading()">
                  @if (loading()) {
                    <span class="spinner-border spinner-border-sm me-2"></span>
                    <span>Signing In...</span>
                  } @else {
                    <span class="me-auto ms-4">Login</span>
                    <span class="neo-btn-circle-arrow">
                      <i class="bi bi-arrow-right"></i>
                    </span>
                  }
                </button>
              </form>

              <!-- Subtle Divider (OR CONTINUE WITH) -->
              <div class="neo-divider my-4">
                <span class="neo-divider-text">OR CONTINUE WITH</span>
              </div>

              <!-- Social / Demo Quick Profile Buttons -->
              <div class="d-flex justify-content-center gap-3 mb-4">
                <button type="button" class="neo-social-btn" title="Quick Login as Customer Alice" (click)="fillCustomer()">
                  <i class="bi bi-person-fill text-info"></i>
                </button>
                <button type="button" class="neo-social-btn" title="Quick Login as Courier Bob" (click)="fillRider()">
                  <i class="bi bi-bicycle text-success"></i>
                </button>
                <button type="button" class="neo-social-btn" title="Quick Login as Administrator" (click)="fillAdmin()">
                  <i class="bi bi-shield-lock-fill text-danger"></i>
                </button>
              </div>

              <!-- Quick Login Pill Chips for Accessibility -->
              <div class="d-flex flex-wrap justify-content-center gap-2 mb-3">
                <button type="button" class="neo-pill-badge" (click)="fillCustomer()">
                  <i class="bi bi-person-fill me-1 text-info"></i> Customer
                </button>
                <button type="button" class="neo-pill-badge" (click)="fillRider()">
                  <i class="bi bi-bicycle me-1 text-success"></i> Courier
                </button>
                <button type="button" class="neo-pill-badge active" (click)="fillAdmin()">
                  <i class="bi bi-shield-fill-check me-1 text-danger"></i> Admin (Direct)
                </button>
              </div>

              <!-- Footer Registration Link -->
              <div class="text-center pt-2">
                <span class="text-white-50 small">Don't have an account? </span>
                <a routerLink="/register" class="neo-link fw-semibold small">Sign Up</a>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .neo-login-viewport {
      min-height: calc(100vh - 140px);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
    }

    /* Ambient Orbs matching the screenshot soft glow */
    .neo-ambient-orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      pointer-events: none;
      z-index: 1;
      opacity: 0.25;
    }
    .orb-1 {
      width: 320px;
      height: 320px;
      background: #3b82f6;
      top: 10%;
      left: 15%;
    }
    .orb-2 {
      width: 280px;
      height: 280px;
      background: #06b6d4;
      bottom: 10%;
      right: 15%;
    }

    /* Neomorphic 3D Card */
    .neo-card {
      background: linear-gradient(145deg, #131a29, #0a0f1a);
      border-radius: 28px;
      box-shadow: 18px 18px 45px rgba(0, 0, 0, 0.65), -12px -12px 35px rgba(255, 255, 255, 0.025);
      border: 1px solid rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(20px);
      position: relative;
    }

    /* Neomorphic Logo Bubble */
    .neo-logo-bubble {
      width: 82px;
      height: 82px;
      border-radius: 50%;
      background: linear-gradient(145deg, #172134, #0b111e);
      box-shadow: 8px 8px 18px rgba(0, 0, 0, 0.5), -6px -6px 14px rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(56, 189, 248, 0.25);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 0.75rem;
      position: relative;
    }

    .neo-logo-svg {
      transform: scale(1.1);
      transition: transform 0.3s ease;
    }
    .neo-logo-bubble:hover .neo-logo-svg {
      transform: scale(1.2) rotate(5deg);
    }

    /* Neomorphic Inset Inputs */
    .neo-input-wrapper {
      background: #090e18;
      border-radius: 16px;
      box-shadow: inset 4px 4px 8px rgba(0, 0, 0, 0.6), inset -2px -2px 6px rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.06);
      padding: 0.35rem 0.9rem;
      display: flex;
      align-items: center;
      transition: all 0.25s ease;
    }
    .neo-input-wrapper:focus-within {
      border-color: rgba(59, 130, 246, 0.6);
      box-shadow: inset 4px 4px 8px rgba(0, 0, 0, 0.6), 0 0 16px rgba(59, 130, 246, 0.3);
    }

    .neo-input-icon {
      color: #64748b;
      font-size: 1.15rem;
      margin-right: 0.5rem;
      display: flex;
      align-items: center;
    }

    .neo-input {
      background: transparent;
      border: none;
      color: #ffffff;
      padding: 0.65rem 0.25rem;
      width: 100%;
      outline: none;
      font-size: 0.95rem;
    }
    .neo-input::placeholder {
      color: #475569;
      font-size: 0.9rem;
    }

    .neo-eye-btn {
      color: #64748b;
      font-size: 1.1rem;
      transition: color 0.2s ease;
    }
    .neo-eye-btn:hover {
      color: #38bdf8;
    }

    /* Checkbox & Links */
    .neo-checkbox {
      background-color: #090e18;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 4px;
      cursor: pointer;
    }
    .neo-checkbox:checked {
      background-color: #3b82f6;
      border-color: #3b82f6;
    }
    .neo-link {
      color: #38bdf8;
      transition: all 0.2s ease;
    }
    .neo-link:hover {
      color: #93c5fd;
      text-decoration: underline !important;
    }

    /* Primary Action Button (Matches Screenshot) */
    .neo-btn-primary {
      background: linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%);
      border: none;
      border-radius: 26px;
      color: #ffffff;
      font-weight: 700;
      font-size: 1rem;
      padding: 0.65rem 0.85rem;
      display: flex;
      align-items: center;
      width: 100%;
      box-shadow: 0 10px 25px rgba(37, 99, 235, 0.45);
      transition: all 0.25s ease;
      letter-spacing: 0.02em;
    }
    .neo-btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 14px 30px rgba(37, 99, 235, 0.65);
      background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%);
    }

    .neo-btn-circle-arrow {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.18);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      transition: transform 0.2s ease;
    }
    .neo-btn-primary:hover .neo-btn-circle-arrow {
      transform: translateX(3px);
      background: rgba(255, 255, 255, 0.28);
    }

    /* Divider */
    .neo-divider {
      display: flex;
      align-items: center;
      text-align: center;
    }
    .neo-divider::before, .neo-divider::after {
      content: '';
      flex: 1;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .neo-divider-text {
      padding: 0 0.85rem;
      font-size: 0.7rem;
      color: #64748b;
      font-weight: 600;
      letter-spacing: 0.08em;
    }

    /* Neomorphic Social Round Buttons */
    .neo-social-btn {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(145deg, #151e2e, #0c121e);
      box-shadow: 6px 6px 14px rgba(0, 0, 0, 0.45), -4px -4px 10px rgba(255, 255, 255, 0.025);
      border: 1px solid rgba(255, 255, 255, 0.08);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 1.15rem;
      transition: all 0.2s ease;
      cursor: pointer;
    }
    .neo-social-btn:hover {
      transform: translateY(-2px);
      box-shadow: 8px 8px 18px rgba(0, 0, 0, 0.6), 0 0 12px rgba(59, 130, 246, 0.3);
      border-color: rgba(59, 130, 246, 0.4);
    }

    .neo-pill-badge {
      background: #090e18;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 20px;
      padding: 0.25rem 0.75rem;
      color: #94a3b8;
      font-size: 0.76rem;
      font-weight: 600;
      transition: all 0.2s ease;
      cursor: pointer;
    }
    .neo-pill-badge:hover, .neo-pill-badge.active {
      color: #ffffff;
      border-color: rgba(59, 130, 246, 0.5);
      background: rgba(59, 130, 246, 0.12);
    }

    .neo-alert {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 12px;
    }
  `]
})
export class LoginComponent implements OnInit {
  private authService = inject(AuthService);
  private cartService = inject(CartService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  email = '';
  password = '';
  rememberMe = true;
  showPassword = signal(false);
  loading = signal(false);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    // If user is already logged in as Admin, redirect directly to /admin
    if (this.authService.isAuthenticated()) {
      if (this.authService.isAdmin()) {
        this.router.navigateByUrl('/admin');
      } else if (this.authService.isRider()) {
        this.router.navigateByUrl('/fleet');
      }
    }
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

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

  onForgotPassword(): void {
    alert('Password reset link has been dispatched to your email.');
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

        // REQUIREMENT: Admin login directly redirects to the admin portal!
        if (this.authService.isAdmin()) {
          this.router.navigateByUrl('/admin');
        } else if (this.authService.isRider()) {
          this.router.navigateByUrl('/fleet');
        } else {
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/catalog';
          this.router.navigateByUrl(returnUrl);
        }
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err.error?.message || 'Authentication failed. Please check credentials.';
        this.errorMessage.set(msg);
      }
    });
  }
}
