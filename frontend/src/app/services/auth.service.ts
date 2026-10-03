import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse, AuthResponse, LoginRequest, RegisterRequest, User } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = `${environment.apiGatewayUrl}/auth`;
  private readonly TOKEN_KEY = 'orderfleet_token';
  private readonly USER_KEY = 'orderfleet_user';

  // Modern Angular Signal for reactive user state
  private currentUserSignal = signal<AuthResponse | null>(this.getStoredUser());
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.currentUserSignal());
  readonly userRoles = computed(() => this.currentUserSignal()?.roles || []);
  readonly isCustomer = computed(() => this.userRoles().includes('ROLE_CUSTOMER'));
  readonly isRider = computed(() => this.userRoles().includes('ROLE_DELIVERY_PARTNER'));
  readonly isAdmin = computed(() => this.userRoles().includes('ROLE_ADMIN'));

  constructor(private http: HttpClient) {}

  login(credentials: LoginRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.setSession(response.data);
        }
      })
    );
  }

  register(userData: RegisterRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/register`, userData).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.setSession(response.data);
        }
      })
    );
  }

  getProfile(): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/me`);
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSignal.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private setSession(authData: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, authData.accessToken);
    localStorage.setItem(this.USER_KEY, JSON.stringify(authData));
    this.currentUserSignal.set(authData);
  }

  private getStoredUser(): AuthResponse | null {
    const userJson = localStorage.getItem(this.USER_KEY);
    if (!userJson) return null;
    try {
      return JSON.parse(userJson);
    } catch {
      return null;
    }
  }
}
