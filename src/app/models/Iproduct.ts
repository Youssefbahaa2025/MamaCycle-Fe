// src/app/models/Iproduct.ts
export interface ProductImage {
  id: number;
  url: string;
  is_primary: boolean;
}

export interface IProduct {
  id: number;
  name: string;
  price: string | number;
  description: string;
  type: 'sale' | 'rent';
  status: 'pending' | 'approved' | 'rejected';
  image: string;
  images?: ProductImage[];
  seller_id: number;
  category_id?: number;
  category_name?: string;
  condition?: string;
  has_multiple_images?: boolean;
  created_at?: string;
}