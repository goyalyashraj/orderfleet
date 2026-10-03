import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/auth.model';
import { Category, Product } from '../models/catalog.model';

export interface CreateProductDto {
  sku: string;
  title: string;
  description: string;
  price: number;
  categoryId: number;
  initialStock: number;
}

export interface InventoryDetail {
  id: number;
  productId: number;
  availableQuantity: number;
  reservedQuantity: number;
  totalQuantity: number;
  version: number;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class CatalogService {
  private readonly apiUrl = environment.apiGatewayUrl;

  constructor(private http: HttpClient) {}

  getProducts(): Observable<ApiResponse<Product[]>> {
    return this.http.get<ApiResponse<Product[]>>(`${this.apiUrl}/products`);
  }

  getProductById(id: number): Observable<ApiResponse<Product>> {
    return this.http.get<ApiResponse<Product>>(`${this.apiUrl}/products/${id}`);
  }

  getCategories(): Observable<ApiResponse<Category[]>> {
    return this.http.get<ApiResponse<Category[]>>(`${this.apiUrl}/categories`);
  }

  createProduct(request: CreateProductDto): Observable<ApiResponse<Product>> {
    return this.http.post<ApiResponse<Product>>(`${this.apiUrl}/products`, request);
  }

  deleteProduct(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/products/${id}`);
  }

  updateStock(productId: number, quantityDelta: number): Observable<ApiResponse<InventoryDetail>> {
    return this.http.patch<ApiResponse<InventoryDetail>>(`${this.apiUrl}/inventory/stock`, {
      productId,
      quantityDelta
    });
  }

  getInventory(productId: number): Observable<ApiResponse<InventoryDetail>> {
    return this.http.get<ApiResponse<InventoryDetail>>(`${this.apiUrl}/inventory/${productId}`);
  }
}
