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

export type IconDetail = {
  id: string;
  name: string;
  slug: string;
  url: string;
  svg: string | null; // premium icons ke liye null
  format: string;
  sizeBytes: number | null;
  tags: string[];
  isPremium: boolean;
  createdAt: string;
  updatedAt: string;
  category: Category;
};

export type RegistryItem = {
  name: string;
  title: string;
  type: "registry:icon";
  category: string;
  tags: string[];
  componentName: string;
  dependencies: string[];
  files: { path: string; content: string }[];
};