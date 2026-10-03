export interface DeliveryLog {
  status: string;
  note: string;
  timestamp: string;
}

export interface Delivery {
  id: number;
  orderId: number;
  deliveryPartnerId: number | null;
  customerUserId: number;
  addressId: number;
  pickupLocation: string;
  deliveryAddressSnapshot: string;
  status: 'PENDING' | 'ASSIGNED' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
  assignedAt: string | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  logs: DeliveryLog[];
}

export interface Address {
  id: number;
  userId: number;
  recipientName: string;
  phoneNumber: string;
  streetAddress: string;
  city: string;
  state: string;
  postalCode: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
}

export interface DeliveryPartner {
  id: number;
  userId: number;
  fullName: string;
  phone: string;
  vehicleType: string;
  status: 'AVAILABLE' | 'BUSY' | 'OFFLINE';
  activeOrdersCount: number;
  currentLatitude?: number;
  currentLongitude?: number;
}
