import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  actionText?: string;
  actionUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  toasts = signal<Toast[]>([]);

  show(toast: Omit<Toast, 'id'>, durationMs: number = 3500): void {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { ...toast, id };
    
    this.toasts.update(current => [...current, newToast]);

    if (durationMs > 0) {
      setTimeout(() => {
        this.remove(id);
      }, durationMs);
    }
  }

  success(title: string, message: string, actionText?: string, actionUrl?: string): void {
    this.show({ type: 'success', title, message, actionText, actionUrl });
  }

  error(title: string, message: string): void {
    this.show({ type: 'error', title, message });
  }

  info(title: string, message: string): void {
    this.show({ type: 'info', title, message });
  }

  warning(title: string, message: string): void {
    this.show({ type: 'warning', title, message });
  }

  remove(id: string): void {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }
}
