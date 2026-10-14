export interface ProductVariant {
  _id: string;
  sku: string;
  size?: string;
  color?: string;
  price: number;
  stock: number;
  lowStockAt: number;
}

export interface ProductImage {
  _id?: string;
  url: string;
  altText?: string;
  sortOrder: number;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  shortDesc?: string;
  categoryId: string;
  brandId?: string | null;
  basePrice: number;
  salePrice?: number | null;
  sku: string;
  ageRange?: string;
  material?: string;
  safetyCerts: string[];
  isPublished: boolean;
  isFeatured: boolean;
  variants: ProductVariant[];
  images: ProductImage[];
  // Timestamps
  createdAt: string;
  updatedAt: string;
}