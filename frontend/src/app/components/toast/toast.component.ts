import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ToastService, Toast } from '../../services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="toast-wrapper position-fixed top-0 end-0 p-3" style="z-index: 9999; max-width: 400px; width: 100%;">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast-item glass-panel border shadow-lg p-3 mb-2 d-flex align-items-start gap-3"
             [ngClass]="getToastBorderClass(toast.type)">
          <!-- Icon -->
          <div class="toast-icon flex-shrink-0 mt-1">
            @switch (toast.type) {
              @case ('success') {
                <i class="bi bi-check-circle-fill text-success fs-5"></i>
              }
              @case ('error') {
                <i class="bi bi-x-circle-fill text-danger fs-5"></i>
              }
              @case ('warning') {
                <i class="bi bi-exclamation-triangle-fill text-warning fs-5"></i>
              }
              @default {
                <i class="bi bi-info-circle-fill text-info fs-5"></i>
              }
            }
          </div>

          <!-- Content -->
          <div class="flex-grow-1">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <strong class="text-white small fw-bold">{{ toast.title }}</strong>
              <button type="button" class="btn-close btn-close-white small p-1" (click)="toastService.remove(toast.id)"></button>
            </div>
            <div class="text-muted small" style="line-height: 1.3;">{{ toast.message }}</div>
            
            @if (toast.actionText && toast.actionUrl) {
              <div class="mt-2">
                <a [routerLink]="toast.actionUrl" class="btn btn-sm btn-gradient-primary py-1 px-2 text-decoration-none" 
                   style="font-size: 0.75rem;"
                   (click)="toastService.remove(toast.id)">
                  {{ toast.actionText }} <i class="bi bi-arrow-right"></i>
                </a>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-item {
      animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      background: rgba(17, 24, 39, 0.95) !important;
      backdrop-filter: blur(12px);
      border-radius: 12px;
    }

    @keyframes slideInRight {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .border-toast-success {
      border-left: 4px solid #10b981 !important;
    }
    .border-toast-error {
      border-left: 4px solid #ef4444 !important;
    }
    .border-toast-warning {
      border-left: 4px solid #f59e0b !important;
    }
    .border-toast-info {
      border-left: 4px solid #6366f1 !important;
    }
  `]
})
export class ToastComponent {
  toastService = inject(ToastService);

  getToastBorderClass(type: string): string {
    switch (type) {
      case 'success': return 'border-toast-success';
      case 'error': return 'border-toast-error';
      case 'warning': return 'border-toast-warning';
      default: return 'border-toast-info';
    }
  }
}
