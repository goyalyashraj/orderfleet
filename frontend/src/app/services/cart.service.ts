import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/auth.model';
import { Cart, AddToCartRequest } from '../models/order.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly apiUrl = `${environment.apiGatewayUrl}/cart`;

  private cartSignal = signal<Cart | null>(null);
  readonly cart = this.cartSignal.asReadonly();
  readonly itemCount = computed(() => this.cartSignal()?.totalItemCount || 0);
  readonly totalAmount = computed(() => this.cartSignal()?.totalAmount || 0);

  constructor(private http: HttpClient, private authService: AuthService) {
    if (this.authService.isAuthenticated()) {
      this.refreshCart().subscribe({ error: () => {} });
    }
  }

  refreshCart(): Observable<ApiResponse<Cart>> {
    return this.http.get<ApiResponse<Cart>>(this.apiUrl).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.cartSignal.set(res.data);
        }
      })
    );
  }

  addItem(productId: number, quantity: number = 1): Observable<ApiResponse<Cart>> {
    const payload: AddToCartRequest = { productId, quantity };
    return this.http.post<ApiResponse<Cart>>(`${this.apiUrl}/items`, payload).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.cartSignal.set(res.data);
        }
      })
    );
  }

  removeItem(productId: number): Observable<ApiResponse<Cart>> {
    return this.http.delete<ApiResponse<Cart>>(`${this.apiUrl}/items/${productId}`).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.cartSignal.set(res.data);
        }
      })
    );
  }

  clearCart(): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(this.apiUrl).pipe(
      tap(() => {
        this.cartSignal.set(null);
      })
    );
  }

  resetLocalState(): void {
    this.cartSignal.set(null);
  }
}
