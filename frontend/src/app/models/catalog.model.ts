export interface Category {
  id: number;
  name: string;
  description: string;
}

export interface Product {
  id: number;
  sku: string;
  title: string;
  description: string;
  price: number;
  categoryId: number;
  categoryName: string;
  availableStock: number;
  active: boolean;
  createdAt?: string;
}
