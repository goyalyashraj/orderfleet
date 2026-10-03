import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/auth.model';
import { Address, Delivery, DeliveryPartner } from '../models/delivery.model';

@Injectable({
  providedIn: 'root'
})
export class DeliveryService {
  private readonly gatewayUrl = environment.apiGatewayUrl;

  constructor(private http: HttpClient) {}

  getDeliveryByOrderId(orderId: number): Observable<ApiResponse<Delivery>> {
    return this.http.get<ApiResponse<Delivery>>(`${this.gatewayUrl}/deliveries/order/${orderId}`);
  }

  getAddresses(): Observable<ApiResponse<Address[]>> {
    return this.http.get<ApiResponse<Address[]>>(`${this.gatewayUrl}/addresses`);
  }

  createAddress(address: Partial<Address>): Observable<ApiResponse<Address>> {
    return this.http.post<ApiResponse<Address>>(`${this.gatewayUrl}/addresses`, address);
  }

  getPartnerById(id: number): Observable<ApiResponse<DeliveryPartner>> {
    return this.http.get<ApiResponse<DeliveryPartner>>(`${this.gatewayUrl}/delivery-partners/${id}`);
  }

  updatePartnerStatus(id: number, status: string): Observable<ApiResponse<DeliveryPartner>> {
    return this.http.patch<ApiResponse<DeliveryPartner>>(`${this.gatewayUrl}/delivery-partners/${id}/status?status=${status}`, {});
  }

  updateDeliveryStatus(deliveryId: number, status: string, note?: string): Observable<ApiResponse<Delivery>> {
    const payload = { status, note: note || `Status changed to ${status}` };
    return this.http.patch<ApiResponse<Delivery>>(`${this.gatewayUrl}/deliveries/${deliveryId}/status`, payload);
  }
}
