export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string | null;
  icon?: string;
  parentId?: string | null;
  sortOrder: number;
  isActive: boolean;
  // SEO
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string | null;
  // Timestamps
  createdAt: string;
  updatedAt: string;
}