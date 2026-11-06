export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

export type IconListItem = {
  id: string;
  name: string;
  slug: string;
  url: string;
  format: string;
  sizeBytes: number | null;
  tags: string[];
  isPremium: boolean;
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  createdAt: string;
};

export type IconsQuery = {
  category?: string;
  q?: string;
  page?: number;
  limit?: number;
};

export type ListIconsResponse = {
  data: IconListItem[];
  meta: { total: number; page: number; limit: number };
};

export type CategoriesResponse = { data: Category[] };