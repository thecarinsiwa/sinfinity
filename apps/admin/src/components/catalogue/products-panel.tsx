"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Can } from "@/components/auth/can";
import { useAuth } from "@/components/auth/auth-provider";
import { ProductFormModal } from "@/components/catalogue/product-form-modal";
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  Input,
  Modal,
  Pagination,
  Select,
  Spinner,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@/components/ui";
import { useToast } from "@/components/ui/toast";
import { ApiError, apiFetch, type PaginatedResponse } from "@/lib/api";
import type {
  Product,
  ProductBrand,
  ProductCategory,
  ProductUnit,
} from "@/lib/catalogue";

const PAGE_SIZE = 20;

export function ProductsPanel() {
  const t = useTranslations("catalogue");
  const tCommon = useTranslations("common");
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  const canWrite = hasPermission("catalog.write");

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [brandId, setBrandId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isActive, setIsActive] = useState("");

  const [brands, setBrands] = useState<ProductBrand[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [units, setUnits] = useState<ProductUnit[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const brandNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const b of brands) map.set(b.id, b.name);
    return map;
  }, [brands]);

  const categoryLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of categories) map.set(c.id, `${c.code} — ${c.name}`);
    return map;
  }, [categories]);

  const unitLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const u of units) map.set(u.id, u.code);
    return map;
  }, [units]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [brandsRes, catsRes, unitsRes] = await Promise.all([
          apiFetch<PaginatedResponse<ProductBrand>>(
            "/product-brands?page=1&pageSize=100",
          ),
          apiFetch<PaginatedResponse<ProductCategory>>(
            "/product-categories?page=1&pageSize=100",
          ),
          apiFetch<PaginatedResponse<ProductUnit>>(
            "/product-units?page=1&pageSize=100",
          ),
        ]);
        if (cancelled) return;
        setBrands(brandsRes.data);
        setCategories(catsRes.data);
        setUnits(unitsRes.data);
      } catch {
        if (!cancelled) {
          setBrands([]);
          setCategories([]);
          setUnits([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams();
      query.set("page", String(page));
      query.set("pageSize", String(PAGE_SIZE));
      if (search.trim()) query.set("search", search.trim());
      if (brandId) query.set("brandId", brandId);
      if (categoryId) query.set("categoryId", categoryId);
      if (isActive === "true" || isActive === "false") {
        query.set("isActive", isActive);
      }
      const result = await apiFetch<PaginatedResponse<Product>>(
        `/products?${query.toString()}`,
      );
      setItems(result.data);
      setTotal(result.meta.total);
    } catch (cause) {
      setItems([]);
      setTotal(0);
      setError(
        cause instanceof ApiError
          ? cause.message
          : t("products.loadFailed"),
      );
    } finally {
      setLoading(false);
    }
  }, [page, search, brandId, categoryId, isActive, t]);

  useEffect(() => {
    void load();
  }, [load]);

  function applyFilters() {
    setPage(1);
    setSearch(searchInput);
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await apiFetch<void>(`/products/${deleting.id}`, { method: "DELETE" });
      toast({ title: t("products.toastArchived"), tone: "success" });
      setDeleting(null);
      if (items.length === 1 && page > 1) setPage((p) => p - 1);
      else await load();
    } catch (cause) {
      toast({
        title: tCommon("deleteFailed"),
        description:
          cause instanceof ApiError
            ? cause.message
            : tCommon("genericError"),
        tone: "danger",
      });
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1 text-sm sm:col-span-2 lg:col-span-1">
            <span className="font-medium" id="products-search-label">
              {tCommon("search")}
            </span>
            <div className="flex gap-2">
              <Input
                aria-labelledby="products-search-label"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t("products.searchPlaceholder")}
                onKeyDown={(e) => e.key === "Enter" && applyFilters()}
              />
              <Button type="button" variant="secondary" onClick={applyFilters}>
                {tCommon("filter")}
              </Button>
            </div>
          </div>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">{t("products.brand")}</span>
            <Select
              value={brandId}
              onChange={(e) => {
                setPage(1);
                setBrandId(e.target.value);
              }}
            >
              <option value="">{tCommon("allF")}</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">{t("products.category")}</span>
            <Select
              value={categoryId}
              onChange={(e) => {
                setPage(1);
                setCategoryId(e.target.value);
              }}
            >
              <option value="">{tCommon("allF")}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code}
                </option>
              ))}
            </Select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">{tCommon("status")}</span>
            <Select
              value={isActive}
              onChange={(e) => {
                setPage(1);
                setIsActive(e.target.value);
              }}
            >
              <option value="">{tCommon("all")}</option>
              <option value="true">{tCommon("activesM")}</option>
              <option value="false">{tCommon("inactivesM")}</option>
            </Select>
          </label>
        </div>
        <Can permission="catalog.write">
          <Button
            type="button"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            {t("products.new")}
          </Button>
        </Can>
      </div>

      {error ? (
        <Alert tone="danger" title={tCommon("error")}>
          {error}
        </Alert>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner label={t("products.loading")} />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title={t("products.emptyTitle")}
          description={t("products.emptyDescription")}
          action={
            canWrite ? (
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                {t("products.new")}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <Table>
            <Thead>
              <Tr>
                <Th>{t("products.sku")}</Th>
                <Th>{tCommon("name")}</Th>
                <Th>{t("products.brand")}</Th>
                <Th>{t("products.category")}</Th>
                <Th>{t("products.unit")}</Th>
                <Th>{tCommon("status")}</Th>
                <Th className="text-right">{tCommon("actions")}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {items.map((row) => (
                <Tr key={row.id}>
                  <Td className="font-mono text-xs">{row.sku}</Td>
                  <Td>{row.name}</Td>
                  <Td className="text-muted">
                    {row.brandId
                      ? (brandNameById.get(row.brandId) ?? tCommon("emDash"))
                      : tCommon("emDash")}
                  </Td>
                  <Td className="text-xs text-muted">
                    {row.categoryId
                      ? (categoryLabelById.get(row.categoryId) ??
                        tCommon("emDash"))
                      : tCommon("emDash")}
                  </Td>
                  <Td className="font-mono text-xs">
                    {row.unitId
                      ? (unitLabelById.get(row.unitId) ?? tCommon("emDash"))
                      : tCommon("emDash")}
                  </Td>
                  <Td>
                    <Badge tone={row.isActive ? "success" : "neutral"}>
                      {row.isActive
                        ? tCommon("activeM")
                        : tCommon("inactiveM")}
                    </Badge>
                  </Td>
                  <Td>
                    <div className="flex justify-end gap-2">
                      <Can permission="catalog.write">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setEditing(row);
                            setFormOpen(true);
                          }}
                        >
                          {tCommon("edit")}
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => setDeleting(row)}
                        >
                          {tCommon("archive")}
                        </Button>
                      </Can>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            onPageChange={setPage}
          />
        </>
      )}

      <ProductFormModal
        open={formOpen}
        product={editing}
        brands={brands}
        categories={categories}
        units={units}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          toast({
            title: editing
              ? t("products.toastUpdated")
              : t("products.toastCreated"),
            tone: "success",
          });
          void load();
        }}
      />

      <Modal
        open={deleting !== null}
        onClose={() => {
          if (!deleteLoading) setDeleting(null);
        }}
        title={t("products.archiveTitle")}
        footer={
          <>
            <Button
              variant="secondary"
              type="button"
              onClick={() => setDeleting(null)}
              disabled={deleteLoading}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              variant="danger"
              type="button"
              onClick={() => void confirmDelete()}
              disabled={deleteLoading}
            >
              {deleteLoading ? tCommon("archiving") : tCommon("confirm")}
            </Button>
          </>
        }
      >
        <p className="text-muted">
          {t("products.archiveBody", { sku: deleting?.sku ?? "" })}
        </p>
      </Modal>
    </div>
  );
}
