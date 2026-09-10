"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
          : "Impossible de charger les produits",
      );
    } finally {
      setLoading(false);
    }
  }, [page, search, brandId, categoryId, isActive]);

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
      toast({ title: "Produit archivé", tone: "success" });
      setDeleting(null);
      if (items.length === 1 && page > 1) setPage((p) => p - 1);
      else await load();
    } catch (cause) {
      toast({
        title: "Suppression impossible",
        description:
          cause instanceof ApiError ? cause.message : "Une erreur est survenue",
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
              Recherche
            </span>
            <div className="flex gap-2">
              <Input
                aria-labelledby="products-search-label"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="SKU ou nom…"
                onKeyDown={(e) => e.key === "Enter" && applyFilters()}
              />
              <Button type="button" variant="secondary" onClick={applyFilters}>
                Filtrer
              </Button>
            </div>
          </div>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Marque</span>
            <Select
              value={brandId}
              onChange={(e) => {
                setPage(1);
                setBrandId(e.target.value);
              }}
            >
              <option value="">Toutes</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Catégorie</span>
            <Select
              value={categoryId}
              onChange={(e) => {
                setPage(1);
                setCategoryId(e.target.value);
              }}
            >
              <option value="">Toutes</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code}
                </option>
              ))}
            </Select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Statut</span>
            <Select
              value={isActive}
              onChange={(e) => {
                setPage(1);
                setIsActive(e.target.value);
              }}
            >
              <option value="">Tous</option>
              <option value="true">Actifs</option>
              <option value="false">Inactifs</option>
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
            Nouveau produit
          </Button>
        </Can>
      </div>

      {error ? (
        <Alert tone="danger" title="Erreur">
          {error}
        </Alert>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner label="Chargement des produits…" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="Aucun produit"
          description="Créez un produit ou ajustez les filtres."
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
                Nouveau produit
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <Table>
            <Thead>
              <Tr>
                <Th>SKU</Th>
                <Th>Nom</Th>
                <Th>Marque</Th>
                <Th>Catégorie</Th>
                <Th>Unité</Th>
                <Th>Statut</Th>
                <Th className="text-right">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {items.map((row) => (
                <Tr key={row.id}>
                  <Td className="font-mono text-xs">{row.sku}</Td>
                  <Td>{row.name}</Td>
                  <Td className="text-muted">
                    {row.brandId
                      ? (brandNameById.get(row.brandId) ?? "—")
                      : "—"}
                  </Td>
                  <Td className="text-xs text-muted">
                    {row.categoryId
                      ? (categoryLabelById.get(row.categoryId) ?? "—")
                      : "—"}
                  </Td>
                  <Td className="font-mono text-xs">
                    {row.unitId ? (unitLabelById.get(row.unitId) ?? "—") : "—"}
                  </Td>
                  <Td>
                    <Badge tone={row.isActive ? "success" : "neutral"}>
                      {row.isActive ? "Actif" : "Inactif"}
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
                          Modifier
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => setDeleting(row)}
                        >
                          Archiver
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
            title: editing ? "Produit mis à jour" : "Produit créé",
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
        title="Archiver le produit"
        footer={
          <>
            <Button
              variant="secondary"
              type="button"
              onClick={() => setDeleting(null)}
              disabled={deleteLoading}
            >
              Annuler
            </Button>
            <Button
              variant="danger"
              type="button"
              onClick={() => void confirmDelete()}
              disabled={deleteLoading}
            >
              {deleteLoading ? "Archivage…" : "Confirmer"}
            </Button>
          </>
        }
      >
        <p className="text-muted">
          Archiver le produit{" "}
          <span className="font-mono font-medium text-foreground">
            {deleting?.sku}
          </span>{" "}
          ? L’élément ne sera plus visible dans les listes actives.
        </p>
      </Modal>
    </div>
  );
}
