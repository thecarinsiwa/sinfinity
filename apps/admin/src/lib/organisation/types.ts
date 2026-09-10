/** Aligné sur OrganizationResponseDto / UpdateOrganizationDto (API Nest). */

export type Organization = {
  id: string;
  name: string;
  legalName: string | null;
  taxId: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  logoUrl: string | null;
  defaultCurrencyId: string | null;
  countryId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UpdateOrganizationInput = {
  name?: string;
  legalName?: string | null;
  taxId?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  logoUrl?: string | null;
  defaultCurrencyId?: string | null;
  countryId?: string | null;
  isActive?: boolean;
};

export const BRANCH_TYPES = ["office", "warehouse", "mixed"] as const;
export type BranchType = (typeof BRANCH_TYPES)[number];

/** Aligné sur BranchResponseDto (API Nest). */
export type Branch = {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  type: BranchType;
  address: string | null;
  cityId: string | null;
  phone: string | null;
  managerUserId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateBranchInput = {
  organizationId?: string;
  code: string;
  name: string;
  type?: BranchType;
  address?: string | null;
  cityId?: string | null;
  phone?: string | null;
  managerUserId?: string | null;
  isActive?: boolean;
};

export type UpdateBranchInput = Partial<CreateBranchInput>;

export type ListBranchesQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  type?: BranchType;
  isActive?: boolean;
  organizationId?: string;
};

export const BRANCH_TYPE_LABELS: Record<BranchType, string> = {
  office: "Bureau",
  warehouse: "Entrepôt",
  mixed: "Mixte",
};
