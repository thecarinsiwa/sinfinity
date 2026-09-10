/** Aligné API Nest catalogue (product-brands, categories, products, units). */

export type ProductBrand = {
  id: string;
  organizationId: string;
  name: string;
  logoUrl: string | null;
  website: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateProductBrandInput = {
  name: string;
  logoUrl?: string | null;
  website?: string | null;
  organizationId?: string;
};

export type UpdateProductBrandInput = Partial<CreateProductBrandInput>;

export type ProductCategory = {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  parentId: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type ProductCategoryTreeNode = {
  id: string;
  code: string;
  name: string;
  sortOrder: number;
  children: ProductCategoryTreeNode[];
};

export type CreateProductCategoryInput = {
  code: string;
  name: string;
  parentId?: string | null;
  sortOrder?: number;
  organizationId?: string;
};

export type UpdateProductCategoryInput = Partial<CreateProductCategoryInput>;

export type ServiceCategory = {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateServiceCategoryInput = {
  code: string;
  name: string;
  organizationId?: string;
};

export type UpdateServiceCategoryInput = Partial<CreateServiceCategoryInput>;

/** Unités catalogue (lecture seule API). */
export type ProductUnit = {
  id: string;
  code: string;
  name: string;
  symbol: string | null;
  unitId: string | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * Produit — champs utiles Admin lite.
 * Specs / images restent côté Web.
 */
export type Product = {
  id: string;
  organizationId: string;
  sku: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  subcategoryId: string | null;
  brandId: string | null;
  modelId: string | null;
  unitId: string | null;
  /** Decimal string */
  basePrice: string;
  /** Decimal string */
  costPrice: string | null;
  currencyId: string | null;
  isSerialized: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateProductLiteInput = {
  sku: string;
  name: string;
  brandId?: string | null;
  categoryId?: string | null;
  unitId?: string | null;
  isActive?: boolean;
};

export type UpdateProductLiteInput = Partial<CreateProductLiteInput>;

export type CatalogueNavId =
  | "brands"
  | "categories"
  | "serviceCategories"
  | "products";

export type CatalogueNavItem = {
  id: CatalogueNavId;
  href: string;
};

export const CATALOGUE_NAV_ITEMS: CatalogueNavItem[] = [
  { id: "brands", href: "/catalogue/marques" },
  { id: "categories", href: "/catalogue/categories" },
  { id: "serviceCategories", href: "/catalogue/categories-services" },
  { id: "products", href: "/catalogue/produits" },
];
